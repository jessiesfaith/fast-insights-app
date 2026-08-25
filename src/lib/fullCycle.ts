// The full cycle — the model layer behind tab 16. One company, every number,
// start to finish, each stage's output feeding the next:
//
//   1. OPERATING ENGINE  revenue → EBITDA → EBIT → NOPAT → net income → EPS
//   2. RETURNS           invested capital → ROIC; a project's ROI
//   3. COST OF CAPITAL   CAPM → Re; coupon → after-tax Rd; market weights → WACC
//   4. VALUE TEST        ROIC − WACC spread → economic profit in dollars
//   5. VALUATION         FCF → growing-perpetuity EV → −net debt → EQV →
//                        per-share intrinsic vs the market price (and the
//                        growth rate the market's price implies)
//   6. THE FINANCING DECISION  fund a project with BONDS vs STOCK — EPS,
//                        leverage, coverage, WACC, and intrinsic value per
//                        share, side by side. The lesson: EPS, value, and
//                        risk are three different lenses and they can
//                        disagree — the decision is choosing which lens
//                        rules, and saying why.
//
// Everything is computed from the inputs — no step skipped, no number
// asserted. Education only; not investment advice.

export interface FullCycleInputs {
  /** Annual revenue, $. */
  revenue: number;
  /** EBITDA margin, %. */
  ebitdaMarginPct: number;
  /** Depreciation & amortization, $/yr. */
  da: number;
  taxPct: number;
  /** Existing debt, $, and its coupon. */
  debt: number;
  interestRatePct: number;
  cash: number;
  /** Book equity (for invested capital), $. */
  bookEquity: number;
  /** Shares outstanding (M or units — consistent with $). */
  shares: number;
  /** Market share price, $. */
  sharePrice: number;
  beta: number;
  riskFreePct: number;
  erpPct: number;
  /** For FCF: capex and working-capital build, $/yr. */
  capex: number;
  deltaNwc: number;
  /** Long-run growth for the valuation perpetuity, %. */
  growthPct: number;
  /** The project to finance. */
  projectCost: number;
  projectEbitda: number;
  projectDa: number;
  /** Coupon on NEW bonds if the project is debt-funded, %. */
  newDebtRatePct: number;
}

export const DEFAULT_FULL_CYCLE: FullCycleInputs = {
  revenue: 100_000_000,
  ebitdaMarginPct: 25,
  da: 5_000_000,
  taxPct: 25,
  debt: 40_000_000,
  interestRatePct: 6,
  cash: 10_000_000,
  bookEquity: 60_000_000,
  shares: 10_000_000,
  sharePrice: 30,
  beta: 1.1,
  riskFreePct: 4,
  erpPct: 5.5,
  capex: 6_000_000,
  deltaNwc: 1_000_000,
  growthPct: 4,
  projectCost: 50_000_000,
  projectEbitda: 10_000_000,
  projectDa: 2_000_000,
  newDebtRatePct: 6.5,
};

const r0 = Math.round;
const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

export interface Stage1 {
  ebitda: number;
  ebit: number;
  nopat: number;
  interest: number;
  pretax: number;
  netIncome: number;
  eps: number;
}

/** Stage 1 — the operating engine, line by line. */
export function stage1Operating(i: FullCycleInputs): Stage1 {
  const ebitda = i.revenue * (i.ebitdaMarginPct / 100);
  const ebit = ebitda - i.da;
  const nopat = ebit * (1 - i.taxPct / 100);
  const interest = i.debt * (i.interestRatePct / 100);
  const pretax = ebit - interest;
  const netIncome = pretax * (1 - i.taxPct / 100);
  return {
    ebitda: r0(ebitda),
    ebit: r0(ebit),
    nopat: r0(nopat),
    interest: r0(interest),
    pretax: r0(pretax),
    netIncome: r0(netIncome),
    eps: r2(i.shares > 0 ? netIncome / i.shares : 0),
  };
}

export interface Stage2 {
  investedCapital: number;
  roicPct: number;
  projectNopat: number;
  projectRoicPct: number;
}

/** Stage 2 — returns on capital: the company's ROIC and the project's ROI(C). */
export function stage2Returns(i: FullCycleInputs, s1: Stage1): Stage2 {
  const investedCapital = i.debt + i.bookEquity;
  const projectEbit = i.projectEbitda - i.projectDa;
  const projectNopat = projectEbit * (1 - i.taxPct / 100);
  return {
    investedCapital: r0(investedCapital),
    roicPct: r1(investedCapital > 0 ? (s1.nopat / investedCapital) * 100 : 0),
    projectNopat: r0(projectNopat),
    projectRoicPct: r1(i.projectCost > 0 ? (projectNopat / i.projectCost) * 100 : 0),
  };
}

export interface Stage3 {
  equityMarket: number;
  weightEquityPct: number;
  weightDebtPct: number;
  rePct: number;
  rdAfterTaxPct: number;
  waccPct: number;
}

