// CSV ingestion pipeline.
//
// Responsibilities:
//   - Auto-detect which dataset a CSV belongs to by inspecting headers.
//   - Validate that all required columns are present (errors block ingestion).
//   - Coerce numbers / dates / nullable strings safely.
//   - Walk FK references and surface orphans as warnings (do not block).
//
// Per BUILD.md §4: schemas are exact, empty strings are null, dates are ISO,
// monetary values are numbers, period is YYYY-MM string.

import Papa, { ParseResult } from 'papaparse';
import {
  ARData,
  BankStatement,
  CashReceipt,
  CreditMemo,
  Customer,
  DatasetKey,
  DATASET_LABEL,
  GLEntry,
  ImportSummary,
  Invoice,
} from '../types/data';

// -------- header schemas (exact per §4) --------------------------------------

const SCHEMAS: Record<DatasetKey, string[]> = {
  invoices: [
    'invoice_id', 'customer_id', 'invoice_date', 'due_date', 'period',
    'product_id', 'product_description', 'product_category', 'quantity',
    'unit_price', 'gross_amount', 'discount_amount', 'net_amount',
    'tax_amount', 'total_amount', 'status', 'gl_entry_id', 'salesperson',
    'territory', 'po_number', 'notes',
  ],
  receipts: [
    'receipt_id', 'customer_id', 'receipt_date', 'amount', 'payment_method',
    'reference', 'check_number', 'invoice_id_applied', 'amount_applied',
    'bank_deposit_id', 'status', 'notes',
  ],
  creditMemos: [
    'memo_id', 'customer_id', 'memo_date', 'period', 'amount', 'reason',
    'original_invoice_id', 'applied_to_invoice_id', 'gl_entry_id', 'status',
    'notes',
  ],
  glEntries: [
    'entry_id', 'entry_date', 'period', 'account_code', 'account_name',
    'entry_type', 'debit', 'credit', 'description', 'source_doc',
    'customer_id', 'posted_by', 'notes',
  ],
  bankStatements: [
    'line_id', 'bank_date', 'value_date', 'description', 'debit', 'credit',
    'deposit_id', 'transaction_type', 'matched_receipt_ids', 'reconciled',
    'notes',
  ],
  customers: [
    'customer_id', 'customer_name', 'customer_type', 'city', 'state_country',
    'payment_terms', 'credit_limit', 'ap_email', 'ap_contact',
  ],
};

// id-column for each dataset — used for orphan/duplicate detection
const ID_COL: Record<DatasetKey, string> = {
  invoices: 'invoice_id',
  receipts: 'receipt_id',
  creditMemos: 'memo_id',
  glEntries: 'entry_id',
  bankStatements: 'line_id',
  customers: 'customer_id',
};

// -------- detection ---------------------------------------------------------

export function detectDatasetKey(headers: string[]): DatasetKey | null {
  const set = new Set(headers.map((h) => h.trim()));
  // pick the schema whose required columns are entirely present
  let bestKey: DatasetKey | null = null;
  let bestScore = 0;
  (Object.keys(SCHEMAS) as DatasetKey[]).forEach((key) => {
    const required = SCHEMAS[key];
    const present = required.filter((c) => set.has(c)).length;
    // a dataset matches only if EVERY required column is present
    if (present === required.length && present > bestScore) {
      bestKey = key;
      bestScore = present;
    }
  });
  return bestKey;
}

// -------- coercion helpers --------------------------------------------------

function toNum(raw: unknown): number {
  if (raw == null) return 0;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  const s = String(raw).trim();
  if (s === '') return 0;
  // strip commas and surrounding parens (parens = negative for finance)
  const neg = s.startsWith('(') && s.endsWith(')');
  const cleaned = s.replace(/[,$\s]/g, '').replace(/^\((.*)\)$/, '$1');
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return 0;
  return neg ? -n : n;
}

function toStr(raw: unknown): string {
  if (raw == null) return '';
  return String(raw).trim();
}

function toNullStr(raw: unknown): string | null {
  const s = toStr(raw);
  return s === '' ? null : s;
}

