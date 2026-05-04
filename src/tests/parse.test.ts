// Smoke tests for the CSV ingestion pipeline.
// Verifies the parser produces typed records with correct row counts and
// that orphan-FK detection runs across the full sample dataset.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crossValidate, detectDatasetKey, parseCSVText } from '../lib/parse';
import { ARData } from '../types/data';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../sample-data');

function read(name: string) {
  return readFileSync(resolve(DATA_DIR, name), 'utf8');
}

describe('detectDatasetKey', () => {
  it('identifies invoices from header row', () => {
    expect(
      detectDatasetKey([
        'invoice_id', 'customer_id', 'invoice_date', 'due_date', 'period',
        'product_id', 'product_description', 'product_category', 'quantity',
        'unit_price', 'gross_amount', 'discount_amount', 'net_amount',
        'tax_amount', 'total_amount', 'status', 'gl_entry_id', 'salesperson',
        'territory', 'po_number', 'notes',
      ]),
    ).toBe('invoices');
  });

  it('returns null when headers do not match any schema', () => {
    expect(detectDatasetKey(['foo', 'bar', 'baz'])).toBeNull();
  });
});

describe('parseCSVText — sample data', () => {
  it('parses invoices.csv with expected row count', async () => {
    const r = await parseCSVText(read('invoices.csv'), 'invoices.csv');
    expect(r.key).toBe('invoices');
    expect(r.rows.length).toBeGreaterThan(300);
    expect(r.summary.totalAmount).toBeGreaterThan(0);
    expect(r.summary.periodRange).not.toBeNull();
  });

  it('parses cash_receipts.csv and surfaces unapplied receipts', async () => {
    const r = await parseCSVText(read('cash_receipts.csv'), 'cash_receipts.csv');
    expect(r.key).toBe('receipts');
    expect(r.rows.length).toBeGreaterThan(150);
    const rcp109 = r.rows.find((row: any) => row.receipt_id === 'RCP-00109') as any;
    expect(rcp109).toBeTruthy();
    // BUILD.md §16 #3 — RCP-00109 must surface as the $852,079.52 unapplied
    expect(rcp109.amount).toBeCloseTo(852_079.52, 2);
  });

  it('parses gl_entries.csv with debit/credit numbers coerced', async () => {
    const r = await parseCSVText(read('gl_entries.csv'), 'gl_entries.csv');
    expect(r.key).toBe('glEntries');
    expect(r.rows.length).toBeGreaterThan(1000);
    const sample: any = r.rows[0];
    expect(typeof sample.debit).toBe('number');
    expect(typeof sample.credit).toBe('number');
  });

  it('parses bank_statements.csv with pipe-delimited matched_receipt_ids as array', async () => {
    const r = await parseCSVText(read('bank_statements.csv'), 'bank_statements.csv');
    expect(r.key).toBe('bankStatements');
    const withMatches: any = (r.rows as any[]).find((row) => Array.isArray(row.matched_receipt_ids) && row.matched_receipt_ids.length > 0);
    expect(withMatches).toBeTruthy();
    expect(Array.isArray(withMatches.matched_receipt_ids)).toBe(true);
  });

  it('parses credit_memos.csv', async () => {
    const r = await parseCSVText(read('credit_memos.csv'), 'credit_memos.csv');
    expect(r.key).toBe('creditMemos');
    expect(r.rows.length).toBeGreaterThan(30);
  });

  it('parses customers.csv with credit_limit as number', async () => {
    const r = await parseCSVText(read('customers.csv'), 'customers.csv');
    expect(r.key).toBe('customers');
    const sample: any = r.rows[0];
    expect(typeof sample.credit_limit).toBe('number');
  });

  it('rejects a CSV with missing required columns', async () => {
    const bad = 'foo,bar,baz\n1,2,3';
    await expect(parseCSVText(bad, 'bad.csv')).rejects.toThrow(/header set does not match/);
  });
});

describe('crossValidate', () => {
  it('runs without throwing on full sample dataset', async () => {
    const data: ARData = {
      invoices: [], receipts: [], creditMemos: [], glEntries: [], bankStatements: [], customers: [],
    };
    const summaries = [];
    for (const f of [
      'invoices.csv', 'cash_receipts.csv', 'credit_memos.csv',
      'gl_entries.csv', 'bank_statements.csv', 'customers.csv',
    ]) {
      const r = await parseCSVText(read(f), f);
      (data as any)[r.key] = r.rows;
      summaries.push(r.summary);
    }
    const final = crossValidate(data, summaries);
    expect(final.length).toBe(6);
    // every dataset accounted for
    const keys = final.map((s) => s.key).sort();
    expect(keys).toEqual([
      'bankStatements', 'creditMemos', 'customers', 'glEntries', 'invoices', 'receipts',
    ]);
  });
});
