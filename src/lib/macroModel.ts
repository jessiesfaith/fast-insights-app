// Macro scenario model for the Market Scenarios tool.
//
// A deliberately transparent teaching model, not a forecast engine. Four macro
// factors drive everything (Dalio's "economic machine": growth, inflation, and
// the two policy levers — monetary and fiscal). Each asset class / industry has
// a small set of published sensitivities, and the modeled 12-month impact is
// simply the sum of (sensitivity x factor). The UI shows this math to the user
// on purpose: the goal is understanding the direction and the "why", never
// precision. Education only; not investment advice.

/** Factor values run -2..+2 (strongly falling .. strongly rising). */
export interface MacroFactors {
  /** Real economic growth vs. expectations. */
  growth: number;
  /** Inflation vs. expectations. */
  inflation: number;
  /** Monetary policy: + = tightening (hikes/QT), - = easing (cuts/QE). */
  policy: number;
  /** Fiscal policy: + = stimulus (spending/tax cuts), - = austerity. */
  fiscal: number;
}

/** Sensitivity of one asset/industry to each factor, in %-points per unit. */
export type Sensitivity = MacroFactors;

export interface ScenarioPreset {
  id: string;
  name: string;
  /** One-line plain-English description shown on the picker card. */
  blurb: string;
  /** Historical rhyme, e.g. "like 2022". */
  echo: string;
  factors: MacroFactors;
}

export interface ImpactTarget {
  id: string;
  name: string;
  /** Plain-English "why it moves" driver, shown next to every number. */
  driver: string;
  sens: Sensitivity;
}

export const FACTOR_RANGE = 2;

// ---------------------------------------------------------------------------
// Scenario presets
// ---------------------------------------------------------------------------

export const SCENARIOS: ScenarioPreset[] = [
  {
    id: 'goldilocks',
    name: 'Goldilocks',
    blurb: 'Steady growth, cooling inflation, a friendly Fed. The economy hums.',
    echo: 'like 2017 or the mid-1990s',
    factors: { growth: 1, inflation: -1, policy: -1, fiscal: 0 },
  },
  {
    id: 'overheating',
    name: 'Overheating — Fed hits the brakes',
    blurb: 'Demand outruns capacity, inflation jumps, the Fed raises rates hard.',
    echo: 'like 2022 or 1994',
    factors: { growth: 1, inflation: 2, policy: 2, fiscal: 0 },
  },
  {
    id: 'recession',
    name: 'Recession — Fed cuts',
    blurb: 'The economy contracts, inflation fades, the Fed cuts to cushion the fall.',
    echo: 'like 2001 or 2020',
    factors: { growth: -2, inflation: -1, policy: -2, fiscal: 1 },
  },
  {
    id: 'stagflation',
    name: 'Stagflation',
    blurb: 'Growth stalls while inflation stays hot — the Fed is stuck between both.',
    echo: 'like the 1970s',
    factors: { growth: -2, inflation: 2, policy: 1, fiscal: 0 },
  },
  {
    id: 'easy-money',
    name: 'Money printing (QE)',
    blurb: 'Rates near zero and the central bank buys assets — cheap money lifts almost everything.',
    echo: 'like 2009–2021',
    factors: { growth: 1, inflation: 1, policy: -2, fiscal: 1 },
  },
  {
    id: 'supply-shock',
    name: 'Tariff / supply shock',
    blurb: 'Tariffs or supply disruptions raise costs: a growth hit and an inflation jump at once.',
    echo: 'like 2018–2019 trade wars or the 2021 supply chain',
    factors: { growth: -1, inflation: 2, policy: 1, fiscal: 0 },
  },
];

export const CUSTOM_SCENARIO_ID = 'custom';

// ---------------------------------------------------------------------------
// Asset classes
// ---------------------------------------------------------------------------

