// Entity tax reference — the data layer behind the "Digital rebuild" tab of the
// Economic Cycles module (/economic-cycles, tab 3).
//
// The CPA/TCP study diagrams on tab 2 are AI-generated images: dense, useful,
// and impossible to correct where they are wrong. This file recreates two of
// them as data so the page can render them in the app's design system, fix
// the errors, and — for the worked example — COMPUTE the numbers from the
// assumptions instead of hand-typing them, so a change to one input flows
// through every cell.
//
//   1. DEBT_BASIS_GRID — the "master comparison grid": 15 liability fact
//      patterns × (partnership §752 / S-corp §1366(d) / at-risk §465).
//   2. sCorpWorkflow() — the S-corporation end-to-end workflow (contribution →
//      operations → nonliquidating property distribution → liquidation → tax
//      return) for an 80% shareholder, with stock basis rolled forward under
//      the §1367 ordering rules and the "basis never below zero" floor.
//
// Study material only; not tax advice. Verify against the Code and current
// regulations before relying on any of it.

// ---------------------------------------------------------------------------
// 1. Debt / liability → basis comparison grid
// ---------------------------------------------------------------------------

export type Verdict = 'yes' | 'no' | 'conditional' | 'note';

export interface GridCell {
  verdict: Verdict;
  text: string;
}

export interface GridRow {
  n: number;
  pattern: string;
  partnership: GridCell;
  sCorp: GridCell;
  atRisk: GridCell;
}

export const DEBT_BASIS_GRID: GridRow[] = [
  { n: 1, pattern: 'Bank loan — recourse', partnership: { verdict: 'yes', text: 'to the partner(s) bearing the economic risk of loss' }, sCorp: { verdict: 'no', text: '' }, atRisk: { verdict: 'note', text: 'Generally yes for amounts the owner is personally liable for' } },
  { n: 2, pattern: 'Bank loan — nonrecourse', partnership: { verdict: 'yes', text: 'allocated under the §752 nonrecourse rules (generally by profit share)' }, sCorp: { verdict: 'no', text: '' }, atRisk: { verdict: 'note', text: 'Generally no' } },
  { n: 3, pattern: 'Qualified nonrecourse real-estate loan', partnership: { verdict: 'yes', text: '' }, sCorp: { verdict: 'no', text: '' }, atRisk: { verdict: 'note', text: 'Generally yes if the §465(b)(6) requirements are met' } },
  { n: 4, pattern: 'Partner / shareholder lends directly to the entity', partnership: { verdict: 'yes', text: 'through the liability allocation (recourse to the lending partner)' }, sCorp: { verdict: 'yes', text: 'direct debt basis under §1366(d)(1)(B)' }, atRisk: { verdict: 'note', text: 'Generally yes, subject to the related-party and recourse rules' } },
  { n: 5, pattern: 'Owner personally borrows from a bank, then lends to the entity', partnership: { verdict: 'yes', text: '' }, sCorp: { verdict: 'yes', text: 'bona fide debt runs directly to the shareholder' }, atRisk: { verdict: 'note', text: 'Generally yes if the owner is personally liable on the bank loan' } },
  { n: 6, pattern: 'Owner personally borrows, then contributes the cash as equity', partnership: { verdict: 'yes', text: 'capital contribution (§722)' }, sCorp: { verdict: 'yes', text: 'stock basis (§358 / §1367)' }, atRisk: { verdict: 'note', text: 'Generally yes if the owner is personally liable on the borrowing' } },
  { n: 7, pattern: 'Owner guarantees the entity\'s bank loan', partnership: { verdict: 'conditional', text: 'only if the guarantee gives the partner the economic risk of loss (Reg. §1.752-2)' }, sCorp: { verdict: 'no', text: 'a guarantee alone creates no basis; basis arises only when the shareholder actually pays on it' }, atRisk: { verdict: 'conditional', text: 'guarantees alone are often insufficient' } },
  { n: 8, pattern: 'Owner pledges personal property as collateral', partnership: { verdict: 'conditional', text: 'to the extent of the recognised economic risk of loss' }, sCorp: { verdict: 'no', text: 'a pledge alone creates no basis' }, atRisk: { verdict: 'conditional', text: 'generally limited to the pledged property\'s net FMV' } },
  { n: 9, pattern: 'Entity borrows from another partner / shareholder', partnership: { verdict: 'yes', text: 'usually allocated to the lending partner' }, sCorp: { verdict: 'yes', text: 'only for the lending shareholder' }, atRisk: { verdict: 'note', text: 'Lending owner generally at risk to the extent of the qualifying investment' } },
  { n: 10, pattern: 'Entity borrows from the owner\'s relative', partnership: { verdict: 'conditional', text: 'depends on the liability allocation and the related-party rules' }, sCorp: { verdict: 'no', text: 'generally no direct shareholder debt basis' }, atRisk: { verdict: 'note', text: 'Depends on who actually bears the economic risk' } },
  { n: 11, pattern: 'Entity borrows from another corporation', partnership: { verdict: 'conditional', text: 'allocated under §752' }, sCorp: { verdict: 'no', text: 'generally no' }, atRisk: { verdict: 'note', text: 'Depends on recourse and the related-party rules' } },
  { n: 12, pattern: 'Entity takes over the owner\'s debt', partnership: { verdict: 'conditional', text: 'liability shift under §752 — the owner\'s share of the assumed debt, net of the relief' }, sCorp: { verdict: 'no', text: 'generally no; §357 may create gain if liabilities exceed basis' }, atRisk: { verdict: 'note', text: 'Depends on whether the owner remains liable' } },
  { n: 13, pattern: 'Owner assumes the entity\'s debt', partnership: { verdict: 'conditional', text: 'may increase the partner\'s allocated recourse liability' }, sCorp: { verdict: 'no', text: 'no basis until a qualifying direct debt or an actual payment arises' }, atRisk: { verdict: 'conditional', text: '' } },
  { n: 14, pattern: 'Entity repays the bank loan', partnership: { verdict: 'note', text: 'the decrease in allocated liabilities is a deemed distribution that reduces outside basis (§752(b))' }, sCorp: { verdict: 'note', text: 'No direct shareholder basis effect' }, atRisk: { verdict: 'note', text: 'May reduce the amount at risk' } },
  { n: 15, pattern: 'Entity repays the owner\'s loan', partnership: { verdict: 'note', text: 'the decrease in the allocated liability may reduce outside basis' }, sCorp: { verdict: 'note', text: 'Reduces the outstanding debt; gain possible if debt basis was previously reduced by losses (§1367(b)(2))' }, atRisk: { verdict: 'note', text: 'Generally reduces the amount at risk' } },
];

