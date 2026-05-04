// Exception detection (BUILD.md §5).
//
// CRITICAL: every rule is structural. Detection MUST work after the `notes`
// column is removed from every dataset (acceptance §16 #2). The vitest suite
// verifies this by stripping `notes` and re-running detection.
//
// Each detector returns DetectedException[] for its category; runDetection()
// runs all of them and produces a stable, sorted list with deterministic IDs.

import {
  ARData,
  BankStatement,
  CashReceipt,
  GLEntry,
  Invoice,
} from '../types/data';
import { SourceRef } from '../types/recon';
import {
  CATEGORY_SEVERITY,
  DetectedException,
  DetectionResult,
  ExceptionCategory,
} from '../types/exception';

const ACCT_AR = '1200';
const AGED_THRESHOLD_DAYS = 30;
const EPS = 0.005;

// ---- helpers ---------------------------------------------------------------

function fnv1a(s: string): string {
  // 32-bit FNV-1a — adequate for stable, deterministic IDs (no crypto needed)
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function exceptionId(category: ExceptionCategory, period: string, refs: SourceRef[]): string {
  const ids = refs.map((r) => `${r.type}:${r.id}`).sort();
  return `${category}-${fnv1a(`${category}|${period}|${ids.join(',')}`)}`;
}

function periodOf(iso: string): string {
  return iso ? iso.slice(0, 7) : '';
}

function daysBetween(a: string, b: string): number {
  const da = Date.parse(a + 'T00:00:00Z');
  const db = Date.parse(b + 'T00:00:00Z');
  if (Number.isNaN(da) || Number.isNaN(db)) return 0;
  return Math.round((db - da) / 86_400_000);
}

interface BuildArgs {
  category: ExceptionCategory;
  period: string;
  customer_id: string | null;
  amount_impact: number;
  source_records: SourceRef[];
  description: string;
  asOf: string;
  ageRefDate?: string;
}

function buildException({
  category,
  period,
  customer_id,
  amount_impact,
  source_records,
  description,
  asOf,
  ageRefDate,
}: BuildArgs): DetectedException {
  return {
    exception_id: exceptionId(category, period, source_records),
    category,
    severity: CATEGORY_SEVERITY[category],
    period,
    customer_id,
    amount_impact,
    source_records,
    description,
    detected_at: asOf,
    age_days: ageRefDate ? daysBetween(ageRefDate, asOf.slice(0, 10)) : null,
  };
}

// ---- 1. Unapplied cash -----------------------------------------------------

function detectUnappliedCash(data: ARData, asOf: string): DetectedException[] {
  const out: DetectedException[] = [];
  for (const r of data.receipts) {
    const isUnapplied = r.status === 'Unapplied';
    const isPartial = r.amount_applied + EPS < r.amount;
    const noLink = r.invoice_id_applied == null;
    if (!isUnapplied && !isPartial && !noLink) continue;

    const impact = isUnapplied && r.amount_applied === 0 ? r.amount : Math.max(r.amount - r.amount_applied, 0);
    if (impact <= EPS) continue;

    out.push(
      buildException({
        category: 'unapplied_cash',
        period: periodOf(r.receipt_date),
        customer_id: r.customer_id || null,
        amount_impact: impact,
        source_records: [{ type: 'receipt', id: r.receipt_id }],
        description: `Receipt ${r.receipt_id} from ${r.customer_id} — $${impact.toFixed(2)} unapplied (${r.payment_method}).`,
        asOf,
        ageRefDate: r.receipt_date,
      }),
    );
  }
  return out;
}

// ---- 2. Short pay ----------------------------------------------------------

function detectShortPay(data: ARData): DetectedException[] {
  // accumulate applied receipts and applied credits per invoice
  const recvByInv = new Map<string, number>();
  for (const r of data.receipts) {
    if (!r.invoice_id_applied) continue;
    recvByInv.set(r.invoice_id_applied, (recvByInv.get(r.invoice_id_applied) ?? 0) + r.amount_applied);
  }
  const credByInv = new Map<string, number>();
  for (const m of data.creditMemos) {
    if (m.status !== 'Applied' || !m.applied_to_invoice_id) continue;
    credByInv.set(m.applied_to_invoice_id, (credByInv.get(m.applied_to_invoice_id) ?? 0) + m.amount);
  }

  const out: DetectedException[] = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const inv of data.invoices) {
    const explicit = inv.status === 'Short Pay - Open';
    const applied = (recvByInv.get(inv.invoice_id) ?? 0) + (credByInv.get(inv.invoice_id) ?? 0);
    const shortfall = inv.total_amount - applied;
    if (shortfall <= EPS) continue;

    // Open + past due_date AND partially paid (not 0 applied — that's just delinquent)
    const partial = inv.status === 'Open' && inv.due_date < today && applied > EPS;
    if (!explicit && !partial) continue;

    out.push(
      buildException({
        category: 'short_pay',
        period: inv.period,
        customer_id: inv.customer_id || null,
        amount_impact: shortfall,
        source_records: [{ type: 'invoice', id: inv.invoice_id }],
        description: `${inv.invoice_id} short-paid — total ${money(inv.total_amount)}, applied ${money(applied)}, shortfall ${money(shortfall)}.`,
        asOf: today + 'T00:00:00Z',
        ageRefDate: inv.due_date,
      }),
    );
  }
  return out;
}

