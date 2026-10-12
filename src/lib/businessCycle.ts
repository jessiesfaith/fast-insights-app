// Business cycle indicators — the data layer behind the Economic Cycles module
// (/economic-cycles, tab 1).
//
// A rebuild of the "U.S. Business Cycle Indicators: Leading, Coincident and
// Lagging" reference graphic as structured data, so the page can draw it in the
// app's own design system (light/dark, hover, table view) instead of showing a
// screenshot. Three panels, one per indicator group; each indicator sits at a
// position along a stylised expansion → peak → contraction → trough curve.
//
// The values are a DATED SNAPSHOT transcribed from the source graphic (latest
// releases as of Sept. 21, 2026; market data through Sept. 18, 2026; rounded).
// They are illustrative teaching values — refresh `INDICATORS` from the source
// agencies before relying on them. Education only; not investment advice.

export type CycleGroup = 'leading' | 'coincident' | 'lagging';

/** Which direction is generally better for the economy for this indicator. */
export type BetterDirection = 'up' | 'down';

/** What the indicator's position on the curve is signalling. */
export type CycleSignal = 'expansion' | 'contraction';

export interface CycleIndicator {
  id: string;
  group: CycleGroup;
  name: string;
  /** The headline reading, e.g. "99.5" or "$663.6B". */
  value: string;
  /** The change / context line, e.g. "−0.1% m/m" or ">50 = expansion". */
  change?: string;
  /** Period the reading covers, e.g. "Aug 2026" or "Q2 2026". */
  asOf: string;
  better: BetterDirection;
  signal: CycleSignal;
  /** 0..1 position along the cycle curve: 0 = trough, PEAK_AT = peak, 1 = next trough. */
  x: number;
  /** Data source (agency / series). */
  source: string;
}

export interface CycleGroupMeta {
  id: CycleGroup;
  title: string;
  question: string;
  blurb: string;
  activity: string;
  /** Where the peak sits on the panel's curve (0..1). */
  peakAt: number;
}

export const GROUPS: CycleGroupMeta[] = [
  {
    id: 'leading',
    title: 'Leading indicators',
    question: 'Where are we going?',
    blurb: 'Turn before the economy. Help identify an approaching peak or trough.',
    activity: 'Expectations, orders, financial conditions',
    peakAt: 0.42,
  },
  {
    id: 'coincident',
    title: 'Coincident indicators',
    question: 'Where is the economy now?',
    blurb: 'Move with the economy. Reflect current economic activity.',
    activity: 'GDP, output, income, jobs, sales',
    peakAt: 0.45,
  },
  {
    id: 'lagging',
    title: 'Lagging indicators',
    question: 'What confirms what already happened?',
    blurb: 'Move after the economy. Provide confirmation of the cycle.',
    activity: 'Employment, prices, defaults, delinquencies',
    peakAt: 0.45,
  },
];

export const SNAPSHOT = {
  releasesAsOf: 'Sept. 21, 2026',
  marketDataThrough: 'Sept. 18, 2026',
  sources:
    'The Conference Board (LEI), ISM, U.S. Census Bureau, Federal Reserve (SLOOS, H.8), BEA, BLS, U.S. Treasury, ICE BofA, S&P 500 (Yahoo Finance).',
};

