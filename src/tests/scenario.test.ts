// Scenario engine tests — verify the filter graph narrows consistently and
// that the what-if transformations move the right needles in the recon /
// detection layers.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCSVText } from '../lib/parse';
import { applyScenario, buildFilterPlan, discoverFilterOptions } from '../lib/scenario';
import { runDetection } from '../lib/detect';
import { computeSubledgerAR } from '../lib/recon';
import { unappliedCash } from '../lib/kpis';
import { periodBounds } from '../lib/period';
import { ARData } from '../types/data';
import { DEFAULT_SCENARIO, ScenarioState } from '../types/scenario';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../sample-data');
const PERIOD = '2026-03';
const AS_OF = periodBounds(PERIOD).end;

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

function withFilters(partial: Partial<ScenarioState['filters']>): ScenarioState {
  return {
    ...DEFAULT_SCENARIO,
    filters: { ...DEFAULT_SCENARIO.filters, ...partial },
  };
}

function withWhatIf(partial: Partial<ScenarioState['whatIf']>): ScenarioState {
  return {
    ...DEFAULT_SCENARIO,
    whatIf: { ...DEFAULT_SCENARIO.whatIf, ...partial },
  };
}

describe('discoverFilterOptions', () => {
  it('returns sorted, unique values from the dataset', async () => {
    const data = await loadAll();
    const opts = discoverFilterOptions(data);
    expect(opts.customers.length).toBe(data.customers.length);
    expect(opts.salespeople.length).toBeGreaterThan(0);
    expect(opts.paymentMethods.length).toBeGreaterThan(0);
    // sorted
    const sp = opts.salespeople;
    expect([...sp].sort()).toEqual(sp);
  });
});

describe('buildFilterPlan', () => {
  it('narrows to the requested customers and the invoices that belong to them', async () => {
    const data = await loadAll();
    const target = data.customers[0].customer_id;
    const plan = buildFilterPlan(data, { ...DEFAULT_SCENARIO.filters, customers: [target] });
    expect(plan.customerIds.has(target)).toBe(true);
    expect(plan.customerIds.size).toBe(1);
    for (const id of plan.invoiceIds) {
      const inv = data.invoices.find((i) => i.invoice_id === id)!;
      expect(inv.customer_id).toBe(target);
    }
  });

  it('payment-method filter only keeps receipts of that method', async () => {
    const data = await loadAll();
    const plan = buildFilterPlan(data, { ...DEFAULT_SCENARIO.filters, paymentMethods: ['ACH'] });
    for (const id of plan.receiptIds) {
      const r = data.receipts.find((row) => row.receipt_id === id)!;
      expect(r.payment_method).toBe('ACH');
    }
  });
});

describe('applyScenario — filter pass-through', () => {
  it('with no filters and no what-if, returns shape-equivalent data', async () => {
    const data = await loadAll();
    const out = applyScenario(data, DEFAULT_SCENARIO, AS_OF);
    expect(out.invoices.length).toBe(data.invoices.length);
    expect(out.receipts.length).toBe(data.receipts.length);
    expect(out.creditMemos.length).toBe(data.creditMemos.length);
  });

  it('filtering by a single customer drops every other customer', async () => {
    const data = await loadAll();
    const target = data.customers[0].customer_id;
    const out = applyScenario(data, withFilters({ customers: [target] }), AS_OF);
    for (const i of out.invoices) expect(i.customer_id).toBe(target);
    for (const r of out.receipts) expect(r.customer_id).toBe(target);
    for (const m of out.creditMemos) expect(m.customer_id).toBe(target);
  });

  it('subledger AR for a customer equals the unfiltered subledger AR for that customer', async () => {
    const data = await loadAll();
    const aging = computeSubledgerAR(data, AS_OF);
    const customerById = new Map<string, number>();
    for (const r of aging.rows) {
      customerById.set(r.invoice.customer_id, (customerById.get(r.invoice.customer_id) ?? 0) + r.openBalance);
    }
    const target = [...customerById.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const filtered = applyScenario(data, withFilters({ customers: [target] }), AS_OF);
    const sub = computeSubledgerAR(filtered, AS_OF);
    expect(sub.total).toBeCloseTo(customerById.get(target) ?? 0, 2);
  });
});

describe('applyScenario — what-if transformations', () => {
  it('resolveUnappliedCashPct=1 zeros out unapplied cash', async () => {
    const data = await loadAll();
    const baseline = unappliedCash(data, AS_OF);
    expect(baseline).toBeGreaterThan(0);
    const cleaned = applyScenario(data, withWhatIf({ resolveUnappliedCashPct: 1 }), AS_OF);
    expect(unappliedCash(cleaned, AS_OF)).toBeLessThan(0.01);
  });

  it('applyAllUnappliedCredits clears the unapplied_credit detection class', async () => {
    const data = await loadAll();
    const before = runDetection(data, '2026-04-15T00:00:00Z').exceptions.filter((e) => e.category === 'unapplied_credit').length;
    expect(before).toBeGreaterThan(0);
    const cleaned = applyScenario(data, withWhatIf({ applyAllUnappliedCredits: true }), AS_OF);
    const after = runDetection(cleaned, '2026-04-15T00:00:00Z').exceptions.filter((e) => e.category === 'unapplied_credit').length;
    expect(after).toBe(0);
  });

  it('writeOffPastDueDays=30 reduces subledger AR by zeroing past-due invoices', async () => {
    const data = await loadAll();
    const baseline = computeSubledgerAR(data, AS_OF).total;
    const cleaned = applyScenario(data, withWhatIf({ writeOffPastDueDays: 30 }), AS_OF);
    const after = computeSubledgerAR(cleaned, AS_OF).total;
    expect(after).toBeLessThan(baseline);
  });

  it('demoState=cleaned drops AR materially and zeros workflow-style exceptions', async () => {
    const data = await loadAll();
    const baselineSub = computeSubledgerAR(data, AS_OF).total;
    const baselineDet = runDetection(data, '2026-04-15T00:00:00Z');
    const cleaned = applyScenario(data, { ...DEFAULT_SCENARIO, demoState: 'cleaned' }, AS_OF);
    const cleanedSub = computeSubledgerAR(cleaned, AS_OF).total;
    const cleanedDet = runDetection(cleaned, '2026-04-15T00:00:00Z');

    // AR drops because past-due is collected and write-offs apply.
    expect(cleanedSub).toBeLessThan(baselineSub);
    // Total exception count drops (some structural classes survive — duplicate
    // GL postings, bank-only items — those are real-data issues that "Cleaned"
    // can't paper over).
    expect(cleanedDet.exceptions.length).toBeLessThan(baselineDet.exceptions.length);
    // Workflow-style classes (unapplied, aged-unapplied, short-pay) should be empty.
    const workflowyAfter = cleanedDet.exceptions.filter(
      (e) => e.category === 'unapplied_cash' || e.category === 'aged_unapplied' || e.category === 'unapplied_credit',
    ).length;
    expect(workflowyAfter).toBe(0);
  });
});
