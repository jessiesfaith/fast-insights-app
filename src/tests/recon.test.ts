// Recon math tests — exercise the three-way recon and AR Bridge against the
// full sample dataset to make sure the numbers are stable and self-consistent.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCSVText } from '../lib/parse';
import {
  buildARBridge,
  buildThreeWay,
  computeBankCleared,
  computeGL1200,
  computeSubledgerAR,
} from '../lib/recon';
import { availablePeriods, periodBounds } from '../lib/period';
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

describe('periodBounds', () => {
  it('returns inclusive ISO bounds for a YYYY-MM key', () => {
    expect(periodBounds('2026-03')).toEqual({ key: '2026-03', start: '2026-03-01', end: '2026-03-31' });
  });
  it('handles February correctly (non-leap)', () => {
    expect(periodBounds('2026-02').end).toBe('2026-02-28');
  });
});

describe('three-way recon — sample data', () => {
  it('computes Subledger AR > 0 with non-zero open invoices', async () => {
    const data = await loadAll();
    const periods = availablePeriods(data);
    const last = periods[periods.length - 1];
    const sub = computeSubledgerAR(data, periodBounds(last).end);
    expect(sub.total).toBeGreaterThan(0);
    expect(sub.rows.length).toBeGreaterThan(0);
  });

  it('computes GL 1200 = debits − credits', async () => {
    const data = await loadAll();
    const last = availablePeriods(data).slice(-1)[0];
    const gl = computeGL1200(data, periodBounds(last).end);
    expect(gl.total).toBeCloseTo(gl.debits - gl.credits, 2);
  });

  it('computes Bank cleared only for Deposits with reconciled=Yes in window', async () => {
    const data = await loadAll();
    const { start, end } = periodBounds('2026-03');
    const bank = computeBankCleared(data, start, end);
    for (const row of bank.rows) {
      expect(row.transaction_type).toBe('Deposit');
      expect(row.reconciled).toBe('Yes');
      expect(row.value_date >= start && row.value_date <= end).toBe(true);
    }
  });

  it('produces a ThreeWayResult with both variance walks populated', async () => {
    const data = await loadAll();
    const result = buildThreeWay(data, '2026-03');
    expect(result.subledgerAR.amount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.subledgerVsGL.items)).toBe(true);
    expect(Array.isArray(result.glVsBank.items)).toBe(true);
    // detection rule §5 #4 — INV-00011 / INV-00056 are missing GL postings
    const missing = result.subledgerVsGL.items.find((i) => i.id === 'missing-gl-postings');
    expect(missing).toBeTruthy();
    const missingIds = missing!.source_records.filter((r) => r.type === 'invoice').map((r) => r.id);
    expect(missingIds).toContain('INV-00011');
    expect(missingIds).toContain('INV-00056');
  });

  it('flags the duplicate-GL-posting on INV-00023 (§5 #5)', async () => {
    const data = await loadAll();
    const result = buildThreeWay(data, '2026-03');
    const dup = result.subledgerVsGL.items.find((i) => i.id === 'duplicate-gl-postings');
    expect(dup).toBeTruthy();
    const invIds = dup!.source_records.filter((r) => r.type === 'invoice').map((r) => r.id);
    expect(invIds).toContain('INV-00023');
  });

  it('flags wire-fee bank-only items in Jan 2026 (§5 #8)', async () => {
    const data = await loadAll();
    const result = buildThreeWay(data, '2026-01');
    const bankOnly = result.glVsBank.items.find((i) => i.id === 'bank-only-items');
    expect(bankOnly).toBeTruthy();
    const lineIds = bankOnly!.source_records.map((r) => r.id);
    // sample: BNK-00062..BNK-00066 are wire-fee lines
    expect(lineIds.some((id) => /^BNK-000(62|63|64|65|66)$/.test(id))).toBe(true);
  });
});

describe('AR Bridge', () => {
  it('beg + bill − cash − credits − writeoffs ± adj = endingARComputed', async () => {
    const data = await loadAll();
    const r = buildARBridge(data, '2026-03');
    const recomputed =
      r.beginningAR + r.billings - r.cashApplied - r.creditsApplied - r.writeOffs + r.adjustments;
    expect(recomputed).toBeCloseTo(r.endingARComputed, 2);
  });

  it('endingARSubledger matches an independent recompute from invoices', async () => {
    const data = await loadAll();
    const r = buildARBridge(data, '2026-03');
    const independent = computeSubledgerAR(data, periodBounds('2026-03').end).total;
    expect(r.endingARSubledger).toBeCloseTo(independent, 2);
  });
});
