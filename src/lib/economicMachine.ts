// The Economic Machine — the model layer behind tab 5 of the Corporate
// Finance Lab. A teaching build-out of Ray Dalio's framework:
//
//   1. HOW THE MARKET CYCLES — three forces stacked on each other:
//      productivity growth (slow, powerful, always up over time), the
//      short-term debt cycle (~7–10 yrs), and the long-term debt cycle
//      (~50–75 yrs). `machineCurve` draws the classic chart.
//   2. THE THREE EQUILIBRIUMS — (1) debt growth in line with the income
//      that services it; (2) the economy's operating rate neither too hot
//      nor too cold; (3) equities yielding more than bonds, bonds more than
//      cash, by appropriate risk premiums. `equilibriumReads` scores each
//      one live from the four dials.
//   3. THE TWO LEVERS — monetary (the Fed) and fiscal (the government):
//      current position, the concrete policy changes to watch for, how each
//      transmits into the machine, and how the two interact.
//
// Illustrative teaching values throughout — the goal is the mechanism, not
// precision. Education only; not investment advice.

import { MacroFactors } from './macroModel';

// ---------------------------------------------------------------------------
// 1. How the market cycles
// ---------------------------------------------------------------------------

export interface MachinePoint {
  year: number;
  /** The productivity trend — a straight line up (indexed, start = 100). */
  productivity: number;
  /** Trend + the short-term debt cycle's wave. */
  shortTerm: number;
  /** Trend + both debt cycles — the economy you actually live in. */
  economy: number;
}

export const SHORT_CYCLE_YEARS = 8;
export const LONG_CYCLE_YEARS = 70;

/**
 * The classic three-line chart: productivity as a straight line, the
 * short-term debt cycle as a ~8-year wave around it, and the long-term debt
 * cycle as a ~70-year swell underneath — above trend while leverage builds,
 * below it through the deleveraging. Illustrative amplitudes.
 */
export function machineCurve(years = 75): MachinePoint[] {
  const out: MachinePoint[] = [];
  for (let t = 0; t <= years; t++) {
    const productivity = 100 + 2 * t;
    const shortWave = 10 * Math.sin((2 * Math.PI * t) / SHORT_CYCLE_YEARS);
    const longWave = 22 * Math.sin((2 * Math.PI * t) / LONG_CYCLE_YEARS);
    const r = (v: number) => Math.round(v * 10) / 10;
    out.push({
      year: t,
      productivity: r(productivity),
      shortTerm: r(productivity + shortWave),
      economy: r(productivity + shortWave + longWave),
    });
  }
  return out;
}

/** Dalio's three rules of thumb, from the "economic machine" teaching. */
export const DALIO_RULES: string[] = [
  "Don't have debt rise faster than income — your debts will eventually crush you.",
  "Don't have income rise faster than productivity — you'll eventually become uncompetitive.",
  'Do all that you can to raise your productivity — in the long run, that is what matters most.',
];

// ---------------------------------------------------------------------------
// 2. The three equilibriums
// ---------------------------------------------------------------------------

export type EqStatus = 'balanced' | 'above' | 'below' | 'torn';

export const EQ_STATUS_LABEL: Record<EqStatus, string> = {
  balanced: 'In equilibrium',
  above: 'Out — running high',
  below: 'Out — running low',
  torn: 'Out — torn both ways',
};

export interface EquilibriumRead {
  id: 'debt-income' | 'operating-rate' | 'risk-premiums';
  n: 1 | 2 | 3;
  name: string;
  /** The rule that must hold. */
  rule: string;
  status: EqStatus;
  /** The live read from the current dials. */
  read: string;
  /** How the machine restores this equilibrium. */
  restore: string;
}

/**
 * Score the three equilibriums from the dials (teaching proxies):
 *   1. Debt vs income — credit impulse (easy money + fiscal push) vs growth.
 *   2. Operating rate — growth plus half the inflation heat.
 *   3. Risk premiums — squeezed when policy is tight (cash competes with
 *      everything), stretched when policy pins cash near zero.
 * `riskFree` (from tab 1's inputs) puts live numbers in the premium read.
 */
