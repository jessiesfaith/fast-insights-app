// Real estate financing — the model layer behind tab 12.
//
// The two transmission models from the master spec, deterministic-first:
//
// RESIDENTIAL: a 30-year fixed mortgage is NOT "Fed funds + spread" and NOT
// best modeled as "30Y Treasury + spread" just because it amortizes over 30
// years. Because homeowners can prepay/refinance, its effective duration is
// far shorter — so the study benchmark is the 10-YEAR TREASURY + the
// observed mortgage/MBS spread (Freddie Mac PMMS vs same-day 10Y CMT —
// labeled a SIMPLE OBSERVED SPREAD, not an MBS option-adjusted spread).
//
// COMMERCIAL: floating-rate CRE prices off SOFR + lender spread; fixed-rate
// CRE prices off the 5/7/10-year Treasury (matched to the loan term) + a
// property/borrower credit spread. Never pick the benchmark maturity without
// saying why.
//
// Data anchors: Freddie Mac PMMS 6.65% (2026-08-20) vs 10Y CMT 4.69% same
// day → 196bp simple spread; SOFR ≈3.65% (tracks the funds rate).
// Education only; not investment or lending advice.

import { RATES_SNAPSHOT, mortgageTreasurySpreadBp } from './ratesCurve';

const r2 = (n: number) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// Residential: the mortgage formula and the monthly payment
// ---------------------------------------------------------------------------

export interface MortgageBenchmark {
  mortgagePct: number;
  ust10Pct: number;
  spreadBp: number;
  note: string;
}

/** The dashboard read: mortgage vs 10Y, spread computed — never eyeballed. */
export function mortgageBenchmark(): MortgageBenchmark {
  return {
    mortgagePct: RATES_SNAPSHOT.mortgage30Pct,
    ust10Pct: RATES_SNAPSHOT.ust10AlignedPct,
    spreadBp: mortgageTreasurySpreadBp(),
    note:
      'SIMPLE OBSERVED MORTGAGE-TO-10Y-TREASURY SPREAD (weekly PMMS vs same-day 10Y CMT — different constructions, aligned by date). NOT an MBS option-adjusted spread. Useful as a dashboard measure of how mortgage pricing behaves relative to the Treasury market.',
  };
}

export interface PaymentInputs {
  /** Loan principal, $. */
  principal: number;
  /** Annual rate, %. */
  ratePct: number;
  /** Term in years. */
  years: number;
}

export const DEFAULT_PAYMENT_INPUTS: PaymentInputs = {
  principal: 400_000,
  ratePct: RATES_SNAPSHOT.mortgage30Pct,
  years: 30,
};

/** The amortizing payment: P·r(1+r)^n / ((1+r)^n − 1), r monthly, n months. */
export function monthlyPayment(inp: PaymentInputs): number {
  const r = inp.ratePct / 100 / 12;
  const n = inp.years * 12;
  if (r <= 0) return r2(inp.principal / n);
  const f = Math.pow(1 + r, n);
  return r2((inp.principal * r * f) / (f - 1));
}

export interface PaymentScenario {
  label: string;
  ratePct: number;
  payment: number;
  /** vs the base payment, $/month. */
  delta: number;
}

/** The spec's mandatory sensitivity: base, ±100bp, ±200bp. */
export function paymentSensitivity(inp: PaymentInputs): PaymentScenario[] {
  const base = monthlyPayment(inp);
  return [-2, -1, 0, 1, 2].map((d) => {
    const ratePct = r2(inp.ratePct + d);
    const payment = monthlyPayment({ ...inp, ratePct });
    return {
      label: d === 0 ? `today (${ratePct}%)` : `${d > 0 ? '+' : ''}${d * 100}bp (${ratePct}%)`,
      ratePct,
      payment,
      delta: r2(payment - base),
    };
  });
}

export interface AffordabilityInputs {
  monthlyPI: number;
  monthlyTaxesInsHoa: number;
  grossMonthlyIncome: number;
}

/** Housing payment ÷ gross income — an analytical ratio, NOT a lending rule. */
export function housingPaymentRatioPct(inp: AffordabilityInputs): number {
  if (inp.grossMonthlyIncome <= 0) return 0;
  return r2(((inp.monthlyPI + inp.monthlyTaxesInsHoa) / inp.grossMonthlyIncome) * 100);
}

/** The residential transmission chain (spec §31). */
export const RESI_TRANSMISSION: string[] = [
  'Inflation expectations ↑ (or Treasury supply ↑, or term premium ↑)',
  '→ 10-year Treasury yield ↑',
  '→ MBS investors demand more yield ↑',
  '→ mortgage rate ↑ (10Y + spread)',
  '→ monthly payment ↑ (the calculator below shows exactly how much)',
  '→ affordability ↓ → demand pressure ↓ → transactions, construction, prices',
];

// ---------------------------------------------------------------------------
// Commercial real estate: floating vs fixed, KPIs, and the stress test
// ---------------------------------------------------------------------------

export interface CreBenchmark {
  kind: 'floating' | 'fixed';
  formula: string;
  benchmark: string;
  why: string;
}

