// EY interview prep — the model layer behind tabs 8 and 9 of the Corporate
// Finance Lab.
//
//   Tab 8 (gap check): the technical checklist EY names for its Corporate
//   Finance / Valuation, Modeling & Economics roles, item by item — where
//   this Lab covers each one, and for the deliberate gaps, the one-liner to
//   know by name. Plus the EY-Parthenon 2026 outlook talking points and the
//   first-round interview format.
//
//   Tab 9 (drill): practice Q&A — the technical questions actually reported
//   from EY valuation/CF interviews with model answers, behavioral prompts
//   with STAR scaffolds, and the market-trends answer built from EY's own
//   numbers. Deliberately redundant with tabs 1–7: repetition is the drill.
//
// Compiled 2026-08 from EY job postings, EY service pages, and interview-prep
// sources (see the corporate-finance repo's ey-interview-prep.md for the
// sourced write-up). Education only.

export type GapStatus = 'covered' | 'partial' | 'gap';

export interface GapItem {
  item: string;
  status: GapStatus;
  /** Where the Lab covers it (covered/partial). */
  where: string;
  /** What to know — the one-liner for gaps, the framing for covered items. */
  know: string;
}

export const GAP_CHECK: GapItem[] = [
  {
    item: 'DCF — build one from scratch and narrate it',
    status: 'covered',
    where: 'Tab 6: the five-year FCF build, terminal value, and the walk-through script in the guide.',
    know: 'EY postings say it verbatim: "build models from scratch." Practice narrating tab 6 out loud: forecast FCF → terminal value → discount at WACC → EV → minus net debt → equity.',
  },
  {
    item: 'WACC / cost of capital (CAPM)',
    status: 'covered',
    where: 'Tab 1: live Re/Rd/WACC; the pro forma ties your own ratios to the spread.',
    know: 'Re = Rf + β×ERP; Rd after the tax shield; blend at the target mix. Know WHY each term exists, not just the formula.',
  },
  {
    item: 'Market approach — comps and EV/EBITDA multiples',
    status: 'covered',
    where: 'Tab 6: the peer-multiple cross-check and implied forward multiple.',
    know: 'EV/EBITDA is capital-structure neutral. Triangulate: when DCF and comps disagree, name which assumption is doing the talking.',
  },
  {
    item: 'Scenario & sensitivity analysis',
    status: 'covered',
    where: 'The four dials everywhere, plus tab 6’s WACC × growth two-way grid.',
    know: 'Named in the associate qualifications. The line to say: "a valuation is a range, not a number — here is the grid."',
  },
  {
    item: 'Three-statement linkage',
    status: 'covered',
    where: 'Tab 6: the "depreciation goes up $10" walkthrough.',
    know: 'Answer in order — income statement (tax effect), cash flow (add back non-cash), balance sheet (it balances at −$7.50). Cash goes UP $2.50: the tax shield.',
  },
  {
    item: 'Enterprise value vs. equity value',
    status: 'covered',
    where: 'Tab 6: the bridge with live net debt.',
    know: 'Equity + debt − cash = EV. Pair EV with pre-interest metrics (EBITDA), equity value with post-interest (net income) — never cross them.',
  },
  {
    item: 'IRR / NPV and investment return analysis',
    status: 'covered',
    where: 'Tab 1: Expected (IRR), NPV, and Δ NPV vs neutral tracking.',
    know: 'IRR is the rate where NPV = 0. When rankings conflict on mutually exclusive projects, trust NPV — it is dollars, not a percentage.',
  },
  {
    item: 'Capital allocation & strategic portfolio review',
    status: 'covered',
    where: 'Tab 1: seven competing uses vs risk-adjusted hurdles; tab 5: the by-industry recommendation.',
    know: 'An EY VME posting counts "capital allocation diagnostics and strategic portfolio reviews" as qualifying experience — tab 1 IS that exercise in miniature.',
  },
  {
    item: 'Balance-sheet & working-capital optimization',
    status: 'covered',
    where: 'Tab 2 (CCC, DSO/DIO/DPO), tab 6 (ΔNWC drag on FCF), tab 4 (the debt book).',
    know: 'EY cites $50–100M of working-capital improvement per $1B of sales. The mechanism: every day off the CCC releases cash permanently.',
  },
  {
    item: 'Terminal value mechanics',
    status: 'covered',
    where: 'Tab 6: Gordon growth, the TV-share honesty metric, the exit-multiple check.',
    know: 'TV carries 60–80% of most DCFs. Keep g at or below long-run GDP growth, and always show the sensitivity.',
  },
  {
    item: 'Trading comps vs. precedent transactions',
    status: 'partial',
    where: 'Tab 6 has one peer multiple; the distinction is knowledge, not a widget.',
    know: 'Trading comps = today’s market prices for minority stakes. Precedent transactions = prices actually PAID in deals — they run higher because they include a control premium (and synergies).',
  },
  {
    item: 'Purchase price allocation (PPA, ASC 805)',
    status: 'gap',
    where: 'Deliberately out — accounting-standard mechanics.',
    know: 'The one-liner: in a deal, the purchase price is allocated to identifiable tangible and intangible assets at fair value; whatever is left over is goodwill.',
  },
  {
    item: 'Goodwill impairment (ASC 350)',
    status: 'gap',
    where: 'Deliberately out.',
    know: 'Goodwill is not amortized — it is tested at least annually: if a reporting unit’s carrying value exceeds its fair value, you write goodwill down. Impairment = the deal’s promise not showing up in the numbers.',
  },
  {
    item: 'LBO modeling',
    status: 'gap',
    where: 'Peripheral for EY — not named in the EY postings surfaced (it’s an IB/PE staple).',
    know: 'The sentence: buy with mostly debt, pay it down with the company’s own cash flows, sell in ~5 years; returns come from deleveraging, margin improvement, and multiple expansion.',
  },
  {
    item: 'Cost approach (the third valuation approach)',
    status: 'gap',
    where: 'Deliberately out.',
    know: 'Value = what it would cost to replace the assets. Used for asset-heavy, early-stage, or no-cash-flow situations. Income, Market, Cost — always name all three approaches.',
  },
  {
    item: 'Accretion / dilution & synergies (M&A basics)',
    status: 'gap',
    where: 'Knowledge item — drill it on tab 9.',
    know: 'A deal is accretive if pro-forma EPS rises. Quick check: if the target’s earnings yield exceeds the acquirer’s cost of the deal (cash interest, stock’s inverse P/E), it accretes. Synergies: cost (real) vs revenue (doubted).',
  },
];

