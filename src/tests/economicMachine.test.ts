import { describe, expect, it } from 'vitest';
import { MacroFactors, SCENARIOS } from '../lib/macroModel';
import {
  DALIO_RULES,
  SHORT_CYCLE_YEARS,
  equilibriumReads,
  leverInterplay,
  leverWatch,
  machineCurve,
} from '../lib/economicMachine';

const NEUTRAL: MacroFactors = { growth: 0, inflation: 0, policy: 0, fiscal: 0 };

function scenario(id: string): MacroFactors {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`missing scenario ${id}`);
  return s.factors;
}

const eq = (f: MacroFactors, id: string) => equilibriumReads(f, 4)!.find((e) => e.id === id)!;

describe('how the market cycles', () => {
  it('draws 76 points: a rising trend with two waves around it', () => {
    const c = machineCurve();
    expect(c).toHaveLength(76);
    // productivity is a straight line up
    for (let i = 1; i < c.length; i++) expect(c[i].productivity).toBeGreaterThan(c[i - 1].productivity);
    // the waves oscillate around the trend: above it at some point, below at another
    expect(c.some((p) => p.shortTerm > p.productivity)).toBe(true);
    expect(c.some((p) => p.shortTerm < p.productivity)).toBe(true);
    expect(c.some((p) => p.economy > p.shortTerm)).toBe(true);
    expect(c.some((p) => p.economy < p.shortTerm)).toBe(true);
  });

  it('the short cycle completes a full wave every ~8 years', () => {
    const c = machineCurve();
    const dev = (t: number) => c[t].shortTerm - c[t].productivity;
    expect(dev(SHORT_CYCLE_YEARS)).toBeCloseTo(dev(0), 5);
    expect(dev(SHORT_CYCLE_YEARS / 4)).toBeGreaterThan(0); // quarter-wave peak
  });

  it('ships all three Dalio rules of thumb', () => {
    expect(DALIO_RULES).toHaveLength(3);
    expect(DALIO_RULES.join(' ')).toMatch(/debt rise faster than income/i);
    expect(DALIO_RULES.join(' ')).toMatch(/productivity/i);
  });
});

describe('the three equilibriums', () => {
  it('neutral dials leave all three in equilibrium', () => {
    for (const e of equilibriumReads(NEUTRAL, 4)) expect(e.status).toBe('balanced');
  });

  it('QE + stimulus: debt outruns income and premiums stretch (the 2009–2021 read)', () => {
    const f = scenario('easy-money'); // [+1, +1, -2, +1]
    expect(eq(f, 'debt-income').status).toBe('above');
    expect(eq(f, 'risk-premiums').status).toBe('above');
    expect(eq(f, 'risk-premiums').read).toMatch(/risk curve/i);
  });

  it('overheating + hikes: the machine runs hot and premiums compress (the 2022 read)', () => {
    const f = scenario('overheating'); // [+1, +2, +2, 0]
    expect(eq(f, 'operating-rate').status).toBe('above');
    expect(eq(f, 'risk-premiums').status).toBe('below');
    expect(eq(f, 'debt-income').status).toBe('below'); // credit draining is the medicine
  });

  it('recession: too cold; stagflation: torn between both mandates', () => {
    expect(eq(scenario('recession'), 'operating-rate').status).toBe('below');
    expect(eq(scenario('stagflation'), 'operating-rate').status).toBe('torn');
  });

  it('every read carries a rule, a live reading, and a restoring force', () => {
    for (const f of [NEUTRAL, scenario('goldilocks'), scenario('supply-shock')]) {
      for (const e of equilibriumReads(f, 4)) {
        expect(e.rule.length).toBeGreaterThan(20);
        expect(e.read.length).toBeGreaterThan(30);
        expect(e.restore.length).toBeGreaterThan(30);
      }
    }
  });

  it('the live risk-free rate appears in the premium reading', () => {
    expect(eq(NEUTRAL, 'risk-premiums').read).toContain('4%');
    expect(equilibriumReads(NEUTRAL, 5.5).find((e) => e.id === 'risk-premiums')!.read).toContain('5.5%');
  });
});

describe('watching the two levers', () => {
  it('reads both lever positions from the dials, with watch lists', () => {
    const lv = leverWatch(scenario('overheating'));
    expect(lv.find((l) => l.id === 'monetary')!.position).toMatch(/Tightening/);
    expect(lv.find((l) => l.id === 'fiscal')!.position).toMatch(/neutral/i);
    for (const l of lv) {
      expect(l.watchFor.length).toBeGreaterThanOrEqual(3);
      expect(l.transmission.length).toBeGreaterThan(40);
    }
  });

  it('classifies the interplay: together, offset, alone, idle', () => {
    expect(leverInterplay(scenario('recession')).name).toMatch(/Both levers pushing/);
    expect(leverInterplay({ growth: 0, inflation: 0, policy: 2, fiscal: 1 }).name).toMatch(/Offset/);
    expect(leverInterplay(scenario('overheating')).name).toMatch(/Braking alone/);
    expect(leverInterplay(NEUTRAL).name).toMatch(/idle/i);
  });
});
