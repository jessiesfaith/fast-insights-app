// Aging schedule (BUILD.md §8).
//
// Buckets: Current (not yet due), 1-30, 31-60, 61-90, 90+.
// Net of applied receipts AND credits — we reuse computeSubledgerAR for the
// open-balance math so the totals match the recon card by construction.

import { ARData } from '../types/data';
import { AgingBucket, AgingResult, AgingCustomerRow, AGING_BUCKETS } from '../types/kpi';
import { computeSubledgerAR } from './recon';
import { daysBetween, periodBounds } from './period';

export function bucketForDaysPastDue(daysPastDue: number): AgingBucket {
  if (daysPastDue <= 0) return 'Current';
  if (daysPastDue <= 30) return '1-30';
  if (daysPastDue <= 60) return '31-60';
  if (daysPastDue <= 90) return '61-90';
  return '90+';
}

export function buildAging(data: ARData, period: string): AgingResult {
  const { end } = periodBounds(period);
  const sub = computeSubledgerAR(data, end);

  const totals: Record<AgingBucket, { amount: number; count: number }> = {
    Current: { amount: 0, count: 0 },
    '1-30':  { amount: 0, count: 0 },
    '31-60': { amount: 0, count: 0 },
    '61-90': { amount: 0, count: 0 },
    '90+':   { amount: 0, count: 0 },
  };

  const byCust = new Map<string, AgingCustomerRow>();
  const customerName = new Map<string, string>();
  for (const c of data.customers) customerName.set(c.customer_id, c.customer_name);

  for (const row of sub.rows) {
    const dpd = daysBetween(row.invoice.due_date, end);
    const bucket = bucketForDaysPastDue(dpd);
    totals[bucket].amount += row.openBalance;
    totals[bucket].count += 1;

    const cid = row.invoice.customer_id;
    let cust = byCust.get(cid);
    if (!cust) {
      cust = {
        customer_id: cid,
        customer_name: customerName.get(cid) ?? cid,
        totals: { Current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
        total: 0,
        invoiceCount: 0,
      };
      byCust.set(cid, cust);
    }
    cust.totals[bucket] += row.openBalance;
    cust.total += row.openBalance;
    cust.invoiceCount += 1;
  }

  const totalsArr = AGING_BUCKETS.map((b) => ({
    bucket: b,
    amount: totals[b].amount,
    count: totals[b].count,
  }));
  const totalOpenAR = totalsArr.reduce((s, t) => s + t.amount, 0);

  const byCustomer = [...byCust.values()].sort((a, b) => b.total - a.total);

  return { asOf: end, totals: totalsArr, byCustomer, totalOpenAR };
}
