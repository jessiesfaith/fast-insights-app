import { describe, expect, it } from 'vitest';
import { ASSET_CLASSES, impactPct, SCENARIOS } from '../lib/macroModel';
import {
  DEFAULT_DCF_INPUTS,
  DEPRECIATION_WALKTHROUGH,
  runDcf,
  sensitivityGrid,
} from '../lib/valuation';

describe('DCF mechanics', () => {
  it('builds five years of FCF: NOPAT + D&A − capex − ΔNWC, discounted at WACC', () => {
    const r = runDcf(DEFAULT_DCF_INPUTS);
    expect(r.valid).toBe(true);
    expect(r.years).toHaveLength(5);
    const y1 = r.years[0];
    // year-1 hand check on the defaults: revenue 10M × 1.08
    expect(y1.revenue).toBe(10_800_000);
    expect(y1.ebitda).toBe(2_160_000); // 20% margin
    const da = 10_800_000 * 0.04;
    expect(y1.ebit).toBe(Math.round(2_160_000 - da));
    expect(y1.nopat).toBe(Math.round((2_160_000 - da) * 0.75));
    expect(y1.fcf).toBe(Math.round(y1.nopat + da - 10_800_000 * 0.05 - 800_000 * 0.1));
    // PV discounts at WACC
    expect(y1.pv).toBe(Math.round(y1.fcf / 1.086));
  });

  it('EV = PV(forecast) + PV(terminal), and equity = EV − net debt', () => {
    const r = runDcf(DEFAULT_DCF_INPUTS);
    expect(r.ev).toBe(r.pvForecast + r.pvTerminal);
    expect(r.equity).toBe(r.ev - DEFAULT_DCF_INPUTS.netDebt);
    expect(r.tvSharePct).toBeGreaterThan(50); // the TV carries most of a DCF
    expect(r.tvSharePct).toBeLessThan(95);
  });

  it('refuses a perpetuity growing faster than its discount rate', () => {
    const r = runDcf({ ...DEFAULT_DCF_INPUTS, waccPct: 2, terminalGrowthPct: 3 });
    expect(r.valid).toBe(false);
    expect(r.terminalValue).toBe(0);
  });

  it('value falls as WACC rises and rises with terminal growth', () => {
    const base = runDcf(DEFAULT_DCF_INPUTS).ev;
    expect(runDcf({ ...DEFAULT_DCF_INPUTS, waccPct: 10 }).ev).toBeLessThan(base);
    expect(runDcf({ ...DEFAULT_DCF_INPUTS, terminalGrowthPct: 3 }).ev).toBeGreaterThan(base);
  });

  it('working capital drag: heavier ΔNWC means less value (growth consumes cash first)', () => {
    const light = runDcf({ ...DEFAULT_DCF_INPUTS, nwcPctGrowth: 0 }).ev;
    const heavy = runDcf({ ...DEFAULT_DCF_INPUTS, nwcPctGrowth: 30 }).ev;
    expect(heavy).toBeLessThan(light);
  });

  it('the sensitivity grid is monotonic and marks impossible cells', () => {
    const g = sensitivityGrid(DEFAULT_DCF_INPUTS);
    expect(g.waccs).toHaveLength(5);
    expect(g.growths).toHaveLength(5);
    // down a column (WACC rising), EV falls; across a row (g rising), EV rises
    for (let j = 0; j < 5; j++) {
      for (let i = 1; i < 5; i++) {
        const above = g.values[i - 1][j];
        const here = g.values[i][j];
        if (above !== null && here !== null) expect(here).toBeLessThan(above);
      }
    }
    const invalid = sensitivityGrid({ ...DEFAULT_DCF_INPUTS, waccPct: 3, terminalGrowthPct: 2.5 });
    expect(invalid.values.flat()).toContain(null);
  });

  it('the depreciation walkthrough balances: assets −7.50 = equity −7.50', () => {
    expect(DEPRECIATION_WALKTHROUGH).toHaveLength(3);
    const text = DEPRECIATION_WALKTHROUGH.map((s) => [...s.lines, s.takeaway].join(' ')).join(' ');
    expect(text).toContain('−$7.50');
    expect(text).toContain('+$2.50');
    expect(text).toMatch(/balances/i);
  });
});

describe('asset-class coverage', () => {
  it('lists the full core menu: stocks, treasuries, IG credit, high yield, TIPS, international, cash, gold, commodities, real estate', () => {
    const ids = ASSET_CLASSES.map((a) => a.id);
    for (const must of ['stocks', 'bonds-long', 'bonds-ig', 'high-yield', 'tips', 'intl-stocks', 'cash', 'gold', 'commodities', 'real-estate']) {
      expect(ids).toContain(must);
    }
  });

  it('the new classes behave sensibly: TIPS beat nominal bonds when inflation runs; high yield tracks the economy', () => {
    const overheating = SCENARIOS.find((s) => s.id === 'overheating')!.factors;
    const recession = SCENARIOS.find((s) => s.id === 'recession')!.factors;
    const sens = (id: string) => ASSET_CLASSES.find((a) => a.id === id)!.sens;
    expect(impactPct(sens('tips'), overheating)).toBeGreaterThan(impactPct(sens('bonds-long'), overheating));
    expect(impactPct(sens('high-yield'), recession)).toBeLessThan(impactPct(sens('bonds-ig'), recession));
  });
});
