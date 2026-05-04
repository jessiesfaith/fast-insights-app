// KPI + aging tests against the seeded sample dataset.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCSVText } from '../lib/parse';
import {
  buildKPIs,
  daysToApplyMedian,
  dsoCountback,
  shortPay,
  unappliedCash,
  unappliedCredits,
} from '../lib/kpis';
import { bucketForDaysPastDue, buildAging } from '../lib/aging';
import { computeSubledgerAR } from '../lib/recon';
import { periodBounds } from '../lib/period';
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

describe('aging buckets', () => {
  it('classifies days past due correctly', () => {
    expect(bucketForDaysPastDue(-5)).toBe('Current');
    expect(bucketForDaysPastDue(0)).toBe('Current');
    expect(bucketForDaysPastDue(1)).toBe('1-30');
    expect(bucketForDaysPastDue(30)).toBe('1-30');
    expect(bucketForDaysPastDue(31)).toBe('31-60');
    expect(bucketForDaysPastDue(60)).toBe('31-60');
    expect(bucketForDaysPastDue(61)).toBe('61-90');
    expect(bucketForDaysPastDue(91)).toBe('90+');
  });
});

describe('aging schedule on sample data', () => {
  it('totalOpenAR equals subledger AR for the same period_end', async () => {
    const data = await loadAll();
    const aging = buildAging(data, '2026-03');
    const sub = computeSubledgerAR(data, periodBounds('2026-03').end).total;
    expect(aging.totalOpenAR).toBeCloseTo(sub, 2);
  });

  it('bucket sums equal totalOpenAR', async () => {
    const data = await loadAll();
    const aging = buildAging(data, '2026-03');
    const sum = aging.totals.reduce((s, t) => s + t.amount, 0);
    expect(sum).toBeCloseTo(aging.totalOpenAR, 2);
  });

  it('customer breakdown sums equal totalOpenAR', async () => {
    const data = await loadAll();
    const aging = buildAging(data, '2026-03');
    const sum = aging.byCustomer.reduce((s, c) => s + c.total, 0);
    expect(sum).toBeCloseTo(aging.totalOpenAR, 2);
  });
});

describe('individual KPI math', () => {
  it('DSO countback returns 0 when ending AR is 0', async () => {
    const data = await loadAll();
    expect(dsoCountback(data, '2026-03-31', 0)).toBe(0);
  });

  it('DSO countback walks back to cover ending AR', async () => {
    const data = await loadAll();
    const periodEnd = '2026-03-31';
    const sub = computeSubledgerAR(data, periodEnd).total;
    const dso = dsoCountback(data, periodEnd, sub);
    // Sample dataset spans Jan-Mar 2026 with ~$10M in invoices and a few
    // million $ open AR; DSO should land in a sensible window.
    expect(dso).toBeGreaterThan(0);
    expect(dso).toBeLessThan(365);
  });

  it('unapplied cash includes RCP-00109 ($852,079.52) (§16 #3)', async () => {
    const data = await loadAll();
    const total = unappliedCash(data, '2026-03-31');
    expect(total).toBeGreaterThanOrEqual(852_079.52);
  });

  it('unapplied credits surfaces CM-0001, CM-0008, CM-0014 amounts', async () => {
    const data = await loadAll();
    const total = unappliedCredits(data, '2026-03-31');
    const expected = data.creditMemos
      .filter((m) => ['CM-0001', 'CM-0008', 'CM-0014'].includes(m.memo_id))
      .reduce((s, m) => s + m.amount, 0);
    expect(total).toBeGreaterThanOrEqual(expected);
  });

  it('short pay $ includes the seeded INV-00031 ($12,800.21) shortfall', async () => {
    const data = await loadAll();
    const total = shortPay(data, '2026-03-31');
    expect(total).toBeGreaterThanOrEqual(12_800.21);
  });

  it('days-to-apply median is non-negative on sample receipts', async () => {
    const data = await loadAll();
    const median = daysToApplyMedian(data, '2026-03-01', '2026-03-31');
    expect(median).toBeGreaterThanOrEqual(0);
  });
});

describe('buildKPIs bundle', () => {
  it('returns 8 KPI results in the documented order', async () => {
    const data = await loadAll();
    const bundle = buildKPIs(data, '2026-03');
    expect(bundle.results).toHaveLength(8);
    expect(bundle.results.map((k) => k.key)).toEqual([
      'dso',
      'pctCurrent',
      'pastDuePct',
      'topTenConcentration',
      'unappliedCash',
      'unappliedCredits',
      'shortPay',
      'daysToApplyMedian',
    ]);
  });

  it('% current + past due % ≈ 1', async () => {
    const data = await loadAll();
    const bundle = buildKPIs(data, '2026-03');
    const cur = bundle.results.find((k) => k.key === 'pctCurrent')!.current;
    const pd = bundle.results.find((k) => k.key === 'pastDuePct')!.current;
    expect(cur + pd).toBeCloseTo(1, 6);
  });

  it('top-10 concentration is between 0 and 1', async () => {
    const data = await loadAll();
    const bundle = buildKPIs(data, '2026-03');
    const c = bundle.results.find((k) => k.key === 'topTenConcentration')!.current;
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThanOrEqual(1);
  });

  it('exposes a delta vs prior period for the chosen month', async () => {
    const data = await loadAll();
    const bundle = buildKPIs(data, '2026-03');
    expect(bundle.period.prior).toBe('2026-02');
    const dso = bundle.results.find((k) => k.key === 'dso')!;
    expect(dso.prior).not.toBeNull();
    expect(dso.delta).not.toBeNull();
  });
});
