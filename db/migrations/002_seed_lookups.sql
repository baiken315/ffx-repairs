-- ============================================================
-- 002_seed_lookups.sql
-- Reference / lookup data for all eligibility dimensions
-- ============================================================

-- Geographies
INSERT INTO geographies (code, label_en, label_es) VALUES
    ('fairfax_county',       'Fairfax County (unincorporated)', 'Condado de Fairfax (no incorporado)'),
    ('city_of_fairfax',      'City of Fairfax',                'Ciudad de Fairfax'),
    ('city_of_falls_church', 'City of Falls Church',           'Ciudad de Falls Church'),
    ('herndon',              'Town of Herndon',                'Pueblo de Herndon'),
    ('vienna',               'Town of Vienna',                 'Pueblo de Vienna')
ON CONFLICT (code) DO NOTHING;

-- Age Groups
INSERT INTO age_groups (code, label_en, label_es, sort_order) VALUES
    ('age_0_5',           'Child (ages 0–5)',                          'Niño/a (edades 0–5)',                      1),
    ('age_6_59_nondis',   'Adult, ages 6–59 (non-disabled)',          'Adulto/a, edades 6–59 (sin discapacidad)', 2),
    ('age_60_plus',       'Senior, age 60 or older',                  'Persona mayor, 60 años o más',             3),
    ('federally_disabled','Person with a federal disability',         'Persona con discapacidad federal',         4),
    ('veteran',           'Veteran',                                  'Veterano/a',                               5)
ON CONFLICT (code) DO NOTHING;

-- Legal Statuses
INSERT INTO legal_statuses (code, label_en, label_es) VALUES
    ('with_status',    'U.S. citizen or with legal immigration status', 'Ciudadano/a de EE.UU. o con estatus migratorio legal'),
    ('without_status', 'Without legal immigration status',              'Sin estatus migratorio legal')
ON CONFLICT (code) DO NOTHING;

-- Housing Types
INSERT INTO housing_types (code, label_en, label_es, sort_order) VALUES
    ('renter',         'Renter',                         'Inquilino/a',                1),
    ('owner',          'Homeowner',                      'Propietario/a de vivienda',  2),
    ('manufactured',   'Manufactured / mobile home',     'Casa prefabricada / móvil',  3),
    ('single_family',  'Single-family detached house',   'Casa unifamiliar separada',  4),
    ('townhome',       'Townhome or attached home',      'Casa adosada',               5),
    ('multi_family',   'Apartment / multi-family',       'Apartamento / multifamiliar',6),
    ('condo',          'Condominium',                    'Condominio',                 7)
ON CONFLICT (code) DO NOTHING;

-- Need Types
INSERT INTO need_types (code, label_en, label_es) VALUES
    ('ac_cooling',              'Air conditioning / cooling help',     'Ayuda con aire acondicionado / enfriamiento'),
    ('heating',                 'Heating help',                        'Ayuda con calefacción'),
    ('home_repair_efficiency',  'Home repair / energy efficiency',     'Reparación del hogar / eficiencia energética')
ON CONFLICT (code) DO NOTHING;

-- Help Categories
INSERT INTO help_categories (code, label_en, label_es) VALUES
    ('financial',                'Financial assistance',           'Asistencia financiera'),
    ('hvac_equipment',           'HVAC equipment',                 'Equipos HVAC'),
    ('efficiency_weatherization','Efficiency / weatherization',    'Eficiencia / impermeabilización')
ON CONFLICT (code) DO NOTHING;

