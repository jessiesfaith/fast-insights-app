-- STEP 2 -- Explore the data with SELECT (run each query on its own).
--
-- SQL concepts on show here: SELECT, WHERE, ORDER BY, LIMIT, COUNT, AVG,
-- GROUP BY, and your first JOIN. Paste one query at a time into DB Browser
-- for SQLite -> Execute SQL, and read the result before moving on.

-- 2a. Look at raw rows. SELECT * means "every column"; LIMIT keeps it short.
SELECT * FROM companies LIMIT 10;

-- 2b. How many companies per sector? GROUP BY collapses rows that share a
-- value; COUNT(*) counts the rows inside each group.
SELECT sector, COUNT(*) AS n_companies
FROM companies
GROUP BY sector
ORDER BY n_companies DESC;

-- 2c. Filter with WHERE. Which historical decisions were certified as PAY_DEBT?
SELECT company_id, action_taken, best_action, roi_3yr_pct
FROM certified_outcomes
WHERE best_action = 'PAY_DEBT'
ORDER BY roi_3yr_pct DESC
LIMIT 10;

-- 2d. Your first JOIN: match each outcome row to its company row using the
-- shared key column (company_id). Aliases (c, o) keep the query readable.
SELECT c.company_name, c.sector, o.best_action, o.roi_3yr_pct
FROM certified_outcomes AS o
JOIN companies AS c ON c.company_id = o.company_id
LIMIT 10;

-- 2e. Did picking the certified-best move actually pay? Average 3-year ROI
-- when management chose right vs. wrong. (CASE WHEN is SQL's if/else.)
SELECT
    CASE WHEN action_taken = best_action THEN 'chose right' ELSE 'chose wrong' END AS choice,
    COUNT(*)                 AS companies,
    ROUND(AVG(roi_3yr_pct), 1) AS avg_roi_3yr_pct
FROM certified_outcomes
GROUP BY choice;

-- 2f. The pattern the model will learn, visible by eye: average financial
-- profile per certified-best action. Three tables joined at once.
SELECT
    o.best_action,
    COUNT(*)                                   AS companies,
    ROUND(AVG(f.debt_m / f.ebitda_m), 2)       AS avg_debt_to_ebitda,
    ROUND(AVG(f.interest_rate_pct), 1)         AS avg_interest_rate,
    ROUND(AVG(m.market_growth_pct), 1)         AS avg_market_growth,
    ROUND(AVG(f.operating_margin_pct), 1)      AS avg_margin,
    ROUND(AVG(m.fragmentation_index), 2)       AS avg_fragmentation,
    ROUND(AVG(100.0 * f.cash_m / f.revenue_m), 1) AS avg_cash_pct
FROM certified_outcomes AS o
JOIN financials        AS f ON f.company_id = o.company_id
JOIN companies         AS c ON c.company_id = o.company_id
JOIN market_conditions AS m ON m.sector = c.sector AND m.fy = f.fy
GROUP BY o.best_action;
