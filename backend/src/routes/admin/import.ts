import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../db/pool';

const router = Router();

interface ImportProgram {
  slug: string;
  name_en: string;
  name_es: string;
  short_description_en?: string;
  short_description_es?: string;
  full_description_en?: string;
  full_description_es?: string;
  how_to_apply_en?: string;
  how_to_apply_es?: string;
  income_benchmark_code?: string;
  income_note_en?: string;
  income_note_es?: string;
  requires_legal_status?: boolean | null;
  geography_codes?: string[];
  age_group_codes?: string[];
  housing_type_codes?: string[];
  need_type_codes?: string[];
  help_type_codes?: string[];
  administrator_codes?: Array<{ code: string; is_primary: boolean }>;
  seasonal_windows?: Array<{
    year: number;
    open_date: string;
    close_date: string;
    notes_en?: string;
    notes_es?: string;
  }>;
}

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const programs: ImportProgram[] = req.body;
    if (!Array.isArray(programs)) {
      res.status(400).json({ error: 'Expected array of programs' });
      return;
    }

    await client.query('BEGIN');

    // Load lookup tables for code → id mapping
    const [geos, ages, housing, needs, helps, admins, benchmarks] = await Promise.all([
      client.query(`SELECT id, code FROM geographies`),
      client.query(`SELECT id, code FROM age_groups`),
      client.query(`SELECT id, code FROM housing_types`),
      client.query(`SELECT id, code FROM need_types`),
      client.query(`SELECT id, code FROM help_types`),
      client.query(`SELECT id, code FROM administrators`),
      client.query(`SELECT id, code FROM income_benchmarks`),
    ]);

    function buildCodeMap(rows: { id: number; code: string }[]): Map<string, number> {
      return new Map(rows.map(r => [r.code, r.id]));
    }

    const geoMap = buildCodeMap(geos.rows);
    const ageMap = buildCodeMap(ages.rows);
    const housingMap = buildCodeMap(housing.rows);
    const needMap = buildCodeMap(needs.rows);
    const helpMap = buildCodeMap(helps.rows);
    const adminMap = buildCodeMap(admins.rows);
    const benchmarkMap = buildCodeMap(benchmarks.rows);

    const results: { slug: string; id: number; status: string }[] = [];

    for (const p of programs) {
      const benchmarkId = p.income_benchmark_code
        ? benchmarkMap.get(p.income_benchmark_code) ?? null
        : null;

      const res2 = await client.query(`
        INSERT INTO programs (
          slug, name_en, name_es,
          short_description_en, short_description_es,
          full_description_en, full_description_es,
          how_to_apply_en, how_to_apply_es,
          income_benchmark_id, income_note_en, income_note_es,
          requires_legal_status, is_active
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,TRUE)
        ON CONFLICT (slug) DO UPDATE SET
          name_en=EXCLUDED.name_en, name_es=EXCLUDED.name_es,
          short_description_en=EXCLUDED.short_description_en,
          short_description_es=EXCLUDED.short_description_es,
          full_description_en=EXCLUDED.full_description_en,
          full_description_es=EXCLUDED.full_description_es,
          how_to_apply_en=EXCLUDED.how_to_apply_en,
          how_to_apply_es=EXCLUDED.how_to_apply_es,
          income_benchmark_id=EXCLUDED.income_benchmark_id,
          income_note_en=EXCLUDED.income_note_en,
          income_note_es=EXCLUDED.income_note_es,
          requires_legal_status=EXCLUDED.requires_legal_status,
          updated_at=NOW()
        RETURNING id
      `, [
        p.slug, p.name_en, p.name_es,
        p.short_description_en ?? null, p.short_description_es ?? null,
        p.full_description_en ?? null, p.full_description_es ?? null,
        p.how_to_apply_en ?? null, p.how_to_apply_es ?? null,
        benchmarkId, p.income_note_en ?? null, p.income_note_es ?? null,
        p.requires_legal_status ?? null,
      ]);

      const programId: number = res2.rows[0].id;

      // Clear junctions and re-insert
      await Promise.all([
        client.query(`DELETE FROM program_geographies WHERE program_id=$1`, [programId]),
        client.query(`DELETE FROM program_age_groups WHERE program_id=$1`, [programId]),
        client.query(`DELETE FROM program_housing_types WHERE program_id=$1`, [programId]),
        client.query(`DELETE FROM program_need_types WHERE program_id=$1`, [programId]),
        client.query(`DELETE FROM program_help_types WHERE program_id=$1`, [programId]),
        client.query(`DELETE FROM program_administrators WHERE program_id=$1`, [programId]),
        client.query(`DELETE FROM seasonal_windows WHERE program_id=$1`, [programId]),
      ]);

      for (const code of p.geography_codes ?? []) {
        const id = geoMap.get(code);
        if (id) await client.query(`INSERT INTO program_geographies VALUES ($1,$2)`, [programId, id]);
      }
      for (const code of p.age_group_codes ?? []) {
        const id = ageMap.get(code);
        if (id) await client.query(`INSERT INTO program_age_groups VALUES ($1,$2)`, [programId, id]);
      }
      for (const code of p.housing_type_codes ?? []) {
        const id = housingMap.get(code);
        if (id) await client.query(`INSERT INTO program_housing_types VALUES ($1,$2)`, [programId, id]);
      }
      for (const code of p.need_type_codes ?? []) {
        const id = needMap.get(code);
        if (id) await client.query(`INSERT INTO program_need_types VALUES ($1,$2)`, [programId, id]);
      }
      for (const code of p.help_type_codes ?? []) {
        const id = helpMap.get(code);
        if (id) await client.query(`INSERT INTO program_help_types VALUES ($1,$2)`, [programId, id]);
      }
      for (const a of p.administrator_codes ?? []) {
        const id = adminMap.get(a.code);
        if (id) await client.query(
          `INSERT INTO program_administrators (program_id, administrator_id, is_primary) VALUES ($1,$2,$3)`,
          [programId, id, a.is_primary]
        );
      }
      for (const w of p.seasonal_windows ?? []) {
        await client.query(
          `INSERT INTO seasonal_windows (program_id, year, open_date, close_date, notes_en, notes_es) VALUES ($1,$2,$3,$4,$5,$6)`,
          [programId, w.year, w.open_date, w.close_date, w.notes_en ?? null, w.notes_es ?? null]
        );
      }

      results.push({ slug: p.slug, id: programId, status: 'ok' });
    }

    await client.query('COMMIT');
    res.json({ imported: results.length, results });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

export default router;
