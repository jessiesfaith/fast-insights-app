import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ACCRETION_INPUTS,
  DEFAULT_BETA_INPUTS,
  DEFAULT_BREAKEVEN_INPUTS,
  DEFAULT_CAGR_INPUTS,
  DEFAULT_COMPS_INPUTS,
  DEFAULT_COST_INPUTS,
  DEFAULT_HURDLE_INPUTS,
  DEFAULT_IMPAIR_INPUTS,
  DEFAULT_IRR_INPUTS,
  DEFAULT_LBO_INPUTS,
  DEFAULT_PPA_INPUTS,
  DEFAULT_RNPV_INPUTS,
  DEFAULT_ROIC_INPUTS,
  accretionDilution,
  betaWorkshop,
  breakEven,
  cagr,
  compsCompare,
  costApproach,
  expectedPayoff,
  goodwillImpairment,
  hurdleBuilder,
  incrementalRoic,
  irrLab,
  lboMini,
  ppa,
  DEFAULT_13WEEK_INPUTS,
  DEFAULT_FIELD_INPUTS,
  DEFAULT_QOE_INPUTS,
  footballField,
  qoeBridge,
  thirteenWeek,
} from '../lib/gapWorkbench';

describe('IRR & NPV lab (the prep session’s example)', () => {
  it('−100 → 40/50/50 solves to IRR ≈ 18.1% (the prep session said ~18.8% — the solver is right), positive NPV at 10%, payback in year 3', () => {
    const r = irrLab(DEFAULT_IRR_INPUTS);
    expect(r.irrPct).toBeCloseTo(18.1, 1);
    // verify by hand: at 18.1% the NPV is ~zero, at 18.8% it is already negative
    expect(r.npv).toBeGreaterThan(0);
    expect(r.paybackYears).toBe(3);
  });

  it('timing matters: 100 → 150 in year 1 is 50%; the same 150 in year 5 is ≈ 8.4%', () => {
    const fast = irrLab({ investment: 100, inflows: [150, 0, 0, 0, 0], hurdlePct: 10 });
    const slow = irrLab({ investment: 100, inflows: [0, 0, 0, 0, 150], hurdlePct: 10 });
    expect(fast.irrPct).toBeCloseTo(50, 0);
    expect(slow.irrPct).toBeCloseTo(8.4, 0);
  });

  it('cash flows that never repay the investment produce a NEGATIVE IRR', () => {
    const r = irrLab({ investment: 100, inflows: [10, 10, 10, 0, 0], hurdlePct: 10 });
    expect(r.irrPct).not.toBeNull();
    expect(r.irrPct!).toBeLessThan(0);
    expect(r.paybackYears).toBeNull();
  });
});

describe('beta workshop (unlever → relever → CAPM)', () => {
  it('reproduces the session’s numbers: 1.4 at 300/700 → βU 1.06; relever 20/80 → βL 1.26', () => {
    const r = betaWorkshop(DEFAULT_BETA_INPUTS);
    expect(r.unleveredBeta).toBeCloseTo(1.06, 2);
    expect(r.releveredBeta).toBeCloseTo(1.26, 2);
    expect(r.costOfEquityPct).toBeCloseTo(4 + 1.26 * 5.5, 0);
  });

  it('more target leverage means a higher relevered beta and cost of equity', () => {
    const lo = betaWorkshop({ ...DEFAULT_BETA_INPUTS, targetDebtPct: 10 });
    const hi = betaWorkshop({ ...DEFAULT_BETA_INPUTS, targetDebtPct: 50 });
    expect(hi.releveredBeta).toBeGreaterThan(lo.releveredBeta);
    expect(hi.costOfEquityPct).toBeGreaterThan(lo.costOfEquityPct);
  });
});

describe('risk-adjusted hurdle + rNPV', () => {
  it('the session’s build: β 1.4 + 2% country risk → Re 13.7%, hurdle ≈ 11.6%', () => {
    const r = hurdleBuilder(DEFAULT_HURDLE_INPUTS);
    expect(r.costOfEquityPct).toBeCloseTo(13.7, 1);
    expect(r.hurdlePct).toBeCloseTo(11.6, 0);
  });

  it('rNPV seed: 30% × 300 = 90 expected', () => {
    expect(expectedPayoff(DEFAULT_RNPV_INPUTS)).toBe(90);
  });
});

