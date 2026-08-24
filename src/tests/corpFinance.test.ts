import { describe, expect, it } from 'vitest';
import { MacroFactors, SCENARIOS } from '../lib/macroModel';
import {
  CAPITAL_OPTIONS,
  DEFAULT_WACC_INPUTS,
  SAMPLE_CUSTOMERS,
  TREASURY_INSTRUMENTS,
  assessCredit,
  computeCreditMetrics,
  computeWacc,
  creditScore,
  evaluateAllOptions,
  optionNpv,
} from '../lib/corpFinance';

const NEUTRAL: MacroFactors = { growth: 0, inflation: 0, policy: 0, fiscal: 0 };

function scenario(id: string): MacroFactors {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`missing scenario ${id}`);
  return s.factors;
}

function sample(id: string) {
  const c = SAMPLE_CUSTOMERS.find((x) => x.id === id);
  if (!c) throw new Error(`missing sample ${id}`);
  return c.fin;
}

describe('WACC', () => {
  it('computes the textbook default: CAPM equity, after-tax debt, 70/30 blend', () => {
    const w = computeWacc(DEFAULT_WACC_INPUTS);
    expect(w.costEquity).toBe(10.1); // 4 + 1.1 × 5.5
    expect(w.costDebtPreTax).toBe(7); // 4 + 3
    expect(w.costDebtAfterTax).toBe(5.3); // 7 × (1 − 0.25)
    expect(w.wacc).toBe(8.6); // 0.7 × 10.05 + 0.3 × 5.25
  });

  it('higher rates raise the whole stack', () => {
    const low = computeWacc({ riskFree: 3, beta: 1.1, creditSpread: 3 });
    const high = computeWacc({ riskFree: 5, beta: 1.1, creditSpread: 3 });
    expect(high.costEquity).toBeGreaterThan(low.costEquity);
    expect(high.wacc).toBeGreaterThan(low.wacc);
  });
});

describe('capital allocation', () => {
  it('NPV is positive exactly when the return beats the hurdle', () => {
    expect(optionNpv(1_000_000, 12, 9, 5)).toBeGreaterThan(0);
    expect(optionNpv(1_000_000, 7, 9, 5)).toBeLessThan(0);
    expect(optionNpv(1_000_000, 9, 9, 5)).toBe(0);
  });

  it('spread sign always matches NPV sign', () => {
    for (const f of [NEUTRAL, scenario('overheating'), scenario('recession'), scenario('stagflation')]) {
      for (const r of evaluateAllOptions(DEFAULT_WACC_INPUTS, f, 1_000_000)) {
        if (r.spread > 0) expect(r.npv).toBeGreaterThan(0);
        if (r.spread < 0) expect(r.npv).toBeLessThan(0);
      }
    }
  });

  it('recession: M&A gets attractive (cheap targets + cheap money)', () => {
    const rows = evaluateAllOptions(DEFAULT_WACC_INPUTS, scenario('recession'), 1_000_000);
    const ma = rows.find((r) => r.id === 'ma')!;
    expect(ma.verdict).toBe('go');
    expect(rows[0].id).toBe('ma'); // best spread of all options
  });

  it('overheating: the long-duration AI acquisition fails its hurdle', () => {
    const rows = evaluateAllOptions(DEFAULT_WACC_INPUTS, scenario('overheating'), 1_000_000);
    expect(rows.find((r) => r.id === 'ai')!.verdict).toBe('no');
    // ...while paying down debt gets MORE attractive as rates rise
    expect(rows.find((r) => r.id === 'paydebt')!.verdict).toBe('go');
  });

  it('covers every option and sorts best-first', () => {
    const rows = evaluateAllOptions(DEFAULT_WACC_INPUTS, NEUTRAL, 500_000);
    expect(rows).toHaveLength(CAPITAL_OPTIONS.length);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].spread).toBeGreaterThanOrEqual(rows[i].spread);
  });
});

