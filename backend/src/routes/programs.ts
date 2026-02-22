import { Router, Request, Response, NextFunction } from 'express';
import { getAllProgramsV2 } from '../services/programService';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lang = req.headers['accept-language'] ?? 'en';
    const caseworkerView = req.query.view === 'caseworker';
    const programs = await getAllProgramsV2(lang, caseworkerView);
    res.json(programs);
  } catch (err) {
    next(err);
  }
});

export default router;
