// Rates & the bond market — the model layer behind tab 11.
//
// The teaching engine the master spec calls for: there is NOT one interest
// rate. The Fed floors overnight money (IORB — an offer, not an order); the
// chain weakens maturity by maturity; the long end is discovered at Treasury
// auctions and carries a term premium the Fed does not set. Every derived
// number here (curve slopes, breakevens, spreads) is computed
// deterministically from the stored observations — never eyeballed.
//
// Data: latest official Federal Reserve H.15 observations available
// 2026-08-25 (nominal and real Treasury CMT for 2026-08-24; EFFR; IORB;
// target range) and Freddie Mac PMMS (2026-08-20), refreshed by hand into
// this snapshot file — same pattern as marketSnapshot.ts — until the
// automation lands. fed.gov / home.treasury.gov are the underlying
// authorities; H.15 is the convenient historical panel.
// Education only; not investment advice.

export interface CurvePoint {
  /** Display label, e.g. "3M", "10Y". */
  maturity: string;
  /** Maturity in years (ordering). */
  years: number;
  /** Nominal par/CMT yield, % (official H.15, 2026-08-24). */
  yieldPct: number;
  /** Real (TIPS) CMT yield, % where published; null for bills. */
  realPct: number | null;
  /**
   * "The Fed's grip" — how tightly this maturity tracks the policy rate:
   * 100 = almost perfectly, 10 = barely at all. Teaching scores.
   */
  fedGripPct: number;
  /** Why this maturity matters — spec section 20. */
  why: string;
}

export interface RatesSnapshot {
  asOf: string;
  observationDate: string;
  sources: string[];
  /** Level A — policy / overnight. */
  fedFundsTarget: string;
  fedFundsMidPct: number;
  effrPct: number;
  iorbPct: number;
  /** SOFR estimate — NY Fed publishes it; tracks the funds rate closely. */
  sofrPct: number;
  sofrIsEstimate: boolean;
  curve: CurvePoint[];
  /** Residential mortgage (Freddie Mac PMMS, weekly). */
  mortgage30Pct: number;
  mortgageAsOf: string;
  /** Same-day 10Y CMT used for the spread (alignment disclosed). */
  ust10AlignedPct: number;
  /** The divergence story. */
  easedSinceSep2024Bp: number;
  firstHundredBpWindow: { fedCutBp: number; tenYearMoveBp: number };
  thirtyYearWeekPeakPct: number;
  /** The scale problem. */
  nationalDebt: string;
  julyDeficit: string;
  annualInterestCost: string;
  buybackSize: string;
  buybackToDebtRatio: string;
}

