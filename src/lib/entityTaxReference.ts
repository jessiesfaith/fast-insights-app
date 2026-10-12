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
