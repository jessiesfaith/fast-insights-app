// Inlined sample CSVs — bundled into the single-file build via Vite ?raw imports.
// Lets users click "Load sample data" without locating files on disk.

import bankStatementsCsv from '../sample-data/bank_statements.csv?raw';
import cashReceiptsCsv from '../sample-data/cash_receipts.csv?raw';
import creditMemosCsv from '../sample-data/credit_memos.csv?raw';
import customersCsv from '../sample-data/customers.csv?raw';
import glEntriesCsv from '../sample-data/gl_entries.csv?raw';
import invoicesCsv from '../sample-data/invoices.csv?raw';

import { parseCSVText, crossValidate } from './parse';
import { ARData, EMPTY_DATA, ImportSummary } from '../types/data';

interface SampleFile {
  fileName: string;
  text: string;
}

const SAMPLES: SampleFile[] = [
  { fileName: 'invoices.csv',        text: invoicesCsv },
  { fileName: 'cash_receipts.csv',   text: cashReceiptsCsv },
  { fileName: 'credit_memos.csv',    text: creditMemosCsv },
  { fileName: 'gl_entries.csv',      text: glEntriesCsv },
  { fileName: 'bank_statements.csv', text: bankStatementsCsv },
  { fileName: 'customers.csv',       text: customersCsv },
];

export interface SampleLoadResult {
  data: ARData;
  summaries: ImportSummary[];
}

export async function loadSampleData(): Promise<SampleLoadResult> {
  const data: ARData = { ...EMPTY_DATA, invoices: [], receipts: [], creditMemos: [], glEntries: [], bankStatements: [], customers: [] };
  const summaries: ImportSummary[] = [];

  for (const f of SAMPLES) {
    const parsed = await parseCSVText(f.text, f.fileName);
    // narrow assignment per dataset key
    (data as unknown as Record<string, unknown[]>)[parsed.key] = parsed.rows;
    summaries.push(parsed.summary);
  }

  return { data, summaries: crossValidate(data, summaries) };
}
