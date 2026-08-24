// Corporate Finance Lab — model layer.
//
// Three analyses, all deliberately transparent teaching models:
//   1. Capital allocation — given market conditions (the same four macro dials
//      as Market Scenarios), which use of capital clears its risk-adjusted
//      hurdle: M&A, new product, capacity, an AI platform, debt paydown,
//      buybacks, or waiting in T-bills.
//   2. Trade-credit underwriting — read a customer's financials, compute the
//      classic credit ratios (Debt/EBITDA, interest coverage, current ratio,
//      DSO/DIO/DPO → cash conversion cycle, margins), score them, and size a
//      credit limit against a requested amount (e.g. $1M of inventory).
//   3. Treasury playbook — which instruments fit the scenario: money market,
//      rate swaps, commodity forwards/futures, options, FX forwards.
//
// Education only; not investment, credit, or accounting advice.

import { MacroFactors } from './macroModel';

// ---------------------------------------------------------------------------
// 1a. Cost of capital (WACC via CAPM)
// ---------------------------------------------------------------------------

/** Fixed teaching assumptions, shown to the user in the guide. */
export const ERP = 5.5; // equity risk premium, %
export const TAX_RATE = 0.25; // marginal tax rate for the interest shield
export const DEBT_WEIGHT = 0.3; // target capital structure: 30% debt / 70% equity

export interface WaccInputs {
  /** Risk-free rate, % (10-yr Treasury proxy). */
  riskFree: number;
  /** Equity beta (unitless systematic risk). */
  beta: number;
  /** Credit spread over the risk-free rate for the company's debt, %. */
  creditSpread: number;
}

export const DEFAULT_WACC_INPUTS: WaccInputs = { riskFree: 4.0, beta: 1.1, creditSpread: 3.0 };

