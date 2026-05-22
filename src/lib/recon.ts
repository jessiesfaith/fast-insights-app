// Three-way reconciliation + AR Bridge math (BUILD.md §6).
//
// Pure functions: ARData + period → typed result.
// Sign convention for variance walks: amount > 0 means the item makes the
// LEFT-hand balance larger than the RIGHT-hand balance.

import {
  ARData,
  CashReceipt,
  CreditMemo,
  GLEntry,
  Invoice,
  BankStatement,
} from '../types/data';
import {
  ARBridgeResult,
  ReconBalance,
  SourceRef,
  ThreeWayResult,
  VarianceLine,
} from '../types/recon';
import { isOnOrBefore, isWithin, periodBounds, priorPeriod } from './period';

const ACCT_AR = '1200';
// Rounding tolerance — balances within half a cent are treated as equal.
const EPS = 0.005;

// ---------------- balance A — Subledger AR -------------------------------

interface InvoiceOpenBalance {
  invoice: Invoice;
  openBalance: number;
  appliedReceipts: number;
  appliedCredits: number;
}

export function computeSubledgerAR(data: ARData, periodEnd: string): {
  total: number;
  rows: InvoiceOpenBalance[];
} {
  // Pre-index receipts and credit memos by invoice for O(N) summation.
  const receiptsByInvoice = new Map<string, CashReceipt[]>();
  for (const r of data.receipts) {
    if (!r.invoice_id_applied) continue;
    if (!isOnOrBefore(r.receipt_date, periodEnd)) continue;
    const arr = receiptsByInvoice.get(r.invoice_id_applied) ?? [];
    arr.push(r);
    receiptsByInvoice.set(r.invoice_id_applied, arr);
  }

  const memosByInvoice = new Map<string, CreditMemo[]>();
  for (const m of data.creditMemos) {
    if (m.status !== 'Applied' || !m.applied_to_invoice_id) continue;
    if (!isOnOrBefore(m.memo_date, periodEnd)) continue;
    const arr = memosByInvoice.get(m.applied_to_invoice_id) ?? [];
    arr.push(m);
    memosByInvoice.set(m.applied_to_invoice_id, arr);
  }

  const rows: InvoiceOpenBalance[] = [];
  for (const inv of data.invoices) {
    if (inv.status !== 'Open' && inv.status !== 'Short Pay - Open') continue;
    if (!isOnOrBefore(inv.invoice_date, periodEnd)) continue;
    const appliedReceipts = (receiptsByInvoice.get(inv.invoice_id) ?? [])
      .reduce((s, r) => s + r.amount_applied, 0);
    const appliedCredits = (memosByInvoice.get(inv.invoice_id) ?? [])
      .reduce((s, m) => s + m.amount, 0);
    const openBalance = inv.total_amount - appliedReceipts - appliedCredits;
    if (Math.abs(openBalance) < EPS) continue;
    rows.push({ invoice: inv, openBalance, appliedReceipts, appliedCredits });
  }

  const total = rows.reduce((s, r) => s + r.openBalance, 0);
  return { total, rows };
}

// ---------------- balance B — GL 1200 ------------------------------------

export function computeGL1200(data: ARData, periodEnd: string): {
  total: number;
  debits: number;
  credits: number;
  rows: GLEntry[];
} {
  let debits = 0;
  let credits = 0;
  const rows: GLEntry[] = [];
  for (const e of data.glEntries) {
    if (e.account_code !== ACCT_AR) continue;
    if (!isOnOrBefore(e.entry_date, periodEnd)) continue;
    debits += e.debit;
    credits += e.credit;
    rows.push(e);
  }
  return { total: debits - credits, debits, credits, rows };
}

// ---------------- balance C — Bank cleared (period activity) ------------

