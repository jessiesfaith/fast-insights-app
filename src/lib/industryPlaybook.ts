// Industry capital playbook — the model behind tab 5's "what to do with
// capital" recommendation.
//
// Pick your industry and the recommendation re-runs the tab-1 capital-
// allocation engine with that industry's assumptions (the MASTER LIST below:
// beta and borrowing-spread tier), then colors the advice with the industry's
// macro backdrop (the same sensitivities as the trend charts). Everything the
// recommendation depends on is listed per industry so you can challenge it —
// and override it precisely on tab 1 with your own beta, spread, or pro forma.
//
// Illustrative teaching assumptions. Education only; not investment advice.

import { INDUSTRIES, MacroFactors } from './macroModel';
import {
  OptionResult,
  SpreadTier,
  TIER_SPREAD,
  WaccBreakdown,
  WaccInputs,
  computeWacc,
  evaluateAllOptions,
} from './corpFinance';
import { IndustryBackdrop, industryBackdrop } from './marketAnalysis';

export interface IndustryProfile {
  /** Matches the INDUSTRIES id from macroModel. */
  id: string;
  name: string;
  /** Typical equity beta for the sector (teaching value). */
  beta: number;
  /** Typical credit standing → borrowing spread tier. */
  spreadTier: SpreadTier;
  /** The master list: every assumption the recommendation uses, spelled out. */
  assumptions: string[];
}

/**
 * The master assumption list, per industry. Beta drives the cost of equity
 * (CAPM), the spread tier drives the cost of debt, and the industry's macro
 * sensitivities (see macroModel INDUSTRIES) drive the backdrop.
 */
export const INDUSTRY_PROFILES: IndustryProfile[] = [
  { id: 'tech', name: 'Technology / growth', beta: 1.4, spreadTier: 'strong', assumptions: ['Beta 1.4 — long-duration cash flows swing hard with the market', 'Spread tier strong (+2%) — big tech balance sheets are cash-rich', 'Macro sensitivities: growth +6 · inflation −2 · Fed −5 · fiscal 0'] },
  { id: 'financials', name: 'Financials / banks', beta: 1.2, spreadTier: 'average', assumptions: ['Beta 1.2 — leveraged to the economy by construction', 'Spread tier average (+3%) — funding costs move with confidence', 'Macro sensitivities: growth +4 · inflation 0 · Fed +2 · fiscal 0'] },
  { id: 'energy', name: 'Energy', beta: 1.2, spreadTier: 'average', assumptions: ['Beta 1.2 — commodity-price torque', 'Spread tier average (+3%) — cyclical cash flows', 'Macro sensitivities: growth +2 · inflation +4 · Fed 0 · fiscal 0'] },
  { id: 'staples', name: 'Consumer staples', beta: 0.8, spreadTier: 'strong', assumptions: ['Beta 0.8 — people buy toothpaste in any economy', 'Spread tier strong (+2%) — stable cash flows borrow cheap', 'Macro sensitivities: growth −2 · inflation −0.5 · Fed −0.5 · fiscal 0'] },
  { id: 'discretionary', name: 'Consumer discretionary', beta: 1.3, spreadTier: 'average', assumptions: ['Beta 1.3 — the first spending cut when budgets tighten', 'Spread tier average (+3%)', 'Macro sensitivities: growth +6 · inflation −3 · Fed −3 · fiscal +1'] },
  { id: 'healthcare', name: 'Healthcare', beta: 0.9, spreadTier: 'strong', assumptions: ['Beta 0.9 — demand ignores the cycle', 'Spread tier strong (+2%)', 'Macro sensitivities: growth −1 · inflation −1 · Fed −1 · fiscal 0'] },
  { id: 'utilities', name: 'Utilities', beta: 0.7, spreadTier: 'average', assumptions: ['Beta 0.7 — bond-like, regulated returns', 'Spread tier average (+3%) — heavy but investment-grade debt loads', 'Macro sensitivities: growth −1.5 · inflation −0.5 · Fed −3 · fiscal 0'] },
  { id: 'industrials', name: 'Industrials', beta: 1.1, spreadTier: 'average', assumptions: ['Beta 1.1 — builds what growth and government order', 'Spread tier average (+3%)', 'Macro sensitivities: growth +5 · inflation 0 · Fed −2 · fiscal +2'] },
];

export type CapitalStance = 'offense' | 'balanced' | 'defense';

export interface CapitalAdvice {
  profile: IndustryProfile;
  waccInputs: WaccInputs;
  wacc: WaccBreakdown;
  /** All options ranked (best spread first) under this industry's WACC. */
  options: OptionResult[];
  /** Top two risky options. */
  top: OptionResult[];
  /** Best near-guaranteed use (debt paydown / T-bills). */
  safe: OptionResult;
  backdrop: IndustryBackdrop;
  stance: CapitalStance;
  summary: string;
}

/**
 * The live recommendation: industry assumptions → WACC → ranked options,
 * colored by the industry's backdrop. Offense when the environment helps and
 * something clears its hurdle; defense when it's a headwind or nothing
 * clears; balanced in between.
 */
export function adviseCapital(
  profileId: string,
  riskFree: number,
  f: MacroFactors,
  capital = 1_000_000,
): CapitalAdvice {
  const profile = INDUSTRY_PROFILES.find((p) => p.id === profileId) ?? INDUSTRY_PROFILES[0];
  const target = INDUSTRIES.find((i) => i.id === profile.id)!;
  const waccInputs: WaccInputs = {
    riskFree,
    beta: profile.beta,
    creditSpread: TIER_SPREAD[profile.spreadTier],
  };
  const wacc = computeWacc(waccInputs);
  const options = evaluateAllOptions(waccInputs, f, capital);
  const risky = options.filter((o) => o.id !== 'paydebt' && o.id !== 'wait');
  const safeOnes = options.filter((o) => o.id === 'paydebt' || o.id === 'wait');
  const top = risky.slice(0, 2);
  const safe = safeOnes[0];
  const backdrop = industryBackdrop(target, f);

  const bestClears = top[0]?.verdict === 'go';
  const stance: CapitalStance =
    backdrop.level === 'headwind' || !bestClears
      ? 'defense'
      : backdrop.level === 'tailwind' && bestClears
        ? 'offense'
        : 'balanced';

  const summary =
    stance === 'offense'
      ? `Offense: the environment is a tailwind for ${profile.name.toLowerCase()} and "${top[0].name}" clears its hurdle by ${top[0].spread}pp at your ${wacc.wacc}% WACC — deploy toward the best spread, and keep "${safe.name}" as the benchmark it must keep beating.`
      : stance === 'defense'
        ? `Defense: ${backdrop.level === 'headwind' ? 'the environment is a headwind for this industry' : 'no risky option clears its hurdle'} — favor "${safe.name}" (${safe.spread >= 0 ? 'clears' : 'nearest to clearing'} its bar) and keep dry powder; revisit the growth options when the dials turn.`
        : `Balanced: "${top[0].name}" leads at ${top[0].spread >= 0 ? '+' : ''}${top[0].spread}pp against a ${backdrop.level} backdrop — size it conservatively, stage the commitment, and hold "${safe.name}" as the fallback.`;

  return { profile, waccInputs, wacc, options, top, safe, backdrop, stance, summary };
}
