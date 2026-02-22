import { Router, Request, Response, NextFunction } from 'express';
import { getAllProgramsV2 } from '../services/programService';
import { EligibilityCheckRequest, ProgramResponse } from '../types';

const router = Router();

router.post('/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lang = req.headers['accept-language'] ?? 'en';
    const answers: EligibilityCheckRequest = req.body;
    const allPrograms = await getAllProgramsV2(lang, false);
    const today = new Date();

    const matched = allPrograms.filter(p => filterProgram(p, answers, today));
    res.json(matched);
  } catch (err) {
    next(err);
  }
});

function filterProgram(
  p: ProgramResponse,
  answers: EligibilityCheckRequest,
  today: Date
): boolean {
  // Geography
  if (answers.geography) {
    if (!p.geographies.some(g => g.code === answers.geography)) return false;
  }

  // Income
  if (
    answers.household_size &&
    (answers.monthly_income !== undefined || answers.annual_income !== undefined) &&
    p.income_benchmark !== null &&
    p.income_thresholds.length > 0
  ) {
    const threshold = p.income_thresholds.find(
      t => t.household_size === answers.household_size
    );
    if (threshold) {
      const userMonthly =
        answers.monthly_income ?? (answers.annual_income! / 12);
      if (threshold.monthly_limit !== null && userMonthly > threshold.monthly_limit) {
        return false;
      }
    }
  }

  // Age group
  if (answers.age_group) {
    if (!p.age_groups.some(ag => ag.code === answers.age_group)) return false;
  }

  // Legal status (null = skipped = show all)
  if (answers.legal_status !== null && answers.legal_status !== undefined) {
    if (
      answers.legal_status === 'without_status' &&
      p.requires_legal_status === true
    ) {
      return false;
    }
  }

  // Housing (ownership_type + home_type both map to the housing_types junction)
  const selectedHousingCodes: string[] = [];
  if (answers.ownership_type) selectedHousingCodes.push(answers.ownership_type);
  if (answers.home_type) selectedHousingCodes.push(answers.home_type);
  if (selectedHousingCodes.length > 0) {
    const overlap = p.housing_types.some(ht => selectedHousingCodes.includes(ht.code));
    if (!overlap) return false;
  }

  // Need type (at least one overlap)
  if (answers.need_types && answers.need_types.length > 0) {
    const overlap = p.need_types.some(nt => answers.need_types!.includes(nt.code));
    if (!overlap) return false;
  }

  // Seasonal: open today (or no windows = always open)
  if (p.seasonal_windows.length > 0) {
    const isOpen = p.seasonal_windows.some(w => {
      const open = new Date(w.open_date);
      const close = new Date(w.close_date);
      return today >= open && today <= close;
    });
    if (!isOpen) return false;
  }

  return true;
}

export default router;