/** Stage 3 — cost of capital with MARKET-value weights (not book). */
export function stage3Wacc(i: FullCycleInputs): Stage3 {
  const equityMarket = i.shares * i.sharePrice;
  const total = equityMarket + i.debt;
  const we = total > 0 ? equityMarket / total : 0;
  const re = i.riskFreePct + i.beta * i.erpPct;
  const rdAfter = i.interestRatePct * (1 - i.taxPct / 100);
  return {
    equityMarket: r0(equityMarket),
    weightEquityPct: r1(we * 100),
    weightDebtPct: r1((1 - we) * 100),
    rePct: r2(re),
    rdAfterTaxPct: r2(rdAfter),
    waccPct: r2(we * re + (1 - we) * rdAfter),
  };
}

export interface Stage4 {
  spreadPct: number;
  economicProfit: number;
}

/** Stage 4 — the value test: economic profit = (ROIC − WACC) × invested capital. */
export function stage4EconomicProfit(s2: Stage2, s3: Stage3): Stage4 {
  const spread = s2.roicPct - s3.waccPct;
  return { spreadPct: r1(spread), economicProfit: r0((spread / 100) * s2.investedCapital) };
}

export interface Stage5 {
  fcf: number;
  /** Growing-perpetuity EV at WACC (valid only when WACC > g). */
  valid: boolean;
  ev: number;
  netDebt: number;
  eqv: number;
  perShareIntrinsic: number;
  marketEv: number;
  /** The growth rate the market price implies at this WACC. */
  impliedGrowthPct: number;
  /** Market price premium/(discount) to intrinsic, %. */
  premiumPct: number;
}

/**
 * Stage 5 — valuation as a growing perpetuity (tab 5 has the full 5-year
 * DCF): EV = FCF×(1+g)/(WACC−g); EQV = EV − net debt; per-share = EQV ÷
 * shares. Then the reverse question: what growth does the MARKET's price
 * imply? g* = (WACC×MarketEV − FCF) ÷ (MarketEV + FCF).
 */
export function stage5Valuation(i: FullCycleInputs, s1: Stage1, s3: Stage3): Stage5 {
  const fcf = s1.nopat + i.da - i.capex - i.deltaNwc;
  const w = s3.waccPct / 100;
  const g = i.growthPct / 100;
  const valid = w > g;
  const ev = valid ? (fcf * (1 + g)) / (w - g) : 0;
  const netDebt = i.debt - i.cash;
  const eqv = ev - netDebt;
  const marketEv = s3.equityMarket + netDebt;
  const impliedG = marketEv + fcf > 0 ? ((w * marketEv - fcf) / (marketEv + fcf)) * 100 : 0;
  const perShare = i.shares > 0 ? eqv / i.shares : 0;
  return {
    fcf: r0(fcf),
    valid,
    ev: r0(ev),
    netDebt: r0(netDebt),
    eqv: r0(eqv),
    perShareIntrinsic: r2(perShare),
    marketEv: r0(marketEv),
    impliedGrowthPct: r2(impliedG),
    premiumPct: perShare > 0 ? r1(((i.sharePrice - perShare) / perShare) * 100) : 0,
  };
}

export interface FinancingSide {
  label: string;
  newShares: number;
  totalShares: number;
  totalDebt: number;
  interest: number;
  netIncome: number;
  eps: number;
  epsChangePct: number;
  debtToEbitda: number;
  coverage: number;
  waccPct: number;
  /** Intrinsic equity per share AFTER the deal (project at its NPV). */
  perShareIntrinsic: number;
  read: string;
}

export interface Stage6 {
  projectValue: number;
  projectNpv: number;
  bonds: FinancingSide;
  stock: FinancingSide;
  verdict: string[];
}

/**
 * Stage 6 — fund the project with BONDS vs STOCK. The project is valued as
 * a level perpetuity of its FCF (NOPAT + D&A − maintenance capex ≈ D&A) at
 * the pre-deal WACC; its NPV = value − cost. Bonds: existing holders keep
 * the whole NPV but add leverage. Stock: NPV is shared with new holders —
 * BUT if the market price is above intrinsic value, selling shares at that
 * price transfers value TO existing holders (§82 in reverse), and EPS will
 * say the opposite. Three lenses; they disagree on purpose.
 */
