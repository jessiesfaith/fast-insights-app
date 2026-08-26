// "Today's market" snapshot for the Market Scenarios tool.
//
// This file is the ONE place live market-trend data lives, kept deliberately
// tiny so a scheduled job (cron / GitHub Action / API fetch) can regenerate it
// going forward without touching the model or the UI. Until that automation
// lands, it is refreshed by hand from the primary sources cited below.

import { MacroFactors } from './macroModel';

export const TODAY_SCENARIO_ID = 'today';

export interface SnapshotReading {
  /** Which dial this reading feeds. */
  label: string;
  /** The headline number, e.g. "+1.5% annualized". */
  value: string;
  /** One-line plain-English context. */
  detail: string;
  /** Primary source name (not a URL — shown as a citation). */
  source: string;
}

export interface MarketSnapshot {
  /** ISO date this snapshot was taken. */
  asOf: string;
  /** One-sentence summary of the environment. */
  headline: string;
  /** How the readings map onto the four model dials. */
  factors: MacroFactors;
  readings: SnapshotReading[];
}

export interface InflationSnapshot {
  /** ISO date this snapshot was taken. */
  asOf: string;
  /** Official headline CPI print, % YoY. */
  headlineCpi: number;
  /** Official core CPI print (ex food & energy), % YoY. */
  coreCpi: number;
  source: string;
  detail: string;
  /**
   * Component readings, % YoY, keyed by the INFLATION_COMPONENTS ids in
   * marketAnalysis. The official release publishes these at full precision;
   * the values here are teaching estimates calibrated so the CPI-weighted
   * average reproduces the official headline and core prints above (the
   * consistency is pinned in tests). Energy carries the supply shock.
   */
  componentsNow: Record<string, number>;
}

export const INFLATION_SNAPSHOT: InflationSnapshot = {
  asOf: '2026-08-24',
  headlineCpi: 3.4,
  coreCpi: 2.5,
  source: 'Bureau of Labor Statistics, July 2026 CPI report',
  detail:
    'Headline 3.4% YoY (down from 3.5% in June), core 2.5% — cooling but above target, with the tariff/supply shock living almost entirely in the energy and food lines. Official PCE (June, the Fed’s gauge): headline 3.7%, core 3.3% — hotter than CPI; July PCE releases Aug 26, August CPI on Sept 11.',
  componentsNow: {
    shelter: 3.2,
    food: 3.9,
    energy: 12.0,
    'core-goods': 0.8,
    'core-services': 3.0,
  },
};

export const MARKET_SNAPSHOT: MarketSnapshot = {
  asOf: '2026-08-26',
  headline:
    'Growth is slowing, inflation is cooling but still above target, and a divided Fed is on hold — with futures now leaning toward a SEPTEMBER HIKE on the energy shock, even as the July jobs report broke soft.',
  factors: { growth: -0.5, inflation: 1, policy: 0, fiscal: 0 },
  readings: [
    {
      label: 'Economic growth',
      value: '+1.5% annualized (Q2 2026)',
      detail: 'Real GDP slowed from +2.1% in Q1 — still growing, but losing steam.',
      source: 'Bureau of Economic Analysis, advance estimate',
    },
    {
      label: 'Inflation',
      value: '+3.4% YoY (July CPI)',
      detail: 'Down from 3.5% in June; core 2.5% — cooling, but above the Fed’s 2% target.',
      source: 'Bureau of Labor Statistics, July CPI report',
    },
    {
      label: 'Monetary policy (the Fed)',
      value: '3.50–3.75%, on hold',
      detail: 'Fifth straight hold; three FOMC members voted to raise rates — the risk leans toward tightening Since then: the July FOMC held 9–3, and futures price ~65% odds of a 25bp HIKE at the Sept 15–16 meeting — the energy shock flipped expectations hawkish.',
      source: 'Federal Reserve, July 29 2026 FOMC statement',
    },
    {
      label: 'Fiscal policy (the government)',
      value: 'Roughly neutral',
      detail: 'Government spending fell in Q2 and no major new stimulus is in play.',
      source: 'Bureau of Economic Analysis, Q2 2026 GDP report',
    },
    {
      label: 'Jobs (the soft side)',
      value: '4.1% unemployment; payrolls −23,000 (July)',
      detail:
        'July payrolls unexpectedly FELL 23k (government −53k) with the prior two months revised down 103k; wages +3.2% YoY. The labor side is softening while energy re-accelerates inflation — the stagflation squeeze in one report.',
      source: 'Bureau of Labor Statistics, July 2026 employment report (Aug 7)',
    },
    {
      label: 'PCE inflation (the Fed’s gauge)',
      value: '3.7% headline · 3.3% core (June)',
      detail:
        'The Fed’s preferred measure runs HOTTER than CPI right now (3.7 vs 3.4 headline) — the gap is the energy/weights story tab 3 step E teaches. July PCE releases Aug 26.',
      source: 'Bureau of Economic Analysis, June 2026 PCE (July 30)',
    },
    {
      label: 'Markets (context, approximate)',
      value: 'S&P 500 ≈7,650 · VIX ≈16',
      detail:
        'Equities near highs with volatility low — the market is pricing the AI capex impulse, not the hike risk. If September prices in fully, this line is where you would see it first.',
      source: 'Market close, Aug 25, 2026 (approximate levels)',
    },
  ],
};
