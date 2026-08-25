// The regime backtest — the model layer behind tab 18. Dalio's method from
// the talk, operationalized: "every time I would make a decision, I would
// write down the criteria… then take those criteria and test them through
// all periods of time and all countries — timeless and universal."
//
// Five regimes (2000, 2008, 2020, 2022, 2026) expressed as the Lab's own
// four dials, and a set of written-down decision rules — each rule is
// EVALUATED BY RUNNING THE LAB'S OWN MODELS against every regime's dials,
// never by assertion. A rule is "timeless" only if it behaves correctly in
// every regime; the famous failure (long bonds hedging stocks, which worked
// for four decades and broke in 2022) is in here on purpose.
//
// Regime dial settings and rate anchors are approximate teaching values for
// well-documented episodes. Education only; not investment advice.

import { ASSET_CLASSES, MacroFactors, impactPct } from './macroModel';
import { DEFAULT_WACC_INPUTS, evaluateAllOptions } from './corpFinance';
import { debtPlaybook } from './marketAnalysis';
import { equilibriumReads } from './economicMachine';

export interface Regime {
  id: string;
  year: string;
  name: string;
  factors: MacroFactors;
  fedFundsPct: number;
  tenYearPct: number;
  whatHappened: string;
}

export const REGIMES: Regime[] = [
  {
    id: 'y2000',
    year: '2000',
    name: 'Dot-com peak — the Fed braking a mania',
    factors: { growth: 2, inflation: 1, policy: 2, fiscal: 0 },
    fedFundsPct: 6.5,
    tenYearPct: 6.0,
    whatHappened: 'The Nasdaq lost ~78% peak-to-trough, recession followed in 2001, and the Fed cut from 6.5% toward 1% — the classic late-cycle brake finding the boom’s soft spot.',
  },
  {
    id: 'y2008',
    year: '2008',
    name: 'Global financial crisis — the long cycle turns',
    factors: { growth: -2, inflation: -1, policy: -2, fiscal: 1 },
    fedFundsPct: 0.25,
    tenYearPct: 2.5,
    whatHappened: 'The debt crisis hit the zero bound: rates to ~0, QE invented, the 1929–32 parallel from the Dalio talk. Assets bought in the wreckage compounded for a decade.',
  },
  {
    id: 'y2020',
    year: '2020',
    name: 'Pandemic — both levers at maximum',
    factors: { growth: -2, inflation: -1, policy: -2, fiscal: 1 },
    fedFundsPct: 0.1,
    tenYearPct: 0.9,
    whatHappened: 'Stimulus ~25% of GDP with QE alongside — the fastest recovery on record, then the bill: the 2022 inflation. The 10Y at 0.9% was the cheapest long money in US history.',
  },
  {
    id: 'y2022',
    year: '2022',
    name: 'Inflation shock — the brake that broke the old rules',
    factors: { growth: 1, inflation: 2, policy: 2, fiscal: 0 },
    fedFundsPct: 4.5,
    tenYearPct: 3.9,
    whatHappened: '~525bp of hikes: stocks AND long bonds fell together — the 60/40 portfolio’s worst year in decades, and the four-decade "bonds hedge stocks" pattern visibly failed.',
  },
  {
    id: 'y2026',
    year: '2026',
    name: 'Supply-shock hold — the term-premium era (today)',
    factors: { growth: -0.5, inflation: 1, policy: 0, fiscal: 0 },
    fedFundsPct: 3.63,
    tenYearPct: 4.7,
    whatHappened: 'In progress: the Fed on hold, cuts delivered but the 10Y HIGHER — supply, competition, and inflation doubt pricing the long end (tab 11). The verdict is being written now.',
  },
];

export interface RegimeVerdict {
  regimeId: string;
  year: string;
  /** Did the rule fire (recommend action) in this regime? */
  fired: boolean;
  /** Did the rule behave CORRECTLY (fire when it should, stay silent when it should)? */
  correct: boolean;
  note: string;
}