-- Help Types
INSERT INTO help_types (category_id, code, label_en, label_es, sort_order)
SELECT c.id, v.code, v.label_en, v.label_es, v.sort_order
FROM help_categories c
JOIN (VALUES
    -- Financial
    ('financial', 'direct_bill_help',       'Direct bill payment help',              'Ayuda directa con el pago de facturas',       1),
    ('financial', 'payment_structure',      'Payment plan / structure change',        'Plan de pago / cambio de estructura',         2),
    ('financial', 'security_deposit',       'Security deposit assistance',            'Asistencia con depósito de seguridad',        3),
    ('financial', 'tax_incentive',          'Tax incentive / rebate',                 'Incentivo fiscal / reembolso',                4),
    ('financial', 'indirect_savings',       'Indirect financial savings',             'Ahorros financieros indirectos',              5),
    -- HVAC Equipment
    ('hvac_equipment', 'drop_off_ac',       'Drop-off small AC unit',                 'Entrega de unidad de AC pequeña',             1),
    ('hvac_equipment', 'install_ac',        'Install small AC unit',                  'Instalación de unidad de AC pequeña',         2),
    ('hvac_equipment', 'minor_tuning',      'Minor HVAC tuning / repair',             'Ajuste / reparación menor de HVAC',           3),
    ('hvac_equipment', 'larger_repairs',    'Larger HVAC repairs',                    'Reparaciones mayores de HVAC',                4),
    ('hvac_equipment', 'full_replacement',  'Full HVAC system replacement',           'Reemplazo completo del sistema HVAC',         5),
    ('hvac_equipment', 'electrical_repairs','Electrical repairs',                     'Reparaciones eléctricas',                     6),
    -- Efficiency / Weatherization
    ('efficiency_weatherization', 'energy_audit',        'Energy audit',             'Auditoría energética',                        1),
    ('efficiency_weatherization', 'efficiency_upgrades', 'Energy efficiency upgrades','Mejoras de eficiencia energética',           2),
    ('efficiency_weatherization', 'efficiency_advice',   'Energy saving advice',     'Asesoramiento para ahorrar energía',          3)
) AS v(cat_code, code, label_en, label_es, sort_order) ON c.code = v.cat_code
ON CONFLICT (code) DO NOTHING;

-- Administrators
INSERT INTO administrators (code, name, website, phone) VALUES
    ('dcc',                'Dept. of Code Compliance (DCC)',                    NULL, '703-324-1300'),
    ('dfs',                'Dept. of Family Services (DFS)',                    'https://www.fairfaxcounty.gov/familyservices/', '703-324-7500'),
    ('dhcd',               'Dept. of Housing & Community Development (DHCD)',  'https://www.fairfaxcounty.gov/housing/', '703-246-5100'),
    ('ncs',                'Neighborhood & Community Services (NCS)',           'https://www.fairfaxcounty.gov/neighborhood/', '703-324-5171'),
    ('oeec',               'Office of Environmental & Energy Coordination (OEEC)', 'https://www.fairfaxcounty.gov/environment-energy-coordination/', '703-324-5171'),
    ('chp_energy',         'CHP / Energy Solutions',                           NULL, NULL),
    ('columbia_gas',       'Columbia Gas of Virginia',                         'https://www.columbiagasva.com/', '800-543-8911'),
    ('dominion',           'Dominion Energy',                                  'https://www.dominionenergy.com/', '866-366-4357'),
    ('fairfax_fish',       'Fairfax FISH',                                     'https://fairfaxfish.org/', '703-273-8829'),
    ('good_shepherd',      'Good Shepherd Alliance',                           'https://goodshepherdalliance.org/', '703-771-1402'),
    ('novec',              'NOVEC',                                             'https://www.novec.com/', '703-335-0500'),
    ('rebuilding_together','Rebuilding Together Northern Virginia',             'https://rebuildingtogethernova.org/', '703-521-9550'),
    ('salvation_army',     'Salvation Army (Northern Virginia)',               'https://easternusa.salvationarmy.org/', '703-660-1400'),
    ('united_community',   'United Community',                                 'https://www.unitedcommunity.org/', '703-941-8810'),
    ('washington_gas',     'Washington Gas',                                   'https://www.washingtongas.com/', '844-927-4427')
ON CONFLICT (code) DO NOTHING;

-- Income Benchmarks
INSERT INTO income_benchmarks (code, label_en, label_es, description_en, description_es) VALUES
    ('80_pct_ami',   '80% of Area Median Income (AMI)',              '80% del Ingreso Medio del Área (AMI)',              'Program income limit is set at 80% of the Area Median Income for the Washington DC metro area.',   'El límite de ingresos del programa está fijado en el 80% del Ingreso Medio del Área del metro de Washington DC.'),
    ('60_pct_smi',   '60% of State Median Income (SMI)',             '60% del Ingreso Medio Estatal (SMI)',               'Program income limit is set at 60% of Virginia''s State Median Income.',                          'El límite de ingresos está fijado en el 60% del Ingreso Medio Estatal de Virginia.'),
    ('80_pct_smi',   '80% of State Median Income (SMI)',             '80% del Ingreso Medio Estatal (SMI)',               'Program income limit is set at 80% of Virginia''s State Median Income.',                          'El límite de ingresos está fijado en el 80% del Ingreso Medio Estatal de Virginia.'),
    ('120_pct_smi',  '120% of State Median Income (SMI)',            '120% del Ingreso Medio Estatal (SMI)',              'Program income limit is set at 120% of Virginia''s State Median Income.',                         'El límite de ingresos está fijado en el 120% del Ingreso Medio Estatal de Virginia.'),
    ('175_pct_fpl',  '175% of Federal Poverty Level (FPL)',          '175% del Nivel Federal de Pobreza (FPL)',           'Program income limit is set at 175% of the Federal Poverty Level.',                              'El límite de ingresos está fijado en el 175% del Nivel Federal de Pobreza.'),
    ('200_pct_fpl',  '200% of Federal Poverty Level (FPL)',          '200% del Nivel Federal de Pobreza (FPL)',           'Program income limit is set at 200% of the Federal Poverty Level.',                              'El límite de ingresos está fijado en el 200% del Nivel Federal de Pobreza.'),
    ('none',         'No income limit',                              'Sin límite de ingresos',                            'This program has no income eligibility requirement.',                                            'Este programa no tiene requisito de ingresos.')