export function equilibriumReads(f: MacroFactors, riskFree: number): EquilibriumRead[] {
  // 1 — debt growth in line with the income that services it.
  const creditImpulse = -f.policy + f.fiscal; // both levers add (or drain) credit
  const gap = creditImpulse - f.growth;
  const eq1Status: EqStatus = gap > 1 ? 'above' : gap < -1 ? 'below' : 'balanced';
  const eq1: EquilibriumRead = {
    id: 'debt-income',
    n: 1,
    name: 'Debt grows in line with income',
    rule: 'Debts can only be serviced if the income that pays them grows at least as fast.',
    status: eq1Status,
    read:
      eq1Status === 'above'
        ? 'The levers are pumping credit faster than income is growing — borrowing is pulling tomorrow’s spending into today. Sustainable only until the servicing cost catches up (this is how the long cycle ratchets).'
        : eq1Status === 'below'
          ? 'Credit is being drained faster than income justifies — debt growth is running below income. Painful, but this is how the debt-to-income ratio heals.'
          : 'Credit and income are growing roughly in line — debts stay serviceable without borrowing from the future.',
    restore:
      'The short cycle self-corrects: too much credit brings the Fed’s brakes, too little brings cuts. When cutting is spent (rates at zero), the LONG cycle takes over and restores it by deleveraging instead.',
  };

  // 2 — the economy neither too hot nor too cold.
  const heat = f.growth + 0.5 * f.inflation;
  const eq2Status: EqStatus =
    f.growth <= -1 && f.inflation >= 1 ? 'torn' : heat >= 1.5 ? 'above' : heat <= -1.5 ? 'below' : 'balanced';
  const eq2: EquilibriumRead = {
    id: 'operating-rate',
    n: 2,
    name: 'The economy runs neither too hot nor too cold',
    rule: 'Capacity utilization near its sustainable rate — demand matching what the machine can produce.',
    status: eq2Status,
    read:
      eq2Status === 'torn'
        ? 'Stagflation: output too cold while prices run too hot — the one configuration where fixing either half worsens the other, so the Fed is stuck between its two mandates.'
        : eq2Status === 'above'
          ? 'Demand is outrunning capacity — the boom that plants its own brake, because this heat is what forces the Fed’s hand.'
          : eq2Status === 'below'
            ? 'Demand has fallen below what the machine can produce — slack, layoffs, and disinflation, which is what invites the cuts.'
            : 'Output is running near its sustainable rate — the "not too hot, not too cold" the Fed aims for and rarely keeps.',
    restore:
      'The monetary lever leans against the gap — hikes cool a hot machine, cuts warm a cold one — with the 12–18 month lag the trend chart on tab 4 shows.',
  };

  // 3 — equities out-yield bonds, bonds out-yield cash, by fair premiums.
  const eq3Status: EqStatus = f.policy >= 1.5 ? 'below' : f.policy <= -1.5 ? 'above' : 'balanced';
  const cash = riskFree;
  const eq3: EquilibriumRead = {
    id: 'risk-premiums',
    n: 3,
    name: 'Risk premiums stack in order',
    rule: 'Equities must yield more than bonds, and bonds more than cash, by enough to pay for the risk — or capital stops flowing up the risk curve.',
    status: eq3Status,
    read:
      eq3Status === 'below'
        ? `Tight policy has pushed the cash yield (~${cash}%) up against risky returns — premiums are compressed, so cash competes with everything and risk assets must reprice down until the stack is restored.`
        : eq3Status === 'above'
          ? `Easy policy has pinned cash (~${cash}%) near nothing — premiums are stretched wide, and capital is pushed out the risk curve because holding cash means going backwards (the QE effect).`
          : `The stack is orderly: cash ~${cash}%, bonds above it by a term premium, equities above bonds by the ~5.5% equity risk premium — everyone is being paid for the risk they carry.`,
    restore:
      'Prices do the work: when premiums compress, risk assets fall until they out-yield cash again; when they stretch, buying pushes risk assets up (and their forward returns down) until the stack is fair.',
  };

  return [eq1, eq2, eq3];
}

// ---------------------------------------------------------------------------
// 3. Watching the two levers
// ---------------------------------------------------------------------------

export interface LeverWatch {
  id: 'monetary' | 'fiscal';
  name: string;
  holder: string;
  /** Plain-English read of the lever's current position. */
  position: string;
  /** The concrete policy changes to watch for. */
  watchFor: string[];
  /** How a change in this lever moves through the machine. */
  transmission: string;
}

