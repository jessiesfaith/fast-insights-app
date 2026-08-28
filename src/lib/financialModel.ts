// Financial Model Lab — domain data + helpers.
//
// Everything numeric in this file is the REAL output of the runnable learning
// kit in /financial-model (seed 42): the same dataset generator, SQLite views,
// and scikit-learn training run the user reproduces on their own machine.
// Source artifacts: financial-model/outputs/model_card_v1.json and
// financial-model/outputs/prediction_table.csv. If the kit changes, re-run
// `python run_pipeline.py` and refresh the constants here.
//
// The Excel report is defined once as a cell spec (values + the formulas
// behind them) and consumed twice: rendered as the traceable on-page mock
// grid, and written into the downloadable .xlsx via xlsx-js-style.

import * as XLSX from 'xlsx-js-style';

// ---------------------------------------------------------------------------
// The three capital-allocation actions
// ---------------------------------------------------------------------------

export type ActionId = 'NEW_PRODUCT' | 'MA' | 'PAY_DEBT';

/** Fixed display/series order — never re-sorted, per chart-color rules. */
export const ACTIONS: ActionId[] = ['NEW_PRODUCT', 'MA', 'PAY_DEBT'];

export interface ActionMeta {
  label: string;
  short: string;
  /** Categorical chart colors, validated for CVD + contrast per theme. */
  colorLight: string;
  colorDark: string;
  /** When this move historically won — the pattern the model learned. */
  wins: string;
}

export const ACTION_META: Record<ActionId, ActionMeta> = {
  NEW_PRODUCT: {
    label: 'New product line',
    short: 'New product',
    colorLight: '#006d04',
    colorDark: '#0da112',
    wins: 'Fast-growing market, strong margins, low leverage — operating leverage on a rising tide.',
  },
  MA: {
    label: 'Acquisition (M&A)',
    short: 'M&A',
    colorLight: '#2456c8',
    colorDark: '#5b8fe6',
    wins: 'Slow own growth but cash on hand, in a fragmented market — growth is cheaper to buy than to build.',
  },
  PAY_DEBT: {
    label: 'Pay off debt',
    short: 'Pay debt',
    colorLight: '#b45309',
    colorDark: '#c48120',
    wins: 'High leverage and expensive interest — retiring debt is a guaranteed, risk-free return.',
  },
};

export function actionColor(action: ActionId, dark: boolean): string {
  const m = ACTION_META[action];
  return dark ? m.colorDark : m.colorLight;
}

// ---------------------------------------------------------------------------
// Model features
// ---------------------------------------------------------------------------

export type FeatureId =
  | 'revenue_growth_pct'
  | 'operating_margin_pct'
  | 'debt_to_ebitda'
  | 'interest_rate_pct'
  | 'cash_pct_of_revenue'
  | 'market_growth_pct'
  | 'fragmentation_index';

export const FEATURES: { id: FeatureId; label: string; plain: string; fromSql: boolean }[] = [
  { id: 'revenue_growth_pct', label: 'Revenue growth %', fromSql: false,
    plain: "The company's own year-over-year top-line growth." },
  { id: 'operating_margin_pct', label: 'Operating margin %', fromSql: false,
    plain: 'Operating profit as a % of revenue — how profitable each sale is.' },
  { id: 'debt_to_ebitda', label: 'Debt / EBITDA', fromSql: true,
    plain: 'Leverage: years of cash earnings it would take to repay all debt. Computed in the SQL view (debt_m / ebitda_m).' },
  { id: 'interest_rate_pct', label: 'Interest rate %', fromSql: false,
    plain: 'What the company pays on its debt — the hurdle a growth bet must beat.' },
  { id: 'cash_pct_of_revenue', label: 'Cash % of revenue', fromSql: true,
    plain: 'Dry powder relative to size. Computed in the SQL view (100 × cash_m / revenue_m).' },
  { id: 'market_growth_pct', label: 'Market growth %', fromSql: false,
    plain: "How fast the company's sector is growing (joined from market_conditions)." },
  { id: 'fragmentation_index', label: 'Fragmentation index', fromSql: false,
    plain: '0–1: how much of the market is held by small players — i.e. how many acquisition targets exist.' },
];

