// ARR and Churn — the math and the wording.
//
// The expected figures below are the reviewed reference values for the sales
// demo (a $1.95M software company and a $2.4M nonprofit, same year). Dollars
// are exact; ratios are checked to six decimals. If a number here changes, the
// copy on the page changes with it — that is the point of the test.

import { describe, expect, it } from 'vitest';
import {
  BLANK,
  DEMO,
  VOCAB,
  asStrings,
  calc,
  count,
  explain,
  num,
  short,
  type RawInputs,
} from '../lib/arrAndChurn';

/** BLANK with a few fields filled, for the edge cases. */
const inputs = (over: Partial<RawInputs>): RawInputs => ({ ...BLANK, ...over });

const fp = () => calc(asStrings(DEMO.fp), 'fp');
const nfp = () => calc(asStrings(DEMO.nfp), 'nfp');

describe('calc() — the demo ties to the reviewed figures', () => {
  it('for-profit', () => {
    const c = fp();
    expect(c.end).toBe(1_995_000);
    expect(c.netNew).toBe(395_000);
    expect(c.growth).toBeCloseTo(0.246875, 6);
    expect(c.retained).toBe(1_475_000);
    expect(c.nar).toBeCloseTo(0.921875, 6);
    expect(c.grr).toBeCloseTo(0.790625, 6);
    expect(c.dollarChurn).toBeCloseTo(0.15, 6);
    expect(c.netChurn).toBeCloseTo(0.078125, 6);
    expect(c.logoChurn).toBeCloseTo(0.141667, 6);
    expect(c.retention).toBeCloseTo(0.858333, 6);
    expect(c.endCount).toBe(267);
    expect(c.avgAccount).toBeCloseTo(6_666.67, 2);
    expect(c.avgLost).toBeCloseTo(7_058.82, 2);
    expect(c.avgNew).toBeCloseTo(8_524.59, 2);
    expect(c.lifetime).toBeCloseTo(7.058824, 6);
    expect(c.standStill).toBe(125_000);
    expect(c.newNeeded).toBeCloseTo(14.663462, 6);
    expect(c.recurringEarned).toBe(1_797_500);
    expect(c.share).toBeCloseTo(0.921795, 6);
    expect(c.warnings).toEqual([]);
  });

  it('not-for-profit', () => {
    const c = nfp();
    expect(c.end).toBe(1_210_000);
    expect(c.netNew).toBe(-90_000);
    expect(c.growth).toBeCloseTo(-0.069231, 6);
    expect(c.retained).toBe(830_000);
    expect(c.nar).toBeCloseTo(0.638462, 6);
    expect(c.grr).toBeCloseTo(0.515385, 6);
    expect(c.dollarChurn).toBeCloseTo(0.4, 6);
    expect(c.netChurn).toBeCloseTo(0.361538, 6);
    expect(c.logoChurn).toBeCloseTo(0.551351, 6);
    expect(c.retention).toBeCloseTo(0.448649, 6);
    expect(c.endCount).toBe(1_810);
    expect(c.avgAccount).toBeCloseTo(702.7, 2);
    expect(c.avgLost).toBeCloseTo(509.8, 2);
    expect(c.avgNew).toBeCloseTo(387.76, 2);
    expect(c.lifetime).toBeCloseTo(1.813725, 6);
    expect(c.standStill).toBe(470_000);
    expect(c.newNeeded).toBeCloseTo(1_212.105263, 6);
    expect(c.recurringEarned).toBe(1_210_000);
    expect(c.share).toBeCloseTo(0.504167, 6);
    expect(c.warnings).toEqual([]);
  });

  it('the bridge ties: begin + new + up − down − lost = end, both columns', () => {
    for (const c of [fp(), nfp()]) {
      expect(c.begin + c.add + c.up - c.down - c.lost).toBe(c.end);
      expect(c.begin + c.up - c.down - c.lost).toBe(c.retained);
      expect(c.startCount + c.newCount - c.lostCount).toBe(c.endCount);
    }
  });
});

describe('explain() — the demo pills', () => {
  it('for-profit', () => {
    const e = explain('fp', fp());
    expect(e.arrPill).toEqual({ tone: 'good', text: 'Up 24.7% for the year' });
    expect(e.narPill).toEqual({ tone: 'flat', text: 'Base shrinking slowly' });
    expect(e.churnPill).toEqual({ tone: 'flat', text: 'Moderate' });
  });

  it('not-for-profit', () => {
    const e = explain('nfp', nfp());
    expect(e.arrPill).toEqual({ tone: 'warn', text: 'Down 6.9% for the year' });
    expect(e.narPill).toEqual({ tone: 'flat', text: 'Typical for the sector' });
    expect(e.churnPill).toEqual({ tone: 'flat', text: 'Around sector norm' });
  });

  it('every section has something to say about the demo', () => {
    for (const kind of ['fp', 'nfp'] as const) {
      const e = explain(kind, calc(asStrings(DEMO[kind]), kind));
      expect(e.arr.length).toBeGreaterThan(0);
      expect(e.nar.length).toBeGreaterThan(0);
      expect(e.churn.length).toBeGreaterThan(0);
      expect(e.arr.join(' ')).not.toContain('undefined');
      expect(e.nar.join(' ')).not.toContain('undefined');
      expect(e.churn.join(' ')).not.toContain('undefined');
    }
  });
});