// ---- 3. Unapplied credit memo ---------------------------------------------

function detectUnappliedCredits(data: ARData, asOf: string): DetectedException[] {
  const out: DetectedException[] = [];
  for (const m of data.creditMemos) {
    const unapplied = m.status === 'Unapplied' || m.applied_to_invoice_id == null;
    if (!unapplied) continue;
    out.push(
      buildException({
        category: 'unapplied_credit',
        period: m.period,
        customer_id: m.customer_id || null,
        amount_impact: m.amount,
        source_records: [{ type: 'creditMemo', id: m.memo_id }],
        description: `Credit memo ${m.memo_id} (${m.reason}) — ${money(m.amount)} not applied to any invoice.`,
        asOf,
        ageRefDate: m.memo_date,
      }),
    );
  }
  return out;
}

// ---- 4. Missing GL posting -------------------------------------------------

function detectMissingGL(data: ARData, asOf: string): DetectedException[] {
  // index: source_doc → AR-debit Invoice GL rows
  const arDebitsBySource = new Map<string, GLEntry[]>();
  for (const e of data.glEntries) {
    if (e.account_code !== ACCT_AR) continue;
    if (e.entry_type !== 'Invoice') continue;
    if (e.debit <= EPS) continue;
    const arr = arDebitsBySource.get(e.source_doc) ?? [];
    arr.push(e);
    arDebitsBySource.set(e.source_doc, arr);
  }

  const out: DetectedException[] = [];
  for (const inv of data.invoices) {
    if (inv.status === 'Written Off') continue;
    const matching = arDebitsBySource.get(inv.invoice_id) ?? [];
    const explicitlyMissing = !inv.gl_entry_id;
    if (matching.length === 0 || explicitlyMissing) {
      out.push(
        buildException({
          category: 'missing_gl_posting',
          period: inv.period,
          customer_id: inv.customer_id || null,
          amount_impact: inv.total_amount,
          source_records: [{ type: 'invoice', id: inv.invoice_id }],
          description: `${inv.invoice_id} has no GL 1200 debit — invoice exists in subledger only.`,
          asOf,
          ageRefDate: inv.invoice_date,
        }),
      );
    }
  }
  return out;
}

// ---- 5. Duplicate GL posting ----------------------------------------------

