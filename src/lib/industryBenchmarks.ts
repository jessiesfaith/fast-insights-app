// Industry benchmark engine — the model layer behind tab 14 (spec §55–72).
//
// The spec's two disciplines, enforced in code:
//   1. Never use one universal "healthy range" — classify the company first
//      (industry → stage → model), then compare against that peer set.
//   2. Observed industry values are OBSERVED AVERAGES, NOT healthy-range
//      cutoffs — every number carries a benchmark-type label, and internal
//      heuristics are labeled INTERNAL_ANALYTICAL_HEURISTIC, never dressed
//      up as external rules.
//
// Data: NYU Stern / Aswath Damodaran industry datasets, January 2026
// observed examples as cited in the master spec. Plus the vertical quick
// kits (biotech runway & catalyst coverage, SaaS Rule of 40, retail
// inventory math) with their formulas from the spec.
// Education only; not investment advice.

const r1 = (n: number) => Math.round(n * 10) / 10;

export type BenchmarkType =
  | 'OBSERVED_INDUSTRY_AVERAGE'
  | 'INTERNAL_ANALYTICAL_HEURISTIC'
  | 'REGULATORY'
  | 'LENDER_COVENANT';

export interface IndustryBenchmarkRow {
  id: string;
  industry: string;
  debtEbitda: number;
  interestCoverage: number;
  afterTaxOperMarginPct: number;
  rocPct: number;
  note: string;
}

/** Damodaran January-2026 observed values, as cited in the spec. */
export const DAMODARAN_JAN2026: IndustryBenchmarkRow[] = [
  { id: 'biotech', industry: 'Biotechnology', debtEbitda: 6.2, interestCoverage: 1.88, afterTaxOperMarginPct: 8.86, rocPct: 7.26, note: 'Leverage that would scream distress in retail is the OBSERVED average here — pre-profit R&D economics.' },
  { id: 'pharma', industry: 'Pharmaceutical', debtEbitda: 2.43, interestCoverage: 10.49, afterTaxOperMarginPct: 26.36, rocPct: 29.3, note: 'Same sector family as biotech, utterly different observed economics — stage matters as much as industry.' },
  { id: 'software', industry: 'Software (system/application)', debtEbitda: 1.71, interestCoverage: 18.95, afterTaxOperMarginPct: 32.62, rocPct: 50.17, note: 'The ROC every board covets — and the reason software multiples look "expensive" against everything else.' },
  { id: 'restaurants', industry: 'Restaurants', debtEbitda: NaN, interestCoverage: NaN, afterTaxOperMarginPct: 12.52, rocPct: 18.94, note: 'Margin and ROC cited; leverage runs lease-adjusted here — a different metric family (spec §68).' },
  { id: 'grocery', industry: 'Grocery / food retail', debtEbitda: NaN, interestCoverage: NaN, afterTaxOperMarginPct: 1.5, rocPct: 6.98, note: 'A 1.5% margin is NORMAL — structurally thin, volume-driven. Judging it by software’s margin is the exact error §123 forbids.' },
];

export const BENCHMARK_SOURCE = 'NYU Stern / Aswath Damodaran industry datasets, January 2026 (observed values as cited)';

export const OBSERVED_NOT_HEALTHY_RULE =
  'CRITICAL: these are OBSERVED industry averages — they are NOT healthy-range cutoffs. Biotech’s observed 6.20× Debt/EBITDA does not make 6× "fine," and grocery’s 1.5% margin does not make 1.5% "bad." An observed average answers "what does this industry look like?", never "what should this company be?" — that takes peer percentiles, stage, cycle position, rates, cash-flow stability, and the downside case (spec §123).';

export interface MetricComparison {
  metric: string;
  company: number;
  observed: number;
  /** How to read the gap — direction is metric-specific, never "higher = better". */
  read: string;
}

export interface BenchmarkComparison {
  industry: string;
  benchmarkType: BenchmarkType;
  source: string;
  rows: MetricComparison[];
}

export interface CompanyMetrics {
  debtEbitda: number;
  interestCoverage: number;
  afterTaxOperMarginPct: number;
  rocPct: number;
}

export const DEFAULT_COMPANY_METRICS: CompanyMetrics = {
  debtEbitda: 2.5,
  interestCoverage: 6.7,
  afterTaxOperMarginPct: 16,
  rocPct: 12,
};

