// Revenue Schedule — domain math for the /revenue-schedule tool.
//
// Turns invoice line items into a deferred-revenue amortization schedule:
//   - service period is [invoiceDate, invoiceDate + termMonths), end-exclusive
//   - daily rate across the exact period, so first/last months prorate by day
//   - each month rounds to cents; the final month absorbs the rounding
//     difference so every schedule ties to its invoice total to the penny
//   - exception: a One-time line with a 1-month term is point-in-time revenue
//     and lands whole in the invoice month
// Also builds the tax-basis view (full amount in the invoice month) and the
// accrual-vs-tax comparison whose running gap is the deferred revenue balance.
//
// Source of truth for the /revenue-schedule page and its tests. The build spec
// lives in the sub-rev-sch repo (Rev_Sch.docx / revenue-schedule-module.md).

export interface RevenueLine {
  id: string;
  source: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  productName: string;
  quantity: number;
  amount: number;
  isSubscription: boolean;
  termMonths: number; // 1–24
}

export interface ScheduleRow {
  key: string; // YYYY-MM
  days: number;
  partial: boolean;
  amount: number;
}

export interface LineSchedule {
  rows: ScheduleRow[];
  start: Date | null;
  end: Date | null; // last day of service (inclusive), or the start for point-in-time
  totalDays: number;
  pointInTime?: boolean;
}

export interface ChartPoint {
  key: string;
  month: string;
  amount: number;
  cumulative: number;
}

export interface CompareRow {
  key: string;
  accrual: number;
  tax: number;
  diff: number;
  deferred: number;
}

export interface ScheduleModel {
  schedules: Array<{ inv: RevenueLine } & LineSchedule>;
  keys: string[];
  totals: Map<string, number>;
  chart: ChartPoint[];
  cash: Map<string, number>;
  compare: CompareRow[];
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DAY = 86400000;
const round2 = (n: number) => Math.round(n * 100) / 100;

export const usd = (n: number): string =>
  (n < 0 ? '-' : '') +
  '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const usdShort = (n: number): string => '$' + Math.round(n).toLocaleString('en-US');

export const monthKey = (y: number, m: number): string => `${y}-${String(m).padStart(2, '0')}`;

export const monthLabel = (key: string): string => {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
};

export const parseISO = (s: string): Date | null => {
  const p = String(s || '').split('-').map(Number);
  if (p.length !== 3 || !p[0]) return null;
  return new Date(p[0], p[1] - 1, p[2]);
};

export const fmtDate = (d: Date): string =>
  `${MONTHS[d.getMonth()]} ${d.getDate()}, ${String(d.getFullYear()).slice(2)}`;

/** Add months, clamping to the last day when the target month is shorter
 *  (Jan 31 + 1 month → Feb 28). */
export function addMonths(date: Date, n: number): Date {
  const y = date.getFullYear();
  const m = date.getMonth() + n;
  const lastDay = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(date.getDate(), lastDay));
}

/** Daily-rate amortization of one invoice line, prorated in the first and
 *  last month, with the final month absorbing rounding so the schedule ties
 *  to the invoice total exactly. */
export function scheduleFor(inv: RevenueLine): LineSchedule {
  const start = parseISO(inv.invoiceDate);
  if (!start) return { rows: [], start: null, end: null, totalDays: 0 };
  const total = Number(inv.amount) || 0;
  const term = Math.min(24, Math.max(1, Number(inv.termMonths) || 1));
  const end = addMonths(start, term); // exclusive: service runs through the day before

  // A One-time line with a 1-month term is a point-in-time sale: it lands
  // whole in the invoice month rather than straddling two months.
  if (!inv.isSubscription && term === 1) {
    return {
      rows: [{ key: monthKey(start.getFullYear(), start.getMonth() + 1), days: 0, partial: false, amount: total }],
      start,
      end: start,
      totalDays: 0,
      pointInTime: true,
    };
  }

  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY));
  const daily = total / totalDays;

  const rows: ScheduleRow[] = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor < end) {
    const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const segStart = cursor < start ? start : cursor;
    const segEnd = nextMonth < end ? nextMonth : end;
    const days = Math.round((segEnd.getTime() - segStart.getTime()) / DAY);
    if (days > 0) {
      rows.push({
        key: monthKey(cursor.getFullYear(), cursor.getMonth() + 1),
        days,
        partial: days < Math.round((nextMonth.getTime() - cursor.getTime()) / DAY),
        amount: round2(daily * days),
      });
    }
    cursor = nextMonth;
  }
  // Last month absorbs rounding so the schedule ties to the invoice exactly.
  if (rows.length) {
    const spread = rows.reduce((s, r) => s + r.amount, 0);
    rows[rows.length - 1].amount = round2(rows[rows.length - 1].amount + (total - spread));
  }
  return { rows, start, end: new Date(end.getTime() - DAY), totalDays };
}

