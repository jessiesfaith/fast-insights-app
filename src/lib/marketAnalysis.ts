// Market Analysis — the model layer behind tab 4 of the Corporate Finance Lab.
//
// Three teaching pieces built on the same four dials as Market Scenarios:
//   1. What the dials MEAN in real numbers — each -2..+2 setting mapped to the
//      indicator ranges practitioners actually watch (GDP %, CPI %, fed funds,
//      deficit % of GDP), plus the kinds of changes that move each dial.
//   2. How the dials push EACH OTHER — a small cross-effect table (growth
//      feeds inflation, inflation forces the Fed, the Fed cools both, fiscal
//      feeds demand) with direction, lag, and a live pressure readout.
//   3. The debt cycles — Dalio's short-term (~7–10 yr) and long-term
//      (~50–75 yr) debt cycles, a live phase read for the short cycle, and
//      what the environment means for a company's short-term (floating) vs
//      long-term (fixed) debt.
//
// All ranges and effects are illustrative teaching values, not forecasts.
// Education only; not investment, credit, or tax advice.

import { ASSET_CLASSES, INDUSTRIES, ImpactTarget, MacroFactors, impactPct } from './macroModel';

// ---------------------------------------------------------------------------
// 1. The dials in real numbers
// ---------------------------------------------------------------------------

export interface DialLevel {
  /** Dial setting this row describes (-2..+2). */
  value: number;
  label: string;
  /** The real-world number range that reads as this setting. */
  range: string;
  meaning: string;
}

export interface DialProfile {
  key: keyof MacroFactors;
  name: string;
  /** The indicator (and unit) this dial abstracts. */
  measures: string;
  levels: DialLevel[];
  /** The kinds of changes that move this dial. */
  levers: string[];
}

export const DIAL_PROFILES: DialProfile[] = [
  {
    key: 'growth',
    name: 'Growth',
    measures: 'Real GDP growth, annualized (long-run US trend ≈ 2%)',
    levels: [
      { value: -2, label: 'Contraction', range: 'below 0%', meaning: 'The economy is shrinking — recession territory. Sales fall, layoffs start.' },
      { value: -1, label: 'Below trend', range: '0% to 1.5%', meaning: 'Growing, but slower than normal — a soft patch or early slowdown.' },
      { value: 0, label: 'At trend', range: '≈ 1.5% to 2.5%', meaning: 'The economy at cruising speed — roughly what productivity + population growth deliver.' },
      { value: 1, label: 'Above trend', range: '2.5% to 3.5%', meaning: 'Running warm — demand is outpacing the long-run speed limit.' },
      { value: 2, label: 'Boom', range: 'above 3.5%', meaning: 'Running hot — capacity strains, hiring races, and inflation pressure builds.' },
    ],
    levers: [
      'Consumer spending (~68% of US GDP) — hiring, wages, and confidence drive it',
      'Business investment — expansions, equipment, construction',
      'Credit availability — easier borrowing pulls spending forward',
      'Exports and trade — foreign demand for what you make',
      'Productivity — the slow, compounding force underneath everything',
    ],
  },
  {
    key: 'inflation',
    name: 'Inflation',
    measures: 'CPI, year over year (the Fed targets ~2%)',
    levels: [
      { value: -2, label: 'Deflation', range: 'below 0%', meaning: 'Prices falling outright — dangerous, because debts stay fixed while incomes shrink.' },
      { value: -1, label: 'Below target / cooling', range: '0% to 2%, falling', meaning: 'Disinflation — price pressure easing, the Fed gains room to cut.' },
      { value: 0, label: 'At target', range: '≈ 2% to 3%, stable', meaning: 'Roughly where the Fed wants it — predictable enough to ignore.' },
      { value: 1, label: 'Above target', range: '3% to 4.5%', meaning: 'Hot enough to keep the Fed defensive; real incomes start to lag.' },
      { value: 2, label: 'High inflation', range: 'above 4.5%', meaning: 'Every dollar buys visibly less; wage-price dynamics can take hold.' },
    ],
    levers: [
      'Demand-pull — too much money chasing too few goods (booms, stimulus)',
      'Cost-push — supply shocks: energy, tariffs, broken supply chains',
      'Wages — labor shortages feed a wage → price → wage loop',
      'Expectations — once people EXPECT inflation, they price it in, which causes it',
    ],
  },
  {
    key: 'policy',
    name: 'The Fed (monetary policy)',
    measures: 'Fed funds rate vs. neutral (≈ 3%), plus the balance sheet (QE/QT)',
    levels: [
      { value: -2, label: 'Aggressive easing', range: '50bp+ cuts and/or QE; rates pushed toward 0–2%', meaning: 'Emergency support — flooding the system with credit (2008, 2020).' },
      { value: -1, label: 'Easing', range: '25bp cuts per meeting', meaning: 'Leaning supportive — borrowing gets steadily cheaper.' },
      { value: 0, label: 'On hold', range: 'rate unchanged, near neutral ≈ 3%', meaning: 'Neither braking nor accelerating — watching the data.' },
      { value: 1, label: 'Tightening', range: '25bp hikes per meeting', meaning: 'Tapping the brakes — credit gradually more expensive.' },
      { value: 2, label: 'Aggressive tightening', range: '50–75bp hikes and/or QT; rates pushed to 5%+', meaning: 'Standing on the brakes to break inflation (2022, 1994, 1980).' },
    ],
    levers: [
      'The fed funds rate — the price of overnight money; everything reprices off it',
      'QE / QT — buying or shedding bonds to push long-term rates and liquidity',
      'Forward guidance — moving markets by saying what comes next',
    ],
  },
  {
    key: 'fiscal',
    name: "Gov't (fiscal policy)",
    measures: 'Federal deficit as % of GDP (a "normal" deficit runs ≈ 3%)',
    levels: [
      { value: -1, label: 'Austerity', range: 'deficit shrinking toward 2% or below', meaning: 'Spending cuts or tax rises pull demand OUT of the economy.' },
      { value: 0, label: 'Neutral', range: 'deficit steady ≈ 3–4% of GDP', meaning: 'The government neither adds nor removes much demand.' },
      { value: 1, label: 'Stimulus', range: 'deficit expanding past ≈ 5–6% of GDP', meaning: 'New spending or tax cuts inject demand — and add to the debt.' },
    ],
    levers: [
      'Spending programs — infrastructure, defense, transfers hit demand fast',
      'Tax changes — cuts add spending power; rises remove it',
      'Tariffs & subsidies — reshape prices and who produces what',
      'Debt issuance — big deficits mean more Treasury supply, pressuring long rates',
    ],
  },
];

