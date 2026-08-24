// Valuation workbench — the model layer behind tab 7 of the Corporate
// Finance Lab. The interview-grade valuation toolkit:
//
//   1. A five-year DCF built the way you'd narrate it: revenue → EBITDA →
//      EBIT → NOPAT → free cash flow, discounted at WACC, with a Gordon-
//      growth terminal value and an exit-multiple cross-check.
//   2. The enterprise-value ↔ equity-value bridge (EV − net debt = equity).
//   3. A WACC × terminal-growth sensitivity grid — the classic two-way table.
//   4. The market approach as a cross-check: what a peer EV/EBITDA multiple
//      implies vs. what the DCF says.
//   5. The three-statement linkage walkthrough ("depreciation goes up $10").
//
// Deliberately simple teaching mechanics — the structure of the analysis is
// the lesson, not the precision. Education only; not investment advice.

export interface DcfInputs {
  /** Year-0 (last twelve months) revenue, $. */
  revenue: number;
  /** EBITDA margin, % of revenue. */
  ebitdaMarginPct: number;
  /** Annual revenue growth for forecast years 1–5, %. */
  growthPct: number;
  /** Depreciation & amortization, % of revenue. */
  daPctRevenue: number;
  /** Capital expenditure, % of revenue. */
  capexPctRevenue: number;
  /** Incremental net working capital, % of each year's revenue GROWTH. */
  nwcPctGrowth: number;
  /** Tax rate, %. */
  taxPct: number;
  /** Discount rate (WACC), %. */
  waccPct: number;
  /** Terminal (perpetuity) growth, %. Must be below WACC. */
  terminalGrowthPct: number;
  /** Peer EV/EBITDA multiple, for the exit TV and the comps cross-check. */
  peerMultiple: number;
  /** Total debt minus cash, $. Bridges EV to equity value. */
  netDebt: number;
}

export const DEFAULT_DCF_INPUTS: DcfInputs = {
  revenue: 10_000_000,
  ebitdaMarginPct: 20,
  growthPct: 8,
  daPctRevenue: 4,
  capexPctRevenue: 5,
  nwcPctGrowth: 10,
  taxPct: 25,
  waccPct: 8.6,
  terminalGrowthPct: 2.5,
  peerMultiple: 8,
  netDebt: 2_000_000,
};

export interface DcfYear {
  year: number;
  revenue: number;
  ebitda: number;
  ebit: number;
  nopat: number;
  capex: number;
  deltaNwc: number;
  fcf: number;
  pv: number;
}

export interface DcfResult {
  /** False when WACC ≤ terminal growth (the perpetuity breaks). */
  valid: boolean;
  years: DcfYear[];
  /** PV of the five forecast FCFs. */
  pvForecast: number;
  /** Gordon-growth terminal value (undiscounted, at year 5). */
  terminalValue: number;
  pvTerminal: number;
  /** Enterprise value = PV(forecast) + PV(terminal). */
  ev: number;
  /** % of EV sitting in the terminal value — the honesty metric. */
  tvSharePct: number;
  /** Exit-multiple cross-check: peer multiple × year-5 EBITDA, discounted. */
  evExit: number;
  /** Equity value = EV − net debt. */
  equity: number;
  /** EV ÷ year-1 EBITDA — the forward multiple the DCF implies. */
  impliedForwardMultiple: number;
}

const round = Math.round;

/**
 * The DCF, narrated: each year revenue grows, EBITDA follows the margin,
 * D&A splits EBIT out for tax, then FCF = NOPAT + D&A − capex − ΔNWC.
 * TV = FCF₅ × (1+g) / (WACC − g), everything discounted at WACC:
 *   EV = Σ FCFₜ/(1+WACC)ᵗ + TV/(1+WACC)⁵ · equity = EV − net debt
 */
