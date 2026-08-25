import { describe, expect, it } from 'vitest';
import { INDUSTRIES, SCENARIOS } from '../lib/macroModel';
import { INDUSTRY_PROFILES, adviseCapital } from '../lib/industryPlaybook';

function scenario(id: string) {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`missing scenario ${id}`);
  return s.factors;
}

describe('the industry master list', () => {
  it('profiles every industry in the model, with a full assumption list', () => {
    expect(INDUSTRY_PROFILES.map((p) => p.id).sort()).toEqual(INDUSTRIES.map((i) => i.id).sort());
    for (const p of INDUSTRY_PROFILES) {
      expect(p.beta).toBeGreaterThan(0.5);
      expect(p.beta).toBeLessThan(2);
      expect(['strong', 'average', 'stretched']).toContain(p.spreadTier);
      expect(p.assumptions.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('defensive sectors carry lower betas than cyclical ones', () => {
    const beta = (id: string) => INDUSTRY_PROFILES.find((p) => p.id === id)!.beta;
    expect(beta('staples')).toBeLessThan(beta('tech'));
    expect(beta('utilities')).toBeLessThan(beta('discretionary'));
  });
});

describe('the capital recommendation', () => {
  it('re-runs the capital engine with the industry assumptions', () => {
    const a = adviseCapital('tech', 4, scenario('goldilocks'));
    expect(a.waccInputs.beta).toBe(1.4);
    expect(a.waccInputs.creditSpread).toBe(2); // strong tier
    expect(a.options.length).toBeGreaterThan(0);
    expect(a.top).toHaveLength(2);
    expect(['paydebt', 'wait']).toContain(a.safe.id);
    expect(a.summary.length).toBeGreaterThan(60);
  });

  it('tech in an overheating/hiking world reads defense; recession-era discretionary finds cheap assets', () => {
    const hot = adviseCapital('tech', 4, scenario('overheating'));
    expect(hot.backdrop.level).toBe('headwind');
    expect(hot.stance).toBe('defense');
    expect(hot.summary).toMatch(/Defense/);
    const cold = adviseCapital('staples', 4, scenario('recession'));
    expect(cold.backdrop.level).toBe('tailwind');
  });

  it('a lower-beta industry gets a lower WACC — the same move clears more easily', () => {
    const f = scenario('goldilocks');
    expect(adviseCapital('staples', 4, f).wacc.wacc).toBeLessThan(adviseCapital('tech', 4, f).wacc.wacc);
  });

  it('the stance follows the buttons: the same industry flips as the scenario changes', () => {
    const stances = new Set(
      ['goldilocks', 'overheating', 'recession', 'stagflation'].map((s) => adviseCapital('discretionary', 4, scenario(s)).stance),
    );
    expect(stances.size).toBeGreaterThan(1);
  });
});