/** The level row that best matches the dial's current value. */
export function levelFor(profile: DialProfile, value: number): DialLevel {
  let best = profile.levels[0];
  for (const l of profile.levels) {
    if (Math.abs(l.value - value) < Math.abs(best.value - value)) best = l;
  }
  return best;
}

// ---------------------------------------------------------------------------
// 2. How the dials push each other
// ---------------------------------------------------------------------------

export interface CrossEffect {
  from: keyof MacroFactors;
  to: keyof MacroFactors;
  /** Direction of the push on `to` per unit of `from` (+1 same way, -1 opposite). */
  sign: 1 | -1;
  lag: string;
  why: string;
}

/** The teaching feedback loops: who pushes whom, which way, and how fast. */
export const CROSS_EFFECTS: CrossEffect[] = [
  { from: 'growth', to: 'inflation', sign: 1, lag: '6–12 months', why: 'A hot economy means demand outruns capacity — demand-pull inflation.' },
  { from: 'growth', to: 'policy', sign: 1, lag: '1–2 meetings', why: 'The Fed leans against a boom (and cushions a bust) — growth invites the opposite policy.' },
  { from: 'inflation', to: 'policy', sign: 1, lag: 'the next meetings', why: 'Price stability is half the mandate — inflation above target forces hikes.' },
  { from: 'inflation', to: 'growth', sign: -1, lag: '6–12 months', why: 'Rising prices squeeze real incomes and margins — demand fades unless wages keep up.' },
  { from: 'policy', to: 'growth', sign: -1, lag: '12–18 months', why: 'Rate moves work with a long lag: hikes cool borrowing and building; cuts revive them.' },
  { from: 'policy', to: 'inflation', sign: -1, lag: '12–24 months', why: 'Tighter credit eventually cools prices — the slowest, but the decisive, link.' },
  { from: 'fiscal', to: 'growth', sign: 1, lag: '3–12 months', why: 'Government checks and contracts hit demand quickly — the fastest stimulus lever.' },
  { from: 'fiscal', to: 'inflation', sign: 1, lag: '6–18 months', why: 'Deficit spending adds money to an economy that may not have the goods to match.' },
  { from: 'fiscal', to: 'policy', sign: 1, lag: '2–4 meetings', why: 'Big stimulus in a hot economy gets offset — the Fed tightens against it.' },
];

