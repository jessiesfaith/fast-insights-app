import { describe, expect, it } from 'vitest';
import {
  DATA_MODES,
  FRESHNESS_BUDGET_DAYS,
  OBSERVATIONS,
  PROVIDER_REGISTRY,
  SERIES_CATALOG,
  STORE_AS_OF,
  latestObservation,
  observationsFor,
  staleness,
} from '../lib/observationStore';

describe('the observation store', () => {
  it('every cataloged series has at least one observation, and every observation a cataloged series', () => {
    const ids = new Set(SERIES_CATALOG.map((m) => m.seriesId));
    for (const m of SERIES_CATALOG) expect(observationsFor(m.seriesId).length).toBeGreaterThan(0);
    for (const o of OBSERVATIONS) expect(ids.has(o.seriesId)).toBe(true);
  });

  it('the store agrees with the tabs: CPI 3.4, 10Y 4.70, PMMS 6.65, spread 196, breakeven 2.32', () => {
    expect(latestObservation('CPI_YOY')!.value).toBe(3.4);
    expect(latestObservation('UST10Y')!.value).toBe(4.7);
    expect(latestObservation('MORTGAGE30')!.value).toBe(6.65);
    expect(latestObservation('MTG_10Y_SPREAD')!.value).toBe(196);
    expect(latestObservation('BREAKEVEN_10Y')!.value).toBe(2.32);
    expect(latestObservation('EFFR')!.value).toBe(3.63);
  });

  it('vintages are preserved: Q1 GDP keeps the advance AND the revision as separate rows', () => {
    const q1 = observationsFor('GDP_Q_ANN').filter((o) => o.observationDate === '2026-Q1');
    expect(q1).toHaveLength(2);
    expect(q1[0].revisionStatus).toBe('preliminary');
    expect(q1[0].value).toBe(2.1);
    expect(q1[1].revisionStatus).toBe('revised');
    expect(q1[1].value).toBe(1.9);
    // release dates differ — the vintage axis
    expect(q1[0].releaseDate).not.toBe(q1[1].releaseDate);
  });

  it('derived series name their parents; estimates are labeled', () => {
    for (const m of SERIES_CATALOG.filter((x) => x.category === 'derived')) {
      expect(m.derivedFrom).toBeTruthy();
      expect(m.tier).toBe(6);
    }
    expect(latestObservation('SOFR')!.revisionStatus).toBe('estimate');
  });

  it('staleness is computed against the store clock and the frequency budget', () => {
    const cpi = SERIES_CATALOG.find((m) => m.seriesId === 'CPI_YOY')!;
    const st = staleness(cpi);
    expect(st.stale).toBe(false); // July obs, 45-day monthly budget, store at 08-25
    // the same series read from a far-future clock goes stale — and says so
    const later = staleness(cpi, '2026-12-01');
    expect(later.stale).toBe(true);
    expect(later.daysOld).toBeGreaterThan(FRESHNESS_BUDGET_DAYS.monthly);
    // daily series observed 08-24 vs store 08-25 is fresh
    expect(staleness(SERIES_CATALOG.find((m) => m.seriesId === 'UST10Y')!).stale).toBe(false);
    expect(STORE_AS_OF).toBe('2026-08-25');
  });

  it('the switches are set per spec §6 and every provider is registered-off or local', () => {
    expect(DATA_MODES.API_MODE).toBe('OFF');
    expect(DATA_MODES.PAID_API_MODE).toBe('OFF');
    expect(DATA_MODES.FREE_PUBLIC_DATA_MODE).toBe('ON');
    expect(DATA_MODES.LOCAL_CACHE_MODE).toBe('ON');
    expect(PROVIDER_REGISTRY.length).toBeGreaterThanOrEqual(12);
    for (const pr of PROVIDER_REGISTRY) expect(['registered-off', 'local-cache']).toContain(pr.status);
    // Freddie/FRED lineage discipline: the source is Freddie, FRED is the aggregator
    const mtg = SERIES_CATALOG.find((m) => m.seriesId === 'MORTGAGE30')!;
    expect(mtg.sourceProvider).toMatch(/Freddie Mac/);
    expect(mtg.sourceProvider).toMatch(/FRED/);
  });
});