// ---------------------------------------------------------------------------
// 2. S-corporation end-to-end workflow (computed)
// ---------------------------------------------------------------------------

export interface SCorpAssumptions {
  /** This shareholder's ownership share (0..1). */
  ownership: number;
  /** Property contributed at formation under §351. */
  contribution: { asset: string; basis: number; fmv: number };
  /** Entity operations (cumulative over the operating period). */
  operations: { ordinaryIncome: number; depreciation: number; otherDeductions: number };
  /** Appreciated property later distributed to THIS shareholder (nonliquidating). */
  distribution: { asset: string; basis: number; fmv: number };
  /** Cash remaining at liquidation (assumed basis = FMV). */
  liquidation: { cash: number };
}

export const SCORP_EXAMPLE: SCorpAssumptions = {
  ownership: 0.8,
  contribution: { asset: 'Land', basis: 100_000, fmv: 400_000 },
  operations: { ordinaryIncome: 150_000, depreciation: 20_000, otherDeductions: 30_000 },
  distribution: { asset: 'Land', basis: 100_000, fmv: 500_000 },
  liquidation: { cash: 300_000 },
};

export interface BasisStep {
  label: string;
  /** Signed change to stock basis actually applied (after the zero floor). */
  applied: number;
  /** Basis after this step. */
  basis: number;
  /** Gain recognised at this step because a distribution exceeded basis. */
  gain: number;
  ref: string;
}

export interface SCorpWorkflow {
  a: SCorpAssumptions;
  // 1 · contribution
  contributionGain: number;
  entityBasisInContributed: number;
  initialStockBasis: number;
  // 2 · operations
  netIncome: number;
  incomeShare: number;
  // 3 · nonliquidating property distribution
  entityGainOnDistribution: number;
  gainShare: number;
  distributionAmount: number;
  distributionGain: number;
  shareholderBasisInProperty: number;
  // 4 · liquidation
  entityGainOnLiquidation: number;
  liquidationCash: number;
  liquidationGain: number;
  // 5 · stock basis roll-forward + totals
  steps: BasisStep[];
  finalBasis: number;
  totalCapitalGain: number;
  totalOrdinaryIncome: number;
  /** Everything this shareholder received, at FMV. */
  totalValueReceived: number;
}

