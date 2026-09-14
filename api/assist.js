// /api/assist — the agentic side of the Pulse survey widget.
//
// The browser sends the survey answers plus the follow-up chat transcript;
// Claude replies conversationally and, once it has enough signal, emits a
// suggestion plan across five cadences (daily → yearly) mapped onto the
// Fast Insights portfolio. Structured outputs guarantee the envelope shape;
// the client still sanitizes before rendering (hrefs are derived from tool
// ids, never taken from model output).
//
// Same posture as /api/extract: unauthenticated public endpoint, so the
// prompt lives server-side, origins are allowlisted, payloads are capped,
// and without ANTHROPIC_API_KEY it answers 503 (the widget falls back to
// its deterministic local plan builder).

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

const PORTFOLIO = [
  ['ar', 'AR Reconciliation — three-way recon, aging, exceptions, audit pack'],
  ['revenue-schedule', 'Revenue Schedule — invoice-to-amortization schedules, accrual vs. tax deferred revenue'],
  ['revrec', 'Revenue Recognition — ASC 606 schedules and deferred revenue waterfalls'],
  ['cashflow', 'Cashflow — direct & indirect modeling, forecast vs. actual, burn'],
  ['month-end-close', 'Month-End Close — close checklist and tie-outs'],
  ['estimated-taxes', 'Estimated Taxes — quarterly safe-harbor planning'],
  ['financial-statements', 'Financial Statements — statement prep and review'],
  ['inventory-reconciliation', 'Inventory Reconciliation — inventory subledger tie-out'],
  ['fixed-assets-reconciliation', 'Fixed Assets Reconciliation — roll-forwards and depreciation tie-out'],
  ['lease-accounting', 'Lease Accounting — ASC 842 measurement and disclosures'],
  ['equity-management', 'Equity Management — cap table and equity workflows'],
  ['corporate-finance', 'Corporate Finance Lab — capital allocation, credit, treasury teaching lab'],
  ['financial-model', 'Financial Model Lab — SQL + Python + ML pipeline teaching lab'],
  ['cpa-dashboard', 'Corporate Tax Study — corporate tax study guide and calculators'],
];

const SYSTEM = `You are Pulse, the in-app guide for Fast Insights — a portfolio of finance tools for founders, CFO advisors, bookkeepers, and controllers.

The user has just answered a short intake survey (role, tools they touch, biggest pain, one wish). Your job, in order:
1. If their answers leave one genuinely important ambiguity, ask exactly ONE short follow-up question (set done=false, plan=null). Otherwise skip straight to the plan.
2. Emit the plan (done=true): concrete working-rhythm suggestions across five cadences — daily, weekly, monthly, quarterly, yearly — each tied to one tool from the portfolio below via its exact id. 1-4 suggestions per cadence, every cadence non-empty. Titles are short imperatives ("Clear yesterday's AR exceptions"); details are one sentence of why-it-matters, written for a working accountant, no fluff.
3. Anything they want that the portfolio does NOT cover goes verbatim-ish into roadmap[] — that list is read by the product owner to decide what to build next. Never pretend an unbuilt capability exists.
4. After a plan is delivered, answer follow-up questions about the tools conversationally (done stays true; return the updated plan, or the same plan if unchanged).

Portfolio (id — what it does):
${PORTFOLIO.map(([id, blurb]) => `- ${id} — ${blurb}`).join('\n')}

Rules: use only these tool ids in suggestions; keep replies to a few sentences; never ask more than one question per turn; never invent pricing, integrations, or features; the reply field is what the user reads in the chat bubble, so it should read naturally and mention that the plan is beside it when you emit one.`;

const Suggestion = z.object({
  title: z.string(),
  detail: z.string(),
  tool: z.string(),
});

const Envelope = z.object({
  reply: z.string(),
  done: z.boolean(),
  plan: z
    .object({
      daily: z.array(Suggestion),
      weekly: z.array(Suggestion),
      monthly: z.array(Suggestion),
      quarterly: z.array(Suggestion),
      yearly: z.array(Suggestion),
      roadmap: z.array(z.string()),
    })
    .nullable(),
});

const MAX_TURNS = 20;
const MAX_CHARS = 1500;

function originAllowed(req) {
  const origin = req.headers.origin || req.headers.referer || '';
  if (!origin) return false;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'https:' && protocol !== 'http:') return false;
    return (
      hostname === 'app.fastinsights.io' ||
      hostname === 'fastinsights.io' ||
      hostname.endsWith('.vercel.app') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1'
    );
  } catch {
    return false;
  }
}

const cleanStr = (v) => String(v ?? '').slice(0, MAX_CHARS);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  if (!originAllowed(req)) {
    res.status(403).json({ error: 'Forbidden.' });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'Pulse chat is not configured (ANTHROPIC_API_KEY missing).' });
    return;
  }

  const { answers, messages } = req.body ?? {};
  if (!answers || typeof answers !== 'object') {
    res.status(400).json({ error: 'Expected {answers, messages}.' });
    return;
  }
  const turns = Array.isArray(messages) ? messages.slice(-MAX_TURNS) : [];
  if (!turns.every((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')) {
    res.status(400).json({ error: 'messages must be {role: user|assistant, content: string}[].' });
    return;
  }

  const intake = [
    'Survey answers:',
    `- Role: ${cleanStr(answers.role)}`,
    `- Tools they touch or want: ${(Array.isArray(answers.tools) ? answers.tools : []).map(cleanStr).slice(0, 20).join(', ') || 'none selected'}`,
    `- Biggest pain: ${cleanStr(answers.pain) || '(blank)'}`,
    `- One wish: ${cleanStr(answers.wish) || '(blank)'}`,
  ].join('\n');

  const client = new Anthropic({ apiKey: key });
  try {
    const response = await client.messages.parse({
      model: process.env.PULSE_MODEL || 'claude-opus-5',
      // Cost/latency cap for a public unauthenticated endpoint; the structured
      // envelope itself is small, this only bounds runaway output.
      max_tokens: 8000,
      output_config: { effort: 'low', format: zodOutputFormat(Envelope) },
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [
        { role: 'user', content: intake },
        ...turns.map((m) => ({ role: m.role, content: cleanStr(m.content) })),
      ],
    });
    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      res.status(502).json({ error: 'Pulse could not answer that one — try rephrasing.' });
      return;
    }
    res.status(200).json(response.parsed_output);
  } catch {
    res.status(502).json({ error: 'Could not reach Pulse.' });
  }
}
