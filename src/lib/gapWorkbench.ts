// Gap workbench — the model layer behind tab 11 of the Corporate Finance
// Lab. Working mini-calculators for every item the EY gap check (tab 8)
// previously listed as knowledge-only, plus the drills from the user's
// ChatGPT prep session — using THAT SESSION'S exact worked numbers as the
// defaults wherever it gave them:
//
//   - IRR & NPV lab (invest 100 → 40/50/50 ⇒ IRR ≈ 18.8%)
//   - Beta workshop: unlever 1.4 at 300/700 ⇒ 1.06 → relever at 20/80 ⇒ 1.26
//   - Risk-adjusted hurdle builder (project beta 1.4 + 2% country risk)
//     and rNPV (30% × $300M ⇒ $90M expected)
//   - Incremental ROIC vs WACC (15 ÷ 100 = 15% vs 9%)
//   - PPA (ASC 805) and goodwill impairment (ASC 350)
//   - Trading vs precedent comps (the control premium) + the cost approach
//   - LBO mini-model with the returns attribution
//   - Accretion / dilution
//   - Operator quick kit: break-even and CAGR
//
// Education only; not investment, accounting, or tax advice.

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// 1. IRR & NPV lab
// ---------------------------------------------------------------------------

export interface IrrInputs {
  /** Year-0 outflow, entered positive, $. */
  investment: number;
  /** Inflows years 1–5 (0 = none), $. */
  inflows: [number, number, number, number, number];
  /** Required return / hurdle for the NPV, %. */
  hurdlePct: number;
}

/** The ChatGPT session's example: −100 → 40/50/50 ⇒ IRR ≈ 18.8%. */
export const DEFAULT_IRR_INPUTS: IrrInputs = {
  investment: 100,
  inflows: [40, 50, 50, 0, 0],
  hurdlePct: 10,
};

export interface IrrResult {
  /** IRR %, or null when the cash flows never break even. */
  irrPct: number | null;
  /** NPV at the hurdle, $. */
  npv: number;
  /** First year cumulative inflows cover the investment (null if never). */
  paybackYears: number | null;
}

function npvAt(inv: number, flows: number[], rate: number): number {
  let v = -inv;
  flows.forEach((cf, i) => {
    v += cf / Math.pow(1 + rate, i + 1);
  });
  return v;
}

/** Solve IRR by bisection: the rate where NPV = 0. */
export function irrLab(inp: IrrInputs): IrrResult {
  const flows = inp.inflows;
  const npv = r2(npvAt(inp.investment, flows, inp.hurdlePct / 100));

  let paybackYears: number | null = null;
  let cum = 0;
  for (let i = 0; i < flows.length; i++) {
    cum += flows[i];
    if (cum >= inp.investment) {
      paybackYears = i + 1;
      break;
    }
  }

  let irrPct: number | null = null;
  let lo = -0.9999;
  let hi = 10;
  if (inp.investment > 0 && npvAt(inp.investment, flows, lo) > 0 && npvAt(inp.investment, flows, hi) < 0) {
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (npvAt(inp.investment, flows, mid) > 0) lo = mid;
      else hi = mid;
    }
    irrPct = r1(((lo + hi) / 2) * 100);
  }

  return { irrPct, npv, paybackYears };
}

// ---------------------------------------------------------------------------
// 2. Beta workshop: unlever → relever → CAPM
// ---------------------------------------------------------------------------

export interface BetaInputs {
  /** Comparable company's observed (levered) equity beta. */
  peerLeveredBeta: number;
  peerDebt: number;
  peerEquity: number;
  taxPct: number;
  /** Target capital structure for the company being valued. */
  targetDebtPct: number;
  riskFreePct: number;
  erpPct: number;
}

