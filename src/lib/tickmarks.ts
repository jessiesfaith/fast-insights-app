// Tickmark export helpers — turn a (rowType, rowId) pair into a human-
// readable line label + amount, and assemble a sign-off list ordered by
// section for the audit pack and the Excel "Tickmarks" sheet.

import { ARData } from '../types/data';
import { CATEGORY_LABEL, ExceptionCategory } from '../types/exception';
import {
  TICKMARK_LEGEND,
  TickmarkLetter,
  TickmarkMap,
  TickmarkRecord,
  TickmarkRowType,
} from '../types/audit';
import { runDetection } from './detect';
import { buildAging } from './aging';
import { buildKPIs } from './kpis';
import { buildARBridge, buildThreeWay } from './recon';

export interface TickmarkContext {
  /** Top-level audit-pack section, e.g. "Three-way recon", "AR Bridge". */
  section: string;
  /** Single-line description of the row, e.g. "A. Subledger AR" or invoice descriptor. */
  line: string;
  /** Dollar value associated with the row (null if N/A — e.g. KPIs in days). */
  amount: number | null;
}

const KPI_LABEL: Record<string, string> = {
  dso: 'DSO (countback)',
  pctCurrent: '% Current',
  pastDuePct: 'Past Due %',
  topTenConcentration: 'Top 10 concentration',
  unappliedCash: 'Unapplied Cash',
  unappliedCredits: 'Unapplied Credits',
  shortPay: 'Short Pay $',
  daysToApplyMedian: 'Days to Apply (med)',
};

const RECON_LABEL: Record<string, string> = {
  sub: 'A. Subledger AR',
  gl: 'B. GL 1200',
  bank: 'C. Bank cleared',
};

const BRIDGE_LABEL: Record<string, string> = {
  beg: 'Beginning AR',
  bill: 'Billings (new invoices)',
  cash: 'Cash applied',
  credits: 'Credit memos applied',
  wo: 'Write-offs',
  adj: 'Adjustments',
  ending: 'Ending AR (computed)',
};

/**
 * Resolve a tickmark to a section + line + amount for display in exports.
 * Heavy lookups (recon, aging, detection) are done lazily and cached.
 */
export function resolveTickmarkContext(
  type: TickmarkRowType,
  id: string,
  data: ARData,
  _period: string,
  caches: ResolverCaches,
): TickmarkContext {
  switch (type) {
    case 'invoice': {
      const inv = data.invoices.find((i) => i.invoice_id === id);
      return {
        section: 'Invoices',
        line: inv ? `${inv.invoice_id} · ${inv.customer_id} · ${inv.status}` : id,
        amount: inv ? inv.total_amount : null,
      };
    }
    case 'receipt': {
      const r = data.receipts.find((x) => x.receipt_id === id);
      return {
        section: 'Cash receipts',
        line: r ? `${r.receipt_id} · ${r.customer_id} · ${r.payment_method}` : id,
        amount: r ? r.amount : null,
      };
    }
    case 'creditMemo': {
      const m = data.creditMemos.find((x) => x.memo_id === id);
      return {
        section: 'Credit memos',
        line: m ? `${m.memo_id} · ${m.customer_id} · ${m.reason}` : id,
        amount: m ? m.amount : null,
      };
    }
    case 'glEntry': {
      const e = data.glEntries.find((x) => x.entry_id === id);
      return {
        section: 'GL entries',
        line: e ? `${e.entry_id} · ${e.account_code} · ${e.entry_type} · ${e.source_doc}` : id,
        amount: e ? (e.debit > 0 ? e.debit : e.credit) : null,
      };
    }
    case 'bankStatement': {
      const b = data.bankStatements.find((x) => x.line_id === id);
      return {
        section: 'Bank statements',
        line: b ? `${b.line_id} · ${b.transaction_type} · ${b.value_date}` : id,
        amount: b ? (b.debit > 0 ? b.debit : b.credit) : null,
      };
    }
    case 'kpi': {
      const bundle = caches.kpiBundle();
      const k = bundle?.results.find((r) => r.key === id);
      return {
        section: 'KPI summary',
        line: KPI_LABEL[id] ?? id,
        amount: k && k.unit === 'money' ? k.current : null,
      };
    }
    case 'recon': {
      const recon = caches.recon();
      // Balance rows
      if (id === 'sub') return { section: 'Three-way recon', line: RECON_LABEL[id], amount: recon?.subledgerAR.amount ?? null };
      if (id === 'gl') return { section: 'Three-way recon', line: RECON_LABEL[id], amount: recon?.gl1200.amount ?? null };
      if (id === 'bank') return { section: 'Three-way recon', line: RECON_LABEL[id], amount: recon?.bankCleared.amount ?? null };
      // Variance items
      const item =
        recon?.subledgerVsGL.items.find((x) => x.id === id) ??
        recon?.glVsBank.items.find((x) => x.id === id);
      return {
        section: 'Three-way recon',
        line: item ? `Reconciling: ${item.label}` : id,
        amount: item ? item.amount : null,
      };
    }
    case 'bridge': {
      const bridge = caches.bridge();
      const map: Record<string, number | null> = bridge
        ? {
            beg: bridge.beginningAR,
            bill: bridge.billings,
            cash: -bridge.cashApplied,
            credits: -bridge.creditsApplied,
            wo: -bridge.writeOffs,
            adj: bridge.adjustments,
            ending: bridge.endingARComputed,
          }
        : {};
      return {
        section: 'AR Bridge',
        line: BRIDGE_LABEL[id] ?? id,
        amount: map[id] ?? null,
      };
    }
    case 'aging': {
      const aging = caches.aging();
      const bucket = aging?.totals.find((t) => t.bucket === id);
      if (bucket) {
        return {
          section: 'Aging schedule',
          line: bucket.bucket === 'Current' ? 'Current' : `${bucket.bucket} d`,
          amount: bucket.amount,
        };
      }
      // could be a customer_id
      const cust = aging?.byCustomer.find((c) => c.customer_id === id);
      if (cust) {
        return {
          section: 'Aging schedule (customer)',
          line: `${cust.customer_name} (${cust.customer_id})`,
          amount: cust.total,
        };
      }
      return { section: 'Aging schedule', line: id, amount: null };
    }
    case 'exception': {
      const detection = caches.detection();
      // category-level summary tickmark (id = ExceptionCategory)
      const agg = detection?.byCategory.find((c) => c.category === id);
      if (agg) {
        return {
          section: 'Exception summary',
          line: CATEGORY_LABEL[id as ExceptionCategory] ?? id,
          amount: agg.impact,
        };
      }
      // exception_id-level
      const exc = detection?.exceptions.find((e) => e.exception_id === id);
      if (exc) {
        return {
          section: 'Exception summary',
          line: `${CATEGORY_LABEL[exc.category]} · ${exc.customer_id ?? ''}`,
          amount: exc.amount_impact,
        };
      }
      return { section: 'Exception summary', line: id, amount: null };
    }
  }
}