export const ASSET_CLASSES: ImpactTarget[] = [
  {
    id: 'stocks',
    name: 'US stocks (broad market)',
    driver: 'Profits follow the economy; higher rates discount future earnings harder.',
    sens: { growth: 6, inflation: -2, policy: -3, fiscal: 1 },
  },
  {
    id: 'bonds-long',
    name: 'Long-term Treasury bonds',
    driver: 'Fixed payments — worth more when rates and inflation fall, less when they rise.',
    sens: { growth: -1, inflation: -3, policy: -4, fiscal: 0 },
  },
  {
    id: 'bonds-ig',
    name: 'Corporate bonds (investment grade)',
    driver: 'Treasury-like duration plus a credit spread — rate rises hurt it, a healthy economy tightens the spread.',
    sens: { growth: 0.5, inflation: -2.5, policy: -3, fiscal: 0 },
  },
  {
    id: 'high-yield',
    name: 'High-yield ("junk") bonds',
    driver: 'Half bond, half stock: the coupon is fixed, but whether the borrower survives depends on the economy.',
    sens: { growth: 3, inflation: -1, policy: -2, fiscal: 0.5 },
  },
  {
    id: 'tips',
    name: 'Inflation-protected bonds (TIPS)',
    driver: 'Principal rises with CPI — the direct inflation hedge; still duration, so aggressive hikes bite.',
    sens: { growth: -0.5, inflation: 2, policy: -2, fiscal: 0 },
  },
  {
    id: 'intl-stocks',
    name: 'International & EM stocks',
    driver: 'Follows global growth and the dollar: Fed tightening pulls capital home and squeezes overseas borrowers.',
    sens: { growth: 5, inflation: -1, policy: -2.5, fiscal: 1 },
  },
  {
    id: 'cash',
    name: 'Cash & T-bills',
    driver: "Earns the Fed's rate; inflation quietly eats its buying power.",
    sens: { growth: 0, inflation: -1.5, policy: 1, fiscal: 0 },
  },
  {
    id: 'gold',
    name: 'Gold',
    driver: 'Classic inflation hedge; competes with interest-paying assets when rates rise.',
    sens: { growth: -1, inflation: 3.5, policy: -2, fiscal: 0 },
  },
  {
    id: 'commodities',
    name: 'Commodities',
    driver: 'Demand-driven, and the raw material inflation itself is made of.',
    sens: { growth: 2.5, inflation: 3.5, policy: -1, fiscal: 0.5 },
  },
  {
    id: 'real-estate',
    name: 'Real estate',
    driver: 'Rents rise with inflation, but property runs on borrowed money — rate-sensitive.',
    sens: { growth: 2, inflation: 2, policy: -4, fiscal: 0.5 },
  },
];

// ---------------------------------------------------------------------------
// Industries (equity sectors)
// ---------------------------------------------------------------------------

export const INDUSTRIES: ImpactTarget[] = [
  {
    id: 'tech',
    name: 'Technology / growth',
    driver: 'Most of its value sits in far-future profits — rate moves hit hardest (long duration).',
    sens: { growth: 6, inflation: -2, policy: -5, fiscal: 0 },
  },
  {
    id: 'financials',
    name: 'Financials / banks',
    driver: 'Rising rates can widen lending margins — as long as the economy holds up.',
    sens: { growth: 4, inflation: 0, policy: 2, fiscal: 0 },
  },
  {
    id: 'energy',
    name: 'Energy',
    driver: 'Sells the very things inflation is made of — oil, gas, fuel.',
    sens: { growth: 2, inflation: 4, policy: 0, fiscal: 0 },
  },
  {
    id: 'staples',
    name: 'Consumer staples',
    driver: 'People buy toothpaste in any economy — defensive when growth falls.',
    sens: { growth: -2, inflation: -0.5, policy: -0.5, fiscal: 0 },
  },
  {
    id: 'discretionary',
    name: 'Consumer discretionary',
    driver: 'Vacations and new cars are the first spending cut when budgets tighten.',
    sens: { growth: 6, inflation: -3, policy: -3, fiscal: 1 },
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    driver: "Demand doesn't follow the business cycle — people need care either way.",
    sens: { growth: -1, inflation: -1, policy: -1, fiscal: 0 },
  },
  {
    id: 'utilities',
    name: 'Utilities',
    driver: 'Bond-like dividends: steady in downturns, but they lag when rates rise.',
    sens: { growth: -1.5, inflation: -0.5, policy: -3, fiscal: 0 },
  },
  {
    id: 'industrials',
    name: 'Industrials',
    driver: 'Builds what growth and government programs order — sensitive to both.',
    sens: { growth: 5, inflation: 0, policy: -2, fiscal: 2 },
  },
];

// ---------------------------------------------------------------------------
// Sub-industries (a lower-level lens than the eight sectors)
// ---------------------------------------------------------------------------

export const SUB_INDUSTRIES: ImpactTarget[] = [
  {
    id: 'ai-semis',
    name: 'AI & semiconductors',
    driver: 'The longest-duration growth story: value sits a decade out, so rate moves swing it hardest — while capex booms feed it regardless of the cycle.',
    sens: { growth: 7, inflation: -2, policy: -6, fiscal: 0.5 },
  },
  {
    id: 'crypto',
    name: 'Crypto / bitcoin',
    driver: 'A pure liquidity asset: easy money and inflation fear lift it, tightening drains it — no cash flows to anchor the price.',
    sens: { growth: 2, inflation: 2.5, policy: -5, fiscal: 1 },
  },
  {
    id: 'agriculture',
    name: 'Agriculture & farm inputs',
    driver: 'Sells food — the most non-negotiable spending there is; rides input-price inflation more than the growth cycle.',
    sens: { growth: 0.5, inflation: 3, policy: -0.5, fiscal: 0.5 },
  },
  {
    id: 'housing',
    name: 'Homebuilders & housing',
    driver: 'Bought with borrowed money at 30-year terms — the single most rate-sensitive corner of the real economy.',
    sens: { growth: 3, inflation: 0.5, policy: -6, fiscal: 0.5 },
  },
  {
    id: 'travel',
    name: 'Airlines & travel',
    driver: 'Peak discretionary spending with a fuel bill: booms with income, squeezed twice when inflation runs (costs up, wallets thinner).',
    sens: { growth: 5, inflation: -3, policy: -1, fiscal: 0.5 },
  },
  {
    id: 'defense',
    name: 'Defense & aerospace',
    driver: 'The customer is the government: driven by budgets and geopolitics, nearly blind to the business cycle.',
    sens: { growth: 0, inflation: 0.5, policy: 0, fiscal: 3 },
  },
  {
    id: 'biotech',
    name: 'Biotech (pre-profit)',
    driver: 'Cash burned today for approvals years away — extreme duration plus funding-window risk: tightening closes the capital markets it lives on.',
    sens: { growth: 1, inflation: -1, policy: -7, fiscal: 0 },
  },
  {
    id: 'ecommerce',
    name: 'E-commerce & retail',
    driver: 'Consumer wallet share in real time — first to feel both the boom and the squeeze on real incomes.',
    sens: { growth: 5, inflation: -2.5, policy: -2, fiscal: 1 },
  },
  {
    id: 'autos-ev',
    name: 'Autos & EV',
    driver: 'Big-ticket, financed purchases: growth-hungry, rate-sensitive at the dealership, and subsidy-sensitive on the EV side.',
    sens: { growth: 5, inflation: -1, policy: -4, fiscal: 1.5 },
  },
  {
    id: 'oil-gas',
    name: 'Oil & gas producers',
    driver: 'The deeper cut of energy: sells the barrel itself — inflation IS its revenue line.',
    sens: { growth: 2, inflation: 4.5, policy: 0, fiscal: 0 },
  },
];