/** EY-Parthenon 2026 midyear outlook — the market-trends anchor numbers. */
export const EY_OUTLOOK: string[] = [
  'Global growth: 3.4% (2025) → 2.9% (2026) → 3.2% (2027) — a "meaningful but not recessionary" slowdown; the 2026 figure was CUT from 3.1% in the December edition.',
  'US: roughly 1.7–2.0% growth in 2026; inflation peaking near 3.2%, easing toward ~2.3% by year-end.',
  'Tariffs/trade: the tariff wave has NOT collapsed global trade (carve-outs, hedging, reconfiguration) — but it is raising costs and accelerating regionalization: semiconductors, energy, critical minerals.',
  'Supply shocks: Middle-East conflict as an energy/commodity/shipping shock; broader geopolitical escalation is the key downside risk.',
  'Inflation divergence: tariff-imposing economies see renewed price pressure; targeted economies keep disinflating.',
  'AI is the upside: robust AI investment partly offsets the drag, and stronger AI productivity gains are the main upside risk. EY-P expects 2026 US M&A to beat 2025 on AI-driven transformation.',
  'In this Lab: the "Tariff / supply shock" preset IS EY’s supply-shock world — practice narrating it across every tab.',
];

/** What the first round actually looks like. */
export const INTERVIEW_FORMAT: string[] = [
  'HireVue video: ~5 recorded questions, 30–60 seconds of prep, 90 seconds–2 minutes per answer, ~30 minutes total.',
  'The first round is overwhelmingly BEHAVIORAL and motivational — technicals mostly arrive in round 2+.',
  'Round 2+ commonly includes a take-home Excel DCF case (~48 hours) that you then defend live — tab 6 is the rehearsal.',
  'Answer structure: STAR (Situation, Task, Action, Result) — one concrete story per question, result quantified.',
  'EY listens for its values: integrity, respect, teaming — "why EY" answers should touch them without reciting them.',
  'Market awareness is probed as "how do you stay updated" and through commercial-due-diligence style cases (~40–50% of first-round cases).',
];

