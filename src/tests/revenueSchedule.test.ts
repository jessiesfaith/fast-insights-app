// Revenue Schedule amortization engine — the math that must be exactly right.
//
// Asserts (per the build spec): every schedule sums to the invoice total
// exactly; month counts are right for mid-month and month-end starts; the
// Jan 31 clamp behaves; the point-in-time exception holds; and the deferred
// revenue balance closes to zero.

import { describe, expect, it } from 'vitest';
import {
  addMonths,
  buildModel,
  DEMO_LINES,
  isoLocal,
  isValidISODate,
  monthKey,
  normalizeLine,
  scheduleFor,
  RevenueLine,
} from '../lib/revenueSchedule';

let seq = 0;
const line = (over: Partial<RevenueLine>): RevenueLine => ({
  id: `t${++seq}`,
  source: 'test',
  invoiceNumber: 'INV-1',
  invoiceDate: '2026-01-15',
  productName: 'Test line',
  quantity: 1,
  amount: 1200,
  isSubscription: true,
  termMonths: 12,
  ...over,
});

const sum = (rows: Array<{ amount: number }>) =>
  Math.round(rows.reduce((s, r) => s + r.amount, 0) * 100) / 100;

describe('addMonths — day clamped to shorter target months', () => {
  it('Jan 31 + 1 month → Feb 28 in a common year', () => {
    const d = addMonths(new Date(2026, 0, 31), 1);
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 1, 28]);
  });

  it('Jan 31 + 1 month → Feb 29 in a leap year', () => {
    const d = addMonths(new Date(2028, 0, 31), 1);
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2028, 1, 29]);
  });

  it('May 31 + 1 month → Jun 30', () => {
    const d = addMonths(new Date(2026, 4, 31), 1);
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 5, 30]);
  });

  it('mid-month days pass through unchanged', () => {
    const d = addMonths(new Date(2026, 0, 15), 12);
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2027, 0, 15]);
  });
});

describe('scheduleFor — proration and exact tie-out', () => {
  it('a 12-month invoice dated Jan 15 touches 13 months, partial at both ends', () => {
    const s = scheduleFor(line({ invoiceDate: '2026-01-15', termMonths: 12, amount: 24000 }));
    expect(s.rows).toHaveLength(13);
    expect(s.rows[0].partial).toBe(true);
    expect(s.rows[12].partial).toBe(true);
    expect(s.rows.slice(1, 12).every((r) => !r.partial)).toBe(true);
    expect(sum(s.rows)).toBe(24000);
  });

  it('a first-of-month start spans exactly termMonths whole months', () => {
    const s = scheduleFor(line({ invoiceDate: '2026-02-01', termMonths: 24, amount: 18000 }));
    expect(s.rows).toHaveLength(24);
    expect(s.rows.every((r) => !r.partial)).toBe(true);
    expect(sum(s.rows)).toBe(18000);
  });

  it('a month-end (Jan 31) start clamps its end and still ties out', () => {
    const s = scheduleFor(line({ invoiceDate: '2026-01-31', termMonths: 1, amount: 500 }));
    // Service is [Jan 31, Feb 28): 1 day of Jan + 27 days of Feb.
    expect(s.rows.map((r) => r.key)).toEqual(['2026-01', '2026-02']);
    expect(s.rows[0].days).toBe(1);
    expect(s.rows[1].days).toBe(27);
    expect(sum(s.rows)).toBe(500);
  });

  it('awkward amounts tie to the penny — the final month absorbs rounding', () => {
    const s = scheduleFor(line({ invoiceDate: '2026-03-10', termMonths: 7, amount: 100.01 }));
    expect(sum(s.rows)).toBe(100.01);
    s.rows.forEach((r) => expect(r.amount).toBeCloseTo(Math.round(r.amount * 100) / 100, 10));
  });

  it('point-in-time exception: One-time + 1 month lands whole in the invoice month', () => {
    const s = scheduleFor(line({ invoiceDate: '2026-05-20', termMonths: 1, amount: 7200, isSubscription: false }));
    expect(s.pointInTime).toBe(true);
    expect(s.rows).toHaveLength(1);
    expect(s.rows[0]).toMatchObject({ key: '2026-05', amount: 7200 });
  });

  it('a Subscription with a 1-month term still prorates across two months', () => {
    const s = scheduleFor(line({ invoiceDate: '2026-05-20', termMonths: 1, amount: 3100, isSubscription: true }));
    expect(s.rows.map((r) => r.key)).toEqual(['2026-05', '2026-06']);
    expect(sum(s.rows)).toBe(3100);
  });

  it('an unparseable date yields an empty schedule instead of throwing', () => {
    const s = scheduleFor(line({ invoiceDate: 'not-a-date' }));
    expect(s.rows).toEqual([]);
    expect(s.start).toBeNull();
  });
});

