import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DILUTION_INPUTS,
  SECTOR_IPO_SOURCE,
  SECTOR_IPO_TRENDS,
  SECTOR_IPO_YEARS,
  sectorIpoRows,
  FINANCING_MENU,
  IPO_REFERENCE,
  THREE_SCORES_RULE,
  WINDOW_CHECKLISTS,
  dilution,
  windowScore,
} from '../lib/ipoWindow';

describe('the IPO reference context', () => {
  it('carries the cited EY numbers, labeled as period-bound reference data', () => {
    const all = IPO_REFERENCE.facts.join(' ');
    expect(all).toContain('62 US IPOs');
    expect(all).toContain('34');
    expect(all).toContain('12 US deals');
    expect(all).toMatch(/~47%/);
    expect(all).toContain('$68.5B');
    expect(IPO_REFERENCE.period).toMatch(/refresh before treating as current/i);
    expect(IPO_REFERENCE.source).toMatch(/EY/);
  });
});

describe('IPO by sector over time (spec §76)', () => {
  it('covers seven sector lines across six periods, honestly labeled', () => {
    expect(SECTOR_IPO_YEARS).toEqual(['2021', '2022', '2023', '2024', '2025', 'H1 2026']);
    expect(SECTOR_IPO_TRENDS).toHaveLength(7);
    for (const t of SECTOR_IPO_TRENDS) {
      expect(t.counts).toHaveLength(6);
      expect(t.note.length).toBeGreaterThan(40);
    }
    expect(SECTOR_IPO_SOURCE).toMatch(/APPROXIMATE TEACHING VALUES/);
    expect(SECTOR_IPO_SOURCE).toMatch(/half year/i);
  });

  it('honors the cited anchors: overall H1-26 = 62; biotech 2025 ≈ −47% vs 2024', () => {
    const by = (id: string) => SECTOR_IPO_TRENDS.find((t) => t.id === id)!;
    expect(by('overall').counts[5]).toBe(62);
    const biotech = by('biotech');
    const decline = (biotech.counts[4] - biotech.counts[3]) / biotech.counts[3];
    expect(decline).toBeLessThan(-0.4);
    expect(decline).toBeGreaterThan(-0.55);
  });

  it('teaches the three shapes: 2022 is every sector’s trough, AI’s half-year beats its every full year, consumer stays flat', () => {
    for (const t of SECTOR_IPO_TRENDS) {
      // 2022 is the trough among FULL years (H1 2026 is a half year and can't be compared as a level)
      // — for every sector EXCEPT biotech, whose slide continued to a 2025 trough: the divergence itself.
      const fullYearMin = Math.min(...t.counts.slice(0, 5));
      if (t.id === 'biotech') expect(fullYearMin).toBe(t.counts[4]);
      else expect(fullYearMin).toBe(t.counts[1]);
    }
    const ai = SECTOR_IPO_TRENDS.find((t) => t.id === 'ai')!;
    expect(ai.counts[5]).toBe(Math.max(...ai.counts));
    const consumer = SECTOR_IPO_TRENDS.find((t) => t.id === 'consumer')!;
    expect(Math.max(...consumer.counts.slice(1))).toBeLessThan(consumer.counts[0] / 2);
  });

  it('chart rows carry every sector keyed by id', () => {
    const rows = sectorIpoRows();
    expect(rows).toHaveLength(6);
    for (const t of SECTOR_IPO_TRENDS) expect(rows[0][t.id]).toBe(t.counts[0]);
  });
});

describe('the three windows', () => {
  it('keeps market, industry, and company as separate checklists with separate scores', () => {
    expect(WINDOW_CHECKLISTS.map((l) => l.id)).toEqual(['market', 'industry', 'company']);
    for (const l of WINDOW_CHECKLISTS) {
      expect(l.items.length).toBeGreaterThanOrEqual(5);
      for (const i of l.items) expect(i.why.length).toBeGreaterThan(20);
    }
    expect(THREE_SCORES_RULE).toMatch(/Do NOT collapse/i);
  });

  it('scores deterministically as checked ÷ total, with plain-language reads', () => {
    const market = WINDOW_CHECKLISTS[0];
    const all = windowScore(market, market.items.map((i) => i.id));
    expect(all.scorePct).toBe(100);
    expect(all.read).toBe('open / ready');
    const none = windowScore(market, []);
    expect(none.scorePct).toBe(0);
    expect(none.read).toBe('closed / not ready');
    const some = windowScore(market, [market.items[0].id, market.items[1].id]);
    expect(some.scorePct).toBe(40);
    expect(some.read).toMatch(/mixed/);
  });

  it('the H1-2026 defaults encode the divergence: market mostly open, industry mostly shut', () => {
    const score = (id: string) => {
      const l = WINDOW_CHECKLISTS.find((x) => x.id === id)!;
      return windowScore(l, l.items.filter((i) => i.defaultChecked).map((i) => i.id)).scorePct;
    };
    expect(score('market')).toBeGreaterThanOrEqual(70);
    expect(score('industry')).toBeLessThan(50);
    expect(score('company')).toBe(0);
  });
});

describe('dilution math (spec §80)', () => {
  it('the base case: pre 900 + primary 100 → post 1,000, new investors own 10%', () => {
    const r = dilution(DEFAULT_DILUTION_INPUTS);
    expect(r.postMoney).toBe(1000);
    expect(r.sharePrice).toBe(10); // 900 ÷ 90
    expect(r.newShares).toBe(10); // 100 ÷ $10
    expect(r.newOwnershipPct).toBe(10); // 10 ÷ 100
    // greenshoe adds shares → more dilution
    expect(r.newSharesWithShoe).toBeCloseTo(11.5, 2);
    expect(r.newOwnershipWithShoePct).toBeGreaterThan(r.newOwnershipPct);
  });

  it('secondary sales never change dilution — only primary creates shares', () => {
    const withSecondary = dilution(DEFAULT_DILUTION_INPUTS);
    const withoutSecondary = dilution({ ...DEFAULT_DILUTION_INPUTS, secondarySold: 0 });
    expect(withSecondary.newOwnershipPct).toBe(withoutSecondary.newOwnershipPct);
    expect(withSecondary.postMoney).toBe(withoutSecondary.postMoney);
  });

  it('raising more primary dilutes more', () => {
    const small = dilution({ ...DEFAULT_DILUTION_INPUTS, primaryRaised: 50 });
    const big = dilution({ ...DEFAULT_DILUTION_INPUTS, primaryRaised: 300 });
    expect(big.newOwnershipPct).toBeGreaterThan(small.newOwnershipPct);
  });
});

describe('the financing menu', () => {
  it('covers the spec’s alternatives with cost and best-when for each', () => {
    expect(FINANCING_MENU.length).toBeGreaterThanOrEqual(7);
    const names = FINANCING_MENU.map((f) => f.name).join(' ');
    expect(names).toMatch(/IPO/);
    expect(names).toMatch(/Convertible/);
    expect(names).toMatch(/Royalty/);
    for (const f of FINANCING_MENU) {
      expect(f.cost.length).toBeGreaterThan(8); // "The company" is the M&A row's whole (intentional) answer
      expect(f.bestWhen.length).toBeGreaterThan(20);
    }
    // the §82 flag lives on the equity row
    expect(FINANCING_MENU.map((f) => f.cost).join(' ')).toMatch(/transfers value/i);
  });
});
