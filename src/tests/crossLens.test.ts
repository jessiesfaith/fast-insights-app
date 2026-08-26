import { describe, expect, it } from 'vitest';
import {
  COUNTRY_INDUSTRY,
  CROSS_LENS_SOURCE,
  STATE_INDUSTRY,
  countryIndustryCell,
  industryAcrossCountries,
  industryAcrossStates,
  stateIndustryCell,
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
