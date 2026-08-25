import { describe, expect, it } from 'vitest';
import {
  COUNTRY_DEBT,
  CURRENCY_TRENDS,
  GDP_IMPACT_COUNTRIES,
  GSP_IMPACT_STATES,
  KOREA_CASE,
  POPULISM_WATCH,
  TRADE_BALANCES,
  currencyRows,
  tradeBalanceB,
  COUNTRY_DEBT_SOURCE,
  DEBT_TREND_YEARS,
  GEO_CALENDAR_COUNTRIES,
  GEO_CALENDAR_NOTE,
  GEO_CALENDAR_STATES,
  GEO_CURRENT,
  GEO_DRIVERS,
  STATE_DEBT,
  STATE_DEBT_SOURCE,
} from '../lib/debtGeo';

describe('country debt-to-GDP', () => {
  it('covers ten large economies with four trend points each', () => {
    expect(COUNTRY_DEBT).toHaveLength(10);
    expect(DEBT_TREND_YEARS).toEqual([2000, 2010, 2020, 2025]);
    for (const c of COUNTRY_DEBT) {
      expect(c.trend).toHaveLength(4);
      for (const v of c.trend) expect(v).toBeGreaterThan(10);
      expect(c.note.length).toBeGreaterThan(40);
    }
  });

  it('teaches the right ordering: Japan highest, Germany the disciplinarian, the US ratchet visible', () => {
    const by = (id: string) => COUNTRY_DEBT.find((c) => c.id === id)!;
    const latest = (id: string) => by(id).trend[3];
    expect(latest('japan')).toBeGreaterThan(latest('italy'));
    expect(latest('italy')).toBeGreaterThan(latest('us'));
    expect(latest('germany')).toBeLessThan(latest('france'));
    // the US more than doubled since 2000
    expect(latest('us')).toBeGreaterThan(by('us').trend[0] * 2);
    // China is the fastest ratchet in multiples
    expect(latest('china') / by('china').trend[0]).toBeGreaterThan(3);
    // honesty labels
    expect(COUNTRY_DEBT_SOURCE).toMatch(/APPROXIMATE TEACHING VALUES/);
  });
});

