-- STEP 3 -- Build the TRAINING DATASET as a view.
--
-- This is the "SQL -> Training dataset" arrow on the pipeline diagram.
-- A VIEW is a saved query that behaves like a table: the feature logic lives
-- in ONE certified place, and Python just does SELECT * FROM v_training_dataset.
--
-- Feature engineering happening below:
--   debt_to_ebitda       = debt_m / ebitda_m        (leverage -- the classic credit ratio)
--   cash_pct_of_revenue  = 100 * cash_m / revenue_m (dry powder relative to size)
-- The rest of the features are passed straight through from the source tables.

DROP VIEW IF EXISTS v_training_dataset;

CREATE VIEW v_training_dataset AS
SELECT
    c.company_id,
    c.company_name,
    c.sector,
    f.fy,
    -- the 7 model features -------------------------------------------------
    f.revenue_growth_pct,
    f.operating_margin_pct,
    ROUND(f.debt_m / f.ebitda_m, 2)            AS debt_to_ebitda,
    f.interest_rate_pct,
    ROUND(100.0 * f.cash_m / f.revenue_m, 1)   AS cash_pct_of_revenue,
    m.market_growth_pct,
    m.fragmentation_index,
    -- the label ------------------------------------------------------------
    o.best_action
FROM certified_outcomes AS o                    -- only labeled (historical) rows
JOIN companies          AS c ON c.company_id = o.company_id
JOIN financials         AS f ON f.company_id = o.company_id
JOIN market_conditions  AS m ON m.sector = c.sector AND m.fy = f.fy;

-- Check it: 240 rows, one per historical company, features + label.
SELECT * FROM v_training_dataset LIMIT 5;
