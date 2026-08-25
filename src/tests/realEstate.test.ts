import { describe, expect, it } from 'vitest';
import {
  CRE_BENCHMARKS,
  DEFAULT_CRE_INPUTS,
  DEFAULT_PAYMENT_INPUTS,
  RE_DECISION_READS,
  capRateSensitivity,
  creKpis,
  creRateStress,
  housingPaymentRatioPct,
  monthlyPayment,
  mortgageBenchmark,
  paymentSensitivity,
} from '../lib/realEstate';

describe('the residential benchmark', () => {
  it('mortgage = 10Y + spread, with the cited numbers: 6.65% vs 4.69% = 196bp, labeled a simple spread', () => {
    const b = mortgageBenchmark();
    expect(b.mortgagePct).toBe(6.65);
    expect(b.ust10Pct).toBe(4.69);
    expect(b.spreadBp).toBe(196);
    expect(b.note).toMatch(/SIMPLE OBSERVED/);
    expect(b.note).toMatch(/NOT an MBS option-adjusted spread/i);
  });
});

describe('the payment math (deterministic)', () => {
  it('hand-checks the amortizing formula: $400k at 6.65%/30yr ≈ $2,568/mo', () => {
    const p = monthlyPayment(DEFAULT_PAYMENT_INPUTS);
    // independent check: P·r(1+r)^n/((1+r)^n−1)
    const r = 6.65 / 100 / 12;
    const n = 360;
    const f = Math.pow(1 + r, n);
    expect(p).toBeCloseTo((400_000 * r * f) / (f - 1), 1);
    expect(p).toBeGreaterThan(2500);
    expect(p).toBeLessThan(2650);
  });

  it('sensitivity spans −200bp…+200bp and is monotonic in the rate', () => {
    const rows = paymentSensitivity(DEFAULT_PAYMENT_INPUTS);
    expect(rows).toHaveLength(5);
    for (let i = 1; i < rows.length; i++) expect(rows[i].payment).toBeGreaterThan(rows[i - 1].payment);
    // the base row is delta zero
    expect(rows[2].delta).toBe(0);
    // ~100bp on $400k is roughly $260/month
    expect(Math.abs(rows[3].delta)).toBeGreaterThan(200);
    expect(Math.abs(rows[3].delta)).toBeLessThan(320);
  });

  it('zero-rate edge: payment degrades to straight principal ÷ months', () => {
    expect(monthlyPayment({ principal: 360_000, ratePct: 0, years: 30 })).toBe(1000);
  });

  it('affordability ratio computes and survives zero income', () => {
    expect(housingPaymentRatioPct({ monthlyPI: 2568, monthlyTaxesInsHoa: 432, grossMonthlyIncome: 10_000 })).toBe(30);
    expect(housingPaymentRatioPct({ monthlyPI: 2568, monthlyTaxesInsHoa: 432, grossMonthlyIncome: 0 })).toBe(0);
  });
});

describe('the CRE dashboard (deterministic)', () => {
  it('computes the four lender numbers from the defaults', () => {
    const k = creKpis(DEFAULT_CRE_INPUTS);
    expect(k.capRatePct).toBe(6.25); // 1M / 16M
    expect(k.ltvPct).toBe(62.5); // 10M / 16M
    expect(k.debtYieldPct).toBe(10); // 1M / 10M
    expect(k.dscr).toBeGreaterThan(1);
    expect(k.dscr).toBeLessThan(1.5);
  });

  it('interest-only mode: debt service = loan × rate', () => {
    const k = creKpis({ ...DEFAULT_CRE_INPUTS, amortYears: 0 });
    expect(k.annualDebtService).toBe(650_000); // 10M × 6.5%
    expect(k.dscr).toBeCloseTo(1_000_000 / 650_000, 2);
  });

  it('the mandatory stress: +100/200/300bp, DSCR strictly falling', () => {
    const rows = creRateStress(DEFAULT_CRE_INPUTS);
    expect(rows).toHaveLength(4);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].dscr).toBeLessThan(rows[i - 1].dscr);
      expect(rows[i].annualDebtService).toBeGreaterThan(rows[i - 1].annualDebtService);
    }
  });

  it('cap-rate sensitivity reproduces the spec example: $1M NOI = $20M at 5%, $16.67M at 6%', () => {
    const rows = capRateSensitivity(1_000_000);
    expect(rows.find((r) => r.capRatePct === 5)!.value).toBe(20_000_000);
    expect(rows.find((r) => r.capRatePct === 6)!.value).toBe(16_666_667);
  });

  it('floating prices off SOFR, fixed off the matched Treasury tenor — both explained', () => {
    const floating = CRE_BENCHMARKS.find((b) => b.kind === 'floating')!;
    const fixed = CRE_BENCHMARKS.find((b) => b.kind === 'fixed')!;
    expect(floating.formula).toMatch(/SOFR/);
    expect(fixed.formula).toMatch(/5Y \/ 7Y \/ 10Y/);
    expect(fixed.benchmark).toMatch(/matched/i);
    expect(RE_DECISION_READS.length).toBeGreaterThanOrEqual(5);
  });
});