// ---------------------------------------------------------------------------
// Trained model — the audit trail (outputs/model_card_v1.json, seed 42)
// ---------------------------------------------------------------------------

export const MODEL_CARD = {
  version: '1.0',
  status: 'APPROVED' as const,
  algorithm: 'StandardScaler + multinomial LogisticRegression (scikit-learn)',
  trainingView: 'v_training_dataset',
  rows: { train: 180, test: 60 },
  randomState: 42,
  trainAccuracy: 0.8944,
  testAccuracy: 0.8833,
  perClass: {
    NEW_PRODUCT: { precision: 0.8182, recall: 0.9, f1: 0.8571 },
    MA: { precision: 0.8889, recall: 0.8, f1: 0.8421 },
    PAY_DEBT: { precision: 0.95, recall: 0.95, f1: 0.95 },
  } as Record<ActionId, { precision: number; recall: number; f1: number }>,
  /** rows = true action, cols = predicted action, in ACTIONS order. */
  confusion: {
    NEW_PRODUCT: { NEW_PRODUCT: 18, MA: 1, PAY_DEBT: 1 },
    MA: { NEW_PRODUCT: 4, MA: 16, PAY_DEBT: 0 },
    PAY_DEBT: { NEW_PRODUCT: 0, MA: 1, PAY_DEBT: 19 },
  } as Record<ActionId, Record<ActionId, number>>,
  gate: { minTestAccuracy: 0.8, minClassRecall: 0.7, passed: true },
  /** Learned weights on the standardized scale — readable like a table. */
  coefficients: {
    NEW_PRODUCT: { revenue_growth_pct: 1.019, operating_margin_pct: 0.498, debt_to_ebitda: -1.098,
      interest_rate_pct: -0.691, cash_pct_of_revenue: -0.4, market_growth_pct: 0.95, fragmentation_index: -0.371 },
    MA: { revenue_growth_pct: -1.168, operating_margin_pct: -0.34, debt_to_ebitda: -1.563,
      interest_rate_pct: -0.065, cash_pct_of_revenue: 1.091, market_growth_pct: -0.329, fragmentation_index: 0.879 },
    PAY_DEBT: { revenue_growth_pct: 0.149, operating_margin_pct: -0.157, debt_to_ebitda: 2.661,
      interest_rate_pct: 0.756, cash_pct_of_revenue: -0.691, market_growth_pct: -0.621, fragmentation_index: -0.508 },
  } as Record<ActionId, Record<FeatureId, number>>,
};

/** Label balance of the 240 certified historical rows. */
export const LABEL_BALANCE: Record<ActionId, number> = { NEW_PRODUCT: 78, MA: 80, PAY_DEBT: 82 };

/** SQL step 2e result: did picking the certified-best move pay? */
export const CHOSE_RIGHT = {
  right: { companies: 182, avgRoi3yrPct: 18.3 },
  wrong: { companies: 58, avgRoi3yrPct: 6.8 },
};

/** SQL step 2f / Python explore result: average profile per certified-best action. */
export const TRAINING_PROFILE: Record<ActionId, Record<FeatureId, number>> = {
  NEW_PRODUCT: { revenue_growth_pct: 7.15, operating_margin_pct: 16.88, debt_to_ebitda: 2.40,
    interest_rate_pct: 5.41, cash_pct_of_revenue: 13.05, market_growth_pct: 6.08, fragmentation_index: 0.44 },
  MA: { revenue_growth_pct: 1.32, operating_margin_pct: 11.53, debt_to_ebitda: 2.67,
    interest_rate_pct: 5.74, cash_pct_of_revenue: 18.02, market_growth_pct: 2.84, fragmentation_index: 0.55 },
  PAY_DEBT: { revenue_growth_pct: 3.05, operating_margin_pct: 8.89, debt_to_ebitda: 7.00,
    interest_rate_pct: 7.81, cash_pct_of_revenue: 13.87, market_growth_pct: 2.56, fragmentation_index: 0.51 },
};

// ---------------------------------------------------------------------------
// The prediction table — outputs/prediction_table.csv (production side)
// ---------------------------------------------------------------------------

