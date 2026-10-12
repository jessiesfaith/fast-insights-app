import { describe, expect, it } from 'vitest';
import {
  CCORP_CORRECTIONS,
  DEBT_BASIS_GRID,
  SCORP_CORRECTIONS,
  SCORP_EXAMPLE,
  applyDistribution301,
  cCorpWorkflow,
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

describe('C-corporation end-to-end workflow (80% shareholder example)', () => {
  const w = cCorpWorkflow();

  it('§351 formation: no gain, carryover basis, no E&P', () => {
    expect(w.contributionGain).toBe(0);
    expect(w.entityBasisInContributed).toBe(100_000);
    expect(w.initialStockBasis).toBe(100_000);
    expect(w.epSteps[0].ep).toBe(0);
  });

  it('operations are taxed at the entity and E&P grows by after-tax income', () => {
    expect(w.taxableIncome).toBe(200_000);
    expect(w.corporateTaxYear1).toBe(42_000);
    expect(w.netIncomeAfterTax).toBe(158_000);
    expect(w.epSteps[1].ep).toBe(158_000);
  });

  it('appreciated property: §311(b) gain is taxed, E&P rises by the net gain, then falls by FMV', () => {
    expect(w.gainOnDistribution).toBe(200_000);
    expect(w.taxOnDistributionGain).toBe(42_000);
    expect(w.epBeforeDistribution).toBe(316_000);
    expect(w.tiers.epAfter).toBe(16_000);
  });

  it('§301(c): the whole distribution is a dividend when E&P covers it, so stock basis is untouched', () => {
    expect(w.tiers.dividend).toBe(300_000);
    expect(w.tiers.returnOfCapital).toBe(0);
    expect(w.tiers.capitalGain).toBe(0);
    expect(w.tiers.basisAfter).toBe(100_000);
    expect(w.shareholderBasisInProperty).toBe(300_000);
  });

  it('§301(c) tiers: dividend → return of capital to zero → capital gain', () => {
    const t = applyDistribution301(300_000, 120_000, 100_000);
    expect(t.dividend).toBe(120_000);
    expect(t.returnOfCapital).toBe(100_000);
    expect(t.capitalGain).toBe(80_000);
    expect(t.basisAfter).toBe(0);
    expect(t.epAfter).toBe(0);
    // a deficit in E&P yields no dividend at all
    const d = applyDistribution301(50_000, -10_000, 30_000);
    expect(d.dividend).toBe(0);
    expect(d.returnOfCapital).toBe(30_000);
    expect(d.capitalGain).toBe(20_000);
  });

  it('liquidation: 80% of the cash, §331 gain over remaining basis, basis floored at zero', () => {
    expect(w.gainOnLiquidation).toBe(0);
    expect(w.liquidationCash).toBe(160_000);
    expect(w.liquidationGain).toBe(60_000);
    expect(w.finalBasis).toBe(0);
    for (const s of w.basisSteps) expect(s.basis).toBeGreaterThanOrEqual(0);
  });

  it('two levels of tax: corporate tax on income and on the §311(b) gain, shareholder tax on dividend and gains', () => {
    expect(w.totalCorporateTax).toBe(84_000);
    expect(w.dividendTax).toBe(45_000);
    expect(w.capitalGainTax).toBe(12_000);
    expect(w.totalShareholderTax).toBe(57_000);
    expect(w.totalValueReceived).toBe(460_000);
    expect(w.netAfterTax).toBe(403_000);
  });

  it('reconciles: dividend + capital gains = value received − basis contributed', () => {
    expect(w.tiers.dividend + w.totalCapitalGain).toBe(w.totalValueReceived - w.initialStockBasis);
  });

  it('ships a correction note for every cell the digital rebuild changes', () => {
    expect(CCORP_CORRECTIONS.length).toBeGreaterThanOrEqual(4);
    for (const c of CCORP_CORRECTIONS) expect(c.ref).toMatch(/§/);
  });
});