export const RATES_SNAPSHOT: RatesSnapshot = {
  asOf: '2026-08-26',
  observationDate: '2026-08-24',
  sources: [
    'Federal Reserve H.15 (latest observations available 2026-08-25): nominal & real Treasury CMT for 2026-08-24, EFFR ≈3.63%, IORB 3.65%, target 3.50–3.75%',
    'U.S. Treasury (home.treasury.gov) — the underlying authority for the par curve (closing bid quotations via the New York Fed ~3:30pm); H.15 is the historical panel',
    'Freddie Mac PMMS (2026-08-20): 30-yr fixed 6.65%; same-day 10Y CMT 4.69% for the spread alignment',
    'Since the Aug-24 curve observation (partials, 2026-08-25 close): 10Y eased ~4bp to ≈4.66, 2Y ≈4.25, 30Y steady 5.23 — the full same-day H.15 panel refreshes next business day, so the computed slopes above stay on the coherent Aug-24 curve (mixing observation dates would corrupt them)',
    'Policy watch: July FOMC held 3.50–3.75% (9–3); futures now price ~65% odds of a 25bp HIKE at the Sept 15–16 meeting on the energy shock. Treasury announced it will at least DOUBLE 10–30Y liquidity-support buybacks after the 30Y touched post-2007 highs (Aug 20)',
  ],
  fedFundsTarget: '3.50–3.75%',
  fedFundsMidPct: 3.625,
  effrPct: 3.63,
  iorbPct: 3.65,
  sofrPct: 3.65,
  sofrIsEstimate: true,
  curve: [
    { maturity: '1M', years: 1 / 12, yieldPct: 3.79, realPct: null, fedGripPct: 95, why: 'Very short funding expectations — floored by IORB; where cash and money-market funds live.' },
    { maturity: '3M', years: 0.25, yieldPct: 3.87, realPct: null, fedGripPct: 90, why: 'Tracks the Fed closely — asks nearly the same question as the funds rate. T-bills.' },
    { maturity: '6M', years: 0.5, yieldPct: 3.96, realPct: null, fedGripPct: 85, why: 'A couple of FOMC meetings priced in.' },
    { maturity: '1Y', years: 1, yieldPct: 4.04, realPct: null, fedGripPct: 75, why: 'Near-term policy and economic expectations.' },
    { maturity: '2Y', years: 2, yieldPct: 4.24, realPct: null, fedGripPct: 60, why: 'THE market read on the Fed’s next couple of years — reacts hardest to policy surprises.' },
    { maturity: '3Y', years: 3, yieldPct: 4.31, realPct: null, fedGripPct: 50, why: 'The intermediate policy path.' },
    { maturity: '5Y', years: 5, yieldPct: 4.41, realPct: 2.09, fedGripPct: 40, why: 'Medium-duration financing benchmark — commercial lending, some fixed CRE, corporate debt.' },
    { maturity: '7Y', years: 7, yieldPct: 4.55, realPct: 2.22, fedGripPct: 30, why: 'Medium/long duration — CRE and corporate financing.' },
    { maturity: '10Y', years: 10, yieldPct: 4.7, realPct: 2.38, fedGripPct: 25, why: 'THE benchmark: residential mortgages/MBS, corporate debt, CRE, equity discount rates.' },
    { maturity: '20Y', years: 20, yieldPct: 5.21, realPct: 2.75, fedGripPct: 15, why: 'Long-end supply and demand.' },
    { maturity: '30Y', years: 30, yieldPct: 5.23, realPct: 2.97, fedGripPct: 10, why: 'Long-run inflation, real rates, term premium, Treasury supply — NOT the mortgage benchmark.' },
  ],
  mortgage30Pct: 6.65,
  mortgageAsOf: '2026-08-20 (weekly PMMS)',
  ust10AlignedPct: 4.69,
  easedSinceSep2024Bp: 175,
  firstHundredBpWindow: { fedCutBp: 100, tenYearMoveBp: 99 },
  thirtyYearWeekPeakPct: 5.33,
  nationalDebt: '$40 trillion (crossed last week)',
  julyDeficit: '$432 billion — highest single month since March 2021',
  annualInterestCost: '≈$1.2 trillion this year — roughly two-thirds of the deficit so far',
  buybackSize: '$4 billion (announced at least doubled this week)',
  buybackToDebtRatio: 'one part in 10,000 — a $1 payment on a $10,000 debt',
};

// ---------------------------------------------------------------------------
// Deterministic curve math — slopes, breakevens, shape (spec §21–23, §108)
// ---------------------------------------------------------------------------

const r2 = (n: number) => Math.round(n * 100) / 100;

export function curveYield(maturity: string): number {
  const p = RATES_SNAPSHOT.curve.find((c) => c.maturity === maturity);
  if (!p) throw new Error(`unknown maturity ${maturity}`);
  return p.yieldPct;
}

export interface CurveSlope {
  name: string;
  /** e.g. "10Y − 2Y". */
  formula: string;
  pct: number;
  bps: number;
  read: string;
}

/** The classic slopes, computed — never eyeballed. Displayed in % AND bps. */
export function curveSlopes(): CurveSlope[] {
  const mk = (name: string, long: string, short: string, read: string): CurveSlope => {
    const pct = r2(curveYield(long) - curveYield(short));
    return { name, formula: `${long} − ${short}`, pct, bps: Math.round(pct * 100), read };
  };
  return [
    mk('2s10s', '10Y', '2Y', 'The classic recession dial: positive = normal upward slope; inverted = the market expects cuts ahead. Today it is positive — the curve has re-steepened.'),
    mk('3m10y', '10Y', '3M', 'The Fed-vs-long-market gap: how much extra the 10Y pays over near-policy paper.'),
    mk('5s30s', '30Y', '5Y', 'The long-end premium: what 25 extra years of commitment costs — term premium and supply live here.'),
    mk('10s30s', '30Y', '10Y', 'The far end alone: duration demand vs Treasury supply.'),
  ];
}