/** Stock basis can never go below zero (§1367(a)(2) "but not below zero"). */
function applyDistribution(basis: number, amount: number): { basis: number; applied: number; gain: number } {
  const applied = Math.min(basis, amount);
  return { basis: basis - applied, applied: -applied, gain: amount - applied };
}

/**
 * Walk the shareholder through formation → operations → property
 * distribution → liquidation, rolling stock basis forward under the §1367
 * ordering (income items first, then distributions) and recognising gain
 * whenever a distribution exceeds basis (§1368(b)(2) / §331).
 */
export function sCorpWorkflow(a: SCorpAssumptions = SCORP_EXAMPLE): SCorpWorkflow {
  const { ownership } = a;
  const steps: BasisStep[] = [];
  let basis = 0;

  // 1 · §351 contribution: no gain (≥80% control), carryover basis both sides.
  const contributionGain = 0;
  const entityBasisInContributed = a.contribution.basis; // §362
  const initialStockBasis = a.contribution.basis; // §358
  basis = initialStockBasis;
  steps.push({ label: `Initial stock basis — ${a.contribution.asset} contributed (carryover)`, applied: initialStockBasis, basis, gain: 0, ref: '§358' });

  // 2 · operations flow through (§1366) and increase basis (§1367(a)(1)).
  const netIncome = a.operations.ordinaryIncome - a.operations.depreciation - a.operations.otherDeductions;
  const incomeShare = netIncome * ownership;
  basis += incomeShare;
  steps.push({ label: `Share of ordinary income (${(ownership * 100).toFixed(0)}% × ${netIncome.toLocaleString()})`, applied: incomeShare, basis, gain: 0, ref: '§1366 · §1367(a)(1)' });

  // 3 · appreciated property distributed: entity gain as if sold at FMV
  //     (§311(b)), passes through and increases basis BEFORE the distribution
  //     reduces it (Reg. §1.1367-1(f) ordering); the distribution is measured
  //     at FMV, and basis stops at zero — excess is capital gain (§1368(b)(2)).
  const entityGainOnDistribution = a.distribution.fmv - a.distribution.basis;
  const gainShare = entityGainOnDistribution * ownership;
  basis += gainShare;
  steps.push({ label: `Share of §311(b) gain on ${a.distribution.asset} (${(ownership * 100).toFixed(0)}% × ${entityGainOnDistribution.toLocaleString()})`, applied: gainShare, basis, gain: 0, ref: '§311(b) · §1366 · §1367(a)(1)' });

  const distributionAmount = a.distribution.fmv;
  const d = applyDistribution(basis, distributionAmount);
  basis = d.basis;
  const distributionGain = d.gain;
  steps.push({ label: `Property distribution — ${a.distribution.asset} at FMV`, applied: d.applied, basis, gain: distributionGain, ref: '§1368(b) · §1367(a)(2)' });
  const shareholderBasisInProperty = a.distribution.fmv; // §301(d) via §1371(a)

  // 4 · liquidation: cash has no built-in gain (§336 gain = 0); shareholder
  //     treats the cash as full payment for stock (§331) → capital gain over
  //     remaining basis.
  const entityGainOnLiquidation = 0;
  const liquidationCash = a.liquidation.cash * ownership;
  const l = applyDistribution(basis, liquidationCash);
  basis = l.basis;
  const liquidationGain = l.gain;
  steps.push({ label: `Liquidating distribution — cash (${(ownership * 100).toFixed(0)}% × ${a.liquidation.cash.toLocaleString()})`, applied: l.applied, basis, gain: liquidationGain, ref: '§331 · §336' });

  const totalCapitalGain = gainShare + distributionGain + liquidationGain;
  const totalOrdinaryIncome = incomeShare;
  const totalValueReceived = a.distribution.fmv + liquidationCash;

  return {
    a,
    contributionGain,
    entityBasisInContributed,
    initialStockBasis,
    netIncome,
    incomeShare,
    entityGainOnDistribution,
    gainShare,
    distributionAmount,
    distributionGain,
    shareholderBasisInProperty,
    entityGainOnLiquidation,
    liquidationCash,
    liquidationGain,
    steps,
    finalBasis: basis,
    totalCapitalGain,
    totalOrdinaryIncome,
    totalValueReceived,
  };
}

