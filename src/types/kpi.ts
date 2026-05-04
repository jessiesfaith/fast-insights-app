// Types for the eight default KPIs (BUILD.md §7) and aging schedule (§8).

export type KPIUnit = 'money' | 'pct' | 'days' | 'count';

/** "good" = direction in which an increase is positive for the business. */
export type GoodDirection = 'up' | 'down';

export interface KPIResult {
  key: KPIKey;
  label: string;
  unit: KPIUnit;
  current: number;
  prior: number | null;          // null when there's no prior period available
  delta: number | null;          // current − prior
  deltaPct: number | null;       // null when prior is 0
  goodDirection: GoodDirection;
}

export type KPIKey =
  | 'dso'
  | 'pctCurrent'
  | 'pastDuePct'
  | 'topTenConcentration'
  | 'unappliedCash'
  | 'unappliedCredits'
  | 'shortPay'
  | 'daysToApplyMedian';

export interface KPIBundle {
  period: { current: string; prior: string | null };
  results: KPIResult[];
}

// ---- aging schedule --------------------------------------------------------

export type AgingBucket = 'Current' | '1-30' | '31-60' | '61-90' | '90+';

export const AGING_BUCKETS: AgingBucket[] = ['Current', '1-30', '31-60', '61-90', '90+'];

export interface AgingTotals {
  bucket: AgingBucket;
  amount: number;
  count: number;
}

export interface AgingCustomerRow {
  customer_id: string;
  customer_name: string;
  totals: Record<AgingBucket, number>;
  total: number;
  invoiceCount: number;
}

export interface AgingResult {
  asOf: string;
  totals: AgingTotals[];           // five entries, one per bucket
  byCustomer: AgingCustomerRow[];  // one row per customer with open AR
  totalOpenAR: number;
}
