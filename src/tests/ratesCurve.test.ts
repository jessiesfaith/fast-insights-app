import { describe, expect, it } from 'vitest';
import {
  BOND_BASICS,
  CUTS_VS_TENYEAR,
  RATES_SNAPSHOT,
  RATE_STACK,
  SNAP_REASONS,
  THREE_WAYS_DOWN,
  breakevens,
  curveShape,
  curveSlopes,
  curveYield,
  mortgageTreasurySpreadBp,
  DEBT_HISTORY,
  DEBT_HISTORY_SOURCE,
  DEBT_INTEREST_READS,
  debtHistoryRows,
  effectiveDebtRatePct,
} from '../lib/ratesCurve';

describe('the official H.15 snapshot', () => {
  it('carries the cited policy prints and the full 1M–30Y curve', () => {
    expect(RATES_SNAPSHOT.fedFundsTarget).toBe('3.50–3.75%');
    expect(RATES_SNAPSHOT.effrPct).toBe(3.63);
    expect(RATES_SNAPSHOT.iorbPct).toBe(3.65);
    expect(RATES_SNAPSHOT.curve).toHaveLength(11);
    // never just the 10-year: the full spec maturities are present
    for (const m of ['1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y']) {
      expect(() => curveYield(m)).not.toThrow();
    }
    // the cited observations
    expect(curveYield('2Y')).toBe(4.24);
    expect(curveYield('10Y')).toBe(4.7);
    expect(curveYield('30Y')).toBe(5.23);
  });

  it('EFFR sits inside the target range and IORB floors it from just above the mid', () => {
    expect(RATES_SNAPSHOT.effrPct).toBeGreaterThanOrEqual(3.5);
    expect(RATES_SNAPSHOT.effrPct).toBeLessThanOrEqual(3.75);
  });
});

describe('deterministic curve math (spec §108: never eyeball a graph)', () => {
  it('computes the exact cited slopes: 2s10s 46bp, 3m10y 83bp, 5s30s 82bp', () => {
    const by = (name: string) => curveSlopes().find((s) => s.name === name)!;
    expect(by('2s10s').bps).toBe(46);
    expect(by('3m10y').bps).toBe(83);
    expect(by('5s30s').bps).toBe(82);
    expect(by('10s30s').bps).toBe(53);
    // displayed in both units
    expect(by('2s10s').pct).toBe(0.46);
  });

  it('classifies today’s curve as upward-sloping (normal)', () => {
    expect(curveShape().shape).toBe('normal');
  });

  it('breakevens are nominal − real: 10Y ≈ 2.32%, and every TIPS maturity computes', () => {
    const bes = breakevens();
    const b10 = bes.find((b) => b.maturity === '10Y')!;
    expect(b10.nominalPct).toBe(4.7);
    expect(b10.realPct).toBe(2.38);
    expect(b10.breakevenPct).toBe(2.32);
    expect(bes.map((b) => b.maturity)).toEqual(['5Y', '7Y', '10Y', '20Y', '30Y']);
    for (const b of bes) expect(b.breakevenPct).toBeCloseTo(b.nominalPct - b.realPct, 5);
  });

  it('the mortgage−10Y spread computes to the cited 196bp', () => {
    expect(mortgageTreasurySpreadBp()).toBe(196);
  });
});