// ---------------------------------------------------------------------------
// Model math
// ---------------------------------------------------------------------------

/** Modeled 12-month impact in percent (e.g. -7.5 means -7.5%). */
export function impactPct(sens: Sensitivity, f: MacroFactors): number {
  const raw =
    sens.growth * f.growth +
    sens.inflation * f.inflation +
    sens.policy * f.policy +
    sens.fiscal * f.fiscal;
  return Math.round(raw * 10) / 10;
}

/** Dollar impact of putting `capital` into a target under factors `f`. */
export function impactDollars(capital: number, sens: Sensitivity, f: MacroFactors): number {
  return Math.round(capital * (impactPct(sens, f) / 100));
}

export interface ImpactRow {
  id: string;
  name: string;
  driver: string;
  pct: number;
  dollars: number;
}

/** Compute + sort (best first) the impact table for a set of targets. */
export function impactTable(targets: ImpactTarget[], capital: number, f: MacroFactors): ImpactRow[] {
  return targets
    .map((t) => ({
      id: t.id,
      name: t.name,
      driver: t.driver,
      pct: impactPct(t.sens, f),
      dollars: impactDollars(capital, t.sens, f),
    }))
    .sort((a, b) => b.pct - a.pct);
}

// ---------------------------------------------------------------------------
// The causal chain ("how the machine reacts"), in plain English
// ---------------------------------------------------------------------------

export interface ChainStep {
  title: string;
  text: string;
}

function dir(v: number, up: string, flat: string, down: string): string {
  if (v > 0) return up;
  if (v < 0) return down;
  return flat;
}

/**
 * Builds the 5-step cause-and-effect story for the current factors:
 * market change -> policy response -> discount rate -> cash flows -> valuations.
 */
export function chainSteps(f: MacroFactors): ChainStep[] {
  return [
    {
      title: 'The economy',
      text:
        `Growth is ${dir(f.growth, 'running hot — businesses sell more and hire more', 'steady — no surprises either way', 'slowing — sales soften and layoffs start')}. ` +
        `Inflation is ${dir(f.inflation, 'rising, so every dollar buys less', 'stable', 'falling, so prices pressure eases')}.`,
    },
    {
      title: 'The two levers',
      text:
        `Monetary lever: the Fed is ${dir(
          f.policy,
          'tightening — raising rates and draining credit to cool things down',
          'on hold — watching the data',
          'easing — cutting rates (or printing money) to add credit and buying power',
        )}. ` +
        `Fiscal lever: the government is ${dir(
          f.fiscal,
          'stimulating — spending more or cutting taxes',
          'roughly neutral',
          'tightening its own belt — less spending, higher taxes',
        )}.`,
    },
    {
      title: 'The discount rate',
      text:
        `Every investment is a price paid today for future cash flows, discounted by an interest rate. Rates ${dir(
          f.policy,
          'going up means future cash flows are worth less today — the discount is bigger',
          'holding steady keeps that math unchanged',
          'coming down means future cash flows are worth more today — the discount shrinks',
        )}.`,
    },
    {
      title: 'Cash flows',
      text:
        `Company earnings ${dir(
          f.growth,
          'grow with the economy — more sales, better margins',
          'hold roughly flat',
          'shrink as customers pull back',
        )}${f.inflation > 0 ? ', while rising costs squeeze whoever cannot raise prices' : ''}.`,
    },
    {
      title: 'Valuations',
      text:
        'Price = future cash flows ÷ discount rate. The two forces above push every asset — but not equally: ' +
        'assets whose value sits far in the future (tech, long bonds, real estate) swing hardest when rates move, ' +
        'while defensive assets (staples, healthcare, utilities) barely notice the growth cycle.',
    },
  ];
}