/**
 * Corrections the digital rebuild makes to the source image of the S-corp
 * swimlane. Each is a claim the page shows next to the corrected cell.
 */
export const SCORP_CORRECTIONS: { cell: string; image: string; correct: string; ref: string }[] = [
  {
    cell: '3B / 3C — stock basis after the property distribution',
    image: 'Reduces basis 180,000 − 400,000 to (220,000) and says "negative basis allowed".',
    correct: 'Stock basis can never go below zero. The §311(b) gain passes through first and raises basis; the distribution then reduces basis to zero, and any excess is capital gain.',
    ref: '§1367(a)(2) · §1368(b)(2) · Reg. §1.1367-1(f)',
  },
  {
    cell: '3B — amount of the distribution',
    image: 'Reduces basis by 400,000 (the entity\'s gain), not by what the shareholder received.',
    correct: 'A property distribution is measured at the property\'s FMV (500,000 here); the entity\'s gain is a separate pass-through item.',
    ref: '§301(b) via §1371(a) · §1368',
  },
  {
    cell: '3B — "nontaxable if basis ≥ FMV"',
    image: 'States the distribution is nontaxable when basis ≥ FMV.',
    correct: 'The pass-through share of the §311(b) gain is always taxable to the shareholder in the year of distribution; "nontaxable" only describes the distribution itself, to the extent of basis.',
    ref: '§311(b) · §1366',
  },
  {
    cell: '4B / 4C — liquidation',
    image: 'Has the 80% shareholder receiving all 300,000 of cash and computes gain from a 480,000 / (220,000) basis.',
    correct: 'An 80% shareholder receives 80% of the liquidating cash (240,000). Gain = cash received − remaining stock basis, with basis floored at zero.',
    ref: '§331 · §336',
  },
  {
    cell: '5B / 5E — total capital gain',
    image: 'Reports capital gain from the property distribution (320,000) plus 180,000 from liquidation.',
    correct: 'See the roll-forward: the shareholder\'s capital gain is the §311(b) share (320,000) plus any distribution excess over basis plus the §331 liquidation gain (240,000).',
    ref: '§1366 · §1368(b)(2) · §331 — Schedule K-1 → Schedule D / Form 8949',
  },
];

/** Compact currency formatting for the swimlane cells. */
export const fmtAmt = (n: number): string => {
  if (n === 0) return '0'; // also normalises -0
  return n < 0 ? `(${Math.abs(n).toLocaleString('en-US')})` : n.toLocaleString('en-US');
};

// ---------------------------------------------------------------------------
// 3. C-corporation end-to-end workflow (computed)
// ---------------------------------------------------------------------------

export interface CCorpAssumptions {
  /** This shareholder's ownership share (0..1). */
  ownership: number;
  /** Property contributed at formation under §351. */
  contribution: { asset: string; basis: number; fmv: number };
  /** Year-1 operations. */
  operations: { revenue: number; operatingExpenses: number; depreciation: number };
  /** Flat corporate rate (§11). */
  corporateRate: number;
  /** Appreciated property later distributed to THIS shareholder (nonliquidating). */
  distribution: { asset: string; basis: number; fmv: number };
  /** Cash remaining at liquidation (assumed basis = FMV). */
  liquidation: { cash: number };
  /** Illustrative shareholder rates on qualified dividends and long-term capital gain. */
  dividendRate: number;
  capitalGainRate: number;
}

export const CCORP_EXAMPLE: CCorpAssumptions = {
  ownership: 0.8,
  contribution: { asset: 'Land', basis: 100_000, fmv: 400_000 },
  operations: { revenue: 500_000, operatingExpenses: 300_000, depreciation: 0 },
  corporateRate: 0.21,
  distribution: { asset: 'Land', basis: 100_000, fmv: 300_000 },
  liquidation: { cash: 200_000 },
  dividendRate: 0.15,
  capitalGainRate: 0.20,
};

export interface EpStep {
  label: string;
  delta: number;
  ep: number;
  ref: string;
}

/** The §301(c) three-tier treatment of a nonliquidating distribution. */
export interface DistributionTiers {
  amount: number;
  /** Tier 1 — dividend to the extent of E&P (§301(c)(1), §316). */
  dividend: number;
  /** Tier 2 — return of capital, reduces stock basis but not below zero (§301(c)(2)). */
  returnOfCapital: number;
  /** Tier 3 — excess over basis is gain from sale/exchange (§301(c)(3)). */
  capitalGain: number;
  basisAfter: number;
  epAfter: number;
}

