// The Economic Machine — the model layer behind tab 4 of the Corporate
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

const NEUTRAL_FACTORS: MacroFactors = { growth: 0, inflation: 0, policy: 0, fiscal: 0 };

/**
 * The classic three-line chart, made live: productivity as a straight line,
 * the short-term debt cycle as a ~8-year wave, the long-term debt cycle as a
 * ~70-year swell — with YEAR 0 = TODAY, positioned by the dials:
 *   - The short wave starts where growth says we are (above/below trend) and
 *     heads where policy says we're going — tightening means past the peak
 *     and rolling over, easing means climbing out of the trough.
 *   - The long wave's position follows the credit stance: sustained easing
 *     is the leveraging-up phase; hard tightening sits near the top where
 *     deleveraging pressure starts.
 * Move the dials and the path from "now" changes — that's the point.
 * Illustrative amplitudes; direction of travel, not a forecast.
 */
export function machineCurve(f: MacroFactors = NEUTRAL_FACTORS, years = 40): MachinePoint[] {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  // Short cycle: sin(φ) = today's deviation from trend (growth dial);
  // policy picks the side of the wave — tightening = past the peak (falling
  // side), easing or neutral = the rising side.
  const g0 = clamp(f.growth / 2, -0.95, 0.95);
  const shortPhase = f.policy > 0 ? Math.PI - Math.asin(g0) : Math.asin(g0);
  // Long cycle: the credit stance (easing = leveraging up, early in the
  // swell; tightening = late, near the peak where deleveraging starts).
  const creditStance = clamp(-f.policy / 2, -1, 1); // +1 max easing … −1 max tightening
  const longPhase = Math.PI * (0.3 - 0.25 * creditStance);

  const out: MachinePoint[] = [];
  for (let t = 0; t <= years; t++) {
    const productivity = 100 + 2 * t;
    const shortWave = 10 * Math.sin((2 * Math.PI * t) / SHORT_CYCLE_YEARS + shortPhase);
    const longWave = 22 * Math.sin((2 * Math.PI * t) / LONG_CYCLE_YEARS + longPhase);
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
// 1b. The six forces, read against the three equilibriums and two levers
// ---------------------------------------------------------------------------

export interface MachineForce {
  id: string;
  name: string;
  /** What this force IS, in one breath. */
  what: string;
  /** How it hits each of the three equilibriums. */
  eq1: string;
  eq2: string;
  eq3: string;
  /** Its relationship to the two levers. */
  lever: string;
  /** Two hypotheticals: what a change in this force would do. */
  hypotheticals: [string, string];
  /** A real episode from the past. */
  history: string;
}

export const MACHINE_FORCES: MachineForce[] = [
  {
    id: 'productivity',
    name: 'Force 1 — Productivity (the most important, and the least felt)',
    what: 'Dalio in the talk: "Over a period of time we raise our living standards because we learn how to do things better — that\'s called productivity." It evolves, so it isn\'t the big thing you SEE — but it is the most important thing over time. On his 1900-to-today chart, "even the biggest economic turbulence looks like a bump" on the productivity line.',
    eq1: 'The honest way to satisfy equilibrium 1: productivity-driven income growth services debt without new borrowing — his third rule of thumb.',
    eq2: 'Raises the speed limit itself: more output per hour means the economy can run faster before it presses against capacity.',
    eq3: 'Real earnings growth ultimately pays the equity risk premium — productivity is why asset classes can beat cash over the long run at all.',
    lever: 'Neither lever creates it. The talk\'s warning: late in the long-term debt cycle productivity "bends over" — Japan, latest in its cycle, shows hardly any productivity growth at all.',
    hypotheticals: [
      'Hypothetical A: AI adoption adds 1pp to productivity growth → trend growth rises, inflation stays tamer at the same demand, every hurdle on tab 1 gets easier to clear — the talk\'s point that technology decides which countries succeed.',
      'Hypothetical B: productivity stalls for a decade → income growth relies on borrowing alone, equilibrium 1 strains, and the machine becomes pure debt cycle with no trend underneath — the Japan chart.',
    ],
    history: 'The talk\'s own charts: developed-world productivity visibly bending over as countries move later into their long-term debt cycles — the US slower over the last 10 years than since 1980, Japan flattest of all. The late-1990s IT boom is the happy counterexample: ~3% productivity let the Fed hold rates through a boom with inflation falling.',
  },
  {
    id: 'short-debt',
    name: 'Force 2 — The short-term debt cycle (7–10 years)',
    what: 'The business cycle. Dalio: "Credit is buying power… first comes the stimulation, then comes the paying back — when you produce credit you can spend more than you earn, and when you pay back you have to spend less than you earn." That IS the cycle: recession → central bank produces credit → purchases pick up → demand rises against capacity → the brakes → recession again.',
    eq1: 'Is the equilibrium-1 correction loop in action: over-borrowing brings the brakes, credit droughts bring the cuts.',
    eq2: 'The dial he watches: "as you get later in the cycle… there\'s less slack, the unemployment rate is low, they put the brakes on it." The operating rate overshooting in both directions is the cycle.',
    eq3: 'His exact mechanism: tightening "will change the projected return of cash relative to bonds and of equities — those risk premiums — and that will slow the economy down."',
    lever: 'Driven by the monetary lever: they tighten "by either raising interest rates or lowering the purchases of the financial assets that they buy." In the talk he counted the then-cycle at nine years in — "the seventh inning."',
    hypotheticals: [
      'Hypothetical A: banks loosen lending standards late in an expansion → credit grows ahead of the income that services it, the boom gets one more leg, and the eventual brake must be harder.',
      'Hypothetical B: a credit crunch — lenders pull lines at once → spending falls, which is someone else\'s income falling, and the spiral runs until the central bank floors rates.',
    ],
    history: '2004–2009 in one arc: easy credit → housing boom → seventeen straight hikes → bust and crunch — the textbook short cycle, ending at the zero bound, which is where the LONG cycle takes over.',
  },
  {
    id: 'long-debt',
    name: 'Force 3 — The long-term debt cycle (the accumulation)',
    what: 'Dalio: "Everybody wants things to go up… so central banks over a period of time stimulate, normally by lowering interest rates — until interest rates hit zero and they can\'t do that anymore. Then we come to the need to print money and buy financial assets — quantitative easing — and when they can\'t do that anymore, we come to the end of the long-term debt cycle."',
    eq1: 'Equilibrium 1 violated in slow motion for decades — each downturn met with lower rates, so leverage ratchets — then restored all at once by deleveraging. And the talk\'s reminder: unfunded pension and healthcare liabilities are "promises that have to be kept" that we don\'t even call debt (the same reason tab 1\'s pro forma adds pension to leverage).',
    eq2: 'During the deleveraging the economy runs cold for years whatever rates do — 1930s, post-2008.',
    eq3: 'At the zero bound cash yields nothing, so QE stretches the premium stack to force capital out the risk curve — "that particularly benefited those who had financial assets," which fed the wealth gap and the politics below.',
    lever: 'Defined by the monetary lever running out. His capacity test: distance to zero plus QE room — the US could cut ~2.5% to zero; Europe sat AT zero with 33% purchase caps already hit; Japan slightly negative. "We\'re going from tailwinds to headwinds."',
    hypotheticals: [
      'Hypothetical A: rates reach zero with debt service still crushing incomes → cutting is spent, QE begins, and the deleveraging question becomes who eats the losses: savers (inflation), creditors (default), or taxpayers (bailouts).',
      'Hypothetical B: a "beautiful deleveraging" — printing balanced against defaults and austerity so debt burdens fall while nominal growth continues.',
    ],
    history: 'The talk\'s core parallel: 2008–09 rhymes with 1929–32 — debt crisis, rates hit zero, print money and buy assets. Then 1932–37 the economy picks up, 1937 they tighten fearing overheat, and cause the 1938 downturn — the first time anyone said "recession" (it meant re-depression). That sequence is why late-cycle tightening after QE is the moment he watches hardest.',
  },
  {
    id: 'politics',
    name: 'Force 4 — Politics (internal and external)',
    what: 'The talk\'s fourth force, in two halves. Internal: the wealth gap — "the top one-tenth of one percent\'s net worth is almost the same as the bottom 90 percent combined… 40% of all Americans could not raise $400 in an emergency… no real income growth for the bottom 60% since 1980" — producing populism of the left AND the right, with party polarity the widest since 1900. External: "a rising power challenging an existing power" — China and the US — a geopolitical cycle expressed through trade and technology (his example: 5G and Huawei).',
    eq1: 'Elections choose the fiscal lever and can ratchet sovereign debt; his example of politics moving markets: the US corporate tax cut "caused stock prices to rise."',
    eq2: 'Supply shocks from conflict and tariffs hit equilibrium 2 from the cost side — less output at higher prices, the torn reading.',
    eq3: 'Political risk moves capital flows directly — his example: a hard-left UK government "will have an effect on capital flows." Elections framed as capitalism vs socialism become market events.',
    lever: 'Owns the fiscal lever outright and constrains the monetary one. His reserve-currency arc is the long game: Dutch guilder → British pound → US dollar, each built on a technology edge (Dutch ships carried half of world trade), each ending as the empire\'s finances decayed.',
    hypotheticals: [
      'Hypothetical A: a broad tariff wave → import costs jump (inflation up), export markets retaliate (growth down) — the one shock that pushes both mandates the wrong way at once.',
      'Hypothetical B: an election swings policy hard left or right → capital flows move BEFORE any economic data does — the dials jump because a law passed, not because the economy changed.',
    ],
    history: 'The 1930s: wealth gap + zero rates + printing + a rising power challenging an existing one — the talk\'s explicit template for today. The 1973 oil embargo and the 2018–19 tariff wave are the supply-shock rhymes.',
  },
  {
    id: 'monetary',
    name: 'Lever 1 — Monetary policy (the brakes and the gas)',
    what: 'Dalio\'s first lever: "Monetary policy is the means by which the brakes and the gas are put on" — the price and quantity of credit, via the policy rate and the balance sheet (QE/QT). The fastest-acting steering input the machine has.',
    eq1: 'Sets how fast debt grows: cheap money invites borrowing beyond income growth; dear money forces debt growth back below it.',
    eq2: 'The thermostat — "if debt growth is too high relative to income growth and capacity utilization is stretched, monetary policy will be tightened," with a 12–18 month lag.',
    eq3: 'His transmission, verbatim: tightening "will change the projected return of cash relative to bonds and of equities — those risk premiums — and that will slow the economy down." The stack IS the steering.',
    lever: 'Works only while there\'s room: rates above zero to cut, or QE capacity. Measuring that room country by country was the talk\'s way of judging who can still ease.',
    hypotheticals: [
      'Hypothetical A: a surprise +100bp of hikes → floating-rate interest bills jump within days, long-duration assets reprice down, and 12–18 months later growth and inflation cool.',
      'Hypothetical B: 150bp of cuts into a slowdown → refinancing waves, housing and capex revive, risk premiums stretch, and the next leveraging-up leg begins.',
    ],
    history: '1980: Volcker near 20% broke double-digit inflation at the cost of two recessions. 1937: tightening too early after QE re-broke the recovery. 2022: ~525bp of hikes compressed every premium and repriced long duration hardest.',
  },
  {
    id: 'fiscal',
    name: 'Lever 2 — Fiscal policy (taxes and spending)',
    what: 'The second lever: demand injected or drained by law. Chosen politically — which is why force 4 owns it — so it pushes the machine but is never pushed back by it.',
    eq1: 'Deficits are sovereign borrowing: stimulus grows debt faster than income unless growth answers; austerity does the reverse.',
    eq2: 'The fastest demand lever: checks and contracts hit spending within quarters — powerful cold, inflationary hot.',
    eq3: 'Big deficits mean more government-bond supply pressuring the bond leg of the stack; and the talk\'s live example — the corporate tax cut lifting stock prices — is fiscal policy moving equilibrium 3 directly.',
    lever: 'Coordination with lever 1 decides everything: pushing together is maximum force (2020), opposed makes rates carry the whole burden (2022), and at the zero bound fiscal (plus the printing press) is the only lever left.',
    hypotheticals: [
      'Hypothetical A: a $1T infrastructure program in a soft economy → industrials and capacity investment lead, growth answers within a year, the long-term debt stock ratchets higher.',
      'Hypothetical B: austerity in a weak economy → demand leaks out faster than debt falls, and the central bank is forced to ease against the drag.',
    ],
    history: '2020–21: both levers at maximum (stimulus ~25% of GDP with QE alongside) — the fastest recovery on record, then the 2022 inflation. Post-2010 Eurozone austerity is the reverse: a decade of grind with the ECB easing against it.',
  },
];

/**
 * Dalio's investment principles from the same talk — the second half of the
 * template, each tied to where the Lab lets you practice it.
 */
export interface InvestPrinciple {
  n: number;
  name: string;
  what: string;
  useIt: string;
}

export const DALIO_INVEST_PRINCIPLES: InvestPrinciple[] = [
  {
    n: 1,
    name: 'Value = present value of future cash flows',
    what: '"Every investment is a lump-sum payment for a future cash flow" — project the cash flows, discount at an interest rate, that\'s the theoretical value. Raise the discount rate and every asset is worth less today.',
    useIt: 'Tab 5 IS this principle: watch EV fall as you raise WACC.',
  },
  {
    n: 2,
    name: 'Price = total spending ÷ quantity',
    what: 'His actual-value rule: price equals the total amount of spending divided by the quantity sold. So he asks: who are the buyers, what are their motivations, how much total spending will there be? When central banks buy assets (QE), spending rises and prices rise — mechanically.',
    useIt: 'Tab 4\'s QE discussion and equilibrium 3: the buyer with a printing press moves every price.',
  },
  {
    n: 3,
    name: 'Asset classes beat cash over the long run — with big bumps',
    what: 'Required, "otherwise the gears of the economy come to a halt": cash must yield less than bonds, bonds less than equities, or nobody funds anything. But that beta comes with large drawdowns — it can\'t be easy money or everyone would lever it.',
    useIt: 'Equilibrium 3 on tab 4 — and why "prepay/hold cash forever" is a decision, not a default.',
  },
  {
    n: 4,
    name: 'Assets price EXPECTATIONS — growth, inflation, premiums, discount rates',
    what: 'His two main drivers: growth and inflation coming in higher or lower than discounted. "If you tell me inflation and growth will be higher than expected, I know what to invest in." Everything else is discount rates and risk premiums.',
    useIt: 'Tabs 3–4\'s four dials are exactly this: the surprise vs. what\'s priced, not the level.',
  },
  {
    n: 5,
    name: 'Balance risk, not dollars',
    what: 'A 50/50 dollar split of stocks and bonds is NOT diversified — "the volatility of stocks is twice the volatility of bonds," so the stocks dominate the risk. Weight positions by risk contribution, then diversify across environments (rising/falling growth × rising/falling inflation): the all-weather idea.',
    useIt: 'Tab 3\'s asset-by-industry alignment view — pair streams that don\'t catch the same shocks.',
  },
  {
    n: 6,
    name: 'Beta vs. alpha — and alpha is poker',
    what: 'Beta returns exist for structural reasons you can know (growth surprises lift stocks). Alpha — beating the market — is a zero-sum game: "for me to produce alpha I have to take money away from somebody else, like a poker table." Know which game you\'re playing.',
    useIt: 'Everything in this Lab is beta thinking: understanding the machine, not out-trading it.',
  },
  {
    n: 7,
    name: 'The Holy Grail: 15+ good, uncorrelated return streams',
    what: 'His chart: with 60%-correlated assets (average stocks), adding a hundred more barely cuts risk — a thousand stocks diversify no better than 5–10. But five UNCORRELATED streams more than halve risk, and ~15 cut it by ~80% — improving return-to-risk about five-fold. Diversification done right beats picking the best investment.',
    useIt: 'Tab 3\'s alignment scores are a miniature of this: hunt the negative and zero alignments.',
  },
  {
    n: 8,
    name: '"Did well" means "got more expensive" — and write your criteria down',
    what: 'The biggest investor mistake in the talk: "they think the investment that did well is a good investment, rather than a more expensive investment." His antidote is the whole method: write decision criteria down, then test them across all times and all countries — timeless and universal.',
    useIt: 'The formulas tab (6) is your criteria written down; the scenario presets are the all-times test.',
  },
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
    rule: 'Dalio, verbatim: "Debt growth has to be in line with the income growth that\'s required to service the debt… I\'m always doing the pro forma — what is the ability to service that debt."',
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
    rule: 'Dalio: "The rate of economic activity — capacity utilization — is neither too high nor too low." Pressing up too much brings the tightening; too much slack brings the adjustment up.',
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
      'The monetary lever leans against the gap — hikes cool a hot machine, cuts warm a cold one — with the 12–18 month lag the trend chart on tab 3 shows.',
  };

  // 3 — equities out-yield bonds, bonds out-yield cash, by fair premiums.
  const eq3Status: EqStatus = f.policy >= 1.5 ? 'below' : f.policy <= -1.5 ? 'above' : 'balanced';
  const cash = riskFree;
  const eq3: EquilibriumRead = {
    id: 'risk-premiums',
    n: 3,
    name: 'Risk premiums stack in order',
    rule: 'Dalio: "The projected returns of equities are above bonds, above cash, by appropriate risk premiums" — required, or the gears of the economy come to a halt: cash sits on deposit so people with better ideas can use it for more.',
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
        'Moves the Gov’t dial when the law passes; reaches growth in 3–12 months (checks and contracts hit demand fast). Unlike the Fed, this lever is chosen, not caused — which is why nothing on tab 3 pushes it back.',
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