export interface PredictionRow {
  companyId: string;
  companyName: string;
  sector: string;
  features: Record<FeatureId, number>;
  /** Probability per action (rounds to 3 decimals; each row sums to ≈1). */
  p: Record<ActionId, number>;
  recommended: ActionId;
  confidence: number;
}

const P = (companyId: string, companyName: string, sector: string,
  feats: number[], pNew: number, pMa: number, pDebt: number,
  recommended: ActionId, confidence: number): PredictionRow => ({
  companyId, companyName, sector,
  features: {
    revenue_growth_pct: feats[0], operating_margin_pct: feats[1], debt_to_ebitda: feats[2],
    interest_rate_pct: feats[3], cash_pct_of_revenue: feats[4], market_growth_pct: feats[5],
    fragmentation_index: feats[6],
  },
  p: { NEW_PRODUCT: pNew, MA: pMa, PAY_DEBT: pDebt },
  recommended, confidence,
});

export const PREDICTIONS: PredictionRow[] = [
  P('N001', 'NorthPine Holdings', 'Consumer Products', [2.1, 11.5, 4.2, 7.1, 8.1, 3.2, 0.71], 0.05, 0.51, 0.439, 'MA', 0.51),
  P('N002', 'Veldt Software', 'Software & SaaS', [14.8, 21.0, 0.5, 5.9, 23.2, 8.3, 0.44], 0.999, 0.001, 0, 'NEW_PRODUCT', 0.999),
  P('N003', 'Quarry Industrial', 'Industrial Equipment', [1.2, 10.0, 5.89, 8.4, 5.8, 2.3, 0.46], 0.002, 0.002, 0.996, 'PAY_DEBT', 0.996),
  P('N004', 'Bristlecone Health', 'Healthcare Services', [4.0, 12.5, 1.47, 5.6, 23.6, 3.9, 0.68], 0.025, 0.974, 0.001, 'MA', 0.974),
  P('N005', 'Copperline Staffing', 'Business Services', [2.5, 13.0, 1.15, 5.7, 25.3, 3.2, 0.82], 0.001, 0.998, 0, 'MA', 0.998),
  P('N006', 'Aster & Vine Retail', 'Specialty Retail', [0.8, 5.5, 8.64, 8.9, 4.1, 2.5, 0.55], 0, 0, 1.0, 'PAY_DEBT', 1.0),
  P('N007', 'Helix Diagnostics', 'Healthcare Services', [9.5, 15.0, 0.85, 5.8, 13.3, 3.9, 0.68], 0.708, 0.286, 0.006, 'NEW_PRODUCT', 0.708),
  P('N008', 'Foundry Cloudworks', 'Software & SaaS', [11.0, 17.5, 3.32, 7.6, 8.5, 8.3, 0.44], 0.964, 0.001, 0.035, 'NEW_PRODUCT', 0.964),
  P('N009', 'Meridian Provisions', 'Consumer Products', [1.5, 9.0, 1.68, 5.5, 23.9, 3.2, 0.71], 0.003, 0.997, 0, 'MA', 0.997),
  P('N010', 'Atlas Advisory Group', 'Business Services', [3.0, 14.0, 1.44, 5.6, 24.0, 3.2, 0.82], 0.003, 0.997, 0, 'MA', 0.997),
  P('N011', 'Ridgeway Fabrication', 'Industrial Equipment', [2.0, 12.0, 3.3, 7.2, 7.3, 2.3, 0.46], 0.104, 0.096, 0.801, 'PAY_DEBT', 0.801),
  P('N012', 'Lumen Home Goods', 'Consumer Products', [5.5, 13.5, 1.62, 6.1, 12.5, 3.2, 0.71], 0.18, 0.805, 0.015, 'MA', 0.805),
];

/** Confidence below this = a close call the model flags for human review. */
export const CLOSE_CALL_THRESHOLD = 0.6;

export interface PredictionKpis {
  scored: number;
  counts: Record<ActionId, number>;
  avgConfidence: number;
  avgConfidenceByAction: Record<ActionId, number>;
  closeCalls: PredictionRow[];
}

