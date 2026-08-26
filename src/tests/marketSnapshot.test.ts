import { describe, expect, it } from 'vitest';
import { FACTOR_RANGE } from '../lib/macroModel';
import { MARKET_SNAPSHOT, TODAY_SCENARIO_ID } from '../lib/marketSnapshot';

describe('market snapshot', () => {
  it('has a valid ISO as-of date', () => {
    expect(MARKET_SNAPSHOT.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(MARKET_SNAPSHOT.asOf))).toBe(false);
  });

  it('keeps its factor mapping inside the dial range', () => {
    for (const v of Object.values(MARKET_SNAPSHOT.factors)) {
      expect(Math.abs(v)).toBeLessThanOrEqual(FACTOR_RANGE);
    }
  });

  it('covers all four dials with sourced readings', () => {
    expect(MARKET_SNAPSHOT.readings.length).toBeGreaterThanOrEqual(4); // four dials + jobs/PCE/markets context rows
    for (const r of MARKET_SNAPSHOT.readings) {
      expect(r.value.length).toBeGreaterThan(0);
      expect(r.source.length).toBeGreaterThan(5);
    }
  });

  it('does not collide with preset scenario ids', () => {
    expect(TODAY_SCENARIO_ID).toBe('today');
  });
});

describe('the Aug-26 refresh rows', () => {
  it('carries the July jobs break, official PCE, the Sept hike odds, and market context', () => {
    const all = MARKET_SNAPSHOT.readings.map((r) => `${r.label} ${r.value} ${r.detail}`).join(' ');
    expect(all).toMatch(/4\.1% unemployment/);
    expect(all).toMatch(/−23,000|-23,000/);
    expect(all).toMatch(/3\.7% headline · 3\.3% core/);
    expect(all).toMatch(/~65% odds of a 25bp HIKE/);
    expect(all).toMatch(/S&P 500 ≈7,650/);
    expect(MARKET_SNAPSHOT.asOf).toBe('2026-08-26');
  });
});
