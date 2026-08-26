// Report builder — the model layer behind tab 19 of the Corporate Finance Lab.
//
// One place to read everything the Lab knows about a COUNTRY, a US STATE, or
// an INDUSTRY (in any combination — e.g. "California × Technology"), pulled
// from the same deterministic data the source tabs render. Nothing here is
// new data: every section carries a ReportRef naming the tab and step it
// comes from, so the report is a table of contents you can act on.
//
// Education only; sources and honesty labels travel with each section.

import {
  COUNTRY_DEBT,
  CURRENCY_TRENDS,
  CountryDebt,
  CurrencyTrend,
  GDP_IMPACT_COUNTRIES,
  GEO_CALENDAR_COUNTRIES,
  GEO_CALENDAR_STATES,
  GSP_IMPACT_STATES,
  GdpImpactRow,
  GeoEvent,
  KOREA_CASE,
  POPULISM_WATCH,
  PopulismRow,
  STATE_DEBT,
  StateDebt,
  TRADE_BALANCES,
  TradeBalance,
  tradeBalanceB,
} from './debtGeo';
import { INDUSTRIES, ImpactTarget, MacroFactors, SUB_INDUSTRIES, impactPct } from './macroModel';
import { CapitalAdvice, INDUSTRY_PROFILES, IndustryProfile, adviseCapital } from './industryPlaybook';
import { DAMODARAN_JAN2026, IndustryBenchmarkRow } from './industryBenchmarks';
import { SECTOR_IPO_TRENDS, SECTOR_IPO_YEARS, SectorIpoTrend } from './ipoWindow';
import { IndustryBackdrop, industryBackdrop } from './marketAnalysis';
import { EXTRA_COUNTRIES, EXTRA_COUNTRY_PROFILES, EXTRA_CURRENCY_NOTES, EXTRA_PROFILE_SOURCE, GeoExposure } from './geoPolitics';

// ---------------------------------------------------------------------------
// References — every section names where it lives in the Lab
// ---------------------------------------------------------------------------

export interface ReportRef {
  tab: number;
  step: string;
  label: string;
}