/** The session's example: 1.4 at 300/700 → βU 1.06 → 20/80 → βL 1.26. */
export const DEFAULT_BETA_INPUTS: BetaInputs = {
  peerLeveredBeta: 1.4,
  peerDebt: 300,
  peerEquity: 700,
  taxPct: 25,
  targetDebtPct: 20,
  riskFreePct: 4,
  erpPct: 5.5,
};

export interface BetaResult {
  unleveredBeta: number;
  releveredBeta: number;
  /** CAPM cost of equity with the relevered beta, %. */
  costOfEquityPct: number;
}

/**
 * βU = βL ÷ [1 + (1−T)·D/E] strips the comparable's financing out of its
 * beta; relevering applies YOUR sustainable structure: βL = βU·[1+(1−T)·D/E].
 */
export function betaWorkshop(inp: BetaInputs): BetaResult {
  const t = inp.taxPct / 100;
  const peerDE = inp.peerEquity > 0 ? inp.peerDebt / inp.peerEquity : 0;
  const unlevered = inp.peerLeveredBeta / (1 + (1 - t) * peerDE);
  const targetDE = inp.targetDebtPct < 100 ? inp.targetDebtPct / (100 - inp.targetDebtPct) : 0;
  const relevered = unlevered * (1 + (1 - t) * targetDE);
  const costOfEquity = inp.riskFreePct + relevered * inp.erpPct;
  return {
    unleveredBeta: r2(unlevered),
    releveredBeta: r2(relevered),
    costOfEquityPct: r1(costOfEquity),
  };
}

// ---------------------------------------------------------------------------
// 3. Risk-adjusted hurdle builder + rNPV
// ---------------------------------------------------------------------------

export interface HurdleInputs {
  riskFreePct: number;
  projectBeta: number;
  erpPct: number;
  /** Country risk premium, pp (0 for domestic). */
  countryRiskPct: number;
  /** Project financing: share of debt, %. */
  debtPct: number;
  /** Project-specific pre-tax cost of debt, %. */
  costOfDebtPct: number;
  taxPct: number;
}

/** The session's build: beta 1.4, +2% country risk → Re 13.7% → hurdle ~11.6%. */
export const DEFAULT_HURDLE_INPUTS: HurdleInputs = {
  riskFreePct: 4,
  projectBeta: 1.4,
  erpPct: 5.5,
  countryRiskPct: 2,
  debtPct: 30,
  costOfDebtPct: 9,
  taxPct: 25,
};

export interface HurdleResult {
  costOfEquityPct: number;
  afterTaxDebtPct: number;
  /** The project-specific WACC — the risk-adjusted hurdle, %. */
  hurdlePct: number;
}

/** Re = Rf + β·ERP + CRP; hurdle = project WACC at the project's own mix. */
export function hurdleBuilder(inp: HurdleInputs): HurdleResult {
  const re = inp.riskFreePct + inp.projectBeta * inp.erpPct + inp.countryRiskPct;
  const rdAfter = inp.costOfDebtPct * (1 - inp.taxPct / 100);
  const w = inp.debtPct / 100;
  return {
    costOfEquityPct: r1(re),
    afterTaxDebtPct: r1(rdAfter),
    hurdlePct: r1((1 - w) * re + w * rdAfter),
  };
}

export interface RnpvInputs {
  /** Probability of success, %. */
  successPct: number;
  /** Payoff if it works, $. */
  payoff: number;
}

/** The session's rNPV seed: 30% × $300M ⇒ $90M expected. */
export const DEFAULT_RNPV_INPUTS: RnpvInputs = { successPct: 30, payoff: 300 };

/** Probability-adjusted expected cash flow — the rNPV building block. */
export function expectedPayoff(inp: RnpvInputs): number {
  return r2((inp.successPct / 100) * inp.payoff);
}

// ---------------------------------------------------------------------------
// 4. Incremental ROIC vs WACC
// ---------------------------------------------------------------------------

export interface RoicInputs {
  /** Incremental NOPAT the investment produces annually, $. */
  deltaNopat: number;
  /** Incremental invested capital, $. */
  deltaCapital: number;
  waccPct: number;
}