export function predictionKpis(rows: PredictionRow[] = PREDICTIONS): PredictionKpis {
  const counts = { NEW_PRODUCT: 0, MA: 0, PAY_DEBT: 0 } as Record<ActionId, number>;
  const confSum = { NEW_PRODUCT: 0, MA: 0, PAY_DEBT: 0 } as Record<ActionId, number>;
  let total = 0;
  for (const r of rows) {
    counts[r.recommended] += 1;
    confSum[r.recommended] += r.confidence;
    total += r.confidence;
  }
  const avgConfidenceByAction = { NEW_PRODUCT: 0, MA: 0, PAY_DEBT: 0 } as Record<ActionId, number>;
  for (const a of ACTIONS) {
    avgConfidenceByAction[a] = counts[a] > 0 ? round3(confSum[a] / counts[a]) : 0;
  }
  return {
    scored: rows.length,
    counts,
    avgConfidence: rows.length > 0 ? round3(total / rows.length) : 0,
    avgConfidenceByAction,
    closeCalls: rows.filter((r) => r.confidence < CLOSE_CALL_THRESHOLD),
  };
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

// ---------------------------------------------------------------------------
// In-browser inference — the exact model v1.0, as 45 numbers
// ---------------------------------------------------------------------------
//
// Extracted from outputs/model_v1.pkl: the StandardScaler statistics (fit on
// the 180 training rows) and the multinomial LogisticRegression weights and
// intercepts. scoreCompany() reproduces sklearn's predict_proba — verified in
// tests against every baked prediction row — so the what-if sandbox on the
// page runs the same approved model, not an approximation.

/** Feature order the model was trained with (matches FEATURES order). */
const FEATURE_ORDER: FeatureId[] = FEATURES.map((f) => f.id);

export const MODEL_PARAMS = {
  classes: ['MA', 'NEW_PRODUCT', 'PAY_DEBT'] as ActionId[],
  means: [3.91333333, 12.19166667, 4.27666667, 6.434, 15.09833333, 3.84666667, 0.50083333],
  scales: [5.16636988, 5.93839555, 3.31385827, 1.95013606, 7.57475687, 2.67694685, 0.11171827],
  intercepts: [-0.35986933, -0.31128256, 0.67115189],
  coefs: [
    [-1.16818565, -0.3401682, -1.5625655, -0.065434, 1.09101645, -0.32886929, 0.87921003],
    [1.01932057, 0.49752965, -1.09818875, -0.69087026, -0.40001336, 0.94999685, -0.37144181],
    [0.14886509, -0.15736145, 2.66075425, 0.75630426, -0.69100309, -0.62112756, -0.50776823],
  ],
};

export interface ScoreResult {
  p: Record<ActionId, number>;
  recommended: ActionId;
  confidence: number;
  /** Per-action logit contribution of each feature (weight × standardized value). */
  contributions: Record<ActionId, Record<FeatureId, number>>;
}

/** Standardize → weighted sums → softmax: logistic regression by hand. */
export function scoreCompany(features: Record<FeatureId, number>): ScoreResult {
  const { classes, means, scales, intercepts, coefs } = MODEL_PARAMS;
  const z = FEATURE_ORDER.map((f, i) => (features[f] - means[i]) / scales[i]);

  const contributions = {} as Record<ActionId, Record<FeatureId, number>>;
  const logits = classes.map((cls, c) => {
    contributions[cls] = {} as Record<FeatureId, number>;
    let logit = intercepts[c];
    FEATURE_ORDER.forEach((f, i) => {
      const contrib = coefs[c][i] * z[i];
      contributions[cls][f] = contrib;
      logit += contrib;
    });
    return logit;
  });

  // Softmax with the max subtracted for numeric stability.
  const maxLogit = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - maxLogit));
  const total = exps.reduce((s, e) => s + e, 0);

  const p = {} as Record<ActionId, number>;
  classes.forEach((cls, c) => { p[cls] = exps[c] / total; });
  const recommended = classes.reduce((best, cls) => (p[cls] > p[best] ? cls : best), classes[0]);
  return { p, recommended, confidence: p[recommended], contributions };
}

// ---------------------------------------------------------------------------
// Governance: output control checks + drift monitoring
// ---------------------------------------------------------------------------
//
// The same methodology as the kit's python/04_drift_check.py, sharing its
// baked training statistics (full 240-row v_training_dataset, sample std):
// per-feature mean shift of the scored cohort, in training std devs.

