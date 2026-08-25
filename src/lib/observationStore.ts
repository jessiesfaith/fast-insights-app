// The observation store — the model layer behind tab 17 (spec §4, §6–9,
// §86–87, §112–119). The deterministic data layer the master spec calls
// for, implemented as the static app's local cache (spec §5.8):
//
//   - Every series the Lab uses, cataloged with FULL LINEAGE: original
//     source, series id, observation date vs release date vs retrieved
//     date (three different things, §118), units, frequency, seasonal
//     adjustment, revision status, and source tier.
//   - Observations are IMMUTABLE: revisions create new vintage rows, they
//     never overwrite history (§4) — the GDP row below demonstrates it.
//   - Derived series name their parents and their formula — nothing is
//     asserted that isn't computed.
//   - The provider registry exists but is OFF: API_MODE = OFF,
//     PAID_API_MODE = OFF, FREE_PUBLIC_DATA_MODE = ON, LOCAL_CACHE_MODE =
//     ON (§6). No paid API is ever contacted.
//   - Staleness is computed against the store's as-of date and each
//     series' refresh frequency — stale data warns, it never silently
//     poses as current (§117).
//
// Education only; not investment advice.

/** The store's clock — staleness is computed against this, not wall time. */
export const STORE_AS_OF = '2026-08-25';

export type SourceTier = 1 | 2 | 3 | 4 | 5 | 6;

export const TIER_LABELS: Record<SourceTier, string> = {
  1: 'Tier 1 — Government / regulator',
  2: 'Tier 2 — Government-sponsored / primary market',
  3: 'Tier 3 — Academic / established benchmark',
  4: 'Tier 4 — Established industry research',
  5: 'Tier 5 — Public-company filings',
  6: 'Tier 6 — Internal heuristic (clearly labeled)',
};

export type RefreshFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'event';

/** Expected max age in days before a series reads STALE. */
export const FRESHNESS_BUDGET_DAYS: Record<RefreshFrequency, number> = {
  daily: 5,
  weekly: 12,
  monthly: 45,
  quarterly: 120,
  annual: 400,
  event: 9999,
};

export interface SeriesMeta {
  seriesId: string;
  name: string;
  category: 'macro' | 'policy' | 'treasury' | 'inflation' | 'mortgage' | 'derived';
  sourceProvider: string;
  sourceSeriesNote: string;
  unit: string;
  frequency: RefreshFrequency;
  seasonalAdjustment: 'SA' | 'NSA' | 'NSA (YoY)' | 'n/a';
  tier: SourceTier;
  /** For derived series: parents + formula. Empty for primary series. */
  derivedFrom?: string;
  usedIn: string;
}

export interface Observation {
  seriesId: string;
  observationDate: string;
  value: number;
  /** When the source published it (≠ observation date, §118). */
  releaseDate: string;
  /** When this store captured it. */
  retrievedAt: string;
  revisionStatus: 'final' | 'preliminary' | 'revised' | 'derived' | 'estimate';
  note?: string;
}