function toISODate(raw: unknown): string {
  const s = toStr(raw);
  if (s === '') return '';
  // accept YYYY-MM-DD, M/D/YYYY, MM/DD/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, m, d, y] = slash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // fallback to Date parser
  const ts = Date.parse(s);
  if (!Number.isNaN(ts)) {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  return s; // give up gracefully — validation will flag if this matters
}

function toPeriod(raw: unknown, fallbackDate?: string): string {
  const s = toStr(raw);
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  // sometimes period is YYYY-MM-DD; trim
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(0, 7);
  if (fallbackDate && /^\d{4}-\d{2}-\d{2}$/.test(fallbackDate)) return fallbackDate.slice(0, 7);
  return s;
}

function toPipeArr(raw: unknown): string[] {
  const s = toStr(raw);
  if (s === '') return [];
  return s
    .split('|')
    .map((p) => p.trim())
    .filter((p) => p !== '');
}

// -------- per-row mappers ---------------------------------------------------

function mapInvoice(r: Record<string, unknown>): Invoice {
  return {
    invoice_id: toStr(r.invoice_id),
    customer_id: toStr(r.customer_id),
    invoice_date: toISODate(r.invoice_date),
    due_date: toISODate(r.due_date),
    period: toPeriod(r.period, toISODate(r.invoice_date)),
    product_id: toStr(r.product_id),
    product_description: toStr(r.product_description),
    product_category: toStr(r.product_category),
    quantity: toNum(r.quantity),
    unit_price: toNum(r.unit_price),
    gross_amount: toNum(r.gross_amount),
    discount_amount: toNum(r.discount_amount),
    net_amount: toNum(r.net_amount),
    tax_amount: toNum(r.tax_amount),
    total_amount: toNum(r.total_amount),
    status: toStr(r.status) as Invoice['status'],
    gl_entry_id: toNullStr(r.gl_entry_id),
    salesperson: toStr(r.salesperson),
    territory: toStr(r.territory),
    po_number: toStr(r.po_number),
    notes: toStr(r.notes),
  };
}

function mapReceipt(r: Record<string, unknown>): CashReceipt {
  return {
    receipt_id: toStr(r.receipt_id),
    customer_id: toStr(r.customer_id),
    receipt_date: toISODate(r.receipt_date),
    amount: toNum(r.amount),
    payment_method: toStr(r.payment_method),
    reference: toStr(r.reference),
    check_number: toStr(r.check_number),
    invoice_id_applied: toNullStr(r.invoice_id_applied),
    amount_applied: toNum(r.amount_applied),
    bank_deposit_id: toStr(r.bank_deposit_id),
    status: (toStr(r.status) || 'Unapplied') as CashReceipt['status'],
    notes: toStr(r.notes),
  };
}

function mapCreditMemo(r: Record<string, unknown>): CreditMemo {
  return {
    memo_id: toStr(r.memo_id),
    customer_id: toStr(r.customer_id),
    memo_date: toISODate(r.memo_date),
    period: toPeriod(r.period, toISODate(r.memo_date)),
    amount: toNum(r.amount),
    reason: toStr(r.reason),
    original_invoice_id: toStr(r.original_invoice_id),
    applied_to_invoice_id: toNullStr(r.applied_to_invoice_id),
    gl_entry_id: toNullStr(r.gl_entry_id),
    status: (toStr(r.status) || 'Unapplied') as CreditMemo['status'],
    notes: toStr(r.notes),
  };
}

function mapGLEntry(r: Record<string, unknown>): GLEntry {
  return {
    entry_id: toStr(r.entry_id),
    entry_date: toISODate(r.entry_date),
    period: toPeriod(r.period, toISODate(r.entry_date)),
    account_code: toStr(r.account_code),
    account_name: toStr(r.account_name),
    entry_type: toStr(r.entry_type),
    debit: toNum(r.debit),
    credit: toNum(r.credit),
    description: toStr(r.description),
    source_doc: toStr(r.source_doc),
    customer_id: toStr(r.customer_id),
    posted_by: toStr(r.posted_by),
    notes: toStr(r.notes),
  };
}

function mapBank(r: Record<string, unknown>): BankStatement {
  return {
    line_id: toStr(r.line_id),
    bank_date: toISODate(r.bank_date),
    value_date: toISODate(r.value_date),
    description: toStr(r.description),
    debit: toNum(r.debit),
    credit: toNum(r.credit),
    deposit_id: toStr(r.deposit_id),
    transaction_type: toStr(r.transaction_type),
    matched_receipt_ids: toPipeArr(r.matched_receipt_ids),
    reconciled: (toStr(r.reconciled) || 'No') as BankStatement['reconciled'],
    notes: toStr(r.notes),
  };
}

function mapCustomer(r: Record<string, unknown>): Customer {
  return {
    customer_id: toStr(r.customer_id),
    customer_name: toStr(r.customer_name),
    customer_type: toStr(r.customer_type),
    city: toStr(r.city),
    state_country: toStr(r.state_country),
    payment_terms: toStr(r.payment_terms),
    credit_limit: toNum(r.credit_limit),
    ap_email: toStr(r.ap_email),
    ap_contact: toStr(r.ap_contact),
  };
}

const MAPPERS: Record<DatasetKey, (r: Record<string, unknown>) => unknown> = {
  invoices: mapInvoice,
  receipts: mapReceipt,
  creditMemos: mapCreditMemo,
  glEntries: mapGLEntry,
  bankStatements: mapBank,
  customers: mapCustomer,
};

// the column to total when summarizing $ volume (null = no single monetary column;
// summary code handles glEntries / bankStatements with custom logic)
const VOLUME_COL: Record<DatasetKey, string | null> = {
  invoices: 'total_amount',
  receipts: 'amount',
  creditMemos: 'amount',
  glEntries: null,
  bankStatements: null,
  customers: null,
};

// -------- core parser -------------------------------------------------------

export interface ParsedDataset {
  key: DatasetKey;
  rows: unknown[];
  summary: ImportSummary;
}

export async function parseCSVText(
  text: string,
  fileName: string,
  forcedKey?: DatasetKey,
): Promise<ParsedDataset> {
  const result: ParseResult<Record<string, unknown>> = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
    dynamicTyping: false, // we coerce explicitly
  });

  const headers = result.meta.fields ?? [];
  const key = forcedKey ?? detectDatasetKey(headers);
  if (!key) {
    throw new Error(
      `Could not identify CSV "${fileName}" — header set does not match any known schema.`,
    );
  }

  const required = SCHEMAS[key];
  const present = new Set(headers);
  const missing = required.filter((c) => !present.has(c));
  if (missing.length > 0) {
    throw new Error(
      `"${fileName}" is missing required columns for ${DATASET_LABEL[key]}: ${missing.join(', ')}`,
    );
  }

  const mapper = MAPPERS[key];
  const rows = result.data
    .filter((r) => r && Object.values(r).some((v) => toStr(v) !== ''))
    .map(mapper);

  const warnings: string[] = result.errors
    .filter((e) => e.type !== 'FieldMismatch') // common with trailing blank cells
    .map((e) => `Row ${e.row ?? '?'}: ${e.message}`);

  const summary = buildSingleSummary(key, fileName, rows as unknown as ARData[DatasetKey], warnings);

  return { key, rows, summary };
}

