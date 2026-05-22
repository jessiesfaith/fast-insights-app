// Eight default KPIs (BUILD.md §7) computed for a given period, with
// delta vs the prior period.
//
// All KPIs are pure functions of (data, period). They re-use the recon and
// aging modules so the dashboard numbers are internally consistent.

import { ARData } from '../types/data';
import { KPIBundle, KPIKey, KPIResult, KPIUnit } from '../types/kpi';
import { buildAging } from './aging';
import { ACCT_AR, computeSubledgerAR } from './recon';
import { isWithin, periodBounds, priorPeriod } from './period';

// -------- individual KPI functions ----------------------------------------

/**
 * DSO countback: walk back from period_end summing daily revenue (invoice
 * total_amount, by invoice_date). When cumulative ≥ ending AR, return the
 * number of days walked.
 */
export function dsoCountback(data: ARData, periodEnd: string, endingAR: number): number {
  if (endingAR <= 0) return 0;
  const byDate = new Map<string, number>();
  for (const inv of data.invoices) {
    if (!inv.invoice_date) continue;
    if (inv.invoice_date.slice(0, 10) > periodEnd.slice(0, 10)) continue;
    byDate.set(inv.invoice_date, (byDate.get(inv.invoice_date) ?? 0) + inv.total_amount);
  }
  let cumulative = 0;
  let days = 0;
  const day = new Date(periodEnd + 'T00:00:00Z');
  const MAX_DAYS = 365 * 3;
  while (cumulative < endingAR && days < MAX_DAYS) {
    const iso = day.toISOString().slice(0, 10);
    cumulative += byDate.get(iso) ?? 0;
    days++;
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return days;
}

export function unappliedCash(data: ARData, periodEnd: string): number {
  let total = 0;
  for (const r of data.receipts) {
    if (r.receipt_date.slice(0, 10) > periodEnd.slice(0, 10)) continue;
    if (r.status === 'Unapplied' || r.amount_applied < r.amount) {
      total += r.amount - r.amount_applied;
    }
  }
  return total;
}

export function unappliedCredits(data: ARData, periodEnd: string): number {
  let total = 0;
  for (const m of data.creditMemos) {
    if (m.memo_date.slice(0, 10) > periodEnd.slice(0, 10)) continue;
    if (m.status === 'Unapplied' || !m.applied_to_invoice_id) {
      total += m.amount;
    }
  }
  return total;
}

export function shortPay(data: ARData, periodEnd: string): number {
  // Pre-index applied receipts and applied credits per invoice.
  const recvByInv = new Map<string, number>();
  for (const r of data.receipts) {
    if (!r.invoice_id_applied) continue;
    if (r.receipt_date.slice(0, 10) > periodEnd.slice(0, 10)) continue;
    recvByInv.set(r.invoice_id_applied, (recvByInv.get(r.invoice_id_applied) ?? 0) + r.amount_applied);
  }
  const credByInv = new Map<string, number>();
  for (const m of data.creditMemos) {
    if (m.status !== 'Applied' || !m.applied_to_invoice_id) continue;
    if (m.memo_date.slice(0, 10) > periodEnd.slice(0, 10)) continue;
    credByInv.set(m.applied_to_invoice_id, (credByInv.get(m.applied_to_invoice_id) ?? 0) + m.amount);
  }

  let total = 0;
  for (const inv of data.invoices) {
    const isExplicitShort = inv.status === 'Short Pay - Open';
    const isOpenPastDue =
      inv.status === 'Open' &&
      inv.due_date &&
      inv.due_date.slice(0, 10) < periodEnd.slice(0, 10);
    if (!isExplicitShort && !isOpenPastDue) continue;

    const applied = (recvByInv.get(inv.invoice_id) ?? 0) + (credByInv.get(inv.invoice_id) ?? 0);
    const shortfall = inv.total_amount - applied;
    if (shortfall > 0.005 && applied > 0.005) {
      // only count as "short pay" when something has been paid but not the whole invoice
      total += shortfall;
    } else if (isExplicitShort) {
      total += shortfall;
    }
  }
  return total;
}

/**
 * Days-to-apply (median) for receipts whose application landed in the period.
 *
 * For each receipt with a corresponding GL clearing entry (entry_type='Receipt',
 * source_doc=receipt_id, account_code=1200), the days-to-apply is
 * (gl_entry_date − receipt_date). Median across the period is the KPI.
 */
export function daysToApplyMedian(data: ARData, periodStart: string, periodEnd: string): number {
  const samples: number[] = [];
  // index GL clearing entries by source_doc for O(1) lookup
  const clearingByReceipt = new Map<string, string>(); // receipt_id → gl entry_date
  for (const e of data.glEntries) {
    if (e.entry_type !== 'Receipt' || e.account_code !== ACCT_AR) continue;
    if (!e.source_doc) continue;
    // first match wins (single clearing entry per receipt is the norm)
    if (!clearingByReceipt.has(e.source_doc)) {
      clearingByReceipt.set(e.source_doc, e.entry_date);
    }
  }
  for (const r of data.receipts) {
    if (!isWithin(r.receipt_date, periodStart, periodEnd)) continue;
    const glDate = clearingByReceipt.get(r.receipt_id);
    if (!glDate) continue;
    const days = Math.round(
      (Date.parse(glDate + 'T00:00:00Z') - Date.parse(r.receipt_date + 'T00:00:00Z')) / 86_400_000,
    );
    if (Number.isFinite(days) && days >= 0) samples.push(days);
  }
  if (samples.length === 0) return 0;
  samples.sort((a, b) => a - b);
  const mid = Math.floor(samples.length / 2);
  return samples.length % 2 === 0 ? (samples[mid - 1] + samples[mid]) / 2 : samples[mid];
}

// -------- bundle ----------------------------------------------------------

export const KPI_META: Record<KPIKey, { label: string; unit: KPIUnit; goodDirection: 'up' | 'down' }> = {
  dso:                 { label: 'DSO (countback)',   unit: 'days', goodDirection: 'down' },
  pctCurrent:          { label: '% Current',         unit: 'pct',  goodDirection: 'up' },
  pastDuePct:          { label: 'Past Due %',        unit: 'pct',  goodDirection: 'down' },
  topTenConcentration: { label: 'Top 10 concentration', unit: 'pct', goodDirection: 'down' },
  unappliedCash:       { label: 'Unapplied Cash',    unit: 'money', goodDirection: 'down' },
  unappliedCredits:    { label: 'Unapplied Credits', unit: 'money', goodDirection: 'down' },
  shortPay:            { label: 'Short Pay $',       unit: 'money', goodDirection: 'down' },
  daysToApplyMedian:   { label: 'Days to Apply (med)', unit: 'days', goodDirection: 'down' },
};

/**
 * Auditor-facing formula description per KPI. Surfaced in the dashboard tile
 * (info popover) and the Excel KPIs sheet. Keep these in sync with the math
 * implemented in this file.
 */
export const KPI_FORMULA: Record<KPIKey, string> = {
  dso:
    'Walk back day-by-day from period_end summing daily revenue (Σ invoice.total_amount where invoice_date == that day). Days walked when cumulative revenue ≥ ending Subledger AR = DSO. Honest with seasonality vs the avg-AR/avg-rev shortcut.',
  pctCurrent:
    '(Σ open balance in the Current bucket — invoices not yet past due_date) ÷ Total open AR. Open balance = invoice.total_amount − Σ applied receipts − Σ applied credit memos.',
  pastDuePct:
    '(Σ open balance past due_date) ÷ Total open AR. Equivalent to 1 − %Current. Buckets: 1–30, 31–60, 61–90, 90+ days past due.',
  topTenConcentration:
    '(Σ open AR for the top 10 customers by AR balance) ÷ Total open AR. Highlights customer-level concentration risk.',
  unappliedCash:
    'Σ (receipt.amount − receipt.amount_applied) for receipts where status = "Unapplied" OR amount_applied < amount OR invoice_id_applied is null, with receipt_date ≤ period_end.',
  unappliedCredits:
    'Σ memo.amount for credit memos where status = "Unapplied" OR applied_to_invoice_id is null, with memo_date ≤ period_end.',
  shortPay:
    'Σ shortfall on invoices with status = "Short Pay - Open" OR invoices in "Open" status that are past due_date AND partially paid (some receipts/credits applied but applied < total). Shortfall = total_amount − applied receipts − applied credit memos.',
  daysToApplyMedian:
    'Median (gl_entry.entry_date − receipt.receipt_date) days for receipts whose period falls in [period_start, period_end] and have a matching GL clearing entry (account_code=1200, entry_type="Receipt", source_doc=receipt_id).',
};

function computeAll(data: ARData, period: string): Record<KPIKey, number> {
  const { start, end } = periodBounds(period);
  const sub = computeSubledgerAR(data, end);
  const aging = buildAging(data, period);
  const top10 = aging.byCustomer.slice(0, 10).reduce((s, c) => s + c.total, 0);
  const totalAR = aging.totalOpenAR;
  const currentAmt = aging.totals.find((t) => t.bucket === 'Current')?.amount ?? 0;
  const pastDueAmt = aging.totals
    .filter((t) => t.bucket !== 'Current')
    .reduce((s, t) => s + t.amount, 0);

  return {
    dso: dsoCountback(data, end, sub.total),
    pctCurrent: totalAR === 0 ? 0 : currentAmt / totalAR,
    pastDuePct: totalAR === 0 ? 0 : pastDueAmt / totalAR,
    topTenConcentration: totalAR === 0 ? 0 : top10 / totalAR,
    unappliedCash: unappliedCash(data, end),
    unappliedCredits: unappliedCredits(data, end),
    shortPay: shortPay(data, end),
    daysToApplyMedian: daysToApplyMedian(data, start, end),
  };
}

const KEY_ORDER: KPIKey[] = [
  'dso',
  'pctCurrent',
  'pastDuePct',
  'topTenConcentration',
  'unappliedCash',
  'unappliedCredits',
  'shortPay',
  'daysToApplyMedian',
];

export function buildKPIs(data: ARData, period: string): KPIBundle {
  const current = computeAll(data, period);

  const prior = priorPeriod(period);
  // only compute prior if any data falls in or before that period — otherwise
  // the prior values are meaningless and we'd mis-render a "+100%" delta.
  const priorEnd = periodBounds(prior).end;
  const hasPriorActivity = data.invoices.some(
    (i) => i.invoice_date && i.invoice_date.slice(0, 10) <= priorEnd,
  );
  const priorVals: Record<KPIKey, number> | null = hasPriorActivity ? computeAll(data, prior) : null;

  const results: KPIResult[] = KEY_ORDER.map((key) => {
    const meta = KPI_META[key];
    const cur = current[key];
    const pr = priorVals ? priorVals[key] : null;
    const delta = pr === null ? null : cur - pr;
    const deltaPct = pr === null || pr === 0 ? null : (cur - pr) / Math.abs(pr);
    return {
      key,
      label: meta.label,
      unit: meta.unit,
      current: cur,
      prior: pr,
      delta,
      deltaPct,
      goodDirection: meta.goodDirection,
    };
  });

  return {
    period: { current: period, prior: hasPriorActivity ? prior : null },
    results,
  };
}
