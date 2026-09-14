// Pulse — the Fast Insights feedback & suggestion engine.
//
// Powers the PulseBot chat widget: a Stripe-style one-question-at-a-time
// survey that asks what the user does and what they want, then builds a
// suggestion plan across five cadences (daily → yearly) mapped onto the
// Fast Insights tool portfolio. Free-text wishes land in `roadmap` — the
// signal Jessica reads to adapt the portfolio.
//
// The deterministic engine here is the always-works fallback; when the
// deployment has an ANTHROPIC_API_KEY, /api/assist personalizes the plan
// (same shape) with Claude. Both paths return a PulsePlan.
//
// Pattern notes from the Rocket Money competitor study (research/rocket-money.md):
// one question per screen, chips over typing, suggestions tied to a cadence
// (instant alerts → weekly digest → monthly summary → renewal reminders →
// year in review), and the survey doubles as the personalization input.

export type Cadence = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface PulseSuggestion {
  title: string;
  detail: string;
  tool: string; // portfolio id, or 'new-capability' for roadmap-ware
  href: string;
}

export interface PulsePlan {
  daily: PulseSuggestion[];
  weekly: PulseSuggestion[];
  monthly: PulseSuggestion[];
  quarterly: PulseSuggestion[];
  yearly: PulseSuggestion[];
  /** Verbatim asks we can't serve yet — the portfolio-roadmap signal. */
  roadmap: string[];
}

export interface PulseAnswers {
  role: string;
  tools: string[];
  pain: string;
  wish: string;
}