export function applyDistribution301(amount: number, ep: number, basis: number): DistributionTiers {
  const dividend = Math.min(amount, Math.max(0, ep));
  const remaining = amount - dividend;
  const returnOfCapital = Math.min(remaining, basis);
  const capitalGain = remaining - returnOfCapital;
  return {
    amount,
    dividend,
    returnOfCapital,
    capitalGain,
    basisAfter: basis - returnOfCapital,
    epAfter: Math.max(0, ep - amount),
  };
}

export interface CCorpWorkflow {
  a: CCorpAssumptions;
  // 1 · formation
  contributionGain: number;
  entityBasisInContributed: number;
  initialStockBasis: number;
  // 2 · operations
  taxableIncome: number;
  corporateTaxYear1: number;
  netIncomeAfterTax: number;
  // 3 · nonliquidating property distribution
  gainOnDistribution: number;
  taxOnDistributionGain: number;
  epBeforeDistribution: number;
  tiers: DistributionTiers;
  shareholderBasisInProperty: number;
  // 4 · liquidation
  gainOnLiquidation: number;
  liquidationCash: number;
  liquidationGain: number;
  // 5 · shareholder totals
  epSteps: EpStep[];
  basisSteps: BasisStep[];
  finalBasis: number;
  totalValueReceived: number;
  dividendTax: number;
  capitalGainTax: number;
  totalShareholderTax: number;
  totalCorporateTax: number;
  netAfterTax: number;
  totalCapitalGain: number;
}

/**
 * Walk a C-corporation and its shareholder through formation → operations →
 * appreciated-property distribution → liquidation, keeping BOTH ledgers the
 * exam cares about: earnings & profits at the entity and stock basis at the
 * shareholder. The distribution runs through the §301(c) tiers (dividend to
 * the extent of E&P, then return of capital to zero basis, then gain); the
 * liquidation is a §331 sale of the stock.
 */
export function cCorpWorkflow(a: CCorpAssumptions = CCORP_EXAMPLE): CCorpWorkflow {
  const { ownership } = a;
  const epSteps: EpStep[] = [];
  const basisSteps: BasisStep[] = [];
  let ep = 0;
  let basis = 0;

  // 1 · §351 formation: no gain either side; carryover basis; no E&P created.
  const contributionGain = 0;
  const entityBasisInContributed = a.contribution.basis; // §362
  const initialStockBasis = a.contribution.basis; // §358
  basis = initialStockBasis;
  basisSteps.push({ label: `Initial stock basis — ${a.contribution.asset} contributed (carryover)`, applied: basis, basis, gain: 0, ref: '§358' });
  epSteps.push({ label: 'Formation — a §351 contribution creates no E&P', delta: 0, ep, ref: '§312' });

  // 2 · operations taxed at the entity (§11); E&P grows by after-tax income.
  const taxableIncome = a.operations.revenue - a.operations.operatingExpenses - a.operations.depreciation;
  const corporateTaxYear1 = taxableIncome * a.corporateRate;
  const netIncomeAfterTax = taxableIncome - corporateTaxYear1;
  ep += netIncomeAfterTax;
  epSteps.push({ label: `Year-1 taxable income ${taxableIncome.toLocaleString()} less corporate tax ${corporateTaxYear1.toLocaleString()}`, delta: netIncomeAfterTax, ep, ref: '§11 · §312' });

  // 3 · appreciated property distributed: §311(b) gain at the entity, taxed;
  //     E&P up by the gain, down by the tax, then down by FMV (§312(b));
  //     the shareholder runs the FMV through §301(c).
  const gainOnDistribution = a.distribution.fmv - a.distribution.basis;
  const taxOnDistributionGain = gainOnDistribution * a.corporateRate;
  ep += gainOnDistribution - taxOnDistributionGain;
  epSteps.push({ label: `§311(b) gain on ${a.distribution.asset} ${gainOnDistribution.toLocaleString()} less tax ${taxOnDistributionGain.toLocaleString()}`, delta: gainOnDistribution - taxOnDistributionGain, ep, ref: '§311(b) · §312(b)' });
  const epBeforeDistribution = ep;
  const tiers = applyDistribution301(a.distribution.fmv, ep, basis);
  ep = tiers.epAfter;
  epSteps.push({ label: `Distribution of ${a.distribution.asset} at FMV`, delta: -(epBeforeDistribution - ep), ep, ref: '§312(a)(3) · §312(b)' });
  basis = tiers.basisAfter;
  basisSteps.push({ label: `Property distribution — dividend ${tiers.dividend.toLocaleString()} (no basis effect); return of capital ${tiers.returnOfCapital.toLocaleString()}`, applied: -tiers.returnOfCapital, basis, gain: tiers.capitalGain, ref: '§301(c)' });
  const shareholderBasisInProperty = a.distribution.fmv; // §301(d)

  // 4 · liquidation: cash carries no gain (§336); §331 sale of the stock.
  const gainOnLiquidation = 0;
  const liquidationCash = a.liquidation.cash * ownership;
  const applied = Math.min(basis, liquidationCash);
  const liquidationGain = liquidationCash - applied;
  basis -= applied;
  basisSteps.push({ label: `Liquidating distribution — cash (${(ownership * 100).toFixed(0)}% × ${a.liquidation.cash.toLocaleString()})`, applied: -applied, basis, gain: liquidationGain, ref: '§331 · §336' });
  epSteps.push({ label: 'Liquidation — E&P is irrelevant to a §331 exchange; the corporation terminates', delta: -ep, ep: 0, ref: '§331' });

  // 5 · totals
  const totalValueReceived = a.distribution.fmv + liquidationCash;
  const dividendTax = tiers.dividend * a.dividendRate;
  const totalCapitalGain = tiers.capitalGain + liquidationGain;
  const capitalGainTax = totalCapitalGain * a.capitalGainRate;
  const totalShareholderTax = dividendTax + capitalGainTax;
  const totalCorporateTax = corporateTaxYear1 + taxOnDistributionGain;

  return {
    a,
    contributionGain,
    entityBasisInContributed,
    initialStockBasis,
    taxableIncome,
    corporateTaxYear1,
    netIncomeAfterTax,
    gainOnDistribution,
    taxOnDistributionGain,
    epBeforeDistribution,
    tiers,
    shareholderBasisInProperty,
    gainOnLiquidation,
    liquidationCash,
    liquidationGain,
    epSteps,
    basisSteps,
    finalBasis: basis,
    totalValueReceived,
    dividendTax,
    capitalGainTax,
    totalShareholderTax,
    totalCorporateTax,
    netAfterTax: totalValueReceived - totalShareholderTax,
    totalCapitalGain,
  };
}