export type CurveShape = 'normal' | 'flat' | 'inverted';

/** Shape classification from 2s10s (deterministic; ±15bp = flat band). */
export function curveShape(): { shape: CurveShape; read: string } {
  const s = curveSlopes()[0].bps;
  const shape: CurveShape = s > 15 ? 'normal' : s < -15 ? 'inverted' : 'flat';
  return {
    shape,
    read:
      shape === 'normal'
        ? 'Upward-sloping: longer money costs more — the textbook state, currently driven as much by term premium and supply as by growth optimism.'
        : shape === 'inverted'
          ? 'Inverted: short rates above long — the market pricing future cuts. Historically a caution flag, not a guarantee.'
          : 'Flat: the market sees little difference between near and far — usually a transition state.',
  };
}

export interface Breakeven {
  maturity: string;
  nominalPct: number;
  realPct: number;
  breakevenPct: number;
}

/**
 * Breakeven inflation ≈ nominal − real (TIPS) at the same maturity —
 * MARKET-IMPLIED APPROXIMATION, not a pure inflation forecast.
 */
export function breakevens(): Breakeven[] {
  return RATES_SNAPSHOT.curve
    .filter((c) => c.realPct !== null)
    .map((c) => ({
      maturity: c.maturity,
      nominalPct: c.yieldPct,
      realPct: c.realPct as number,
      breakevenPct: r2(c.yieldPct - (c.realPct as number)),
    }));
}

/** The observed mortgage−10Y spread, computed. SIMPLE spread — NOT MBS OAS. */
export function mortgageTreasurySpreadBp(): number {
  return Math.round((RATES_SNAPSHOT.mortgage30Pct - RATES_SNAPSHOT.ust10AlignedPct) * 100);
}

// ---------------------------------------------------------------------------
// The rate stack — there is not one interest rate (spec §10)
// ---------------------------------------------------------------------------

export interface RateLevel {
  level: string;
  name: string;
  examples: string;
  whoSets: string;
  decides: string;
}

export const RATE_STACK: RateLevel[] = [
  { level: 'A', name: 'Overnight / policy rates', examples: `Fed funds target ${RATES_SNAPSHOT.fedFundsTarget} · EFFR ${RATES_SNAPSHOT.effrPct}% · IORB ${RATES_SNAPSHOT.iorbPct}% · SOFR ≈${RATES_SNAPSHOT.sofrPct}%`, whoSets: 'The Fed — genuinely. IORB is the floor: no bank lends overnight below what the Fed pays risk-free.', decides: 'Savings yields, money-market funds, floating-rate loans (via SOFR).' },
  { level: 'B', name: 'Treasury bills (1M–1Y)', examples: '1M 3.79% · 3M 3.87% · 6M 3.96% · 1Y 4.04%', whoSets: 'Mostly the Fed — bills price the next few meetings.', decides: 'Where idle corporate cash goes (tab 1’s T-bill option).' },
  { level: 'C', name: 'Treasury notes (2Y–10Y)', examples: '2Y 4.24% · 5Y 4.41% · 7Y 4.55% · 10Y 4.70%', whoSets: 'The market, increasingly: the 2Y prices the Fed’s path; the 10Y barely follows the Fed at all.', decides: 'Mortgages (10Y), fixed CRE loans (5/7/10Y), corporate bonds, every DCF discount rate.' },
  { level: 'D', name: 'Treasury bonds (20Y–30Y)', examples: '20Y 5.21% · 30Y 5.23% (week peak 5.33 — highest since 2007)', whoSets: 'Auction buyers: pensions, insurers, foreign central banks, funds — and the term premium they demand.', decides: 'Long-run fiscal credibility; what forever-money costs the government.' },
  { level: 'E', name: 'TIPS (real yields)', examples: '5Y real 2.09% · 10Y real 2.38% · 30Y real 2.97%', whoSets: 'Same buyers — with inflation protection stripped in. Nominal − real = breakeven inflation.', decides: 'Whether a yield move is inflation fear or real-rate repricing — different problems, different responses.' },
  { level: 'F', name: 'Credit (corporate bonds)', examples: 'Corporate yield = Treasury benchmark + credit spread (e.g. 10Y 4.70% + 150bp = 6.20%)', whoSets: 'Lenders pricing default risk — spreads can widen while Treasuries fall (a distressed borrower gets NO benefit from Fed easing).', decides: 'Tab 1’s cost of debt; the pro forma’s spread tier is exactly this.' },
  { level: 'G', name: 'Agency MBS', examples: 'The bonds mortgages get packaged into — priced off the 10Y, plus prepayment optionality.', whoSets: 'MBS investors, who bear the risk that homeowners refinance exactly when it hurts.', decides: 'The mortgage spread on tab 12.' },
  { level: 'H', name: 'End-borrower rates', examples: `30Y fixed mortgage ${RATES_SNAPSHOT.mortgage30Pct}% · CRE loans · corporate loans`, whoSets: 'Everything above, plus lender margin and your credit.', decides: 'The rate in YOUR life — and it answers to level C and G, not to level A.' },
];