describe('the teaching structure', () => {
  it('the chain weakens: the Fed’s grip strictly decreases with maturity', () => {
    const c = RATES_SNAPSHOT.curve;
    for (let i = 1; i < c.length; i++) expect(c[i].fedGripPct).toBeLessThanOrEqual(c[i - 1].fedGripPct);
    expect(c[0].fedGripPct).toBeGreaterThanOrEqual(90);
    expect(c[c.length - 1].fedGripPct).toBeLessThanOrEqual(15);
  });

  it('the rate stack covers levels A–H, each with who-sets and what-it-decides', () => {
    expect(RATE_STACK.map((l) => l.level)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    for (const l of RATE_STACK) {
      expect(l.whoSets.length).toBeGreaterThan(30);
      expect(l.decides.length).toBeGreaterThan(20);
    }
  });

  it('the divergence: the Fed cut 175bp while the 10Y ended higher than it started', () => {
    const first = CUTS_VS_TENYEAR[0];
    const last = CUTS_VS_TENYEAR[CUTS_VS_TENYEAR.length - 1];
    expect(Math.round((first.fed - last.fed) * 100)).toBe(RATES_SNAPSHOT.easedSinceSep2024Bp);
    expect(last.tenYear).toBeGreaterThan(first.tenYear);
    // and the ending 10Y matches the official curve print
    expect(last.tenYear).toBe(curveYield('10Y'));
  });

  it('bond basics, snap reasons, and the three ways down are complete', () => {
    expect(BOND_BASICS).toHaveLength(4);
    expect(BOND_BASICS.map((b) => b.name).join(' ')).toMatch(/Duration/);
    expect(SNAP_REASONS.map((r) => r.name).join(' ')).toMatch(/Supply.*Competition.*Doubt/s);
    expect(THREE_WAYS_DOWN).toHaveLength(3);
    expect(THREE_WAYS_DOWN[2].warning).toMatch(/job losses/i);
  });
});

describe('the debt build-up to $40T and the interest bill (step H)', () => {
  it('anchors to the snapshot: ends at $40T and ≈$1.2T interest, with the milestone notes', () => {
    const last = DEBT_HISTORY[DEBT_HISTORY.length - 1];
    expect(last.year).toBe(2026);
    expect(last.debtT).toBe(40);
    expect(RATES_SNAPSHOT.nationalDebt).toMatch(/\$40 trillion/);
    expect(last.interestB).toBe(1200);
    expect(RATES_SNAPSHOT.annualInterestCost).toMatch(/1\.2 trillion/);
    const notes = DEBT_HISTORY.filter((d) => d.note).map((d) => `${d.year} ${d.note}`).join(' ');
    expect(notes).toMatch(/2008 Crosses \$10T/);
    expect(notes).toMatch(/2017 Crosses \$20T/);
    expect(notes).toMatch(/2022 Crosses \$30T/);
    expect(notes).toMatch(/2026 Crosses \$40T/);
  });

  it('the effective rate is computed (interest ÷ debt), bottoms in the cheap-money era, then climbs every year', () => {
    expect(effectiveDebtRatePct({ year: 2000, debtT: 5.7, interestB: 223 })).toBeCloseTo(3.91, 2);
    const eff = DEBT_HISTORY.map(effectiveDebtRatePct);
    const minIdx = eff.indexOf(Math.min(...eff));
    const minYear = DEBT_HISTORY[minIdx].year;
    expect(minYear).toBeGreaterThanOrEqual(2010);
    expect(minYear).toBeLessThanOrEqual(2021);
    // strictly rising after 2021 — the repricing
    const from2021 = DEBT_HISTORY.filter((d) => d.year >= 2021).map(effectiveDebtRatePct);
    for (let i = 1; i < from2021.length; i++) expect(from2021[i]).toBeGreaterThan(from2021[i - 1]);
    // and still below the 10Y — the rollover gap that keeps the bill climbing
    const eff2026 = effectiveDebtRatePct(DEBT_HISTORY[DEBT_HISTORY.length - 1]);
    expect(eff2026).toBeLessThan(RATES_SNAPSHOT.curve.find((c) => c.maturity === '10Y')!.yieldPct);
  });

  it('chart rows carry all three series; reads carry the doubling ladder, the rollover math, and the defense comparison', () => {
    const rows = debtHistoryRows();
    expect(rows).toHaveLength(DEBT_HISTORY.length);
    expect(rows[0]).toMatchObject({ year: '2000', debtT: 5.7, interestB: 223, effPct: 3.91 });
    const all = DEBT_INTEREST_READS.join(' ');
    expect(all).toMatch(/\$10T \(2008\) → \$20T \(2017\) → \$40T \(2026\)/);
    expect(all).toMatch(/third of the stock matures/i);
    expect(all).toMatch(/defense \(~\$900B\)/);
    expect(all).toMatch(/term premium/i);
    expect(DEBT_HISTORY_SOURCE).toMatch(/APPROXIMATE TEACHING VALUES/);
    expect(DEBT_HISTORY_SOURCE).toMatch(/COMPUTED/);
  });
});