ON CONFLICT (code) DO NOTHING;

-- Income Thresholds (2025 values — approximate; update annually)
-- 80% AMI (Washington DC metro)
INSERT INTO income_thresholds (benchmark_id, household_size, monthly_limit, annual_limit, effective_year)
SELECT b.id, v.hs, v.mo, v.ann, 2025
FROM income_benchmarks b,
(VALUES
    (1, 6233.33, 74800.00),
    (2, 7121.00, 85452.00),
    (3, 8008.33, 96100.00),
    (4, 8900.00, 106800.00),
    (5, 9612.50, 115350.00),
    (6, 10325.00, 123900.00),
    (7, 11037.50, 132450.00),
    (8, 11750.00, 141000.00)
) AS v(hs, mo, ann)
WHERE b.code = '80_pct_ami'
ON CONFLICT (benchmark_id, household_size, effective_year) DO NOTHING;

-- 60% SMI (Virginia 2025)
INSERT INTO income_thresholds (benchmark_id, household_size, monthly_limit, annual_limit, effective_year)
SELECT b.id, v.hs, v.mo, v.ann, 2025
FROM income_benchmarks b,
(VALUES
    (1, 3484.08, 41809.00),
    (2, 4563.42, 54761.00),
    (3, 5390.00, 64680.00),
    (4, 6211.00, 74532.00),
    (5, 6884.75, 82617.00),
    (6, 7550.67, 90608.00),
    (7, 8210.83, 98530.00),
    (8, 9246.33, 110956.00)
) AS v(hs, mo, ann)
WHERE b.code = '60_pct_smi'
ON CONFLICT (benchmark_id, household_size, effective_year) DO NOTHING;

-- 80% SMI (Virginia 2025)
INSERT INTO income_thresholds (benchmark_id, household_size, monthly_limit, annual_limit, effective_year)
SELECT b.id, v.hs, v.mo, v.ann, 2025
FROM income_benchmarks b,
(VALUES
    (1, 4645.42, 55745.00),
    (2, 6084.58, 73015.00),
    (3, 7186.67, 86240.00),
    (4, 8281.33, 99376.00),
    (5, 9179.67, 110156.00),
    (6, 10067.50, 120810.00),
    (7, 10947.67, 131372.00),
    (8, 12328.33, 147940.00)
) AS v(hs, mo, ann)
WHERE b.code = '80_pct_smi'
ON CONFLICT (benchmark_id, household_size, effective_year) DO NOTHING;

-- 120% SMI (Virginia 2025)
INSERT INTO income_thresholds (benchmark_id, household_size, monthly_limit, annual_limit, effective_year)
SELECT b.id, v.hs, v.mo, v.ann, 2025
FROM income_benchmarks b,
(VALUES
    (1,  6968.17,  83618.00),
    (2,  9126.83, 109522.00),
    (3, 10780.00, 129360.00),
    (4, 12422.00, 149064.00),
    (5, 13769.50, 165234.00),
    (6, 15101.00, 181212.00),
    (7, 16421.50, 197058.00),
    (8, 18492.67, 221912.00)
) AS v(hs, mo, ann)
WHERE b.code = '120_pct_smi'
ON CONFLICT (benchmark_id, household_size, effective_year) DO NOTHING;