export interface PressureDriver {
  from: keyof MacroFactors;
  /** Signed contribution: sign × current value of `from`. */
  push: number;
  lag: string;
  why: string;
}

export interface DialPressure {
  to: keyof MacroFactors;
  /** Net push on this dial from the other three (sum of driver pushes). */
  net: number;
  drivers: PressureDriver[];
}

/**
 * Given the current dials, where is each one being PUSHED by the other three?
 * Net > 0 means the configuration pressures that dial upward over its lag.
 */
export function dialPressures(f: MacroFactors): DialPressure[] {
  const keys: (keyof MacroFactors)[] = ['growth', 'inflation', 'policy', 'fiscal'];
  return keys.map((to) => {
    const drivers = CROSS_EFFECTS.filter((e) => e.to === to && f[e.from] !== 0).map((e) => ({
      from: e.from,
      push: e.sign * f[e.from],
      lag: e.lag,
      why: e.why,
    }));
    const net = drivers.reduce((s, d) => s + d.push, 0);
    return { to, net, drivers };
  });
}

export interface TrendPoint {
  quarter: string;
  growth: number;
  inflation: number;
  policy: number;
  fiscal: number;
}

const clampDial = (v: number) => Math.max(-2, Math.min(2, Math.round(v * 100) / 100));

/**
 * Project the four dials forward using only the cross-effect table: each
 * quarter, every dial drifts a step (×0.3) toward where the other dials are
 * pushing it. The negative feedback loops (the Fed leaning against growth and
 * inflation) are what bend the trends back — the same mechanism that turns a
 * boom into a brake into a recovery. A direction-of-travel illustration, not
 * a forecast.
 */
