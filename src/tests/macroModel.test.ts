import { describe, expect, it } from 'vitest';
import {
  ASSET_CLASSES,
  FACTOR_RANGE,
  INDUSTRIES,
  MacroFactors,
  SCENARIOS,
  chainSteps,
  impactDollars,
  impactPct,
  impactTable,
} from '../lib/macroModel';

const NEUTRAL: MacroFactors = { growth: 0, inflation: 0, policy: 0, fiscal: 0 };

function scenario(id: string): MacroFactors {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`missing scenario ${id}`);
  return s.factors;
}

function target(list: typeof ASSET_CLASSES, id: string) {
  const t = list.find((x) => x.id === id);
  if (!t) throw new Error(`missing target ${id}`);
  return t;
}

describe('macro model — structure', () => {
  it('every scenario keeps factors inside the dial range', () => {
    for (const s of SCENARIOS) {
      for (const v of Object.values(s.factors)) {
        expect(Math.abs(v)).toBeLessThanOrEqual(FACTOR_RANGE);
      }
    }
  });

  it('every asset and industry has a plain-English driver', () => {
    for (const t of [...ASSET_CLASSES, ...INDUSTRIES]) {
      expect(t.driver.length).toBeGreaterThan(20);
    }
  });

  it('ids are unique across scenarios, assets, and industries', () => {
    const ids = [
      ...SCENARIOS.map((s) => s.id),
      ...ASSET_CLASSES.map((a) => a.id),
      ...INDUSTRIES.map((i) => i.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('macro model — math', () => {
  it('a neutral scenario moves nothing', () => {
    for (const t of [...ASSET_CLASSES, ...INDUSTRIES]) {
      expect(impactPct(t.sens, NEUTRAL)).toBe(0);
      expect(impactDollars(100_000, t.sens, NEUTRAL)).toBe(0);
    }
  });

  it('dollar impact ties to percent impact', () => {
    const f = scenario('overheating');
    const stocks = target(ASSET_CLASSES, 'stocks');
    const pct = impactPct(stocks.sens, f);
    expect(impactDollars(250_000, stocks.sens, f)).toBe(Math.round(250_000 * (pct / 100)));
  });

  it('impactTable sorts best-first and covers every target', () => {
    const rows = impactTable(ASSET_CLASSES, 100_000, scenario('goldilocks'));
    expect(rows).toHaveLength(ASSET_CLASSES.length);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].pct).toBeGreaterThanOrEqual(rows[i].pct);
    }
  });
});

describe('macro model — the machine behaves like the textbook says', () => {
  it('recession + Fed cuts: long bonds are the shelter, stocks lag them', () => {
    const f = scenario('recession');
    const bonds = impactPct(target(ASSET_CLASSES, 'bonds-long').sens, f);
    const stocks = impactPct(target(ASSET_CLASSES, 'stocks').sens, f);
    expect(bonds).toBeGreaterThan(0);
    expect(bonds).toBeGreaterThan(stocks);
  });

  it('overheating + hikes: commodities beat stocks, long bonds bleed', () => {
    const f = scenario('overheating');
    expect(impactPct(target(ASSET_CLASSES, 'commodities').sens, f)).toBeGreaterThan(
      impactPct(target(ASSET_CLASSES, 'stocks').sens, f),
    );
    expect(impactPct(target(ASSET_CLASSES, 'bonds-long').sens, f)).toBeLessThan(0);
  });

  it('stagflation: gold outperforms stocks and bonds', () => {
    const f = scenario('stagflation');
    const gold = impactPct(target(ASSET_CLASSES, 'gold').sens, f);
    expect(gold).toBeGreaterThan(impactPct(target(ASSET_CLASSES, 'stocks').sens, f));
    expect(gold).toBeGreaterThan(impactPct(target(ASSET_CLASSES, 'bonds-long').sens, f));
  });

  it('rate hikes hurt long-duration tech more than defensive staples', () => {
    const f = scenario('overheating');
    expect(impactPct(target(INDUSTRIES, 'tech').sens, f)).toBeLessThan(
      impactPct(target(INDUSTRIES, 'staples').sens, f),
    );
  });

  it('easy money: cash is the loser', () => {
    const f = scenario('easy-money');
    const rows = impactTable(ASSET_CLASSES, 100_000, f);
    expect(rows[rows.length - 1].id).toBe('cash');
  });
});

describe('macro model — narrative chain', () => {
  it('always tells the story in five steps', () => {
    expect(chainSteps(NEUTRAL)).toHaveLength(5);
    expect(chainSteps(scenario('recession'))).toHaveLength(5);
  });

  it('describes easing vs tightening correctly', () => {
    const easing = chainSteps(scenario('recession'))[1].text;
    const tightening = chainSteps(scenario('overheating'))[1].text;
    expect(easing).toContain('easing');
    expect(tightening).toContain('tightening');
  });
});
