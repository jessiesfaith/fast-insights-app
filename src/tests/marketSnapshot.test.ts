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
    expect(MARKET_SNAPSHOT.readings).toHaveLength(4);
    for (const r of MARKET_SNAPSHOT.readings) {
      expect(r.value.length).toBeGreaterThan(0);
      expect(r.source.length).toBeGreaterThan(5);
    }
  });

  it('does not collide with preset scenario ids', () => {
    expect(TODAY_SCENARIO_ID).toBe('today');
  });
});
