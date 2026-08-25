// IPO market engine — the model layer behind tab 13 (master spec §73–85).
//
// The spec's core discipline: the IPO decision is THREE separate questions
// that must never be collapsed prematurely —
//   1. Is the OVERALL market window open?
//   2. Is YOUR INDUSTRY's window open? (they diverge: H1 2026's market
//      reopened on AI issuance while biotech entered the year off a ~47%
//      IPO decline)
//   3. Is the COMPANY ready? (a company can be ready while the market is
//      closed, and the market can be open while the company is not ready)
// Plus the dilution math (§80) and the financing menu (§79/§62).
//
// Reference context (validation/teaching — labeled, never permanently
// "current" per spec §75): EY Global IPO Trends H1 2026 and EY Biotech
// Beyond Borders 2026, as cited. Education only; not investment advice.

export interface IpoReference {
  period: string;
  source: string;
  facts: string[];
}

export const IPO_REFERENCE: IpoReference = {
  period: 'H1 2026 (reference context — refresh before treating as current)',
  source: 'EY Global IPO Trends H1 2026; EY Biotech Beyond Borders 2026 (as cited)',
  facts: [
    '62 US IPOs raising more than $50M each in H1 2026 — versus 34 in the equivalent 2025 period: a substantial reopening.',
    '12 US deals raised more than $1B each, versus four in the prior-year period.',
    'AI and AI-adjacent issuance was the major driver; aerospace/defense and biotech were also active.',
    'BUT: biotech entered 2026 after its 2025 IPO market fell ~47% versus 2024 — even as broader biotech FINANCING rose ~11% to $68.5B.',
    'Public-market investors stayed selective: larger, better-prepared businesses got funded.',
    'The lesson the spec encodes: "the IPO market is open" is not a sentence — open FOR WHOM is the question.',
  ],
};

// ---------------------------------------------------------------------------
// IPO by sector — the trend over time (spec §76)
// ---------------------------------------------------------------------------
//
// APPROXIMATE TEACHING VALUES: US IPOs raising >$50M, EY-Global-IPO-Trends
// basis, rounded — anchored to the cited prints (biotech 2025 down ~47% vs
// 2024; overall H1 2026 = 62 vs 34 in H1 2025; AI the driver; A&D and
// biotech active) with the years between anchors set to the well-documented
// shape of the cycle (2021 mania → 2022 collapse → slow thaw → 2026
// reopening). Refresh from EY Global IPO Trends / SEC EDGAR before citing.
// H1 2026 is a HALF year — compare shapes, not bar heights, at the end.

export const SECTOR_IPO_YEARS = ['2021', '2022', '2023', '2024', '2025', 'H1 2026'] as const;

export interface SectorIpoTrend {
  id: string;
  name: string;
  /** Approximate US IPO counts (>$50M) per SECTOR_IPO_YEARS entry. */
  counts: [number, number, number, number, number, number];
  note: string;
}

export const SECTOR_IPO_TRENDS: SectorIpoTrend[] = [
  { id: 'overall', name: 'ALL US IPOs >$50M', counts: [280, 35, 54, 70, 80, 62], note: 'The cycle in one line: 2021 mania, 2022 collapse (~-85%), slow thaw, and an H1-2026 (half-year!) already near full-year 2025 — 62 vs 34 in H1 2025.' },
  { id: 'ai', name: 'AI & AI-adjacent', counts: [5, 1, 3, 8, 15, 20], note: 'The reopening’s engine — the only sector whose H1-2026 half year beats every prior FULL year. Windows are not generic: this one opened first.' },
  { id: 'tech', name: 'Software / tech (ex-AI)', counts: [110, 6, 10, 15, 18, 12], note: 'The 2021 mania’s core — and the hardest fall: rate-sensitive long-duration stories (tab 11) needed the 10Y story to stabilize before buyers returned.' },
  { id: 'biotech', name: 'Biotech / pharma', counts: [90, 18, 15, 19, 10, 7], note: 'The cited divergence: 2025 fell ~47% vs 2024 even as sector FINANCING rose to $68.5B — the private row of the menu carried the load. Active again in H1 2026, selectively.' },
  { id: 'fintech', name: 'Financials / fintech', counts: [35, 3, 5, 8, 10, 8], note: 'Repriced brutally in 2022 (growth multiples met credit reality); the thaw favors profitable, boring balance sheets.' },
  { id: 'industrials', name: 'Industrials / aerospace & defense', counts: [15, 4, 6, 7, 9, 8], note: 'The quiet counter-cyclical: A&D active in H1 2026 on the geopolitics bid (tab 15) — a window driven by the fiscal lever, not the Fed.' },
  { id: 'consumer', name: 'Consumer / retail', counts: [25, 3, 6, 7, 8, 5], note: 'Needs the real-income story: consumer IPOs reopen last, when tab 3’s inflation lines cool and discretionary stops reading headwind.' },
];