/** One pass builds every schedule, the month columns, the tax-basis view, and
 *  the accrual-vs-tax comparison. */
export function buildModel(invoices: RevenueLine[]): ScheduleModel {
  const schedules = invoices.map((inv) => ({ inv, ...scheduleFor(inv) }));
  const keys = [...new Set(schedules.flatMap((s) => s.rows.map((r) => r.key)))].sort();
  const totals = new Map<string, number>(keys.map((k) => [k, 0]));
  schedules.forEach((s) =>
    s.rows.forEach((r) => totals.set(r.key, round2((totals.get(r.key) ?? 0) + r.amount)))
  );
  let running = 0;
  const chart: ChartPoint[] = keys.map((k) => {
    const amount = totals.get(k) ?? 0;
    running = round2(running + amount);
    return { key: k, month: monthLabel(k), amount, cumulative: running };
  });

  // Tax basis: the whole invoice lands in the month it was issued.
  const cash = new Map<string, number>(keys.map((k) => [k, 0]));
  invoices.forEach((inv) => {
    const s = parseISO(inv.invoiceDate);
    if (!s) return;
    const k = monthKey(s.getFullYear(), s.getMonth() + 1);
    if (!cash.has(k)) cash.set(k, 0);
    cash.set(k, round2((cash.get(k) ?? 0) + (Number(inv.amount) || 0)));
  });

  let accrualRun = 0;
  let taxRun = 0;
  const compare: CompareRow[] = keys.map((k) => {
    const accrual = totals.get(k) ?? 0;
    const tax = cash.get(k) ?? 0;
    accrualRun = round2(accrualRun + accrual);
    taxRun = round2(taxRun + tax);
    return { key: k, accrual, tax, diff: round2(tax - accrual), deferred: round2(taxRun - accrualRun) };
  });

  return { schedules, keys, totals, chart, cash, compare };
}

/** Validate and clamp a raw extracted/entered line before it touches state —
 *  never trust model output raw. */
export function normalizeLine(
  r: Partial<RevenueLine> & Record<string, unknown>,
  source: string,
  id: string,
  fallbackDate: string
): RevenueLine {
  const isSubscription = !!r.isSubscription;
  return {
    id,
    source,
    invoiceNumber: String(r.invoiceNumber ?? '').trim(),
    invoiceDate: /^\d{4}-\d{2}-\d{2}$/.test(String(r.invoiceDate ?? '')) ? String(r.invoiceDate) : fallbackDate,
    productName: String(r.productName ?? 'Unnamed line').trim() || 'Unnamed line',
    quantity: Number(r.quantity) || 1,
    amount: round2(Number(r.amount) || 0),
    isSubscription,
    termMonths: Math.min(24, Math.max(1, Number(r.termMonths) || (isSubscription ? 12 : 1))),
  };
}

/** The seven-line sales demo — five invoices spanning Jan–Jun 2026 with 1, 3,
 *  12, 18, and 24-month terms and two lines on one invoice. Billed total
 *  $126,300, matching the build-spec screenshots. */
export const DEMO_LINES: Array<Omit<RevenueLine, 'id' | 'source'>> = [
  { invoiceNumber: 'INV-2041', invoiceDate: '2026-01-15', productName: 'Analytics Platform — annual license', quantity: 1, amount: 24000, isSubscription: true, termMonths: 12 },
  { invoiceNumber: 'INV-2041', invoiceDate: '2026-01-15', productName: 'Onboarding & data migration', quantity: 1, amount: 4500, isSubscription: false, termMonths: 1 },
  { invoiceNumber: 'INV-2044', invoiceDate: '2026-02-01', productName: 'Premium support plan', quantity: 3, amount: 18000, isSubscription: true, termMonths: 24 },
  { invoiceNumber: 'INV-2052', invoiceDate: '2026-03-10', productName: 'Platform seats — quarterly', quantity: 12, amount: 9600, isSubscription: true, termMonths: 3 },
  { invoiceNumber: 'INV-2058', invoiceDate: '2026-04-01', productName: 'Analytics Platform — annual license', quantity: 2, amount: 36000, isSubscription: true, termMonths: 12 },
  { invoiceNumber: 'INV-2063', invoiceDate: '2026-05-20', productName: 'Custom report build', quantity: 1, amount: 7200, isSubscription: false, termMonths: 1 },
  { invoiceNumber: 'INV-2071', invoiceDate: '2026-06-01', productName: 'Compliance module — 18 mo term', quantity: 1, amount: 27000, isSubscription: true, termMonths: 18 },
];