export function stage6Financing(i: FullCycleInputs, s1: Stage1, s3: Stage3, s5: Stage5): Stage6 {
  const t = 1 - i.taxPct / 100;
  const projectEbit = i.projectEbitda - i.projectDa;
  const projectNopat = projectEbit * t;
  // level-perpetuity project FCF: NOPAT + D&A − maintenance capex (≈ D&A)
  const projectFcf = projectNopat;
  const w = s3.waccPct / 100;
  const projectValue = w > 0 ? projectFcf / w : 0;
  const projectNpv = projectValue - i.projectCost;
  const newEbit = s1.ebit + projectEbit;
  const newEbitda = s1.ebitda + i.projectEbitda;
  const preDealIntrinsicEquity = s5.eqv;

  // --- bonds ---
  const bondsInterest = s1.interest + i.projectCost * (i.newDebtRatePct / 100);
  const bondsNi = (newEbit - bondsInterest) * t;
  const bondsDebt = i.debt + i.projectCost;
  const bondsEps = bondsNi / i.shares;
  const bondsWe = s3.equityMarket / (s3.equityMarket + bondsDebt);
  const bondsRdAfter = ((i.debt * i.interestRatePct + i.projectCost * i.newDebtRatePct) / bondsDebt) * t;
  const bondsWacc = bondsWe * s3.rePct + (1 - bondsWe) * bondsRdAfter;
  const bondsIntrinsic = (preDealIntrinsicEquity + projectNpv) / i.shares;

  // --- stock ---
  const newShares = i.sharePrice > 0 ? i.projectCost / i.sharePrice : 0;
  const stockShares = i.shares + newShares;
  const stockNi = (newEbit - s1.interest) * t;
  const stockEps = stockNi / stockShares;
  const stockWe = (s3.equityMarket + i.projectCost) / (s3.equityMarket + i.projectCost + i.debt);
  const stockWacc = stockWe * s3.rePct + (1 - stockWe) * s3.rdAfterTaxPct;
  // intrinsic equity gains the project's full VALUE (cash in → asset worth projectValue)
  const stockIntrinsic = (preDealIntrinsicEquity + projectValue) / stockShares;

  const bonds: FinancingSide = {
    label: `Issue bonds at ${i.newDebtRatePct}%`,
    newShares: 0,
    totalShares: i.shares,
    totalDebt: r0(bondsDebt),
    interest: r0(bondsInterest),
    netIncome: r0(bondsNi),
    eps: r2(bondsEps),
    epsChangePct: r1(((bondsEps - s1.eps) / s1.eps) * 100),
    debtToEbitda: r2(bondsDebt / newEbitda),
    coverage: r2(newEbit / bondsInterest),
    waccPct: r2(bondsWacc),
    perShareIntrinsic: r2(bondsIntrinsic),
    read: 'Existing holders keep 100% of the project NPV — the price is leverage: coverage falls, and the downside case must still service the coupons.',
  };
  const stock: FinancingSide = {
    label: `Issue stock at $${i.sharePrice}`,
    newShares: r0(newShares),
    totalShares: r0(stockShares),
    totalDebt: i.debt,
    interest: r0(s1.interest),
    netIncome: r0(stockNi),
    eps: r2(stockEps),
    epsChangePct: r1(((stockEps - s1.eps) / s1.eps) * 100),
    debtToEbitda: r2(i.debt / newEbitda),
    coverage: r2(newEbit / s1.interest),
    waccPct: r2(stockWacc),
    perShareIntrinsic: r2(stockIntrinsic),
    read:
      i.sharePrice > s5.perShareIntrinsic
        ? 'The market price is ABOVE intrinsic value — issuing at this price sells expensive paper, transferring value TO existing holders (§82 in reverse) even while EPS calls it dilution.'
        : 'The market price is at/below intrinsic value — issuing here shares the project’s upside AND transfers value to the new holders (§82). The dilution is real twice over.',
  };

  const verdict: string[] = [
    `EPS lens: ${bonds.eps >= stock.eps ? 'bonds win' : 'stock wins'} (${bonds.eps.toFixed(2)} vs ${stock.eps.toFixed(2)}) — but EPS accretion is an artifact, not value (tab 10).`,
    `Value lens: ${bonds.perShareIntrinsic >= stock.perShareIntrinsic ? 'bonds win' : 'stock wins'} on intrinsic per share ($${bonds.perShareIntrinsic.toFixed(2)} vs $${stock.perShareIntrinsic.toFixed(2)}) — driven by whether the market price is rich or cheap vs intrinsic.`,
    `Risk lens: stock wins by construction — leverage ${bonds.debtToEbitda}× vs ${stock.debtToEbitda}×, coverage ${bonds.coverage}× vs ${stock.coverage}×. The question is whether the stress case (tab 3’s debt book, tab 12’s DSCR logic) can carry the bonds.`,
    'The decision is naming which lens rules for THIS company right now — and the §54 override: no positive-NPV financing plan survives a scenario that kills the company.',
  ];

  return { projectValue: r0(projectValue), projectNpv: r0(projectNpv), bonds, stock, verdict };
}

export interface FullCycleResult {
  s1: Stage1;
  s2: Stage2;
  s3: Stage3;
  s4: Stage4;
  s5: Stage5;
  s6: Stage6;
}

export function runFullCycle(i: FullCycleInputs): FullCycleResult {
  const s1 = stage1Operating(i);
  const s2 = stage2Returns(i, s1);
  const s3 = stage3Wacc(i);
  const s4 = stage4EconomicProfit(s2, s3);
  const s5 = stage5Valuation(i, s1, s3);
  const s6 = stage6Financing(i, s1, s3, s5);
  return { s1, s2, s3, s4, s5, s6 };
}
