import { describe, expect, it } from 'vitest';
import {
  ACTIVE_CONFLICTS,
  BRI_FACTS,
  CHOKEPOINTS,
  ROUTES_SOURCE,
  TRADE_CORRIDORS,
  ALLIANCE_STRUCTURE,
  FLASHPOINTS,
  GEOPOLITICS_SOURCE,
  GEO_EXPOSURE_COUNTRIES,
  GEO_EXPOSURE_INDUSTRIES,
  GEO_EXPOSURE_STATES,
  INSTITUTIONS,
  MILITARY_ECON_READS,
  MILITARY_SOURCE,
  RECENT_WINDOW,
  RECENT_WINDOW_LABEL,
  TWO_DECADE_TIMELINE,
  US_SUMMIT_HISTORY,
} from '../lib/geoPolitics';
import { REPORT_COUNTRIES, REPORT_INDUSTRIES, REPORT_STATES } from '../lib/reportBuilder';
import { ALL_BILATERAL, ALL_COUNTRY_EXPOSURE, ALL_COUNTRY_ROUTES, ALL_MILITARY, EXTRA_COUNTRY_PROFILES, US_COUNTER_PROGRAM, STATE_CURRENT_EVENTS, chokepointsFor, corridorsFor, routeProgramFor } from '../lib/geoPolitics';

describe('flashpoints', () => {
  it('cover the named theaters with economics, watch items, and valid country/industry keys', () => {
    const ids = FLASHPOINTS.map((f) => f.id);
    for (const want of ['taiwan', 'islands', 'iran', 'venezuela', 'sanctions', 'ai-chips', 'space']) {
      expect(ids).toContain(want);
    }
    const countryIds = new Set(REPORT_COUNTRIES.map((c) => c.id));
    const industryIds = new Set(REPORT_INDUSTRIES.map((i) => i.id));
    for (const f of FLASHPOINTS) {
      expect(f.status.length).toBeGreaterThan(80);
      expect(f.economics.length).toBeGreaterThan(80);
      expect(f.watch.length).toBeGreaterThan(40);
      for (const c of f.countries) expect(countryIds.has(c)).toBe(true);
      for (const i of f.industries) expect(industryIds.has(i)).toBe(true);
    }
    const by = (id: string) => FLASHPOINTS.find((f) => f.id === id)!;
    expect(by('taiwan').economics).toMatch(/TSMC/);
    expect(by('islands').status).toMatch(/nine-dash|2016 Hague/i);
    expect(by('iran').economics).toMatch(/Hormuz/);
    expect(by('ai-chips').economics).toMatch(/data.center/i);
    expect(by('sanctions').economics).toMatch(/gold/i);
  });
});

describe('institutions and summits', () => {
  it('covers WTO/G7/G20/BRICS with status and members from the report list', () => {
    expect(INSTITUTIONS.map((i) => i.id).sort()).toEqual(['brics', 'g20', 'g7', 'wto']);
    const countryIds = new Set(REPORT_COUNTRIES.map((c) => c.id));
    for (const inst of INSTITUTIONS) {
      expect(inst.status.length).toBeGreaterThan(80);
      for (const m of inst.members) expect(countryIds.has(m)).toBe(true);
    }
    expect(INSTITUTIONS.find((i) => i.id === 'wto')!.status).toMatch(/Appellate Body/);
    expect(INSTITUTIONS.find((i) => i.id === 'g7')!.members).toHaveLength(7);
  });

  it('the two-decade summit ledger runs 2001 → 2026 with results and reads', () => {
    expect(US_SUMMIT_HISTORY.length).toBeGreaterThanOrEqual(11);
    expect(US_SUMMIT_HISTORY[0].when).toBe('2001');
    expect(US_SUMMIT_HISTORY[US_SUMMIT_HISTORY.length - 1].when).toMatch(/2026/);
    const all = US_SUMMIT_HISTORY.map((s) => `${s.what} ${s.result}`).join(' ');
    expect(all).toMatch(/WTO/);
    expect(all).toMatch(/Phase One/);
    expect(all).toMatch(/AUKUS/);
    expect(all).toMatch(/Bali/);
    for (const s of US_SUMMIT_HISTORY) {
      expect(s.result.length).toBeGreaterThan(30);
      expect(s.read.length).toBeGreaterThan(30);
    }
    // the illustrative boundary is disclosed on the 2026 entry
    expect(US_SUMMIT_HISTORY[US_SUMMIT_HISTORY.length - 1].read).toMatch(/ILLUSTRATIVE/);
  });
});