export const INDICATORS: CycleIndicator[] = [
  // ---- Leading ------------------------------------------------------------
  { id: 'lei', group: 'leading', name: 'LEI', value: '99.5', change: '−0.1% m/m', asOf: 'Aug 2026', better: 'up', signal: 'expansion', x: 0.08, source: 'The Conference Board' },
  { id: 'ism-new-orders', group: 'leading', name: 'ISM New Orders', value: '53.7', change: '>50 = expansion', asOf: 'Aug 2026', better: 'up', signal: 'expansion', x: 0.15, source: 'ISM' },
  { id: 'factory-orders', group: 'leading', name: 'Factory Orders', value: '$663.6B', change: '+0.9% m/m', asOf: 'Jul 2026', better: 'up', signal: 'expansion', x: 0.22, source: 'U.S. Census Bureau' },
  { id: 'building-permits', group: 'leading', name: 'Building Permits', value: '1.394M', change: '−2.7% m/m', asOf: 'Aug 2026', better: 'up', signal: 'expansion', x: 0.30, source: 'U.S. Census Bureau' },
  { id: 'sp500', group: 'leading', name: 'S&P 500', value: '7,650.50', change: '+11.8% YTD', asOf: 'Sep 18, 2026', better: 'up', signal: 'contraction', x: 0.50, source: 'S&P 500 (Yahoo Finance)' },
  { id: 'hy-spread', group: 'leading', name: 'High-Yield Spread', value: '268 bps', asOf: 'Sep 18, 2026', better: 'down', signal: 'contraction', x: 0.57, source: 'ICE BofA' },
  { id: 'ci-lending-standards', group: 'leading', name: 'C&I Lending Standards (SLOOS)', value: 'Net 0% tightening', asOf: 'Q2 2026', better: 'down', signal: 'contraction', x: 0.64, source: 'Federal Reserve (SLOOS)' },
  { id: 'ci-loan-growth', group: 'leading', name: 'C&I Loan Growth', value: '$2.945T', change: '+1.6% m/m', asOf: 'Aug 2026', better: 'up', signal: 'contraction', x: 0.71, source: 'Federal Reserve (H.8)' },
  { id: 'ci-loan-demand', group: 'leading', name: 'C&I Loan Demand', value: 'Net +16.1 pp', change: 'stronger', asOf: 'Q2 2026', better: 'up', signal: 'expansion', x: 0.78, source: 'Federal Reserve (SLOOS)' },
  { id: 'consumer-expectations', group: 'leading', name: 'Consumer Expectations', value: '68.2', change: 'from 74.0', asOf: 'Aug 2026', better: 'up', signal: 'contraction', x: 0.87, source: 'The Conference Board' },
  { id: 'housing-starts', group: 'leading', name: 'Housing Starts', value: '1.275M', change: '−2.6% m/m', asOf: 'Aug 2026', better: 'up', signal: 'contraction', x: 0.93, source: 'U.S. Census Bureau' },

  // ---- Coincident ---------------------------------------------------------
  { id: 'industrial-production', group: 'coincident', name: 'Industrial Production', value: '0.0%', change: 'm/m', asOf: 'Aug 2026', better: 'up', signal: 'expansion', x: 0.13, source: 'Federal Reserve' },
  { id: 'real-personal-income', group: 'coincident', name: 'Real Personal Income', value: '+0.4%', change: 'm/m', asOf: 'Jul 2026', better: 'up', signal: 'expansion', x: 0.21, source: 'BEA' },
  { id: 'real-pce', group: 'coincident', name: 'Real Consumer Spending (PCE)', value: '0.0%', change: 'm/m', asOf: 'Jul 2026', better: 'up', signal: 'expansion', x: 0.29, source: 'BEA' },
  { id: 'payroll-employment', group: 'coincident', name: 'Payroll Employment', value: '+162,000', asOf: 'Aug 2026', better: 'up', signal: 'expansion', x: 0.36, source: 'BLS' },
  { id: 'real-gdp', group: 'coincident', name: 'Real GDP', value: '+1.5%', change: 'annualized', asOf: 'Q2 2026', better: 'up', signal: 'contraction', x: 0.52, source: 'BEA' },
  { id: 'retail-sales', group: 'coincident', name: 'Retail Sales', value: '$773.9B', change: '+1.2% m/m', asOf: 'Aug 2026', better: 'up', signal: 'contraction', x: 0.60, source: 'U.S. Census Bureau' },
  { id: 'manufacturing-production', group: 'coincident', name: 'Manufacturing Production', value: '−0.3%', change: 'm/m', asOf: 'Aug 2026', better: 'up', signal: 'contraction', x: 0.70, source: 'Federal Reserve' },
  { id: 'capacity-utilization', group: 'coincident', name: 'Capacity Utilization', value: '76.3%', asOf: 'Aug 2026', better: 'up', signal: 'contraction', x: 0.80, source: 'Federal Reserve' },

  // ---- Lagging ------------------------------------------------------------
  { id: 'ahe', group: 'lagging', name: 'Average Hourly Earnings (AHE)', value: '+3.1% YoY', asOf: 'Aug 2026', better: 'up', signal: 'expansion', x: 0.15, source: 'BLS' },
  { id: 'core-cpi', group: 'lagging', name: 'Core CPI Inflation', value: '2.4% YoY', asOf: 'Aug 2026', better: 'down', signal: 'expansion', x: 0.25, source: 'BLS' },
  { id: 'cpi', group: 'lagging', name: 'CPI Inflation', value: '3.4% YoY', asOf: 'Aug 2026', better: 'down', signal: 'expansion', x: 0.35, source: 'BLS' },
  { id: 'unemployment-rate', group: 'lagging', name: 'Unemployment Rate', value: '4.1%', asOf: 'Aug 2026', better: 'down', signal: 'contraction', x: 0.55, source: 'BLS' },
  { id: 'unemployment-duration', group: 'lagging', name: 'Avg. Duration of Unemployment', value: '26.3 weeks', asOf: 'Aug 2026', better: 'down', signal: 'contraction', x: 0.66, source: 'BLS' },
  { id: 'long-term-unemployed', group: 'lagging', name: 'Long-term Unemployed', value: '1.93 million', asOf: 'Aug 2026', better: 'down', signal: 'contraction', x: 0.77, source: 'BLS' },
  { id: 'consumer-loan-delinquency', group: 'lagging', name: 'Consumer Loan Delinquency Rate', value: '2.51%', asOf: 'Q2 2026', better: 'down', signal: 'contraction', x: 0.90, source: 'Federal Reserve' },
];

