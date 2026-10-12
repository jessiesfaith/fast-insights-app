import { describe, expect, it } from 'vitest';
import {
  DEBT_BASIS_GRID,
  SCORP_CORRECTIONS,
  SCORP_EXAMPLE,
  fmtAmt,
  sCorpWorkflow,
} from '../lib/entityTaxReference';

describe('debt / basis comparison grid', () => {
  it('has the 15 fact patterns of the source grid, numbered in order', () => {
    expect(DEBT_BASIS_GRID).toHaveLength(15);
    DEBT_BASIS_GRID.forEach((r, i) => expect(r.n).toBe(i + 1));
  });

  it('never gives an S-corp shareholder basis for entity-level bank debt', () => {
    const bank = DEBT_BASIS_GRID.filter((r) => /^Bank loan/.test(r.pattern));
    expect(bank).toHaveLength(2);
    for (const r of bank) {
      expect(r.partnership.verdict).toBe('yes');
      expect(r.sCorp.verdict).toBe('no');
    }
  });

  it('gives debt basis only for debt running directly from the shareholder', () => {
    const direct = DEBT_BASIS_GRID.find((r) => r.n === 4)!;
    expect(direct.sCorp.verdict).toBe('yes');
    const guarantee = DEBT_BASIS_GRID.find((r) => r.n === 7)!;
    expect(guarantee.sCorp.verdict).toBe('no');
  });
});

describe('S-corporation end-to-end workflow (80% shareholder example)', () => {
  const w = sCorpWorkflow();

  it('§351 contribution: no gain, carryover basis on both sides', () => {
    expect(w.contributionGain).toBe(0);
    expect(w.entityBasisInContributed).toBe(100_000);
    expect(w.initialStockBasis).toBe(100_000);
  });

  it('operations: net income flows through at the ownership share and lifts basis', () => {
    expect(w.netIncome).toBe(100_000);
    expect(w.incomeShare).toBe(80_000);
    expect(w.steps[1].basis).toBe(180_000);
  });

  it('property distribution: §311(b) gain passes through BEFORE the FMV distribution reduces basis', () => {
    expect(w.entityGainOnDistribution).toBe(400_000);
    expect(w.gainShare).toBe(320_000);
    expect(w.steps[2].basis).toBe(500_000); // 180,000 + 320,000
    expect(w.distributionAmount).toBe(500_000);
    expect(w.steps[3].basis).toBe(0);
    expect(w.distributionGain).toBe(0);
    expect(w.shareholderBasisInProperty).toBe(500_000);
  });

  it('stock basis never goes below zero — excess distributions are gain', () => {
    for (const s of w.steps) expect(s.basis).toBeGreaterThanOrEqual(0);
    // force the excess case: a smaller pass-through gain leaves basis short
    const tight = sCorpWorkflow({ ...SCORP_EXAMPLE, distribution: { asset: 'Land', basis: 450_000, fmv: 500_000 } });
    // basis before distribution = 100,000 + 80,000 + 0.8 × 50,000 = 220,000
    expect(tight.steps[2].basis).toBe(220_000);
    expect(tight.steps[3].basis).toBe(0);
    expect(tight.distributionGain).toBe(280_000);
  });

  it('liquidation: the shareholder gets their share of the cash and recognises §331 gain over remaining basis', () => {
    expect(w.entityGainOnLiquidation).toBe(0);
    expect(w.liquidationCash).toBe(240_000);
    expect(w.liquidationGain).toBe(240_000);
    expect(w.finalBasis).toBe(0);
  });

  it('reconciles: everything taxed over the life equals value received minus basis contributed', () => {
    const taxed = w.totalOrdinaryIncome + w.totalCapitalGain;
    expect(taxed).toBe(w.totalValueReceived - w.initialStockBasis);
    expect(w.totalCapitalGain).toBe(560_000);
    expect(w.totalOrdinaryIncome).toBe(80_000);
  });

  it('ships a correction note for every cell the digital rebuild changes', () => {
    expect(SCORP_CORRECTIONS.length).toBeGreaterThanOrEqual(4);
    for (const c of SCORP_CORRECTIONS) {
      expect(c.cell).toBeTruthy();
      expect(c.correct.length).toBeGreaterThan(20);
      expect(c.ref).toMatch(/§/);
    }
  });

  it('formats negatives in accounting parentheses', () => {
    expect(fmtAmt(-400_000)).toBe('(400,000)');
    expect(fmtAmt(80_000)).toBe('80,000');
    expect(fmtAmt(-0)).toBe('0');
  });
});