export function projectDials(f: MacroFactors, quarters = 8): TrendPoint[] {
  const STEP = 0.3;
  let cur: MacroFactors = { ...f };
  const out: TrendPoint[] = [{ quarter: 'Now', ...cur }];
  for (let q = 1; q <= quarters; q++) {
    const next: MacroFactors = { ...cur };
    for (const key of ['growth', 'inflation', 'policy', 'fiscal'] as (keyof MacroFactors)[]) {
      const net = CROSS_EFFECTS.filter((e) => e.to === key).reduce(
        (s, e) => s + e.sign * cur[e.from],
        0,
      );
      next[key] = clampDial(cur[key] + STEP * net);
    }
    cur = next;
    out.push({ quarter: `Q${q}`, ...cur });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 2b. Market & industry trends along the projected path
// ---------------------------------------------------------------------------

export interface ImpactTrendPoint {
  quarter: string;
  /** One modeled 12-month impact %, keyed by target id, per selected target. */
  [targetId: string]: number | string;
}

/**
 * Run the Market Scenarios sensitivities along the projected dial path: for
 * each future quarter, each target's modeled 12-month impact under THOSE
 * conditions. Turns the static impact table into a trend — how the backdrop
 * for an industry or asset class evolves as the feedback loops play out.
 * Same caveat as the projection itself: direction of travel, not a forecast.
 */
export function impactTrend(
  targets: ImpactTarget[],
  f: MacroFactors,
  quarters = 8,
): ImpactTrendPoint[] {
  return projectDials(f, quarters).map((p) => {
    const row: ImpactTrendPoint = { quarter: p.quarter };
    const factors: MacroFactors = { growth: p.growth, inflation: p.inflation, policy: p.policy, fiscal: p.fiscal };
    for (const t of targets) row[t.id] = impactPct(t.sens, factors);
    return row;
  });
}

// ---------------------------------------------------------------------------
// 2c. Asset classes through an industry's eyes
// ---------------------------------------------------------------------------

export type AssetRelation = 'with' | 'independent' | 'against';

export interface AssetLensRow {
  id: string;
  name: string;
  driver: string;
  /** Modeled 12-month impact under today's dials, %. */
  now: number;
  /** Cosine alignment of macro sensitivities vs. the industry, −1…+1. */
  alignment: number;
  relation: AssetRelation;
}

/**
 * Cosine similarity of two targets' macro-sensitivity vectors: +1 means they
 * respond to growth/inflation/policy/fiscal the same way (an asset that moves
 * WITH the industry — owning it concentrates the risk you already run), −1
 * means opposite (a diversifier for that business). Model-space alignment,
 * not historical correlation.
 */
export function sensAlignment(a: ImpactTarget, b: ImpactTarget): number {
  const va = [a.sens.growth, a.sens.inflation, a.sens.policy, a.sens.fiscal];
  const vb = [b.sens.growth, b.sens.inflation, b.sens.policy, b.sens.fiscal];
  const dot = va.reduce((s, x, i) => s + x * vb[i], 0);
  const mag = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  const denom = mag(va) * mag(vb);
  return denom > 0 ? Math.round((dot / denom) * 100) / 100 : 0;
}

/**
 * Every asset class scored against one industry: how it performs under the
 * current dials, and whether it moves with, independent of, or against that
 * industry. Sorted best diversifiers first — Dalio's point that uncorrelated
 * return streams are the only free lunch.
 */
export function assetLens(industryId: string, f: MacroFactors): AssetLensRow[] {
  const industry = INDUSTRIES.find((i) => i.id === industryId) ?? INDUSTRIES[0];
  return ASSET_CLASSES.map((a) => {
    const alignment = sensAlignment(industry, a);
    const relation: AssetRelation = alignment >= 0.35 ? 'with' : alignment <= -0.1 ? 'against' : 'independent';
    return { id: a.id, name: a.name, driver: a.driver, now: impactPct(a.sens, f), alignment, relation };
  }).sort((x, y) => x.alignment - y.alignment);
}

export type BackdropLevel = 'tailwind' | 'neutral' | 'headwind';

export interface IndustryBackdrop {
  level: BackdropLevel;
  /** Modeled 12-month impact under today's dials, %. */
  now: number;
  /** Modeled impact at the end of the projected path, %. */
  later: number;
  note: string;
}

/**
 * The credit-underwriting read of an industry trend: is the customer's
 * industry facing a tailwind or a headwind? Advisory context only — it does
 * not change the credit score, it tells you how skeptically to read it.
 */
export function industryBackdrop(target: ImpactTarget, f: MacroFactors): IndustryBackdrop {
  const trend = impactTrend([target], f);
  const now = trend[0][target.id] as number;
  const later = trend[trend.length - 1][target.id] as number;
  const level: BackdropLevel = now >= 2 ? 'tailwind' : now <= -2 ? 'headwind' : 'neutral';
  const drift =
    later > now + 1 ? ' The projected path improves from here.' : later < now - 1 ? ' The projected path deteriorates from here.' : '';
  const note =
    level === 'headwind'
      ? `Modeled ${now}% backdrop: their revenue engine is fighting the environment — read the watch-band ratios skeptically, prefer shorter terms, and weight security higher.${drift}`
      : level === 'tailwind'
        ? `Modeled +${now}% backdrop: the environment is helping their sales — good ratios are more believable, but do not let a tailwind excuse weak ones.${drift}`
        : `Modeled ${now >= 0 ? '+' : ''}${now}% backdrop: the environment is roughly neutral for this industry — the ratios speak for themselves.${drift}`;
  return { level, now, later, note };
}

// ---------------------------------------------------------------------------
// 3. The debt cycles — and your own debt book
// ---------------------------------------------------------------------------

export interface CyclePhase {
  name: string;
  desc: string;
}

/**
 * A rough read of where the dials sit in the SHORT-TERM (~7–10 yr) debt
 * cycle: credit expands → boom → inflation → the Fed brakes → downturn →
 * cuts → repeat.
 */
export function shortCyclePhase(f: MacroFactors): CyclePhase {
  if (f.growth < 0 && f.inflation > 0)
    return {
      name: 'Stagflationary squeeze',
      desc: 'Growth stalling while inflation stays hot — the Fed is stuck between its two mandates, so relief is slow. The 1970s version of the cycle.',
    };
  if (f.growth < 0 && f.policy <= 0)
    return {
      name: 'Downturn — easing underway',
      desc: 'The bust phase: credit contracts, the Fed cuts to cushion the fall. Historically where the NEXT expansion is born.',
    };
  if (f.growth < 0)
    return {
      name: 'Slowdown — brakes still on',
      desc: 'Growth has rolled over but policy has not turned yet. The gap between the two is where recessions deepen.',
    };
  if (f.policy > 0)
    return {
      name: 'Late cycle — the Fed is braking',
      desc: 'The boom met its speed limit: inflation forced the Fed to tighten. Credit gets expensive; the cycle usually turns 12–18 months after the brakes go on.',
    };
  if (f.growth > 0)
    return {
      name: 'Expansion — credit flowing',
      desc: 'Spending and borrowing feed each other: one person’s spending is another’s income, and credit amplifies both. Enjoy it — this is the phase that plants the next brake.',
    };
  return {
    name: 'Mid-cycle equilibrium',
    desc: 'Growth near trend, policy near neutral — the "not too hot, not too cold" equilibrium the Fed aims for and rarely keeps.',
  };
}

/** The long-term (~50–75 yr) debt cycle — static teaching story. */
export const LONG_CYCLE = {
  name: 'The long-term debt cycle (~50–75 years)',
  desc:
    'Across many short cycles, debt grows faster than income — each downturn is met with lower rates, so leverage ratchets up. ' +
    'When rates finally hit zero (1932, 2008), cutting is spent as a tool and printing money (QE) becomes the only lever left. ' +
    'The cleanse is deleveraging: some mix of austerity, restructuring, redistribution, and printing.',
  watch: [
    'Debt service vs. income — the equilibrium that must hold (debts can grow only as fast as the income that services them)',
    'Distance to the zero bound — how much cutting room the Fed has left before QE is the only tool',
    'Who holds the debt — deleveragings are fights over who eats the losses',
  ],
};

export type DebtStance = 'pressure' | 'neutral' | 'tailwind';

export interface DebtRead {
  id: 'short' | 'long';
  name: string;
  what: string;
  stance: DebtStance;
  read: string;
  action: string;
}

/**
 * What the environment means for a company's own debt book. Short-term /
 * floating debt reprices with the Fed within days; long-term fixed debt
 * locks today's rate for years (and inflation quietly erodes it).
 */
export function debtPlaybook(f: MacroFactors): DebtRead[] {
  const short: DebtRead = {
    id: 'short',
    name: 'Short-term / floating debt',
    what: 'Revolvers, commercial paper, SOFR-linked loans — reprices with the Fed within days.',
    ...(f.policy > 0
      ? {
          stance: 'pressure' as DebtStance,
          read: 'Every hike lands on your interest bill almost immediately — floating exposure is where tightening bites first.',
          action: 'Fix it: a pay-fixed swap (tab 3) or terming out into long-term fixed debt caps the damage.',
        }
      : f.policy < 0
        ? {
            stance: 'tailwind' as DebtStance,
            read: 'Your floating rate falls with every cut — no refinancing needed, the relief is automatic.',
            action: 'Stay floating and let the cuts come to you; locking a fixed rate now means paying today’s high rate through the easing.',
          }
        : {
            stance: 'neutral' as DebtStance,
            read: 'Rates on hold — your floating cost is stable for now, but it is one FOMC surprise from moving.',
            action: 'Keep floating for flexibility, but know your capacity to fix quickly if the Fed turns hawkish.',
          }),
  };

  const long: DebtRead = {
    id: 'long',
    name: 'Long-term fixed debt',
    what: 'Bonds and term loans at a locked rate — insulated from the Fed, exposed to the refinancing date.',
    ...(f.policy > 0
      ? {
          stance: 'tailwind' as DebtStance,
          read:
            'Existing fixed debt is protected — hikes cannot touch a locked rate' +
            (f.inflation > 0 ? ', and inflation is quietly shrinking it in real terms (you repay in cheaper dollars)' : '') +
            '. New issuance, though, gets pricier as yields climb.',
          action: 'Hold your locked debt; if you must borrow long anyway, sooner beats later in a hiking cycle.',
        }
      : f.policy < 0
        ? {
            stance: 'pressure' as DebtStance,
            read: 'Yields are falling — debt locked at the old highs is now above-market cost, and the gap grows with each cut.',
            action: 'Line up refinancing: call, reissue, or extend maturities near the lows, and lock cheap money for years.',
          }
        : {
            stance: 'neutral' as DebtStance,
            read: 'The curve is quiet — your locked rate is neither a bargain nor a burden.',
            action: 'Ladder your maturities so no single year holds a refinancing cliff, whatever the next cycle brings.',
          }),
  };

  return [short, long];
}
