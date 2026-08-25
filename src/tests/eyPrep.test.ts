import { describe, expect, it } from 'vitest';
import {
  BEHAVIORAL_STAPLES,
  EY_EXHIBITS,
  EY_MARKET_ROUTINE,
  EY_ROUTINE_EXPECTATION,
  EY_STANDARD_ANALYSES,
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

describe("EY's standard analyses, exhibits, and routine (tab 7, steps D–E)", () => {
  it('ranks the analyses with the valuation triad and PPA in the core tier, every row mapped to the Lab', () => {
    expect(EY_STANDARD_ANALYSES.length).toBeGreaterThanOrEqual(14);
    const core = EY_STANDARD_ANALYSES.filter((a) => a.tier === 'core').map((a) => a.name).join(' ');
    expect(core).toMatch(/DCF/);
    expect(core).toMatch(/comps/i);
    expect(core).toMatch(/Precedent/i);
    expect(core).toMatch(/Purchase price allocation/i);
    expect(core).toMatch(/Quality of Earnings/i);
    for (const a of EY_STANDARD_ANALYSES) {
      expect(a.what.length).toBeGreaterThan(30);
      expect(a.lab.length).toBeGreaterThan(20);
    }
    // the honest ranking: LBO is peripheral for EY specifically
    expect(EY_STANDARD_ANALYSES.find((a) => a.name.includes('LBO'))!.tier).toBe('peripheral');
    // the headline practitioner finding survives in the data
    expect(EY_STANDARD_ANALYSES.map((a) => a.what).join(' ')).toMatch(/~50% of a junior/i);
  });

  it('the exhibit list leads with the two-way sensitivity table and includes the football field and EY house bars+line', () => {
    expect(EY_EXHIBITS.length).toBeGreaterThanOrEqual(7);
    expect(EY_EXHIBITS[0].name).toMatch(/Two-way sensitivity/i);
    const names = EY_EXHIBITS.map((e) => e.name).join(' ');
    expect(names).toMatch(/Football field/i);
    expect(names).toMatch(/waterfall/i);
    expect(names).toMatch(/Bars \+ line/i);
    for (const e of EY_EXHIBITS) expect(e.lab.length).toBeGreaterThan(20);
    // the two-way grid maps to where the Lab actually renders it
    expect(EY_EXHIBITS[0].lab).toMatch(/Tab 5/);
  });

  it('the market routine spans daily through annual at EY cadence, with the verbatim posting expectation', () => {
    const cadences = EY_MARKET_ROUTINE.map((r) => r.cadence).join(' ');
    for (const c of ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual']) expect(cadences).toContain(c);
    const all = EY_MARKET_ROUTINE.map((r) => `${r.what} ${r.labTie}`).join(' ');
    expect(all).toMatch(/IPO Trends/);
    expect(all).toMatch(/Deal Barometer/);
    expect(all).toMatch(/Valuation Market Essentials/);
    expect(all).toMatch(/Damodaran/);
    expect(all).toMatch(/CPE/);
    expect(EY_ROUTINE_EXPECTATION).toMatch(/staying abreast of current business and economic developments/);
    for (const r of EY_MARKET_ROUTINE) expect(r.labTie).toMatch(/[Tt]abs? \d+/);
  });
});