// ---------------------------------------------------------------------------
// Bond basics (spec §11–14) — price↔yield, coupon vs YTM, duration
// ---------------------------------------------------------------------------

export interface BondFact {
  name: string;
  eq: string;
  plain: string;
  example: string;
}

export const BOND_BASICS: BondFact[] = [
  { name: 'Coupon payment', eq: 'coupon $ = par × coupon rate', plain: 'The fixed cash a bond pays.', example: '$1,000 bond at 5% → $50/yr ($25 every six months if semiannual).' },
  { name: 'Price ↔ yield (inverse, always)', eq: 'price = Σ coupon/(1+y)^t + par/(1+y)^n', plain: 'Yields up ⇒ prices down, and vice versa — the discounting does it mechanically.', example: 'The 30Y at 5.33% this week means existing lower-coupon 30Y bonds FELL in price.' },
  { name: 'Coupon rate ≠ YTM', eq: 'YTM = the discount rate equating price to remaining cash flows', plain: 'The coupon is printed on the bond; the yield is set by the price you pay.', example: 'A 3% coupon bond trading below par yields MORE than 3%.' },
  { name: 'Duration', eq: '%Δprice ≈ −modified duration × Δyield', plain: 'Longer bonds swing harder per basis point.', example: 'Duration 8, yields +100bp → price ≈ −8% (before convexity). Why the 30Y is the violent end.' },
];

// ---------------------------------------------------------------------------
// The divergence: September 2024 → today (the chain visibly snapped)
// ---------------------------------------------------------------------------

export interface DivergencePoint {
  label: string;
  fed: number;
  tenYear: number;
}

/**
 * The Fed cut 175bp from Sept 2024; the 10Y ROSE ~99bp over the
 * first-100bp-of-cuts window and sits at 4.70 today. Anchors are cited
 * prints; points between anchors are smoothed for the teaching chart.
 * (Pre-2024 cutting cycles back to the 1980s: the 10Y was LOWER 100 days
 * after the first cut every single time. This cycle broke the pattern.)
 */
export const CUTS_VS_TENYEAR: DivergencePoint[] = [
  { label: 'Sep 24', fed: 5.375, tenYear: 3.65 },
  { label: 'Nov 24', fed: 4.875, tenYear: 4.2 },
  { label: 'Jan 25', fed: 4.375, tenYear: 4.64 },
  { label: 'Jun 25', fed: 4.125, tenYear: 4.5 },
  { label: 'Dec 25', fed: 3.875, tenYear: 4.45 },
  { label: 'Apr 26', fed: 3.625, tenYear: 4.55 },
  { label: 'Aug 26', fed: 3.625, tenYear: 4.7 },
];

export const AUCTION_BUYERS: string[] = [
  'Pension funds — owe retirees money in 30 years and need something safe against it',
  'Life insurers — matching payouts to policies',
  'Foreign central banks — parking reserves',
  'Commercial banks and hedge funds',
  'And indirectly you — through every bond fund in your retirement account',
];

