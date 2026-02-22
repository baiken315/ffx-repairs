import { Router, Request, Response, NextFunction } from 'express';
import { pool, query } from '../../db/pool';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const benchmarks = await query(`SELECT id, code, label_en, label_es FROM income_benchmarks ORDER BY code`);
    const thresholds = await query(`
      SELECT benchmark_id, household_size, monthly_limit::float, annual_limit::float, effective_year
      FROM income_thresholds
      ORDER BY benchmark_id, household_size, effective_year
    `);
    res.json({ benchmarks, thresholds });
  } catch (err) {
    next(err);
  }
});

router.put('/:benchmark_id', async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const benchmarkId = parseInt(req.params.benchmark_id, 10);
    const rows: Array<{
      household_size: number;
      monthly_limit: number | null;
      annual_limit: number | null;
      effective_year: number;
    }> = req.body;

    await client.query('BEGIN');
    for (const row of rows) {
      await client.query(`
        INSERT INTO income_thresholds (benchmark_id, household_size, monthly_limit, annual_limit, effective_year)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (benchmark_id, household_size, effective_year)
        DO UPDATE SET monthly_limit=EXCLUDED.monthly_limit, annual_limit=EXCLUDED.annual_limit
      `, [benchmarkId, row.household_size, row.monthly_limit, row.annual_limit, row.effective_year]);
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

export default router;
