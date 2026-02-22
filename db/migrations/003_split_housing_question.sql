-- ============================================================
-- 003_split_housing_question.sql
-- Split the single housing_type question into two:
--   1. ownership_type (renter / owner) — sort_order 6
--   2. home_type (building type) — sort_order 7
-- Need_type moves to sort_order 8.
-- ============================================================

-- 1. Bump need_type to sort_order 8 to make room
UPDATE decision_tree_questions SET sort_order = 8 WHERE code = 'need_type';

-- 2. Rename existing housing_type question to ownership_type
UPDATE decision_tree_questions
SET
  code         = 'ownership_type',
  question_type = 'single_choice',
  is_skippable  = FALSE,
  sort_order    = 6,
  i18n_key      = 'questions.ownership_type.prompt',
  filter_field  = 'housing_types'
WHERE code = 'housing_type';

-- 3. Remove the building-type options from the renamed question
--    (keep renter and owner; delete manufactured, single_family, townhome, multi_family, condo)
DELETE FROM decision_tree_options
WHERE question_id = (SELECT id FROM decision_tree_questions WHERE code = 'ownership_type')
  AND code NOT IN ('renter', 'owner');

-- 4. Insert the new home_type question
INSERT INTO decision_tree_questions (code, question_type, is_skippable, sort_order, i18n_key, filter_field)
VALUES ('home_type', 'single_choice', FALSE, 7, 'questions.home_type.prompt', 'housing_types')
ON CONFLICT (code) DO NOTHING;

-- 5. Insert options for home_type
INSERT INTO decision_tree_options (question_id, code, i18n_key, sort_order)
SELECT q.id, v.code, v.i18n_key, v.sort_order
FROM decision_tree_questions q,
(VALUES
    ('manufactured',  'options.home_type.manufactured',  1),
    ('single_family', 'options.home_type.single_family', 2),
    ('townhome',      'options.home_type.townhome',      3),
    ('multi_family',  'options.home_type.multi_family',  4),
    ('condo',         'options.home_type.condo',         5)
) AS v(code, i18n_key, sort_order)
WHERE q.code = 'home_type'
ON CONFLICT (question_id, code) DO NOTHING;