export const TERM_PREMIUM_DEF =
  'The extra yield buyers demand purely for committing money for a long time — compensation for everything that could go wrong across a decade that nobody can forecast. It has nothing to do with what the Fed does next month. When the term premium rises, long rates rise, and the Fed can cut all it likes. (Conceptually: nominal yield ≈ expected real rate + expected inflation + term premium — a frame, not an exact decomposition.)';

export interface SnapReason {
  name: string;
  what: string;
  fact: string;
}

export const SNAP_REASONS: SnapReason[] = [
  { name: '1. Supply', what: 'Every deficit dollar becomes bonds at auction. More supply against the same demand → lower prices, higher yields. Not policy — arithmetic.', fact: 'Debt crossed $40T; the July deficit alone was $432B, the highest month since March 2021.' },
  { name: '2. Competition', what: 'Hyperscalers are issuing enormous AI-infrastructure debt — competing for the same buyers. Treasuries that must compete pay more.', fact: 'A pension fund now chooses between lending to the US government and lending to a hyperscaler at a better yield.' },
  { name: '3. Doubt (inflation)', what: 'Years above the 2% target plus elevated energy: a 30-year lender unsure what a dollar buys in year 20 demands compensation — the term premium climbing.', fact: 'The market’s own number: 10Y breakeven ≈ 2.32% (4.70 nominal − 2.38 real) — above target, priced in.' },
];

export interface WayDown {
  name: string;
  what: string;
  warning: string;
}

export const THREE_WAYS_DOWN: WayDown[] = [
  { name: '1. Less borrowing', what: 'Smaller deficits → fewer bonds at auction → the government pays less to place them. Clean, and slow.', warning: 'Entirely fiscal — decided by Congress, not the Fed (tab 4’s lever 2).' },
  { name: '2. Inflation genuinely settling', what: 'Sustained — not one good month — so 30-year lenders stop charging for the uncertainty. The term premium shrinks and long yields fall without anyone pulling them.', warning: 'Watch core PCE on tab 3 and the 10Y breakeven here — not the FOMC calendar.' },
  { name: '3. A recession', what: 'Money runs to safety, buyers pile into Treasuries, prices rise, yields fall fast. Historically the most reliable route down.', warning: 'It arrives with job losses attached — remember that before rooting for it.' },
];

export const SCALE_STORY: string[] = [
  'This week the 30Y hit 5.33% — highest since 2007 — and the Treasury announced it would at least double its buybacks, stepping in as a buyer to push yields down. It worked for ~48 hours; by Friday the move was erased and yields were higher.',
  'The failure was arithmetic, not execution: $4B of buybacks against $40T of debt is one part in ten thousand — a $1 payment on a $10,000 debt. The market priced accordingly.',
  'Interest on the debt runs ≈$1.2T a year — roughly two-thirds of the deficit. The government is borrowing largely to pay interest on what it already borrowed, and the buyers can see the same numbers.',
  'The quieter evidence: forward guidance is being walked back — shorter statements, fewer promises, a "blank piece of paper" speech. An institution that stops promising where rates go has quietly accepted it does not control where they go.',
];

export const PRACTICAL_SHIFT: string[] = [
  'Stop timing decisions around eight FOMC meetings a year. Watch the 10-year Treasury — the number your mortgage, car loan, and discount rate actually anchor to.',
  'When the 10Y falls meaningfully and HOLDS, refinancing becomes worth pricing. When it climbs, waiting gets more expensive — not less.',
  'Waiting for "the cut" is actually waiting for thousands of auction buyers to decide 30-year lending to the US is attractive again. That is not on anyone’s calendar.',
];

// ---------------------------------------------------------------------------
// The debt build-up — how the US got to $40T, and what interest now costs
// (tab 11 step H; mirrored in tab 19's US country report)
// ---------------------------------------------------------------------------

export const DEBT_HISTORY_SOURCE =
  'Gross federal debt (Treasury, fiscal-year, $T) and net interest outlays (CBO/OMB, $B) — APPROXIMATE TEACHING VALUES rounded from official series, anchored to the milestones noted and to this snapshot ($40T crossed, ≈$1.2T interest). The effective rate column is COMPUTED (interest ÷ debt), never typed.';

export interface DebtYear {
  year: number;
  /** Gross federal debt, $ trillions. */
  debtT: number;
  /** Net interest outlays, $ billions. */
  interestB: number;
  note?: string;
}