/** The session's example: 15 ÷ 100 = 15% against a 9% WACC. */
export const DEFAULT_ROIC_INPUTS: RoicInputs = { deltaNopat: 15, deltaCapital: 100, waccPct: 9 };

export interface RoicResult {
  roicPct: number;
  spreadPct: number;
  creatingValue: boolean;
}

/** Incremental ROIC = ΔNOPAT ÷ Δinvested capital; value needs ROIC > WACC. */
export function incrementalRoic(inp: RoicInputs): RoicResult {
  const roic = inp.deltaCapital > 0 ? (inp.deltaNopat / inp.deltaCapital) * 100 : 0;
  return { roicPct: r1(roic), spreadPct: r1(roic - inp.waccPct), creatingValue: roic > inp.waccPct };
}

// ---------------------------------------------------------------------------
// 5. PPA (ASC 805) and goodwill impairment (ASC 350)
// ---------------------------------------------------------------------------

export interface PpaInputs {
  purchasePrice: number;
  tangiblesFV: number;
  intangiblesFV: number;
  liabilitiesFV: number;
}

export const DEFAULT_PPA_INPUTS: PpaInputs = {
  purchasePrice: 800,
  tangiblesFV: 300,
  intangiblesFV: 350,
  liabilitiesFV: 100,
};

export interface PpaResult {
  netAssetsFV: number;
  goodwill: number;
  /** Goodwill < 0 is a bargain purchase — a gain, and a red flag to recheck. */
  bargainPurchase: boolean;
}

/** Price is allocated to identifiable assets at fair value; the rest is goodwill. */
export function ppa(inp: PpaInputs): PpaResult {
  const net = inp.tangiblesFV + inp.intangiblesFV - inp.liabilitiesFV;
  const gw = inp.purchasePrice - net;
  return { netAssetsFV: r2(net), goodwill: r2(gw), bargainPurchase: gw < 0 };
}

export interface ImpairInputs {
  /** Reporting unit's carrying value, incl. goodwill, $. */
  carryingValue: number;
  goodwill: number;
  fairValue: number;
}

export const DEFAULT_IMPAIR_INPUTS: ImpairInputs = { carryingValue: 800, goodwill: 250, fairValue: 650 };

export interface ImpairResult {
  impairment: number;
  remainingGoodwill: number;
}

/** Write goodwill down by the shortfall of fair value vs carrying, capped at goodwill. */
export function goodwillImpairment(inp: ImpairInputs): ImpairResult {
  const shortfall = Math.max(0, inp.carryingValue - inp.fairValue);
  const impairment = Math.min(shortfall, Math.max(0, inp.goodwill));
  return { impairment: r2(impairment), remainingGoodwill: r2(inp.goodwill - impairment) };
}

// ---------------------------------------------------------------------------
// 6. Trading vs precedent comps + the cost approach
// ---------------------------------------------------------------------------

export interface CompsInputs {
  ebitda: number;
  tradingMultiple: number;
  precedentMultiple: number;
}

export const DEFAULT_COMPS_INPUTS: CompsInputs = { ebitda: 100, tradingMultiple: 8, precedentMultiple: 9.5 };

export interface CompsResult {
  evTrading: number;
  evPrecedent: number;
  /** What the deal market pays over the trading market — the control premium, %. */
  controlPremiumPct: number;
}

export function compsCompare(inp: CompsInputs): CompsResult {
  const evT = inp.ebitda * inp.tradingMultiple;
  const evP = inp.ebitda * inp.precedentMultiple;
  return {
    evTrading: r2(evT),
    evPrecedent: r2(evP),
    controlPremiumPct: evT > 0 ? r1(((evP - evT) / evT) * 100) : 0,
  };
}

export interface CostApproachInputs {
  replacementCost: number;
  obsolescencePct: number;
  liabilities: number;
}