export const SERIES_CATALOG: SeriesMeta[] = [
  { seriesId: 'GDP_Q_ANN', name: 'Real GDP growth, annualized', category: 'macro', sourceProvider: 'Bureau of Economic Analysis', sourceSeriesNote: 'Quarterly advance → second → third estimates (vintages preserved below)', unit: '% annualized', frequency: 'quarterly', seasonalAdjustment: 'SA', tier: 1, usedIn: 'The growth dial (tabs 1–4)' },
  { seriesId: 'CPI_YOY', name: 'CPI, headline', category: 'inflation', sourceProvider: 'Bureau of Labor Statistics', sourceSeriesNote: 'July 2026 CPI report', unit: '% YoY', frequency: 'monthly', seasonalAdjustment: 'NSA (YoY)', tier: 1, usedIn: 'The inflation dial; tab 3’s CPI/PCE section' },
  { seriesId: 'CPI_CORE_YOY', name: 'CPI, core (ex food & energy)', category: 'inflation', sourceProvider: 'Bureau of Labor Statistics', sourceSeriesNote: 'July 2026 CPI report', unit: '% YoY', frequency: 'monthly', seasonalAdjustment: 'NSA (YoY)', tier: 1, usedIn: 'Tab 3’s current-state panel' },
  { seriesId: 'PCE_YOY_IMPLIED', name: 'PCE, headline (model-implied)', category: 'derived', sourceProvider: 'Derived in `marketAnalysis.inflationNow()`', sourceSeriesNote: 'Computed, not published', unit: '% YoY', frequency: 'monthly', seasonalAdjustment: 'n/a', tier: 6, derivedFrom: 'CPI component snapshot × PCE weights − substitution-formula effect (0.25pp)', usedIn: 'Tab 3’s current-state panel — labeled model-implied' },
  { seriesId: 'FED_TARGET_MID', name: 'Fed funds target (midpoint)', category: 'policy', sourceProvider: 'Federal Reserve (FOMC)', sourceSeriesNote: 'July 29, 2026 statement — range 3.50–3.75%', unit: '%', frequency: 'event', seasonalAdjustment: 'n/a', tier: 1, usedIn: 'The Fed dial; tabs 11–12' },
  { seriesId: 'EFFR', name: 'Effective federal funds rate', category: 'policy', sourceProvider: 'Federal Reserve H.15 / New York Fed', sourceSeriesNote: 'Latest H.15 observation available 2026-08-25', unit: '%', frequency: 'daily', seasonalAdjustment: 'n/a', tier: 1, usedIn: 'Tab 11 level A' },
  { seriesId: 'IORB', name: 'Interest on reserve balances', category: 'policy', sourceProvider: 'Federal Reserve', sourceSeriesNote: 'July 2026 FOMC minutes', unit: '%', frequency: 'event', seasonalAdjustment: 'n/a', tier: 1, usedIn: 'Tab 11 — the floor mechanism' },
  { seriesId: 'SOFR', name: 'SOFR (overnight)', category: 'policy', sourceProvider: 'New York Fed', sourceSeriesNote: 'ESTIMATE in this store — tracks the funds rate; refresh from newyorkfed.org', unit: '%', frequency: 'daily', seasonalAdjustment: 'n/a', tier: 1, usedIn: 'Tab 12 floating-rate CRE' },
  { seriesId: 'UST2Y', name: '2-year Treasury CMT', category: 'treasury', sourceProvider: 'U.S. Treasury via Federal Reserve H.15', sourceSeriesNote: 'Nominal CMT, obs 2026-08-24', unit: '%', frequency: 'daily', seasonalAdjustment: 'n/a', tier: 1, usedIn: 'Tab 11 — the market’s Fed-path read' },
  { seriesId: 'UST10Y', name: '10-year Treasury CMT', category: 'treasury', sourceProvider: 'U.S. Treasury via Federal Reserve H.15', sourceSeriesNote: 'Nominal CMT, obs 2026-08-24', unit: '%', frequency: 'daily', seasonalAdjustment: 'n/a', tier: 1, usedIn: 'THE benchmark — tabs 11, 12, 16' },
  { seriesId: 'UST30Y', name: '30-year Treasury CMT', category: 'treasury', sourceProvider: 'U.S. Treasury via Federal Reserve H.15', sourceSeriesNote: 'Nominal CMT, obs 2026-08-24', unit: '%', frequency: 'daily', seasonalAdjustment: 'n/a', tier: 1, usedIn: 'Tab 11 — the long end' },
  { seriesId: 'UST10Y_REAL', name: '10-year real (TIPS) CMT', category: 'treasury', sourceProvider: 'U.S. Treasury via Federal Reserve H.15', sourceSeriesNote: 'Real CMT, obs 2026-08-24', unit: '%', frequency: 'daily', seasonalAdjustment: 'n/a', tier: 1, usedIn: 'Tab 11 — real yields' },
  { seriesId: 'BREAKEVEN_10Y', name: '10-year breakeven inflation', category: 'derived', sourceProvider: 'Derived in `ratesCurve.breakevens()`', sourceSeriesNote: 'Computed, not published', unit: '%', frequency: 'daily', seasonalAdjustment: 'n/a', tier: 6, derivedFrom: 'UST10Y − UST10Y_REAL (market-implied approximation)', usedIn: 'Tab 11 — inflation compensation' },
  { seriesId: 'MORTGAGE30', name: '30-year fixed mortgage (PMMS)', category: 'mortgage', sourceProvider: 'Freddie Mac PMMS (aggregated historically by FRED as MORTGAGE30US)', sourceSeriesNote: 'Weekly survey, obs 2026-08-20 — Freddie Mac is the source; FRED is the aggregator (§8)', unit: '%', frequency: 'weekly', seasonalAdjustment: 'n/a', tier: 2, usedIn: 'Tab 12 — the residential benchmark' },
  { seriesId: 'MTG_10Y_SPREAD', name: 'Mortgage − 10Y simple spread', category: 'derived', sourceProvider: 'Derived in `realEstate.mortgageBenchmark()`', sourceSeriesNote: 'Weekly PMMS vs same-day 10Y CMT — alignment method disclosed (§90)', unit: 'bp', frequency: 'weekly', seasonalAdjustment: 'n/a', tier: 6, derivedFrom: 'MORTGAGE30 − UST10Y (same-day) — NOT an MBS OAS', usedIn: 'Tab 12 — the refi dashboard' },
];

