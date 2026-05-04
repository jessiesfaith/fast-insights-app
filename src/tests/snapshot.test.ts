// JSON snapshot round-trip + hash integrity (BUILD.md §16 #8: snapshot
// export → import round-trips losslessly).

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCSVText } from '../lib/parse';
import {
  buildDatasetHashes,
  buildSnapshot,
  fnv1aHex,
  hashDataset,
  snapshotFileName,
  validateSnapshot,
} from '../lib/export/json';
import { ARData } from '../types/data';
import { DEFAULT_SCENARIO } from '../types/scenario';
import { EMPTY_SIGN_OFF } from '../types/audit';

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

describe('fnv1aHex', () => {
  it('returns 8 hex chars and is deterministic', () => {
    const a = fnv1aHex('hello world');
    const b = fnv1aHex('hello world');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{8}$/);
  });
  it('changes when input changes', () => {
    expect(fnv1aHex('a')).not.toBe(fnv1aHex('b'));
  });
});

describe('snapshotFileName', () => {
  it('slugifies entity and period and embeds the timestamp', () => {
    const name = snapshotFileName('Acme Pharma, Inc.', '2026-03', '2026-04-15T12:30:00.000Z');
    expect(name).toBe('ar-tool-beta-snapshot_Acme_Pharma_Inc_2026-03_2026-04-15T12-30-00.json');
  });

  it('falls back to "entity" when entity is empty', () => {
    const name = snapshotFileName('', '2026-03', '2026-04-15T12:30:00.000Z');
    expect(name.startsWith('ar-tool-beta-snapshot_entity_')).toBe(true);
  });
});

describe('snapshot build + JSON round-trip', () => {
  it('JSON.parse(JSON.stringify(snapshot)) reproduces the snapshot exactly', async () => {
    const data = await loadAll();
    const snap = buildSnapshot({
      data,
      summaries: [],
      operator: 'Alice',
      workflows: {},
      tickmarks: { 'invoice:INV-00001:a': true } as any,
      signOff: { ...EMPTY_SIGN_OFF, entityName: 'Acme Pharma' },
      scenario: DEFAULT_SCENARIO,
      themePreference: 'dark',
      period: '2026-03',
      generatedAt: '2026-04-15T12:00:00.000Z',
    });
    const round = JSON.parse(JSON.stringify(snap));
    expect(round).toEqual(snap);
  });

  it('imported snapshot matches re-computed dataset hashes', async () => {
    const data = await loadAll();
    const snap = buildSnapshot({
      data, summaries: [], operator: null, workflows: {}, tickmarks: {} as any,
      signOff: { ...EMPTY_SIGN_OFF }, scenario: DEFAULT_SCENARIO, themePreference: null,
      period: '2026-03', generatedAt: '2026-04-15T12:00:00.000Z',
    });
    const result = validateSnapshot(JSON.parse(JSON.stringify(snap)));
    expect(result.hashWarnings).toHaveLength(0);
    expect(result.snapshot.metadata.entityName).toBe('');
    expect(result.snapshot.metadata.period).toBe('2026-03');
    expect(result.snapshot.data.invoices.length).toBe(data.invoices.length);
  });

  it('flags hash mismatches when embedded data is tampered with', async () => {
    const data = await loadAll();
    const snap = buildSnapshot({
      data, summaries: [], operator: null, workflows: {}, tickmarks: {} as any,
      signOff: { ...EMPTY_SIGN_OFF }, scenario: DEFAULT_SCENARIO, themePreference: null,
      period: '2026-03', generatedAt: '2026-04-15T12:00:00.000Z',
    });
    // mutate a single invoice amount
    const tampered = JSON.parse(JSON.stringify(snap));
    tampered.data.invoices[0].total_amount += 1;
    const result = validateSnapshot(tampered);
    expect(result.hashWarnings.length).toBeGreaterThan(0);
    expect(result.hashWarnings[0]).toContain('invoices');
  });

  it('rejects an unknown schemaVersion', () => {
    expect(() => validateSnapshot({ schemaVersion: 99, metadata: { tool: 'AR Tool-Beta' }, data: {} })).toThrow(/schemaVersion/);
  });

  it('rejects a snapshot with the wrong tool name', () => {
    expect(() => validateSnapshot({ schemaVersion: 1, metadata: { tool: 'Other Tool' }, data: {} })).toThrow(/tool mismatch/);
  });
});

describe('buildDatasetHashes', () => {
  it('produces a hash per dataset', async () => {
    const data = await loadAll();
    const h = buildDatasetHashes(data);
    expect(h.invoices).toMatch(/^[0-9a-f]{8}$/);
    expect(h.receipts).toMatch(/^[0-9a-f]{8}$/);
    expect(h.glEntries).toMatch(/^[0-9a-f]{8}$/);
    expect(h.bankStatements).toMatch(/^[0-9a-f]{8}$/);
    expect(h.creditMemos).toMatch(/^[0-9a-f]{8}$/);
    expect(h.customers).toMatch(/^[0-9a-f]{8}$/);
  });

  it('hash of an empty dataset is stable', () => {
    expect(hashDataset([])).toBe(hashDataset([]));
  });
});
