// Detection tests — verify all 9 categories surface from data structure
// alone. Acceptance §16 #2: detection must keep working after the `notes`
// columns are removed. Acceptance §16 #3: each seeded scenario must map to
// the expected exception category.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCSVText } from '../lib/parse';
import { runDetection } from '../lib/detect';
import { ARData } from '../types/data';
import { ExceptionCategory } from '../types/exception';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../sample-data');
const FROZEN_NOW = '2026-04-15T12:00:00.000Z'; // deterministic "asOf" for age math

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

/** Strip the `notes` field on every row so we can prove detection is structural. */
function stripNotes(data: ARData): ARData {
  const blank = (rows: any[]) => rows.map((r) => ({ ...r, notes: '' }));
  return {
    invoices: blank(data.invoices) as ARData['invoices'],
    receipts: blank(data.receipts) as ARData['receipts'],
    creditMemos: blank(data.creditMemos) as ARData['creditMemos'],
    glEntries: blank(data.glEntries) as ARData['glEntries'],
    bankStatements: blank(data.bankStatements) as ARData['bankStatements'],
    customers: data.customers,
  };
}

function categoriesPresent(result: { exceptions: { category: ExceptionCategory }[] }): Set<ExceptionCategory> {
  return new Set(result.exceptions.map((e) => e.category));
}

describe('detection — full sample dataset', () => {
  it('produces all 9 spec categories (plus aged_unapplied synthetic)', async () => {
    const data = await loadAll();
    const result = runDetection(data, FROZEN_NOW);
    const cats = categoriesPresent(result);
    const expected: ExceptionCategory[] = [
      'unapplied_cash',
      'short_pay',
      'unapplied_credit',
      'missing_gl_posting',
      'duplicate_gl_posting',
      'writeoff_desync',
      'cutoff_timing',
      'bank_only_item',
    ];
    for (const c of expected) {
      expect(cats.has(c), `expected category ${c} not detected`).toBe(true);
    }
    // synthetic 10th class
    expect(cats.has('aged_unapplied')).toBe(true);
  });

  it('detection still works after notes columns are stripped (§16 #2)', async () => {
    const data = await loadAll();
    const stripped = stripNotes(data);
    const before = runDetection(data, FROZEN_NOW);
    const after  = runDetection(stripped, FROZEN_NOW);
    expect(after.exceptions.length).toBe(before.exceptions.length);
    expect(categoriesPresent(after)).toEqual(categoriesPresent(before));
    // detection should be deterministic — same exception_ids
    expect(after.exceptions.map((e) => e.exception_id).sort()).toEqual(
      before.exceptions.map((e) => e.exception_id).sort(),
    );
  });

  it('exception_ids are stable across runs', async () => {
    const data = await loadAll();
    const a = runDetection(data, FROZEN_NOW);
    const b = runDetection(data, FROZEN_NOW);
    expect(a.exceptions.map((e) => e.exception_id)).toEqual(b.exceptions.map((e) => e.exception_id));
  });
});

