import { describe, expect, it } from 'vitest';
import {
  BANK_METRICS_NOTE,
  DAMODARAN_JAN2026,
  DEFAULT_RETAIL_INPUTS,
  DEFAULT_RUNWAY_INPUTS,
  INDUSTRY_HEALTH_QUESTIONS,
  OBSERVED_NOT_HEALTHY_RULE,
  biotechRunway,
  compareToBenchmark,
  retailKit,
  rule40,
} from '../lib/industryBenchmarks';

describe('the observed benchmarks (Damodaran Jan-2026, as cited)', () => {
  it('matches the cited values exactly', () => {
    const by = (id: string) => DAMODARAN_JAN2026.find((b) => b.id === id)!;
    expect(by('biotech').debtEbitda).toBe(6.2);
    expect(by('biotech').interestCoverage).toBe(1.88);
    expect(by('biotech').afterTaxOperMarginPct).toBe(8.86);
    expect(by('biotech').rocPct).toBe(7.26);
    expect(by('pharma').debtEbitda).toBe(2.43);
    expect(by('pharma').interestCoverage).toBe(10.49);
    expect(by('software').rocPct).toBe(50.17);
    expect(by('restaurants').rocPct).toBe(18.94);
    expect(by('grocery').afterTaxOperMarginPct).toBe(1.5);
  });

  it('enforces the observed ≠ healthy rule and the §123 questions', () => {
    expect(OBSERVED_NOT_HEALTHY_RULE).toMatch(/NOT healthy-range cutoffs/i);
    expect(INDUSTRY_HEALTH_QUESTIONS.length).toBeGreaterThanOrEqual(6);
    expect(INDUSTRY_HEALTH_QUESTIONS.join(' ')).toMatch(/lifecycle stage/i);
  });

  it('comparisons carry the benchmark-type label and direction-aware reads', () => {
    const c = compareToBenchmark({ debtEbitda: 3.5, interestCoverage: 5, afterTaxOperMarginPct: 20, rocPct: 15 }, 'pharma');
    expect(c.benchmarkType).toBe('OBSERVED_INDUSTRY_AVERAGE');
    const lev = c.rows.find((r) => r.metric === 'Debt / EBITDA')!;
    expect(lev.read).toMatch(/MORE levered/);
    const cov = c.rows.find((r) => r.metric === 'Interest coverage')!;
    expect(cov.read).toMatch(/Thinner/);
    // industries with no cited leverage skip those rows instead of inventing them
    const grocery = compareToBenchmark({ debtEbitda: 3.5, interestCoverage: 5, afterTaxOperMarginPct: 2, rocPct: 7 }, 'grocery');
    expect(grocery.rows.map((r) => r.metric)).not.toContain('Debt / EBITDA');
  });
});

describe('the vertical quick kits', () => {
  it('biotech runway: 48 ÷ 2 = 24 months (strong), catalyst coverage = runway − catalyst', () => {
    const r = biotechRunway(DEFAULT_RUNWAY_INPUTS);
    expect(r.runwayMonths).toBe(24);
    expect(r.band).toBe('strong');
    expect(r.bandLabel).toMatch(/INTERNAL ANALYTICAL HEURISTIC/);
    expect(r.catalystCoverageMonths).toBe(6);
    expect(r.read).toMatch(/cushion/);
  });

  it('runway bands follow the heuristic ladder, and missing the catalyst changes the read', () => {
    expect(biotechRunway({ cash: 10, marketableSecurities: 0, monthlyBurn: 2, monthsToNextCatalyst: 12 }).band).toBe('critical');
    const miss = biotechRunway({ cash: 20, marketableSecurities: 0, monthlyBurn: 2, monthsToNextCatalyst: 14 });
    expect(miss.catalystCoverageMonths).toBeLessThan(0);
    expect(miss.read).toMatch(/do NOT reach/i);
  });

  it('Rule of 40 = growth + FCF margin, with the measure named', () => {
    expect(rule40({ revenueGrowthPct: 28, fcfMarginPct: 8 }).score).toBe(36);
    expect(rule40({ revenueGrowthPct: 28, fcfMarginPct: 8 }).passes).toBe(false);
    const pass = rule40({ revenueGrowthPct: 35, fcfMarginPct: 10 });
    expect(pass.passes).toBe(true);
    expect(pass.read).toMatch(/FCF margin/);
  });

  it('retail kit: turnover, GMROI, and the inventory-growth-gap warning', () => {
    const r = retailKit(DEFAULT_RETAIL_INPUTS);
    expect(r.inventoryTurnover).toBeCloseTo(7_000_000 / 1_600_000, 1);
    expect(r.gmroi).toBeCloseTo(3_000_000 / 1_600_000, 1);
    expect(r.inventoryGrowthGapPct).toBe(8);
    expect(r.read).toMatch(/markdown/i);
    const quiet = retailKit({ ...DEFAULT_RETAIL_INPUTS, inventoryGrowthPct: 7 });
    expect(quiet.read).toMatch(/quiet/i);
  });

  it('the bank rule: Debt/EBITDA is the wrong metric family', () => {
    expect(BANK_METRICS_NOTE).toMatch(/do NOT use Debt\/EBITDA/i);
    expect(BANK_METRICS_NOTE).toMatch(/CET1/);
    expect(BANK_METRICS_NOTE).toMatch(/regulatory classifications, not peer averages/i);
  });
});