export const SECTOR_IPO_SOURCE =
  'US IPOs >$50M, EY Global IPO Trends basis — APPROXIMATE TEACHING VALUES anchored to the cited prints (biotech 2025 −47% vs 2024; H1 2026 overall 62 vs 34 prior-year period); interior years set to the documented cycle shape. Refresh from ey.com / SEC EDGAR before citing. H1 2026 is a half year.';

/** Chart rows: {year, [sectorId]: count}. */
export function sectorIpoRows(): Record<string, number | string>[] {
  return SECTOR_IPO_YEARS.map((year, i) => {
    const row: Record<string, number | string> = { year };
    for (const t of SECTOR_IPO_TRENDS) row[t.id] = t.counts[i];
    return row;
  });
}

// ---------------------------------------------------------------------------
// The three windows — separate checklists, separate scores, never collapsed
// ---------------------------------------------------------------------------

export interface WindowItem {
  id: string;
  label: string;
  /** Default state, pre-set to the H1-2026 reference context. */
  defaultChecked: boolean;
  why: string;
}

export interface WindowChecklist {
  id: 'market' | 'industry' | 'company';
  name: string;
  question: string;
  items: WindowItem[];
}

export const WINDOW_CHECKLISTS: WindowChecklist[] = [
  {
    id: 'market',
    name: 'MarketWindowScore',
    question: 'Is the OVERALL IPO market open?',
    items: [
      { id: 'count', label: 'IPO count up meaningfully vs the prior year', defaultChecked: true, why: 'H1 2026: 62 deals >$50M vs 34 — nearly double.' },
      { id: 'mega', label: 'Mega-deals (>$1B) getting done', defaultChecked: true, why: '12 vs four a year earlier — size is getting funded.' },
      { id: 'firstday', label: 'First-day and 30/90-day performance positive', defaultChecked: true, why: 'Aftermarket pain closes windows fast; buyers remember.' },
      { id: 'withdrawals', label: 'Withdrawn/postponed deals low', defaultChecked: true, why: 'Pulled deals are the market saying no in public.' },
      { id: 'vol', label: 'Volatility (VIX) calm and rates not spiking', defaultChecked: false, why: 'Supply-shock world: long yields at 2007 highs argue caution — see tab 11.' },
    ],
  },
  {
    id: 'industry',
    name: 'IndustryWindowScore',
    question: "Is YOUR industry's window open?",
    items: [
      { id: 'icount', label: 'IPO count in YOUR sector up vs prior year', defaultChecked: false, why: 'Biotech example: sector IPOs fell ~47% in 2025 while the overall market reopened — the windows diverge.' },
      { id: 'iproceeds', label: 'Sector proceeds and deal sizes healthy', defaultChecked: false, why: 'A window that only funds $2B AI platforms is not open for a $300M biotech.' },
      { id: 'icomps', label: 'Recent sector IPOs trading at/above issue', defaultChecked: false, why: 'Your comps ARE your pricing — broken recent deals reprice yours down.' },
      { id: 'ialt', label: 'Sector private financing available as the alternative', defaultChecked: true, why: 'Biotech financing rose to $68.5B in 2025 — a closed IPO window with open private markets changes the decision, not the company.' },
      { id: 'idriver', label: 'Your sector is among the cycle’s drivers (AI, A&D in H1 2026)', defaultChecked: false, why: 'Riding the theme cuts the selectivity bar; fighting it raises it.' },
    ],
  },
  {
    id: 'company',
    name: 'CompanyReadinessScore',
    question: 'Is the COMPANY ready? (spec §78)',
    items: [
      { id: 'scale', label: 'Scale & growth story an institutional buyer can underwrite', defaultChecked: false, why: '2026 buyers emphasized larger, better-prepared businesses.' },
      { id: 'path', label: 'Profitability or a credible, dated path to it', defaultChecked: false, why: '"Growth at any cost" did not reopen with the window.' },
      { id: 'gaap', label: 'GAAP / audit / SOX-ICFR readiness; clean close process', defaultChecked: false, why: 'Reporting maturity is the slowest item to fix — start earliest.' },
      { id: 'forecast', label: 'Forecasting you can hit two quarters in a row', defaultChecked: false, why: 'The first missed public quarter costs more than a year of waiting.' },
      { id: 'gov', label: 'Board, governance, IR, legal structure, clean cap table', defaultChecked: false, why: 'Fixable pre-IPO, expensive post.' },
      { id: 'story', label: 'Equity story: why public, why now, what the money does', defaultChecked: false, why: 'If the answer is "our investors want out," that is a secondary, not a story.' },
    ],
  },
];

export interface WindowScore {
  id: WindowChecklist['id'];
  name: string;
  checked: number;
  total: number;
  scorePct: number;
  read: string;
}

/** Score one checklist from its checked ids — a % of items, nothing fancier. */
export function windowScore(list: WindowChecklist, checkedIds: string[]): WindowScore {
  const checked = list.items.filter((i) => checkedIds.includes(i.id)).length;
  const scorePct = Math.round((checked / list.items.length) * 100);
  return {
    id: list.id,
    name: list.name,
    checked,
    total: list.items.length,
    scorePct,
    read: scorePct >= 70 ? 'open / ready' : scorePct >= 40 ? 'mixed — proceed with structure' : 'closed / not ready',
  };
}