describe('buildModel — demo dataset and accrual vs. tax', () => {
  const demo = DEMO_LINES.map((d, i) => ({ ...d, id: `demo${i}`, source: 'Demo data' }));
  const model = buildModel(demo);
  const billed = demo.reduce((s, d) => s + d.amount, 0);

  it('the demo bills $126,300 and schedules every dollar of it', () => {
    expect(billed).toBe(126300);
    const recognized = model.chart.reduce((s, m) => s + m.amount, 0);
    expect(Math.round(recognized * 100) / 100).toBe(126300);
    expect(model.chart[model.chart.length - 1].cumulative).toBe(126300);
  });

  it('tax basis lands each invoice whole in its issue month (Jan 26 = $28,500)', () => {
    expect(model.cash.get('2026-01')).toBe(28500);
    expect(model.cash.get('2026-02')).toBe(18000);
    expect(model.cash.get('2026-06')).toBe(27000);
  });

  it('both bases total the same and the deferred balance closes to zero', () => {
    const taxTotal = model.compare.reduce((s, c) => s + c.tax, 0);
    const accrualTotal = model.compare.reduce((s, c) => s + c.accrual, 0);
    expect(Math.round(taxTotal * 100) / 100).toBe(126300);
    expect(Math.round(accrualTotal * 100) / 100).toBe(126300);
    expect(model.compare[model.compare.length - 1].deferred).toBe(0);
  });

  it('month totals equal the sum of every line falling in that month', () => {
    for (const key of model.keys) {
      const fromLines = model.schedules
        .flatMap((s) => s.rows)
        .filter((r) => r.key === key)
        .reduce((s, r) => s + r.amount, 0);
      expect(model.totals.get(key)).toBeCloseTo(fromLines, 2);
    }
  });
});

describe('normalizeLine — clamps untrusted extraction output', () => {
  it('clamps term to 1–24, defaults by type, and rejects bad dates', () => {
    const a = normalizeLine({ termMonths: 99, isSubscription: true }, 'f.pdf', 'x1', '2026-09-03');
    expect(a.termMonths).toBe(24);
    const b = normalizeLine({ isSubscription: true }, 'f.pdf', 'x2', '2026-09-03');
    expect(b.termMonths).toBe(12);
    const c = normalizeLine({ isSubscription: false, invoiceDate: '13/01/2026' }, 'f.pdf', 'x3', '2026-09-03');
    expect(c.termMonths).toBe(1);
    expect(c.invoiceDate).toBe('2026-09-03');
  });

  it('rounds amounts to cents and clamps a negative term up to 1', () => {
    const n = normalizeLine({ amount: 10.999, quantity: 0, termMonths: -5, isSubscription: true }, 'f', 'x4', '2026-09-03');
    expect(n.amount).toBe(11);
    expect(n.quantity).toBe(1);
    expect(n.termMonths).toBe(1);
  });
});

describe('date validity and local formatting', () => {
  it('rejects calendar-rollover dates like Feb 31 that Date() silently normalizes', () => {
    expect(isValidISODate('2026-02-31')).toBe(false);
    expect(isValidISODate('2026-13-01')).toBe(false);
    expect(isValidISODate('2026-02-28')).toBe(true);
    expect(isValidISODate('2028-02-29')).toBe(true); // leap day
    expect(isValidISODate('2026-02-29')).toBe(false); // not a leap year
    const n = normalizeLine({ invoiceDate: '2026-02-31', isSubscription: true }, 'f', 'd1', '2026-09-03');
    expect(n.invoiceDate).toBe('2026-09-03');
  });

  it('isoLocal formats the local calendar day (no UTC shift)', () => {
    expect(isoLocal(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(isoLocal(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('service end date is the local calendar day before the exclusive end', () => {
    const s = scheduleFor(line({ invoiceDate: '2026-01-15', termMonths: 12 }));
    expect(s.end && isoLocal(s.end)).toBe('2027-01-14');
  });
});

describe('normalizeLine — string and amount clamps', () => {
  it('keeps whitespace-only names empty (placeholder shows) but names missing ones', () => {
    const a = normalizeLine({ productName: '   ', isSubscription: true }, 'f', 'p1', '2026-09-03');
    expect(a.productName).toBe('');
    const b = normalizeLine({ isSubscription: true }, 'f', 'p2', '2026-09-03');
    expect(b.productName).toBe('Unnamed line');
  });

  it('caps absurd extracted amounts and string lengths, preserving sign', () => {
    const big = normalizeLine({ amount: 1e12, isSubscription: true }, 'f', 'c1', '2026-09-03');
    expect(big.amount).toBe(99_999_999.99);
    const neg = normalizeLine({ amount: -1e12, isSubscription: true }, 'f', 'c2', '2026-09-03');
    expect(neg.amount).toBe(-99_999_999.99);
    const longName = normalizeLine({ productName: 'x'.repeat(5000), isSubscription: true }, 'f', 'c3', '2026-09-03');
    expect(longName.productName.length).toBe(300);
  });
});

describe('month keys', () => {
  it('pads and sorts correctly across a year boundary', () => {
    expect(monthKey(2026, 3)).toBe('2026-03');
    expect(['2026-12', '2026-02', '2027-01'].sort()).toEqual(['2026-02', '2026-12', '2027-01']);
  });
});