export const CCORP_CORRECTIONS: { cell: string; image: string; correct: string; ref: string }[] = [
  {
    cell: '3B / 3C — stock basis after the dividend',
    image: 'Reduces stock basis by the FMV of the property (240,000) to (140,000) and says "stock basis can be negative (§301(d))".',
    correct: 'A distribution is a dividend to the extent of E&P and a dividend never touches stock basis. Only the part beyond E&P reduces basis, and only to zero; anything beyond that is capital gain. §301(d) sets the shareholder\'s basis in the property received (FMV); it says nothing about negative stock basis.',
    ref: '§301(c)(1)–(3) · §301(d) · §316',
  },
  {
    cell: '3B — amount of the distribution',
    image: 'Shows FMV received 300,000 but a dividend of only 240,000 (80%).',
    correct: 'The amount of a property distribution is the FMV of what THIS shareholder actually receives. If the whole parcel goes to the 80% holder, the distribution is 300,000.',
    ref: '§301(b)(1)',
  },
  {
    cell: '3A / 3D — E&P after the distribution',
    image: 'Remaining E&P 116,000 (158,000 − 42,000), ignoring the gain.',
    correct: 'E&P rises by the §311(b) gain and falls by the tax on it, then falls by the FMV of the property distributed (not below zero).',
    ref: '§312(a)(3) · §312(b)',
  },
  {
    cell: '4B / 4C — liquidation gain',
    image: 'Capital gain 300,000, computed as 160,000 − (140,000).',
    correct: 'Liquidation gain = cash received − remaining stock basis, with basis floored at zero: 160,000 − 100,000 = 60,000 in this example.',
    ref: '§331(a) · §336',
  },
  {
    cell: '5B / 5C — total tax and net after-tax return',
    image: 'Total shareholder tax 96,000 and net 304,000, built on the figures above.',
    correct: 'Dividend tax and capital-gain tax recompute from the corrected tiers; the corporation separately paid tax at the entity level on both the operating income and the §311(b) gain — the two-level system the exam is testing.',
    ref: '§11 · §1(h)',
  },
];