export const DEBT_HISTORY: DebtYear[] = [
  { year: 2000, debtT: 5.7, interestB: 223, note: 'Surplus years — the last time the debt briefly SHRANK.' },
  { year: 2004, debtT: 7.4, interestB: 160 },
  { year: 2008, debtT: 10.0, interestB: 253, note: 'Crosses $10T as the financial crisis hits.' },
  { year: 2010, debtT: 13.6, interestB: 196, note: 'Crisis response — and cheap rates make more debt cost LESS interest than 2008.' },
  { year: 2012, debtT: 16.1, interestB: 220 },
  { year: 2014, debtT: 17.8, interestB: 229 },
  { year: 2016, debtT: 19.6, interestB: 240 },
  { year: 2017, debtT: 20.2, interestB: 263, note: 'Crosses $20T — the 2008→2017 doubling took nine years.' },
  { year: 2019, debtT: 22.7, interestB: 375 },
  { year: 2020, debtT: 26.9, interestB: 345, note: 'COVID: +$4T in one year — and interest FALLS, because the Fed cut to zero.' },
  { year: 2021, debtT: 28.4, interestB: 352, note: 'The cheap-money illusion at its peak: $28T serviced for ~1.2%.' },
  { year: 2022, debtT: 30.9, interestB: 475, note: 'Crosses $30T as the hiking cycle begins — the bill starts repricing.' },
  { year: 2023, debtT: 33.2, interestB: 659 },
  { year: 2024, debtT: 35.5, interestB: 882, note: 'Interest passes the defense budget (~$900B, the geopolitics step’s military table).' },
  { year: 2025, debtT: 38.0, interestB: 1000, note: 'Interest crosses $1T/yr — the fastest-growing "program" in the budget.' },
  { year: 2026, debtT: 40.0, interestB: 1200, note: 'Crosses $40T (this snapshot); interest ≈$1.2T — roughly two-thirds of the deficit’s recent pace.' },
];

/** Effective average rate on the stock: interest ÷ debt, computed. */
export function effectiveDebtRatePct(d: DebtYear): number {
  return Math.round((d.interestB / (d.debtT * 1000)) * 100 * 100) / 100;
}

/** Chart-ready rows: debt level, interest cost, and the computed effective rate. */
export function debtHistoryRows(): { year: string; debtT: number; interestB: number; effPct: number }[] {
  return DEBT_HISTORY.map((d) => ({
    year: String(d.year),
    debtT: d.debtT,
    interestB: d.interestB,
    effPct: effectiveDebtRatePct(d),
  }));
}

export const DEBT_INTEREST_READS: string[] = [
  'The doubling ladder: $10T (2008) → $20T (2017) → $40T (2026). Each doubling came faster relative to the economy — the ratchet only turns one way because every crisis adds a step and no expansion removes one (tab 15’s US debt-to-GDP line is this chart divided by GDP).',
  'The cheap-money illusion, visible in the computed line: from 2010 to 2021 the debt TRIPLED while the interest bill barely moved, because the effective rate fell to ~1.2%. Washington learned that debt was free. Then 2022 repriced the lesson.',
  'The rollover problem IS the interest-rate debt issue: the effective rate (~3.0% computed for 2026) is still well BELOW today’s 10Y at 4.70% — and roughly a third of the stock matures within a year. Every maturing cheap bond is reissued at market rates, so the interest bill keeps climbing EVEN IF rates never rise again. The bill is on autopilot; only the destination is debatable.',
  'Interest is now the fastest-growing line in the federal budget: ~$352B in 2021 → ≈$1.2T in 2026, past defense (~$900B) and closing on Social Security. Interest buys nothing — it is pure crowd-out of every other priority, which is why it feeds tab 15’s populism-and-fiscal-pipeline table.',
  'Borrowing to pay interest on what you borrowed is Dalio’s late-long-cycle marker (tab 2): with interest running near two-thirds of the deficit, a growing share of each auction services the LAST auctions. That supply, meeting buyers who now demand compensation, is the term premium — the reason the 10Y ROSE ~105bp while the Fed cut 175bp (step F above and tab 19’s history step).',
];
