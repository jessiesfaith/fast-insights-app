// ARR and Churn — the math and the words, with no React in sight.
//
// One 12-month period, three sections (ARR, NAR, Churn), two columns: a
// subscription business keeps customers, a nonprofit keeps donors. The same
// rows carry both stories; only the vocabulary changes.
//
// `calc()` and `explain()` are pure — nine strings in, one result object out —
// so every number and every sentence on the page is unit-testable without
// rendering anything. The page (src/pages/ArrAndChurn.tsx) only lays this out.
//
// The wording here was reviewed line by line and ties to the figures it
// describes. Reformat it if you must; do not reword it.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ColumnKind = 'fp' | 'nfp';

/** The nine fields as the user typed them — strings, not numbers. */
export interface RawInputs {
  revenue: string;
  begin: string;
  add: string;
  up: string;
  down: string;
  lost: string;
  startCount: string;
  newCount: string;
  lostCount: string;
}

/** The same nine fields parsed and clamped at zero. */
export type ParsedInputs = { [K in keyof RawInputs]: number };

export type PillTone = 'good' | 'flat' | 'warn';
export type Pill = { tone: PillTone; text: string } | null;

/**
 * Every ratio is `number | null`. `null` means the denominator was zero —
 * there is nothing to measure against — and the UI shows an em dash.
 */
export interface CalcResult extends ParsedInputs {
  end: number;
  netNew: number;
  retained: number;
  /** True once there is a beginning balance to measure the ratios against. */
  has: boolean;
  growth: number | null;
  nar: number | null;
  grr: number | null;
  dollarChurn: number | null;
  netChurn: number | null;
  logoChurn: number | null;
  retention: number | null;
  endCount: number;
  avgAccount: number | null;
  avgLost: number | null;
  avgNew: number | null;
  lifetime: number | null;
  standStill: number;
  newNeeded: number | null;
  recurringEarned: number;
  share: number | null;
  warnings: string[];
}

export interface Explanation {
  arr: string[];
  nar: string[];
  churn: string[];
  arrPill: Pill;
  narPill: Pill;
  churnPill: Pill;
}

