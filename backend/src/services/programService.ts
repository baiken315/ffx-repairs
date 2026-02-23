import { pool } from '../db/pool';
import { ProgramResponse } from '../types';

function getLangSuffix(lang: string): string {
  return lang.startsWith('es') ? 'es' : 'en';
}

export async function getAllProgramsV2(
  lang: string,
  caseworkerView = false
): Promise<ProgramResponse[]> {
  const l = getLangSuffix(lang);
  const client = await pool.connect();

  try {
    const fullDescCol = caseworkerView
      ? `p.full_description_${l}`
      : `CAST(NULL AS TEXT)`;

    const programsRes = await client.query(`
      SELECT
        p.id,
        p.slug,
        p.name_${l}               AS name,
        p.short_description_${l}  AS short_description,
        ${fullDescCol}            AS full_description,
        p.how_to_apply_${l}       AS how_to_apply,
        p.income_note_${l}        AS income_note,
        p.requires_legal_status,
        p.is_active,
        p.income_benchmark_id,
        ib.code                   AS benchmark_code,
        ib.label_${l}             AS benchmark_label
      FROM programs p
      LEFT JOIN income_benchmarks ib ON ib.id = p.income_benchmark_id
      WHERE p.is_active = TRUE
      ORDER BY p.name_${l}
    `);

    if (programsRes.rows.length === 0) return [];

    const programIds: number[] = programsRes.rows.map((r: { id: number }) => r.id);
    const benchmarkIds: number[] = [
      ...new Set(
        programsRes.rows
          .filter((r: { income_benchmark_id: number | null }) => r.income_benchmark_id !== null)
          .map((r: { income_benchmark_id: number }) => r.income_benchmark_id)
      )
    ];

    const [
      geosRes,
      ageGroupsRes,
      housingRes,
      needsRes,
      helpsRes,
      adminsRes,
      thresholdsRes,
      seasonalRes,
    ] = await Promise.all([
      client.query(
        `SELECT pg2.program_id, g.code, g.label_${l} AS label
         FROM program_geographies pg2
         JOIN geographies g ON g.id = pg2.geography_id
         WHERE pg2.program_id = ANY($1)`,
        [programIds]
      ),
      client.query(
        `SELECT pag.program_id, ag.code, ag.label_${l} AS label
         FROM program_age_groups pag
         JOIN age_groups ag ON ag.id = pag.age_group_id
         WHERE pag.program_id = ANY($1)
         ORDER BY ag.sort_order`,
        [programIds]
      ),
      client.query(
        `SELECT pht.program_id, ht.code, ht.label_${l} AS label
         FROM program_housing_types pht
         JOIN housing_types ht ON ht.id = pht.housing_type_id
         WHERE pht.program_id = ANY($1)
         ORDER BY ht.sort_order`,
        [programIds]
      ),
      client.query(
        `SELECT pnt.program_id, nt.code, nt.label_${l} AS label
         FROM program_need_types pnt
         JOIN need_types nt ON nt.id = pnt.need_type_id
         WHERE pnt.program_id = ANY($1)`,
        [programIds]
      ),
      client.query(
        `SELECT ph.program_id, ht.code, ht.label_${l} AS label, hc.code AS category
         FROM program_help_types ph
         JOIN help_types ht ON ht.id = ph.help_type_id
         JOIN help_categories hc ON hc.id = ht.category_id
         WHERE ph.program_id = ANY($1)
         ORDER BY hc.id, ht.sort_order`,
        [programIds]
      ),
      client.query(
        `SELECT pa.program_id, a.code, a.name, a.website, a.phone, a.email,
                a.notes_${l} AS notes, pa.is_primary
         FROM program_administrators pa
         JOIN administrators a ON a.id = pa.administrator_id
         WHERE pa.program_id = ANY($1)
         ORDER BY pa.is_primary DESC, a.name`,
        [programIds]
      ),
      benchmarkIds.length > 0
        ? client.query(
            `SELECT it.benchmark_id, it.household_size,
                    it.monthly_limit::float AS monthly_limit,
                    it.annual_limit::float  AS annual_limit
             FROM income_thresholds it
             JOIN (
               SELECT benchmark_id, MAX(effective_year) AS max_year
               FROM income_thresholds
               WHERE benchmark_id = ANY($1)
               GROUP BY benchmark_id
             ) latest ON it.benchmark_id = latest.benchmark_id
                     AND it.effective_year = latest.max_year
             ORDER BY it.benchmark_id, it.household_size`,
            [benchmarkIds]
          )
        : Promise.resolve({ rows: [] as Array<{ benchmark_id: number; household_size: number; monthly_limit: number | null; annual_limit: number | null }> }),
      client.query(
        `SELECT sw.program_id,
                TO_CHAR(sw.open_date,  'YYYY-MM-DD') AS open_date,
                TO_CHAR(sw.close_date, 'YYYY-MM-DD') AS close_date,
                sw.notes_${l} AS notes
         FROM seasonal_windows sw
         WHERE sw.program_id = ANY($1)
         ORDER BY sw.open_date`,
        [programIds]
      ),
    ]);

    type RelRow = { program_id: number; [key: string]: unknown };

    function groupBy(rows: RelRow[]): Map<number, RelRow[]> {
      const map = new Map<number, RelRow[]>();
      for (const row of rows) {
        const arr = map.get(row.program_id) ?? [];
        arr.push(row);
        map.set(row.program_id, arr);
      }
      return map;
    }

    const geoMap     = groupBy(geosRes.rows);
    const ageMap     = groupBy(ageGroupsRes.rows);
    const housingMap = groupBy(housingRes.rows);
    const needMap    = groupBy(needsRes.rows);
    const helpMap    = groupBy(helpsRes.rows);
    const adminMap   = groupBy(adminsRes.rows);
    const seasonalMap= groupBy(seasonalRes.rows);

    const thresholdMap = new Map<number, Array<{ household_size: number; monthly_limit: number | null; annual_limit: number | null }>>();
    for (const row of thresholdsRes.rows) {
      const bid = Number(row.benchmark_id);
      const arr = thresholdMap.get(bid) ?? [];
      arr.push({
        household_size: Number(row.household_size),
        monthly_limit:  row.monthly_limit !== null ? Number(row.monthly_limit) : null,
        annual_limit:   row.annual_limit  !== null ? Number(row.annual_limit)  : null,
      });
      thresholdMap.set(bid, arr);
    }

    return programsRes.rows.map(p => ({
      id:                    p.id,
      slug:                  p.slug,
      name:                  p.name,
      short_description:     p.short_description ?? null,
      full_description:      p.full_description  ?? null,
      how_to_apply:          p.how_to_apply      ?? null,
      income_benchmark:      p.benchmark_code
        ? { code: p.benchmark_code, label: p.benchmark_label }
        : null,
      income_note:           p.income_note       ?? null,
      requires_legal_status: p.requires_legal_status,
      is_active:             p.is_active,
      geographies:   (geoMap.get(p.id)      ?? []).map(g => ({ id: 0, code: String(g.code),     label: String(g.label) })),
      age_groups:    (ageMap.get(p.id)      ?? []).map(g => ({ id: 0, code: String(g.code),     label: String(g.label) })),
      housing_types: (housingMap.get(p.id)  ?? []).map(g => ({ id: 0, code: String(g.code),     label: String(g.label) })),
      need_types:    (needMap.get(p.id)     ?? []).map(g => ({ id: 0, code: String(g.code),     label: String(g.label) })),
      help_types:    (helpMap.get(p.id)     ?? []).map(g => ({ id: 0, code: String(g.code),     label: String(g.label), category: String(g.category) })),
      administrators:(adminMap.get(p.id)    ?? []).map(a => ({
        id: 0,
        code:       String(a.code),
        name:       String(a.name),
        website:    a.website ? String(a.website) : null,
        phone:      a.phone   ? String(a.phone)   : null,
        email:      a.email   ? String(a.email)   : null,
        notes:      a.notes   ? String(a.notes)   : null,
        is_primary: Boolean(a.is_primary),
      })),
      income_thresholds: p.income_benchmark_id
        ? (thresholdMap.get(Number(p.income_benchmark_id)) ?? [])
        : [],
      seasonal_windows: (seasonalMap.get(p.id) ?? []).map(sw => ({
        open_date:  String(sw.open_date),
        close_date: String(sw.close_date),
        notes:      sw.notes ? String(sw.notes) : null,
      })),
    }));
  } finally {
    client.release();
  }
}
