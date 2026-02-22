import { Router, Request, Response, NextFunction } from 'express';
import { pool, query } from '../../db/pool';

const router = Router();

// GET /api/v1/admin/programs — list all (including inactive)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lang = req.query.lang === 'es' ? 'es' : 'en';
    const programs = await query(`
      SELECT p.id, p.slug, p.name_${lang} AS name, p.is_active,
             p.updated_at,
             COUNT(DISTINCT pg2.geography_id) AS geo_count
      FROM programs p
      LEFT JOIN program_geographies pg2 ON pg2.program_id = p.id
      GROUP BY p.id
      ORDER BY p.name_${lang}
    `);
    res.json(programs);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/programs/:id — single program with all relations
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const program = await query(
      `SELECT * FROM programs WHERE id = $1`,
      [id]
    );
    if (!program[0]) {
      res.status(404).json({ error: 'Program not found' });
      return;
    }

    const [geos, ages, housing, needs, helps, admins, seasonal] = await Promise.all([
      query(`SELECT geography_id FROM program_geographies WHERE program_id = $1`, [id]),
      query(`SELECT age_group_id FROM program_age_groups WHERE program_id = $1`, [id]),
      query(`SELECT housing_type_id FROM program_housing_types WHERE program_id = $1`, [id]),
      query(`SELECT need_type_id FROM program_need_types WHERE program_id = $1`, [id]),
      query(`SELECT help_type_id FROM program_help_types WHERE program_id = $1`, [id]),
      query(`SELECT administrator_id, is_primary FROM program_administrators WHERE program_id = $1`, [id]),
      query(`SELECT id, year, TO_CHAR(open_date,'YYYY-MM-DD') AS open_date, TO_CHAR(close_date,'YYYY-MM-DD') AS close_date, notes_en, notes_es FROM seasonal_windows WHERE program_id = $1 ORDER BY open_date`, [id]),
    ]);

    res.json({
      ...program[0],
      geography_ids: geos.map(r => r.geography_id),
      age_group_ids: ages.map(r => r.age_group_id),
      housing_type_ids: housing.map(r => r.housing_type_id),
      need_type_ids: needs.map(r => r.need_type_id),
      help_type_ids: helps.map(r => r.help_type_id),
      administrator_ids: admins.map(r => ({ id: r.administrator_id, is_primary: r.is_primary })),
      seasonal_windows: seasonal,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/programs — create
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const b = req.body;
    await client.query('BEGIN');

    const result = await client.query(`
      INSERT INTO programs (
        slug, name_en, name_es,
        short_description_en, short_description_es,
        full_description_en, full_description_es,
        how_to_apply_en, how_to_apply_es,
        income_benchmark_id, income_note_en, income_note_es,
        requires_legal_status, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING id
    `, [
      b.slug, b.name_en, b.name_es,
      b.short_description_en ?? null, b.short_description_es ?? null,
      b.full_description_en ?? null, b.full_description_es ?? null,
      b.how_to_apply_en ?? null, b.how_to_apply_es ?? null,
      b.income_benchmark_id ?? null, b.income_note_en ?? null, b.income_note_es ?? null,
      b.requires_legal_status ?? null, b.is_active ?? true,
    ]);

    const programId = result.rows[0].id;
    await upsertJunctions(client, programId, b);
    await client.query('COMMIT');
    res.status(201).json({ id: programId });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// PUT /api/v1/admin/programs/:id — full update
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    const b = req.body;
    await client.query('BEGIN');

    await client.query(`
      UPDATE programs SET
        slug=$1, name_en=$2, name_es=$3,
        short_description_en=$4, short_description_es=$5,
        full_description_en=$6, full_description_es=$7,
        how_to_apply_en=$8, how_to_apply_es=$9,
        income_benchmark_id=$10, income_note_en=$11, income_note_es=$12,
        requires_legal_status=$13, is_active=$14
      WHERE id=$15
    `, [
      b.slug, b.name_en, b.name_es,
      b.short_description_en ?? null, b.short_description_es ?? null,
      b.full_description_en ?? null, b.full_description_es ?? null,
      b.how_to_apply_en ?? null, b.how_to_apply_es ?? null,
      b.income_benchmark_id ?? null, b.income_note_en ?? null, b.income_note_es ?? null,
      b.requires_legal_status ?? null, b.is_active ?? true,
      id,
    ]);

    await upsertJunctions(client, id, b);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// PATCH /api/v1/admin/programs/:id/active — toggle active
router.patch('/:id/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { is_active } = req.body;
    await query('UPDATE programs SET is_active=$1 WHERE id=$2', [is_active, id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/programs/:id — soft delete
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('UPDATE programs SET is_active=FALSE WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET/PUT seasonal windows
router.get('/:id/seasonal', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const windows = await query(
      `SELECT id, year, TO_CHAR(open_date,'YYYY-MM-DD') AS open_date, TO_CHAR(close_date,'YYYY-MM-DD') AS close_date, notes_en, notes_es
       FROM seasonal_windows WHERE program_id=$1 ORDER BY open_date`,
      [id]
    );
    res.json(windows);
  } catch (err) {
    next(err);
  }
});

router.put('/:id/seasonal', async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    const windows: Array<{ year: number; open_date: string; close_date: string; notes_en?: string; notes_es?: string }> = req.body;
    await client.query('BEGIN');
    await client.query('DELETE FROM seasonal_windows WHERE program_id=$1', [id]);
    for (const w of windows) {
      await client.query(
        `INSERT INTO seasonal_windows (program_id, year, open_date, close_date, notes_en, notes_es)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, w.year, w.open_date, w.close_date, w.notes_en ?? null, w.notes_es ?? null]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

async function upsertJunctions(client: { query: Function }, programId: number, b: Record<string, unknown>) {
  const tables = [
    { table: 'program_geographies', col: 'geography_id', key: 'geography_ids' },
    { table: 'program_age_groups', col: 'age_group_id', key: 'age_group_ids' },
    { table: 'program_housing_types', col: 'housing_type_id', key: 'housing_type_ids' },
    { table: 'program_need_types', col: 'need_type_id', key: 'need_type_ids' },
    { table: 'program_help_types', col: 'help_type_id', key: 'help_type_ids' },
  ];

  for (const { table, col, key } of tables) {
    await client.query(`DELETE FROM ${table} WHERE program_id=$1`, [programId]);
    const ids: number[] = (b[key] as number[]) ?? [];
    for (const id of ids) {
      await client.query(
        `INSERT INTO ${table} (program_id, ${col}) VALUES ($1,$2)`,
        [programId, id]
      );
    }
  }

  // Administrators (with is_primary flag)
  await client.query(`DELETE FROM program_administrators WHERE program_id=$1`, [programId]);
  const adminIds: Array<{ id: number; is_primary: boolean }> = (b['administrator_ids'] as Array<{ id: number; is_primary: boolean }>) ?? [];
  for (const a of adminIds) {
    await client.query(
      `INSERT INTO program_administrators (program_id, administrator_id, is_primary) VALUES ($1,$2,$3)`,
      [programId, a.id, a.is_primary]
    );
  }
}

export default router;