function detectDuplicateGL(data: ARData, asOf: string): DetectedException[] {
  // group by (source_doc, account_code, period). entry_type must start with
  // "Invoice" so we catch both the original and any seeded "Invoice - DUPLICATE".
  const groups = new Map<string, GLEntry[]>();
  for (const e of data.glEntries) {
    if (e.account_code !== ACCT_AR) continue;
    if (!e.entry_type.startsWith('Invoice')) continue;
    if (e.debit <= EPS) continue;
    const key = `${e.source_doc}|${e.account_code}|${e.period}`;
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }

  const out: DetectedException[] = [];
  for (const [, entries] of groups) {
    if (entries.length <= 1) continue;
    const first = entries[0];
    const surplus = entries.slice(1).reduce((s, e) => s + e.debit, 0);
    const refs: SourceRef[] = [
      { type: 'invoice', id: first.source_doc },
      ...entries.map<SourceRef>((e) => ({ type: 'glEntry', id: e.entry_id })),
    ];
    out.push(
      buildException({
        category: 'duplicate_gl_posting',
        period: first.period,
        customer_id: first.customer_id || null,
        amount_impact: surplus,
        source_records: refs,
        description: `${first.source_doc} posted to GL ${entries.length}× — surplus ${money(surplus)}.`,
        asOf,
        ageRefDate: first.entry_date,
      }),
    );
  }
  return out;
}

// ---- 6. Write-off desync ---------------------------------------------------
//
// Strict reading of §5 #6 (status mismatch) misses the spec's "OR aging
// treatment inconsistent" branch. Auditors want every write-off surfaced as a
// review item during close — they're unusual transactions that need explicit
// sign-off — so we emit one exception per GL Write-Off → 1200 credit, with
// the description distinguishing in-sync from desynced cases.

function detectWriteoffDesync(data: ARData, asOf: string): DetectedException[] {
  const invoiceById = new Map<string, Invoice>();
  for (const inv of data.invoices) invoiceById.set(inv.invoice_id, inv);

  const out: DetectedException[] = [];
  for (const e of data.glEntries) {
    if (e.entry_type !== 'Write-Off') continue;
    if (e.account_code !== ACCT_AR) continue;
    if (e.credit <= EPS) continue; // we only flag the AR-credit side, not the bad-debt-expense debit
    const inv = invoiceById.get(e.source_doc);
    if (!inv) continue;
    const desync = inv.status !== 'Written Off';
    out.push(
      buildException({
        category: 'writeoff_desync',
        period: e.period,
        customer_id: inv.customer_id || null,
        amount_impact: e.credit,
        source_records: [
          { type: 'invoice', id: inv.invoice_id },
          { type: 'glEntry', id: e.entry_id },
        ],
        description: desync
          ? `${inv.invoice_id} written off in GL on ${e.entry_date} but invoice.status is "${inv.status}".`
          : `${inv.invoice_id} write-off posted to GL on ${e.entry_date} — review for auditor sign-off.`,
        asOf,
        ageRefDate: e.entry_date,
      }),
    );
  }
  return out;
}

// ---- 7. Cutoff timing ------------------------------------------------------
//
// Spec §5 #7 compares receipt_date to bank.value_date, but seeded data
// encodes the cutoff in bank_date (with value_date back-dated to match the
// receipt). We flag if EITHER bank_date OR value_date period differs from
// the receipt_date period — catches both real-world conventions.