describe('incremental ROIC', () => {
  it('15 ÷ 100 = 15% vs 9% WACC → +6pp, creating value', () => {
    const r = incrementalRoic(DEFAULT_ROIC_INPUTS);
    expect(r.roicPct).toBe(15);
    expect(r.spreadPct).toBe(6);
    expect(r.creatingValue).toBe(true);
    expect(incrementalRoic({ deltaNopat: 5, deltaCapital: 100, waccPct: 9 }).creatingValue).toBe(false);
  });
});

describe('PPA & goodwill impairment', () => {
  it('allocates the $800 deal: net identifiable 550 → goodwill 250', () => {
    const r = ppa(DEFAULT_PPA_INPUTS);
    expect(r.netAssetsFV).toBe(550);
    expect(r.goodwill).toBe(250);
    expect(r.bargainPurchase).toBe(false);
    expect(ppa({ ...DEFAULT_PPA_INPUTS, purchasePrice: 400 }).bargainPurchase).toBe(true);
  });

  it('impairs by the fair-value shortfall, capped at goodwill', () => {
    const r = goodwillImpairment(DEFAULT_IMPAIR_INPUTS);
    expect(r.impairment).toBe(150);
    expect(r.remainingGoodwill).toBe(100);
    // shortfall larger than goodwill → capped
    expect(goodwillImpairment({ carryingValue: 800, goodwill: 250, fairValue: 400 }).impairment).toBe(250);
    // fair value above carrying → no charge
    expect(goodwillImpairment({ carryingValue: 800, goodwill: 250, fairValue: 900 }).impairment).toBe(0);
  });
});

describe('comps, cost approach, LBO, accretion, quick kit', () => {
  it('precedent over trading is the control premium: 9.5× vs 8× ≈ 18.8%', () => {
    const r = compsCompare(DEFAULT_COMPS_INPUTS);
    expect(r.evTrading).toBe(800);
    expect(r.evPrecedent).toBe(950);
    expect(r.controlPremiumPct).toBeCloseTo(18.8, 1);
  });

  it('cost approach: 400 × (1 − 25%) − 120 = 180', () => {
    expect(costApproach(DEFAULT_COST_INPUTS).equityValue).toBe(180);
  });

  it('LBO: the attribution decomposition is exact and leverage amplifies equity returns', () => {
    const r = lboMini(DEFAULT_LBO_INPUTS);
    expect(r.entryEv).toBe(400);
    expect(r.entryEquity).toBe(160);
    const gain = r.exitEquity - r.entryEquity;
    expect(r.fromGrowth + r.fromMultiple + r.fromDeleveraging).toBeCloseTo(gain, 0);
    expect(r.moic).toBeGreaterThan(1);
    // same deal, no leverage → lower equity IRR
    const unlevered = lboMini({ ...DEFAULT_LBO_INPUTS, debtPct: 0 });
    expect(r.irrPct!).toBeGreaterThan(unlevered.irrPct!);
  });

  it('accretion: half stock, half 6% debt for 15× earnings is slightly dilutive', () => {
    const r = accretionDilution(DEFAULT_ACCRETION_INPUTS);
    expect(r.standaloneEps).toBe(5);
    expect(r.newShares).toBe(9);
    expect(r.accretive).toBe(false);
    // cheaper deal: pay 10× the target's earnings instead → accretive
    const cheap = accretionDilution({ ...DEFAULT_ACCRETION_INPUTS, offerValue: 600 });
    expect(cheap.accretive).toBe(true);
  });

  it('break-even 200k ÷ $20 contribution = 10,000 units; CAGR of a 5-year double ≈ 14.9%', () => {
    const b = breakEven(DEFAULT_BREAKEVEN_INPUTS);
    expect(b.breakEvenUnits).toBe(10_000);
    expect(b.contributionMarginPct).toBe(40);
    expect(cagr(DEFAULT_CAGR_INPUTS)).toBeCloseTo(14.9, 1);
  });
});

