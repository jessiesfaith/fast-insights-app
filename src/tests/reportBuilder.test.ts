import { describe, expect, it } from 'vitest';
import {
  COUNTRY_CURRENCY,
  INDUSTRY_BENCHMARK_MAP,
  INDUSTRY_IPO_MAP,
  INDUSTRY_SUBS_MAP,
  REPORT_COUNTRIES,
  REPORT_COVERAGE,
  REPORT_FORMULAS,
  REPORT_HOW_TO_READ,
  REPORT_INDUSTRIES,
  REPORT_STATES,
  combinedRead,
  countryReport,
  industryReport,
  refText,
  stateReport,
} from '../lib/reportBuilder';
import { COUNTRY_DEBT, STATE_DEBT } from '../lib/debtGeo';
import { INDUSTRIES } from '../lib/macroModel';
import { MARKET_SNAPSHOT } from '../lib/marketSnapshot';

const F = MARKET_SNAPSHOT.factors;
const RF = 4;

describe('report selectors', () => {
  it('cover the same top-10 lists as tab 15 (plus South Korea) and the eight industries', () => {
    expect(REPORT_COUNTRIES.map((c) => c.id)).toEqual([...COUNTRY_DEBT.map((c) => c.id), 'skorea']);
    expect(REPORT_STATES.map((s) => s.id)).toEqual(STATE_DEBT.map((s) => s.id));
    expect(REPORT_INDUSTRIES.map((i) => i.id)).toEqual(INDUSTRIES.map((i) => i.id));
    // every country has a currency mapping entry (null allowed only for the US)
    for (const c of REPORT_COUNTRIES) expect(COUNTRY_CURRENCY).toHaveProperty(c.id);
    expect(COUNTRY_CURRENCY.us).toBeNull();
    expect(COUNTRY_CURRENCY.skorea).toBe('krw');
  });
});

describe('countryReport', () => {
  it('assembles every section for a top-10 country, each with a tab-15 reference', () => {
    const r = countryReport('japan');
    expect(r.name).toBe('Japan');
    expect(r.debt!.row.trend).toHaveLength(4);
    expect(r.debt!.ref.tab).toBe(15);
    expect(r.trade!.balanceB).toBe(r.trade!.row.exportsB - r.trade!.row.importsB);
    expect(r.currency!.row.id).toBe('jpy');
    expect(r.populism!.row.country).toBe('Japan');
    expect(r.impactWatch!.row.id).toBe('japan');
    expect(r.caseStudy).toBeNull();
    for (const sec of [r.debt!, r.trade!, r.currency!, r.populism!, r.impactWatch!]) {
      expect(sec.how.length).toBeGreaterThan(40);
      expect(refText(sec.ref)).toMatch(/^Tab 15 · step [A-J] — /);
    }
  });

  it('South Korea carries the trade row, the won, and the full case study', () => {
    const r = countryReport('skorea');
    expect(r.debt).toBeNull(); // not in the top-10 debt list — honest absence
    expect(r.trade!.balanceB).toBeGreaterThan(0);
    expect(r.currency!.row.id).toBe('krw');
    expect(r.caseStudy).not.toBeNull();
    expect(r.caseStudy!.chain.length).toBeGreaterThanOrEqual(5);
  });

  it('the US gets the reserve-currency note instead of a currency line', () => {
    const r = countryReport('us');
    expect(r.currency).toBeNull();
    expect(r.currencyNote).toMatch(/reserve-currency/i);
    expect(r.trade!.balanceB).toBeLessThan(0);
    expect(r.calendar.events.length).toBeGreaterThanOrEqual(2); // midterms + presidential
  });
});

describe('stateReport', () => {
  it('ranks the state among the ten and carries the pension layer and watch rows', () => {
    const ca = stateReport('ca');
    expect(ca.name).toBe('California');
    expect(ca.debt.row.debtGspPct).toBe(7);
    expect(ca.impactWatch!.row.id).toBe('ca');
    expect(ca.debt.how).toMatch(/pension/i);
    const ny = stateReport('ny');
    expect(ny.debt.rankAmongTen).toBe(1); // highest bonded ratio
    const ga = stateReport('ga');
    expect(ga.debt.rankAmongTen).toBe(10); // the benchmark
  });
});