/** Mean/std of each feature over the 240 training rows (kit drift script). */
export const TRAINING_STATS: Record<FeatureId, { mean: number; std: number }> = {
  revenue_growth_pct: { mean: 3.804, std: 5.155 },
  operating_margin_pct: { mean: 12.366, std: 5.932 },
  debt_to_ebitda: { mean: 4.064, std: 3.079 },
  interest_rate_pct: { mean: 6.34, std: 1.858 },
  cash_pct_of_revenue: { mean: 14.987, std: 7.491 },
  market_growth_pct: { mean: 3.795, std: 2.605 },
  fragmentation_index: { mean: 0.5, std: 0.11 },
};

export const DRIFT_THRESHOLDS = { watch: 0.5, investigate: 1.0 };

export type DriftStatus = 'STABLE' | 'WATCH' | 'INVESTIGATE';

export interface DriftRow {
  feature: FeatureId;
  meanTrain: number;
  stdTrain: number;
  meanNew: number;
  shiftStd: number;
  status: DriftStatus;
}

/** shift(f) = (mean_new − mean_train) ÷ std_train, flagged at ±0.5 / ±1.0. */
export function featureDrift(rows: PredictionRow[] = PREDICTIONS): DriftRow[] {
  return FEATURES.map(({ id }) => {
    const { mean, std } = TRAINING_STATS[id];
    const meanNew = rows.reduce((s, r) => s + r.features[id], 0) / rows.length;
    const shiftStd = (meanNew - mean) / std;
    const a = Math.abs(shiftStd);
    const status: DriftStatus =
      a >= DRIFT_THRESHOLDS.investigate ? 'INVESTIGATE' : a >= DRIFT_THRESHOLDS.watch ? 'WATCH' : 'STABLE';
    return { feature: id, meanTrain: mean, stdTrain: std, meanNew, shiftStd, status };
  });
}

export interface OutputCheck {
  id: string;
  kind: 'completeness' | 'accuracy';
  label: string;
  detail: string;
  passed: boolean;
}

/**
 * The completeness & accuracy tie-outs a reviewer runs on the prediction
 * table before relying on it (the IPE controls, computed for real).
 */
export function outputControlChecks(rows: PredictionRow[] = PREDICTIONS, expected = 12): OutputCheck[] {
  const ids = rows.map((r) => r.companyId);
  const uniqueIds = new Set(ids).size;
  const k = predictionKpis(rows);
  const countSum = ACTIONS.reduce((s, a) => s + k.counts[a], 0);
  const probSums = rows.map((r) => r.p.NEW_PRODUCT + r.p.MA + r.p.PAY_DEBT);
  const minSum = Math.min(...probSums);
  const maxSum = Math.max(...probSums);
  const sumsOk = probSums.every((s) => Math.abs(s - 1) <= 0.005);
  const confOk = rows.every((r) => Math.abs(r.confidence - Math.max(r.p.NEW_PRODUCT, r.p.MA, r.p.PAY_DEBT)) < 1e-9);
  const rangeOk = rows.every((r) => ACTIONS.every((a) => r.p[a] >= 0 && r.p[a] <= 1));

  return [
    { id: 'rows', kind: 'completeness', label: 'Population complete',
      detail: `${rows.length} rows scored vs ${expected} companies expected`, passed: rows.length === expected },
    { id: 'unique', kind: 'completeness', label: 'No duplicates',
      detail: `${uniqueIds} unique company ids across ${ids.length} rows`, passed: uniqueIds === ids.length },
    { id: 'countSum', kind: 'completeness', label: 'Recommendations reconcile',
      detail: `${k.counts.NEW_PRODUCT} + ${k.counts.MA} + ${k.counts.PAY_DEBT} = ${countSum}, ties to rows scored`,
      passed: countSum === rows.length },
    { id: 'probSum', kind: 'accuracy', label: 'Probabilities tie out',
      detail: `every row sums to 1 ± 0.005 (observed ${minSum.toFixed(3)}–${maxSum.toFixed(3)})`, passed: sumsOk },
    { id: 'confMax', kind: 'accuracy', label: 'Confidence recomputes',
      detail: 'confidence equals max(P) on every row — independent re-derivation agrees', passed: confOk },
    { id: 'range', kind: 'accuracy', label: 'Values in range',
      detail: 'every probability within [0, 1]', passed: rangeOk },
  ];
}