describe('edge case — everything blank', () => {
  it('every dollar figure is 0 and every ratio is null, with no warnings', () => {
    for (const kind of ['fp', 'nfp'] as const) {
      const c = calc(BLANK, kind);
      expect([c.end, c.netNew, c.retained, c.endCount, c.standStill, c.recurringEarned]).toEqual([0, 0, 0, 0, 0, 0]);
      expect(c.has).toBe(false);
      for (const r of [c.growth, c.nar, c.grr, c.dollarChurn, c.netChurn, c.logoChurn, c.retention,
        c.avgAccount, c.avgLost, c.avgNew, c.lifetime, c.newNeeded, c.share]) {
        expect(r).toBeNull();
      }
      expect(c.warnings).toEqual([]);
    }
  });

  it('shows the empty-state copy and no ARR pill', () => {
    const e = explain('fp', calc(BLANK, 'fp'));
    expect(e.arr[0]).toContain('Enter the ARR you started the year with');
    expect(e.nar[0]).toContain('needs a beginning ARR to measure against.');
    expect(e.churn[0]).toContain('Enter customer counts here and a beginning ARR above');
    expect(e.arrPill).toBeNull();
    expect(e.narPill).toBeNull();
    expect(e.churnPill).toBeNull();

    const n = explain('nfp', calc(BLANK, 'nfp'));
    expect(n.arr[0]).toContain("Enter what last year's donors gave");
    expect(n.nar[0]).toContain("needs last year's giving to measure against.");
    expect(n.churn[0]).toContain("Enter donor counts here and last year's giving above");
  });
});

describe('edge case — zero beginning balance with movements', () => {
  it('ends at what came in, and the ratios with no denominator stay null', () => {
    const c = calc(inputs({ add: '150000' }), 'fp');
    expect(c.end).toBe(150_000);
    expect(c.netNew).toBe(150_000);
    expect(c.nar).toBeNull();
    expect(c.grr).toBeNull();
    expect(c.netChurn).toBeNull();
    expect(c.growth).toBeNull();
    expect(c.warnings).toEqual([]);
  });

  it('the pill falls back to dollars, because there is no percentage to show', () => {
    const e = explain('fp', calc(inputs({ add: '150000' }), 'fp'));
    expect(e.arrPill).toEqual({ tone: 'good', text: 'Up $150,000 for the year' });
  });
});

describe('edge case — warnings', () => {
  it('down + lost greater than the beginning balance', () => {
    const f = calc(inputs({ begin: '100000', down: '60000', lost: '60000' }), 'fp');
    expect(f.retained).toBeLessThan(0);
    expect(f.warnings.join(' ')).toContain('retained ARR is negative');

    const n = calc(inputs({ begin: '100000', down: '60000', lost: '60000' }), 'nfp');
    expect(n.warnings.join(' ')).toContain('retained giving is negative');
  });

  it('more accounts lost than were there at the start', () => {
    const f = calc(inputs({ startCount: '100', lostCount: '120' }), 'fp');
    expect(f.warnings.join(' ')).toContain('More customers lost than you started with');

    const n = calc(inputs({ startCount: '100', lostCount: '120' }), 'nfp');
    expect(n.warnings.join(' ')).toContain('More donors lost than you started with');
  });

  it('recurring revenue larger than total revenue', () => {
    const f = calc(inputs({ revenue: '100000', begin: '900000', add: '50000' }), 'fp');
    expect(f.share).toBeGreaterThan(1);
    expect(f.warnings.join(' ')).toContain('cannot exceed total revenue');

    const n = calc(inputs({ revenue: '100000', begin: '900000', add: '50000' }), 'nfp');
    expect(n.warnings.join(' ')).toContain('larger than total revenue');
  });
});

describe('edge case — expansion outruns every loss', () => {
  const over = { begin: '1000000', up: '300000', down: '50000', lost: '100000' };

  it('there is nothing to stand still against', () => {
    const c = calc(inputs(over), 'fp');
    expect(c.standStill).toBeLessThanOrEqual(0);
  });

  it('the copy says growth would have happened with nobody new', () => {
    expect(explain('fp', calc(inputs(over), 'fp')).churn.join(' '))
      .toContain('would have grown even with no new customers at all');
    expect(explain('nfp', calc(inputs(over), 'nfp')).churn.join(' '))
      .toContain('without a single new donor');
  });
});

describe('formatting helpers', () => {
  it('counts one thing in the singular', () => {
    expect(count(1, ['customer', 'customers'])).toBe('1 customer');
    expect(count(2, ['customer', 'customers'])).toBe('2 customers');
    expect(count(0, VOCAB.nfp.units)).toBe('0 donors');
  });

  it('parses a pasted, formatted figure', () => {
    expect(num('$1,250.00')).toBe(1250);
    expect(num('1,600,000')).toBe(1_600_000);
    expect(num('')).toBe(0);
    expect(num('nonsense')).toBe(0);
  });

  it('clamps negative input to zero', () => {
    expect(calc(inputs({ begin: '-500' }), 'fp').begin).toBe(0);
  });

  it('shortens dollars for the chart labels', () => {
    expect(short(1_995_000)).toBe('$2.0M');
    expect(short(1_950_000)).toBe('$1.95M');
    expect(short(520_000)).toBe('$520K');
    expect(short(-95_000)).toBe('−$95K');
    expect(short(0)).toBe('$0');
  });
});
