import { describe, expect, it } from 'vitest';
import {
  COUNTRY_INDUSTRY,
  CROSS_LENS_SOURCE,
  STATE_INDUSTRY,
  STATE_COUNTRY,
  countryAcrossStates,
  countryIndustryCell,
  industryAcrossCountries,
  industryAcrossStates,
  pairPresence,
  pairsForCountry,
  pairsForState,
  stateAcrossCountries,
  stateCountryRead,
  stateIndustryCell,
  triangleRead,
} from '../lib/crossLens';
import { REPORT_COUNTRIES, REPORT_INDUSTRIES, REPORT_STATES } from '../lib/reportBuilder';

const PRESENCES = new Set(['anchor', 'significant', 'minor']);

describe('the cross-lens matrices are COMPLETE', () => {
  it('state × industry covers every state and every industry with a rated, written cell', () => {
    expect(Object.keys(STATE_INDUSTRY).sort()).toEqual(REPORT_STATES.map((s) => s.id).sort());
    for (const st of REPORT_STATES) {
      for (const ind of REPORT_INDUSTRIES) {
        const cell = STATE_INDUSTRY[st.id][ind.id];
        expect(cell, `${st.id}×${ind.id}`).toBeDefined();
        expect(PRESENCES.has(cell.presence)).toBe(true);
        expect(cell.note.length, `${st.id}×${ind.id}`).toBeGreaterThan(30);
      }
    }
  });

  it('country × industry covers all seventeen countries × eight industries', () => {
    expect(Object.keys(COUNTRY_INDUSTRY).sort()).toEqual(REPORT_COUNTRIES.map((c) => c.id).sort());
    for (const co of REPORT_COUNTRIES) {
      for (const ind of REPORT_INDUSTRIES) {
        const cell = COUNTRY_INDUSTRY[co.id][ind.id];
        expect(cell, `${co.id}×${ind.id}`).toBeDefined();
        expect(PRESENCES.has(cell.presence)).toBe(true);
        expect(cell.note.length, `${co.id}×${ind.id}`).toBeGreaterThan(25);
      }
    }
  });

  it('the teaching anchors land where they should', () => {
    expect(stateIndustryCell('ca', 'tech').presence).toBe('anchor');
    expect(stateIndustryCell('tx', 'energy').presence).toBe('anchor');
    expect(stateIndustryCell('ny', 'financials').presence).toBe('anchor');
    expect(stateIndustryCell('wa', 'industrials').note).toMatch(/Boeing/);
    expect(stateIndustryCell('ga', 'staples').note).toMatch(/poultry/i);
    expect(countryIndustryCell('taiwan', 'tech').presence).toBe('anchor');
    expect(countryIndustryCell('saudi', 'energy').presence).toBe('anchor');
    expect(countryIndustryCell('germany', 'discretionary').note).toMatch(/auto/i);
    expect(countryIndustryCell('brazil', 'staples').presence).toBe('anchor');
    expect(countryIndustryCell('russia', 'industrials').note).toMatch(/war economy/i);
    // honest minors exist — the matrix is not all praise
    expect(countryIndustryCell('venezuela', 'tech').presence).toBe('minor');
    expect(stateIndustryCell('fl', 'tech').presence).toBe('minor');
  });

  it('comparison strips cover the full lens lists; unknown ids fall back honestly', () => {
    expect(industryAcrossStates('tech')).toHaveLength(REPORT_STATES.length);
    expect(industryAcrossCountries('energy')).toHaveLength(REPORT_COUNTRIES.length);
    expect(stateIndustryCell('zz', 'tech').note).toMatch(/No cell authored/);
    expect(CROSS_LENS_SOURCE).toMatch(/APPROXIMATE TEACHING CHARACTERIZATIONS/);
  });
});

describe('state × country pairs and the three-way triangle', () => {
  it('every state has three authored country pairs with valid ids and real stories', () => {
    expect(Object.keys(STATE_COUNTRY).sort()).toEqual(REPORT_STATES.map((s) => s.id).sort());
    const countryIds = new Set(REPORT_COUNTRIES.map((c) => c.id));
    for (const [st, row] of Object.entries(STATE_COUNTRY)) {
      expect(Object.keys(row).length, st).toBeGreaterThanOrEqual(3);
      for (const [co, text] of Object.entries(row)) {
        expect(countryIds.has(co), `${st}×${co}`).toBe(true);
        expect(text.length).toBeGreaterThan(60);
      }
    }
    expect(STATE_COUNTRY.ga.skorea).toMatch(/Hyundai/);
    expect(STATE_COUNTRY.tx.saudi).toMatch(/Motiva/);
    expect(STATE_COUNTRY.il.china).toMatch(/soy/i);
    expect(STATE_COUNTRY.wa.china).toMatch(/Boeing/);
  });

  it('unauthored pairs get an honest computed fallback joining both sides', () => {
    const r = stateCountryRead('oh', 'brazil', 'Ohio', 'Brazil');
    expect(r.authored).toBe(false);
    expect(r.text).toMatch(/No authored pair cell/);
    expect(r.text).toMatch(/Ohio/);
    expect(r.text).toMatch(/Brazil/);
    const g = stateCountryRead('ga', 'skorea', 'Georgia', 'South Korea');
    expect(g.authored).toBe(true);
  });

  it('the triangle composes deterministically across presence combinations', () => {
    // anchor + anchor: GA industrials × Korea industrials (Hyundai/SK)
    const strong = triangleRead('ga', 'skorea', 'industrials', 'Georgia', 'South Korea', 'Industrials');
    expect(strong.stateCell.presence).toBe('anchor');
    expect(strong.countryCell.presence).toBe('anchor');
    expect(strong.verdict).toMatch(/ANCHOR on both sides/);
    // minor + minor: FL tech × Venezuela tech
    const thin = triangleRead('fl', 'venezuela', 'tech', 'Florida', 'Venezuela', 'Technology');
    expect(thin.verdict).toMatch(/minor on BOTH sides/);
    // asymmetric: NY financials (anchor) × Iran financials (minor)
    const asym = triangleRead('ny', 'iran', 'financials', 'New York', 'Iran', 'Financials');
    expect(asym.verdict.length).toBeGreaterThan(50);
  });
});

describe('reverse views — every direction between the lens types', () => {
  it('a country maps across the ten states, with the flagship pairs rated anchor', () => {
    expect(countryAcrossStates('skorea')).toHaveLength(REPORT_STATES.length);
    expect(pairPresence('ga', 'skorea')).toBe('anchor');
    expect(pairPresence('tx', 'mexico')).toBe('anchor');
    expect(pairPresence('oh', 'japan')).toBe('anchor');
    // authored but not flagship = significant; unauthored = minor
    expect(pairPresence('ca', 'japan')).toBe('significant');
    expect(pairPresence('oh', 'brazil')).toBe('minor');
  });

  it('a state maps across the seventeen countries; pair lists resolve both directions', () => {
    expect(stateAcrossCountries('tx')).toHaveLength(REPORT_COUNTRIES.length);
    const chinaStates = pairsForCountry('china').map((p) => p.stateId).sort();
    expect(chinaStates.length).toBeGreaterThanOrEqual(5); // ca, tx, ny, il, pa, oh?, ga, nj, wa
    expect(chinaStates).toContain('ca');
    expect(chinaStates).toContain('il');
    const gaPairs = pairsForState('ga');
    expect(gaPairs[0].countryId).toBe('skorea'); // anchors sort first
    expect(pairsForCountry('venezuela').map((p) => p.stateId)).toEqual(['fl']);
  });
});