describe('recent window and timeline', () => {
  it('the ~9-month digest is labeled illustrative and ends at the snapshot month', () => {
    expect(RECENT_WINDOW_LABEL).toMatch(/ILLUSTRATIVE/);
    expect(RECENT_WINDOW.length).toBeGreaterThanOrEqual(7);
    expect(RECENT_WINDOW[0].when).toMatch(/Dec 2025/);
    expect(RECENT_WINDOW[RECENT_WINDOW.length - 1].when).toMatch(/Aug 2026/);
    for (const r of RECENT_WINDOW) expect(r.impact.length).toBeGreaterThan(40);
  });

  it('the two-decade timeline spans 2005→2026 and carries the GFC, COVID, and inflation-shock regimes', () => {
    expect(TWO_DECADE_TIMELINE.length).toBeGreaterThanOrEqual(11);
    expect(TWO_DECADE_TIMELINE[0].period).toBe('2005–07');
    const all = TWO_DECADE_TIMELINE.map((t) => `${t.period} ${t.event}`).join(' ');
    expect(all).toMatch(/2008–09/);
    expect(all).toMatch(/COVID/);
    expect(all).toMatch(/9\.1%/);
    for (const t of TWO_DECADE_TIMELINE) expect(t.lesson.length).toBeGreaterThan(30);
  });
});

describe('exposure maps key to the SAME lens lists', () => {
  it('country, state, and industry exposures cover every id exactly once', () => {
    expect(ALL_COUNTRY_EXPOSURE.map((g) => g.id).sort()).toEqual(REPORT_COUNTRIES.map((c) => c.id).sort());
    expect(GEO_EXPOSURE_STATES.map((g) => g.id).sort()).toEqual(REPORT_STATES.map((s) => s.id).sort());
    expect(GEO_EXPOSURE_INDUSTRIES.map((g) => g.id).sort()).toEqual(REPORT_INDUSTRIES.map((i) => i.id).sort());
    for (const g of [...GEO_EXPOSURE_COUNTRIES, ...GEO_EXPOSURE_STATES, ...GEO_EXPOSURE_INDUSTRIES]) {
      expect(g.headline.length).toBeGreaterThan(10);
      expect(g.items.length).toBeGreaterThanOrEqual(2);
      for (const item of g.items) expect(item.length).toBeGreaterThan(30);
    }
  });

  it('the teaching cases land: Korea max exposure, Virginia-free state list uses real state stories', () => {
    expect(GEO_EXPOSURE_COUNTRIES.find((g) => g.id === 'skorea')!.items.join(' ')).toMatch(/export-control/i);
    expect(GEO_EXPOSURE_STATES.find((g) => g.id === 'oh')!.items.join(' ')).toMatch(/Intel/);
    expect(GEO_EXPOSURE_STATES.find((g) => g.id === 'fl')!.items.join(' ')).toMatch(/Canaveral/);
    expect(GEO_EXPOSURE_INDUSTRIES.find((g) => g.id === 'utilities')!.items.join(' ')).toMatch(/data.center/i);
  });
});

