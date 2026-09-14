// Pulse suggestion engine — the deterministic fallback behind the PulseBot
// widget. Asserts the plan always covers all five cadences, tool-specific
// rules fire, free-text wishes land in the roadmap, and model-returned plans
// are sanitized before rendering.

import { describe, expect, it } from 'vitest';
import {
  buildPlan,
  CADENCES,
  GUIDED_QUESTIONS,
  PORTFOLIO,
  PulseAnswers,
  sanitizePlan,
  toolIdsFromLabels,
} from '../lib/pulse';

const answers = (over: Partial<PulseAnswers> = {}): PulseAnswers => ({
  role: 'Bookkeeper',
  tools: [],
  pain: '',
  wish: '',
  ...over,
});

describe('buildPlan — baseline coverage', () => {
  it('always returns at least one suggestion in every cadence', () => {
    const plan = buildPlan(answers());
    for (const cadence of CADENCES) {
      expect(plan[cadence].length).toBeGreaterThan(0);
    }
  });

  it('caps every cadence at four suggestions even with everything selected', () => {
    const plan = buildPlan(
      answers({
        tools: PORTFOLIO.map((t) => t.id as string),
        pain: 'subscriptions cash close lease inventory fixed assets equity tax learn',
      }),
    );
    for (const cadence of CADENCES) {
      expect(plan[cadence].length).toBeLessThanOrEqual(4);
    }
  });

  it('never duplicates a suggestion title within a cadence', () => {
    const plan = buildPlan(answers({ tools: ['revenue-schedule'], pain: 'subscription renewals' }));
    for (const cadence of CADENCES) {
      const titles = plan[cadence].map((x) => x.title);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });
});

describe('buildPlan — rules fire on tools and keywords', () => {
  it('selecting Revenue Schedule adds its daily/monthly/yearly rhythm', () => {
    const plan = buildPlan(answers({ tools: ['revenue-schedule'] }));
    expect(plan.daily.some((x) => x.tool === 'revenue-schedule')).toBe(true);
    expect(plan.monthly.some((x) => x.tool === 'revenue-schedule')).toBe(true);
    expect(plan.yearly.some((x) => x.title.includes('renewals'))).toBe(true);
  });

  it('mentioning subscriptions in the pain text triggers the same rule', () => {
    const plan = buildPlan(answers({ pain: 'tracking recurring subscription revenue is a mess' }));
    expect(plan.daily.some((x) => x.tool === 'revenue-schedule')).toBe(true);
  });

  it('lease and cash keywords route to their tools', () => {
    const plan = buildPlan(answers({ pain: 'ASC 842 lease remeasurement and our 13-week cash view' }));
    expect(plan.quarterly.some((x) => x.tool === 'lease-accounting')).toBe(true);
    expect(plan.daily.some((x) => x.tool === 'cashflow')).toBe(true);
  });

  it('every suggestion href resolves to a known portfolio route', () => {
    const hrefs = new Set<string>(PORTFOLIO.map((t) => t.href));
    const plan = buildPlan(answers({ tools: PORTFOLIO.map((t) => t.id as string), pain: 'everything', wish: '' }));
    for (const cadence of CADENCES) {
      for (const sug of plan[cadence]) expect(hrefs.has(sug.href)).toBe(true);
    }
  });
});

describe('buildPlan — roadmap capture', () => {
  it('records the wish verbatim', () => {
    const wish = 'a QuickBooks journal export for deferred revenue';
    const plan = buildPlan(answers({ wish }));
    expect(plan.roadmap).toContain(wish);
  });

  it('records an unmatched pain as a portfolio gap', () => {
    const pain = 'chasing engineers for timesheet approvals';
    const plan = buildPlan(answers({ pain }));
    expect(plan.roadmap).toContain(pain);
  });

  it('does not treat a matched pain as a gap', () => {
    const plan = buildPlan(answers({ pain: 'deferred subscription revenue schedules' }));
    expect(plan.roadmap).toHaveLength(0);
  });
});

describe('survey plumbing', () => {
  it('tool chip labels round-trip to portfolio ids', () => {
    const ids = toolIdsFromLabels(['Revenue Schedule', 'Cashflow', 'Not A Tool']);
    expect(ids).toEqual(['revenue-schedule', 'cashflow']);
  });

  it('the guided survey asks role → tools → pain → wish', () => {
    expect(GUIDED_QUESTIONS.map((q) => q.id)).toEqual(['role', 'tools', 'pain', 'wish']);
    expect(GUIDED_QUESTIONS[1].multi).toBe(true);
  });
});

describe('sanitizePlan — model output is never trusted raw', () => {
  it('accepts a well-formed plan and preserves known tool links', () => {
    const plan = sanitizePlan({
      daily: [{ title: 'T', detail: 'D', tool: 'ar', href: '/anything' }],
      weekly: [], monthly: [], quarterly: [], yearly: [],
      roadmap: ['build X'],
    });
    expect(plan).not.toBeNull();
    expect(plan!.daily[0].href).toBe('/ar');
    expect(plan!.roadmap).toEqual(['build X']);
  });

  it('rewrites unknown tools to new-capability with a safe href', () => {
    const plan = sanitizePlan({
      daily: [{ title: 'T', detail: 'D', tool: 'evil', href: 'https://phish.example' }],
      weekly: [], monthly: [], quarterly: [], yearly: [],
    });
    expect(plan!.daily[0].tool).toBe('new-capability');
    expect(plan!.daily[0].href).toBe('/');
  });

  it('rejects junk shapes and empty plans', () => {
    expect(sanitizePlan(null)).toBeNull();
    expect(sanitizePlan('nope')).toBeNull();
    expect(sanitizePlan({ daily: 'x' })).toBeNull();
    expect(sanitizePlan({ daily: [], weekly: [], monthly: [], quarterly: [], yearly: [] })).toBeNull();
  });

  it('caps oversized model output', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ title: `T${i}`, detail: 'D', tool: 'ar', href: '/ar' }));
    const plan = sanitizePlan({ daily: many, weekly: [], monthly: [], quarterly: [], yearly: [], roadmap: Array(50).fill('r') });
    expect(plan!.daily.length).toBeLessThanOrEqual(4);
    expect(plan!.roadmap.length).toBeLessThanOrEqual(10);
  });
});