export interface WaccBreakdown {
  costEquity: number;
  costDebtPreTax: number;
  costDebtAfterTax: number;
  wacc: number;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** WACC = E/V·Re + D/V·Rd·(1−T), with Re from CAPM: Re = Rf + β·ERP. */
export function computeWacc(inp: WaccInputs): WaccBreakdown {
  const costEquity = inp.riskFree + inp.beta * ERP;
  const costDebtPreTax = inp.riskFree + inp.creditSpread;
  const costDebtAfterTax = costDebtPreTax * (1 - TAX_RATE);
  const wacc = (1 - DEBT_WEIGHT) * costEquity + DEBT_WEIGHT * costDebtAfterTax;
  return {
    costEquity: r1(costEquity),
    costDebtPreTax: r1(costDebtPreTax),
    costDebtAfterTax: r1(costDebtAfterTax),
    wacc: r1(wacc),
  };
}

// ---------------------------------------------------------------------------
// 1b. Capital-allocation options
// ---------------------------------------------------------------------------

export interface CapitalOption {
  id: string;
  name: string;
  desc: string;
  /** Expected annual return in a neutral market, %. */
  baseReturn: number;
  /** Extra hurdle over the base rate for this option's specific risk, pp. */
  premium: number;
  /** Rough life of the investment, years (for the NPV illustration). */
  years: number;
  /**
   * 'wacc': hurdle = company WACC + premium (risky operating uses).
   * 'safe': hurdle = risk-free + premium (near-guaranteed uses like
   *          paying down debt or sitting in T-bills).
   */
  hurdleMode: 'wacc' | 'safe';
  /** How the expected return shifts with the four macro dials, pp per unit. */
  sens: MacroFactors;
  driver: string;
}

export const CAPITAL_OPTIONS: CapitalOption[] = [
  {
    id: 'ma',
    name: 'M&A — acquire a competitor',
    desc: 'Buy market share, capacity, and synergies in one move.',
    baseReturn: 14,
    premium: 4,
    years: 7,
    hurdleMode: 'wacc',
    sens: { growth: -1, inflation: 0, policy: -1, fiscal: 0 },
    driver:
      'Targets are cheap in downturns and expensive at the top; rising rates make deal financing costlier. The premium covers integration risk — most deals fail on integration, not the spreadsheet.',
  },
  {
    id: 'product',
    name: 'Launch a new product line',
    desc: 'Organic growth: build it yourself and ride demand.',
    baseReturn: 16,
    premium: 6,
    years: 5,
    hurdleMode: 'wacc',
    sens: { growth: 2, inflation: -1, policy: -0.5, fiscal: 0.5 },
    driver:
      'Payoff follows consumer demand, so it swings with growth; inflation squeezes launch economics. The high premium reflects execution risk — many launches miss.',
  },
  {
    id: 'capacity',
    name: 'Expand capacity',
    desc: 'A new plant, warehouse, or line for what you already sell.',
    baseReturn: 12,
    premium: 3,
    years: 8,
    hurdleMode: 'wacc',
    sens: { growth: 2.5, inflation: 0, policy: -0.5, fiscal: 1 },
    driver:
      'Only pays if the demand shows up — the classic late-cycle trap is adding capacity right before a slowdown. Fiscal programs (infrastructure, incentives) sweeten it.',
  },
  {
    id: 'ai',
    name: 'Acquire an AI platform',
    desc: 'Buy technology and talent instead of building for years.',
    baseReturn: 18,
    premium: 8,
    years: 5,
    hurdleMode: 'wacc',
    sens: { growth: 1, inflation: 0, policy: -2, fiscal: 0 },
    driver:
      'Long-duration payoff: most of the value is far in the future, so rate moves swing it hardest. A 30% task-time saving is not a 30% cost saving — model adoption, not the demo.',
  },
  {
    id: 'paydebt',
    name: 'Pay down debt',
    desc: 'Retire borrowings and pocket the interest you stop paying.',
    baseReturn: 7,
    premium: 1,
    years: 5,
    hurdleMode: 'safe',
    sens: { growth: 0, inflation: 0, policy: 1, fiscal: 0 },
    driver:
      'A guaranteed return equal to your borrowing cost — no execution risk at all. Worth more when rates rise and refinancing gets expensive.',
  },
  {
    id: 'buyback',
    name: 'Return capital (buyback / dividend)',
    desc: 'Give the cash back and let shareholders redeploy it.',
    baseReturn: 9,
    premium: 1,
    years: 5,
    hurdleMode: 'wacc',
    sens: { growth: 1, inflation: -0.5, policy: -0.5, fiscal: 0 },
    driver:
      'Earns roughly the market return on your own shares. The honest benchmark: if nothing internal beats the hurdle, returning capital IS the disciplined move.',
  },
  {
    id: 'wait',
    name: 'Wait — hold T-bills',
    desc: 'Keep dry powder and buy optionality.',
    baseReturn: 4,
    premium: 1,
    years: 1,
    hurdleMode: 'safe',
    sens: { growth: -0.75, inflation: -1, policy: 0.75, fiscal: 0 },
    driver:
      'Cash pays the Fed’s rate and holds its option value for the moment assets get cheap — but inflation quietly taxes it while you wait.',
  },
];

export type OptionVerdict = 'go' | 'marginal' | 'no';

export interface OptionResult {
  id: string;
  name: string;
  desc: string;
  driver: string;
  years: number;
  expReturn: number;
  hurdle: number;
  spread: number;
  npv: number;
  verdict: OptionVerdict;
}

/**
 * NPV illustration: the capital works for `years` earning `expReturn` annually
 * and comes back at the end, discounted at the risk-adjusted hurdle:
 *   NPV = Σ C·r/(1+h)^t + C/(1+h)^N − C
 * Positive exactly when the expected return beats the hurdle.
 */
export function optionNpv(capital: number, expReturnPct: number, hurdlePct: number, years: number): number {
  const r = expReturnPct / 100;
  const h = hurdlePct / 100;
  let npv = -capital;
  for (let t = 1; t <= years; t++) npv += (capital * r) / Math.pow(1 + h, t);
  npv += capital / Math.pow(1 + h, years);
  return Math.round(npv) || 0; // `|| 0` normalizes float noise's -0 to 0

}

export function evaluateOption(
  opt: CapitalOption,
  wacc: WaccBreakdown,
  inputs: WaccInputs,
  f: MacroFactors,
  capital: number,
): OptionResult {
  const expReturn = r1(
    opt.baseReturn +
      opt.sens.growth * f.growth +
      opt.sens.inflation * f.inflation +
      opt.sens.policy * f.policy +
      opt.sens.fiscal * f.fiscal,
  );
  const base = opt.hurdleMode === 'wacc' ? wacc.wacc : inputs.riskFree;
  const hurdle = r1(base + opt.premium);
  const spread = r1(expReturn - hurdle);
  const verdict: OptionVerdict = spread >= 1 ? 'go' : spread > -1 ? 'marginal' : 'no';
  return {
    id: opt.id,
    name: opt.name,
    desc: opt.desc,
    driver: opt.driver,
    years: opt.years,
    expReturn,
    hurdle,
    spread,
    npv: optionNpv(capital, expReturn, hurdle, opt.years),
    verdict,
  };
}

/** Evaluate every option, best spread first. */
export function evaluateAllOptions(
  inputs: WaccInputs,
  f: MacroFactors,
  capital: number,
): OptionResult[] {
  const wacc = computeWacc(inputs);
  return CAPITAL_OPTIONS.map((o) => evaluateOption(o, wacc, inputs, f, capital)).sort(
    (a, b) => b.spread - a.spread,
  );
}

// ---------------------------------------------------------------------------
// 2. Trade-credit underwriting
// ---------------------------------------------------------------------------

export interface CustomerFinancials {
  /** Annual figures, $. */
  revenue: number;
  cogs: number;
  ebitda: number;
  interest: number;
  totalDebt: number;
  cash: number;
  currentAssets: number;
  currentLiabilities: number;
  ar: number;
  inventory: number;
  ap: number;
}

export type Band = 'good' | 'watch' | 'risk';

export interface CreditMetric {
  id: string;
  label: string;
  /** Raw numeric value (NaN when not meaningful). */
  value: number;
  /** Human display, e.g. "3.4×" or "66 days". */
  display: string;
  band: Band;
  /** What good looks like, shown in the UI. */
  benchmark: string;
  why: string;
}

const bandOf = (v: number, good: (v: number) => boolean, watch: (v: number) => boolean): Band =>
  Number.isFinite(v) ? (good(v) ? 'good' : watch(v) ? 'watch' : 'risk') : 'risk';

export function computeCreditMetrics(fin: CustomerFinancials): CreditMetric[] {
  const safeDiv = (a: number, b: number) => (b > 0 ? a / b : NaN);

  const margin = safeDiv(fin.ebitda, fin.revenue) * 100;
  const leverage = fin.ebitda > 0 ? fin.totalDebt / fin.ebitda : NaN;
  const coverage = fin.interest > 0 ? fin.ebitda / fin.interest : fin.ebitda > 0 ? 99 : NaN;
  const current = safeDiv(fin.currentAssets, fin.currentLiabilities);
  const dso = safeDiv(fin.ar, fin.revenue) * 365;
  const dio = safeDiv(fin.inventory, fin.cogs) * 365;
  const dpo = safeDiv(fin.ap, fin.cogs) * 365;
  const ccc = dso + dio - dpo;

  const days = (v: number) => (Number.isFinite(v) ? `${Math.round(v)} days` : '—');
  const times = (v: number) => (Number.isFinite(v) ? `${(Math.round(v * 10) / 10).toFixed(1)}×` : 'n/m');

  return [
    {
      id: 'coverage',
      label: 'Interest coverage',
      value: coverage,
      display: times(coverage),
      band: bandOf(coverage, (v) => v >= 5, (v) => v >= 2.5),
      benchmark: '≥5× comfortable · <2.5× strained',
      why: 'EBITDA ÷ interest expense — how many times operating profit covers the interest bill. Their lenders get paid before you do.',
    },
    {
      id: 'leverage',
      label: 'Debt / EBITDA',
      value: leverage,
      display: times(leverage),
      band: bandOf(leverage, (v) => v <= 2, (v) => v <= 4),
      benchmark: '≤2× conservative · >4× heavy',
      why: 'Years of operating profit needed to repay all debt. Heavy leverage means little cushion when sales dip.',
    },
    {
      id: 'current',
      label: 'Current ratio',
      value: current,
      display: times(current),
      band: bandOf(current, (v) => v >= 1.5, (v) => v >= 1.1),
      benchmark: '≥1.5 healthy · <1.1 tight',
      why: 'Current assets ÷ current liabilities — can they pay the bills due this year, including yours?',
    },
    {
      id: 'margin',
      label: 'EBITDA margin',
      value: margin,
      display: Number.isFinite(margin) ? `${margin.toFixed(1)}%` : '—',
      band: bandOf(margin, (v) => v >= 15, (v) => v >= 8),
      benchmark: '≥15% strong · <8% thin',
      why: 'Operating profit per dollar of sales. Thin margins mean one bad quarter erases the ability to pay.',
    },
    {
      id: 'dso',
      label: 'DSO (they collect in…)',
      value: dso,
      display: days(dso),
      band: bandOf(dso, (v) => v <= 50, (v) => v <= 75),
      benchmark: '≤50d healthy · >75d slow',
      why: 'AR ÷ revenue × 365 — how fast their own customers pay them. Your invoice waits in that same line.',
    },
    {
      id: 'ccc',
      label: 'Cash conversion cycle',
      value: ccc,
      display: days(ccc),
      band: bandOf(ccc, (v) => v <= 65, (v) => v <= 100),
      benchmark: '≤65d efficient · >100d cash-hungry',
      why: 'DSO + DIO − DPO — days their cash is tied up between paying suppliers and collecting from customers. Longer than your terms means they are funding operations with your money.',
    },
  ];
}

const SCORE_WEIGHTS: Record<string, number> = {
  coverage: 25,
  leverage: 20,
  current: 15,
  margin: 10,
  dso: 15,
  ccc: 15,
};
const BAND_POINTS: Record<Band, number> = { good: 100, watch: 60, risk: 20 };

/** Weighted 0–100 credit score from the metric bands. */
export function creditScore(metrics: CreditMetric[]): number {
  let total = 0;
  for (const m of metrics) total += (SCORE_WEIGHTS[m.id] ?? 0) * (BAND_POINTS[m.band] / 100);
  return Math.round(total);
}

export type CreditDecision = 'approve' | 'conditional' | 'decline';

export interface CreditResult {
  score: number;
  decision: CreditDecision;
  /** Recommended limit, $ (0 on decline). */
  limit: number;
  cashCap: number;
  liquidityCap: number;
  termsFactor: number;
  reasons: string[];
}

export const TERMS_FACTORS: Record<number, number> = { 30: 1, 60: 0.75, 90: 0.6 };

/**
 * Size the credit line two ways and take the smaller:
 *   cash-flow cap  = 30% × (EBITDA − interest) × terms factor
 *   liquidity cap  = 20% × (working capital + cash) × terms factor
 * Then gate by score: ≥70 approve up to the cap; 45–69 approve half the cap
 * with security; <45 decline (offer prepay/COD).
 */
export function assessCredit(
  requested: number,
  termsDays: number,
  fin: CustomerFinancials,
): CreditResult {
  const metrics = computeCreditMetrics(fin);
  const score = creditScore(metrics);
  const termsFactor = TERMS_FACTORS[termsDays] ?? 1;

  const cashCap = Math.max(0, 0.3 * (fin.ebitda - fin.interest) * termsFactor);
  const liquidityCap = Math.max(
    0,
    0.2 * (fin.currentAssets - fin.currentLiabilities + fin.cash) * termsFactor,
  );
  const cap = Math.min(cashCap, liquidityCap);
  const round25k = (v: number) => Math.round(v / 25_000) * 25_000;

  const reasons: string[] = [];
  let decision: CreditDecision;
  let limit: number;

  if (score >= 70) {
    decision = 'approve';
    limit = round25k(Math.min(requested, cap));
    reasons.push('Strong ratios across the board — normal trade terms are appropriate.');
    if (limit < requested)
      reasons.push('Capped below the request by their cash-flow / liquidity capacity — grow the line as they pay on time.');
  } else if (score >= 45) {
    decision = 'conditional';
    limit = round25k(Math.min(requested, cap) * 0.5);
    reasons.push('Mixed ratios — extend half the computed capacity, and require security (deposit, letter of credit, or a personal guarantee).');
    reasons.push('Re-review after 2 quarters of on-time payments before increasing the line.');
  } else {
    decision = 'decline';
    limit = 0;
    reasons.push('Ratios point to real repayment risk — require prepayment or COD instead of open terms.');
    reasons.push('Revisit if coverage and liquidity improve for two consecutive quarters.');
  }

  if (termsFactor < 1)
    reasons.push(`Net ${termsDays} terms leave you exposed longer, so capacity is scaled to ${termsFactor * 100}%.`);

  return { score, decision, limit, cashCap: Math.round(cashCap), liquidityCap: Math.round(liquidityCap), termsFactor, reasons };
}

export interface SampleCustomer {
  id: string;
  name: string;
  desc: string;
  fin: CustomerFinancials;
}

export const SAMPLE_CUSTOMERS: SampleCustomer[] = [
  {
    id: 'strong',
    name: 'Northline Distributors',
    desc: 'Established, profitable, lightly levered.',
    fin: {
      revenue: 20_000_000,
      cogs: 12_000_000,
      ebitda: 4_000_000,
      interest: 300_000,
      totalDebt: 4_000_000,
      cash: 3_000_000,
      currentAssets: 8_000_000,
      currentLiabilities: 3_500_000,
      ar: 2_500_000,
      inventory: 2_000_000,
      ap: 1_500_000,
    },
  },
  {
    id: 'average',
    name: 'Mesa Supply Co.',
    desc: 'Growing but working-capital hungry.',
    fin: {
      revenue: 10_000_000,
      cogs: 7_000_000,
      ebitda: 1_200_000,
      interest: 350_000,
      totalDebt: 3_500_000,
      cash: 800_000,
      currentAssets: 4_500_000,
      currentLiabilities: 3_000_000,
      ar: 1_800_000,
      inventory: 1_600_000,
      ap: 1_400_000,
    },
  },
  {
    id: 'risky',
    name: 'Quarry & Vine LLC',
    desc: 'Thin margins, heavy debt, slow collections.',
    fin: {
      revenue: 6_000_000,
      cogs: 4_800_000,
      ebitda: 350_000,
      interest: 300_000,
      totalDebt: 2_800_000,
      cash: 200_000,
      currentAssets: 3_600_000,
      currentLiabilities: 3_400_000,
      ar: 1_500_000,
      inventory: 1_800_000,
      ap: 1_600_000,
    },
  },
];

// ---------------------------------------------------------------------------
// 3. Treasury & hedging playbook
// ---------------------------------------------------------------------------

export type FitLevel = 'fit' | 'neutral' | 'avoid';

export interface TreasuryFit {
  level: FitLevel;
  reason: string;
}

export interface TreasuryInstrument {
  id: string;
  name: string;
  what: string;
  example: string;
  fit: (f: MacroFactors) => TreasuryFit;
}

export const TREASURY_INSTRUMENTS: TreasuryInstrument[] = [
  {
    id: 'mmf',
    name: 'Money market funds / T-bills',
    what: 'Park operating cash in short-term government paper — liquid next day, earns the Fed’s rate.',
    example: '$2M of idle cash at a 4% money-market yield earns ~$80,000/yr vs. ~$0 in checking.',
    fit: (f) =>
      f.policy > 0
        ? { level: 'fit', reason: 'Rates are rising — short-term yields follow the Fed up within days, and you stay liquid.' }
        : f.policy < 0
          ? { level: 'neutral', reason: 'Cuts are coming — yields will melt as the Fed eases. Fine for liquidity, but consider locking some cash further out.' }
          : { level: 'fit', reason: 'Rates are holding at a decent level — earn it on every idle dollar while staying liquid.' },
  },
  {
    id: 'ladder',
    name: 'Lock in yields (T-note ladder / term deposits)',
    what: 'Commit part of the cash for 1–3 years at today’s fixed rates.',
    example: 'Ladder $1M across 6/12/24-month notes: if the Fed cuts 2%, the locked rungs keep earning today’s rate.',
    fit: (f) =>
      f.policy < 0
        ? { level: 'fit', reason: 'The Fed is easing — lock today’s yields before they disappear.' }
        : f.policy > 0
          ? { level: 'avoid', reason: 'Rates are still rising — locking now means missing the higher yields ahead.' }
          : { level: 'neutral', reason: 'Rates on hold — ladder only the cash you won’t need soon.' },
  },
  {
    id: 'payfixed',
    name: 'Interest-rate swap — pay fixed',
    what: 'Trade the floating rate on your debt for a known fixed rate.',
    example: '$1M loan at SOFR+2% swapped to 5.5% fixed: if rates rise 1%, the swap saves ~$10,000/yr (notional × Δrate).',
    fit: (f) =>
      f.policy > 0
        ? { level: 'fit', reason: 'Tightening cycle — fix your floating-rate debt before each hike raises your interest bill.' }
        : f.policy < 0
          ? { level: 'avoid', reason: 'The Fed is cutting — you’d lock in a high rate right before your floating rate falls on its own.' }
          : { level: 'neutral', reason: 'On hold — swap only if budget certainty matters more than the swap’s cost.' },
  },
  {
    id: 'commodity',
    name: 'Commodity futures / forwards on inventory',
    what: 'Lock the purchase price of the raw materials you’ll need next season.',
    example: 'You need 100k lbs of input in 6 months. A forward at $2.10/lb makes your cost $210,000 — certain — even if spot hits $2.60.',
    fit: (f) =>
      f.inflation > 0
        ? { level: 'fit', reason: 'Inflation is running — lock input costs now, before your suppliers reprice.' }
        : f.inflation < 0
          ? { level: 'avoid', reason: 'Prices are falling — a hedge would lock in today’s HIGH cost and hand the savings to the counterparty.' }
          : { level: 'neutral', reason: 'Stable prices — hedge only your largest committed orders.' },
  },
  {
    id: 'options',
    name: 'Options (caps, collars, protective puts)',
    what: 'Pay a premium for insurance: a known worst case with the upside kept.',
    example: 'A $30,000 premium caps your input cost at $2.30/lb. If spot drops to $1.80, you buy cheap and only lose the premium.',
    fit: (f) => {
      const uncertainty = Math.abs(f.growth) + Math.abs(f.inflation) + Math.abs(f.policy);
      return uncertainty >= 3
        ? { level: 'fit', reason: 'High-uncertainty scenario — direction is unclear, so pay for a floor/ceiling and keep the upside.' }
        : { level: 'neutral', reason: 'Calm conditions — insurance still works, but the premium buys less peace of mind.' };
    },
  },
  {
    id: 'fx',
    name: 'FX forwards',
    what: 'Lock today’s exchange rate for invoices you’ll pay or receive in foreign currency.',
    example: 'A €500,000 supplier invoice due in 90 days, forward-locked at $1.09/€, costs exactly $545,000 whatever the euro does.',
    fit: () => ({
      level: 'neutral',
      reason: 'Direction-agnostic: hedge whenever you have committed foreign-currency invoices — the goal is certainty, not a currency bet.',
    }),
  },
];