/** Lazy caches so a batch of tickmark resolutions only computes each derivative once. */
export interface ResolverCaches {
  recon: () => ReturnType<typeof buildThreeWay> | null;
  bridge: () => ReturnType<typeof buildARBridge> | null;
  aging: () => ReturnType<typeof buildAging> | null;
  kpiBundle: () => ReturnType<typeof buildKPIs> | null;
  detection: () => ReturnType<typeof runDetection> | null;
}

export function buildResolverCaches(data: ARData, period: string): ResolverCaches {
  let recon: ReturnType<typeof buildThreeWay> | null | undefined;
  let bridge: ReturnType<typeof buildARBridge> | null | undefined;
  let aging: ReturnType<typeof buildAging> | null | undefined;
  let kpiBundle: ReturnType<typeof buildKPIs> | null | undefined;
  let detection: ReturnType<typeof runDetection> | null | undefined;
  return {
    recon: () => (recon === undefined ? (recon = buildThreeWay(data, period)) : recon),
    bridge: () => (bridge === undefined ? (bridge = buildARBridge(data, period)) : bridge),
    aging: () => (aging === undefined ? (aging = buildAging(data, period)) : aging),
    kpiBundle: () => (kpiBundle === undefined ? (kpiBundle = buildKPIs(data, period)) : kpiBundle),
    detection: () => (detection === undefined ? (detection = runDetection(data)) : detection),
  };
}

// ---- sign-off list -------------------------------------------------------

export interface TickmarkSignoff {
  type: TickmarkRowType;
  rowId: string;
  letter: TickmarkLetter;
  meaning: string;
  section: string;
  line: string;
  amount: number | null;
  actor: string;
  timestamp: string;
}

/** Optional preparer-entered ending balance entry to surface in the sign-off list. */
export interface BridgePreparerEntry {
  amount: number;
  actor: string;
  timestamp: string;
}

/**
 * Flatten the tickmark map into a sign-off list, sorted by section then by
 * line then by letter. Used by the audit pack and Excel exports.
 *
 * If a preparer-entered AR Bridge ending balance is supplied, it's prepended
 * as a synthetic row so the audit trail shows who entered the number and when.
 */
export function buildTickmarkSignoffs(
  tickmarks: TickmarkMap,
  data: ARData,
  period: string,
  bridgeEntry?: BridgePreparerEntry,
): TickmarkSignoff[] {
  const caches = buildResolverCaches(data, period);
  const out: TickmarkSignoff[] = [];
  for (const [key, record] of Object.entries(tickmarks) as [string, TickmarkRecord][]) {
    const parts = key.split(':');
    if (parts.length < 3) continue;
    // type and letter are at the ends; id may itself contain colons
    const type = parts[0] as TickmarkRowType;
    const letter = parts[parts.length - 1] as TickmarkLetter;
    const id = parts.slice(1, -1).join(':');
    const ctx = resolveTickmarkContext(type, id, data, period, caches);
    out.push({
      type,
      rowId: id,
      letter,
      meaning: TICKMARK_LEGEND[letter] ?? '',
      section: ctx.section,
      line: ctx.line,
      amount: ctx.amount,
      actor: record.actor || 'unknown',
      timestamp: record.timestamp || '',
    });
  }

  if (bridgeEntry && Number.isFinite(bridgeEntry.amount)) {
    // synthetic row — not a clickable tickmark, just an audit-trail entry
    // showing who entered the preparer ending balance and when.
    out.unshift({
      type: 'bridge',
      rowId: 'preparer-ending',
      letter: '*' as unknown as TickmarkLetter, // sentinel rendered as "—" in the UI
      meaning: 'Preparer entered ending balance',
      section: 'AR Bridge',
      line: 'Preparer ending balance (entered)',
      amount: bridgeEntry.amount,
      actor: bridgeEntry.actor || 'unknown',
      timestamp: bridgeEntry.timestamp || '',
    });
  }

  out.sort(
    (a, b) =>
      a.section.localeCompare(b.section) ||
      a.line.localeCompare(b.line) ||
      a.letter.localeCompare(b.letter),
  );
  return out;
}