export interface RuleResult {
  id: string;
  name: string;
  criteria: string;
  verdicts: RegimeVerdict[];
  timeless: boolean;
  lesson: string;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Rule 1 — "When the Fed is tightening, fix your floating debt."
 * Evaluated with the Lab's own debt playbook: the rule fires exactly when
 * the playbook reads floating debt as 'pressure'. Correct when firing
 * precedes a tightening squeeze, and correctly SILENT in easing regimes.
 */
function ruleFixFloating(): RuleResult {
  const verdicts = REGIMES.map((reg) => {
    const short = debtPlaybook(reg.factors).find((d) => d.id === 'short')!;
    const fired = short.stance === 'pressure';
    const shouldFire = reg.factors.policy > 0;
    return {
      regimeId: reg.id,
      year: reg.year,
      fired,
      correct: fired === shouldFire,
      note: fired
        ? `Fired: the playbook reads floating debt as '${short.stance}' — fixing before the squeeze (${reg.year === '2022' ? '~525bp of hikes followed' : 'the brake preceded the bust'}).`
        : `Silent: stance '${short.stance}' — no tightening to defend against; staying floating captured the cuts.`,
    };
  });
  return {
    id: 'fix-floating',
    name: 'Fix floating debt when the Fed tightens',
    criteria: 'IF policy dial > 0 (tightening) THEN swap/term out floating-rate debt; ELSE stay floating.',
    verdicts,
    timeless: verdicts.every((v) => v.correct),
    lesson: 'Survives all five regimes — because it keys off the mechanism (floating debt reprices with the Fed in days) rather than a market pattern. Mechanism-based rules age best.',
  };
}

/**
 * Rule 2 — "Buy the downturn: acquire when recession meets easing."
 * Evaluated by running tab 1's capital engine per regime and checking
 * whether M&A actually ranks best when the rule says buy.
 */
function ruleBuyDownturn(): RuleResult {
  const verdicts = REGIMES.map((reg) => {
    const ranked = evaluateAllOptions(DEFAULT_WACC_INPUTS, reg.factors, 1_000_000);
    const maRank = ranked.findIndex((o) => o.id === 'ma') + 1;
    const fired = reg.factors.growth < 0 && reg.factors.policy < 0;
    const correct = fired ? maRank === 1 : maRank > 1;
    return {
      regimeId: reg.id,
      year: reg.year,
      fired,
      correct,
      note: fired
        ? `Fired: recession + easing — the engine ranks M&A #${maRank} of ${ranked.length} (spread ${ranked[maRank - 1].spread > 0 ? '+' : ''}${ranked[maRank - 1].spread}pp). Cheap targets, cheap money.`
        : `Silent: no recession-easing pair — M&A ranks #${maRank}; ${reg.year === '2000' || reg.year === '2022' ? 'buying the top with expensive money is how the rule protects you' : 'the engine prefers other uses'}.`,
    };
  });
  return {
    id: 'buy-downturn',
    name: 'Acquire when recession meets easing',
    criteria: 'IF growth < 0 AND policy < 0 (bust + cuts) THEN M&A should be the best-ranked use of capital; otherwise it should not be.',
    verdicts,
    timeless: verdicts.every((v) => v.correct),
    lesson: 'Survives all five — 2008 and 2020 were the buy signals, and the rule’s real value is its SILENCE at the 2000 and 2022 tops. Discipline is mostly about when not to act.',
  };
}

/**
 * Rule 3 — "Hold long bonds as the stock hedge."
 * Evaluated with the Market Scenarios sensitivities: the hedge works in a
 * regime when stocks are down and long bonds are up. The rule held for four
 * decades of demand-driven shocks — and fails when INFLATION drives the
 * shock, exactly as 2022 demonstrated.
 */
function ruleBondsHedge(): RuleResult {
  const sens = (id: string) => ASSET_CLASSES.find((a) => a.id === id)!.sens;
  const verdicts = REGIMES.map((reg) => {
    const stocks = r1(impactPct(sens('stocks'), reg.factors));
    const bonds = r1(impactPct(sens('bonds-long'), reg.factors));
    const stocksDown = stocks < 0;
    const hedgeWorked = !stocksDown || bonds > 0;
    return {
      regimeId: reg.id,
      year: reg.year,
      fired: stocksDown,
      correct: hedgeWorked,
      note: stocksDown
        ? hedgeWorked
          ? `Stocks ${stocks}%, long bonds ${bonds > 0 ? '+' : ''}${bonds}% — the hedge paid: a demand shock sends money to safety.`
          : `Stocks ${stocks}%, long bonds ${bonds}% — BOTH down: an inflation/rate shock hits every long-duration asset at once. The hedge failed.`
        : `Stocks ${stocks > 0 ? '+' : ''}${stocks}% — no drawdown to hedge (bonds ${bonds > 0 ? '+' : ''}${bonds}%).`,
    };
  });
  return {
    id: 'bonds-hedge',
    name: 'Long bonds hedge the stock portfolio',
    criteria: 'IF stocks fall THEN long Treasuries should rise (flight to safety) — hold them as the equity hedge.',
    verdicts,
    timeless: verdicts.every((v) => v.correct),
    lesson: 'NOT timeless — and that is the point. It worked in 2008 and 2020 (demand shocks) and failed in 2022 (inflation shock), after four decades of working. Dalio’s fix: diversify by ENVIRONMENT (growth × inflation), not by habit — tab 3’s alignment view exists for exactly this.',
  };
}

/**
 * Rule 4 — "Watch debt growth against the income that services it."
 * Evaluated with the machine's equilibrium-1 read per regime: the rule
 * should flag the leveraging-up episodes (the reflations) and read the
 * brakes as healing. A diagnostic rule — it never fires a trade, it fires
 * ATTENTION, which is why it can be timeless.
 */
function ruleDebtVsIncome(): RuleResult {
  const verdicts = REGIMES.map((reg) => {
    const eq1 = equilibriumReads(reg.factors, 4).find((e) => e.id === 'debt-income')!;
    const fired = eq1.status === 'above';
    const shouldFlag = -reg.factors.policy + reg.factors.fiscal - reg.factors.growth > 1;
    return {
      regimeId: reg.id,
      year: reg.year,
      fired,
      correct: fired === shouldFlag,
      note:
        eq1.status === 'above'
          ? `Flagged: credit pumped faster than income (${reg.year} reflation) — the ratchet Dalio’s rule 1 warns about, visible in real time.`
          : eq1.status === 'below'
            ? 'Read as healing: credit draining below income growth — painful, but the ratio repairing.'
            : 'In line: debt and income growing together.',
    };
  });
  return {
    id: 'debt-income',
    name: 'Flag debt growing faster than income',
    criteria: 'Watch equilibrium 1: IF the credit impulse (easing + fiscal) outruns income growth THEN flag the ratchet — the pro forma of debt service, always running.',
    verdicts,
    timeless: verdicts.every((v) => v.correct),
    lesson: 'Timeless as a DIAGNOSTIC: it flagged 2008 and 2020 (where the long-term debt stock actually ratcheted) and read 2000/2022 as healing phases. Rules that fire attention age better than rules that fire trades.',
  };
}

export function runBacktests(): RuleResult[] {
  return [ruleFixFloating(), ruleBuyDownturn(), ruleBondsHedge(), ruleDebtVsIncome()];
}

export const BACKTEST_METHOD = [
  'Write the criteria down BEFORE judging them — a rule you can’t state is a mood, not a rule (Dalio: "every time I would make a decision, I would write down the criteria").',
  'Test across ALL the regimes, not the ones that flatter the rule — timeless and universal, or not a rule.',
  'Score silence as strictly as firing: a rule that acts at the 2000 or 2022 top fails even if it worked in 2008.',
  'Prefer mechanism-based rules (floating debt reprices in days) to pattern-based rules (bonds have hedged stocks lately) — patterns break precisely when everyone relies on them.',
  'These verdicts are COMPUTED by running the Lab’s own models against each regime’s dials — change the models and the verdicts change with them. That is the deterministic version of the discipline.',
];
