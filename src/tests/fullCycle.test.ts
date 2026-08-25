import { describe, expect, it } from 'vitest';
import { DEFAULT_FULL_CYCLE, runFullCycle } from '../lib/fullCycle';

describe('the full cycle — hand-checked, stage by stage', () => {
  const r = runFullCycle(DEFAULT_FULL_CYCLE);

  it('stage 1: revenue 100M at 25% → EBITDA 25M → EBIT 20M → NOPAT 15M; NI 13.2M → EPS $1.32', () => {
    expect(r.s1.ebitda).toBe(25_000_000);
    expect(r.s1.ebit).toBe(20_000_000);
    expect(r.s1.nopat).toBe(15_000_000);
    expect(r.s1.interest).toBe(2_400_000); // 40M × 6%
    expect(r.s1.netIncome).toBe(13_200_000); // (20 − 2.4) × 0.75
    expect(r.s1.eps).toBe(1.32);
  });

  it('stage 2: invested capital 100M → ROIC 15%; project 6M NOPAT on 50M → 12%', () => {
    expect(r.s2.investedCapital).toBe(100_000_000);
    expect(r.s2.roicPct).toBe(15);
    expect(r.s2.projectNopat).toBe(6_000_000); // (10 − 2) × 0.75
    expect(r.s2.projectRoicPct).toBe(12);
  });

  it('stage 3: market equity 300M → weights 88.2/11.8 → WACC ≈ 9.4%', () => {
    expect(r.s3.equityMarket).toBe(300_000_000);
    expect(r.s3.rePct).toBeCloseTo(10.05, 2); // 4 + 1.1×5.5
    expect(r.s3.rdAfterTaxPct).toBe(4.5); // 6 × 0.75
    // hand check: we = 300/340 = 0.8824 → wacc = .8824×10.05 + .1176×4.5 ≈ 9.40
    expect(r.s3.waccPct).toBeCloseTo(9.4, 1);
  });

  it('stage 4: spread = 15 − WACC → economic profit = spread × 100M', () => {
    expect(r.s4.spreadPct).toBeCloseTo(15 - r.s3.waccPct, 1);
    expect(r.s4.economicProfit).toBeCloseTo((r.s4.spreadPct / 100) * 100_000_000, -4);
    expect(r.s4.economicProfit).toBeGreaterThan(0); // this company creates value
  });

  it('stage 5: FCF 13M → EV, EQV, per-share intrinsic below the $30 market price, implied growth above assumed', () => {
    expect(r.s5.fcf).toBe(13_000_000); // 15 + 5 − 6 − 1
    expect(r.s5.valid).toBe(true);
    // EV = 13×1.04/(wacc−4%); at wacc≈9.4 → ≈ 250M
    expect(r.s5.ev).toBeGreaterThan(200_000_000);
    expect(r.s5.ev).toBeLessThan(300_000_000);
    expect(r.s5.netDebt).toBe(30_000_000);
    expect(r.s5.eqv).toBe(r.s5.ev - 30_000_000);
    expect(r.s5.perShareIntrinsic).toBeLessThan(DEFAULT_FULL_CYCLE.sharePrice); // market is rich here
    expect(r.s5.premiumPct).toBeGreaterThan(0);
    // the market's price implies more growth than the 4% assumption
    expect(r.s5.impliedGrowthPct).toBeGreaterThan(DEFAULT_FULL_CYCLE.growthPct);
    // and the implied-growth formula is self-consistent: EV at g* reproduces market EV
    const w = r.s3.waccPct / 100;
    const g = r.s5.impliedGrowthPct / 100;
    expect((r.s5.fcf * (1 + g)) / (w - g)).toBeCloseTo(r.s5.marketEv, -6); // g* rounded to 2dp → ±0.5M tolerance on 330M
  });

  it('stage 6: the three lenses disagree on purpose', () => {
    const { bonds, stock } = r.s6;
    // project NPV positive (12% ROIC vs ~9.4% WACC)
    expect(r.s6.projectNpv).toBeGreaterThan(0);
    // EPS lens: bonds accretive vs stock (cheap after-tax debt beats share count here)
    expect(bonds.eps).toBeGreaterThan(stock.eps);
    // risk lens: stock keeps leverage flat, bonds raise it
    expect(bonds.debtToEbitda).toBeGreaterThan(stock.debtToEbitda);
    expect(bonds.coverage).toBeLessThan(stock.coverage);
    // value lens: with the market price ABOVE intrinsic, issuing stock helps existing holders
    expect(stock.perShareIntrinsic).toBeGreaterThan(bonds.perShareIntrinsic);
    expect(stock.read).toMatch(/transferring value TO existing holders/);
    // both beat the pre-deal intrinsic (the project is positive-NPV either way)
    expect(bonds.perShareIntrinsic).toBeGreaterThan(r.s5.perShareIntrinsic);
    // the verdict names all three lenses and the risk-of-ruin override
    const v = r.s6.verdict.join(' ');
    expect(v).toMatch(/EPS lens/);
    expect(v).toMatch(/Value lens/);
    expect(v).toMatch(/Risk lens/);
    expect(v).toMatch(/§54/);
  });

  it('flip the setup: a CHEAP stock makes equity issuance value-destructive for existing holders', () => {
    const cheap = runFullCycle({ ...DEFAULT_FULL_CYCLE, sharePrice: 15 });
    // now market < intrinsic → §82 the right way round
    expect(cheap.s5.premiumPct).toBeLessThan(0);
    expect(cheap.s6.stock.read).toMatch(/§82/);
    expect(cheap.s6.bonds.perShareIntrinsic).toBeGreaterThan(cheap.s6.stock.perShareIntrinsic);
  });
});