export function indicatorsFor(group: CycleGroup): CycleIndicator[] {
  return INDICATORS.filter((i) => i.group === group).sort((a, b) => a.x - b.x);
}

/**
 * Height of the stylised cycle curve at position x (0..1), in 0..1 where 0 is
 * a trough and 1 is the peak. Two half-cosines joined at `peakAt`, so the curve
 * is smooth, starts and ends at a trough, and tops out exactly at the peak.
 */
export function cycleHeight(x: number, peakAt: number): number {
  const t = Math.max(0, Math.min(1, x));
  if (t <= peakAt) return (1 - Math.cos((Math.PI * t) / peakAt)) / 2;
  return (1 + Math.cos((Math.PI * (t - peakAt)) / (1 - peakAt))) / 2;
}

/** Which side of the peak a position falls on. */
export function phaseAt(x: number, peakAt: number): CycleSignal {
  return x <= peakAt ? 'expansion' : 'contraction';
}

export interface BreadthRead {
  group: CycleGroup;
  expansion: number;
  contraction: number;
  total: number;
  /** Share of the group's indicators signalling expansion (0..1). */
  expansionShare: number;
}

/**
 * "Look for breadth": how many indicators in each group are signalling
 * expansion vs. contraction. No single indicator determines the cycle; the
 * count across the group is the honest read.
 */
export function breadth(indicators: CycleIndicator[] = INDICATORS): BreadthRead[] {
  return GROUPS.map((g) => {
    const rows = indicators.filter((i) => i.group === g.id);
    const expansion = rows.filter((i) => i.signal === 'expansion').length;
    const total = rows.length;
    return {
      group: g.id,
      expansion,
      contraction: total - expansion,
      total,
      expansionShare: total === 0 ? 0 : expansion / total,
    };
  });
}

/** One-line plain-English read of a breadth row, for the summary tiles. */
export function breadthLabel(b: BreadthRead): string {
  if (b.total === 0) return 'No indicators';
  if (b.expansionShare >= 0.67) return 'Broadly expanding';
  if (b.expansionShare <= 0.33) return 'Broadly contracting';
  return 'Mixed';
}
