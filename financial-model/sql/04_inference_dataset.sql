-- STEP 4 -- Build the NEW-DATA view for the PRODUCTION side.
--
-- This is the "New data -> SQL" arrow on the production diagram. Exactly the
-- same feature engineering as v_training_dataset -- that symmetry matters:
-- a model must be fed the SAME features in production that it saw in training.
--
-- The only difference: instead of joining to certified_outcomes (which these
-- companies don't have yet), we KEEP ONLY companies with no outcome row,
-- using a NOT IN subquery.

DROP VIEW IF EXISTS v_new_companies;

CREATE VIEW v_new_companies AS
SELECT
    c.company_id,
    c.company_name,
    c.sector,
    f.fy,
    f.revenue_growth_pct,
    f.operating_margin_pct,
    ROUND(f.debt_m / f.ebitda_m, 2)            AS debt_to_ebitda,
    f.interest_rate_pct,
    ROUND(100.0 * f.cash_m / f.revenue_m, 1)   AS cash_pct_of_revenue,
    m.market_growth_pct,
    m.fragmentation_index
FROM companies          AS c
JOIN financials         AS f ON f.company_id = c.company_id
JOIN market_conditions  AS m ON m.sector = c.sector AND m.fy = f.fy
WHERE c.company_id NOT IN (SELECT company_id FROM certified_outcomes);

-- Check it: 12 rows -- the fiscal-2025 companies awaiting a recommendation.
SELECT * FROM v_new_companies;
