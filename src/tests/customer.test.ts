// Customer drill-down math: per-customer totals reconcile with the aging
// schedule, AR trend lines up chronologically, receipt window respects
// the requested look-back period.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCSVText } from '../lib/parse';
import { buildAging } from '../lib/aging';
import {
  buildARTrend,
  buildCustomerCredits,
  buildCustomerOpenInvoices,
  buildCustomerReceipts,
  buildCustomerSummary,
} from '../lib/customer';
import { ARData } from '../types/data';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../sample-data');

async function loadAll(): Promise<ARData> {
  const data: ARData = {
    invoices: [], receipts: [], creditMemos: [], glEntries: [], bankStatements: [], customers: [],
  };
  for (const f of [
    'invoices.csv', 'cash_receipts.csv', 'credit_memos.csv',
    'gl_entries.csv', 'bank_statements.csv', 'customers.csv',
  ]) {
    const text = readFileSync(resolve(DATA_DIR, f), 'utf8');
    const r = await parseCSVText(text, f);
    (data as any)[r.key] = r.rows;
  }
  return data;
}

describe('buildCustomerSummary', () => {
  it('matches the customer row in the aging schedule', async () => {
    const data = await loadAll();
    const aging = buildAging(data, '2026-03');
    const top = aging.byCustomer[0];
    expect(top).toBeTruthy();
    const summary = buildCustomerSummary(top.customer_id, data, '2026-03');
    expect(summary.openAR).toBeCloseTo(top.total, 2);
    expect(summary.openInvoiceCount).toBe(top.invoiceCount);
    for (const b of ['Current', '1-30', '31-60', '61-90', '90+'] as const) {
      expect(summary.agingByBucket[b]).toBeCloseTo(top.totals[b], 2);
    }
  });

  it('attaches the customer record when known', async () => {
    const data = await loadAll();
    const summary = buildCustomerSummary('CUST-001', data, '2026-03');
    expect(summary.customer).toBeTruthy();
    expect(summary.customer?.customer_id).toBe('CUST-001');
  });

  it('returns null customer record for an unknown ID', async () => {
    const data = await loadAll();
    const summary = buildCustomerSummary('CUST-999999', data, '2026-03');
    expect(summary.customer).toBeNull();
    expect(summary.openAR).toBe(0);
  });
});

describe('buildARTrend', () => {
  it('returns 6 chronologically-sorted points by default', async () => {
    const data = await loadAll();
    const trend = buildARTrend('CUST-001', data, '2026-03', 5);
    expect(trend).toHaveLength(6);
    const periods = trend.map((p) => p.period);
    const sorted = [...periods].sort();
    expect(periods).toEqual(sorted);
    expect(trend[trend.length - 1].period).toBe('2026-03');
  });

  it('the last trend point matches the period summary openAR', async () => {
    const data = await loadAll();
    const aging = buildAging(data, '2026-03');
    const top = aging.byCustomer[0];
    const trend = buildARTrend(top.customer_id, data, '2026-03', 5);
    expect(trend[trend.length - 1].openAR).toBeCloseTo(top.total, 2);
  });
});

describe('buildCustomerOpenInvoices', () => {
  it('sums to the customer summary openAR', async () => {
    const data = await loadAll();
    const aging = buildAging(data, '2026-03');
    const top = aging.byCustomer[0];
    const rows = buildCustomerOpenInvoices(top.customer_id, data, '2026-03');
    const sum = rows.reduce((s, r) => s + r.openBalance, 0);
    expect(sum).toBeCloseTo(top.total, 2);
  });

  it('sorts by largest open balance first', async () => {
    const data = await loadAll();
    const aging = buildAging(data, '2026-03');
    const top = aging.byCustomer[0];
    const rows = buildCustomerOpenInvoices(top.customer_id, data, '2026-03');
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].openBalance).toBeLessThanOrEqual(rows[i - 1].openBalance + 1e-6);
    }
  });
});

describe('buildCustomerReceipts', () => {
  it('only returns receipts within the requested window', async () => {
    const data = await loadAll();
    const rows = buildCustomerReceipts('CUST-001', data, '2026-03', 90);
    for (const r of rows) {
      expect(r.customer_id).toBe('CUST-001');
      const ts = Date.parse(r.receipt_date + 'T00:00:00Z');
      expect(ts).toBeLessThanOrEqual(Date.parse('2026-04-01T00:00:00Z'));
    }
  });
});

describe('buildCustomerCredits', () => {
  it('returns memos in reverse chronological order', async () => {
    const data = await loadAll();
    const rows = buildCustomerCredits('CUST-002', data, '2026-03');
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].memo_date.localeCompare(rows[i - 1].memo_date)).toBeLessThanOrEqual(0);
    }
  });
});