export const THREE_SCORES_RULE =
  'Do NOT collapse the three scores into one number. A company can be ready while the market is closed (build the muscle, wait); the market can be open while the company is not ready (do not let bankers’ enthusiasm compress §78); and the overall window can be open while YOUR industry’s is shut (H1 2026 biotech). Each score points at a different owner: the market at timing, the industry at comparables and alternatives, the company at the work.';

// ---------------------------------------------------------------------------
// Dilution math (§80)
// ---------------------------------------------------------------------------

export interface DilutionInputs {
  /** Pre-money equity value, $. */
  preMoney: number;
  /** PRIMARY capital raised (new money into the company), $. */
  primaryRaised: number;
  /** Existing fully-diluted shares before the offering. */
  existingShares: number;
  /** Greenshoe (over-allotment) as % of the primary, 0–15 typical. */
  greenshoePct: number;
  /** SECONDARY shares sold by existing holders, $ (no dilution — no new shares). */
  secondarySold: number;
}

export const DEFAULT_DILUTION_INPUTS: DilutionInputs = {
  preMoney: 900,
  primaryRaised: 100,
  existingShares: 90,
  greenshoePct: 15,
  secondarySold: 50,
};

export interface DilutionResult {
  postMoney: number;
  /** Offer price implied by pre-money ÷ existing shares. */
  sharePrice: number;
  newShares: number;
  newSharesWithShoe: number;
  /** New investors' ownership of the post-money company (primary only). */
  newOwnershipPct: number;
  newOwnershipWithShoePct: number;
  /** Existing holders' dilution, pp of ownership. */
  dilutionPct: number;
}

/**
 * post-money = pre-money + PRIMARY raised; new ownership = primary ÷ post.
 * The greenshoe adds up to +X% more primary shares if exercised. SECONDARY
 * sales transfer existing shares — cash to sellers, zero dilution, and the
 * spec's rule: never blur primary and secondary in an IPO headline number.
 */
export function dilution(inp: DilutionInputs): DilutionResult {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const postMoney = inp.preMoney + inp.primaryRaised;
  const sharePrice = inp.existingShares > 0 ? inp.preMoney / inp.existingShares : 0;
  const newShares = sharePrice > 0 ? inp.primaryRaised / sharePrice : 0;
  const shoeShares = newShares * (1 + inp.greenshoePct / 100);
  const own = (n: number) => (inp.existingShares + n > 0 ? (n / (inp.existingShares + n)) * 100 : 0);
  const newOwnershipPct = own(newShares);
  return {
    postMoney: r2(postMoney),
    sharePrice: r2(sharePrice),
    newShares: r2(newShares),
    newSharesWithShoe: r2(shoeShares),
    newOwnershipPct: r2(newOwnershipPct),
    newOwnershipWithShoePct: r2(own(shoeShares)),
    dilutionPct: r2(newOwnershipPct),
  };
}

// ---------------------------------------------------------------------------
// The financing menu (§62 / §79 / §82)
// ---------------------------------------------------------------------------

export interface FinancingOption {
  name: string;
  cash: string;
  cost: string;
  bestWhen: string;
}

export const FINANCING_MENU: FinancingOption[] = [
  { name: 'IPO (primary)', cash: 'Large, plus a currency (public stock) for M&A and hiring', cost: 'Dilution + reporting burden + a public report card every quarter', bestWhen: 'All three windows read open — and the equity story answers "why public, why now."' },
  { name: 'Follow-on / private equity round', cash: 'Sized to need', cost: 'Dilution at the CURRENT valuation — if intrinsic value exceeds market value, issuing transfers value from existing holders (flag it, §82)', bestWhen: 'The company window is open but the IPO window is not — biotech’s 2025 playbook: $68.5B raised with IPOs down 47%.' },
  { name: 'Convertible debt', cash: 'Debt-sized', cost: 'Interest now, dilution later if it converts — a bet on your own stock', bestWhen: 'Valuation disagreement: you think the equity is cheap, lenders want equity upside.' },
  { name: 'Venture / traditional debt', cash: 'Smaller, covenant-bound', cost: 'Interest + principal + covenants; no dilution', bestWhen: 'Predictable cash flows or hard collateral; never to fund open-ended burn.' },
  { name: 'Royalty / milestone financing', cash: 'Non-dilutive today', cost: 'Future economics surrendered — you sell a slice of the upside you were building', bestWhen: 'Life sciences with near-commercial assets; compare the royalty give-up against equity dilution explicitly.' },
  { name: 'Licensing / partnership / strategic investor', cash: 'Cash plus capabilities', cost: 'Strategic constraints — a partner today can be an acquirer’s blocker tomorrow', bestWhen: 'The asset needs a partner’s channel anyway; financing is the side effect.' },
  { name: 'M&A (sell)', cash: 'Full exit', cost: 'The company', bestWhen: 'The acquirer’s synergy math beats your standalone NPV honestly — tab 10’s accretion and PPA calculators are the buyer’s side of this table.' },
];