describe('industryReport', () => {
  it('assembles backdrop, advice, benchmarks, IPO window, and sub-lenses with refs to tabs 3/4/13/14', () => {
    const r = industryReport('tech', RF, F);
    expect(r.name).toMatch(/Tech/i);
    expect(['tailwind', 'neutral', 'headwind']).toContain(r.backdrop.read.level);
    expect(r.advice.result.wacc.wacc).toBeGreaterThan(RF);
    expect(r.advice.ref.tab).toBe(4);
    expect(r.benchmarks.rows.map((b) => b.id)).toEqual(['software']);
    expect(r.ipo!.row.id).toBe('tech');
    expect(r.ipo!.ref.tab).toBe(13);
    expect(r.subs.reads.map((s) => s.target.id)).toContain('ai-semis');
    for (const s of r.subs.reads) expect(Number.isFinite(s.nowPct)).toBe(true);
  });

  it('healthcare maps to biotech+pharma benchmarks and the biotech IPO line; utilities honestly map to none', () => {
    const hc = industryReport('healthcare', RF, F);
    expect(hc.benchmarks.rows.map((b) => b.id).sort()).toEqual(['biotech', 'pharma']);
    expect(hc.ipo!.row.id).toBe('biotech');
    const ut = industryReport('utilities', RF, F);
    expect(ut.benchmarks.rows).toHaveLength(0);
    expect(ut.ipo).toBeNull();
    expect(ut.subs.reads).toHaveLength(0);
  });

  it('the maps cover every industry id', () => {
    for (const i of INDUSTRIES) {
      expect(INDUSTRY_BENCHMARK_MAP).toHaveProperty(i.id);
      expect(INDUSTRY_IPO_MAP).toHaveProperty(i.id);
      expect(INDUSTRY_SUBS_MAP).toHaveProperty(i.id);
    }
  });
});

describe('the combined read, formulas, and instructions', () => {
  it('California × tech joins both layers deterministically', () => {
    const text = combinedRead('ca', 'tech', RF, F);
    expect(text).toMatch(/California × Tech/i);
    expect(text).toMatch(/7% bonded debt/);
    expect(text).toMatch(/WACC \d+\.\d%/);
    expect(text).toMatch(/CalPERS/);
  });

  it('formulas carry the core math with refs into the source tabs', () => {
    expect(REPORT_FORMULAS.length).toBeGreaterThanOrEqual(8);
    const all = REPORT_FORMULAS.map((f) => `${f.name} ${f.formula}`).join(' ');
    expect(all).toMatch(/Σ \(sensitivity × dial\)/);
    expect(all).toMatch(/WACC = E\/V/);
    expect(all).toMatch(/ROIC/);
    expect(all).toMatch(/exports − imports/);
    for (const f of REPORT_FORMULAS) {
      expect(f.ref.tab).toBeGreaterThanOrEqual(1);
      expect(f.ref.tab).toBeLessThanOrEqual(18);
      expect(f.how.length).toBeGreaterThan(30);
    }
  });

  it('the how-to-read instructions cover filters, references, dials, and honesty labels', () => {
    expect(REPORT_HOW_TO_READ.length).toBeGreaterThanOrEqual(6);
    const all = REPORT_HOW_TO_READ.join(' ');
    expect(all).toMatch(/reference/i);
    expect(all).toMatch(/dial/i);
    expect(all).toMatch(/honesty|approximate/i);
    expect(all).toMatch(/do NOT move with the dials/i);
  });
});

describe('the coverage index — every tab and section accounted for', () => {
  it('covers all 19 tabs in order with real section lists and a usage line each', () => {
    expect(REPORT_COVERAGE).toHaveLength(19);
    expect(REPORT_COVERAGE.map((c) => c.tab)).toEqual(Array.from({ length: 19 }, (_, i) => i + 1));
    for (const c of REPORT_COVERAGE) {
      expect(c.name.length).toBeGreaterThan(5);
      expect(c.sections.length).toBeGreaterThanOrEqual(1);
      expect(c.inReport.length).toBeGreaterThan(60);
    }
  });

  it('matches the audited section counts on the big tabs', () => {
    const by = (tab: number) => REPORT_COVERAGE.find((c) => c.tab === tab)!;
    expect(by(15).sections).toHaveLength(10); // A–J
    expect(by(11).sections).toHaveLength(8); // A–H incl. the debt build-up
    expect(by(10).sections).toHaveLength(9); // A–I calculators
    expect(by(16).sections).toHaveLength(7); // inputs + six stages
    expect(by(3).sections).toHaveLength(8); // A–H
    expect(by(4).sections.join(' ')).toMatch(/What to do with capital/);
  });

  it('the industry advice ref points where the adviser actually renders (tab 4 step F)', () => {
    const r = industryReport('tech', 4, { growth: 0, inflation: 0, policy: 0, fiscal: 0 });
    expect(r.advice.ref).toMatchObject({ tab: 4, step: 'F' });
  });
});