/** Compare a company against one industry's observed values — with direction discipline. */
export function compareToBenchmark(c: CompanyMetrics, industryId: string): BenchmarkComparison {
  const b = DAMODARAN_JAN2026.find((x) => x.id === industryId) ?? DAMODARAN_JAN2026[0];
  const rows: MetricComparison[] = [];
  if (Number.isFinite(b.debtEbitda))
    rows.push({
      metric: 'Debt / EBITDA',
      company: c.debtEbitda,
      observed: b.debtEbitda,
      read: c.debtEbitda > b.debtEbitda ? 'MORE levered than the observed average — leverage is worse when higher; check coverage and the maturity wall before concluding.' : 'Less levered than the observed average — headroom, which is capacity, not a command to borrow.',
    });
  if (Number.isFinite(b.interestCoverage))
    rows.push({
      metric: 'Interest coverage',
      company: c.interestCoverage,
      observed: b.interestCoverage,
      read: c.interestCoverage < b.interestCoverage ? 'Thinner coverage than the observed average — the metric where lower is worse.' : 'Better covered than the observed average.',
    });
  rows.push({
    metric: 'After-tax operating margin %',
    company: c.afterTaxOperMarginPct,
    observed: b.afterTaxOperMarginPct,
    read: c.afterTaxOperMarginPct >= b.afterTaxOperMarginPct ? 'Above the observed average — now ask WHY (mix, pricing, scale) before trusting it to persist.' : 'Below the observed average — the §123 questions: price, volume, mix, input cost, utilization?',
  });
  rows.push({
    metric: 'Return on capital %',
    company: c.rocPct,
    observed: b.rocPct,
    read: c.rocPct >= b.rocPct ? 'Earning above the industry’s observed ROC — pair with WACC (tab 1): ROC above the observed average but below YOUR cost of capital still destroys value.' : 'Below the observed ROC — capital is earning less here than the industry typically manages.',
  });
  return { industry: b.industry, benchmarkType: 'OBSERVED_INDUSTRY_AVERAGE', source: BENCHMARK_SOURCE, rows };
}

/** The §123 discipline — the questions before any "is X good?" verdict. */
export const INDUSTRY_HEALTH_QUESTIONS: string[] = [
  'For what industry — and what subsector and business model?',
  'At what lifecycle stage? (biotech vs pharma is the same sector, different planet)',
  'Relative to which peers, at which percentile?',
  'At what point in the cycle, and at what interest rates?',
  'With what cash-flow stability, maturity schedule, and collateral?',
  'And what does the downside case do to it?',
];

// ---------------------------------------------------------------------------
// Vertical quick kits (spec §60–61, §65, §70)
// ---------------------------------------------------------------------------

export interface RunwayInputs {
  cash: number;
  marketableSecurities: number;
  monthlyBurn: number;
  monthsToNextCatalyst: number;
}

export const DEFAULT_RUNWAY_INPUTS: RunwayInputs = {
  cash: 40,
  marketableSecurities: 8,
  monthlyBurn: 2,
  monthsToNextCatalyst: 18,
};

export type RunwayBand = 'strong' | 'healthy' | 'monitor' | 'elevated' | 'high' | 'critical';

export interface RunwayResult {
  runwayMonths: number;
  band: RunwayBand;
  bandLabel: string;
  /** runway − months to catalyst: can you REACH the value-changing event? */
  catalystCoverageMonths: number;
  read: string;
}

/**
 * Runway = (cash + securities) ÷ monthly burn. Bands are the spec's
 * INTERNAL ANALYTICAL HEURISTIC (24+ strong · 18–24 healthy · 12–18 monitor
 * · 9–12 elevated · 6–9 high · <6 critical) — a heuristic, not a rule.
 * Catalyst coverage is the sharper question: runway MINUS months to the
 * next value-changing event — more informative than runway alone.
 */