export async function parseCSVFile(file: File): Promise<ParsedDataset> {
  const text = await file.text();
  return parseCSVText(text, file.name);
}

// -------- summary + cross-file FK validation --------------------------------

function buildSingleSummary<K extends DatasetKey>(
  key: K,
  fileName: string,
  rows: ARData[K],
  baseWarnings: string[],
): ImportSummary {
  let totalAmount: number | null = null;
  const volCol = VOLUME_COL[key];
  if (volCol) {
    totalAmount = (rows as unknown as Array<Record<string, number>>).reduce(
      (acc, r) => acc + (r[volCol] ?? 0),
      0,
    );
  } else if (key === 'glEntries') {
    totalAmount = (rows as unknown as GLEntry[]).reduce((acc, r) => acc + r.debit, 0);
  } else if (key === 'bankStatements') {
    totalAmount = (rows as unknown as BankStatement[]).reduce((acc, r) => acc + r.credit, 0);
  }

  let periodRange: [string, string] | null = null;
  const periods: string[] = [];
  const dateCol = (
    key === 'invoices'      ? 'invoice_date'
    : key === 'receipts'    ? 'receipt_date'
    : key === 'creditMemos' ? 'memo_date'
    : key === 'glEntries'   ? 'entry_date'
    : key === 'bankStatements' ? 'value_date'
    : null
  );
  if (dateCol) {
    for (const r of rows as unknown as Array<Record<string, string>>) {
      const d = r[dateCol];
      if (d && /^\d{4}-\d{2}/.test(d)) periods.push(d.slice(0, 7));
    }
    if (periods.length > 0) {
      periods.sort();
      periodRange = [periods[0], periods[periods.length - 1]];
    }
  }

  // duplicate id detection
  const idCol = ID_COL[key];
  const ids = (rows as unknown as Array<Record<string, string>>).map((r) => r[idCol]).filter(Boolean);
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  const warnings = [...baseWarnings];
  if (dupes.size > 0) {
    warnings.push(
      `${dupes.size} duplicate ${idCol} value${dupes.size === 1 ? '' : 's'} (e.g. ${[...dupes].slice(0, 3).join(', ')})`,
    );
  }

  return {
    key,
    label: DATASET_LABEL[key],
    fileName,
    rowCount: ids.length,
    totalAmount,
    periodRange,
    warnings,
    errors: [],
  };
}