// ---------------------------------------------------------------------------
// Excel report spec — one definition for the on-page mock AND the .xlsx
// ---------------------------------------------------------------------------
//
// The Report sheet pulls every company field from the raw import sheet
// (`prediction_table`) with INDEX/MATCH, then derives the recommendation,
// confidence, a probability control check, and a review flag with formulas
// the learner can trace cell by cell.
//
// Raw-sheet column map (matches prediction_table.csv exactly):
//   A company_id · B company_name · C sector · D..J features ·
//   K p_ma · L p_new_product · M p_pay_debt · N recommended_action ·
//   O confidence · P model_version · Q scored_at_utc

export interface SheetCell {
  /** The value Excel displays (already computed, so the mock can render it). */
  v: string | number;
  /** The formula behind the value; absent = a typed-in value. */
  f?: string;
  num?: 'p3' | 'int';
  bold?: boolean;
  /** Tone the cell by action (recommendation cells) in the on-page mock. */
  action?: ActionId;
  /** Plain-English explanation shown in the mock's formula bar. */
  explain?: string;
}

export interface ExcelReportSpec {
  /** Column letters used by the sheet, in order. */
  columns: string[];
  /** Row 1 = headers; then 12 data rows; a blank row; the summary block. */
  rows: SheetCell[][];
  /** 1-based sheet row numbers the data occupies (for tests/rendering). */
  dataRows: { first: number; last: number };
}

const lookup = (rawCol: string, sheetRow: number) =>
  `INDEX(prediction_table!$${rawCol}:$${rawCol},MATCH($A${sheetRow},prediction_table!$A:$A,0))`;