export function computeBankCleared(
  data: ARData,
  periodStart: string,
  periodEnd: string,
): { total: number; rows: BankStatement[] } {
  const rows: BankStatement[] = [];
  let total = 0;
  for (const b of data.bankStatements) {
    if (b.transaction_type !== 'Deposit') continue;
    if (b.reconciled !== 'Yes') continue;
    if (!isWithin(b.value_date, periodStart, periodEnd)) continue;
    rows.push(b);
    total += b.credit;
  }
  return { total, rows };
}

// ---------------- variance walk: Subledger ↔ GL --------------------------
//
// Reconciling categories per BUILD.md §6.2:
//   • Missing GL postings (+ on subledger side)
//   • Duplicate GL postings (− on subledger side, GL is overstated)
//   • Unapplied cash sitting in 2050 suspense (timing: subledger doesn't see it
//     yet, GL does on cash side but not AR)
//   • Write-off desync (invoice still open in subledger but GL credited 1200)
//
// Sign: positive amount = subledger > GL.

function buildSubledgerVsGL(data: ARData, periodEnd: string): { variance: number; items: VarianceLine[] } {
  const items: VarianceLine[] = [];

  // 1. Missing GL postings — invoice has no AR-debit GL row referencing it
  const arDebitsBySource = new Map<string, GLEntry[]>();
  for (const e of data.glEntries) {
    if (e.account_code !== ACCT_AR || e.debit === 0) continue;
    const arr = arDebitsBySource.get(e.source_doc) ?? [];
    arr.push(e);
    arDebitsBySource.set(e.source_doc, arr);
  }
  let missingTotal = 0;
  const missingRefs: SourceRef[] = [];
  for (const inv of data.invoices) {
    if (!isOnOrBefore(inv.invoice_date, periodEnd)) continue;
    if (inv.status === 'Written Off') continue;
    const matching = arDebitsBySource.get(inv.invoice_id) ?? [];
    if (matching.length === 0) {
      missingTotal += inv.total_amount;
      missingRefs.push({ type: 'invoice', id: inv.invoice_id });
    }
  }
  if (Math.abs(missingTotal) > EPS) {
    items.push({
      id: 'missing-gl-postings',
      label: 'Missing GL postings',
      amount: missingTotal,
      description: 'Invoice exists in subledger; no GL 1200 debit recorded — increases subledger over GL.',
      source_records: missingRefs,
    });
  }

  // 2. Duplicate GL postings — same source_doc with multiple AR debits
  let dupTotal = 0;
  const dupRefs: SourceRef[] = [];
  for (const [sourceDoc, entries] of arDebitsBySource.entries()) {
    if (entries.length <= 1) continue;
    // first entry is the legitimate one; surplus = sum of remaining debits
    const surplus = entries.slice(1).reduce((s, e) => s + e.debit, 0);
    dupTotal += surplus;
    for (const e of entries.slice(1)) dupRefs.push({ type: 'glEntry', id: e.entry_id });
    // also surface the invoice if known
    const inv = data.invoices.find((i) => i.invoice_id === sourceDoc);
    if (inv) dupRefs.push({ type: 'invoice', id: inv.invoice_id });
  }
  if (Math.abs(dupTotal) > EPS) {
    items.push({
      id: 'duplicate-gl-postings',
      label: 'Duplicate GL postings',
      amount: -dupTotal,
      description: 'Same invoice posted twice to GL 1200 — overstates GL relative to subledger.',
      source_records: dupRefs,
    });
  }

  // 3. Unapplied cash sitting in 2050 suspense — receipts not applied yet
  let unappliedTotal = 0;
  const unappliedRefs: SourceRef[] = [];
  for (const r of data.receipts) {
    if (!isOnOrBefore(r.receipt_date, periodEnd)) continue;
    const unapplied = r.amount - r.amount_applied;
    if (r.status === 'Unapplied' || unapplied > EPS) {
      unappliedTotal += Math.max(unapplied, r.status === 'Unapplied' ? r.amount : 0);
      unappliedRefs.push({ type: 'receipt', id: r.receipt_id });
    }
  }
  if (Math.abs(unappliedTotal) > EPS) {
    items.push({
      id: 'unapplied-cash-suspense',
      label: 'Unapplied cash in suspense (2050)',
      amount: 0, // pure timing: doesn't affect 1200 balance directly, surfaced for traceability
      description: `${unappliedRefs.length} receipt${unappliedRefs.length === 1 ? '' : 's'} held in customer-deposit suspense — cash is in GL but not against AR.`,
      source_records: unappliedRefs,
    });
  }

  // 4. Write-off desync — GL has Write-Off credit but invoice.status not Written Off
  let writeoffDesyncTotal = 0;
  const writeoffRefs: SourceRef[] = [];
  for (const e of data.glEntries) {
    if (e.entry_type !== 'Write-Off' || e.account_code !== ACCT_AR) continue;
    if (!isOnOrBefore(e.entry_date, periodEnd)) continue;
    const inv = data.invoices.find((i) => i.invoice_id === e.source_doc);
    if (inv && inv.status !== 'Written Off') {
      writeoffDesyncTotal += e.credit;
      writeoffRefs.push({ type: 'invoice', id: inv.invoice_id });
      writeoffRefs.push({ type: 'glEntry', id: e.entry_id });
    }
  }
  if (Math.abs(writeoffDesyncTotal) > EPS) {
    items.push({
      id: 'writeoff-desync',
      label: 'Write-off desync',
      amount: writeoffDesyncTotal,
      description: 'GL credited 1200 for write-off but the invoice is still Open in subledger — subledger overstated.',
      source_records: writeoffRefs,
    });
  }

  const variance = items.reduce((s, i) => s + i.amount, 0);
  return { variance, items };
}

