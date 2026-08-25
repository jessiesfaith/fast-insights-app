import { describe, expect, it } from 'vitest';
import {
  BEHAVIORAL_STAPLES,
  DRILL_CARDS,
  EY_OUTLOOK,
  GAP_CHECK,
  INTERVIEW_FORMAT,
  TAKE_HOME_PLAN,
} from '../lib/eyPrep';

describe('the EY gap check', () => {
  it('every item has a status, a location, and something to know', () => {
    expect(GAP_CHECK.length).toBeGreaterThanOrEqual(14);
    for (const g of GAP_CHECK) {
      expect(['covered', 'partial', 'gap']).toContain(g.status);
      expect(g.where.length).toBeGreaterThan(10);
      expect(g.know.length).toBeGreaterThan(40);
    }
  });

  it('covers the load-bearing checklist and names the honest gaps', () => {
    const items = GAP_CHECK.map((g) => g.item).join(' ');
    for (const must of ['DCF', 'WACC', 'EV/EBITDA', 'sensitivity', 'Three-statement', 'Enterprise value', 'IRR', 'Terminal value']) {
      expect(items).toContain(must);
    }
    // every former gap is now built into the tool (the tab-11 workbench)
    const formerGaps = GAP_CHECK.filter((g) => /PPA|impairment|LBO|Cost approach|Accretion|precedent/i.test(g.item));
    expect(formerGaps.length).toBeGreaterThanOrEqual(6);
    for (const g of formerGaps) {
      expect(g.status).toBe('covered');
      expect(g.where).toMatch(/Tab 10/);
    }
    expect(GAP_CHECK.filter((g) => g.status === 'gap')).toHaveLength(0);
  });

  it('carries the outlook anchor numbers and the interview format', () => {
    const outlook = EY_OUTLOOK.join(' ');
    expect(outlook).toContain('3.4%');
    expect(outlook).toContain('2.9%');
    expect(outlook).toContain('3.2%');
    expect(outlook).toMatch(/tariff/i);
    expect(outlook).toMatch(/AI/);
    expect(INTERVIEW_FORMAT.join(' ')).toMatch(/HireVue|behavioral/i);
    expect(INTERVIEW_FORMAT.join(' ')).toMatch(/STAR/);
  });
});

describe('the drill', () => {
  it('covers all three categories with real model answers', () => {
    const byCat = (c: string) => DRILL_CARDS.filter((d) => d.category === c);
    expect(byCat('technical').length).toBeGreaterThanOrEqual(10);
    expect(byCat('behavioral').length).toBeGreaterThanOrEqual(5);
    expect(byCat('market').length).toBeGreaterThanOrEqual(3);
    for (const d of DRILL_CARDS) {
      expect(d.q.length).toBeGreaterThan(10);
      expect(d.a.length).toBeGreaterThan(150);
    }
  });

  it('has no duplicate ids and includes the classic questions', () => {
    const ids = DRILL_CARDS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    const qs = DRILL_CARDS.map((d) => d.q).join(' ');
    expect(qs).toMatch(/Walk me through a DCF/i);
    expect(qs).toMatch(/Depreciation/);
    expect(qs).toMatch(/Enterprise value vs. equity value/i);
    expect(qs).toMatch(/accretive/i);
  });

  it('the market answer uses the EY outlook numbers', () => {
    const m = DRILL_CARDS.find((d) => d.id === 'market-trend')!;
    expect(m.a).toContain('3.4%');
    expect(m.a).toContain('2.9%');
  });
});

describe('the round map', () => {
  it('lists the behavioral staples and a full 48-hour plan', () => {
    expect(BEHAVIORAL_STAPLES.length).toBeGreaterThanOrEqual(8);
    expect(BEHAVIORAL_STAPLES.join(' ')).toMatch(/Why EY/);
    expect(TAKE_HOME_PLAN.length).toBeGreaterThanOrEqual(7);
    expect(TAKE_HOME_PLAN.join(' ')).toMatch(/sensitivity/i);
    expect(TAKE_HOME_PLAN.join(' ')).toMatch(/WACC/);
    for (const s of TAKE_HOME_PLAN) expect(s.length).toBeGreaterThan(50);
  });
});
