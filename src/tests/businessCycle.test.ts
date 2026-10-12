import { describe, expect, it } from 'vitest';
import {
  GROUPS,
  INDICATORS,
  breadth,
  breadthLabel,
  cycleHeight,
  indicatorsFor,
  phaseAt,
} from '../lib/businessCycle';

describe('business cycle indicators — data integrity', () => {
  it('has unique ids and every indicator belongs to a known group', () => {
    const ids = new Set(INDICATORS.map((i) => i.id));
    expect(ids.size).toBe(INDICATORS.length);
    const groupIds = new Set(GROUPS.map((g) => g.id));
    for (const i of INDICATORS) expect(groupIds.has(i.group)).toBe(true);
  });

  it('positions every indicator strictly inside the curve (0 < x < 1)', () => {
    for (const i of INDICATORS) {
      expect(i.x).toBeGreaterThan(0);
      expect(i.x).toBeLessThan(1);
    }
  });

  it('matches the source graphic: 11 leading, 8 coincident, 7 lagging', () => {
    expect(indicatorsFor('leading')).toHaveLength(11);
    expect(indicatorsFor('coincident')).toHaveLength(8);
    expect(indicatorsFor('lagging')).toHaveLength(7);
  });

  it('returns each group sorted left → right along the curve', () => {
    for (const g of GROUPS) {
      const rows = indicatorsFor(g.id);
      for (let k = 1; k < rows.length; k++) expect(rows[k].x).toBeGreaterThan(rows[k - 1].x);
    }
  });

  it('keeps labels far enough apart to draw (no two same-group dots closer than 0.05)', () => {
    for (const g of GROUPS) {
      const rows = indicatorsFor(g.id);
      for (let k = 1; k < rows.length; k++) expect(rows[k].x - rows[k - 1].x).toBeGreaterThanOrEqual(0.05);
    }
  });
});

describe('cycle curve geometry', () => {
  it('starts and ends at a trough and tops out at the peak', () => {
    expect(cycleHeight(0, 0.42)).toBeCloseTo(0, 6);
    expect(cycleHeight(0.42, 0.42)).toBeCloseTo(1, 6);
    expect(cycleHeight(1, 0.42)).toBeCloseTo(0, 6);
  });

  it('rises monotonically to the peak and falls monotonically after it', () => {
    const peakAt = 0.45;
    let prev = cycleHeight(0, peakAt);
    for (let x = 0.01; x <= peakAt + 1e-9; x += 0.01) {
      const h = cycleHeight(x, peakAt);
      expect(h).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = h;
    }
    for (let x = peakAt + 0.01; x <= 1 + 1e-9; x += 0.01) {
      const h = cycleHeight(x, peakAt);
      expect(h).toBeLessThanOrEqual(prev + 1e-9);
      prev = h;
    }
  });

  it('clamps out-of-range positions', () => {
    expect(cycleHeight(-5, 0.4)).toBeCloseTo(0, 6);
    expect(cycleHeight(7, 0.4)).toBeCloseTo(0, 6);
  });

  it('labels the side of the peak', () => {
    expect(phaseAt(0.1, 0.42)).toBe('expansion');
    expect(phaseAt(0.9, 0.42)).toBe('contraction');
  });
});

describe('breadth', () => {
  it('counts expansion vs contraction signals per group from the snapshot', () => {
    const b = breadth();
    const leading = b.find((r) => r.group === 'leading')!;
    expect(leading.total).toBe(11);
    expect(leading.expansion).toBe(5);
    expect(leading.contraction).toBe(6);
    const coincident = b.find((r) => r.group === 'coincident')!;
    expect(coincident.expansion).toBe(4);
    expect(coincident.contraction).toBe(4);
    const lagging = b.find((r) => r.group === 'lagging')!;
    expect(lagging.expansion).toBe(3);
    expect(lagging.contraction).toBe(4);
  });

  it('reads breadth in plain English', () => {
    expect(breadthLabel({ group: 'leading', expansion: 8, contraction: 2, total: 10, expansionShare: 0.8 })).toBe('Broadly expanding');
    expect(breadthLabel({ group: 'leading', expansion: 2, contraction: 8, total: 10, expansionShare: 0.2 })).toBe('Broadly contracting');
    expect(breadthLabel({ group: 'leading', expansion: 5, contraction: 5, total: 10, expansionShare: 0.5 })).toBe('Mixed');
    expect(breadthLabel({ group: 'leading', expansion: 0, contraction: 0, total: 0, expansionShare: 0 })).toBe('No indicators');
  });

  it('handles an empty list', () => {
    for (const r of breadth([])) {
      expect(r.total).toBe(0);
      expect(r.expansionShare).toBe(0);
    }
  });
});
