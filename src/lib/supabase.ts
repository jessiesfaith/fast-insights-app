// Supabase client for loading AR data from the cloud.
//
// Fetches all six datasets from the Fast Insights Supabase project and maps them
// to the same ARData shape used by the CSV/JSON ingestion paths. Supports
// additive loading — new rows are merged without creating duplicates.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
import { crossValidate, ID_COL } from './parse';
import type { SampleLoadResult } from './sampleData';

// ---------- client singleton ------------------------------------------------

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error(
        'Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      );
    }
    // Auth options match the Scout Quest preview-login setup: the session is
    // persisted + auto-refreshed by supabase-js, PKCE for email links, and
    // detectSessionInUrl so legacy password-reset links exchange on load.
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }
  return _client;
}

/** Shared client — auth (login/signup/reset) and data loads use one instance. */
export function getSupabaseClient(): SupabaseClient {
  return getClient();
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };

/** Returns true if the env vars are configured. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// ---------- row mappers (Supabase → app types) ------------------------------

function mapInvoice(r: Record<string, unknown>): Invoice {
  return {
    invoice_id: String(r.invoice_id ?? ''),
    customer_id: String(r.customer_id ?? ''),
    invoice_date: String(r.invoice_date ?? ''),
    due_date: String(r.due_date ?? ''),
    period: String(r.period ?? ''),
    product_id: String(r.product_id ?? ''),
    product_description: String(r.product_description ?? ''),
    product_category: String(r.product_category ?? ''),
    quantity: Number(r.quantity ?? 0),
    unit_price: Number(r.unit_price ?? 0),
    gross_amount: Number(r.gross_amount ?? 0),
    discount_amount: Number(r.discount_amount ?? 0),
    net_amount: Number(r.net_amount ?? 0),
    tax_amount: Number(r.tax_amount ?? 0),
    total_amount: Number(r.total_amount ?? 0),
    status: String(r.status ?? 'Open') as Invoice['status'],
    gl_entry_id: r.gl_entry_id ? String(r.gl_entry_id) : null,
    salesperson: String(r.salesperson ?? ''),
    territory: String(r.territory ?? ''),
    po_number: String(r.po_number ?? ''),
    notes: String(r.notes ?? ''),
  };
}

function mapReceipt(r: Record<string, unknown>): CashReceipt {
  return {
    receipt_id: String(r.receipt_id ?? ''),
    customer_id: String(r.customer_id ?? ''),
    receipt_date: String(r.receipt_date ?? ''),
    amount: Number(r.amount ?? 0),
    payment_method: String(r.payment_method ?? ''),
    reference: String(r.reference ?? ''),
    check_number: String(r.check_number ?? ''),
    invoice_id_applied: r.invoice_id_applied ? String(r.invoice_id_applied) : null,
    amount_applied: Number(r.amount_applied ?? 0),
    bank_deposit_id: String(r.bank_deposit_id ?? ''),
    status: (String(r.status ?? 'Unapplied')) as CashReceipt['status'],
    notes: String(r.notes ?? ''),
  };
}

function mapCreditMemo(r: Record<string, unknown>): CreditMemo {
  return {
    memo_id: String(r.memo_id ?? ''),
    customer_id: String(r.customer_id ?? ''),
    memo_date: String(r.memo_date ?? ''),
    period: String(r.period ?? ''),
    amount: Number(r.amount ?? 0),
    reason: String(r.reason ?? ''),
    original_invoice_id: String(r.original_invoice_id ?? ''),
    applied_to_invoice_id: r.applied_to_invoice_id ? String(r.applied_to_invoice_id) : null,
    gl_entry_id: r.gl_entry_id ? String(r.gl_entry_id) : null,
    status: (String(r.status ?? 'Unapplied')) as CreditMemo['status'],
    notes: String(r.notes ?? ''),
  };
}

function mapGLEntry(r: Record<string, unknown>): GLEntry {
  return {
    entry_id: String(r.entry_id ?? ''),
    entry_date: String(r.entry_date ?? ''),
    period: String(r.period ?? ''),
    account_code: String(r.account_code ?? ''),
    account_name: String(r.account_name ?? ''),
    entry_type: String(r.entry_type ?? ''),
    debit: Number(r.debit ?? 0),
    credit: Number(r.credit ?? 0),
    description: String(r.description ?? ''),
    source_doc: String(r.source_doc ?? ''),
    customer_id: String(r.customer_id ?? ''),
    posted_by: String(r.posted_by ?? ''),
    notes: String(r.notes ?? ''),
  };
}

function mapBank(r: Record<string, unknown>): BankStatement {
  // matched_receipt_ids is pipe-delimited text in Supabase → array here
  const raw = String(r.matched_receipt_ids ?? '');
  const matched = raw
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s !== '');
  return {
    line_id: String(r.line_id ?? ''),
    bank_date: String(r.bank_date ?? ''),
    value_date: String(r.value_date ?? ''),
    description: String(r.description ?? ''),
    debit: Number(r.debit ?? 0),
    credit: Number(r.credit ?? 0),
    deposit_id: String(r.deposit_id ?? ''),
    transaction_type: String(r.transaction_type ?? ''),
    matched_receipt_ids: matched,
    reconciled: (String(r.reconciled ?? 'No')) as BankStatement['reconciled'],
    notes: String(r.notes ?? ''),
  };
}

function mapCustomer(r: Record<string, unknown>): Customer {
  return {
    customer_id: String(r.customer_id ?? ''),
    customer_name: String(r.customer_name ?? ''),
    customer_type: String(r.customer_type ?? ''),
    city: String(r.city ?? ''),
    state_country: String(r.state_country ?? ''),
    payment_terms: String(r.payment_terms ?? ''),
    credit_limit: Number(r.credit_limit ?? 0),
    ap_email: String(r.ap_email ?? ''),
    ap_contact: String(r.ap_contact ?? ''),
  };
}

// ---------- fetch helpers ---------------------------------------------------

/**
 * Supabase default limit per request is 1000. We paginate to pull all rows.
 */
