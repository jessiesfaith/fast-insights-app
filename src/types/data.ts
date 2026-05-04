// Typed shapes for the six AR Tool-Beta CSV inputs.
// Schemas are exact per BUILD.md §4 — column names match CSV headers verbatim.

export type ISODate = string; // YYYY-MM-DD
export type Period = string;  // YYYY-MM

export type InvoiceStatus = 'Open' | 'Paid' | 'Short Pay - Open' | 'Written Off';
export interface Invoice {
  invoice_id: string;
  customer_id: string;
  invoice_date: ISODate;
  due_date: ISODate;
  period: Period;
  product_id: string;
  product_description: string;
  product_category: string;
  quantity: number;
  unit_price: number;
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  gl_entry_id: string | null;
  salesperson: string;
  territory: string;
  po_number: string;
  notes: string;
}

export type ReceiptStatus = 'Applied' | 'Unapplied' | 'Partial';
export type PaymentMethod = 'ACH' | 'Wire' | 'Check' | 'Credit Card';
export interface CashReceipt {
  receipt_id: string;
  customer_id: string;
  receipt_date: ISODate;
  amount: number;
  payment_method: PaymentMethod | string;
  reference: string;
  check_number: string;
  invoice_id_applied: string | null;
  amount_applied: number;
  bank_deposit_id: string;
  status: ReceiptStatus;
  notes: string;
}

export type CreditMemoStatus = 'Applied' | 'Unapplied';
export interface CreditMemo {
  memo_id: string;
  customer_id: string;
  memo_date: ISODate;
  period: Period;
  amount: number;
  reason: string;
  original_invoice_id: string;
  applied_to_invoice_id: string | null;
  gl_entry_id: string | null;
  status: CreditMemoStatus;
  notes: string;
}

export type GLEntryType = 'Invoice' | 'Receipt' | 'Credit Memo' | 'Write-Off' | 'Adjustment' | string;
export interface GLEntry {
  entry_id: string;
  entry_date: ISODate;
  period: Period;
  account_code: string;
  account_name: string;
  entry_type: GLEntryType;
  debit: number;
  credit: number;
  description: string;
  source_doc: string;
  customer_id: string;
  posted_by: string;
  notes: string;
}

export type BankTxnType = 'Deposit' | 'Wire Fee' | 'NSF' | 'Adjustment' | string;
export type ReconciledFlag = 'Yes' | 'No';
export interface BankStatement {
  line_id: string;
  bank_date: ISODate;
  value_date: ISODate;
  description: string;
  debit: number;
  credit: number;
  deposit_id: string;
  transaction_type: BankTxnType;
  matched_receipt_ids: string[]; // pipe-delimited in CSV → array here
  reconciled: ReconciledFlag;
  notes: string;
}

export interface Customer {
  customer_id: string;
  customer_name: string;
  customer_type: string;
  city: string;
  state_country: string;
  payment_terms: string;
  credit_limit: number;
  ap_email: string;
  ap_contact: string;
}

// ---- bundle types ----------------------------------------------------------

export type DatasetKey =
  | 'invoices'
  | 'receipts'
  | 'creditMemos'
  | 'glEntries'
  | 'bankStatements'
  | 'customers';

export interface ARData {
  invoices: Invoice[];
  receipts: CashReceipt[];
  creditMemos: CreditMemo[];
  glEntries: GLEntry[];
  bankStatements: BankStatement[];
  customers: Customer[];
}

export const EMPTY_DATA: ARData = {
  invoices: [],
  receipts: [],
  creditMemos: [],
  glEntries: [],
  bankStatements: [],
  customers: [],
};

// human-readable labels used in the UI for each dataset key
export const DATASET_LABEL: Record<DatasetKey, string> = {
  invoices: 'Invoices',
  receipts: 'Cash Receipts',
  creditMemos: 'Credit Memos',
  glEntries: 'GL Entries',
  bankStatements: 'Bank Statements',
  customers: 'Customers',
};

// Per-dataset import summary surfaced after upload (BUILD.md §4.7).
export interface ImportSummary {
  key: DatasetKey;
  label: string;
  fileName: string;
  rowCount: number;
  totalAmount: number | null;     // null for datasets without a money column (customers)
  periodRange: [string, string] | null;
  warnings: string[];
  errors: string[];
}