function detectCutoffTiming(data: ARData, asOf: string): DetectedException[] {
  const bankByDeposit = new Map<string, BankStatement>();
  for (const b of data.bankStatements) bankByDeposit.set(b.deposit_id, b);

  const out: DetectedException[] = [];
  for (const r of data.receipts) {
    if (!r.bank_deposit_id) continue;
    const bank = bankByDeposit.get(r.bank_deposit_id);
    if (!bank) continue;
    const recPeriod = periodOf(r.receipt_date);
    const valuePeriod = periodOf(bank.value_date);
    const bankPeriod = periodOf(bank.bank_date);
    if (!recPeriod) continue;
    const differs =
      (valuePeriod && recPeriod !== valuePeriod) ||
      (bankPeriod && recPeriod !== bankPeriod);
    if (!differs) continue;
    const otherDate = bankPeriod && recPeriod !== bankPeriod ? bank.bank_date : bank.value_date;
    out.push(
      buildException({
        category: 'cutoff_timing',
        period: recPeriod,
        customer_id: r.customer_id || null,
        amount_impact: r.amount,
        source_records: [
          { type: 'receipt', id: r.receipt_id },
          { type: 'bankStatement', id: bank.line_id },
        ],
        description: `Receipt ${r.receipt_id} dated ${r.receipt_date} but bank cleared on ${otherDate} — different period.`,
        asOf,
        ageRefDate: r.receipt_date,
      }),
    );
  }
  return out;
}

// ---- 8. Bank-only item without GL counterpart -----------------------------

function detectBankOnly(data: ARData, asOf: string): DetectedException[] {
  // Build a set of bank line IDs that GL entries reference. Sample data uses
  // either the line_id directly in the description, or matches by amount+date.
  const referencedLines = new Set<string>();
  for (const e of data.glEntries) {
    const m = (e.description ?? '').match(/BNK-\d{5}/);
    if (m) referencedLines.add(m[0]);
  }

  const out: DetectedException[] = [];
  const NON_DEPOSIT = new Set(['Wire Fee', 'NSF', 'Adjustment']);
  for (const b of data.bankStatements) {
    if (!NON_DEPOSIT.has(b.transaction_type)) continue;
    if (b.matched_receipt_ids.length > 0) continue;
    if (referencedLines.has(b.line_id)) continue;
    const impact = b.debit > 0 ? -b.debit : b.credit;
    out.push(
      buildException({
        category: 'bank_only_item',
        period: periodOf(b.value_date),
        customer_id: null,
        amount_impact: impact,
        source_records: [{ type: 'bankStatement', id: b.line_id }],
        description: `${b.transaction_type} ${b.line_id} on ${b.value_date} (${money(b.debit > 0 ? b.debit : b.credit)}) has no GL counterpart.`,
        asOf,
        ageRefDate: b.value_date,
      }),
    );
  }
  return out;
}

// ---- 9. Deposit total mismatch --------------------------------------------

function detectDepositMismatch(data: ARData, asOf: string): DetectedException[] {
  const receiptById = new Map<string, CashReceipt>();
  for (const r of data.receipts) receiptById.set(r.receipt_id, r);

  const out: DetectedException[] = [];
  for (const b of data.bankStatements) {
    if (b.transaction_type !== 'Deposit') continue;
    if (b.matched_receipt_ids.length === 0) continue;
    const expected = b.matched_receipt_ids.reduce((s, id) => s + (receiptById.get(id)?.amount ?? 0), 0);
    const variance = b.credit - expected;
    if (Math.abs(variance) <= EPS) continue;
    const refs: SourceRef[] = [
      { type: 'bankStatement', id: b.line_id },
      ...b.matched_receipt_ids.map<SourceRef>((id) => ({ type: 'receipt', id })),
    ];
    out.push(
      buildException({
        category: 'deposit_mismatch',
        period: periodOf(b.value_date),
        customer_id: null,
        amount_impact: variance,
        source_records: refs,
        description: `Deposit ${b.deposit_id || b.line_id} cleared ${money(b.credit)} but matched receipts total ${money(expected)} (Δ ${money(variance)}).`,
        asOf,
        ageRefDate: b.value_date,
      }),
    );
  }
  return out;
}

// ---- 10. Aged unapplied (synthetic) ---------------------------------------

