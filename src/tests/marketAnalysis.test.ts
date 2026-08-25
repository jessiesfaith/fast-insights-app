import { describe, expect, it } from 'vitest';
import { ASSET_CLASSES, INDUSTRIES, MacroFactors, SCENARIOS, SUB_INDUSTRIES, impactPct } from '../lib/macroModel';
import {
  CPI_PCE_FACTS,
  CROSS_EFFECTS,
  DIAL_PROFILES,
  INFLATION_COMPONENTS,
  assetLens,
  inflationTrend,
  debtPlaybook,
  dialPressures,
  impactTrend,
  industryBackdrop,
  levelFor,
  projectDials,
  sensAlignment,
  shortCyclePhase,
} from '../lib/marketAnalysis';

const NEUTRAL: MacroFactors = { growth: 0, inflation: 0, policy: 0, fiscal: 0 };

function scenario(id: string): MacroFactors {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`missing scenario ${id}`);
  return s.factors;
}

const profile = (key: string) => DIAL_PROFILES.find((p) => p.key === key)!;

describe('dial profiles — the ranges', () => {
  it('every dial documents its levels, ranges, and levers', () => {
    expect(DIAL_PROFILES).toHaveLength(4);
    for (const p of DIAL_PROFILES) {
      expect(p.levels.length).toBeGreaterThanOrEqual(3);
      for (const l of p.levels) {
        expect(l.range.length).toBeGreaterThan(3);
        expect(l.meaning.length).toBeGreaterThan(20);
      }
      expect(p.levers.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('levelFor maps dial values to the nearest documented range', () => {
    expect(levelFor(profile('growth'), 2).label).toBe('Boom');
    expect(levelFor(profile('growth'), -2).label).toBe('Contraction');
    expect(levelFor(profile('inflation'), 1).range).toContain('3%');
    expect(levelFor(profile('policy'), 0).label).toBe('On hold');
    // fractional settings (today's snapshot) snap to the closest level
    expect(['Below trend', 'At trend']).toContain(levelFor(profile('growth'), -0.5).label);
  });
});

describe('cross-effects — how the dials push each other', () => {
  it('overheating pushes the Fed up and growth down', () => {
    const p = dialPressures(scenario('overheating'));
    const by = (to: string) => p.find((x) => x.to === to)!;
    expect(by('policy').net).toBeGreaterThan(0); // hot growth + hot inflation force hikes
    expect(by('growth').net).toBeLessThan(0); // inflation squeeze + Fed brakes
  });

  it('fiscal is exogenous: nothing pushes it, but it pushes others', () => {
    const p = dialPressures(scenario('overheating'));
    expect(p.find((x) => x.to === 'fiscal')!.drivers).toHaveLength(0);
    expect(CROSS_EFFECTS.some((e) => e.from === 'fiscal')).toBe(true);
    expect(CROSS_EFFECTS.some((e) => e.to === 'fiscal')).toBe(false);
  });

  it('neutral dials produce no pressure anywhere', () => {
    for (const p of dialPressures(NEUTRAL)) {
      expect(p.net).toBe(0);
      expect(p.drivers).toHaveLength(0);
    }
  });
});

describe('projected trends', () => {
  it('returns Now + 8 quarters, all values within the dial range', () => {
    const t = projectDials(scenario('overheating'));
    expect(t).toHaveLength(9);
    for (const row of t) {
      for (const k of ['growth', 'inflation', 'policy', 'fiscal'] as const) {
        expect(row[k]).toBeGreaterThanOrEqual(-2);
        expect(row[k]).toBeLessThanOrEqual(2);
      }
    }
  });

  it('the feedback loop cools an overheating economy', () => {
    const t = projectDials(scenario('overheating'));
    const last = t[t.length - 1];
    expect(last.growth).toBeLessThan(t[0].growth);
    expect(last.inflation).toBeLessThan(t[0].inflation);
  });

  it('easing revives a recession', () => {
    const t = projectDials(scenario('recession'));
    expect(t[t.length - 1].growth).toBeGreaterThan(t[0].growth);
  });

  it('fiscal never drifts — budgets are chosen, not caused', () => {
    for (const row of projectDials(scenario('easy-money'))) expect(row.fiscal).toBe(1);
  });

  it('neutral stays neutral', () => {
    for (const row of projectDials(NEUTRAL)) {
      expect(row.growth).toBe(0);
      expect(row.inflation).toBe(0);
      expect(row.policy).toBe(0);
    }
  });
});

describe('market & industry trends', () => {
  it('runs every industry and asset class along the projected path', () => {
    for (const targets of [INDUSTRIES, ASSET_CLASSES]) {
      const t = impactTrend(targets, scenario('overheating'));
      expect(t).toHaveLength(9);
      for (const target of targets) {
        for (const row of t) expect(typeof row[target.id]).toBe('number');
      }
    }
  });

  it('quarter zero matches the static impact table', () => {
    const f = scenario('stagflation');
    const t = impactTrend(INDUSTRIES, f);
    for (const target of INDUSTRIES) expect(t[0][target.id]).toBe(impactPct(target.sens, f));
  });

  it('the trend moves as the feedback loop plays out (tech recovers as hikes bite growth back)', () => {
    const t = impactTrend(INDUSTRIES, scenario('overheating'));
    const first = t[0]['tech'] as number;
    const last = t[t.length - 1]['tech'] as number;
    expect(last).not.toBe(first);
  });

  it('classifies the customer backdrop: discretionary struggles in stagflation, staples hold up', () => {
    const f = scenario('stagflation');
    const disc = industryBackdrop(INDUSTRIES.find((i) => i.id === 'discretionary')!, f);
    expect(disc.level).toBe('headwind');
    expect(disc.note).toMatch(/skeptic|shorter terms/i);
    const staples = industryBackdrop(INDUSTRIES.find((i) => i.id === 'staples')!, f);
    expect(staples.level).not.toBe('headwind');
  });

  it('a boom scenario reads as a tailwind for cyclicals — with the do-not-over-trust warning', () => {
    const f: MacroFactors = { growth: 2, inflation: 0, policy: -1, fiscal: 1 };
    const b = industryBackdrop(INDUSTRIES.find((i) => i.id === 'discretionary')!, f);
    expect(b.level).toBe('tailwind');
    expect(b.note).toMatch(/do not let a tailwind excuse/i);
  });
});

describe('asset classes through an industry lens', () => {
  const target = (id: string) => [...INDUSTRIES, ...ASSET_CLASSES].find((t) => t.id === id)!;

  it('alignment is a cosine: bounded, symmetric, +1 against itself', () => {
    const tech = target('tech');
    expect(sensAlignment(tech, tech)).toBe(1);
    for (const a of ASSET_CLASSES) {
      const v = sensAlignment(tech, a);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
      expect(sensAlignment(a, tech)).toBe(v);
    }
  });

  it('teaches the real pairings: stocks move with tech, cash cuts against it, and long bonds are a FALSE hedge for tech', () => {
    const rows = assetLens('tech', NEUTRAL);
    const by = (id: string) => rows.find((r) => r.id === id)!;
    expect(by('stocks').relation).toBe('with');
    expect(by('cash').relation).toBe('against');
    // long-duration bonds catch the same rate shock as long-duration tech
    expect(by('bonds-long').relation).toBe('with');
    // energy sells what inflation is made of — commodities move with it
    expect(assetLens('energy', NEUTRAL).find((r) => r.id === 'commodities')!.relation).toBe('with');
  });

  it('covers every asset class, sorted best diversifiers first, with live impact numbers', () => {
    const f = scenario('overheating');
    const rows = assetLens('discretionary', f);
    expect(rows).toHaveLength(ASSET_CLASSES.length);
    for (let i = 1; i < rows.length; i++) expect(rows[i].alignment).toBeGreaterThanOrEqual(rows[i - 1].alignment);
    for (const r of rows) {
      expect(typeof r.now).toBe('number');
      expect(['with', 'independent', 'against']).toContain(r.relation);
    }
  });
});

describe('inflation up close — CPI vs PCE', () => {
  const NEUTRAL_F: MacroFactors = { growth: 0, inflation: 0, policy: 0, fiscal: 0 };

  it('components carry weights, betas, lags, and notes; CPI weights sum to 100', () => {
    expect(INFLATION_COMPONENTS).toHaveLength(5);
    expect(INFLATION_COMPONENTS.reduce((s, c) => s + c.cpiWeightPct, 0)).toBe(100);
    expect(INFLATION_COMPONENTS.reduce((s, c) => s + c.pceWeightPct, 0)).toBe(100);
    for (const c of INFLATION_COMPONENTS) expect(c.note.length).toBeGreaterThan(40);
  });

  it('neutral dials: CPI ≈ 2.5%, and PCE runs below CPI (the classic gap)', () => {
    const t = inflationTrend(NEUTRAL_F);
    expect(t[0].cpi).toBeCloseTo(2.5, 0);
    for (const row of t) expect(row.pce).toBeLessThan(row.cpi);
  });

  it('overheating: energy spikes past headline instantly, shelter lags and peaks later', () => {
    const t = inflationTrend(scenario('overheating'));
    expect(t[0].energy as number).toBeGreaterThan(t[0].cpi);
    // shelter echoes the dial ~3 quarters late: its value at Q3 reflects the hot Q0 dial
    const shelter = t.map((r) => r.shelter as number);
    expect(shelter[3]).toBeGreaterThanOrEqual(shelter[0]);
    // energy reacts immediately and cools as the feedback loop bites
    const energy = t.map((r) => r.energy as number);
    expect(energy[energy.length - 1]).toBeLessThan(energy[0]);
  });

  it('the facts cover the CPI/PCE distinctions (target, scope, formula, weights)', () => {
    const all = CPI_PCE_FACTS.join(' ');
    expect(all).toMatch(/Fed targets/i);
    expect(all).toMatch(/substitut/i);
    expect(all).toMatch(/shelter/i);
    expect(all).toMatch(/healthcare/i);
  });
});

describe('sub-industries — the lower-level lens', () => {
  it('ships ten named sub-industries with drivers, unique ids, and full trend support', () => {
    expect(SUB_INDUSTRIES).toHaveLength(10);
    const ids = SUB_INDUSTRIES.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of SUB_INDUSTRIES) expect(t.driver.length).toBeGreaterThan(40);
    const trend = impactTrend(SUB_INDUSTRIES, scenario('overheating'));
    for (const t of SUB_INDUSTRIES) expect(typeof trend[0][t.id]).toBe('number');
  });

  it('behaves sensibly: biotech and housing are the rate casualties, defense is fiscal-blind to the Fed, oil rides inflation', () => {
    const f = scenario('overheating');
    const pct = (id: string) => impactPct(SUB_INDUSTRIES.find((x) => x.id === id)!.sens, f);
    expect(pct('biotech')).toBeLessThan(pct('ecommerce'));
    expect(pct('housing')).toBeLessThan(pct('agriculture'));
    expect(pct('oil-gas')).toBeGreaterThan(0);
    const defense = SUB_INDUSTRIES.find((x) => x.id === 'defense')!.sens;
    expect(defense.policy).toBe(0);
    expect(defense.fiscal).toBeGreaterThan(2);
  });
});

describe('debt cycles & the debt playbook', () => {
  it('reads the short-cycle phase from the dials', () => {
    expect(shortCyclePhase(scenario('overheating')).name).toMatch(/Late cycle/);
    expect(shortCyclePhase(scenario('recession')).name).toMatch(/Downturn/);
    expect(shortCyclePhase(scenario('stagflation')).name).toMatch(/Stagflationary/);
    expect(shortCyclePhase(NEUTRAL).name).toMatch(/Mid-cycle/);
  });

  it('tightening: floating debt under pressure, locked fixed debt a tailwind', () => {
    const reads = debtPlaybook(scenario('overheating'));
    expect(reads.find((d) => d.id === 'short')!.stance).toBe('pressure');
    expect(reads.find((d) => d.id === 'long')!.stance).toBe('tailwind');
    // hot inflation adds the real-erosion point for fixed-rate borrowers
    expect(reads.find((d) => d.id === 'long')!.read).toMatch(/real terms/);
  });

  it('easing: the stances flip', () => {
    const reads = debtPlaybook(scenario('recession'));
    expect(reads.find((d) => d.id === 'short')!.stance).toBe('tailwind');
    expect(reads.find((d) => d.id === 'long')!.stance).toBe('pressure');
  });

  it('on hold: both neutral, with actionable guidance either way', () => {
    for (const d of debtPlaybook(NEUTRAL)) {
      expect(d.stance).toBe('neutral');
      expect(d.action.length).toBeGreaterThan(20);
    }
  });
});
