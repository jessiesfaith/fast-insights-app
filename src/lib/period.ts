// Period helpers. A period is a YYYY-MM string. Bounds are inclusive ISO dates.
//
// Used by the recon engine, AR Bridge, KPI computations, and the period selector.

import { ARData } from '../types/data';

export interface PeriodBounds {
  key: string;          // YYYY-MM
  start: string;        // YYYY-MM-01
  end: string;          // last day of month, ISO
}

export function periodBounds(period: string): PeriodBounds {
  const [yStr, mStr] = period.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    throw new Error(`invalid period "${period}" — expected YYYY-MM`);
  }
  const start = `${yStr}-${mStr.padStart(2, '0')}-01`;
  // last day of month: day 0 of next month
  const last = new Date(Date.UTC(y, m, 0));
  const pad = (n: number) => String(n).padStart(2, '0');
  const end = `${last.getUTCFullYear()}-${pad(last.getUTCMonth() + 1)}-${pad(last.getUTCDate())}`;
  return { key: period, start, end };
}

export function priorPeriod(period: string): string {
  const [yStr, mStr] = period.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  return `${py}-${String(pm).padStart(2, '0')}`;
}

/** Sorted distinct periods that appear anywhere in the dataset. */
export function availablePeriods(data: ARData): string[] {
  const set = new Set<string>();
  for (const i of data.invoices) if (i.period) set.add(i.period);
  for (const r of data.receipts) if (r.receipt_date) set.add(r.receipt_date.slice(0, 7));
  for (const c of data.creditMemos) if (c.period) set.add(c.period);
  for (const g of data.glEntries) if (g.period) set.add(g.period);
  for (const b of data.bankStatements) if (b.value_date) set.add(b.value_date.slice(0, 7));
  return [...set].filter((p) => /^\d{4}-\d{2}$/.test(p)).sort();
}

/** Latest period present in invoice activity — sensible default for the dashboard. */
export function defaultPeriod(data: ARData): string | null {
  const periods = availablePeriods(data);
  return periods.length === 0 ? null : periods[periods.length - 1];
}

export function isOnOrBefore(date: string, ref: string): boolean {
  return date.slice(0, 10) <= ref.slice(0, 10);
}

export function isWithin(date: string, start: string, end: string): boolean {
  const d = date.slice(0, 10);
  return d >= start && d <= end;
}