export function buildExcelReportSpec(rows: PredictionRow[] = PREDICTIONS): ExcelReportSpec {
  const out: SheetCell[][] = [];

  out.push([
    { v: 'Company ID', bold: true }, { v: 'Company', bold: true }, { v: 'Sector', bold: true },
    { v: 'P(new product)', bold: true }, { v: 'P(M&A)', bold: true }, { v: 'P(pay debt)', bold: true },
    { v: 'Recommended', bold: true }, { v: 'Confidence', bold: true },
    { v: 'Prob check', bold: true }, { v: 'Flag', bold: true },
  ]);

  rows.forEach((r, i) => {
    const n = i + 2; // 1-based sheet row of this data row
    const probCheck = round3(r.p.NEW_PRODUCT + r.p.MA + r.p.PAY_DEBT);
    const flag = r.confidence < CLOSE_CALL_THRESHOLD ? 'REVIEW - close call' : 'OK';
    out.push([
      { v: r.companyId, explain: 'Typed in (the key every lookup on this row matches against).' },
      { v: r.companyName, f: `=${lookup('B', n)}`,
        explain: `MATCH finds which row of the import sheet holds ${r.companyId}; INDEX reads column B (company_name) from that row. Change A${n} and the whole row re-points.` },
      { v: r.sector, f: `=${lookup('C', n)}`, explain: 'Same INDEX/MATCH pattern, reading column C (sector).' },
      { v: r.p.NEW_PRODUCT, f: `=${lookup('L', n)}`, num: 'p3',
        explain: 'INDEX/MATCH again — column L of the import is p_new_product, the model probability that a new product line is the best move.' },
      { v: r.p.MA, f: `=${lookup('K', n)}`, num: 'p3',
        explain: 'Column K of the import is p_ma — the probability that an acquisition is the best move.' },
      { v: r.p.PAY_DEBT, f: `=${lookup('M', n)}`, num: 'p3',
        explain: 'Column M of the import is p_pay_debt — the probability that paying off debt is the best move.' },
      { v: ACTION_META[r.recommended].label, f: `=IF(AND(D${n}>=E${n},D${n}>=F${n}),"New product line",IF(E${n}>=F${n},"Acquisition (M&A)","Pay off debt"))`,
        action: r.recommended,
        explain: 'A nested IF re-derives the recommendation from the three probabilities: whichever is largest wins. It should always agree with the model — if it ever disagrees, something upstream changed.' },
      { v: r.confidence, f: `=MAX(D${n}:F${n})`, num: 'p3',
        explain: 'Confidence = the winning probability. MAX over the three probability cells.' },
      { v: probCheck, f: `=SUM(D${n}:F${n})`, num: 'p3',
        explain: 'Control check: the three probabilities must sum to ≈ 1. Rounding to 3 decimals means 0.999–1.001 is fine — a tie-out tolerance, exactly like a recon.' },
      { v: flag, f: `=IF(H${n}<0.6,"REVIEW - close call","OK")`,
        action: flag === 'OK' ? undefined : r.recommended,
        explain: 'Governance: confidence under 60% means the model is torn — route the decision to a human instead of trusting the label.' },
    ]);
  });

  out.push([{ v: '' }]);

  const k = predictionKpis(rows);
  const firstData = 2;
  const lastData = rows.length + 1;
  const g = `$G$${firstData}:$G$${lastData}`;
  const h = `$H$${firstData}:$H$${lastData}`;
  const j = `$J$${firstData}:$J$${lastData}`;
  const summaryHeaderRow = lastData + 2; // after the blank row

  out.push([
    { v: 'Report summary', bold: true }, { v: 'Companies', bold: true }, { v: 'Avg confidence', bold: true },
  ]);
  ACTIONS.forEach((a, i) => {
    const sr = summaryHeaderRow + 1 + i;
    out.push([
      { v: ACTION_META[a].label, action: a },
      { v: k.counts[a], f: `=COUNTIF(${g},$A${sr})`, num: 'int',
        explain: 'COUNTIF: count the recommendation cells equal to this action label.' },
      { v: k.avgConfidenceByAction[a], f: `=ROUND(AVERAGEIF(${g},$A${sr},${h}),3)`, num: 'p3',
        explain: 'AVERAGEIF: average column H (confidence) over only the rows whose recommendation matches this action.' },
    ]);
  });
  out.push([
    { v: 'Total', bold: true },
    { v: rows.length, f: `=SUM(B${summaryHeaderRow + 1}:B${summaryHeaderRow + 3})`, num: 'int', bold: true,
      explain: 'The three counts must add back to every company scored — a completeness check.' },
    { v: k.avgConfidence, f: `=ROUND(AVERAGE(${h}),3)`, num: 'p3', bold: true,
      explain: 'Plain AVERAGE over all twelve confidence cells.' },
  ]);
  out.push([
    { v: 'Close calls (< 0.6)' },
    { v: k.closeCalls.length, f: `=COUNTIF(${j},"REVIEW - close call")`, num: 'int',
      explain: 'How many rows the flag column routed to a human.' },
  ]);

  return { columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'], rows: out, dataRows: { first: firstData, last: lastData } };
}

// ---------------------------------------------------------------------------
// Workbook builder (xlsx-js-style) — the downloadable, formula-live .xlsx
// ---------------------------------------------------------------------------

const FMT_P3 = '0.000';

function readmeSheet(): XLSX.WorkSheet {
  const rows: string[][] = [
    ['Financial Model Lab - prediction report'],
    [],
    ['What this workbook is'],
    ['The Excel half of the app\'s Financial Model Lab (app.fastinsights.io/financial-model).'],
    ['Sheet "prediction_table" is the raw model output, exactly as prediction_table.csv imports.'],
    ['Sheet "Report" rebuilds the analysis with live formulas - click any cell and read the'],
    ['formula bar: INDEX/MATCH lookups, a nested IF recommendation, MAX confidence, a SUM'],
    ['control check, COUNTIF / AVERAGEIF summaries.'],
    ['Sheet "Model card" is the trained model\'s audit trail (metrics + validation gate).'],
    [],
    ['The model: multinomial logistic regression trained on 240 certified historical'],
    ['capital-allocation decisions (synthetic teaching data, seed 42). Education only;'],
    ['not investment advice.'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 95 }];
  return ws;
}

function rawSheet(rows: PredictionRow[]): XLSX.WorkSheet {
  const data = rows.map((r) => ({
    company_id: r.companyId,
    company_name: r.companyName,
    sector: r.sector,
    revenue_growth_pct: r.features.revenue_growth_pct,
    operating_margin_pct: r.features.operating_margin_pct,
    debt_to_ebitda: r.features.debt_to_ebitda,
    interest_rate_pct: r.features.interest_rate_pct,
    cash_pct_of_revenue: r.features.cash_pct_of_revenue,
    market_growth_pct: r.features.market_growth_pct,
    fragmentation_index: r.features.fragmentation_index,
    p_ma: r.p.MA,
    p_new_product: r.p.NEW_PRODUCT,
    p_pay_debt: r.p.PAY_DEBT,
    recommended_action: r.recommended,
    confidence: r.confidence,
    model_version: MODEL_CARD.version,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 11 }, { wch: 22 }, { wch: 20 }, ...Array.from({ length: 7 }, () => ({ wch: 14 })),
    { wch: 9 }, { wch: 14 }, { wch: 11 }, { wch: 20 }, { wch: 11 }, { wch: 13 },
  ];
  return ws;
}

function reportSheet(spec: ExcelReportSpec): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  spec.rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell.v === '' && !cell.f) return;
      const addr = XLSX.utils.encode_cell({ r, c });
      const isNum = typeof cell.v === 'number';
      const out: XLSX.CellObject = { t: isNum ? 'n' : 's', v: cell.v };
      if (cell.f) out.f = cell.f.replace(/^=/, '');
      if (cell.num === 'p3') out.z = FMT_P3;
      if (cell.bold) out.s = { font: { bold: true } };
      ws[addr] = out;
    });
  });
  ws['!ref'] = XLSX.utils.encode_range(
    { r: 0, c: 0 },
    { r: spec.rows.length - 1, c: spec.columns.length - 1 },
  );
  ws['!cols'] = [
    { wch: 11 }, { wch: 22 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 20 }, { wch: 12 }, { wch: 11 }, { wch: 20 },
  ];
  return ws;
}