describe('13-week cash flow (tab 10 step J)', () => {
  it('the default company is average-week profitable but troughs in the payroll/rent calendar', () => {
    const r = thirteenWeek(DEFAULT_13WEEK_INPUTS);
    expect(r.rows).toHaveLength(13);
    // week 1: 2000 - (1900 + 300 rent) = -200 → 2800
    expect(r.rows[0].endingRaw).toBe(2800);
    // week 2 adds payroll: 2000 - (1900 + 500) = -400 → 2400
    expect(r.rows[1].endingRaw).toBe(2400);
    expect(r.troughCash).toBeLessThan(DEFAULT_13WEEK_INPUTS.minCash);
    expect(r.totalRevolverDrawn).toBeGreaterThan(0);
    expect(r.totalRevolverDrawn).toBeLessThanOrEqual(DEFAULT_13WEEK_INPUTS.revolverLimit);
    expect(r.survives).toBe(true);
    expect(r.read).toMatch(/calendar/i);
  });

  it('a bigger receipts line removes the revolver need; a tiny revolver fails the floor', () => {
    const easy = thirteenWeek({ ...DEFAULT_13WEEK_INPUTS, weeklyReceipts: 2600 });
    expect(easy.totalRevolverDrawn).toBe(0);
    const tight = thirteenWeek({ ...DEFAULT_13WEEK_INPUTS, revolverLimit: 100 });
    expect(tight.survives).toBe(false);
    expect(tight.read).toMatch(/alarm|deadline/i);
  });
});

describe('football field (tab 10 step K)', () => {
  it('the default field agrees at $28–30 with the offer inside; precedents sit highest', () => {
    const r = footballField(DEFAULT_FIELD_INPUTS);
    expect(r.bars).toHaveLength(4);
    expect(r.overlapLow).toBe(28); // max of 24, 22, 28
    expect(r.overlapHigh).toBe(30); // min of 34, 30, 38
    expect(r.offerInOverlap).toBe(false); // offer 31 sits just above
    expect(r.read).toMatch(/control premium/i);
    const precedents = r.bars.find((b) => b.name.match(/Precedent/))!;
    expect(precedents.high).toBe(Math.max(...r.bars.map((b) => b.high)));
  });

  it('non-overlapping methods force the argue-the-weights read', () => {
    const r = footballField({ ...DEFAULT_FIELD_INPUTS, dcfLow: 40, dcfHigh: 50 });
    expect(r.overlapLow).toBeNull();
    expect(r.read).toMatch(/argue which method/i);
  });
});

describe('QoE bridge (tab 10 step L)', () => {
  it('the default bridge: 10.0 reported → 11.2 adjusted → 11.9 run-rate, worth $15.2M at 8×', () => {
    const r = qoeBridge(DEFAULT_QOE_INPUTS);
    expect(r.adjustedEbitda).toBe(11.2);
    expect(r.runRateEbitda).toBe(11.9);
    expect(r.evImpact).toBeCloseTo(15.2, 1);
    expect(r.steps[0].cumulative).toBe(10);
    expect(r.steps[r.steps.length - 1].cumulative).toBe(11.9);
    // adjustments cut both ways: at least one negative line
    expect(r.steps.some((s) => s.delta < 0)).toBe(true);
    expect(r.read).toMatch(/purchase price/i);
  });

  it('cumulative walks are consistent and the EV impact scales with the multiple', () => {
    const r = qoeBridge({ ...DEFAULT_QOE_INPUTS, dealMultiple: 10 });
    expect(r.evImpact).toBeCloseTo((r.runRateEbitda - DEFAULT_QOE_INPUTS.reportedEbitda) * 10, 1);
    let cum = DEFAULT_QOE_INPUTS.reportedEbitda;
    for (const st of r.steps.slice(1)) {
      cum = Math.round((cum + st.delta) * 10) / 10;
      expect(st.cumulative).toBe(cum);
    }
  });
});