export function leverWatch(f: MacroFactors): LeverWatch[] {
  return [
    {
      id: 'monetary',
      name: 'Monetary policy',
      holder: 'The Fed (interest rates + the balance sheet)',
      position:
        f.policy > 0
          ? 'Tightening — draining credit to cool the machine.'
          : f.policy < 0
            ? 'Easing — adding credit and buying power to warm it.'
            : 'On hold — neither adding nor draining credit.',
      watchFor: [
        'FOMC rate decisions — and the dot plot showing where members think rates go next',
        'QE / QT announcements — balance-sheet expansion or runoff pace',
        'Forward-guidance language shifts ("patient", "restrictive", "data-dependent")',
        'Emergency facilities appearing — the tell that the zero bound is binding again',
      ],
      transmission:
        'Moves the Fed dial within days of the announcement; reaches growth in 12–18 months and inflation in 12–24. Every discount rate reprices immediately — which is why tab 1’s WACC and the long-duration assets swing first.',
    },
    {
      id: 'fiscal',
      name: 'Fiscal policy',
      holder: 'The government (taxes + spending)',
      position:
        f.fiscal > 0
          ? 'Stimulating — deficit spending is injecting demand.'
          : f.fiscal < 0
            ? 'Austerity — spending cuts or tax rises are draining demand.'
            : 'Roughly neutral — neither adding nor removing much demand.',
      watchFor: [
        'Budgets and appropriations — new spending programs (infrastructure, defense, transfers)',
        'Tax legislation — cuts add spending power, rises remove it',
        'Tariffs and subsidies — supply shocks you can see coming on a calendar',
        'Debt-ceiling standoffs and the Treasury issuance mix — more supply pressures long rates',
      ],
      transmission:
        'Moves the Gov’t dial when the law passes; reaches growth in 3–12 months (checks and contracts hit demand fast). Unlike the Fed, this lever is chosen, not caused — which is why nothing on tab 4 pushes it back.',
    },
  ];
}

export interface LeverInterplay {
  name: string;
  desc: string;
}

/** How the two levers are working together — or against each other. */
export function leverInterplay(f: MacroFactors): LeverInterplay {
  if (f.policy < 0 && f.fiscal > 0)
    return {
      name: 'Both levers pushing — maximum reflation',
      desc: 'Monetary easing plus fiscal stimulus (2020): the strongest configuration the machine has. Expect growth and inflation to answer — and watch equilibrium 1, because this is exactly how debt outruns income.',
    };
  if (f.policy > 0 && f.fiscal > 0)
    return {
      name: 'Offset — the Fed braking against fiscal gas',
      desc: 'Stimulus feeding demand while the Fed drains it (2022): rates must carry the whole cooling burden, so they go higher than they otherwise would, and risk premiums compress hard (equilibrium 3).',
    };
  if (f.policy < 0 && f.fiscal < 0)
    return {
      name: 'Offset — easing against austerity',
      desc: 'The Fed cushioning fiscal drag (post-2010 Europe): a slow grind, because cheap credit is pushing against a government actively removing demand.',
    };
  if (f.policy > 0)
    return {
      name: 'Braking alone',
      desc: 'Monetary tightening with fiscal sitting out: the classic late-cycle squeeze. Watch equilibrium 2 — the brakes work with a lag, and the cycle usually turns 12–18 months after they go on.',
    };
  if (f.policy < 0)
    return {
      name: 'Easing alone',
      desc: 'The Fed adding credit with no fiscal help: effective while rates have room to fall — and the reason the distance to the zero bound (the long cycle’s constraint) matters so much.',
    };
  if (f.fiscal !== 0)
    return {
      name: f.fiscal > 0 ? 'Fiscal pushing alone' : 'Austerity alone',
      desc:
        f.fiscal > 0
          ? 'Deficit spending with the Fed on hold: demand arrives fast, and if the machine is near capacity, the Fed’s next move is the thing to watch.'
          : 'Fiscal drag with the Fed on hold: demand leaks out until the data forces the monetary lever to answer.',
    };
  return {
    name: 'Both levers idle',
    desc: 'The machine is running on its own momentum — the productivity trend plus wherever the two debt cycles currently sit. Watch the data that would wake either lever.',
  };
}