async function fetchAll<T>(
  table: string,
  mapper: (r: Record<string, unknown>) => T,
): Promise<T[]> {
  const client = getClient();
  const PAGE_SIZE = 1000;
  const rows: T[] = [];
  let from = 0;
  let done = false;

  while (!done) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);
    if (!data || data.length === 0) {
      done = true;
    } else {
      rows.push(...data.map((r) => mapper(r as Record<string, unknown>)));
      from += PAGE_SIZE;
      if (data.length < PAGE_SIZE) done = true;
    }
  }
  return rows;
}

// ---------- summary builder -------------------------------------------------

// Date column used to derive the period range, per dataset.
const SUMMARY_DATE_COL: Record<DatasetKey, string | null> = {
  invoices: 'invoice_date',
  receipts: 'receipt_date',
  creditMemos: 'memo_date',
  glEntries: 'entry_date',
  bankStatements: 'value_date',
  customers: null,
};

function buildSummary<K extends DatasetKey>(
  key: K,
  rows: ARData[K],
): ImportSummary {
  let totalAmount: number | null = null;
  if (key === 'invoices') {
    totalAmount = (rows as unknown as Invoice[]).reduce((s, r) => s + r.total_amount, 0);
  } else if (key === 'receipts') {
    totalAmount = (rows as unknown as CashReceipt[]).reduce((s, r) => s + r.amount, 0);
  } else if (key === 'creditMemos') {
    totalAmount = (rows as unknown as CreditMemo[]).reduce((s, r) => s + r.amount, 0);
  } else if (key === 'glEntries') {
    totalAmount = (rows as unknown as GLEntry[]).reduce((s, r) => s + r.debit, 0);
  } else if (key === 'bankStatements') {
    totalAmount = (rows as unknown as BankStatement[]).reduce((s, r) => s + r.credit, 0);
  }

  let periodRange: [string, string] | null = null;
  const dc = SUMMARY_DATE_COL[key];
  if (dc) {
    const periods: string[] = [];
    for (const r of rows as unknown as Array<Record<string, string>>) {
      const d = r[dc];
      if (d && /^\d{4}-\d{2}/.test(d)) periods.push(d.slice(0, 7));
    }
    if (periods.length > 0) {
      periods.sort();
      periodRange = [periods[0], periods[periods.length - 1]];
    }
  }

  return {
    key,
    label: DATASET_LABEL[key],
    fileName: `supabase:${key}`,
    rowCount: rows.length,
    totalAmount,
    periodRange,
    warnings: [],
    errors: [],
  };
}

// ---------- deduplication ---------------------------------------------------

/**
 * Merge `incoming` rows into `existing`, keeping only rows whose primary key
 * is not already present. Returns the merged array (existing + truly new rows).
 */
function dedup<T>(existing: T[], incoming: T[], key: DatasetKey): T[] {
  const idField = ID_COL[key] as keyof T;
  const seen = new Set<unknown>(existing.map((r) => r[idField]));
  const newRows = incoming.filter((r) => !seen.has(r[idField]));
  return [...existing, ...newRows];
}

// ---------- public API ------------------------------------------------------

/**
 * Fetch all six datasets from Supabase and return them in the same shape
 * as `loadSampleData()`.
 */
export async function loadFromSupabase(): Promise<SampleLoadResult> {
  const [invoices, receipts, creditMemos, glEntries, bankStatements, customers] =
    await Promise.all([
      fetchAll('invoices', mapInvoice),
      fetchAll('cash_receipts', mapReceipt),
      fetchAll('credit_memos', mapCreditMemo),
      fetchAll('gl_entries', mapGLEntry),
      fetchAll('bank_statements', mapBank),
      fetchAll('customers', mapCustomer),
    ]);

  const data: ARData = { invoices, receipts, creditMemos, glEntries, bankStatements, customers };

  const summaries: ImportSummary[] = [
    buildSummary('invoices', invoices),
    buildSummary('receipts', receipts),
    buildSummary('creditMemos', creditMemos),
    buildSummary('glEntries', glEntries),
    buildSummary('bankStatements', bankStatements),
    buildSummary('customers', customers),
  ];

  return { data, summaries: crossValidate(data, summaries) };
}

/**
 * Merge Supabase data into an existing dataset, skipping rows whose primary
 * key already exists. Returns the merged result.
 */
export async function loadFromSupabaseMerged(existing: ARData): Promise<SampleLoadResult> {
  const cloud = await loadFromSupabase();

  const data: ARData = {
    invoices: dedup(existing.invoices, cloud.data.invoices, 'invoices'),
    receipts: dedup(existing.receipts, cloud.data.receipts, 'receipts'),
    creditMemos: dedup(existing.creditMemos, cloud.data.creditMemos, 'creditMemos'),
    glEntries: dedup(existing.glEntries, cloud.data.glEntries, 'glEntries'),
    bankStatements: dedup(existing.bankStatements, cloud.data.bankStatements, 'bankStatements'),
    customers: dedup(existing.customers, cloud.data.customers, 'customers'),
  };

  const summaries: ImportSummary[] = [
    buildSummary('invoices', data.invoices),
    buildSummary('receipts', data.receipts),
    buildSummary('creditMemos', data.creditMemos),
    buildSummary('glEntries', data.glEntries),
    buildSummary('bankStatements', data.bankStatements),
    buildSummary('customers', data.customers),
  ];

  return { data, summaries: crossValidate(data, summaries) };
}