// ---------------- variance walk: GL ↔ Bank -------------------------------
//
// Reconciling categories §6.2:
//   • In-transit timing — receipt in current period, bank cleared next period
//   • Unapplied cash not yet booked
//   • Bank-only items not yet journaled (wire fees, NSF, adjustments)
//
// Sign: positive amount = GL activity > bank activity for the period.

function buildGLVsBank(data: ARData, periodStart: string, periodEnd: string): {
  variance: number;
  items: VarianceLine[];
} {
  const items: VarianceLine[] = [];

  // 1. In-transit timing — receipts in period whose matched bank line clears later
  let inTransitTotal = 0;
  const inTransitRefs: SourceRef[] = [];
  // index bank lines by deposit_id for matched_receipt_ids lookup
  const bankByDeposit = new Map<string, BankStatement>();
  for (const b of data.bankStatements) bankByDeposit.set(b.deposit_id, b);
  for (const r of data.receipts) {
    if (!isWithin(r.receipt_date, periodStart, periodEnd)) continue;
    const bank = bankByDeposit.get(r.bank_deposit_id);
    if (!bank) continue;
    if (bank.value_date.slice(0, 10) > periodEnd) {
      inTransitTotal += r.amount;
      inTransitRefs.push({ type: 'receipt', id: r.receipt_id });
      inTransitRefs.push({ type: 'bankStatement', id: bank.line_id });
    }
  }
  if (Math.abs(inTransitTotal) > EPS) {
    items.push({
      id: 'in-transit-receipts',
      label: 'In-transit receipts (booked, not yet cleared)',
      amount: inTransitTotal,
      description: 'Receipt dated in this period; bank value-date falls in the next period — GL ahead of bank.',
      source_records: inTransitRefs,
    });
  }

  // 2. Bank-only items: Wire Fee / NSF / Adjustment without a GL counterpart
  let bankOnlyTotal = 0;
  const bankOnlyRefs: SourceRef[] = [];
  const glReferencingLine = new Set<string>();
  for (const e of data.glEntries) {
    // crude match: GL description containing the line_id (sample data uses this)
    const desc = e.description ?? '';
    const m = desc.match(/BNK-\d{5}/);
    if (m) glReferencingLine.add(m[0]);
  }
  for (const b of data.bankStatements) {
    if (b.transaction_type === 'Deposit') continue;
    if (!isWithin(b.value_date, periodStart, periodEnd)) continue;
    if (glReferencingLine.has(b.line_id)) continue;
    const amt = b.debit > 0 ? -b.debit : b.credit;
    bankOnlyTotal += amt;
    bankOnlyRefs.push({ type: 'bankStatement', id: b.line_id });
  }
  if (Math.abs(bankOnlyTotal) > EPS) {
    items.push({
      id: 'bank-only-items',
      label: 'Bank-only items not in GL',
      amount: -bankOnlyTotal,
      description: 'Wire fees, NSF returns, or adjustments hit the bank without a journal entry — bank ahead of GL.',
      source_records: bankOnlyRefs,
    });
  }

  // 3. Unapplied cash from period — receipts collected but receipt not applied
  // Cash hits bank, but it sits in 2050 not 1200 — affects the cash side of GL
  // but not the AR side. Surfaced for traceability with amount = 0 in walk.
  let unappliedTotal = 0;
  const unappliedRefs: SourceRef[] = [];
  for (const r of data.receipts) {
    if (!isWithin(r.receipt_date, periodStart, periodEnd)) continue;
    const unapplied = r.amount - r.amount_applied;
    if (unapplied > EPS || r.status === 'Unapplied') {
      unappliedTotal += unapplied;
      unappliedRefs.push({ type: 'receipt', id: r.receipt_id });
    }
  }
  if (Math.abs(unappliedTotal) > EPS) {
    items.push({
      id: 'unapplied-cash-period',
      label: 'Unapplied cash this period',
      amount: 0,
      description: `${unappliedRefs.length} receipt${unappliedRefs.length === 1 ? '' : 's'} cleared the bank but never landed against an invoice.`,
      source_records: unappliedRefs,
    });
  }

  const variance = items.reduce((s, i) => s + i.amount, 0);
  return { variance, items };
}