describe('US state debt', () => {
  it('covers the top-10 state economies with the pension layer on every row', () => {
    expect(STATE_DEBT).toHaveLength(10);
    expect(STATE_DEBT.map((s) => s.gdpRank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const st of STATE_DEBT) {
      expect(st.debtGspPct).toBeGreaterThan(0);
      expect(st.debtGspPct).toBeLessThan(20); // balanced-budget rules cap bonded debt
      expect(st.pensionNote.length).toBeGreaterThan(15); // Ohio's is deliberately short
    }
    expect(STATE_DEBT_SOURCE).toMatch(/INTERNAL TEACHING ESTIMATES/);
    expect(STATE_DEBT_SOURCE).toMatch(/pension/i);
  });

  it('the teaching cases: NY highest bonded, IL/NJ carry the pension warnings, GA the benchmark', () => {
    const by = (id: string) => STATE_DEBT.find((s) => s.id === id)!;
    const maxDebt = Math.max(...STATE_DEBT.map((s) => s.debtGspPct));
    expect(by('ny').debtGspPct).toBe(maxDebt);
    expect(by('il').pensionNote).toMatch(/worst-funded/i);
    expect(by('nj').pensionNote).toMatch(/pension hole/i);
    expect(by('ga').debtGspPct).toBe(Math.min(...STATE_DEBT.map((s) => s.debtGspPct)));
  });
});

describe('trade, currency, and the Korea case', () => {
  it('trade covers the top-10 countries plus South Korea, balances computed with the right signs', () => {
    expect(TRADE_BALANCES).toHaveLength(11);
    const bal = (id: string) => tradeBalanceB(TRADE_BALANCES.find((t) => t.id === id)!);
    // surpluses and deficits land where the world puts them
    expect(bal('china')).toBeGreaterThan(0);
    expect(bal('germany')).toBeGreaterThan(0);
    expect(bal('skorea')).toBeGreaterThan(0);
    expect(bal('us')).toBeLessThan(0);
    expect(bal('india')).toBeLessThan(0);
    // the US runs the largest deficit, China the largest surplus
    const balances = TRADE_BALANCES.map(tradeBalanceB);
    expect(Math.min(...balances)).toBe(bal('us'));
    expect(Math.max(...balances)).toBe(bal('china'));
  });

  it('currency trends: all start at 100; the won and yen are the weakest; rows chart-ready', () => {
    for (const c of CURRENCY_TRENDS) expect(c.index[0]).toBe(100);
    const last = (id: string) => CURRENCY_TRENDS.find((c) => c.id === id)!.index[5];
    const lasts = CURRENCY_TRENDS.map((c) => c.index[5]).sort((a, b) => a - b);
    expect([last('jpy'), last('krw')].sort((a, b) => a - b)).toEqual(lasts.slice(0, 2));
    const rows = currencyRows();
    expect(rows).toHaveLength(6);
    expect(rows[0]['krw']).toBe(100);
  });

  it('the Korea case carries the chain: politics → outflows → won → BoK bind, with the cited anchors', () => {
    const all = [...KOREA_CASE.facts, ...KOREA_CASE.chain, KOREA_CASE.lesson].join(' ');
    expect(all).toMatch(/1,470/);
    expect(all).toMatch(/martial-law/i);
    expect(all).toMatch(/Korea discount/i);
    expect(all).toMatch(/weakest since (the )?2009/i);
    expect(KOREA_CASE.chain.length).toBeGreaterThanOrEqual(5);
  });

  it('populism watch covers ten countries with pipeline and impact per row', () => {
    expect(POPULISM_WATCH).toHaveLength(10);
    for (const r of POPULISM_WATCH) {
      expect(r.fiscalPipeline.length).toBeGreaterThan(30);
      expect(r.impact.length).toBeGreaterThan(30);
    }
    expect(POPULISM_WATCH.find((r) => r.country === 'South Korea')!.pressure).toBe('acute');
  });

  it('the GDP/GSP impact watch is keyed to the SAME top-10 lists, all three channels filled', () => {
    expect(GDP_IMPACT_COUNTRIES.map((r) => r.id).sort()).toEqual(COUNTRY_DEBT.map((c) => c.id).sort());
    expect(GSP_IMPACT_STATES.map((r) => r.id).sort()).toEqual(STATE_DEBT.map((c) => c.id).sort());
    for (const r of [...GDP_IMPACT_COUNTRIES, ...GSP_IMPACT_STATES]) {
      expect(r.health.length).toBeGreaterThan(20);
      expect(r.food.length).toBeGreaterThan(15);
      expect(r.education.length).toBeGreaterThan(15);
      expect(r.read.length).toBeGreaterThan(30);
    }
  });
});

describe('the geopolitics layer', () => {
  it('lists current movers, sourced to the cited outlooks', () => {
    expect(GEO_CURRENT.length).toBeGreaterThanOrEqual(6);
    const all = GEO_CURRENT.join(' ');
    expect(all).toMatch(/tariff/i);
    expect(all).toMatch(/US–China|US-China/);
    expect(all).toMatch(/\$40T/);
  });

  it('the standing driver list maps each driver to the dial it hits first', () => {
    expect(GEO_DRIVERS.length).toBeGreaterThanOrEqual(12);
    for (const d of GEO_DRIVERS) {
      expect(d.what.length).toBeGreaterThan(20);
      expect(d.hits.length).toBeGreaterThan(20);
    }
    expect(GEO_DRIVERS.map((d) => d.name).join(' ')).toMatch(/Elections.*Tariffs.*reserve/is);
  });

  it('the 24-month calendar covers countries and states, anchored to schedules not predictions', () => {
    expect(GEO_CALENDAR_COUNTRIES.length).toBeGreaterThanOrEqual(8);
    const countries = GEO_CALENDAR_COUNTRIES.map((e) => `${e.when} ${e.where} ${e.what}`).join(' ');
    expect(countries).toMatch(/Nov 2026 United States Midterm/);
    expect(countries).toMatch(/Nov 2028 United States Presidential/);
    expect(countries).toMatch(/France/);
    expect(countries).toMatch(/Brazil/);
    const states = GEO_CALENDAR_STATES.map((e) => `${e.where} ${e.what}`).join(' ');
    expect(states).toMatch(/California.*Gubernatorial/s);
    expect(states).toMatch(/pension/i);
    expect(GEO_CALENDAR_NOTE).toMatch(/verify before citing/i);
    for (const e of [...GEO_CALENDAR_COUNTRIES, ...GEO_CALENDAR_STATES]) expect(e.why.length).toBeGreaterThan(20);
  });
});