describe('trade-credit underwriting', () => {
  it('computes the classic ratios correctly for the average sample', () => {
    const m = computeCreditMetrics(sample('average'));
    const by = (id: string) => m.find((x) => x.id === id)!;
    expect(by('coverage').value).toBeCloseTo(1_200_000 / 350_000, 2);
    expect(by('leverage').value).toBeCloseTo(3_500_000 / 1_200_000, 2);
    expect(by('current').value).toBeCloseTo(1.5, 2);
    expect(by('dso').value).toBeCloseTo((1_800_000 / 10_000_000) * 365, 1);
    // CCC = DSO + DIO − DPO
    const dio = (1_600_000 / 7_000_000) * 365;
    const dpo = (1_400_000 / 7_000_000) * 365;
    expect(by('ccc').value).toBeCloseTo(by('dso').value + dio - dpo, 1);
  });

  it('strong customer: approves the full $1M request', () => {
    const res = assessCredit(1_000_000, 30, sample('strong'));
    expect(res.score).toBeGreaterThanOrEqual(70);
    expect(res.decision).toBe('approve');
    expect(res.limit).toBe(1_000_000);
  });

  it('average customer: conditional approval, well under the request', () => {
    const res = assessCredit(1_000_000, 30, sample('average'));
    expect(res.decision).toBe('conditional');
    expect(res.limit).toBeGreaterThan(0);
    expect(res.limit).toBeLessThan(500_000);
  });

  it('risky customer: declined with prepay guidance', () => {
    const res = assessCredit(1_000_000, 30, sample('risky'));
    expect(res.decision).toBe('decline');
    expect(res.limit).toBe(0);
    expect(res.reasons.join(' ')).toMatch(/prepay|COD/i);
  });

  it('longer terms shrink the recommended limit', () => {
    const net30 = assessCredit(1_000_000, 30, sample('average'));
    const net90 = assessCredit(1_000_000, 90, sample('average'));
    expect(net90.limit).toBeLessThanOrEqual(net30.limit);
    expect(net90.termsFactor).toBeLessThan(net30.termsFactor);
  });

  it('zero/negative EBITDA never crashes and reads as risk', () => {
    const broke = { ...sample('risky'), ebitda: -100_000 };
    const m = computeCreditMetrics(broke);
    expect(m.find((x) => x.id === 'leverage')!.band).toBe('risk');
    expect(creditScore(m)).toBeLessThan(45);
    expect(assessCredit(1_000_000, 30, broke).decision).toBe('decline');
  });
});

describe('treasury playbook', () => {
  const fitOf = (id: string, f: MacroFactors) =>
    TREASURY_INSTRUMENTS.find((i) => i.id === id)!.fit(f);

  it('tightening cycle: pay-fixed swap fits, locking yields does not', () => {
    const f = scenario('overheating');
    expect(fitOf('payfixed', f).level).toBe('fit');
    expect(fitOf('ladder', f).level).toBe('avoid');
    expect(fitOf('commodity', f).level).toBe('fit'); // inflation running
  });

  it('easing cycle: lock yields, do not pay fixed', () => {
    const f = scenario('recession');
    expect(fitOf('ladder', f).level).toBe('fit');
    expect(fitOf('payfixed', f).level).toBe('avoid');
    expect(fitOf('commodity', f).level).toBe('avoid'); // input prices falling
  });

  it('high-uncertainty scenarios point to options', () => {
    expect(fitOf('options', scenario('stagflation')).level).toBe('fit');
    expect(fitOf('options', NEUTRAL).level).toBe('neutral');
  });

  it('every instrument always returns a fit with a reason', () => {
    for (const f of [NEUTRAL, scenario('goldilocks'), scenario('supply-shock')]) {
      for (const i of TREASURY_INSTRUMENTS) {
        const fit = i.fit(f);
        expect(['fit', 'neutral', 'avoid']).toContain(fit.level);
        expect(fit.reason.length).toBeGreaterThan(20);
      }
    }
  });
});