/**
 * Once *all* datasets are loaded, walk the FK graph and append warnings for
 * orphan references. Doesn't block — surfaces what auditors and AR teams
 * will want to know about up front.
 */
export function crossValidate(data: ARData, summaries: ImportSummary[]): ImportSummary[] {
  const customerIds = new Set(data.customers.map((c) => c.customer_id));
  const invoiceIds = new Set(data.invoices.map((i) => i.invoice_id));
  const glIds = new Set(data.glEntries.map((g) => g.entry_id));
  const receiptIds = new Set(data.receipts.map((r) => r.receipt_id));

  const updates = new Map<string, string[]>();
  const push = (key: DatasetKey, msg: string) => {
    const cur = updates.get(key) ?? [];
    cur.push(msg);
    updates.set(key, cur);
  };

  // invoice → customer
  if (data.customers.length > 0) {
    let orphan = 0;
    for (const inv of data.invoices) if (!customerIds.has(inv.customer_id)) orphan++;
    if (orphan > 0) push('invoices', `${orphan} invoice(s) reference unknown customer_id`);
  }
  // invoice → gl_entry (when present)
  if (data.glEntries.length > 0) {
    let orphan = 0;
    for (const inv of data.invoices) {
      if (inv.gl_entry_id && !glIds.has(inv.gl_entry_id)) orphan++;
    }
    if (orphan > 0) push('invoices', `${orphan} invoice(s) reference unknown gl_entry_id`);
  }

  // receipt → invoice (when applied) and → customer
  if (data.invoices.length > 0) {
    let orphan = 0;
    for (const rcp of data.receipts) {
      if (rcp.invoice_id_applied && !invoiceIds.has(rcp.invoice_id_applied)) orphan++;
    }
    if (orphan > 0) push('receipts', `${orphan} receipt(s) applied to unknown invoice_id`);
  }
  if (data.customers.length > 0) {
    let orphan = 0;
    for (const rcp of data.receipts) if (!customerIds.has(rcp.customer_id)) orphan++;
    if (orphan > 0) push('receipts', `${orphan} receipt(s) reference unknown customer_id`);
  }

  // credit memo → invoice
  if (data.invoices.length > 0) {
    let orphan = 0;
    for (const cm of data.creditMemos) {
      if (cm.applied_to_invoice_id && !invoiceIds.has(cm.applied_to_invoice_id)) orphan++;
    }
    if (orphan > 0) push('creditMemos', `${orphan} credit memo(s) applied to unknown invoice_id`);
  }

  // bank.matched_receipt_ids → receipt
  if (data.receipts.length > 0) {
    let orphan = 0;
    for (const b of data.bankStatements) {
      for (const id of b.matched_receipt_ids) {
        if (!receiptIds.has(id)) orphan++;
      }
    }
    if (orphan > 0) push('bankStatements', `${orphan} bank match(es) reference unknown receipt_id`);
  }

  return summaries.map((s) => {
    const extra = updates.get(s.key);
    return extra ? { ...s, warnings: [...s.warnings, ...extra] } : s;
  });
}

// re-export useful constants
export { SCHEMAS, ID_COL };
