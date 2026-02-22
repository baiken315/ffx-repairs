import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { DecisionTreeQuestion } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const questions = await query<{
      id: number;
      code: string;
      question_type: string;
      is_skippable: boolean;
      sort_order: number;
      i18n_key: string;
      filter_field: string | null;
    }>(`
      SELECT id, code, question_type, is_skippable, sort_order, i18n_key, filter_field
      FROM decision_tree_questions
      ORDER BY sort_order
    `);

    const options = await query<{
      question_id: number;
      id: number;
      code: string;
      i18n_key: string;
      sort_order: number;
      lookup_id: number | null;
    }>(`
      SELECT id, question_id, code, i18n_key, sort_order, lookup_id
      FROM decision_tree_options
      ORDER BY question_id, sort_order
    `);

    const optionsByQuestion = new Map<number, typeof options[0][]>();
    for (const opt of options) {
      const arr = optionsByQuestion.get(opt.question_id) ?? [];
      arr.push(opt);
      optionsByQuestion.set(opt.question_id, arr);
    }

    const result: DecisionTreeQuestion[] = questions.map(q => ({
      id: q.id,
      code: q.code,
      question_type: q.question_type as DecisionTreeQuestion['question_type'],
      is_skippable: q.is_skippable,
      sort_order: q.sort_order,
      i18n_key: q.i18n_key,
      filter_field: q.filter_field,
      options: (optionsByQuestion.get(q.id) ?? []).map(o => ({
        id: o.id,
        code: o.code,
        i18n_key: o.i18n_key,
        sort_order: o.sort_order,
        lookup_id: o.lookup_id,
      })),
    }));

    res.json({ version: new Date().toISOString().slice(0, 7), questions: result });
  } catch (err) {
    next(err);
  }
});

export default router;