export interface Vocab {
  title: string;
  sub: string;
  revenue: string;
  begin: string;
  add: string;
  up: string;
  down: string;
  lost: string;
  end: string;
  retained: string;
  share: string;
  shareNote: string;
  startCount: string;
  newCount: string;
  lostCount: string;
  endCount: string;
  unitChurn: string;
  dollarChurn: string;
  avgLost: string;
  avgAccount: string;
  life: string;
  standStill: string;
  narLabel: string;
  netNote: string;
  grossNote: string;
  churnLabel: string;
  /** [singular, plural] */
  units: [string, string];
  /** The six waterfall captions, in order. */
  bridge: [string, string, string, string, string, string];
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Parses what the user typed: strips $ and commas, so "$1,250.00" is 1250. */
export const num = (s: string | null | undefined): number => {
  const n = parseFloat(String(s ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export const usd = (n: number | null | undefined): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Math.round(n || 0)
  );

export const int = (n: number | null | undefined): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n || 0));

export const pct = (r: number | null | undefined, d = 1): string =>
  r == null || !Number.isFinite(r) ? '—' : `${(r * 100).toFixed(d)}%`;

/** A ratio as a whole-number split, e.g. 0.92 → ["92%", "8%"]. */
export const split = (r: number): [string, string] => {
  const a = Math.round(r * 100);
  return [`${a}%`, `${100 - a}%`];
};

export const count = (n: number, units: [string, string]): string =>
  `${int(n)} ${Math.round(n) === 1 ? units[0] : units[1]}`;

const trim = (s: string): string => s.replace(/\.?0+$/, '');

/** Compact dollars for the chart labels: $1.95M, $520K, −$95K. */
export const short = (n: number): string => {
  const a = Math.abs(n);
  const s = n < 0 ? '−' : '';
  if (a >= 1e9) return `${s}$${trim((a / 1e9).toFixed(2))}B`;
  if (a >= 1e6) {
    const m = (a / 1e6).toFixed(2);
    return `${s}$${m.endsWith('0') ? m.slice(0, -1) : m}M`;
  }
  if (a >= 1e3) return `${s}$${Math.round(a / 1e3)}K`;
  return `${s}$${Math.round(a)}`;
};

// ---------------------------------------------------------------------------
// Vocabulary: same rows, two languages
// ---------------------------------------------------------------------------

export const VOCAB: Record<ColumnKind, Vocab> = {
  fp: {
    title: 'For-profit',
    sub: 'Subscription customers',
    revenue: 'Total revenue, last 12 months',
    begin: 'Beginning ARR',
    add: 'New customers',
    up: 'Expansion (upgrades, seats, price)',
    down: 'Contraction (downgrades)',
    lost: 'Churned (cancelled)',
    end: 'Ending ARR',
    retained: 'Retained ARR',
    share: 'Recurring share of revenue',
    shareNote: 'average ARR ÷ revenue',
    startCount: 'Customers at start of year',
    newCount: 'New customers',
    lostCount: 'Customers lost',
    endCount: 'Customers at end of year',
    unitChurn: 'Logo (customer account) churn',
    dollarChurn: 'Revenue churn',
    avgLost: 'Average ARR per lost customer',
    avgAccount: 'Average ARR per customer',
    life: 'Implied average customer life',
    standStill: 'New ARR needed to stand still',
    narLabel: 'Net ARR retention',
    netNote: 'net: upgrades netted against downgrades and cancellations, new customers excluded',
    grossNote: 'gross: downgrades and cancellations only, no credit for upgrades, new customers excluded',
    churnLabel: 'Revenue churn (ARR lost ÷ beginning ARR)',
    units: ['customer', 'customers'],
    bridge: ['Start', 'New', 'Expansion', 'Downgrades', 'Churn', 'End'],
  },
  nfp: {
    title: 'Not-for-profit',
    sub: 'Individual donors',
    revenue: 'Total revenue, last 12 months, all sources',
    begin: "Last year's giving from the donor base",
    add: 'New donors',
    up: 'Upgrades (donors who gave more)',
    down: 'Downgrades (donors who gave less)',
    lost: 'Lapsed (did not give again)',
    end: "This year's donor giving",
    retained: 'Retained giving',
    share: 'Donor share of revenue',
    shareNote: "this year's giving ÷ revenue",
    startCount: 'Donors at start of year',
    newCount: 'New donors',
    lostCount: 'Donors lapsed',
    endCount: 'Donors at end of year',
    unitChurn: 'Donor churn',
    dollarChurn: 'Dollar churn',
    avgLost: 'Average gift per lapsed donor',
    avgAccount: 'Average gift per donor',
    life: 'Implied average donor life',
    standStill: 'New-donor giving needed to stand still',
    narLabel: 'Net donor revenue retention',
    netNote: 'net: upgrades netted against downgrades and lapsed gifts, new donors excluded',
    grossNote: 'gross: downgrades and lapsed gifts only, no credit for upgrades, new donors excluded',
    churnLabel: 'Donor churn (lapsed ÷ donors at start)',
    units: ['donor', 'donors'],
    bridge: ['Last year', 'New', 'Upgrades', 'Downgrades', 'Lapsed', 'This year'],
  },
};

export const BLANK: RawInputs = {
  revenue: '',
  begin: '',
  add: '',
  up: '',
  down: '',
  lost: '',
  startCount: '',
  newCount: '',
  lostCount: '',
};

/** Sales demo: a $1.95M software company and a $2.4M nonprofit, same year. */
export const DEMO: Record<ColumnKind, ParsedInputs> = {
  fp: { revenue: 1950000, begin: 1600000, add: 520000, up: 210000, down: 95000, lost: 240000, startCount: 240, newCount: 61, lostCount: 34 },
  nfp: { revenue: 2400000, begin: 1300000, add: 380000, up: 160000, down: 110000, lost: 520000, startCount: 1850, newCount: 980, lostCount: 1020 },
};

export const asStrings = (o: ParsedInputs): RawInputs => ({
  revenue: String(o.revenue),
  begin: String(o.begin),
  add: String(o.add),
  up: String(o.up),
  down: String(o.down),
  lost: String(o.lost),
  startCount: String(o.startCount),
  newCount: String(o.newCount),
  lostCount: String(o.lostCount),
});

// ---------------------------------------------------------------------------
// The math
// ---------------------------------------------------------------------------

export function calc(raw: RawInputs, kind: ColumnKind): CalcResult {
  const V = VOCAB[kind];
  const v: ParsedInputs = {
    revenue: Math.max(0, num(raw.revenue)),
    begin: Math.max(0, num(raw.begin)),
    add: Math.max(0, num(raw.add)),
    up: Math.max(0, num(raw.up)),
    down: Math.max(0, num(raw.down)),
    lost: Math.max(0, num(raw.lost)),
    startCount: Math.max(0, num(raw.startCount)),
    newCount: Math.max(0, num(raw.newCount)),
    lostCount: Math.max(0, num(raw.lostCount)),
  };
  const { revenue, begin, add, up, down, lost, startCount, newCount, lostCount } = v;

  const end = begin + add + up - down - lost;
  const netNew = end - begin;
  const retained = begin + up - down - lost;
  const has = begin > 0;

  const growth = has ? netNew / begin : null;
  const nar = has ? retained / begin : null;
  const grr = has ? (begin - down - lost) / begin : null;
  const dollarChurn = has ? lost / begin : null;
  const netChurn = has ? (lost + down - up) / begin : null;

  const logoChurn = startCount > 0 ? lostCount / startCount : null;
  const retention = logoChurn == null ? null : 1 - logoChurn;
  const endCount = startCount + newCount - lostCount;
  const avgAccount = startCount > 0 ? begin / startCount : null;
  const avgLost = lostCount > 0 ? lost / lostCount : null;
  const avgNew = newCount > 0 ? add / newCount : null;
  const lifetime = logoChurn != null && logoChurn > 0 ? 1 / logoChurn : null;

  const standStill = lost + down - up; // what new money must cover before anything counts as growth
  const newNeeded = avgNew != null && avgNew > 0 && standStill > 0 ? standStill / avgNew : null;

  // ARR is a run-rate, so the recurring revenue actually earned in the year is
  // approximated by the average of start and end. Donor giving is the year's
  // actual receipts, so it compares to revenue directly.
  const recurringEarned = kind === 'fp' ? (begin + end) / 2 : end;
  const share = revenue > 0 ? recurringEarned / revenue : null;

  const warnings: string[] = [];
  if (has && down + lost > begin)
    warnings.push(
      kind === 'fp'
        ? 'Downgrades and cancellations add up to more than the beginning ARR, so retained ARR is negative. Check the inputs.'
        : "Downgrades and lapsed gifts add up to more than last year's giving, so retained giving is negative. Check the inputs."
    );
  if (startCount > 0 && lostCount > startCount) warnings.push(`More ${V.units[1]} lost than you started with. Check the counts.`);
  if (share != null && share > 1.0001)
    warnings.push(
      kind === 'fp'
        ? `Average ARR for the year (${usd(recurringEarned)}) is larger than total revenue. If both cover the same 12 months, recurring revenue cannot exceed total revenue. Check the inputs.`
        : `This year's donor giving (${usd(end)}) is larger than total revenue. Check the inputs.`
    );

  return {
    ...v, end, netNew, retained, has, growth, nar, grr, dollarChurn, netChurn, logoChurn, retention, endCount,
    avgAccount, avgLost, avgNew, lifetime, standStill, newNeeded, recurringEarned, share, warnings,
  };
}

// ---------------------------------------------------------------------------
// The words
// ---------------------------------------------------------------------------

/**
 * The ratios measured against the beginning balance are non-null exactly when
 * `has` is true. These two guards re-state that for the type checker; they
 * change no value and no branch.
 */
type WithBase = CalcResult & { growth: number; nar: number; grr: number; dollarChurn: number; netChurn: number };
const hasBase = (c: CalcResult): c is WithBase => c.has;

type WithCounts = CalcResult & { logoChurn: number; retention: number; avgAccount: number };
const hasCounts = (c: CalcResult): c is WithCounts => c.startCount > 0;

export function explain(kind: ColumnKind, c: CalcResult): Explanation {
  const { revenue, begin, add, up, down, lost, end, netNew, growth, retained, nar, grr, has, dollarChurn, netChurn,
    logoChurn, retention, startCount, lostCount, avgAccount, avgLost, avgNew, lifetime, standStill, newNeeded, share } = c;

  const chg = `${netNew >= 0 ? 'up' : 'down'} ${usd(Math.abs(netNew))}${growth != null ? ` (${pct(Math.abs(growth))})` : ''}`;
  const empty = !has && add === 0 && up === 0 && down === 0 && lost === 0;
  const sizeRatio = avgLost != null && avgAccount != null && avgAccount > 0 ? avgLost / avgAccount : null;

  const arr: string[] = [];
  const narText: string[] = [];
  const churn: string[] = [];

  if (kind === 'fp') {
    // ARR
    if (empty) {
      arr.push('Enter the ARR you started the year with and the four things that moved it. The bridge and the explanation fill in as you type.');
    } else {
      arr.push(
        `You started the year with ${usd(begin)} of annual recurring revenue. New customers added ${usd(add)}, existing customers grew ${usd(up)} through expansion, and you gave back ${usd(down)} to downgrades and ${usd(lost)} to cancellations. You ended at ${usd(end)}, ${chg} for the year.`
      );
      if (revenue > 0 && share != null) {
        if (share > 1.0001) {
          // the warning under the bridge covers this
        } else if (share >= 0.98) {
          arr.push(`Essentially all of the year's ${usd(revenue)} in revenue was recurring.`);
        } else {
          arr.push(
            `Averaging the start and end of the year, about ${split(share)[0]} of the ${usd(revenue)} in revenue was recurring. The other ${split(share)[1]} was one-time: services, setup fees, hardware, usage overages. Recurring dollars are worth more because they come back next year without being re-sold.`
          );
        }
      } else {
        arr.push('Add total revenue at the top to see how much of the business is recurring.');
      }
    }
    // NAR
    if (!hasBase(c)) {
      narText.push('Net ARR retention needs a beginning ARR to measure against.');
    } else {
      narText.push(
        `Set new customers aside. The ${usd(begin)} you started with became ${usd(retained)} on its own: ${usd(up)} of expansion, less ${usd(down + lost)} of downgrades and cancellations. That is net ARR retention of ${pct(nar)}. Gross retention, which ignores expansion, is ${pct(grr)}; it can never exceed 100% and is the floor under the number.`
      );
      if (c.nar >= 1.2)
        narText.push(`Above 120% is best-in-class. The existing base grows ${pct(c.nar - 1, 0)} a year before a single new sale, which is why buyers and investors weight this number so heavily.`);
      else if (c.nar >= 1)
        narText.push(`Above 100% means the base grows on its own, ${pct(c.nar - 1, 0)} a year, so every new customer is pure growth on top of it.`);
      else if (c.nar >= 0.9)
        narText.push(`Just under 100%. The base shrinks ${pct(1 - c.nar)} a year by itself, so new sales have to cover ${usd(begin - retained)} before any of them count as growth.`);
      else
        narText.push(`Below 90% the bucket is leaking. New sales must replace ${usd(begin - retained)}, ${pct(1 - c.nar)} of the base, every year just to stand still. Fixing retention is usually cheaper than selling that much.`);
    }
    // Churn
    if (startCount === 0 && !has) {
      churn.push('Enter customer counts here and a beginning ARR above to measure churn.');
    } else {
      if (startCount > 0)
        churn.push(`You lost ${int(lostCount)} of ${int(startCount)} customers, ${pct(logoChurn)} logo (customer account) churn, and ${usd(lost)} of ARR, ${pct(dollarChurn)} revenue churn.`);
      else churn.push(`You lost ${usd(lost)} of ARR, ${pct(dollarChurn)} revenue churn. Add customer counts to see logo (customer account) churn.`);
      if (hasBase(c))
        churn.push(
          c.netChurn < 0
            ? `Netting expansion against every loss gives net negative churn of ${pct(-c.netChurn)}: upgrades from customers who stayed more than covered the ones who left.`
            : `Add downgrades and net out expansion, and net churn is ${pct(netChurn)}.`
        );
      if (sizeRatio != null)
        churn.push(
          `The average customer who left was paying ${usd(avgLost)} a year, against ${usd(avgAccount)} across the book. ${
            sizeRatio > 1.15
              ? 'You are losing larger-than-average accounts, which is the expensive kind of churn.'
              : sizeRatio < 0.85
              ? 'Churn is concentrated in smaller accounts, which is the cheaper kind.'
              : 'Churn is not concentrated at either end of the customer base.'
          }`
        );
      if (lifetime != null)
        churn.push(`At ${pct(logoChurn)} a year the average customer stays about ${lifetime.toFixed(1)} years, which caps what a customer can ever be worth and what you can afford to spend to win one.`);
      if (has)
        churn.push(
          standStill > 0
            ? `To hold ARR flat you must sell ${usd(standStill)} of new ARR every year, ${pct(standStill / begin)} of the base, before any growth shows. This year you sold ${usd(add)}, ${
                add >= standStill ? `so ${usd(add - standStill)} of it was real growth` : `which fell ${usd(standStill - add)} short`
              }.`
            : `Expansion outran every loss by ${usd(-standStill)}, so ARR would have grown even with no new customers at all.`
        );
      if (startCount > 0 && avgLost != null && avgLost > 0 && logoChurn != null && logoChurn > 0.05)
        churn.push(`Keeping 5 more customers in every 100 would hold on to about ${count(0.05 * startCount, ['customer', 'customers'])} and ${usd(0.05 * startCount * avgLost)} of ARR a year.`);
    }
  } else {
    // ARR (donor giving)
    if (empty) {
      arr.push("Enter what last year's donors gave and what happened to them this year. The bridge and the explanation fill in as you type.");
    } else {
      arr.push(
        `Last year's donors gave ${usd(begin)}. This year, new donors brought in ${usd(add)}, donors who increased their gifts added ${usd(up)}, donors who gave less cost ${usd(down)}, and donors who lapsed took ${usd(lost)} with them. This year's donor giving is ${usd(end)}, ${chg} on last year.`
      );
      if (revenue > 0 && share != null) {
        if (share > 1.0001) {
          // the warning under the bridge covers this
        } else if (share >= 0.98) {
          arr.push(`Essentially all of the year's ${usd(revenue)} in revenue came from individual donors, so there is no grant or earned-income cushion if giving dips.`);
        } else {
          arr.push(
            `Individual donors provided ${split(share)[0]} of the year's ${usd(revenue)} in revenue; the other ${split(share)[1]} came from grants, program fees, events or investment income. The donor share is the part retention work can grow.`
          );
        }
      } else {
        arr.push('Add total revenue at the top to see how much of the organization runs on individual donors.');
      }
    }
    // NAR
    if (!hasBase(c)) {
      narText.push("Net donor revenue retention needs last year's giving to measure against.");
    } else {
      narText.push(
        `Set new donors aside. The ${usd(begin)} last year's donors gave became ${usd(retained)} from those same people this year: ${usd(up)} in upgrades, less ${usd(down + lost)} in downgrades and lapsed gifts. That is net donor revenue retention of ${pct(nar)}. Gross retention, ignoring upgrades, is ${pct(grr)}.`
      );
      if (c.nar >= 1)
        narText.push("Above 100% is rare for a nonprofit: last year's donors gave more this year than the whole base gave last year, so every new donor is pure growth.");
      else if (c.nar >= 0.8)
        narText.push(`Keeping ${pct(c.nar, 0)} of last year's dollars is strong for the sector. New donors only have to replace ${usd(begin - retained)} before giving grows.`);
      else if (c.nar >= 0.6)
        narText.push(`The base gave back ${pct(1 - c.nar, 0)} of its dollars this year, which is common in the sector: new donors do most of the refilling. Upgrade asks and monthly-giving conversions are the levers that move this number.`);
      else
        narText.push(`Heavy leakage. New donors must replace ${usd(begin - retained)}, ${pct(1 - c.nar, 0)} of last year's giving, before totals grow at all. A lapsed-donor reactivation program usually pays back faster than acquisition here.`);
    }
    // Churn
    if (startCount === 0 && !has) {
      churn.push("Enter donor counts here and last year's giving above to measure donor churn.");
    } else {
      if (hasCounts(c))
        churn.push(
          `${int(lostCount)} of ${int(startCount)} donors did not give again this year: a ${pct(retention)} retention rate, or ${pct(logoChurn)} lapsed. Sector-wide retention has hovered in the low-to-mid 40s for years, so this is ${
            c.retention >= 0.5 ? 'better than typical' : c.retention >= 0.4 ? 'about typical' : 'below typical'
          }.`
        );
      if (has || lost > 0) churn.push(
        `${startCount > 0 ? 'Those lapsed donors' : 'Lapsed donors'} gave ${usd(lost)} last year${has ? `, ${pct(dollarChurn)} of the base` : ''}${
          sizeRatio != null ? `, about ${usd(avgLost)} each against ${usd(avgAccount)} for the average donor` : ''
        }.`
      );
      if (sizeRatio != null && sizeRatio > 1.15) churn.push('You are losing your larger givers, which hurts more than the count suggests.');
      else if (sizeRatio != null && sizeRatio < 0.85) churn.push('The lapse is mostly small gifts, which is the cheaper kind to lose and the easiest to win back.');
      if (hasBase(c))
        churn.push(
          c.netChurn < 0
            ? `Netting upgrades against every loss gives net negative churn of ${pct(-c.netChurn)}: donors who stayed gave more than the lapsed and downgraded donors took away.`
            : `Add downgrades and net out upgrades, and net churn on last year's dollars is ${pct(netChurn)}.`
        );
      if (lifetime != null) churn.push(`At ${pct(logoChurn)} lapsing a year, the average donor stays about ${lifetime.toFixed(1)} years.`);
      if (has)
        churn.push(
          standStill > 0
            ? `To keep giving flat you need ${usd(standStill)} from new donors every year${
                avgNew ? `, roughly ${int(newNeeded)} new donors at this year's average first gift of ${usd(avgNew)}` : ''
              }. This year new donors gave ${usd(add)}, ${add >= standStill ? `enough to cover it with ${usd(add - standStill)} to spare` : `${usd(standStill - add)} short`}.`
            : `Upgrades outran every loss by ${usd(-standStill)}, so giving would have grown even without a single new donor.`
        );
      if (startCount > 0 && avgLost != null && avgLost > 0 && logoChurn != null && logoChurn > 0.05)
        churn.push(`Keeping 5 more donors in every 100 would hold on to about ${count(0.05 * startCount, ['donor', 'donors'])} and ${usd(0.05 * startCount * avgLost)} a year, usually for far less than it costs to find that money from new donors.`);
    }
  }

  // status pills
  let narPill: Pill = null;
  if (nar != null) {
    if (kind === 'fp')
      narPill = nar >= 1.2 ? { tone: 'good', text: 'Best-in-class' } : nar >= 1 ? { tone: 'good', text: 'Base grows on its own' } : nar >= 0.9 ? { tone: 'flat', text: 'Base shrinking slowly' } : { tone: 'warn', text: 'Base is leaking' };
    else
      narPill = nar >= 1 ? { tone: 'good', text: 'Base grows on its own' } : nar >= 0.8 ? { tone: 'good', text: 'Strong for the sector' } : nar >= 0.6 ? { tone: 'flat', text: 'Typical for the sector' } : { tone: 'warn', text: 'Heavy leakage' };
  }
  let churnPill: Pill = null;
  if (kind === 'fp' && dollarChurn != null)
    churnPill = dollarChurn <= 0.1 ? { tone: 'good', text: 'Low' } : dollarChurn <= 0.2 ? { tone: 'flat', text: 'Moderate' } : { tone: 'warn', text: 'High' };
  if (kind === 'nfp' && retention != null)
    churnPill = retention >= 0.5 ? { tone: 'good', text: 'Above sector norm' } : retention >= 0.4 ? { tone: 'flat', text: 'Around sector norm' } : { tone: 'warn', text: 'Below sector norm' };
  const arrPill: Pill = empty ? null : { tone: netNew >= 0 ? 'good' : 'warn', text: `${netNew >= 0 ? 'Up' : 'Down'} ${growth != null ? pct(Math.abs(growth)) : usd(Math.abs(netNew))} for the year` };

  return { arr, nar: narText, churn, arrPill, narPill, churnPill };
}

// ---------------------------------------------------------------------------
// How to read it — static notes, one per section per column
// ---------------------------------------------------------------------------

export const HOW: Record<ColumnKind, { arr: string; nar: string; churn: string }> = {
  fp: {
    arr: 'ARR is a run-rate, not revenue. It is what today\'s subscriptions would bill over the next 12 months if nothing changed, so it leads revenue on the way up and on the way down. The bridge shows the only four things that can move it.',
    nar: 'Also called net revenue retention (NRR) or net dollar retention (NDR). Rules of thumb: 100% or better means the base grows without new sales; 110 to 120% is strong; 120% and up is best-in-class enterprise software; under 90% and growth depends entirely on new logos (customer accounts).',
    churn: 'Logo (customer account) churn counts customers; revenue churn counts dollars. They diverge when the customers you lose are larger or smaller than average. Rough annual ranges: enterprise under 10%, mid-market 10 to 20%, small-business and self-serve often above 20%.',
  },
  nfp: {
    arr: 'There is no subscription to annualize, so the base is what last year\'s donors gave. What those same donors gave this year, plus new donors, is the equivalent of ending ARR. Monthly sustainers are the closest thing a nonprofit has to true ARR.',
    nar: 'Same math, applied to last year\'s donors. Nonprofits rarely clear 100% because most donors give the same or less year to year; the number moves with upgrade asks, monthly-giving conversions and lapsed-donor reactivation.',
    churn: 'Donor churn is one minus the retention rate. Fundraising Effectiveness Project benchmarks: overall retention in the low-to-mid 40s, first-time donors around 20%, repeat donors around 60%. Most lapsing happens right after the first gift.',
  },
};