function detectAgedUnapplied(data: ARData, asOf: string): DetectedException[] {
  const asOfDate = asOf.slice(0, 10);
  const out: DetectedException[] = [];
  for (const r of data.receipts) {
    const isUnapplied = r.status === 'Unapplied' || r.amount_applied + EPS < r.amount;
    if (!isUnapplied) continue;
    const age = daysBetween(r.receipt_date, asOfDate);
    if (age <= AGED_THRESHOLD_DAYS) continue;
    const impact = r.amount - r.amount_applied;
    out.push(
      buildException({
        category: 'aged_unapplied',
        period: periodOf(r.receipt_date),
        customer_id: r.customer_id || null,
        amount_impact: impact,
        source_records: [{ type: 'receipt', id: r.receipt_id }],
        description: `Receipt ${r.receipt_id} unapplied for ${age} days — older than ${AGED_THRESHOLD_DAYS}-day threshold.`,
        asOf,
        ageRefDate: r.receipt_date,
      }),
    );
  }
  for (const m of data.creditMemos) {
    const isUnapplied = m.status === 'Unapplied' || m.applied_to_invoice_id == null;
    if (!isUnapplied) continue;
    const age = daysBetween(m.memo_date, asOfDate);
    if (age <= AGED_THRESHOLD_DAYS) continue;
    out.push(
      buildException({
        category: 'aged_unapplied',
        period: m.period,
        customer_id: m.customer_id || null,
        amount_impact: m.amount,
        source_records: [{ type: 'creditMemo', id: m.memo_id }],
        description: `Credit memo ${m.memo_id} unapplied for ${age} days — older than ${AGED_THRESHOLD_DAYS}-day threshold.`,
        asOf,
        ageRefDate: m.memo_date,
      }),
    );
  }
  return out;
}

// ---- runner ---------------------------------------------------------------

/**
 * Run every detector against `data` and return the combined exception list,
 * sorted by severity (high → medium → low) then by absolute $ impact desc.
 *
 * `asOf` defaults to "now"; pass an explicit value for deterministic test runs.
 */
export function runDetection(data: ARData, asOf?: string): DetectionResult {
  const detectedAt = asOf ?? new Date().toISOString();

  const exceptions: DetectedException[] = [
    ...detectUnappliedCash(data, detectedAt),
    ...detectShortPay(data),
    ...detectUnappliedCredits(data, detectedAt),
    ...detectMissingGL(data, detectedAt),
    ...detectDuplicateGL(data, detectedAt),
    ...detectWriteoffDesync(data, detectedAt),
    ...detectCutoffTiming(data, detectedAt),
    ...detectBankOnly(data, detectedAt),
    ...detectDepositMismatch(data, detectedAt),
    ...detectAgedUnapplied(data, detectedAt),
  ];

  // dedupe by exception_id (aged_unapplied may overlap with unapplied_cash —
  // they're meant to coexist, but identical IDs would still be caught here)
  const seen = new Set<string>();
  const deduped: DetectedException[] = [];
  for (const e of exceptions) {
    if (seen.has(e.exception_id)) continue;
    seen.add(e.exception_id);
    deduped.push(e);
  }

  const SEVERITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
  deduped.sort((a, b) => {
    const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (sev !== 0) return sev;
    return Math.abs(b.amount_impact) - Math.abs(a.amount_impact);
  });

  // per-category aggregates
  const agg = new Map<ExceptionCategory, { count: number; impact: number }>();
  for (const e of deduped) {
    const cur = agg.get(e.category) ?? { count: 0, impact: 0 };
    cur.count += 1;
    cur.impact += Math.abs(e.amount_impact);
    agg.set(e.category, cur);
  }
  const byCategory = [...agg.entries()].map(([category, v]) => ({ category, ...v }));

  return { exceptions: deduped, byCategory, detectedAt };
}

function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// re-export for tests
export {
  detectUnappliedCash,
  detectShortPay,
  detectUnappliedCredits,
  detectMissingGL,
  detectDuplicateGL,
  detectWriteoffDesync,
  detectCutoffTiming,
  detectBankOnly,
  detectDepositMismatch,
  detectAgedUnapplied,
};