export function biotechRunway(inp: RunwayInputs): RunwayResult {
  const runway = inp.monthlyBurn > 0 ? r1((inp.cash + inp.marketableSecurities) / inp.monthlyBurn) : 0;
  const band: RunwayBand =
    runway >= 24 ? 'strong' : runway >= 18 ? 'healthy' : runway >= 12 ? 'monitor' : runway >= 9 ? 'elevated' : runway >= 6 ? 'high' : 'critical';
  const labels: Record<RunwayBand, string> = {
    strong: 'strong flexibility (24m+)',
    healthy: 'healthy (18–24m)',
    monitor: 'monitor (12–18m)',
    elevated: 'elevated risk (9–12m)',
    high: 'high risk (6–9m)',
    critical: 'critical (<6m)',
  };
  const coverage = r1(runway - inp.monthsToNextCatalyst);
  return {
    runwayMonths: runway,
    band,
    bandLabel: labels[band] + ' — INTERNAL ANALYTICAL HEURISTIC',
    catalystCoverageMonths: coverage,
    read:
      coverage >= 6
        ? 'You reach the catalyst with cushion — you can choose WHEN to raise, which is most of the negotiating leverage.'
        : coverage >= 0
          ? 'You barely reach the catalyst — a delay forces a raise at the worst moment. Consider raising into strength now.'
          : 'You do NOT reach the catalyst on current burn — financing is not optional, and every month of waiting prices it worse.',
  };
}

export interface Rule40Inputs {
  revenueGrowthPct: number;
  /** Named profitability measure — the spec requires naming it. */
  fcfMarginPct: number;
}

export const DEFAULT_RULE40_INPUTS: Rule40Inputs = { revenueGrowthPct: 28, fcfMarginPct: 8 };

/** Rule of 40 = revenue growth % + FCF margin % (profitability measure: FCF margin). */
export function rule40(inp: Rule40Inputs): { score: number; passes: boolean; read: string } {
  const score = r1(inp.revenueGrowthPct + inp.fcfMarginPct);
  return {
    score,
    passes: score >= 40,
    read:
      score >= 40
        ? 'At or above 40 — the growth/profitability trade-off is earning its keep. (Profitability measure: FCF margin — always name it; Rule-of-40 claims with unnamed measures are not comparable.)'
        : 'Below 40 — growth is not covering the burn it costs. The fix is one of two levers, and knowing WHICH is the analysis.',
  };
}

export interface RetailInputs {
  cogs: number;
  averageInventory: number;
  grossMarginDollars: number;
  inventoryGrowthPct: number;
  revenueGrowthPct: number;
}

export const DEFAULT_RETAIL_INPUTS: RetailInputs = {
  cogs: 7_000_000,
  averageInventory: 1_600_000,
  grossMarginDollars: 3_000_000,
  inventoryGrowthPct: 14,
  revenueGrowthPct: 6,
};

export interface RetailResult {
  inventoryTurnover: number;
  gmroi: number;
  inventoryGrowthGapPct: number;
  read: string;
}

/**
 * Turnover = COGS ÷ avg inventory · GMROI = GM$ ÷ avg inventory cost ·
 * gap = inventory growth − revenue growth (a widening positive gap is the
 * classic markdown early-warning).
 */
export function retailKit(inp: RetailInputs): RetailResult {
  const gap = r1(inp.inventoryGrowthPct - inp.revenueGrowthPct);
  return {
    inventoryTurnover: inp.averageInventory > 0 ? r1(inp.cogs / inp.averageInventory) : 0,
    gmroi: inp.averageInventory > 0 ? r1(inp.grossMarginDollars / inp.averageInventory) : 0,
    inventoryGrowthGapPct: gap,
    read:
      gap > 5
        ? `Inventory growing ${gap}pp faster than revenue — stock is piling up ahead of demand: the markdown/shrink warning light. Same lesson as tab 2's cash conversion cycle, seen from the shelf.`
        : gap < -5
          ? 'Inventory growing well below revenue — efficient, until it becomes stockouts; check fill rates.'
          : 'Inventory tracking revenue — the gap is quiet.',
  };
}

/** The bank rule (spec §67): the one industry where the usual leverage math is wrong. */
export const BANK_METRICS_NOTE =
  'Banks: do NOT use Debt/EBITDA — leverage IS the business model. The right dashboard is ROA, ROE, NIM (net interest margin), efficiency ratio, NPLs and charge-offs, loans/deposits, deposit cost & beta, and the REGULATORY capital ratios (CET1, Tier 1, leverage ratio) — which are regulatory classifications, not peer averages. Sources: FDIC, Federal Reserve, OCC.';