// ---------------------------------------------------------------------------
// The round map (tab 10)
// ---------------------------------------------------------------------------

/** The behavioral staples the HireVue round draws from (drilled on tab 9). */
export const BEHAVIORAL_STAPLES: string[] = [
  'Tell me about yourself / walk me through your CV',
  'Why EY — values fit: integrity, respect, teaming',
  'Why this role / this office',
  'Proudest achievement',
  'Succeeding under pressure / competing deadlines',
  'Contributing to a team',
  'Disagreeing with a coworker',
  'A failure and what you changed',
  'Greatest weakness',
];

/** A 48-hour game plan for the round-2 take-home Excel DCF. */
export const TAKE_HOME_PLAN: string[] = [
  'Hours 0–2 — read everything twice. List every assumption the prompt gives you and every one it forces you to make; the second list becomes your assumptions page.',
  'Hours 2–8 — build the skeleton in order: revenue drivers → margin → EBITDA → D&A → EBIT → NOPAT → capex → ΔNWC → FCF. Label every input cell, hardcode nothing inside formulas.',
  'Hours 8–12 — WACC on its own tab: CAPM cost of equity, after-tax cost of debt, the weights. Cite where each number came from.',
  'Hours 12–16 — terminal value BOTH ways (Gordon and exit multiple), the EV → equity bridge, and the implied multiple sanity check against peers.',
  'Hours 16–24 — the two-way sensitivity grid (WACC × g) and 2–3 named scenarios (base / stretch / supply-shock). This is what separates candidates: a valuation presented as a range.',
  'Hours 24–36 — break your own model: zero revenue growth, spike the discount rate, g → WACC. If anything explodes or flips sign silently, fix it. Then step away and sleep.',
  'Hours 36–48 — the defense doc: one page — the answer, the range, the three assumptions that matter most, and what would change your mind. Rehearse the walkthrough out loud twice (tab 6’s script).',
  'In the live defense — lead with the range and the TV share, volunteer the model’s weaknesses before they ask, and never defend an assumption harder than the evidence supports: "model review" is the skill they are hiring.',
];

// ---------------------------------------------------------------------------
// The drill
// ---------------------------------------------------------------------------

export type DrillCategory = 'technical' | 'behavioral' | 'market';

export interface DrillCard {
  id: string;
  category: DrillCategory;
  q: string;
  a: string;
  /** Where in the Lab to practice it live. */
  practice?: string;
}