-- 175% FPL (2025 federal poverty guidelines)
INSERT INTO income_thresholds (benchmark_id, household_size, monthly_limit, annual_limit, effective_year)
SELECT b.id, v.hs, v.mo, v.ann, 2025
FROM income_benchmarks b,
(VALUES
    (1, 2282.50,  27390.00),
    (2, 3083.33,  37000.00),
    (3, 3884.17,  46610.00),
    (4, 4685.00,  56220.00),
    (5, 5485.83,  65830.00),
    (6, 6286.67,  75440.00),
    (7, 7087.50,  85050.00),
    (8, 7888.33,  94660.00)
) AS v(hs, mo, ann)
WHERE b.code = '175_pct_fpl'
ON CONFLICT (benchmark_id, household_size, effective_year) DO NOTHING;

-- 200% FPL (2025)
INSERT INTO income_thresholds (benchmark_id, household_size, monthly_limit, annual_limit, effective_year)
SELECT b.id, v.hs, v.mo, v.ann, 2025
FROM income_benchmarks b,
(VALUES
    (1, 2608.33,  31300.00),
    (2, 3523.33,  42280.00),
    (3, 4438.33,  53260.00),
    (4, 5353.33,  64240.00),
    (5, 6268.33,  75220.00),
    (6, 7183.33,  86200.00),
    (7, 8098.33,  97180.00),
    (8, 9013.33, 108160.00)
) AS v(hs, mo, ann)
WHERE b.code = '200_pct_fpl'
ON CONFLICT (benchmark_id, household_size, effective_year) DO NOTHING;

-- Decision Tree Questions
INSERT INTO decision_tree_questions (code, question_type, is_skippable, sort_order, i18n_key, filter_field) VALUES
    ('geography',      'single_choice',  FALSE, 1, 'questions.geography.prompt',      'geographies'),
    ('household_size', 'numeric_input',  FALSE, 2, 'questions.household_size.prompt', NULL),
    ('income',         'income_input',   FALSE, 3, 'questions.income.prompt',         'income_thresholds'),
    ('age_group',      'single_choice',  FALSE, 4, 'questions.age_group.prompt',      'age_groups'),
    ('legal_status',   'single_choice',  TRUE,  5, 'questions.legal_status.prompt',   'legal_status'),
    ('housing_type',   'single_choice',  FALSE, 6, 'questions.housing_type.prompt',   'housing_types'),
    ('need_type',      'multi_choice',   FALSE, 7, 'questions.need_type.prompt',       'need_types')
ON CONFLICT (code) DO NOTHING;

-- Decision Tree Options
INSERT INTO decision_tree_options (question_id, code, i18n_key, sort_order)
SELECT q.id, v.code, v.i18n_key, v.sort_order
FROM decision_tree_questions q
JOIN (VALUES
    -- Geography options
    ('geography', 'fairfax_county',       'options.geography.fairfax_county',       1),
    ('geography', 'city_of_fairfax',      'options.geography.city_of_fairfax',      2),
    ('geography', 'city_of_falls_church', 'options.geography.city_of_falls_church', 3),
    ('geography', 'herndon',              'options.geography.herndon',              4),
    ('geography', 'vienna',               'options.geography.vienna',               5),
    -- Age group options
    ('age_group', 'age_0_5',           'options.age_group.age_0_5',           1),
    ('age_group', 'age_6_59_nondis',   'options.age_group.age_6_59_nondis',   2),
    ('age_group', 'age_60_plus',       'options.age_group.age_60_plus',       3),
    ('age_group', 'federally_disabled','options.age_group.federally_disabled', 4),
    ('age_group', 'veteran',           'options.age_group.veteran',           5),
    -- Legal status options
    ('legal_status', 'with_status',    'options.legal_status.with_status',    1),
    ('legal_status', 'without_status', 'options.legal_status.without_status', 2),
    -- Housing type options
    ('housing_type', 'renter',         'options.housing_type.renter',         1),
    ('housing_type', 'owner',          'options.housing_type.owner',          2),
    ('housing_type', 'manufactured',   'options.housing_type.manufactured',   3),
    ('housing_type', 'single_family',  'options.housing_type.single_family',  4),
    ('housing_type', 'townhome',       'options.housing_type.townhome',       5),
    ('housing_type', 'multi_family',   'options.housing_type.multi_family',   6),
    ('housing_type', 'condo',          'options.housing_type.condo',          7),
    -- Need type options
    ('need_type', 'ac_cooling',             'options.need_type.ac_cooling',             1),
    ('need_type', 'heating',                'options.need_type.heating',                2),
    ('need_type', 'home_repair_efficiency', 'options.need_type.home_repair_efficiency', 3)
) AS v(q_code, code, i18n_key, sort_order) ON q.code = v.q_code
ON CONFLICT (question_id, code) DO NOTHING;
