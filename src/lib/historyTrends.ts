// Historical macro trends — the model layer behind tab 19's history step.
//
// Monthly and quarterly HISTORY (2022 → today) for the four series every
// valuation conversation leans on: headline CPI (YoY), the Fed funds
// midpoint, the 10-year Treasury, and the Freddie Mac PMMS 30-year mortgage —
// plus the quarterly real-GDP path.
//
// Honesty model: the ANCHORS are dated official prints (BLS, H.15, PMMS —
// same sources as tabs 3/11/12), pinned by tests to agree with the Lab's
// snapshots (INFLATION_SNAPSHOT, RATES_SNAPSHOT, CUTS_VS_TENYEAR). The months
// BETWEEN anchors are linear teaching interpolation, computed — never typed —
// and flagged, so the chart is honest about which points are real prints.
// Quarterly values are computed as the mean of the quarter's months.

export interface AnchorPoint {
  /** 'YYYY-MM' */
  ym: string;
  value: number;
  note?: string;
}

export interface HistorySeries {
  id: string;
  name: string;
  anchors: AnchorPoint[];
  source: string;
}

export const HISTORY_SOURCE =
  'ANCHORED OFFICIAL PRINTS (BLS CPI, Fed H.15, Freddie Mac PMMS, BEA — as cited per anchor) with LINEAR TEACHING INTERPOLATION between anchors, computed. Anchor months are marked; interpolated months are illustrative path, not data. Refresh anchors by hand like every snapshot in this Lab.';