export const OBSERVATIONS: Observation[] = [
  // GDP: the vintage discipline demonstrated — advance PRESERVED next to the revision (§4, §87).
  { seriesId: 'GDP_Q_ANN', observationDate: '2026-Q1', value: 2.1, releaseDate: '2026-04-30', retrievedAt: '2026-08-24', revisionStatus: 'preliminary', note: 'Advance estimate — kept immutable' },
  { seriesId: 'GDP_Q_ANN', observationDate: '2026-Q1', value: 1.9, releaseDate: '2026-06-26', retrievedAt: '2026-08-24', revisionStatus: 'revised', note: 'ILLUSTRATIVE second-estimate vintage — a new row, never an overwrite' },
  { seriesId: 'GDP_Q_ANN', observationDate: '2026-Q2', value: 1.5, releaseDate: '2026-07-30', retrievedAt: '2026-08-24', revisionStatus: 'preliminary', note: 'Advance estimate — will be revised; the row will stay' },
  { seriesId: 'CPI_YOY', observationDate: '2026-07', value: 3.4, releaseDate: '2026-08-12', retrievedAt: '2026-08-24', revisionStatus: 'final' },
  { seriesId: 'CPI_CORE_YOY', observationDate: '2026-07', value: 2.5, releaseDate: '2026-08-12', retrievedAt: '2026-08-24', revisionStatus: 'final' },
  { seriesId: 'PCE_YOY_IMPLIED', observationDate: '2026-07', value: 2.9, releaseDate: 'n/a (computed)', retrievedAt: '2026-08-25', revisionStatus: 'derived' },
  { seriesId: 'FED_TARGET_MID', observationDate: '2026-07-29', value: 3.625, releaseDate: '2026-07-29', retrievedAt: '2026-08-24', revisionStatus: 'final' },
  { seriesId: 'EFFR', observationDate: '2026-08-22', value: 3.63, releaseDate: '2026-08-25', retrievedAt: '2026-08-25', revisionStatus: 'final', note: 'Observation date precedes the H.15 release date — §118' },
  { seriesId: 'IORB', observationDate: '2026-07-29', value: 3.65, releaseDate: '2026-08-20', retrievedAt: '2026-08-25', revisionStatus: 'final' },
  { seriesId: 'SOFR', observationDate: '2026-08-22', value: 3.65, releaseDate: 'n/a', retrievedAt: '2026-08-25', revisionStatus: 'estimate', note: 'Estimate — refresh from NY Fed before citing' },
  { seriesId: 'UST2Y', observationDate: '2026-08-24', value: 4.24, releaseDate: '2026-08-25', retrievedAt: '2026-08-25', revisionStatus: 'final' },
  { seriesId: 'UST10Y', observationDate: '2026-08-24', value: 4.7, releaseDate: '2026-08-25', retrievedAt: '2026-08-25', revisionStatus: 'final' },
  { seriesId: 'UST30Y', observationDate: '2026-08-24', value: 5.23, releaseDate: '2026-08-25', retrievedAt: '2026-08-25', revisionStatus: 'final' },
  { seriesId: 'UST10Y_REAL', observationDate: '2026-08-24', value: 2.38, releaseDate: '2026-08-25', retrievedAt: '2026-08-25', revisionStatus: 'final' },
  { seriesId: 'BREAKEVEN_10Y', observationDate: '2026-08-24', value: 2.32, releaseDate: 'n/a (computed)', retrievedAt: '2026-08-25', revisionStatus: 'derived' },
  { seriesId: 'MORTGAGE30', observationDate: '2026-08-20', value: 6.65, releaseDate: '2026-08-20', retrievedAt: '2026-08-25', revisionStatus: 'final' },
  { seriesId: 'MTG_10Y_SPREAD', observationDate: '2026-08-20', value: 196, releaseDate: 'n/a (computed)', retrievedAt: '2026-08-25', revisionStatus: 'derived' },
];

/** All vintages for a series, oldest release first — history is immutable. */
export function observationsFor(seriesId: string): Observation[] {
  return OBSERVATIONS.filter((o) => o.seriesId === seriesId);
}

/** The latest vintage of the latest observation. */
export function latestObservation(seriesId: string): Observation | undefined {
  const rows = observationsFor(seriesId);
  return rows.length ? rows[rows.length - 1] : undefined;
}