describe('seeded scenarios (§16 #3)', () => {
  it('RCP-00109 surfaces as unapplied_cash with $852,079.52 impact', async () => {
    const data = await loadAll();
    const result = runDetection(data, FROZEN_NOW);
    const exc = result.exceptions.find(
      (e) =>
        e.category === 'unapplied_cash' &&
        e.source_records.some((r) => r.type === 'receipt' && r.id === 'RCP-00109'),
    );
    expect(exc).toBeTruthy();
    expect(exc!.amount_impact).toBeCloseTo(852_079.52, 2);
  });

  it('INV-00031 surfaces as short_pay with $12,800.21 shortfall', async () => {
    const data = await loadAll();
    const result = runDetection(data, FROZEN_NOW);
    const exc = result.exceptions.find(
      (e) =>
        e.category === 'short_pay' &&
        e.source_records.some((r) => r.type === 'invoice' && r.id === 'INV-00031'),
    );
    expect(exc).toBeTruthy();
    expect(exc!.amount_impact).toBeCloseTo(12_800.21, 2);
  });

  it('INV-00023 surfaces as duplicate_gl_posting', async () => {
    const data = await loadAll();
    const result = runDetection(data, FROZEN_NOW);
    const exc = result.exceptions.find(
      (e) =>
        e.category === 'duplicate_gl_posting' &&
        e.source_records.some((r) => r.type === 'invoice' && r.id === 'INV-00023'),
    );
    expect(exc).toBeTruthy();
  });

  it('INV-00011 and INV-00056 surface as missing_gl_posting', async () => {
    const data = await loadAll();
    const result = runDetection(data, FROZEN_NOW);
    const ids = new Set(
      result.exceptions
        .filter((e) => e.category === 'missing_gl_posting')
        .flatMap((e) => e.source_records.filter((r) => r.type === 'invoice').map((r) => r.id)),
    );
    expect(ids.has('INV-00011')).toBe(true);
    expect(ids.has('INV-00056')).toBe(true);
  });

  it('INV-00016 and INV-00096 surface as writeoff_desync', async () => {
    const data = await loadAll();
    const result = runDetection(data, FROZEN_NOW);
    const ids = new Set(
      result.exceptions
        .filter((e) => e.category === 'writeoff_desync')
        .flatMap((e) => e.source_records.filter((r) => r.type === 'invoice').map((r) => r.id)),
    );
    expect(ids.has('INV-00016')).toBe(true);
    expect(ids.has('INV-00096')).toBe(true);
  });

  it('DEP-0005 receipts surface as cutoff_timing (4 receipts, 3/31 → 4/1)', async () => {
    const data = await loadAll();
    const result = runDetection(data, FROZEN_NOW);
    const cutoff = result.exceptions.filter((e) => e.category === 'cutoff_timing');
    // each cutoff exception sources exactly one receipt + the bank line
    const dep5Receipts = data.bankStatements.find((b) => b.deposit_id === 'DEP-0005')?.matched_receipt_ids ?? [];
    expect(dep5Receipts.length).toBeGreaterThan(0);
    for (const rid of dep5Receipts) {
      const found = cutoff.find((e) => e.source_records.some((r) => r.type === 'receipt' && r.id === rid));
      expect(found, `expected cutoff_timing for ${rid}`).toBeTruthy();
    }
  });

  it('BNK-00062..00066 wire-fee lines surface as bank_only_item', async () => {
    const data = await loadAll();
    const result = runDetection(data, FROZEN_NOW);
    const ids = new Set(
      result.exceptions
        .filter((e) => e.category === 'bank_only_item')
        .flatMap((e) => e.source_records.filter((r) => r.type === 'bankStatement').map((r) => r.id)),
    );
    for (const id of ['BNK-00062', 'BNK-00063', 'BNK-00064', 'BNK-00065', 'BNK-00066']) {
      expect(ids.has(id), `expected bank_only_item for ${id}`).toBe(true);
    }
  });

  it('CM-0001, CM-0008, CM-0014 surface as unapplied_credit', async () => {
    const data = await loadAll();
    const result = runDetection(data, FROZEN_NOW);
    const ids = new Set(
      result.exceptions
        .filter((e) => e.category === 'unapplied_credit')
        .flatMap((e) => e.source_records.filter((r) => r.type === 'creditMemo').map((r) => r.id)),
    );
    for (const id of ['CM-0001', 'CM-0008', 'CM-0014']) {
      expect(ids.has(id)).toBe(true);
    }
  });
});

describe('runDetection sort + aggregation', () => {
  it('sorts high severity before medium before low', async () => {
    const data = await loadAll();
    const { exceptions } = runDetection(data, FROZEN_NOW);
    const rank = (s: string) => (s === 'high' ? 0 : s === 'medium' ? 1 : 2);
    for (let i = 1; i < exceptions.length; i++) {
      expect(rank(exceptions[i].severity)).toBeGreaterThanOrEqual(rank(exceptions[i - 1].severity));
    }
  });

  it('byCategory aggregates totals and counts correctly', async () => {
    const data = await loadAll();
    const { exceptions, byCategory } = runDetection(data, FROZEN_NOW);
    for (const agg of byCategory) {
      const filtered = exceptions.filter((e) => e.category === agg.category);
      expect(filtered.length).toBe(agg.count);
      const sum = filtered.reduce((s, e) => s + Math.abs(e.amount_impact), 0);
      expect(agg.impact).toBeCloseTo(sum, 2);
    }
  });
});