function modelCardSheet(): XLSX.WorkSheet {
  const rows: (string | number)[][] = [
    ['Model card - Financial Model Lab'],
    [],
    ['Model version', MODEL_CARD.version],
    ['Status', MODEL_CARD.status],
    ['Algorithm', MODEL_CARD.algorithm],
    ['Training view', MODEL_CARD.trainingView],
    ['Training rows', MODEL_CARD.rows.train],
    ['Held-out test rows', MODEL_CARD.rows.test],
    ['Train accuracy', MODEL_CARD.trainAccuracy],
    ['Test accuracy', MODEL_CARD.testAccuracy],
    [],
    ['Validation gate'],
    ['Min test accuracy', MODEL_CARD.gate.minTestAccuracy],
    ['Min per-class recall', MODEL_CARD.gate.minClassRecall],
    ['Passed', MODEL_CARD.gate.passed ? 'YES' : 'NO'],
    [],
    ['Per-class metrics', 'precision', 'recall', 'f1'],
    ...ACTIONS.map((a) => [
      ACTION_META[a].label, MODEL_CARD.perClass[a].precision, MODEL_CARD.perClass[a].recall, MODEL_CARD.perClass[a].f1,
    ] as (string | number)[]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 26 }, { wch: 52 }, { wch: 12 }, { wch: 12 }];
  return ws;
}

export const WORKBOOK_SHEET_NAMES = ['READ ME', 'prediction_table', 'Report', 'Model card'] as const;

/** Build the workbook. Pure — does not touch the file system. */
export function buildFinancialModelWorkbook(rows: PredictionRow[] = PREDICTIONS): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, readmeSheet(), 'READ ME');
  XLSX.utils.book_append_sheet(wb, rawSheet(rows), 'prediction_table');
  XLSX.utils.book_append_sheet(wb, reportSheet(buildExcelReportSpec(rows)), 'Report');
  XLSX.utils.book_append_sheet(wb, modelCardSheet(), 'Model card');
  return wb;
}

/** User-facing download; returns the file name written. */
export function downloadFinancialModelWorkbook(): string {
  const fileName = 'financial-model-lab-report.xlsx';
  XLSX.writeFile(buildFinancialModelWorkbook(), fileName);
  return fileName;
}
