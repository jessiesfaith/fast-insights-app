import { describe, expect, it } from 'vitest';
import { MacroFactors, SCENARIOS } from '../lib/macroModel';
import {
  CROSS_EFFECTS,
  DIAL_PROFILES,
  debtPlaybook,
  dialPressures,
  levelFor,
  projectDials,
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