export function refText(r: ReportRef): string {
  return `Tab ${r.tab} · step ${r.step} — ${r.label}`;
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export interface ReportChoice {
  id: string;
  name: string;
}

/** The top-10 debt list, South Korea, and the six strategic countries. */
export const REPORT_COUNTRIES: ReportChoice[] = [
  ...COUNTRY_DEBT.map((c) => ({ id: c.id, name: c.name })),
  { id: 'skorea', name: 'South Korea' },
  ...EXTRA_COUNTRIES.map((c) => ({ id: c.id, name: c.name })),
];

export const REPORT_STATES: ReportChoice[] = STATE_DEBT.map((s) => ({ id: s.id, name: s.name }));

export const REPORT_INDUSTRIES: ReportChoice[] = INDUSTRIES.map((i) => ({ id: i.id, name: i.name }));

/** Which currency line tells each country's story (null = the US dollar IS the measuring stick). */
export const COUNTRY_CURRENCY: Record<string, string | null> = {
  us: null,
  china: 'cny',
  japan: 'jpy',
  germany: 'eur',
  uk: 'gbp',
  france: 'eur',
  india: 'inr',
  italy: 'eur',
  brazil: 'brl',
  canada: 'cad',
  skorea: 'krw',
  iran: null,
  russia: null,
  taiwan: null,
  mexico: null,
  venezuela: null,
  saudi: null,
};

export const US_CURRENCY_NOTE =
  'No line for the US: every currency on tab 15’s chart is measured AGAINST the dollar, so the dollar’s strength is the mirror image of everyone else’s slide — reserve-currency status is why the US deficit stays financeable (and tab 11’s term premium is what it costs when markets start to charge).';

// ---------------------------------------------------------------------------
// Country report
// ---------------------------------------------------------------------------

export interface CountryReport {
  id: string;
  name: string;
  debt: { row: CountryDebt; ref: ReportRef; how: string } | null;
  trade: { row: TradeBalance; balanceB: number; ref: ReportRef; how: string } | null;
  currency: { row: CurrencyTrend; ref: ReportRef; how: string } | null;
  /** Set for the US instead of a currency row. */
  currencyNote: string | null;
  populism: { row: PopulismRow; ref: ReportRef; how: string } | null;
  impactWatch: { row: GdpImpactRow; ref: ReportRef; how: string } | null;
  calendar: { events: GeoEvent[]; ref: ReportRef; how: string };
  /** The full Korea case study, for skorea only. */
  caseStudy: typeof KOREA_CASE | null;
  /** Strategic profile — set for the six strategic countries outside the top-10 tables. */
  profile: { row: GeoExposure; source: string } | null;
}

export function countryReport(id: string): CountryReport {
  const choice = REPORT_COUNTRIES.find((c) => c.id === id) ?? REPORT_COUNTRIES[0];
  const debtRow = COUNTRY_DEBT.find((c) => c.id === choice.id) ?? null;
  const tradeRow = TRADE_BALANCES.find((t) => t.id === choice.id) ?? null;
  const fxId = COUNTRY_CURRENCY[choice.id] ?? null;
  const fxRow = fxId ? (CURRENCY_TRENDS.find((c) => c.id === fxId) ?? null) : null;
  const popRow = POPULISM_WATCH.find((p) => p.country === choice.name) ?? null;
  const impactRow = GDP_IMPACT_COUNTRIES.find((g) => g.id === choice.id) ?? null;
  const events = GEO_CALENDAR_COUNTRIES.filter((e) => e.where === choice.name);

  return {
    id: choice.id,
    name: choice.name,
    debt: debtRow && {
      row: debtRow,
      ref: { tab: 15, step: 'A', label: 'Country debt-to-GDP trends' },
      how: 'Debt ÷ GDP, 2000 → 2025. Read the SLOPE, not just the level: a ratcheting ratio is Dalio’s long-term debt cycle aging; who holds the debt (own central bank vs foreign creditors) decides how much a level matters.',
    },
    trade: tradeRow && {
      row: tradeRow,
      balanceB: tradeBalanceB(tradeRow),
      ref: { tab: 15, step: 'C', label: 'Imports vs exports' },
      how: 'Balance = exports − imports (computed, never typed). Surplus = earning foreign currency; deficit = borrowing it. Pair with the currency line below: surplus + sliding currency = the story is politics, not trade.',
    },
    currency: fxRow && {
      row: fxRow,
      ref: { tab: 15, step: 'D', label: 'Currency trends (2021 = 100)' },
      how: 'Indexed vs the US dollar, 2021 = 100 — a falling line is a weakening currency. Below ~85, imported inflation and capital flight become policy problems; the central bank gets squeezed between defending the currency and defending growth.',
    },
    currencyNote: choice.id === 'us' ? US_CURRENCY_NOTE : (EXTRA_CURRENCY_NOTES[choice.id] ?? null),
    populism: popRow && {
      row: popRow,
      ref: { tab: 15, step: 'F', label: 'Populism & the fiscal pipeline' },
      how: 'The Dalio chain made local: wealth gap → populist pressure → fiscal promises → deficits → the bond market charges a term premium. "Pressure" is how loaded the spring is; "pipeline" is what’s scheduled to release it in the next 24 months.',
    },
    impactWatch: impactRow && {
      row: impactRow,
      ref: { tab: 15, step: 'G', label: 'GDP impact watch (health / food / education)' },
      how: 'The non-fiscal 24-month movers. Each item ends in the dial it moves — an avian-flu wave IS tab 3’s food-inflation line; an education squeeze is a slow productivity (growth-dial) story.',
    },
    calendar: {
      events,
      ref: { tab: 15, step: 'J', label: '24-month political calendar' },
      how: 'Scheduled events only (elections, budget deadlines) — schedules, not predictions. Verify dates before citing.',
    },
    caseStudy: choice.id === 'skorea' ? KOREA_CASE : null,
    profile: (() => {
      const row = EXTRA_COUNTRY_PROFILES.find((x) => x.id === choice.id);
      return row ? { row, source: EXTRA_PROFILE_SOURCE } : null;
    })(),
  };
}

// ---------------------------------------------------------------------------
// State report
// ---------------------------------------------------------------------------

export interface StateReport {
  id: string;
  name: string;
  debt: { row: StateDebt; rankAmongTen: number; ref: ReportRef; how: string };
  impactWatch: { row: GdpImpactRow; ref: ReportRef; how: string } | null;
  calendar: { events: GeoEvent[]; ref: ReportRef; how: string };
}

export function stateReport(id: string): StateReport {
  const row = STATE_DEBT.find((s) => s.id === id) ?? STATE_DEBT[0];
  const sorted = [...STATE_DEBT].sort((a, b) => b.debtGspPct - a.debtGspPct);
  const rankAmongTen = sorted.findIndex((s) => s.id === row.id) + 1;
  const impactRow = GSP_IMPACT_STATES.find((g) => g.id === row.id) ?? null;
  const events = GEO_CALENDAR_STATES.filter((e) => e.where.includes(row.name));

  return {
    id: row.id,
    name: row.name,
    debt: {
      row,
      rankAmongTen,
      ref: { tab: 15, step: 'B', label: 'US state debt-to-GSP' },
      how: 'Bonded debt ÷ gross state product. States balance operating budgets by law, so the ratios run FAR below countries — the honest state balance sheet is bonded debt PLUS the pension note: Illinois and New Jersey prove the unfunded promise can dwarf the bonds.',
    },
    impactWatch: impactRow && {
      row: impactRow,
      ref: { tab: 15, step: 'G', label: 'GSP impact watch (health / food / education)' },
      how: 'The state-level non-fiscal movers over 24 months, each ending in the read that matters for the state economy.',
    },
    calendar: {
      events,
      ref: { tab: 15, step: 'J', label: '24-month political calendar (states)' },
      how: 'Scheduled state events — governors, budget fights, pension votes. Verify dates before citing.',
    },
  };
}

// ---------------------------------------------------------------------------
// Industry report
// ---------------------------------------------------------------------------

/** Damodaran benchmark rows that speak to each of the eight industries. */
export const INDUSTRY_BENCHMARK_MAP: Record<string, string[]> = {
  tech: ['software'],
  healthcare: ['biotech', 'pharma'],
  staples: ['grocery'],
  discretionary: ['restaurants'],
  financials: [],
  energy: [],
  utilities: [],
  industrials: [],
};

/** Which tab-13 IPO sector line tells each industry's window story. */
export const INDUSTRY_IPO_MAP: Record<string, string | null> = {
  tech: 'tech',
  healthcare: 'biotech',
  financials: 'fintech',
  industrials: 'industrials',
  discretionary: 'consumer',
  staples: 'consumer',
  energy: null,
  utilities: null,
};

/** The tab-3 sub-industry lenses that live under each industry. */
export const INDUSTRY_SUBS_MAP: Record<string, string[]> = {
  tech: ['ai-semis', 'crypto', 'ecommerce'],
  financials: ['crypto'],
  energy: ['oil-gas'],
  staples: ['agriculture'],
  discretionary: ['travel', 'autos-ev', 'housing'],
  healthcare: ['biotech'],
  utilities: [],
  industrials: ['defense', 'housing'],
};

export interface SubLensRead {
  target: ImpactTarget;
  nowPct: number;
}

export interface IndustryReport {
  id: string;
  name: string;
  target: ImpactTarget;
  profile: IndustryProfile;
  backdrop: { read: IndustryBackdrop; ref: ReportRef; how: string };
  advice: { result: CapitalAdvice; ref: ReportRef; how: string };
  benchmarks: { rows: IndustryBenchmarkRow[]; ref: ReportRef; how: string };
  ipo: { row: SectorIpoTrend; years: readonly string[]; ref: ReportRef; how: string } | null;
  subs: { reads: SubLensRead[]; ref: ReportRef; how: string };
}

export function industryReport(id: string, riskFree: number, f: MacroFactors): IndustryReport {
  const target = INDUSTRIES.find((i) => i.id === id) ?? INDUSTRIES[0];
  const profile = INDUSTRY_PROFILES.find((p) => p.id === target.id) ?? INDUSTRY_PROFILES[0];
  const benchIds = INDUSTRY_BENCHMARK_MAP[target.id] ?? [];
  const benchRows = DAMODARAN_JAN2026.filter((b) => benchIds.includes(b.id));
  const ipoId = INDUSTRY_IPO_MAP[target.id] ?? null;
  const ipoRow = ipoId ? (SECTOR_IPO_TRENDS.find((t) => t.id === ipoId) ?? null) : null;
  const subIds = INDUSTRY_SUBS_MAP[target.id] ?? [];
  const subs = SUB_INDUSTRIES.filter((s) => subIds.includes(s.id)).map((s) => ({
    target: s,
    nowPct: impactPct(s.sens, f),
  }));

  return {
    id: target.id,
    name: target.name,
    target,
    profile,
    backdrop: {
      read: industryBackdrop(target, f),
      ref: { tab: 3, step: 'C', label: 'Industry backdrops under the dials' },
      how: 'The linear sensitivity model: impact% = Σ (sensitivity × dial) across growth / inflation / Fed / fiscal. Teaching-scale magnitudes — read the SIGN and relative size, not the decimals.',
    },
    advice: {
      result: adviseCapital(profile.id, riskFree, f),
      ref: { tab: 4, step: 'F', label: 'What to do with capital — by industry' },
      how: 'Industry assumptions (β, credit-spread tier) → WACC → every capital use re-ranked against risk-adjusted hurdles → an offense/balanced/defense stance colored by the backdrop.',
    },
    benchmarks: {
      rows: benchRows,
      ref: { tab: 14, step: 'A', label: 'Damodaran industry benchmarks (Jan 2026)' },
      how: 'OBSERVED industry averages, not health standards: biotech’s 6.2× debt/EBITDA and grocery’s 1.5% margin are normal for THEM. Judge a company against its own industry’s numbers, never another’s.',
    },
    ipo: ipoRow && {
      row: ipoRow,
      years: SECTOR_IPO_YEARS,
      ref: { tab: 13, step: 'B', label: 'IPO count by sector over time' },
      how: 'The sector’s equity-issuance window: counts by year (H1 2026 is a HALF year). Windows diverge by sector — the overall market reopening does not mean yours did.',
    },
    subs: {
      reads: subs,
      ref: { tab: 3, step: 'C', label: 'Sub-industry lenses' },
      how: 'The lower-level lenses under this industry, scored by the same dial model at the current scenario.',
    },
  };
}

// ---------------------------------------------------------------------------
// The combined read (state × industry)
// ---------------------------------------------------------------------------

export function combinedRead(stateId: string, industryId: string, riskFree: number, f: MacroFactors): string {
  const st = stateReport(stateId);
  const ind = industryReport(industryId, riskFree, f);
  const stance = ind.advice.result.stance;
  const backdrop = ind.backdrop.read.level;
  return (
    `${st.name} × ${ind.name}: the industry model says ${backdrop} backdrop and an ${stance} capital stance ` +
    `(WACC ${ind.advice.result.wacc.wacc.toFixed(1)}%). The state layer adds the fiscal ground it stands on — ` +
    `${st.name} carries ${st.debt.row.debtGspPct}% bonded debt to GSP (#${st.debt.rankAmongTen} of the top ten) and its pension reality: ` +
    `${st.debt.row.pensionNote} A company in this state-industry cell reads BOTH: the dials set the industry’s revenue weather, ` +
    `the state sets taxes, pensions, and the 24-month political calendar below.`
  );
}

// ---------------------------------------------------------------------------
// Formulas the report leans on — with references
// ---------------------------------------------------------------------------

export interface ReportFormula {
  name: string;
  formula: string;
  ref: ReportRef;
  how: string;
}

export const REPORT_FORMULAS: ReportFormula[] = [
  {
    name: 'The impact model (every dial-driven number)',
    formula: 'impact% = Σ (sensitivity × dial)   dials ∈ [−2, +2]',
    ref: { tab: 3, step: 'A', label: 'Market conditions & sensitivities' },
    how: 'Linear and deliberately simple: each industry/asset carries four sensitivities; the scenario sets four dials. Sign and relative size are the lesson.',
  },
  {
    name: 'WACC via CAPM',
    formula: 'Re = Rf + β × ERP;   WACC = E/V·Re + D/V·Rd·(1 − t)',
    ref: { tab: 1, step: 'B', label: 'Cost of capital' },
    how: 'The hurdle every capital use must clear. Lab defaults: Rf 4%, ERP 5.5%, tax 25%, 70/30 mix.',
  },
  {
    name: 'DCF with Gordon terminal value',
    formula: 'EV = Σ FCFₜ/(1+WACC)ᵗ + [FCFₙ(1+g)/(WACC−g)]/(1+WACC)ⁿ',
    ref: { tab: 5, step: 'A', label: 'The DCF build' },
    how: 'Five forecast years plus a terminal value that usually carries 60–80% of the answer — which is why the sensitivity grid exists.',
  },
  {
    name: 'The EV ↔ equity bridge',
    formula: 'Equity value = EV − net debt;   price = equity ÷ shares',
    ref: { tab: 16, step: 'F', label: 'Full-cycle stage 6' },
    how: 'Pair EV with pre-interest metrics (EBITDA), equity with post-interest (net income) — never cross the streams.',
  },
  {
    name: 'ROIC vs WACC',
    formula: 'ROIC = NOPAT ÷ invested capital;   value created iff ROIC > WACC',
    ref: { tab: 16, step: 'B', label: 'ROIC & economic profit' },
    how: 'The single test behind every stance on tab 4: growth only creates value when the return on the new dollar beats its cost.',
  },
  {
    name: 'Trade balance',
    formula: 'balance = exports − imports',
    ref: { tab: 15, step: 'C', label: 'Imports vs exports' },
    how: 'Computed, never typed. Surplus = net earner of foreign currency; deficit = net borrower.',
  },
  {
    name: 'Debt ratios (sovereign & state)',
    formula: 'country: gross gov’t debt ÷ GDP;   state: bonded debt ÷ GSP (+ pension note)',
    ref: { tab: 15, step: 'A', label: 'Debt trends' },
    how: 'Same numerator logic, different honesty problem: countries hide debt in central banks and LGFVs; states hide it in pensions.',
  },
  {
    name: 'Currency index',
    formula: 'index = 100 × (2021 FX rate ÷ current FX rate), vs USD',
    ref: { tab: 15, step: 'D', label: 'Currency trends' },
    how: 'Falling line = weakening currency = imported inflation and a squeezed central bank. Combine with the trade balance for the four-gauge country health check.',
  },
];

// ---------------------------------------------------------------------------
// How to read the report
// ---------------------------------------------------------------------------

export const REPORT_HOW_TO_READ: string[] = [
  'Pick the lenses at the top — any combination of country, state, and industry. Each section that renders is pulled live from the same models the source tabs use; nothing is retyped.',
  'Every section carries a reference line ("Tab 15 · step A — …"). That is the section’s home: go there for the full interactive version, the worked examples, and the guide.',
  'The scenario chips set the four dials (growth / inflation / Fed / fiscal) for everything dial-driven here — the industry backdrop, the capital stance, the sub-industry lenses. Country and state facts (debt, trade, currencies, calendars) are snapshot data and do NOT move with the dials.',
  'Read order for a country: debt trend (the level and slope) → trade balance (earner or borrower) → currency line (what markets think) → populism/pipeline (what politics is about to do) → calendar (when). That is the four-gauge health check assembled.',
  'Read order for a state: bonded debt ÷ GSP → the pension note (the REAL balance sheet) → impact watch → calendar.',
  'Read order for an industry: backdrop (revenue weather) → capital stance and WACC (what management should do) → benchmarks (what normal looks like HERE) → IPO window (can it raise equity) → sub-industry lenses.',
  'Honesty labels travel with the data: country/state/trade/currency values are approximate teaching values; benchmarks are observed Damodaran averages; dial-driven numbers are a linear teaching model. The formulas table shows the exact math behind each.',
];

// ---------------------------------------------------------------------------
// Coverage index — every tab and section of the Lab, and how this report
// uses it. Audited against the actual rendered StepCards.
// ---------------------------------------------------------------------------

export interface CoverageRow {
  tab: number;
  name: string;
  sections: string[];
  /** How tab 19 uses it — or, for interactive tools, what to use them for. */
  inReport: string;
}

export const REPORT_COVERAGE: CoverageRow[] = [
  { tab: 1, name: 'Your company’s moves', sections: ['A Your capital & cost of capital', 'B Market conditions', 'C Which move clears its hurdle', 'D Hedge what the move leaves exposed'], inReport: 'Its WACC/hurdle engine runs INSIDE the industry section (tab 4’s adviser calls it per industry); its Rf feeds the industry WACC here; the WACC formula card is step C. The move-ranking itself is interactive — set your numbers there.' },
  { tab: 2, name: 'Customer credit', sections: ['A The ask', 'B The customer’s financials', 'C The credit read', 'D Security & guarantees', 'E The industry backdrop'], inReport: 'Its industry-backdrop model IS the backdrop line in the industry section here (same function). The BRI facts apply its sovereign version: China as underwriter of weak credits. Underwriting a specific customer stays interactive on tab 2.' },
  { tab: 3, name: 'Market analysis', sections: ['A Market conditions', 'B The dials in real numbers', 'C Cross-effects', 'D Market & industry trends', 'E Inflation — CPI vs PCE', 'F Asset classes by industry', 'G The debt cycles', 'H Your debt book', 'I History — monthly & quarterly macro trends'], inReport: 'The engine room: the scenario chips ARE its dials; the industry backdrop, sub-industry lenses, and every "dial it hits" line run on its sensitivity model; its CPI snapshot anchors the history step.' },
  { tab: 4, name: 'The economic machine (Dalio)', sections: ['A Market conditions', 'B How the market cycles', 'C The three equilibriums', 'D Watching the two levers', 'E The four forces + two levers', 'F What to do with capital', 'G Dalio’s investment principles'], inReport: 'Step F’s by-industry capital adviser renders live in the industry section. The Dalio chain narrates the populism, debt, and sanctions/reserve-currency sections.' },
  { tab: 5, name: 'Valuation workbench', sections: ['A The forecast — revenue to FCF', 'B The value bridge', 'C Sensitivity — the two-way table', 'D The three statements'], inReport: 'The DCF and sensitivity formula cards (step C) reference it; it is the practice ground the EY exhibits map to. Interactive DCF stays on its tab.' },
  { tab: 6, name: 'Formulas & decision map', sections: ['A How the whole Lab computes — the decision map (+ formula groups & glossary)'], inReport: 'Step C here is its condensed sibling: the eight formulas the report leans on, each with a ref; tab 6 holds the complete map and glossary.' },
  { tab: 7, name: 'EY gap check', sections: ['A The EY technical checklist', 'B The 2026 outlook anchor', 'C The interview format', 'D EY’s standard analyses', 'E Reporting & exhibits + market routine'], inReport: 'Its outlook numbers frame the timeline and recent-window entries; its step-E exhibit list tells you which report section becomes which client slide (see the guide).' },
  { tab: 8, name: 'Interview drill', sections: ['Technical cards', 'Behavioral cards', 'Market-trends cards'], inReport: 'Interactive-only by design: drill the narration of THIS report’s sections there — the market cards are its country/history sections in Q&A form.' },
  { tab: 9, name: 'Round map', sections: ['A Round 1 — HireVue', 'B Round 2 — take-home DCF', 'C The market-trends anchor'], inReport: 'Interactive/reference-only: its market-anchor answer is assembled from the same outlook + history data this report renders.' },
  { tab: 10, name: 'Gap workbench', sections: ['A IRR & NPV lab', 'B Beta workshop', 'C Hurdle builder + rNPV', 'D Incremental ROIC', 'E PPA & impairment', 'F Comps & cost approach', 'G LBO mini-model', 'H Accretion/dilution', 'I Break-even & CAGR', 'J 13-week cash flow', 'K Football field', 'L QoE bridge'], inReport: 'The calculators behind the formula cards — each formula in step C names where its working version lives (mostly here and tab 16).' },
  { tab: 11, name: 'Rates & the bond market', sections: ['A The two numbers', 'B The rate stack', 'C The yield curve', 'D Real yields & breakevens', 'E The divergence', 'F Bond basics', 'G The scale problem', 'H The debt build-up to $40T'], inReport: 'Step H’s debt/interest charts render in the US country section; its snapshot anchors the history step’s Fed and 10Y lines; the term-premium story threads the debt, populism, and history reads.' },
  { tab: 12, name: 'Real estate financing', sections: ['A The mortgage formula (10Y + spread)', 'B The payment calculator', 'C CRE floating vs fixed', 'D The CRE dashboard', 'E What each number says'], inReport: 'Its PMMS benchmark is the mortgage line in the history step; the 10Y+spread architecture explains why that line never followed the Fed down.' },
  { tab: 13, name: 'IPO & the financing menu', sections: ['A The market now', 'B Sector trends over time', 'C The three windows', 'D Dilution math', 'E The financing menu'], inReport: 'Its sector-trend line renders in the industry section (the equity window); the A&D/AI window reads appear in the geopolitics and recent-window entries.' },
  { tab: 14, name: 'Industry benchmarks', sections: ['A The observed benchmarks', 'B You vs the average', 'C Vertical quick kits', 'D The §123 questions'], inReport: 'Its Damodaran rows render in the industry section’s benchmark table, with the observed-not-healthy rule quoted in the how-to-read.' },
  { tab: 15, name: 'Debt & geopolitics by country/state', sections: ['A Country debt-to-GDP', 'B State debt-to-GSP', 'C Imports vs exports', 'D Currency trends', 'E The Korea case', 'F Populism & the pipeline', 'G GDP/GSP impact watch', 'H Current movers', 'I Standing watch list', 'J The 24-month calendar', 'K Flashpoints & conflicts', 'L Military balance & alliances', 'M Belt & Road, corridors & chokepoints', 'N US meetings & bilateral arcs'], inReport: 'The backbone of the country and state sections — debt charts, trade, currencies, populism, impact watch, calendars, and the Korea case all render here with refs.' },
  { tab: 16, name: 'Full cycle — EV/EQV/ROIC/WACC', sections: ['A The company inputs', 'B Stage 1 operating engine', 'C Stage 2 ROIC', 'D Stage 3 WACC', 'E Stage 4 ROIC vs WACC', 'F Stage 5 valuation & the bridge', 'G Stage 6 bonds vs stock'], inReport: 'The EV↔equity and ROIC-vs-WACC formula cards reference its stages; it is where the report’s valuation math runs end-to-end interactively.' },
  { tab: 17, name: 'Data & sources', sections: ['A Modes & providers', 'B The series catalog', 'C The vintage discipline'], inReport: 'The report inherits its honesty rules: snapshot dates, anchored-vs-interpolated labels, and the Q1-26 GDP revision shown at its revised vintage.' },
  { tab: 18, name: 'Regime backtest', sections: ['A The method', 'B The five regimes'], inReport: 'Its regimes are the history step’s eras made testable; the 2022 bonds-hedge failure is cited in the history and timeline reads.' },
  { tab: 19, name: 'Report builder (this tab)', sections: ['A Build the report (collapsible)', 'B History trends', 'Country / State / Industry / Combined sections', 'Geopolitics live', 'Belt & Road / corridors', 'Institutions & the two-decade arc', 'Coverage index'], inReport: 'Itself — the assembly point. Every section above names its source tab and step; the how-to-read instructions and the formula cards live in the guide pane beside the report, always visible whatever you scroll to.' },
];
