-- STEP 1 -- Create the database tables (the "certified historical data" layer).
--
-- SQL concepts on show here:
--   * CREATE TABLE   -- define a table: column names + types
--   * PRIMARY KEY    -- the column that uniquely identifies each row
--   * REFERENCES     -- a foreign key: this column must match a row in another table
--   * NOT NULL       -- the column is required
--
-- SQLite types are simple: TEXT (strings), INTEGER (whole numbers), REAL (decimals).
-- Run this file first (python/00_load_database.py runs it for you, or paste it
-- into DB Browser for SQLite -> Execute SQL).

-- Master list of companies. One row per company, whether historical or new.
CREATE TABLE IF NOT EXISTS companies (
    company_id   TEXT PRIMARY KEY,          -- 'C001'..'C240' historical, 'N001'.. new
    company_name TEXT NOT NULL,
    sector       TEXT NOT NULL
);

-- Financial snapshot at the moment each company faced the capital-allocation
-- decision: "where does the next $10M go?" All money columns are $ millions.
CREATE TABLE IF NOT EXISTS financials (
    company_id           TEXT NOT NULL REFERENCES companies(company_id),
    fy                   INTEGER NOT NULL,  -- fiscal year of the decision
    revenue_m            REAL NOT NULL,
    revenue_growth_pct   REAL NOT NULL,     -- company's own year-over-year growth
    operating_margin_pct REAL NOT NULL,
    ebitda_m             REAL NOT NULL,
    debt_m               REAL NOT NULL,
    cash_m               REAL NOT NULL,
    interest_rate_pct    REAL NOT NULL,     -- what the company pays on its debt
    PRIMARY KEY (company_id, fy)
);

-- Market backdrop by sector and year. Shared by every company in that
-- sector/year -- this is why it is its OWN table instead of extra columns on
-- financials (that's called "normalization": store each fact once).
CREATE TABLE IF NOT EXISTS market_conditions (
    sector              TEXT NOT NULL,
    fy                  INTEGER NOT NULL,
    market_growth_pct   REAL NOT NULL,      -- how fast the sector is growing
    fragmentation_index REAL NOT NULL,      -- 0..1: higher = many small players to acquire
    PRIMARY KEY (sector, fy)
);

-- The LABELS. Three years after each historical decision, a review panel
-- certified (with hindsight) which move was actually right. New companies
-- have NO row here -- predicting their best_action is the model's job.
CREATE TABLE IF NOT EXISTS certified_outcomes (
    company_id     TEXT PRIMARY KEY REFERENCES companies(company_id),
    action_taken   TEXT NOT NULL,           -- what management actually did
    roi_3yr_pct    REAL NOT NULL,           -- return the chosen move produced
    best_action    TEXT NOT NULL,           -- certified right answer: NEW_PRODUCT | MA | PAY_DEBT
    certified_by   TEXT NOT NULL,
    certified_date TEXT NOT NULL
);