export const DRILL_CARDS: DrillCard[] = [
  {
    id: 'dcf',
    category: 'technical',
    q: 'Walk me through a DCF.',
    a: 'I project unlevered free cash flow for about five years — revenue growth drives EBITDA at an assumed margin, subtract D&A to get EBIT, tax it to NOPAT, add D&A back, subtract capex and the working-capital build: FCF = NOPAT + D&A − capex − ΔNWC. Beyond the forecast I take a terminal value, FCF₅ × (1+g) ÷ (WACC − g), with g at or below long-run GDP growth. I discount everything at the WACC to get enterprise value, subtract net debt for equity value, and I always present it with a WACC-and-growth sensitivity grid, because the two judgment calls are the forecast drivers and the discount rate — the rest is arithmetic.',
    practice: 'Tab 6 — narrate the table out loud while changing one driver at a time.',
  },
  {
    id: 'wacc',
    category: 'technical',
    q: 'What is WACC and how do you calculate it?',
    a: 'The blended annual return the company’s capital providers require — the floor any use of capital must beat. Cost of equity from CAPM: risk-free rate plus beta times the equity risk premium. Cost of debt: the company’s borrowing rate, taken after tax because interest is deductible. Weight each by its share of the target capital structure. Example with the Lab defaults: Re = 4% + 1.1×5.5% = 10.1%; Rd = 7% × 0.75 = 5.3%; at 70/30, WACC = 8.6%.',
    practice: 'Tab 1 — move beta and the spread and predict the WACC before it updates.',
  },
  {
    id: 'three-statements',
    category: 'technical',
    q: 'Depreciation goes up $10 — walk me through the three statements.',
    a: 'Income statement first, because it carries the tax effect: EBIT falls $10, taxes fall $2.50 at a 25% rate, net income falls $7.50. Cash flow statement: start from net income at −$7.50, add back the $10 because depreciation is non-cash — net cash is UP $2.50. Balance sheet: PP&E down $10, cash up $2.50, so assets are down $7.50, matching retained earnings down $7.50. It balances, and the punchline is that cash rose — the whole change is the tax shield.',
    practice: 'Tab 6, section D — the walkthrough is laid out card by card.',
  },
  {
    id: 'ev-equity',
    category: 'technical',
    q: 'Enterprise value vs. equity value?',
    a: 'Enterprise value is the price of the whole operating business regardless of who financed it; equity value is the shareholders’ slice after lenders. Bridge: equity value + total debt − cash = EV. The discipline that follows: pair EV with pre-interest metrics like EBITDA or revenue, and equity value with post-interest metrics like net income — mixing them double-counts the capital structure.',
    practice: 'Tab 6 — watch the equity number move as you change net debt.',
  },
  {
    id: 'ev-ebitda',
    category: 'technical',
    q: 'Why is EV/EBITDA the workhorse multiple?',
    a: 'Because EBITDA is before interest and before D&A policy, EV/EBITDA compares differently financed and differently depreciated peers cleanly — it is capital-structure neutral. Its blind spot is that EBITDA is not cash flow: it ignores capex and working capital, so for capital-hungry businesses I cross-check with a DCF or EV/EBIT. P/E, by contrast, is polluted by leverage.',
    practice: 'Tab 6 — compare the implied forward multiple against your peer input.',
  },
  {
    id: 'comps',
    category: 'technical',
    q: 'Trading comps vs. precedent transactions — when and why?',
    a: 'Trading comps read today’s market prices for minority stakes in similar public companies — good for a current, liquid market view. Precedent transactions read prices actually paid in acquisitions — they run higher because buyers pay a control premium and price in synergies, so I use them when valuing a sale of the whole company. Both are market-approach checks on the DCF, and the gap between them is itself information: roughly the market’s view of the control premium.',
  },
  {
    id: 'terminal',
    category: 'technical',
    q: 'How do you calculate terminal value, and what are the pitfalls?',
    a: 'Two ways, and I show both: Gordon growth — FCF₅ × (1+g) ÷ (WACC − g) — and an exit multiple on year-5 EBITDA. Pitfalls: a perpetuity growth rate above long-run GDP means the company eventually outgrows the economy; g approaching WACC sends the value to infinity; and since the TV usually carries 60–80% of the total, honest work means disclosing the TV share and presenting the sensitivity grid rather than a point estimate.',
    practice: 'Tab 6 — push terminal growth toward WACC and watch the model refuse.',
  },
  {
    id: 'npv-irr',
    category: 'technical',
    q: 'NPV vs. IRR — which do you trust?',
    a: 'IRR is the discount rate where NPV is zero — a percentage; NPV is dollars of value created at your actual cost of capital. A tiny project can post a huge IRR and still create little value, IRR can be multiple or undefined with unconventional cash flows, and it assumes reinvestment at the IRR itself. When rankings conflict on mutually exclusive projects, trust NPV.',
    practice: 'Tab 1 — the Expected (IRR) and NPV columns move together; the guide explains why.',
  },
  {
    id: 'nwc',
    category: 'technical',
    q: 'How do working-capital changes affect free cash flow and value?',
    a: 'Growth consumes cash before it returns it: receivables and inventory build ahead of collections, so every incremental dollar of revenue drags its working-capital share out of FCF. A company can be profitable and cash-starved at once. In a DCF that shows up as the ΔNWC subtraction; operationally it is the cash conversion cycle — every day cut from DSO or DIO, or added to DPO, releases cash permanently.',
    practice: 'Tab 6 — set ΔNWC to 0% and then 30% and watch the EV gap; tab 2 shows the same idea from the credit side.',
  },
  {
    id: 'accretion',
    category: 'technical',
    q: 'When is a deal accretive vs. dilutive?',
    a: 'Accretive if pro-forma EPS rises. Quick test: compare the target’s earnings yield (E/P) with the cost of the acquirer’s consideration — after-tax interest cost for cash or debt, the inverse of the acquirer’s P/E for stock. Cheaper funding than the earnings acquired = accretion. And the honest caveat: accretion is an EPS artifact, not value creation — the value question is whether synergies exceed the premium paid. Cost synergies are believed; revenue synergies are discounted.',
  },
  {
    id: 'negative-earnings',
    category: 'technical',
    q: 'How would you value a company with negative earnings?',
    a: 'Multiples on earnings break, so I move up the statement or out in time: EV/Revenue against margin-comparable peers, a DCF that models the path to profitability explicitly, or forward multiples on normalized earnings once the business matures. For asset-heavy or distressed cases, the cost approach or liquidation value sets the floor. The key is naming WHY earnings are negative — investment-stage losses and structural losses deserve different methods.',
  },
  {
    id: 'riskier-project',
    category: 'technical',
    q: 'Two projects, one riskier — same discount rate?',
    a: 'No — the discount rate prices the risk of the cash flows being discounted, not the company doing the discounting. The riskier project gets a higher hurdle: in the Lab’s language, WACC plus a bigger option premium; a near-guaranteed use like paying down debt hurdles off the risk-free rate instead. Using one blanket rate makes risky projects look artificially good and safe ones artificially bad.',
    practice: 'Tab 1 — the seven options carry different premiums for exactly this reason.',
  },
  {
    id: 'tell-me',
    category: 'behavioral',
    q: 'Tell me about yourself. (scaffold)',
    a: 'Structure, 90 seconds: (1) Present — your current role or study in one line. (2) Past — two or three beats showing the finance thread: coursework, projects, and the fact that you BUILT a working corporate-finance model (WACC, DCF, credit underwriting, scenario analysis) to teach yourself the mechanics — that is a differentiator, use it. (3) Future — why this role at EY is the logical next step: modeling as decision support. End on the future, not the past.',
  },
  {
    id: 'why-ey',
    category: 'behavioral',
    q: 'Why EY? (scaffold)',
    a: 'Three beats, specific to EY: (1) The work — Valuation, Modeling & Economics does model build, support, and review as decision support, which matches how you like to work (cite the kind of analysis you built). (2) The platform — EY-Parthenon pairs strategy with transactions, so modeling connects to real capital decisions. (3) The people/values — integrity, respect, teaming, shown through a real interaction you had (a coffee chat, an event), not recited. One sentence each; a named team beats a generic compliment.',
  },
  {
    id: 'achievement',
    category: 'behavioral',
    q: 'Tell me about your proudest achievement. (STAR scaffold)',
    a: 'STAR in four sentences: Situation — one line of context. Task — what YOU owned. Action — two or three concrete decisions you made (this is 60% of the answer; "we" is a red flag, say "I"). Result — quantified: a number, a grade, a shipped thing, a person helped. Pick a story with a finance or analysis angle if you have one, and rehearse it to 90 seconds.',
  },
  {
    id: 'conflict',
    category: 'behavioral',
    q: 'Tell me about a disagreement with a teammate. (STAR scaffold)',
    a: 'What they listen for: you disagreed on the merits, not the person; you sought their reasoning first; you found a resolution mechanism (data, a test, a third option) rather than winning; and the relationship survived. Structure: the disagreement in one line → how you understood their view → the mechanism that resolved it → the outcome and what it changed about how you work. Never pick a story where the other person was simply wrong.',
  },
  {
    id: 'failure',
    category: 'behavioral',
    q: 'Tell me about a failure. (STAR scaffold)',
    a: 'Pick a real failure with real stakes — not a humblebrag. Structure: what you were trying to do → the mistake, owned in the first person with no excuses → what it cost → the specific change in your process afterward → evidence the change worked. Interviewers grade the ownership and the learning loop, not the failure itself.',
  },
  {
    id: 'pressure',
    category: 'behavioral',
    q: 'How do you handle pressure or competing deadlines? (STAR scaffold)',
    a: 'Give the system, then the story: you triage by impact and irreversibility, communicate early when something must slip, and protect quality on the load-bearing deliverable. Then one STAR story where that system worked — deadline stack, what you deprioritized and WHY, the result. Saying what you dropped is what makes it credible.',
  },
  {
    id: 'market-trend',
    category: 'market',
    q: 'Tell me about a market trend you’re following. (60-second model answer)',
    a: 'Use EY’s own outlook: "Global growth is slowing from 3.4% in 2025 to about 2.9% in 2026 before recovering to 3.2% in 2027 — a meaningful but not recessionary slowdown. What makes this cycle unusual is that it’s supply-shock driven: tariffs and trade fragmentation are raising costs and re-regionalizing supply chains rather than collapsing trade, so inflation is diverging — renewed pressure in tariff-imposing economies, continued disinflation elsewhere. The offset is AI: investment is holding growth up, and stronger AI productivity gains are the main upside risk — it’s also why deal activity is expected to accelerate. For valuation work that mix matters: supply shocks squeeze margins and raise discount-rate uncertainty at the same time, which is exactly when scenario and sensitivity analysis earn their keep."',
    practice: 'Tab 4/5 — load the Tariff / supply shock preset and practice narrating the chain.',
  },
  {
    id: 'stay-updated',
    category: 'market',
    q: 'How do you stay updated on markets?',
    a: 'Name a small, honest stack: one daily read (a markets newsletter or the FT/WSJ), one framework you actually use to organize it (this Lab’s four dials — growth, inflation, monetary, fiscal — or Dalio’s machine), and one habit that proves it (you rebuilt the "today’s market" snapshot into the tool, you track FOMC dates). A framework plus a habit beats naming five publications.',
  },
  {
    id: 'tariff-valuation',
    category: 'market',
    q: 'How would tariffs affect a company you’re valuing?',
    a: 'Walk the chain: tariffs raise input costs — margin compression unless the company has pricing power; they may force supply-chain reconfiguration — capex the forecast must fund; retaliation can shrink export revenue — growth assumption down; and the macro response (sticky inflation, higher-for-longer rates) raises the WACC. So in the model: margins down, capex up, growth trimmed, discount rate up — four hits that compound, which is why I’d present it as a scenario against the base case rather than a single adjusted number.',
    practice: 'Tab 1 + 6 under the supply-shock preset — watch the same chain reprice the options and the DCF.',
  },
];