export function runDcf(inp: DcfInputs): DcfResult {
  const w = inp.waccPct / 100;
  const g = inp.growthPct / 100;
  const gt = inp.terminalGrowthPct / 100;
  const valid = inp.waccPct > inp.terminalGrowthPct && inp.revenue > 0;

  const years: DcfYear[] = [];
  let prevRevenue = inp.revenue;
  for (let t = 1; t <= 5; t++) {
    const revenue = prevRevenue * (1 + g);
    const ebitda = revenue * (inp.ebitdaMarginPct / 100);
    const da = revenue * (inp.daPctRevenue / 100);
    const ebit = ebitda - da;
    const nopat = ebit * (1 - inp.taxPct / 100);
    const capex = revenue * (inp.capexPctRevenue / 100);
    const deltaNwc = (revenue - prevRevenue) * (inp.nwcPctGrowth / 100);
    const fcf = nopat + da - capex - deltaNwc;
    const pv = fcf / Math.pow(1 + w, t);
    years.push({
      year: t,
      revenue: round(revenue),
      ebitda: round(ebitda),
      ebit: round(ebit),
      nopat: round(nopat),
      capex: round(capex),
      deltaNwc: round(deltaNwc),
      fcf: round(fcf),
      pv: round(pv),
    });
    prevRevenue = revenue;
  }

  const pvForecast = years.reduce((s, y) => s + y.pv, 0);
  const fcf5 = years[4].fcf;
  const ebitda5 = years[4].ebitda;
  const disc5 = Math.pow(1 + w, 5);

  const terminalValue = valid ? (fcf5 * (1 + gt)) / (w - gt) : 0;
  const pvTerminal = round(terminalValue / disc5);
  const ev = pvForecast + pvTerminal;
  const evExit = round((inp.peerMultiple * ebitda5) / disc5);
  const equity = ev - inp.netDebt;
  const ebitda1 = years[0].ebitda;

  return {
    valid,
    years,
    pvForecast: round(pvForecast),
    terminalValue: round(terminalValue),
    pvTerminal,
    ev: round(ev),
    tvSharePct: ev > 0 ? round((pvTerminal / ev) * 100) : 0,
    evExit,
    equity: round(equity),
    impliedForwardMultiple: ebitda1 > 0 ? round((ev / ebitda1) * 10) / 10 : 0,
  };
}

export interface SensitivityGrid {
  /** Row headers: WACC values, %. */
  waccs: number[];
  /** Column headers: terminal growth values, %. */
  growths: number[];
  /** Enterprise values, rows × cols; null where WACC ≤ g. */
  values: (number | null)[][];
}

/** The classic two-way table: EV across WACC ±1pp and terminal growth ±0.5pp. */
export function sensitivityGrid(inp: DcfInputs): SensitivityGrid {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const waccs = [-1, -0.5, 0, 0.5, 1].map((d) => r1(inp.waccPct + d));
  const growths = [-0.5, -0.25, 0, 0.25, 0.5].map((d) => r1(inp.terminalGrowthPct + d));
  const values = waccs.map((w) =>
    growths.map((g) => {
      if (w <= g) return null;
      return runDcf({ ...inp, waccPct: w, terminalGrowthPct: g }).ev;
    }),
  );
  return { waccs, growths, values };
}

// ---------------------------------------------------------------------------
// The three-statement linkage — "depreciation goes up $10" (25% tax)
// ---------------------------------------------------------------------------

export interface StatementStep {
  statement: string;
  lines: string[];
  takeaway: string;
}

export const DEPRECIATION_WALKTHROUGH: StatementStep[] = [
  {
    statement: 'Income statement',
    lines: [
      'Depreciation +$10 → operating income (EBIT) −$10',
      'Taxes fall $2.50 (at 25%)',
      'Net income −$7.50',
    ],
    takeaway: 'An accounting expense, not a cash one — but it shrinks the tax bill.',
  },
  {
    statement: 'Cash flow statement',
    lines: [
      'Start from net income: −$7.50',
      'Add back the non-cash depreciation: +$10',
      'Net cash flow +$2.50',
    ],
    takeaway: 'Cash actually goes UP — the whole change is the tax shield.',
  },
  {
    statement: 'Balance sheet',
    lines: [
      'Assets: PP&E −$10 (more accumulated depreciation), cash +$2.50 → total −$7.50',
      'Liabilities: unchanged',
      "Equity: retained earnings −$7.50 (the net income hit)",
    ],
    takeaway: 'Assets −7.50 = liabilities 0 + equity −7.50 — it balances, always.',
  },
];

/** The EV ↔ equity bridge, spelled out for the guide. */
export const EV_BRIDGE = [
  { item: 'Equity value (market cap)', note: 'What the shareholders own.' },
  { item: '+ total debt', note: 'The lenders’ claim comes along with the business.' },
  { item: '− cash', note: 'Cash offsets the debt a buyer assumes.' },
  { item: '= enterprise value', note: 'The price of the whole operating business, whoever financed it.' },
];
