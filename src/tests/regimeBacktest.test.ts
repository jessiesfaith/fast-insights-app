import { describe, expect, it } from 'vitest';
import { BACKTEST_METHOD, REGIMES, runBacktests } from '../lib/regimeBacktest';

describe('the five regimes', () => {
  it('covers 2000, 2008, 2020, 2022, and today, each with dials, rates, and the outcome', () => {
    expect(REGIMES.map((r) => r.year)).toEqual(['2000', '2008', '2020', '2022', '2026']);
    for (const r of REGIMES) {
      expect(r.whatHappened.length).toBeGreaterThan(60);
      expect(r.fedFundsPct).toBeGreaterThan(0);
      expect(r.tenYearPct).toBeGreaterThan(0);
    }
    // the eras are shaped right: 2000 tight & high-rate, 2020 floored, 2026 the odd hold
    expect(REGIMES[0].fedFundsPct).toBeGreaterThan(6);
    expect(REGIMES[2].fedFundsPct).toBeLessThan(0.5);
    expect(REGIMES[4].tenYearPct).toBeGreaterThan(REGIMES[4].fedFundsPct); // the term-premium era
  });
});

describe('the backtests — computed, not asserted', () => {
  const results = runBacktests();
  const byId = (id: string) => results.find((r) => r.id === id)!;

  it('runs four written rules, each with a verdict for every regime', () => {
    expect(results.map((r) => r.id)).toEqual(['fix-floating', 'buy-downturn', 'bonds-hedge', 'debt-income']);
    for (const r of results) {
      expect(r.verdicts).toHaveLength(REGIMES.length);
      expect(r.criteria).toMatch(/IF|Watch/);
      expect(r.lesson.length).toBeGreaterThan(60);
    }
  });

  it('rule 1 (fix floating on tightening) is timeless: fires in 2000/2022, silent in the easings', () => {
    const r = byId('fix-floating');
    expect(r.timeless).toBe(true);
    const fired = r.verdicts.filter((v) => v.fired).map((v) => v.year);
    expect(fired).toEqual(['2000', '2022']);
  });

  it('rule 2 (buy the downturn) is timeless: M&A ranks #1 exactly in 2008/2020', () => {
    const r = byId('buy-downturn');
    expect(r.timeless).toBe(true);
    const fired = r.verdicts.filter((v) => v.fired).map((v) => v.year);
    expect(fired).toEqual(['2008', '2020']);
    // its value at the tops is silence
    expect(r.verdicts.find((v) => v.year === '2022')!.fired).toBe(false);
  });

  it('rule 3 (bonds hedge stocks) is NOT timeless: works in 2008/2020, fails in 2022 and 2026', () => {
    const r = byId('bonds-hedge');
    expect(r.timeless).toBe(false);
    const v = (year: string) => r.verdicts.find((x) => x.year === year)!;
    expect(v('2008').correct).toBe(true);
    expect(v('2020').correct).toBe(true);
    expect(v('2022').correct).toBe(false);
    expect(v('2026').correct).toBe(false); // the pattern has not come back
    expect(v('2022').note).toMatch(/BOTH down/);
    expect(r.lesson).toMatch(/environment/i);
  });

  it('rule 4 (debt vs income) flags the reflations and reads the brakes as healing', () => {
    const r = byId('debt-income');
    expect(r.timeless).toBe(true);
    const fired = r.verdicts.filter((v) => v.fired).map((v) => v.year);
    expect(fired).toEqual(['2008', '2020']);
    expect(r.verdicts.find((v) => v.year === '2022')!.note).toMatch(/healing/i);
  });

  it('the method encodes the discipline: written criteria, all regimes, silence scored, mechanisms over patterns', () => {
    const all = BACKTEST_METHOD.join(' ');
    expect(all).toMatch(/write down the criteria/i);
    expect(all).toMatch(/timeless and universal/i);
    expect(all).toMatch(/silence/i);
    expect(all).toMatch(/mechanism/i);
  });
});
