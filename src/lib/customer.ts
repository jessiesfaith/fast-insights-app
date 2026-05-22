// Customer drill-down math (BUILD.md §11). Pure functions only.
//
// Auditors will sample 3–5 customers from the aging detail and want a
// per-customer trace: open invoices with aging, recent receipts, credit
// memos, open exceptions, and an AR-balance trend line.

import { ARData, CashReceipt, CreditMemo, Customer, Invoice } from '../types/data';
import { AgingBucket } from '../types/kpi';
import { bucketForDaysPastDue } from './aging';
import { daysBetween, isOnOrBefore, isWithin, periodBounds, priorPeriod } from './period';
import { computeSubledgerAR } from './recon';

export interface CustomerSummary {
  customer_id: string;
  customer: Customer | null;
  asOf: string;
  openAR: number;
  openInvoiceCount: number;
  concentrationPct: number;            // share of total open AR (0..1)
  agingByBucket: Record<AgingBucket, number>;
  unappliedCash: number;
  unappliedCredits: number;
  daysSinceLastPayment: number | null;
  oldestOpenInvoiceDays: number;
}

export interface ARTrendPoint {
  period: string;
  openAR: number;
}

export interface CustomerOpenInvoice {
  invoice: Invoice;
  appliedReceipts: number;
  appliedCredits: number;
  openBalance: number;
  daysPastDue: number;
  bucket: AgingBucket;
}

// ------------ summary -----------------------------------------------------

export function buildCustomerSummary(
  customerId: string,
  data: ARData,
  period: string,
): CustomerSummary {
  const { end } = periodBounds(period);
  const customer = data.customers.find((c) => c.customer_id === customerId) ?? null;

  const sub = computeSubledgerAR(data, end);
  const totalAR = sub.total;
  const customerRows = sub.rows.filter((r) => r.invoice.customer_id === customerId);
  const openAR = customerRows.reduce((s, r) => s + r.openBalance, 0);

  const buckets: Record<AgingBucket, number> = {
    Current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0,
  };
  let oldestDays = 0;
  for (const r of customerRows) {
    const dpd = daysBetween(r.invoice.due_date, end);
    buckets[bucketForDaysPastDue(dpd)] += r.openBalance;
    const age = daysBetween(r.invoice.invoice_date, end);
    if (age > oldestDays) oldestDays = age;
  }

  let unappliedCash = 0;
  let unappliedCredits = 0;
  let lastPayment: string | null = null;
  for (const rcp of data.receipts) {
    if (rcp.customer_id !== customerId) continue;
    if (!isOnOrBefore(rcp.receipt_date, end)) continue;
    if (rcp.status === 'Unapplied' || rcp.amount_applied < rcp.amount) {
      unappliedCash += Math.max(rcp.amount - rcp.amount_applied, 0);
    }
    if (!lastPayment || rcp.receipt_date > lastPayment) lastPayment = rcp.receipt_date;
  }
  for (const m of data.creditMemos) {
    if (m.customer_id !== customerId) continue;
    if (!isOnOrBefore(m.memo_date, end)) continue;
    if (m.status === 'Unapplied' || m.applied_to_invoice_id == null) {
      unappliedCredits += m.amount;
    }
  }

  return {
    customer_id: customerId,
    customer,
    asOf: end,
    openAR,
    openInvoiceCount: customerRows.length,
    concentrationPct: totalAR > 0 ? openAR / totalAR : 0,
    agingByBucket: buckets,
    unappliedCash,
    unappliedCredits,
    daysSinceLastPayment: lastPayment ? daysBetween(lastPayment, end) : null,
    oldestOpenInvoiceDays: oldestDays,
  };
}

// ------------ AR trend (last 6 months ending at `period`) -----------------

export function buildARTrend(
  customerId: string,
  data: ARData,
  period: string,
  monthsBack = 5,
): ARTrendPoint[] {
  const points: ARTrendPoint[] = [];
  let cursor = period;
  const periods: string[] = [];
  for (let i = 0; i <= monthsBack; i++) {
    periods.push(cursor);
    cursor = priorPeriod(cursor);
  }
  // chronological order
  periods.reverse();
  for (const p of periods) {
    const { end } = periodBounds(p);
    const sub = computeSubledgerAR(data, end);
    const openAR = sub.rows
      .filter((r) => r.invoice.customer_id === customerId)
      .reduce((s, r) => s + r.openBalance, 0);
    points.push({ period: p, openAR });
  }
  return points;
}

// ------------ open invoices (aging-aware) ---------------------------------

export function buildCustomerOpenInvoices(
  customerId: string,
  data: ARData,
  period: string,
): CustomerOpenInvoice[] {
  const { end } = periodBounds(period);
  const sub = computeSubledgerAR(data, end);
  return sub.rows
    .filter((r) => r.invoice.customer_id === customerId)
    .map((r) => {
      const dpd = daysBetween(r.invoice.due_date, end);
      return {
        invoice: r.invoice,
        appliedReceipts: r.appliedReceipts,
        appliedCredits: r.appliedCredits,
        openBalance: r.openBalance,
        daysPastDue: dpd,
        bucket: bucketForDaysPastDue(dpd),
      };
    })
    .sort((a, b) => b.openBalance - a.openBalance);
}

// ------------ recent receipts (default last 90 days) ---------------------

export function buildCustomerReceipts(
  customerId: string,
  data: ARData,
  period: string,
  windowDays = 90,
): CashReceipt[] {
  const { end } = periodBounds(period);
  const start = new Date(Date.parse(end + 'T00:00:00Z'));
  start.setUTCDate(start.getUTCDate() - windowDays);
  const startIso = start.toISOString().slice(0, 10);
  return data.receipts
    .filter((r) => r.customer_id === customerId && isWithin(r.receipt_date, startIso, end))
    .sort((a, b) => b.receipt_date.localeCompare(a.receipt_date));
}

// ------------ credit memos -------------------------------------------------

export function buildCustomerCredits(
  customerId: string,
  data: ARData,
  period: string,
): CreditMemo[] {
  const { end } = periodBounds(period);
  return data.creditMemos
    .filter((m) => m.customer_id === customerId && isOnOrBefore(m.memo_date, end))
    .sort((a, b) => b.memo_date.localeCompare(a.memo_date));
}