// ---------------- top-level three-way recon ------------------------------

export function buildThreeWay(data: ARData, period: string): ThreeWayResult {
  const { start, end } = periodBounds(period);
  const subAR = computeSubledgerAR(data, end);
  const gl = computeGL1200(data, end);
  const bank = computeBankCleared(data, start, end);

  const subledgerAR: ReconBalance = {
    label: 'Subledger AR',
    amount: subAR.total,
    count: subAR.rows.length,
    asOf: end,
    source: subAR.rows.map((r) => ({ type: 'invoice', id: r.invoice.invoice_id })),
  };
  const gl1200: ReconBalance = {
    label: 'GL 1200',
    amount: gl.total,
    count: gl.rows.length,
    asOf: end,
    source: gl.rows.map((r) => ({ type: 'glEntry', id: r.entry_id })),
  };
  const bankCleared: ReconBalance = {
    label: 'Bank cleared (period)',
    amount: bank.total,
    count: bank.rows.length,
    asOf: end,
    source: bank.rows.map((r) => ({ type: 'bankStatement', id: r.line_id })),
  };

  return {
    period: { start, end, key: period },
    subledgerAR,
    gl1200,
    bankCleared,
    subledgerVsGL: buildSubledgerVsGL(data, end),
    glVsBank: buildGLVsBank(data, start, end),
  };
}

// ---------------- AR Bridge / roll-forward (§6.3) -----------------------

export interface ARBridgeLineRefs {
  beginning: SourceRef[];
  billings: SourceRef[];
  cashApplied: SourceRef[];
  creditsApplied: SourceRef[];
  writeOffs: SourceRef[];
  adjustments: SourceRef[];
  ending: SourceRef[];
}