describe('the military layer', () => {
  it('covers all eleven countries with budget, %GDP, alignment, and nuclear status', () => {
    expect(ALL_MILITARY.map((m) => m.id).sort()).toEqual(REPORT_COUNTRIES.map((c) => c.id).sort());
    for (const m of ALL_MILITARY) {
      expect(m.budgetB).toBeGreaterThan(0);
      expect(m.pctGdp).toBeGreaterThan(0.5);
      expect(m.pctGdp).toBeLessThan(10); // Russia's war economy and Saudi run 6-7%
      expect(m.note.length).toBeGreaterThan(50);
    }
    const by = (id: string) => ALL_MILITARY.find((m) => m.id === id)!;
    expect(by('us').budgetB).toBe(Math.max(...ALL_MILITARY.map((m) => m.budgetB)));
    expect(by('us').alignment).toBe('self');
    expect(by('china').alignment).toBe('adversary');
    expect(by('russia').alignment).toBe('adversary');
    expect(by('taiwan').alignment).toBe('ally');
    expect(by('saudi').alignment).toBe('swing');
    expect(by('india').alignment).toBe('swing');
    expect(by('japan').alignment).toBe('ally');
    // nuclear roster: US, China, UK, France, India + Russia from the strategic six
    expect(ALL_MILITARY.filter((m) => m.nuclear).map((m) => m.id).sort()).toEqual(['china', 'france', 'india', 'russia', 'uk', 'us']);
    expect(MILITARY_SOURCE).toMatch(/APPROXIMATE TEACHING VALUES/);
  });

  it('conflicts and alliances carry the market channel, and the reads name the three channels', () => {
    expect(ACTIVE_CONFLICTS.length).toBeGreaterThanOrEqual(6);
    const names = ACTIVE_CONFLICTS.map((c) => c.name).join(' ');
    expect(names).toMatch(/Ukraine/);
    expect(names).toMatch(/Red Sea/);
    expect(names).toMatch(/Korean/);
    for (const c of ACTIVE_CONFLICTS) expect(c.marketChannel.length).toBeGreaterThan(50);
    expect(ALLIANCE_STRUCTURE.length).toBe(4);
    expect(ALLIANCE_STRUCTURE.map((a) => a.name).join(' ')).toMatch(/NATO.*Indo-Pacific.*no limits.*non-aligned/s);
    expect(MILITARY_ECON_READS.join(' ')).toMatch(/commodities.*budgets.*tails/s);
    expect(GEOPOLITICS_SOURCE).toMatch(/ILLUSTRATIVE/);
  });
});

describe('Belt and Road, corridors & chokepoints', () => {
  it('BRI facts carry the essentials: 2013 launch, ~$1T scale, the port chain, the Malacca dilemma, the finance read', () => {
    const all = BRI_FACTS.join(' ');
    expect(all).toMatch(/2013/);
    expect(all).toMatch(/\$1 trillion/);
    expect(all).toMatch(/Hambantota/);
    expect(all).toMatch(/Piraeus/);
    expect(all).toMatch(/Malacca dilemma/i);
    expect(all).toMatch(/largest official creditor/i);
    expect(BRI_FACTS.length).toBeGreaterThanOrEqual(5);
  });

  it('corridors cover the BRI legs AND the rivals; chokepoints cover the five gates', () => {
    const names = TRADE_CORRIDORS.map((c) => c.name).join(' ');
    expect(names).toMatch(/Maritime Silk Road/);
    expect(names).toMatch(/Railway Express/);
    expect(names).toMatch(/CPEC/);
    expect(names).toMatch(/IMEC/);
    expect(names).toMatch(/Global Gateway/);
    expect(names).toMatch(/Lobito/);
    expect(names).toMatch(/Northern Sea Route/);
    for (const c of TRADE_CORRIDORS) {
      expect(c.what.length).toBeGreaterThan(60);
      expect(c.watch.length).toBeGreaterThan(30);
    }
    expect(CHOKEPOINTS.map((c) => c.name).join(' ')).toMatch(/Malacca.*Hormuz.*Suez.*Panama.*Taiwan/s);
    for (const c of CHOKEPOINTS) expect(c.issue.length).toBeGreaterThan(40);
  });

  it('country routes cover the same eleven ids, with the teaching cases in place', () => {
    expect(ALL_COUNTRY_ROUTES.map((r) => r.id).sort()).toEqual(REPORT_COUNTRIES.map((c) => c.id).sort());
    const by = (id: string) => ALL_COUNTRY_ROUTES.find((r) => r.id === id)!;
    expect(by('china').items.join(' ')).toMatch(/\$1T.*Piraeus.*Gwadar/s);
    expect(by('italy').items.join(' ')).toMatch(/2019.*exited December 2023/s);
    expect(by('india').items.join(' ')).toMatch(/Refused the BRI/i);
    expect(by('brazil').items.join(' ')).toMatch(/membership is paperwork; route dependence is physics/i);
    for (const r of ALL_COUNTRY_ROUTES) {
      expect(r.items.length).toBeGreaterThanOrEqual(3);
      for (const item of r.items) expect(item.length).toBeGreaterThan(40);
    }
    expect(ROUTES_SOURCE).toMatch(/verify/i);
  });
});

