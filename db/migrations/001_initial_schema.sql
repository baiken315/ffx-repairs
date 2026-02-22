-- ============================================================
-- 001_initial_schema.sql
-- Fairfax County Home Repair / Energy Assistance Eligibility Checker
-- ============================================================

-- Geographies
CREATE TABLE IF NOT EXISTS geographies (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    label_en    VARCHAR(100) NOT NULL,
    label_es    VARCHAR(100) NOT NULL
);

-- Age Groups
CREATE TABLE IF NOT EXISTS age_groups (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    label_en    VARCHAR(100) NOT NULL,
    label_es    VARCHAR(100) NOT NULL,
    sort_order  SMALLINT     NOT NULL DEFAULT 0
);

-- Legal Statuses
CREATE TABLE IF NOT EXISTS legal_statuses (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    label_en    VARCHAR(100) NOT NULL,
    label_es    VARCHAR(100) NOT NULL
);

-- Housing Types
CREATE TABLE IF NOT EXISTS housing_types (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    label_en    VARCHAR(100) NOT NULL,
    label_es    VARCHAR(100) NOT NULL,
    sort_order  SMALLINT     NOT NULL DEFAULT 0
);

-- Need Types
CREATE TABLE IF NOT EXISTS need_types (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    label_en    VARCHAR(100) NOT NULL,
    label_es    VARCHAR(100) NOT NULL
);

-- Help Categories
CREATE TABLE IF NOT EXISTS help_categories (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    label_en    VARCHAR(100) NOT NULL,
    label_es    VARCHAR(100) NOT NULL
);

-- Help Types (belong to categories)
CREATE TABLE IF NOT EXISTS help_types (
    id              SERIAL PRIMARY KEY,
    category_id     INTEGER      NOT NULL REFERENCES help_categories(id),
    code            VARCHAR(80)  NOT NULL UNIQUE,
    label_en        VARCHAR(120) NOT NULL,
    label_es        VARCHAR(120) NOT NULL,
    sort_order      SMALLINT     NOT NULL DEFAULT 0
);

-- Administrators
CREATE TABLE IF NOT EXISTS administrators (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(150) NOT NULL,
    website     VARCHAR(300),
    phone       VARCHAR(30),
    email       VARCHAR(150),
    notes_en    TEXT,
    notes_es    TEXT
);

-- Income Benchmarks (80% AMI, 175% FPL, etc.)
CREATE TABLE IF NOT EXISTS income_benchmarks (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(50)  NOT NULL UNIQUE,
    label_en        VARCHAR(100) NOT NULL,
    label_es        VARCHAR(100) NOT NULL,
    description_en  TEXT,
    description_es  TEXT
);

-- Income Thresholds (per benchmark × household size × year)
CREATE TABLE IF NOT EXISTS income_thresholds (
    id              SERIAL PRIMARY KEY,
    benchmark_id    INTEGER      NOT NULL REFERENCES income_benchmarks(id),
    household_size  SMALLINT     NOT NULL CHECK (household_size BETWEEN 1 AND 8),
    monthly_limit   NUMERIC(10,2),
    annual_limit    NUMERIC(10,2),
    effective_year  SMALLINT     NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::SMALLINT,
    UNIQUE (benchmark_id, household_size, effective_year)
);

-- Programs (core table)
CREATE TABLE IF NOT EXISTS programs (
    id                      SERIAL PRIMARY KEY,
    slug                    VARCHAR(100) NOT NULL UNIQUE,
    name_en                 VARCHAR(200) NOT NULL,
    name_es                 VARCHAR(200) NOT NULL,
    short_description_en    TEXT,
    short_description_es    TEXT,
    full_description_en     TEXT,
    full_description_es     TEXT,
    how_to_apply_en         TEXT,
    how_to_apply_es         TEXT,
    income_benchmark_id     INTEGER REFERENCES income_benchmarks(id),
    income_note_en          TEXT,
    income_note_es          TEXT,
    requires_legal_status   BOOLEAN,
    is_active               BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Junction tables (many-to-many, all CASCADE on delete)
CREATE TABLE IF NOT EXISTS program_geographies (
    program_id      INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    geography_id    INTEGER NOT NULL REFERENCES geographies(id),
    PRIMARY KEY (program_id, geography_id)
);

CREATE TABLE IF NOT EXISTS program_age_groups (
    program_id      INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    age_group_id    INTEGER NOT NULL REFERENCES age_groups(id),
    PRIMARY KEY (program_id, age_group_id)
);

CREATE TABLE IF NOT EXISTS program_housing_types (
    program_id      INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    housing_type_id INTEGER NOT NULL REFERENCES housing_types(id),
    PRIMARY KEY (program_id, housing_type_id)
);

CREATE TABLE IF NOT EXISTS program_need_types (
    program_id      INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    need_type_id    INTEGER NOT NULL REFERENCES need_types(id),
    PRIMARY KEY (program_id, need_type_id)
);

CREATE TABLE IF NOT EXISTS program_help_types (
    program_id      INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    help_type_id    INTEGER NOT NULL REFERENCES help_types(id),
    PRIMARY KEY (program_id, help_type_id)
);

CREATE TABLE IF NOT EXISTS program_administrators (
    program_id          INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    administrator_id    INTEGER NOT NULL REFERENCES administrators(id),
    is_primary          BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (program_id, administrator_id)
);

-- Seasonal availability windows
CREATE TABLE IF NOT EXISTS seasonal_windows (
    id              SERIAL PRIMARY KEY,
    program_id      INTEGER  NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    year            SMALLINT NOT NULL,
    open_date       DATE     NOT NULL,
    close_date      DATE     NOT NULL,
    notes_en        TEXT,
    notes_es        TEXT,
    CHECK (close_date >= open_date)
);

CREATE INDEX IF NOT EXISTS idx_seasonal_program ON seasonal_windows(program_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_dates   ON seasonal_windows(open_date, close_date);

-- Decision tree questions
CREATE TABLE IF NOT EXISTS decision_tree_questions (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(80)  NOT NULL UNIQUE,
    question_type   VARCHAR(30)  NOT NULL CHECK (question_type IN ('single_choice','multi_choice','income_input','numeric_input')),
    is_skippable    BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order      SMALLINT     NOT NULL,
    i18n_key        VARCHAR(150) NOT NULL,
    filter_field    VARCHAR(80)
);

CREATE TABLE IF NOT EXISTS decision_tree_options (
    id              SERIAL PRIMARY KEY,
    question_id     INTEGER      NOT NULL REFERENCES decision_tree_questions(id) ON DELETE CASCADE,
    code            VARCHAR(80)  NOT NULL,
    i18n_key        VARCHAR(150) NOT NULL,
    sort_order      SMALLINT     NOT NULL DEFAULT 0,
    lookup_id       INTEGER,
    UNIQUE (question_id, code)
);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(80)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login      TIMESTAMPTZ
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS programs_updated_at ON programs;
CREATE TRIGGER programs_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