export const DEFAULT_COST_INPUTS: CostApproachInputs = { replacementCost: 400, obsolescencePct: 25, liabilities: 120 };

export interface CostApproachResult {
  adjustedAssets: number;
  equityValue: number;
}

/** Value = what rebuilding the assets would cost, less wear, less liabilities. */
export function costApproach(inp: CostApproachInputs): CostApproachResult {
  const assets = inp.replacementCost * (1 - inp.obsolescencePct / 100);
  return { adjustedAssets: r2(assets), equityValue: r2(assets - inp.liabilities) };
}

// ---------------------------------------------------------------------------
// 7. LBO mini-model
// ---------------------------------------------------------------------------

export interface LboInputs {
  entryEbitda: number;
  entryMultiple: number;
  /** Share of the purchase funded with debt, %. */
  debtPct: number;
  ebitdaGrowthPct: number;
  /** Share of each year's EBITDA that pays down debt, %. */
  fcfConversionPct: number;
  exitMultiple: number;
  years: number;
}

export const DEFAULT_LBO_INPUTS: LboInputs = {
  entryEbitda: 50,
  entryMultiple: 8,
  debtPct: 60,
  ebitdaGrowthPct: 8,
  fcfConversionPct: 40,
  exitMultiple: 8,
  years: 5,
};

export interface LboResult {
  entryEv: number;
  entryDebt: number;
  entryEquity: number;
  exitEbitda: number;
  debtPaydown: number;
  exitDebt: number;
  exitEv: number;
  exitEquity: number;
  moic: number;
  irrPct: number | null;
  /** Exact attribution of the equity gain. */
  fromGrowth: number;
  fromMultiple: number;
  fromDeleveraging: number;
}

/**
 * Buy with mostly debt, pay it down with the company's own cash flows, sell:
 *   exit equity − entry equity = ΔEBITDA×entry multiple  (growth)
 *                              + Δmultiple×exit EBITDA   (multiple expansion)
 *                              + debt paid down          (deleveraging)
 */
export function lboMini(inp: LboInputs): LboResult {
  const entryEv = inp.entryEbitda * inp.entryMultiple;
  const entryDebt = entryEv * (inp.debtPct / 100);
  const entryEquity = entryEv - entryDebt;

  const g = inp.ebitdaGrowthPct / 100;
  let paydown = 0;
  let e = inp.entryEbitda;
  for (let t = 1; t <= inp.years; t++) {
    e = e * (1 + g);
    paydown += e * (inp.fcfConversionPct / 100);
  }
  paydown = Math.min(paydown, entryDebt);
  const exitEbitda = e;
  const exitDebt = entryDebt - paydown;
  const exitEv = exitEbitda * inp.exitMultiple;
  const exitEquity = exitEv - exitDebt;
  const moic = entryEquity > 0 ? exitEquity / entryEquity : 0;
  const irrPct = entryEquity > 0 && exitEquity > 0 ? r1((Math.pow(moic, 1 / inp.years) - 1) * 100) : null;

  return {
    entryEv: r2(entryEv),
    entryDebt: r2(entryDebt),
    entryEquity: r2(entryEquity),
    exitEbitda: r2(exitEbitda),
    debtPaydown: r2(paydown),
    exitDebt: r2(exitDebt),
    exitEv: r2(exitEv),
    exitEquity: r2(exitEquity),
    moic: r2(moic),
    irrPct,
    fromGrowth: r2((exitEbitda - inp.entryEbitda) * inp.entryMultiple),
    fromMultiple: r2((inp.exitMultiple - inp.entryMultiple) * exitEbitda),
    fromDeleveraging: r2(paydown),
  };
}

// ---------------------------------------------------------------------------
// 8. Accretion / dilution
// ---------------------------------------------------------------------------

