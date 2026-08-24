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

export const MARKET_SNAPSHOT: MarketSnapshot = {
  asOf: '2026-08-24',
  headline: 'Growth is slowing, inflation is cooling but still above target, and a divided Fed is on hold.',
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
      detail: 'Fifth straight hold; three FOMC members voted to raise rates — the risk leans toward tightening.',
      source: 'Federal Reserve, July 29 2026 FOMC statement',
    },
    {
      label: 'Fiscal policy (the government)',
      value: 'Roughly neutral',
      detail: 'Government spending fell in Q2 and no major new stimulus is in play.',
      source: 'Bureau of Economic Analysis, Q2 2026 GDP report',
    },
  ],
};