export const CRE_BENCHMARKS: CreBenchmark[] = [
  {
    kind: 'floating',
    formula: `loan rate = SOFR (≈${RATES_SNAPSHOT.sofrPct}%) + lender spread`,
    benchmark: 'SOFR — overnight Treasury-collateralized borrowing; a fundamentally different rate from a bond yield',
    why: 'Floating loans reprice with the Fed within days — every hike lands on the debt service almost immediately (subject to floors/caps).',
  },
  {
    kind: 'fixed',
    formula: 'loan rate = 5Y / 7Y / 10Y Treasury + property & borrower credit spread',
    benchmark: 'The Treasury tenor MATCHED to the loan term — a 7-year fixed loan prices off the 7Y, not the 30Y',
    why: 'Fixed loans lock the benchmark at closing; the risk moves to the refinancing date. Never pick the benchmark maturity without saying why.',
  },
];

export interface CreInputs {
  /** Net operating income, $/yr. */
  noi: number;
  /** Property value, $. */
  propertyValue: number;
  /** Loan balance, $. */
  loanBalance: number;
  /** All-in loan rate, %. */
  loanRatePct: number;
  /** Amortization years (interest-only = 0). */
  amortYears: number;
}

export const DEFAULT_CRE_INPUTS: CreInputs = {
  noi: 1_000_000,
  propertyValue: 16_000_000,
  loanBalance: 10_000_000,
  loanRatePct: 6.5,
  amortYears: 30,
};

export interface CreKpis {
  capRatePct: number;
  annualDebtService: number;
  dscr: number;
  ltvPct: number;
  debtYieldPct: number;
}

/** The core CRE dashboard: cap rate, DSCR, LTV, debt yield — all computed. */
export function creKpis(inp: CreInputs): CreKpis {
  const annualDebtService =
    inp.amortYears > 0
      ? monthlyPayment({ principal: inp.loanBalance, ratePct: inp.loanRatePct, years: inp.amortYears }) * 12
      : (inp.loanBalance * inp.loanRatePct) / 100;
  return {
    capRatePct: inp.propertyValue > 0 ? r2((inp.noi / inp.propertyValue) * 100) : 0,
    annualDebtService: Math.round(annualDebtService),
    dscr: annualDebtService > 0 ? r2(inp.noi / annualDebtService) : 0,
    ltvPct: inp.propertyValue > 0 ? r2((inp.loanBalance / inp.propertyValue) * 100) : 0,
    debtYieldPct: inp.loanBalance > 0 ? r2((inp.noi / inp.loanBalance) * 100) : 0,
  };
}

export interface CreStressRow {
  label: string;
  loanRatePct: number;
  annualDebtService: number;
  dscr: number;
}

/** The mandatory rate stress: today, +100, +200, +300bp — DSCR recomputed. */
export function creRateStress(inp: CreInputs): CreStressRow[] {
  return [0, 1, 2, 3].map((d) => {
    const k = creKpis({ ...inp, loanRatePct: r2(inp.loanRatePct + d) });
    return {
      label: d === 0 ? `today (${inp.loanRatePct}%)` : `+${d * 100}bp (${r2(inp.loanRatePct + d)}%)`,
      loanRatePct: r2(inp.loanRatePct + d),
      annualDebtService: k.annualDebtService,
      dscr: k.dscr,
    };
  });
}

export interface CapRateRow {
  capRatePct: number;
  value: number;
}

/** Value = NOI ÷ cap rate — the spec's $1M NOI at 5% = $20M, 6% = $16.67M. */
export function capRateSensitivity(noi: number, capRatesPct: number[] = [4.5, 5, 5.5, 6, 6.5, 7]): CapRateRow[] {
  return capRatesPct.map((c) => ({ capRatePct: c, value: Math.round(noi / (c / 100)) }));
}

/** The CRE transmission chain (spec §39). */
export const CRE_TRANSMISSION: string[] = [
  'Rates ↑ → debt cost ↑ → debt service ↑ → DSCR ↓ (the stress table shows it)',
  '→ buyers can carry less leverage → required equity ↑ → transaction demand ↓',
  '→ cap rate pressure ↑ → property value ↓ (value = NOI ÷ cap rate)',
  '→ LTV ↑ on the same loan → refinancing risk ↑ → credit spreads may widen further',
];

/** The decision reads — what each number tells you to DO. */
export const RE_DECISION_READS: { metric: string; read: string }[] = [
  { metric: 'Mortgage−10Y spread (196bp today)', read: 'Wide spread + falling 10Y = the refi window forming; spread compression is extra rate relief no Fed meeting will announce.' },
  { metric: 'DSCR', read: 'Below ~1.25× lenders get nervous; the stress table shows how many basis points of repricing you can absorb before the property stops covering its debt.' },
  { metric: 'Cap rate vs your fixed loan rate', read: 'Cap rate below the loan rate = negative leverage — the debt costs more than the property yields; the deal only works if NOI grows.' },
  { metric: 'Debt yield', read: 'The lender’s crash-test: NOI ÷ loan, ignoring today’s rates entirely. Below ~8–10% (lender-specific), proceeds get cut.' },
  { metric: 'Floating vs fixed mix', read: 'Same logic as tab 3’s debt book: floating reprices in days (SOFR), fixed reprices at maturity — the choice is WHEN you want the rate risk, not whether.' },
];