export const MACRO_HISTORY: HistorySeries[] = [
  {
    id: 'cpi',
    name: 'CPI headline (% YoY)',
    source: 'BLS CPI reports',
    anchors: [
      { ym: '2022-01', value: 7.5 },
      { ym: '2022-06', value: 9.1, note: 'The peak — highest since 1981.' },
      { ym: '2022-12', value: 6.5 },
      { ym: '2023-06', value: 3.0, note: 'The fast disinflation leg.' },
      { ym: '2023-12', value: 3.4 },
      { ym: '2024-06', value: 3.0 },
      { ym: '2024-09', value: 2.4, note: 'The low — the "mission almost accomplished" moment.' },
      { ym: '2025-01', value: 3.0 },
      { ym: '2025-06', value: 3.2, note: 'Tariff/supply pass-through re-accelerates the goods lines.' },
      { ym: '2025-12', value: 3.3 },
      { ym: '2026-06', value: 3.5 },
      { ym: '2026-07', value: 3.4, note: 'July 2026 print — matches tab 3’s inflation snapshot (core 2.5%).' },
    ],
  },
  {
    id: 'fedmid',
    name: 'Fed funds midpoint (%)',
    source: 'FOMC target range midpoints (H.15)',
    anchors: [
      { ym: '2022-01', value: 0.125, note: 'Still at the floor.' },
      { ym: '2022-03', value: 0.375, note: 'Liftoff.' },
      { ym: '2022-07', value: 2.375 },
      { ym: '2022-12', value: 4.375, note: 'Fastest hiking year since Volcker.' },
      { ym: '2023-07', value: 5.375, note: 'The peak — held a full year.' },
      { ym: '2024-08', value: 5.375 },
      { ym: '2024-09', value: 5.375, note: 'The month of the first cut — the divergence clock starts here (tab 11).' },
      { ym: '2024-11', value: 4.875 },
      { ym: '2025-01', value: 4.375 },
      { ym: '2025-06', value: 4.125 },
      { ym: '2025-12', value: 3.875 },
      { ym: '2026-04', value: 3.625 },
      { ym: '2026-08', value: 3.625, note: 'On hold at 3.50–3.75% — matches tab 11’s snapshot.' },
    ],
  },
  {
    id: 'teny',
    name: '10-year Treasury (%)',
    source: 'Fed H.15 10Y CMT',
    anchors: [
      { ym: '2022-01', value: 1.8 },
      { ym: '2022-10', value: 4.25, note: 'The 2022 bond rout — stocks AND bonds down together.' },
      { ym: '2023-04', value: 3.4 },
      { ym: '2023-10', value: 4.98, note: 'The first ~5% scare — term premium wakes up.' },
      { ym: '2023-12', value: 3.9 },
      { ym: '2024-04', value: 4.6 },
      { ym: '2024-09', value: 3.65, note: 'The low into the first cut.' },
      { ym: '2024-11', value: 4.2 },
      { ym: '2025-01', value: 4.64 },
      { ym: '2025-06', value: 4.5 },
      { ym: '2025-12', value: 4.45 },
      { ym: '2026-04', value: 4.55 },
      { ym: '2026-08', value: 4.7, note: 'Today’s benchmark — matches tab 11’s curve.' },
    ],
  },
  {
    id: 'pmms',
    name: '30-yr mortgage, PMMS (%)',
    source: 'Freddie Mac Primary Mortgage Market Survey (weekly)',
    anchors: [
      { ym: '2022-01', value: 3.22, note: 'The last of the cheap-money mortgages.' },
      { ym: '2022-10', value: 7.08 },
      { ym: '2023-05', value: 6.4 },
      { ym: '2023-10', value: 7.79, note: 'The cycle peak — tracking the 10Y’s 5% scare plus a wide spread.' },
      { ym: '2024-09', value: 6.08, note: 'The low into the first cut — and it never got lower.' },
      { ym: '2025-01', value: 7.04 },
      { ym: '2025-06', value: 6.85 },
      { ym: '2025-12', value: 6.6 },
      { ym: '2026-04', value: 6.5 },
      { ym: '2026-08', value: 6.65, note: 'Matches tab 12: 10Y 4.69 + 196bp spread.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Monthly interpolation & quarterly aggregation (computed, never typed)
// ---------------------------------------------------------------------------

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function ymToIndex(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + (m - 1);
}

function indexToYm(i: number): string {
  const y = Math.floor(i / 12);
  const m = (i % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function ymLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS_SHORT[m - 1]} ${String(y).slice(2)}`;
}

export interface MonthPoint {
  ym: string;
  label: string;
  value: number;
  /** true = a dated official print; false = linear teaching interpolation. */
  anchored: boolean;
}

/** Linear interpolation between anchors, rounded to 2dp. */
export function monthlyHistory(s: HistorySeries): MonthPoint[] {
  const out: MonthPoint[] = [];
  for (let k = 0; k < s.anchors.length - 1; k++) {
    const a = s.anchors[k];
    const b = s.anchors[k + 1];
    const ia = ymToIndex(a.ym);
    const ib = ymToIndex(b.ym);
    for (let i = ia; i < ib; i++) {
      const t = (i - ia) / (ib - ia);
      const v = a.value + (b.value - a.value) * t;
      // anchor months pass through EXACTLY (they are official prints); only
      // interpolated months are rounded (3dp — Fed midpoints are eighths)
      out.push({
        ym: indexToYm(i),
        label: ymLabel(indexToYm(i)),
        value: i === ia ? a.value : Math.round(v * 1000) / 1000,
        anchored: i === ia,
      });
    }
  }
  const last = s.anchors[s.anchors.length - 1];
  out.push({ ym: last.ym, label: ymLabel(last.ym), value: last.value, anchored: true });
  return out;
}

export interface QuarterPoint {
  q: string;
  value: number;
}

/** Quarterly = mean of the quarter's monthly values, rounded to 2dp. */
export function quarterlyHistory(s: HistorySeries): QuarterPoint[] {
  const buckets = new Map<string, number[]>();
  for (const p of monthlyHistory(s)) {
    const [y, m] = p.ym.split('-').map(Number);
    const q = `Q${Math.ceil(m / 3)} ${String(y).slice(2)}`;
    if (!buckets.has(q)) buckets.set(q, []);
    buckets.get(q)!.push(p.value);
  }
  return [...buckets.entries()].map(([q, vs]) => ({
    q,
    value: Math.round((vs.reduce((a, b) => a + b, 0) / vs.length) * 100) / 100,
  }));
}

export type HistoryFreq = 'monthly' | 'quarterly';

/** Chart-ready rows for the selected series ids at the chosen frequency. */
export function historyRows(ids: string[], freq: HistoryFreq): Record<string, number | string | null>[] {
  const chosen = MACRO_HISTORY.filter((s) => ids.includes(s.id));
  if (chosen.length === 0) return [];
  const rows = new Map<string, Record<string, number | string | null>>();
  for (const s of chosen) {
    const pts =
      freq === 'monthly'
        ? monthlyHistory(s).map((p) => ({ x: p.label, value: p.value }))
        : quarterlyHistory(s).map((p) => ({ x: p.q, value: p.value }));
    for (const p of pts) {
      if (!rows.has(p.x)) rows.set(p.x, { x: p.x });
      rows.get(p.x)![s.id] = p.value;
    }
  }
  return [...rows.values()];
}

// ---------------------------------------------------------------------------
// Real GDP — quarterly only (that's how BEA prints it)
// ---------------------------------------------------------------------------

export interface GdpQuarter {
  q: string;
  value: number;
  note?: string;
}

/** Real GDP, quarterly annualized % (BEA; 2025 values are teaching approximations). */
export const GDP_QUARTERLY: GdpQuarter[] = [
  { q: 'Q1 22', value: -1.6, note: 'Two negative quarters while jobs boomed — the "is this a recession?" year.' },
  { q: 'Q2 22', value: -0.6 },
  { q: 'Q3 22', value: 2.7 },
  { q: 'Q4 22', value: 2.6 },
  { q: 'Q1 23', value: 2.2 },
  { q: 'Q2 23', value: 2.1 },
  { q: 'Q3 23', value: 4.9, note: 'The blowout quarter that killed the 2023 recession calls.' },
  { q: 'Q4 23', value: 3.4 },
  { q: 'Q1 24', value: 1.6 },
  { q: 'Q2 24', value: 3.0 },
  { q: 'Q3 24', value: 3.1 },
  { q: 'Q4 24', value: 2.4 },
  { q: 'Q1 25', value: 1.8 },
  { q: 'Q2 25', value: 2.0 },
  { q: 'Q3 25', value: 1.9 },
  { q: 'Q4 25', value: 2.1 },
  { q: 'Q1 26', value: 1.9, note: 'The revised vintage — tab 17 preserves the +2.1 advance print beside it.' },
  { q: 'Q2 26', value: 1.5, note: 'Losing steam — matches tab 1’s market snapshot.' },
];

export const GDP_SOURCE =
  'BEA quarterly annualized real GDP through 2024 (as printed); 2025 values are APPROXIMATE TEACHING VALUES; 2026 matches the Lab’s snapshots (Q1 revised vintage per tab 17, Q2 per tab 1).';

// ---------------------------------------------------------------------------
// The reads — what the history teaches
// ---------------------------------------------------------------------------

export const HISTORY_STORIES: string[] = [
  '2022 is the inflation-shock template: CPI peaks at 9.1% while the Fed sprints from 0.125% to 4.375% in one year — and stocks AND long bonds fall together, the regime tab 18’s bonds-hedge rule fails on.',
  'October 2023 is the first term-premium scare: the 10Y touches ~5% and the 30-yr mortgage 7.79% with the Fed already done hiking — the long end moved on supply and inflation fear, not policy.',
  'September 2024 starts the divergence clock: since the first cut the Fed has eased ~175bp while the 10Y ROSE ~105bp (3.65 → 4.70). That one fact — visible right in the monthly lines — is tab 11’s whole story about who sets the long rate.',
  'The mortgage line never followed the Fed down: PMMS bottomed at 6.08% the month of the first cut and sits at 6.65% today, because mortgages price off the 10Y plus a spread (tab 12), not off the funds rate.',
  'GDP tells the soft-landing-then-slowdown arc: negative prints in early 2022, the 4.9% blowout in late 2023, then a glide from ~3% to 1.5% by mid-2026 — slowing, not collapsing, exactly the EY-Parthenon "meaningful but not recessionary" read on tab 7.',
  'Monthly vs quarterly is itself a lesson: monthly shows the turning points (the 9.1 peak, the 5% scare); quarterly smooths the noise into the trend. Check both before citing a direction — a quarter can hide the month that matters.',
];
