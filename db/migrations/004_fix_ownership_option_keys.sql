-- ============================================================
-- 004_fix_ownership_option_keys.sql
-- The renter/owner options still have i18n_key = 'options.housing_type.*'
-- from the original seed. Update them to match the renamed question.
-- ============================================================

UPDATE decision_tree_options
SET i18n_key = 'options.ownership_type.' || code
WHERE question_id = (SELECT id FROM decision_tree_questions WHERE code = 'ownership_type')
  AND code IN ('renter', 'owner');
