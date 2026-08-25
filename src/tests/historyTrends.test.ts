import { describe, expect, it } from 'vitest';
import {
  GDP_QUARTERLY,
  GDP_SOURCE,
  HISTORY_SOURCE,
  HISTORY_STORIES,
  MACRO_HISTORY,
  historyRows,
  monthlyHistory,
  quarterlyHistory,
} from '../lib/historyTrends';
import { INFLATION_SNAPSHOT } from '../lib/marketSnapshot';
import { CUTS_VS_TENYEAR, RATES_SNAPSHOT } from '../lib/ratesCurve';

const by = (id: string) => MACRO_HISTORY.find((s) => s.id === id)!;
const lastAnchor = (id: string) => by(id).anchors[by(id).anchors.length - 1];

describe('history anchors agree with the Lab’s snapshots (one source of truth)', () => {
  it('the latest anchors match tab 3 / tab 11 / tab 12 snapshots exactly', () => {
    expect(lastAnchor('cpi').value).toBe(INFLATION_SNAPSHOT.headlineCpi);
    expect(lastAnchor('fedmid').value).toBe(RATES_SNAPSHOT.fedFundsMidPct);
    expect(lastAnchor('teny').value).toBe(RATES_SNAPSHOT.curve.find((c) => c.maturity === '10Y')!.yieldPct);
    expect(lastAnchor('pmms').value).toBe(RATES_SNAPSHOT.mortgage30Pct);
  });

  it('the fed and 10Y monthly lines reproduce every CUTS_VS_TENYEAR divergence point', () => {
    const M: Record<string, string> = { Sep: '09', Nov: '11', Jan: '01', Jun: '06', Dec: '12', Apr: '04', Aug: '08' };
    const fed = monthlyHistory(by('fedmid'));
    const ten = monthlyHistory(by('teny'));
    for (const row of CUTS_VS_TENYEAR) {
      const [mon, yy] = row.label.split(' ');
      const ym = `20${yy}-${M[mon]}`;
      expect(fed.find((p) => p.ym === ym)!.value).toBe(row.fed);
      expect(ten.find((p) => p.ym === ym)!.value).toBe(row.tenYear);
    }
  });

  it('the divergence is in the data: since Sep-2024 the Fed fell ~175bp while the 10Y rose ~105bp', () => {
    const fed = monthlyHistory(by('fedmid'));
    const ten = monthlyHistory(by('teny'));
    const at = (pts: typeof fed, ym: string) => pts.find((p) => p.ym === ym)!.value;
    expect(Math.round((at(fed, '2024-09') - at(fed, '2026-08')) * 100)).toBe(175);
    expect(Math.round((at(ten, '2026-08') - at(ten, '2024-09')) * 100)).toBe(105);
  });
});

describe('interpolation and aggregation are computed, not typed', () => {
  it('months between anchors interpolate linearly; anchor months are flagged', () => {
    const cpi = monthlyHistory(by('cpi'));
    // 2022-01 (7.5) → 2022-06 (9.1): 5 steps of +0.32
    expect(cpi.find((p) => p.ym === '2022-03')!.value).toBeCloseTo(7.5 + 2 * 0.32, 2);
    expect(cpi.find((p) => p.ym === '2022-06')!.anchored).toBe(true);
    expect(cpi.find((p) => p.ym === '2022-03')!.anchored).toBe(false);
    // continuous month coverage from first to last anchor, no gaps
    expect(cpi[0].ym).toBe('2022-01');
    expect(cpi[cpi.length - 1].ym).toBe('2026-07');
    expect(cpi).toHaveLength(55);
  });

  it('quarterly is the mean of the quarter’s months', () => {
    const cpi = monthlyHistory(by('cpi'));
    const q1 = cpi.filter((p) => ['2022-01', '2022-02', '2022-03'].includes(p.ym));
    const mean = Math.round((q1.reduce((a, b) => a + b.value, 0) / 3) * 100) / 100;
    expect(quarterlyHistory(by('cpi')).find((p) => p.q === 'Q1 22')!.value).toBe(mean);
  });

  it('historyRows merges selected series chart-ready at both frequencies', () => {
    const m = historyRows(['cpi', 'teny'], 'monthly');
    expect(m[0].x).toBe('Jan 22');
    expect(m[0].cpi).toBe(7.5);
    expect(m[0].teny).toBe(1.8);
    const q = historyRows(['fedmid'], 'quarterly');
    expect(q.length).toBeGreaterThan(16);
    expect(historyRows([], 'monthly')).toEqual([]);
  });
});

describe('GDP quarterly and the honesty labels', () => {
  it('carries the arc: negative 2022 opener, the 4.9 blowout, the 1.5 slowdown matching the snapshots', () => {
    expect(GDP_QUARTERLY[0]).toMatchObject({ q: 'Q1 22', value: -1.6 });
    expect(GDP_QUARTERLY.find((g) => g.q === 'Q3 23')!.value).toBe(4.9);
    const last = GDP_QUARTERLY[GDP_QUARTERLY.length - 1];
    expect(last.q).toBe('Q2 26');
    expect(last.value).toBe(1.5);
    expect(GDP_QUARTERLY.find((g) => g.q === 'Q1 26')!.value).toBe(1.9); // the revised vintage, per tab 17
    expect(GDP_QUARTERLY).toHaveLength(18);
  });

  it('sources declare anchors-vs-interpolation and teaching values; stories cover the divergence and the freq lesson', () => {
    expect(HISTORY_SOURCE).toMatch(/ANCHORED OFFICIAL PRINTS/);
    expect(HISTORY_SOURCE).toMatch(/LINEAR TEACHING INTERPOLATION/);
    expect(GDP_SOURCE).toMatch(/APPROXIMATE TEACHING VALUES/);
    expect(HISTORY_STORIES.length).toBeGreaterThanOrEqual(5);
    const all = HISTORY_STORIES.join(' ');
    expect(all).toMatch(/175bp/);
    expect(all).toMatch(/9\.1%/);
    expect(all).toMatch(/Monthly vs quarterly/i);
  });
});