describe('lens-aware routes, bilaterals, and state events', () => {
  it('route programs switch by country: China gets the BRI, the US gets the counter-network, others their position', () => {
    expect(routeProgramFor('china', 'China').facts).toEqual(BRI_FACTS);
    expect(routeProgramFor('us', 'United States').facts).toEqual(US_COUNTER_PROGRAM);
    expect(US_COUNTER_PROGRAM.join(' ')).toMatch(/small yard, high fence/i);
    expect(routeProgramFor('japan', 'Japan').facts.length).toBeGreaterThanOrEqual(3);
    expect(routeProgramFor('iran', 'Iran').facts.join(' ')).toMatch(/INSTC|Hormuz/);
  });

  it('every country on the lens hits at least one corridor or chokepoint; corridor/chokepoint ids are valid', () => {
    const ids = new Set(REPORT_COUNTRIES.map((c) => c.id));
    for (const c of TRADE_CORRIDORS) for (const i of c.involves) expect(ids.has(i)).toBe(true);
    for (const c of CHOKEPOINTS) for (const i of c.relevantTo) expect(ids.has(i)).toBe(true);
    for (const c of REPORT_COUNTRIES) {
      expect(corridorsFor(c.id).length + chokepointsFor(c.id).length).toBeGreaterThanOrEqual(1);
    }
    expect(TRADE_CORRIDORS.map((c) => c.name).join(' ')).toMatch(/INSTC/);
    expect(TRADE_CORRIDORS.map((c) => c.name).join(' ')).toMatch(/Chancay/);
  });

  it('bilateral arcs cover every non-US country with dated entries and a today read', () => {
    expect(ALL_BILATERAL.map((b) => b.id).sort()).toEqual(
      REPORT_COUNTRIES.filter((c) => c.id !== 'us').map((c) => c.id).sort(),
    );
    for (const b of ALL_BILATERAL) {
      expect(b.arc.length).toBeGreaterThanOrEqual(3);
      expect(b.today.length).toBeGreaterThan(60);
      for (const m of b.arc) {
        expect(m.result.length).toBeGreaterThan(20);
        expect(m.read.length).toBeGreaterThan(20);
      }
    }
    expect(ALL_BILATERAL.find((b) => b.id === 'japan')!.arc.map((m) => m.what).join(' ')).toMatch(/Camp David|Nippon Steel/);
    expect(ALL_BILATERAL.find((b) => b.id === 'iran')!.arc.map((m) => m.what).join(' ')).toMatch(/JCPOA/);
    expect(ALL_BILATERAL.find((b) => b.id === 'skorea')!.arc.map((m) => m.what).join(' ')).toMatch(/KORUS|IRA/);
  });

  it('state current events cover the same ten states with real stories', () => {
    expect(STATE_CURRENT_EVENTS.map((e) => e.id).sort()).toEqual(REPORT_STATES.map((st) => st.id).sort());
    for (const e of STATE_CURRENT_EVENTS) {
      expect(e.items.length).toBeGreaterThanOrEqual(3);
      for (const item of e.items) expect(item.length).toBeGreaterThan(40);
    }
    expect(STATE_CURRENT_EVENTS.find((e) => e.id === 'ca')!.items.join(' ')).toMatch(/ballot|initiative/i);
    expect(STATE_CURRENT_EVENTS.find((e) => e.id === 'fl')!.items.join(' ')).toMatch(/insurance/i);
  });

  it('the strategic six carry profiles and full-route rows', () => {
    expect(EXTRA_COUNTRY_PROFILES.map((x) => x.id).sort()).toEqual(['iran', 'mexico', 'russia', 'saudi', 'taiwan', 'venezuela']);
    expect(ALL_COUNTRY_ROUTES.map((r) => r.id).sort()).toEqual(REPORT_COUNTRIES.map((c) => c.id).sort());
  });
});