export interface StalenessRead {
  seriesId: string;
  observationDate: string;
  daysOld: number;
  budgetDays: number;
  stale: boolean;
}

const dayOf = (iso: string): number => {
  // Supports YYYY-MM-DD, YYYY-MM, YYYY-Qn.
  const q = iso.match(/^(\d{4})-Q(\d)$/);
  const norm = q ? `${q[1]}-${String(Number(q[2]) * 3).padStart(2, '0')}-15` : iso.length === 7 ? `${iso}-15` : iso;
  return Math.floor(new Date(norm).getTime() / 86_400_000);
};

/** Computed staleness vs the STORE's clock — never wall time, never silent (§117). */
export function staleness(meta: SeriesMeta, asOf: string = STORE_AS_OF): StalenessRead {
  const latest = latestObservation(meta.seriesId);
  const daysOld = latest ? dayOf(asOf) - dayOf(latest.observationDate) : 9999;
  const budgetDays = FRESHNESS_BUDGET_DAYS[meta.frequency];
  return {
    seriesId: meta.seriesId,
    observationDate: latest?.observationDate ?? 'none',
    daysOld,
    budgetDays,
    stale: daysOld > budgetDays,
  };
}

// ---------------------------------------------------------------------------
// The provider registry — designed, registered, OFF (§6)
// ---------------------------------------------------------------------------

export const DATA_MODES = {
  API_MODE: 'OFF',
  PAID_API_MODE: 'OFF',
  FREE_PUBLIC_DATA_MODE: 'ON',
  LOCAL_CACHE_MODE: 'ON',
} as const;

export interface ProviderEntry {
  name: string;
  domain: string;
  tier: SourceTier;
  serves: string;
  status: 'registered-off' | 'local-cache';
}

export const PROVIDER_REGISTRY: ProviderEntry[] = [
  { name: 'TreasuryProvider', domain: 'home.treasury.gov', tier: 1, serves: 'Daily par & real yield curves, bill rates, buybacks', status: 'registered-off' },
  { name: 'FederalReserveProvider', domain: 'federalreserve.gov', tier: 1, serves: 'H.15 rate panel, FOMC decisions, IORB', status: 'registered-off' },
  { name: 'NYFedProvider', domain: 'newyorkfed.org', tier: 1, serves: 'SOFR, EFFR detail, repo, SOMA', status: 'registered-off' },
  { name: 'FREDProvider', domain: 'fred.stlouisfed.org', tier: 1, serves: 'Historical aggregation layer (original sources preserved in lineage)', status: 'registered-off' },
  { name: 'BLSProvider', domain: 'bls.gov', tier: 1, serves: 'CPI, PPI, employment', status: 'registered-off' },
  { name: 'BEAProvider', domain: 'bea.gov', tier: 1, serves: 'GDP with vintages, PCE', status: 'registered-off' },
  { name: 'FiscalDataProvider', domain: 'fiscaldata.treasury.gov', tier: 1, serves: 'Debt outstanding, deficits, interest cost', status: 'registered-off' },
  { name: 'FreddieMacProvider', domain: 'freddiemac.com', tier: 2, serves: 'PMMS weekly mortgage rates (history to 1971)', status: 'registered-off' },
  { name: 'SECProvider', domain: 'sec.gov', tier: 1, serves: 'EDGAR filings, IPO registrations', status: 'registered-off' },
  { name: 'DamodaranProvider', domain: 'pages.stern.nyu.edu', tier: 3, serves: 'Industry benchmark datasets (annual)', status: 'registered-off' },
  { name: 'IndustryResearchProvider', domain: 'ey.com / pwc.com / svb.com', tier: 4, serves: 'IPO trends, biotech/VC reports', status: 'registered-off' },
  { name: 'LocalSnapshotStore', domain: '(this repo: src/lib/*Snapshot*, observationStore)', tier: 6, serves: 'The hand-refreshed cache serving every tab today', status: 'local-cache' },
];

export const TIMING_RULES: string[] = [
  'Observation date ≠ release date ≠ retrieval date — the EFFR row above shows all three differing, and every dashboard shows which is which (§118).',
  'Treasury curve observations are for the PRIOR business day’s market (closing bids via the NY Fed ~3:30pm); H.15 releases after collection.',
  'Freddie PMMS is weekly; company financials can be months old next to daily rates — align timestamps explicitly, never visually.',
  'These are LATEST OFFICIAL OBSERVATIONS, not real-time market prices — intraday trading data would need a real-time provider, which V1 deliberately does not connect (§119).',
];