/** Source records that fed each AR Bridge line — used by the dashboard and audit-pack drill-downs. */
export function buildARBridgeRefs(data: ARData, period: string): ARBridgeLineRefs {
  const { start, end } = periodBounds(period);
  const prior = priorPeriod(period);
  const priorEnd = periodBounds(prior).end;

  const beginning: SourceRef[] = computeSubledgerAR(data, priorEnd).rows.map((r) => ({
    type: 'invoice', id: r.invoice.invoice_id,
  }));
  const ending: SourceRef[] = computeSubledgerAR(data, end).rows.map((r) => ({
    type: 'invoice', id: r.invoice.invoice_id,
  }));

  const billings: SourceRef[] = data.invoices
    .filter((i) => i.period === period)
    .map((i) => ({ type: 'invoice', id: i.invoice_id }));

  const cashApplied: SourceRef[] = data.receipts
    .filter((r) => isWithin(r.receipt_date, start, end) && r.amount_applied > 0)
    .map((r) => ({ type: 'receipt', id: r.receipt_id }));

  const creditsApplied: SourceRef[] = data.creditMemos
    .filter((m) => m.status === 'Applied' && isWithin(m.memo_date, start, end))
    .map((m) => ({ type: 'creditMemo', id: m.memo_id }));

  const writeOffs: SourceRef[] = data.glEntries
    .filter((e) => e.entry_type === 'Write-Off' && e.account_code === ACCT_AR && isWithin(e.entry_date, start, end))
    .map((e) => ({ type: 'glEntry', id: e.entry_id }));

  const adjustments: SourceRef[] = data.glEntries
    .filter(
      (e) =>
        e.account_code === ACCT_AR &&
        isWithin(e.entry_date, start, end) &&
        !['Invoice', 'Receipt', 'Credit Memo', 'Write-Off'].includes(e.entry_type),
    )
    .map((e) => ({ type: 'glEntry', id: e.entry_id }));

  return { beginning, billings, cashApplied, creditsApplied, writeOffs, adjustments, ending };
}

export function buildARBridge(data: ARData, period: string): ARBridgeResult {
  const { start, end } = periodBounds(period);
  const prior = priorPeriod(period);
  const priorEnd = periodBounds(prior).end;

  const beginningAR = computeSubledgerAR(data, priorEnd).total;

  let billings = 0;
  for (const inv of data.invoices) {
    if (inv.period === period) billings += inv.total_amount;
  }

  let cashApplied = 0;
  for (const r of data.receipts) {
    if (isWithin(r.receipt_date, start, end)) cashApplied += r.amount_applied;
  }

  let creditsApplied = 0;
  for (const m of data.creditMemos) {
    if (m.status !== 'Applied') continue;
    if (isWithin(m.memo_date, start, end)) creditsApplied += m.amount;
  }

  let writeOffs = 0;
  for (const e of data.glEntries) {
    if (e.entry_type !== 'Write-Off') continue;
    if (e.account_code !== ACCT_AR) continue;
    if (!isWithin(e.entry_date, start, end)) continue;
    writeOffs += e.credit;
  }

  // Adjustments — explicit GL entries to 1200 that aren't Invoice / Receipt /
  // Credit Memo / Write-Off. Net debits − credits.
  let adjustments = 0;
  for (const e of data.glEntries) {
    if (e.account_code !== ACCT_AR) continue;
    if (!isWithin(e.entry_date, start, end)) continue;
    if (['Invoice', 'Receipt', 'Credit Memo', 'Write-Off'].includes(e.entry_type)) continue;
    adjustments += e.debit - e.credit;
  }

  const endingARComputed = beginningAR + billings - cashApplied - creditsApplied - writeOffs + adjustments;
  const endingARSubledger = computeSubledgerAR(data, end).total;
  const variance = endingARComputed - endingARSubledger;

  return {
    period: { start, end, key: period },
    beginningAR,
    billings,
    cashApplied,
    creditsApplied,
    writeOffs,
    adjustments,
    endingARComputed,
    endingARSubledger,
    variance,
    ties: Math.abs(variance) < 0.01,
  };
}

// re-export internals for tests
export { ACCT_AR };