export interface AccretionInputs {
  acqNetIncome: number;
  acqShares: number;
  acqSharePrice: number;
  tgtNetIncome: number;
  offerValue: number;
  /** Financing mix: % stock and % debt (the rest is cash on hand). */
  pctStock: number;
  pctDebt: number;
  debtRatePct: number;
  /** Yield forgone on cash used, %. */
  cashYieldPct: number;
  taxPct: number;
}

export const DEFAULT_ACCRETION_INPUTS: AccretionInputs = {
  acqNetIncome: 500,
  acqShares: 100,
  acqSharePrice: 50,
  tgtNetIncome: 60,
  offerValue: 900,
  pctStock: 50,
  pctDebt: 50,
  debtRatePct: 6,
  cashYieldPct: 4,
  taxPct: 25,
};

export interface AccretionResult {
  standaloneEps: number;
  newShares: number;
  afterTaxFinancingCost: number;
  proFormaEps: number;
  deltaPct: number;
  accretive: boolean;
}

/** Pro-forma EPS vs standalone — and remember: accretion is not value creation. */
export function accretionDilution(inp: AccretionInputs): AccretionResult {
  const standaloneEps = inp.acqShares > 0 ? inp.acqNetIncome / inp.acqShares : 0;
  const newShares = inp.acqSharePrice > 0 ? (inp.offerValue * (inp.pctStock / 100)) / inp.acqSharePrice : 0;
  const pctCash = Math.max(0, 100 - inp.pctStock - inp.pctDebt);
  const t = 1 - inp.taxPct / 100;
  const financing =
    inp.offerValue * (inp.pctDebt / 100) * (inp.debtRatePct / 100) * t +
    inp.offerValue * (pctCash / 100) * (inp.cashYieldPct / 100) * t;
  const proNI = inp.acqNetIncome + inp.tgtNetIncome - financing;
  const proEps = inp.acqShares + newShares > 0 ? proNI / (inp.acqShares + newShares) : 0;
  const deltaPct = standaloneEps > 0 ? ((proEps - standaloneEps) / standaloneEps) * 100 : 0;
  return {
    standaloneEps: r2(standaloneEps),
    newShares: r2(newShares),
    afterTaxFinancingCost: r2(financing),
    proFormaEps: r2(proEps),
    deltaPct: r1(deltaPct),
    accretive: proEps > standaloneEps,
  };
}

// ---------------------------------------------------------------------------
// 9. Operator quick kit: break-even and CAGR
// ---------------------------------------------------------------------------

export interface BreakEvenInputs {
  fixedCosts: number;
  pricePerUnit: number;
  variableCostPerUnit: number;
}

export const DEFAULT_BREAKEVEN_INPUTS: BreakEvenInputs = { fixedCosts: 200_000, pricePerUnit: 50, variableCostPerUnit: 30 };

export interface BreakEvenResult {
  contributionPerUnit: number;
  contributionMarginPct: number;
  breakEvenUnits: number | null;
}

export function breakEven(inp: BreakEvenInputs): BreakEvenResult {
  const cm = inp.pricePerUnit - inp.variableCostPerUnit;
  return {
    contributionPerUnit: r2(cm),
    contributionMarginPct: inp.pricePerUnit > 0 ? r1((cm / inp.pricePerUnit) * 100) : 0,
    breakEvenUnits: cm > 0 ? Math.ceil(inp.fixedCosts / cm) : null,
  };
}

export interface CagrInputs {
  beginValue: number;
  endValue: number;
  years: number;
}

export const DEFAULT_CAGR_INPUTS: CagrInputs = { beginValue: 100, endValue: 200, years: 5 };

/** (end ÷ begin)^(1/n) − 1 — remember it smooths: 15% CAGR ≠ 15% every year. */
export function cagr(inp: CagrInputs): number | null {
  if (inp.beginValue <= 0 || inp.endValue <= 0 || inp.years <= 0) return null;
  return r1((Math.pow(inp.endValue / inp.beginValue, 1 / inp.years) - 1) * 100);
}
