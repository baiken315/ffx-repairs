import { Router } from 'express';
import { requireAdminAuth } from '../../middleware/auth';
import programsAdminRouter from './programs';
import incomeRouter from './incomeThresholds';
import importRouter from './import';
import translateRouter from './translate';
import { query } from '../../db/pool';

const router = Router();

router.use(requireAdminAuth);

router.use('/programs', programsAdminRouter);
router.use('/income-thresholds', incomeRouter);

router.post('/income-benchmarks', async (req, res, next) => {
  try {
    const { code, label_en, label_es } = req.body as { code: string; label_en: string; label_es: string };
    if (!code || !label_en) return res.status(400).json({ error: 'code and label_en are required' });
    const result = await query(
      `INSERT INTO income_benchmarks (code, label_en, label_es)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO NOTHING
       RETURNING id, code, label_en, label_es`,
      [code, label_en, label_es]
    );
    if (!result.length) return res.status(409).json({ error: `A benchmark with code "${code}" already exists.` });
    res.status(201).json({ benchmark: result[0] });
  } catch (err) {
    next(err);
  }
});
router.use('/import', importRouter);
router.use('/translate', translateRouter);

router.get('/administrators', async (_req, res, next) => {
  try {
    const admins = await query(`SELECT id, code, name, website, phone, email FROM administrators ORDER BY name`);
    res.json(admins);
  } catch (err) {
    next(err);
  }
});

router.put('/administrators/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { phone, email, website } = req.body as { phone?: string | null; email?: string | null; website?: string | null };
    const result = await query(
      `UPDATE administrators SET phone=$1, email=$2, website=$3 WHERE id=$4
       RETURNING id, code, name, phone, email, website`,
      [phone ?? null, email ?? null, website ?? null, id]
    );
    if (!result.length) return res.status(404).json({ error: 'Administrator not found' });
    res.json(result[0]);
  } catch (err) {
    next(err);
  }
});

router.get('/lookups', async (_req, res, next) => {
  try {
    const [geos, ages, housing, needs, helpCats, helps, benchmarks, admins] = await Promise.all([
      query(`SELECT id, code, label_en, label_es FROM geographies ORDER BY label_en`),
      query(`SELECT id, code, label_en, label_es FROM age_groups ORDER BY sort_order`),
      query(`SELECT id, code, label_en, label_es FROM housing_types ORDER BY sort_order`),
      query(`SELECT id, code, label_en, label_es FROM need_types ORDER BY label_en`),
      query(`SELECT id, code, label_en, label_es FROM help_categories ORDER BY label_en`),
      query(`SELECT id, code, label_en, label_es, category_id FROM help_types ORDER BY sort_order`),
      query(`SELECT id, code, label_en, label_es FROM income_benchmarks ORDER BY code`),
      query(`SELECT id, code, name, phone, website FROM administrators ORDER BY name`),
    ]);
    res.json({ geographies: geos, age_groups: ages, housing_types: housing, need_types: needs, help_categories: helpCats, help_types: helps, income_benchmarks: benchmarks, administrators: admins });
  } catch (err) {
    next(err);
  }
});

export default router;