export const CADENCES: Cadence[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

export const CADENCE_LABEL: Record<Cadence, string> = {
  daily: 'Day to day',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

/** The live tool portfolio (mirrors the Landing grid + internal routes). */
export const PORTFOLIO = [
  { id: 'ar', name: 'AR Reconciliation', href: '/ar', blurb: 'three-way recon, aging, exceptions, audit pack' },
  { id: 'revenue-schedule', name: 'Revenue Schedule', href: '/revenue-schedule', blurb: 'invoice-to-amortization schedules, accrual vs. tax deferred revenue' },
  { id: 'revrec', name: 'Revenue Recognition', href: '/revrec', blurb: 'ASC 606 schedules and deferred revenue waterfalls' },
  { id: 'cashflow', name: 'Cashflow', href: '/cashflow', blurb: 'direct & indirect modeling, forecast vs. actual, burn' },
  { id: 'month-end-close', name: 'Month-End Close', href: '/month-end-close', blurb: 'close checklist and tie-outs' },
  { id: 'estimated-taxes', name: 'Estimated Taxes', href: '/estimated-taxes', blurb: 'quarterly safe-harbor planning' },
  { id: 'financial-statements', name: 'Financial Statements', href: '/financial-statements', blurb: 'statement prep and review' },
  { id: 'inventory-reconciliation', name: 'Inventory Reconciliation', href: '/inventory-reconciliation', blurb: 'inventory subledger tie-out' },
  { id: 'fixed-assets-reconciliation', name: 'Fixed Assets Reconciliation', href: '/fixed-assets-reconciliation', blurb: 'roll-forwards and depreciation tie-out' },
  { id: 'lease-accounting', name: 'Lease Accounting', href: '/lease-accounting', blurb: 'ASC 842 measurement and disclosures' },
  { id: 'equity-management', name: 'Equity Management', href: '/equity-management', blurb: 'cap table and equity workflows' },
  { id: 'corporate-finance', name: 'Corporate Finance Lab', href: '/corporate-finance', blurb: 'capital allocation, credit, treasury teaching lab' },
  { id: 'financial-model', name: 'Financial Model Lab', href: '/financial-model', blurb: 'SQL + Python + ML pipeline teaching lab' },
  { id: 'cpa-dashboard', name: 'Corporate Tax Study', href: '/cpa-dashboard', blurb: 'corporate tax study guide and calculators' },
] as const;

export type PortfolioId = (typeof PORTFOLIO)[number]['id'];

const byId = new Map(PORTFOLIO.map((t) => [t.id as string, t]));

/** The guided survey — one question per bubble, chips where possible. */
export const GUIDED_QUESTIONS = [
  {
    id: 'role' as const,
    prompt: 'Hi — I’m Pulse. Two minutes, five questions, and I’ll build you a working rhythm across the Fast Insights tools. First: which is closest to what you do?',
    options: ['Founder / operator', 'CFO advisor', 'Bookkeeper', 'Controller / accountant', 'Just exploring'],
    multi: false,
  },
  {
    id: 'tools' as const,
    prompt: 'Which of these do you touch today — or want to? Pick as many as apply, then hit Continue.',
    options: PORTFOLIO.map((t) => t.name),
    multi: true,
  },
  {
    id: 'pain' as const,
    prompt: 'What eats the most time in your finance month right now? A sentence is plenty.',
    multi: false,
  },
  {
    id: 'wish' as const,
    prompt: 'If Fast Insights built one thing just for you, what would it be?',
    multi: false,
  },
];

const nameToId = new Map<string, string>(PORTFOLIO.map((t) => [t.name, t.id]));

/** Map chip labels (tool names) back to portfolio ids; unknown labels drop. */
export function toolIdsFromLabels(labels: string[]): string[] {
  return labels.map((l) => nameToId.get(l)).filter((x): x is string => Boolean(x));
}

function s(toolId: string, title: string, detail: string): PulseSuggestion {
  const t = byId.get(toolId);
  return { title, detail, tool: toolId, href: t ? t.href : '/', };
}

interface Rule {
  when: (a: PulseAnswers, text: string) => boolean;
  add: Partial<Record<Cadence, PulseSuggestion[]>>;
}

const always = () => true;
const mentions = (re: RegExp) => (_a: PulseAnswers, text: string) => re.test(text);
const usesOrMentions = (id: string, re: RegExp) => (a: PulseAnswers, text: string) =>
  a.tools.includes(id) || re.test(text);

/** The suggestion rulebook. Order matters only for which items survive the
 *  per-cadence cap, so the always-on backbone comes first. */
const RULES: Rule[] = [
  {
    when: always,
    add: {
      daily: [s('ar', 'Clear yesterday’s AR exceptions', 'Ten minutes in AR Reconciliation keeps the exception queue from becoming a month-end surprise.')],
      weekly: [s('cashflow', 'Run the weekly cash check-in', 'Forecast vs. actual in Cashflow — catch burn drift while it is still a small number.')],
      monthly: [s('month-end-close', 'Work the close checklist', 'Month-End Close keeps the tie-outs honest and the close date from slipping.')],
      quarterly: [s('estimated-taxes', 'Revisit estimated taxes', 'A quarter of actuals in, re-run safe-harbor before the payment date sneaks up.')],
      yearly: [s('financial-statements', 'Assemble the year-end package', 'Financial Statements plus your CPA — start the package before the January crunch.')],
    },
  },
  {
    when: usesOrMentions('revenue-schedule', /subscri|recurring|amortiz|defer|revenue schedule|renew/i),
    add: {
      daily: [s('revenue-schedule', 'Drop new invoices into Revenue Schedule', 'Each subscription invoice lands and spreads across its service months the day you bill it.')],
      monthly: [s('revenue-schedule', 'Post the deferred-revenue entry', 'Pull the month’s recognized total from Revenue Schedule for the Deferred Revenue → Revenue journal.')],
      yearly: [s('revenue-schedule', 'Audit renewals before they auto-bill', 'A Rocket Money-style pass over every term: what renews, at what price, and whether the term still matches the contract.')],
    },
  },
  {
    when: usesOrMentions('revrec', /asc ?606|rev ?rec|recognition/i),
    add: {
      monthly: [s('revrec', 'Tie the rev-rec waterfall to the GL', 'Revenue Recognition’s deferred waterfall should match the balance you post — reconcile monthly, not at audit time.')],
    },
  },
  {
    when: usesOrMentions('month-end-close', /close|tie.?out|reconcil/i),
    add: {
      weekly: [s('ar', 'Pre-close AR sweep', 'A mid-month pass over unapplied cash and credit memos halves the close-week pile.')],
    },
  },
  {
    when: usesOrMentions('cashflow', /cash|runway|burn|13.?week/i),
    add: {
      daily: [s('cashflow', 'Glance at the cash position', 'Thirty seconds on today’s balance vs. forecast — the cheapest early-warning system there is.')],
    },
  },
  {
    when: usesOrMentions('lease-accounting', /lease|asc ?842/i),
    add: {
      quarterly: [s('lease-accounting', 'Refresh lease measurements', 'New leases, modifications, and the ROU roll-forward — quarterly keeps 842 from becoming a year-end project.')],
    },
  },
  {
    when: usesOrMentions('inventory-reconciliation', /inventory|cogs/i),
    add: {
      monthly: [s('inventory-reconciliation', 'Tie inventory to the GL', 'Subledger-to-GL inventory tie-out alongside the close.')],
    },
  },
  {
    when: usesOrMentions('fixed-assets-reconciliation', /fixed asset|depreciat|capex/i),
    add: {
      quarterly: [s('fixed-assets-reconciliation', 'Roll the fixed-asset schedule forward', 'Additions, disposals, and depreciation — quarterly beats an annual archaeology dig.')],
    },
  },
  {
    when: usesOrMentions('equity-management', /equity|cap table|option/i),
    add: {
      quarterly: [s('equity-management', 'True up the cap table', 'Grants, exercises, and terminations posted while the paperwork is still findable.')],
    },
  },
  {
    when: usesOrMentions('estimated-taxes', /tax/i),
    add: {
      yearly: [s('cpa-dashboard', 'Do the year-end tax study', 'Corporate Tax Study before the CPA meeting — walk in knowing the §382/E&P questions to ask.')],
    },
  },
  {
    when: mentions(/learn|study|interview|teach/i),
    add: {
      weekly: [s('corporate-finance', 'Block a lab hour', 'One Corporate Finance Lab or Financial Model Lab session a week compounds fast.')],
    },
  },
];

const CAP_PER_CADENCE = 4;

/** Deterministic plan builder — the offline/fallback engine. */
export function buildPlan(answers: PulseAnswers): PulsePlan {
  const text = `${answers.pain} ${answers.wish}`;
  const plan: PulsePlan = { daily: [], weekly: [], monthly: [], quarterly: [], yearly: [], roadmap: [] };
  const seen = new Set<string>();

  for (const rule of RULES) {
    if (!rule.when(answers, text)) continue;
    for (const cadence of CADENCES) {
      for (const sug of rule.add[cadence] ?? []) {
        const key = `${cadence}:${sug.title}`;
        if (seen.has(key) || plan[cadence].length >= CAP_PER_CADENCE) continue;
        seen.add(key);
        plan[cadence].push(sug);
      }
    }
  }

  const wish = answers.wish.trim();
  if (wish) plan.roadmap.push(wish);
  const pain = answers.pain.trim();
  // A pain no rule matched is a portfolio gap worth recording too.
  if (pain && !RULES.some((r) => r !== RULES[0] && r.when({ ...answers, tools: [] }, pain))) {
    plan.roadmap.push(pain);
  }

  return plan;
}

/** Runtime validation for plans coming back from /api/assist — never trust
 *  model output raw. Unknown tools fall back to the landing page link. */
export function sanitizePlan(raw: unknown): PulsePlan | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const out: PulsePlan = { daily: [], weekly: [], monthly: [], quarterly: [], yearly: [], roadmap: [] };
  for (const cadence of CADENCES) {
    const arr = o[cadence];
    if (!Array.isArray(arr)) return null;
    for (const item of arr.slice(0, CAP_PER_CADENCE)) {
      if (!item || typeof item !== 'object') continue;
      const it = item as Record<string, unknown>;
      const toolId = String(it.tool ?? '');
      const known = byId.get(toolId);
      out[cadence].push({
        title: String(it.title ?? '').slice(0, 120),
        detail: String(it.detail ?? '').slice(0, 300),
        tool: known ? toolId : 'new-capability',
        href: known ? known.href : '/',
      });
    }
  }
  const roadmap = o.roadmap;
  if (Array.isArray(roadmap)) {
    out.roadmap = roadmap.slice(0, 10).map((r) => String(r).slice(0, 300)).filter(Boolean);
  }
  const total = CADENCES.reduce((n, c) => n + out[c].length, 0);
  return total > 0 ? out : null;
}
