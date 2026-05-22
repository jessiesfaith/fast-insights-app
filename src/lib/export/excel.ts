// Excel audit-pack workbook (BUILD.md §12).
//
// Twelve sheets covering the dashboard + audit-pack content. Per-exception
// detail is shown expandably on the audit-pack tab itself, so it doesn't
// need its own dedicated sheet here.

// xlsx-js-style is a drop-in replacement for `xlsx` that preserves cell
// styling on write — wrap-text, number formats, fonts. Same API, different
// package. This audit pack relies on number formats ($ with commas; % vs
// decimals) and wrap-text for the CECL memo, so we use the styled fork.
import * as XLSX from 'xlsx-js-style';
import { ARData } from '../../types/data';
import {
  BAD_DEBT_METHOD_LABEL,
  BadDebtReserveEntry,
  CompletenessEvidence,
  TICKMARK_LEGEND,
  TICKMARK_LETTERS,
  ClosedPeriodEntry,
  TickmarkMap,
  SignOffBlockState,
  migrateCECLMemo,
} from '../../types/audit';
import { computeBadDebt } from '../badDebt';
import { ExceptionWorkflow } from '../../types/workflow';
import { buildAging } from '../aging';
import { KPI_FORMULA, buildKPIs } from '../kpis';
import { buildARBridge, buildThreeWay } from '../recon';
import { isWithin, periodBounds } from '../period';
import { buildTickmarkSignoffs } from '../tickmarks';
import { fileTimestamp, fmtPeriod, slugForFileName } from '../format';
import { TOOL_VERSION } from './json';

interface ExportInput {
  data: ARData;
  period: string;
  signOff: SignOffBlockState;
  operator: string | null;
  workflows: Record<string, ExceptionWorkflow>;
  tickmarks: TickmarkMap;
  bridgeEntry?: { amount: number; actor: string; timestamp: string };
  completenessEvidence?: CompletenessEvidence;
  closedPeriod?: ClosedPeriodEntry;
  badDebtReserve?: BadDebtReserveEntry;
}

/**
 * Build the audit-pack workbook. Pure — does not touch the file system.
 * Use `exportAuditPackExcel` for the user-facing download flow.
 */
export function buildAuditPackWorkbook(input: ExportInput, generatedAt: Date = new Date()): XLSX.WorkBook {
  const { data, period, signOff, operator, tickmarks } = input;
  const wb = XLSX.utils.book_new();

  // Per-exception detail is shown expandably on the Audit pack tab; we don't
  // duplicate it in the workbook to keep the auditor's review surface tight.
  XLSX.utils.book_append_sheet(wb, coverSheet(period, signOff, operator, generatedAt), 'Cover');
  XLSX.utils.book_append_sheet(wb, reconSheet(data, period), 'Three-Way Recon');
  XLSX.utils.book_append_sheet(wb, bridgeSheet(data, period, input.bridgeEntry), 'AR Bridge');
  XLSX.utils.book_append_sheet(wb, agingSheet(data, period), 'Aging Detail');
  XLSX.utils.book_append_sheet(wb, kpiSheet(data, period), 'KPIs');
  XLSX.utils.book_append_sheet(wb, glTraceSheet(data, period), 'GL Trace');
  XLSX.utils.book_append_sheet(wb, bankTraceSheet(data, period), 'Bank Trace');
  XLSX.utils.book_append_sheet(wb, tickmarksSheet(tickmarks, data, period, input.bridgeEntry), 'Tickmarks');

  // Cover-pack metadata (audit memo / completeness / period close) lives at the
  // end so a reviewer flipping through tabs hits the data first.
  XLSX.utils.book_append_sheet(wb, auditMemoSheet(period, signOff), 'Audit Memo');
  XLSX.utils.book_append_sheet(wb, completenessSheet(period, signOff, input.completenessEvidence, data), 'Completeness');
  XLSX.utils.book_append_sheet(wb, badDebtReserveSheet(data, period, input.badDebtReserve), 'Bad Debt Reserve');
  XLSX.utils.book_append_sheet(wb, periodCloseSheet(period, input.closedPeriod), 'Period Close');

  return wb;
}

export const AUDIT_PACK_SHEET_NAMES = [
  'Cover',
  'Three-Way Recon',
  'AR Bridge',
  'Aging Detail',
  'KPIs',
  'GL Trace',
  'Bank Trace',
  'Tickmarks',
  'Audit Memo',
  'Completeness',
  'Bad Debt Reserve',
  'Period Close',
] as const;

// ---- cell-format helpers -------------------------------------------------
//
// The audit pack ships with proper Excel number formats so the reviewer
// doesn't have to reformat columns by hand: money cells display with $ +
// commas + cents, percent cells display as percentages instead of decimals,
// and long-text cells (CECL memo, audit memo) word-wrap inside a tall row.

const FMT_MONEY = '"$"#,##0.00;[Red]"-$"#,##0.00';
const FMT_PERCENT = '0.00%';
const FMT_INT_COMMA = '#,##0';

/** Apply a Excel number format to every numeric cell in the given columns. */
function applyColFormats(ws: XLSX.WorkSheet, colIndexes: number[], format: string, startRow = 1) {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = startRow; R <= range.e.r; R++) {
    for (const C of colIndexes) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell && cell.t === 'n') cell.z = format;
    }
  }
}

/** Apply a number format to a single addressed cell (e.g., "B14"). */
function applyCellFormat(ws: XLSX.WorkSheet, addr: string, format: string) {
  const cell = ws[addr];
  if (cell && cell.t === 'n') cell.z = format;
}

/** Wrap-text a cell and set the row height so the wrapped paragraph fits. */
function wrapTextCell(ws: XLSX.WorkSheet, row: number, col: number, rowHeightPt = 120) {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = ws[addr];
  if (cell) {
    cell.s = {
      ...(cell.s ?? {}),
      alignment: { wrapText: true, vertical: 'top', horizontal: 'left' },
    };
  }
  if (!ws['!rows']) ws['!rows'] = [];
  ws['!rows'][row] = { hpt: rowHeightPt };
}

export function exportAuditPackExcel(input: ExportInput): string {
  const generatedAt = new Date();
  const wb = buildAuditPackWorkbook(input, generatedAt);
  const fileName = excelFileName(input.signOff.entityName, input.period, generatedAt.toISOString());
  XLSX.writeFile(wb, fileName);
  return fileName;
}

export function excelFileName(entity: string, period: string, generatedAt: string): string {
  const ts = fileTimestamp(generatedAt);
  return `ar-tool-beta-pack_${slugForFileName(entity || 'entity')}_${slugForFileName(period)}_${ts}.xlsx`;
}

// ---- sheet builders ------------------------------------------------------

function coverSheet(
  period: string,
  signOff: SignOffBlockState,
  operator: string | null,
  generatedAt: Date,
): XLSX.WorkSheet {
  const rows = [
    ['AR Tool-Beta — Reconciliation Pack'],
    [],
    ['Entity', signOff.entityName],
    ['Period', fmtPeriod(period)],
    ['Tool', `AR Tool-Beta v${TOOL_VERSION}`],
    ['Generated', generatedAt.toISOString()],
    ['Generated by', operator ?? '(unspecified)'],
    [],
    ['Preparer', signOff.preparerName],
    ['Preparer date', signOff.preparerDate],
    ['Reviewer', signOff.reviewerName],
    ['Reviewer date', signOff.reviewerDate],
    [],
    ['Comments'],
    [signOff.comments],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 24 }, { wch: 80 }];
  return ws;
}

function reconSheet(data: ARData, period: string): XLSX.WorkSheet {
  const result = buildThreeWay(data, period);
  const rows: (string | number)[][] = [
    ['AR Tool-Beta — Three-way reconciliation'],
    ['Period', fmtPeriod(period), 'As of', result.period.end],
    [],
    ['Side', 'Balance', 'Item count'],
    ['A. Subledger AR', result.subledgerAR.amount, result.subledgerAR.count],
    ['B. GL 1200',      result.gl1200.amount,      result.gl1200.count],
    ['C. Bank cleared', result.bankCleared.amount, result.bankCleared.count],
    [],
    ['Reconciling items — Subledger ↔ GL', '', ''],
    ['Item', 'Description', 'Amount'],
    ...result.subledgerVsGL.items.map((it) => [it.label, it.description, it.amount] as (string | number)[]),
    ['', '', ''],
    ['Subledger ↔ GL variance', '', result.subledgerVsGL.variance],
    [],
    ['Reconciling items — GL ↔ Bank', '', ''],
    ['Item', 'Description', 'Amount'],
    ...result.glVsBank.items.map((it) => [it.label, it.description, it.amount] as (string | number)[]),
    ['', '', ''],
    ['GL ↔ Bank variance', '', result.glVsBank.variance],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 38 }, { wch: 60 }, { wch: 18 }];
  // The same column index carries different meaning on balance rows vs.
  // variance rows, so apply per-row instead of column-wide.
  // Balance rows live at indices 4-6 (header at 3); col 1 is $ balance,
  // col 2 is item count (integer). Variance rows live below the headers
  // at rows 9 and ~16 (depending on how many items each side has) — col 2
  // is a money amount on those rows. The simplest correct approach: apply
  // money to col 2 by default but override balance-row counts to integer.
  applyColFormats(ws, [1, 2], FMT_MONEY);
  for (const balanceRow of [4, 5, 6]) {
    applyCellFormat(ws, XLSX.utils.encode_cell({ r: balanceRow, c: 2 }), FMT_INT_COMMA);
  }
  return ws;
}

function bridgeSheet(
  data: ARData,
  period: string,
  bridgeEntry?: { amount: number; actor: string; timestamp: string },
): XLSX.WorkSheet {
  const r = buildARBridge(data, period);
  const preparerVariance = bridgeEntry ? bridgeEntry.amount - r.endingARSubledger : null;
  const rows: (string | number | boolean | null)[][] = [
    ['AR Bridge — period roll-forward'],
    ['Period', fmtPeriod(period)],
    [],
    ['Sign', 'Line', 'Amount'],
    ['=', 'Beginning AR',          r.beginningAR],
    ['+', 'Billings (new invoices)', r.billings],
    ['−', 'Cash applied',          -r.cashApplied],
    ['−', 'Credit memos applied',  -r.creditsApplied],
    ['−', 'Write-offs',            -r.writeOffs],
    ['±', 'Adjustments',            r.adjustments],
    ['=', 'Ending AR (computed)',   r.endingARComputed],
    [],
    ['',  'Ending AR (subledger recompute)', r.endingARSubledger],
    ['',  'Variance computed vs subledger',  r.variance],
    ['',  'Ties?',                           r.ties],
    [],
    ['Preparer ending balance'],
    ['',  'Amount entered',     bridgeEntry ? bridgeEntry.amount : null],
    ['',  'Variance vs subledger', preparerVariance],
    ['',  'Entered by',         bridgeEntry?.actor ?? ''],
    ['',  'Entered at',         bridgeEntry?.timestamp ?? ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 6 }, { wch: 38 }, { wch: 22 }];
  // Bridge: amount / variance / preparer balance live in column 2.
  applyColFormats(ws, [2], FMT_MONEY);
  return ws;
}

function agingSheet(data: ARData, period: string): XLSX.WorkSheet {
  const aging = buildAging(data, period);
  const buckets = aging.totals.map((t) => t.bucket);
  const bucketLabels = aging.totals.map((t) => (t.bucket === 'Current' ? 'Current' : `${t.bucket} d`));
  const totalCount = aging.totals.reduce((s, t) => s + t.count, 0);
  const totalPct = aging.totalOpenAR > 0 ? 1 : 0;
  const pctRow = aging.totals.map((t) => (aging.totalOpenAR > 0 ? t.amount / aging.totalOpenAR : 0));

  // Standard horizontal aging format — buckets across the top; rows for
  // $ amount, % of total, and invoice count. Customer breakdown follows
  // the same column layout, with a grand-total row at the bottom.
  const rows: (string | number)[][] = [];
  rows.push(['Aging schedule — ' + fmtPeriod(period)]);
  rows.push(['As of', aging.asOf]);
  rows.push([]);
  rows.push(['Bucket totals']);
  rows.push(['', ...bucketLabels, 'Total']);
  const amountRowIdx = rows.length;
  rows.push(['$ amount', ...aging.totals.map((t) => t.amount), aging.totalOpenAR]);
  const pctRowIdx = rows.length;
  rows.push(['% of total', ...pctRow, totalPct]);
  const countRowIdx = rows.length;
  rows.push(['Invoice count', ...aging.totals.map((t) => t.count), totalCount]);
  rows.push([]);
  rows.push(['Customers — sorted by total open AR']);
  rows.push(['Customer (ID)', ...bucketLabels, 'Total', 'Invoice count']);
  const customerStartIdx = rows.length;
  for (const c of aging.byCustomer) {
    rows.push([
      `${c.customer_name} (${c.customer_id})`,
      ...buckets.map((b) => c.totals[b]),
      c.total,
      c.invoiceCount,
    ]);
  }
  const grandTotalIdx = rows.length;
  rows.push([
    'Grand total',
    ...aging.totals.map((t) => t.amount),
    aging.totalOpenAR,
    totalCount,
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 36 },                            // first column (label / customer)
    ...buckets.map(() => ({ wch: 18 })),    // one per bucket
    { wch: 22 },                            // total
    { wch: 14 },                            // invoice count (only customer + grand total rows)
  ];

  // Per-row formatting: header rows skipped; metric rows use $ / % / int;
  // every customer row and the grand total row format buckets + total as
  // money and the trailing invoice count as integer.
  const bucketCols: number[] = [];
  for (let c = 1; c <= buckets.length + 1; c++) bucketCols.push(c); // 1..N+1 covers buckets + Total
  const countCol = buckets.length + 2;

  applyRowFormat(ws, amountRowIdx, bucketCols, FMT_MONEY);
  applyRowFormat(ws, pctRowIdx, bucketCols, FMT_PERCENT);
  applyRowFormat(ws, countRowIdx, bucketCols, FMT_INT_COMMA);
  for (let R = customerStartIdx; R <= grandTotalIdx; R++) {
    applyRowFormat(ws, R, bucketCols, FMT_MONEY);
    const countCell = ws[XLSX.utils.encode_cell({ r: R, c: countCol })];
    if (countCell && countCell.t === 'n') countCell.z = FMT_INT_COMMA;
  }
  return ws;
}

/** Apply a number format to specific columns within a single row. */
function applyRowFormat(ws: XLSX.WorkSheet, row: number, cols: number[], format: string) {
  for (const C of cols) {
    const cell = ws[XLSX.utils.encode_cell({ r: row, c: C })];
    if (cell && cell.t === 'n') cell.z = format;
  }
}

function kpiSheet(data: ARData, period: string): XLSX.WorkSheet {
  const bundle = buildKPIs(data, period);
  const rows = bundle.results.map((k) => ({
    Key: k.key,
    Label: k.label,
    Unit: k.unit,
    Current: k.current,
    Prior: k.prior,
    Delta: k.delta,
    'Δ %': k.deltaPct,
    'Good direction': k.goodDirection,
    Formula: KPI_FORMULA[k.key] ?? '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 22 }, { wch: 28 }, { wch: 8 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 14 },
    { wch: 90 },
  ];

  // Per-row formatting depends on the KPI unit. Money/pct/days each get the
  // right Excel format on the Current/Prior/Delta cells; the Δ % column is
  // always a percentage.
  const range = XLSX.utils.decode_range(ws['!ref']!);
  for (let R = 1; R <= range.e.r; R++) {
    const unit = (ws[XLSX.utils.encode_cell({ r: R, c: 2 })]?.v ?? '') as string;
    const valueFormat =
      unit === 'money' ? FMT_MONEY :
      unit === 'pct'   ? FMT_PERCENT :
      unit === 'days'  ? FMT_INT_COMMA :
                          FMT_INT_COMMA;
    for (const C of [3, 4, 5]) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell && cell.t === 'n') cell.z = valueFormat;
    }
    const deltaPctCell = ws[XLSX.utils.encode_cell({ r: R, c: 6 })];
    if (deltaPctCell && deltaPctCell.t === 'n') deltaPctCell.z = FMT_PERCENT;
    // Wrap the formula column.
    const formulaCell = ws[XLSX.utils.encode_cell({ r: R, c: 8 })];
    if (formulaCell) {
      formulaCell.s = {
        ...(formulaCell.s ?? {}),
        alignment: { wrapText: true, vertical: 'top' },
      };
    }
  }
  return ws;
}

// Per-exception detail lives on the audit-pack tab itself (expandable in
// the UI, prints inline in the PDF) — we no longer ship a dedicated Excel
// sheet for it. The dashboard / KPI / recon / aging / trace sheets are
// sufficient for the Excel pack; reviewers drill into exceptions by tab.

function glTraceSheet(data: ARData, period: string): XLSX.WorkSheet {
  const { start, end } = periodBounds(period);
  const rows = data.glEntries
    .filter((e) => isWithin(e.entry_date, start, end))
    .map((e) => ({
      'Entry ID': e.entry_id,
      Date: e.entry_date,
      Period: e.period,
      'Account code': e.account_code,
      'Account name': e.account_name,
      'Entry type': e.entry_type,
      Debit: e.debit,
      Credit: e.credit,
      Description: e.description,
      'Source doc': e.source_doc,
      Customer: e.customer_id,
      'Posted by': e.posted_by,
    }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 24 },
    { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 50 }, { wch: 14 },
    { wch: 12 }, { wch: 14 },
  ];
  applyColFormats(ws, [6, 7], FMT_MONEY); // Debit / Credit
  return ws;
}

function bankTraceSheet(data: ARData, period: string): XLSX.WorkSheet {
  const { start, end } = periodBounds(period);
  const rows = data.bankStatements
    .filter((b) => isWithin(b.value_date, start, end) || isWithin(b.bank_date, start, end))
    .map((b) => ({
      'Line ID': b.line_id,
      'Bank date': b.bank_date,
      'Value date': b.value_date,
      Description: b.description,
      Type: b.transaction_type,
      Debit: b.debit,
      Credit: b.credit,
      'Deposit ID': b.deposit_id,
      'Matched receipts': b.matched_receipt_ids.join(' | '),
      Reconciled: b.reconciled,
    }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 50 }, { wch: 14 },
    { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 50 }, { wch: 12 },
  ];
  applyColFormats(ws, [5, 6], FMT_MONEY); // Debit / Credit
  return ws;
}

// ---- audit memo sheet (lead-sheet style) --------------------------------

function auditMemoSheet(period: string, signOff: SignOffBlockState): XLSX.WorkSheet {
  const rows: (string | number | null)[][] = [
    ['AR Tool-Beta — Audit Lead Sheet'],
    [],
    ['Header'],
    ['Entity',      signOff.entityName || ''],
    ['Period',      fmtPeriod(period)],
    ['Account',     '1200 — Accounts Receivable'],
    ['Prepared by', signOff.preparerName || ''],
    ['Prepared on', signOff.preparerDate || ''],
    ['Reviewed by', signOff.reviewerName || ''],
    ['Reviewed on', signOff.reviewerDate || ''],
    [],
    ['Purpose'],
    ['Document evidence of the completeness, accuracy, valuation, and proper period attribution of accounts receivable activity for the period stated above.'],
    [],
    ['Scope'],
    ['Subledger AR — open invoices net of receipts and credit memos.'],
    ['General ledger account 1200 — control account activity and ending balance.'],
    ['Bank-cleared deposits — receipts that posted to the bank inside the period.'],
    ['Reconciling items between subledger ↔ GL and GL ↔ bank.'],
    ['Roll-forward of the period: Beginning AR + Billings − Cash − Credits − Write-offs ± Adjustments = Ending AR.'],
    ['Detected exceptions: unapplied cash, short pay, missing / duplicate GL postings, write-off desync, cutoff timing, bank-only items, deposit mismatch, aged unapplied.'],
    [],
    ['Procedures — Preparer'],
    ['1', 'Pull the six standard reports from the source system using the read-only service account; record details on the Completeness sheet.'],
    ['2', 'Drag the six CSVs onto the Import tab. Confirm row counts, period range, and total $ volume on the import-summary card.'],
    ['3', 'Open the Dashboard. Verify the three-way reconciliation either ties or exposes every reconciling item.'],
    ['4', 'Review the AR Bridge. Enter your records\' ending balance in the "Preparer ending balance" field; investigate every variance until it ties to $0.'],
    ['5', 'For each detected exception, drill into the underlying records, correct the root cause in the ERP, re-export the affected CSV, and re-import.'],
    ['6', 'Tickmark each row reviewed using (a) Traced to bank statement, (b) Traced to AR aging / cash / credit card, or (c) Traced to GL.'],
    ['7', 'Update workflow status (Open → In Review → Resolved) and add notes on any exception that won\'t be cleared by source data alone.'],
    ['8', 'Once rollforward variance is $0, the preparer sign-off block unlocks. Sign and date.'],
    ['9', 'Export the JSON snapshot to archive the close.'],
    [],
    ['Procedures — Reviewer'],
    ['1', 'Verify the preparer\'s name, date, and ending-balance entry on the AR Bridge.'],
    ['2', 'Sample 3-5 customers from the aging schedule (drill-down view) and trace open invoices to subledger detail and to the GL.'],
    ['3', 'Independently recompute one balance per category (KPI tile, recon row, bridge line) and apply the (d) Reviewer tickmark.'],
    ['4', 'Read the exception summary; confirm each item is either Resolved with a clear note or Won\'t Fix with an explanation.'],
    ['5', 'Confirm the tickmark sign-off table reflects the population of work performed.'],
    ['6', 'Sign and date the Reviewer block. Export the PDF and Excel pack and attach to the close folder.'],
    [],
    ['Tickmark legend'],
    ...TICKMARK_LETTERS.map((l) => [`(${l})`, TICKMARK_LEGEND[l] ?? '']),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 110 }];
  // Wrap-text every cell in column 1 (the long descriptive text). Row heights
  // grow to fit the wrapped paragraphs.
  if (ws['!ref']) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = 0; R <= range.e.r; R++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: 1 })];
      if (cell && typeof cell.v === 'string' && cell.v.length > 80) {
        cell.s = { ...(cell.s ?? {}), alignment: { wrapText: true, vertical: 'top' } };
        if (!ws['!rows']) ws['!rows'] = [];
        ws['!rows'][R] = { hpt: Math.max(40, Math.ceil(cell.v.length / 110) * 18) };
      }
    }
  }
  return ws;
}

// ---- completeness evidence sheet ----------------------------------------

function completenessSheet(
  period: string,
  signOff: SignOffBlockState,
  ev: CompletenessEvidence | undefined,
  data: ARData,
): XLSX.WorkSheet {
  const safe: CompletenessEvidence = {
    reportName: ev?.reportName ?? 'AR Tool-Beta dashboard',
    reportId: ev?.reportId ?? '',
    sourceSystem: ev?.sourceSystem ?? '',
    extractMethod: ev?.extractMethod ?? 'Direct system / API extract',
    serviceAccount: ev?.serviceAccount ?? '',
    runTimestamp: ev?.runTimestamp ?? '',
    status: ev?.status ?? '',
    notes: ev?.notes ?? '',
    preparerRecordCount: ev?.preparerRecordCount ?? '',
    preparerControlTotal: ev?.preparerControlTotal ?? '',
  };
  const datasets: { label: string; rows: number; total: number | null }[] = [
    { label: 'Invoices',         rows: data.invoices.length,       total: data.invoices.reduce((s, i) => s + i.total_amount, 0) },
    { label: 'Cash receipts',    rows: data.receipts.length,       total: data.receipts.reduce((s, r) => s + r.amount, 0) },
    { label: 'Credit memos',     rows: data.creditMemos.length,    total: data.creditMemos.reduce((s, m) => s + m.amount, 0) },
    { label: 'GL entries',       rows: data.glEntries.length,      total: data.glEntries.reduce((s, g) => s + g.debit, 0) },
    { label: 'Bank statements',  rows: data.bankStatements.length, total: data.bankStatements.reduce((s, b) => s + b.credit, 0) },
    { label: 'Customers',        rows: data.customers.length,      total: null },
  ];
  const importedRecordCount = datasets.reduce((s, d) => s + d.rows, 0);
  const importedControlTotal = data.invoices.reduce((s, i) => s + i.total_amount, 0);
  const preparerCountNum = safe.preparerRecordCount.trim() === ''
    ? null
    : Number(safe.preparerRecordCount.replace(/[,\s]/g, ''));
  const preparerTotalNum = safe.preparerControlTotal.trim() === ''
    ? null
    : Number(safe.preparerControlTotal.replace(/[$,\s]/g, ''));

  const rows: (string | number | null)[][] = [
    ['Completeness evidence'],
    [],
    ['Reference table'],
    ['Type', 'Why it helps'],
    ['Report parameters',           'Shows the correct period / entity / filter was used'],
    ['Report ID / saved-search ID', 'Shows it was the approved standard report'],
    ['Record count',                'Shows the population size captured'],
    ['Control total',               'Shows the financial total from source'],
    ['Export timestamp',            'Shows when the data was pulled'],
    ['Run log',                     'Shows the process actually ran'],
    ['Source-system audit log',     'Shows who/what ran it'],
    ['Hash of the export file',     'Shows the file was not altered after export'],
    ['Read-only service account',   'Reduces manipulation risk'],
    ['Direct system / API extract', 'Stronger than a manually viewed screenshot'],
    [],
    ['For this pack'],
    ['Report',                       safe.reportName],
    ['Period',                       fmtPeriod(period)],
    ['Entity',                       signOff.entityName || ''],
    ['Report / saved-search ID',     safe.reportId],
    ['Source',                       safe.sourceSystem],
    ['Extract method',               safe.extractMethod],
    ['Service account',              safe.serviceAccount],
    ['Run timestamp',                safe.runTimestamp],
    ['Record count (preparer)',      preparerCountNum ?? safe.preparerRecordCount],
    ['Record count (imported)',      importedRecordCount],
    ['Δ vs imported',                preparerCountNum == null ? '' : preparerCountNum - importedRecordCount],
    ['Source report total (preparer)', preparerTotalNum ?? safe.preparerControlTotal],
    ['Source report total (imported invoices)', importedControlTotal],
    ['Δ vs imported',                preparerTotalNum == null ? '' : preparerTotalNum - importedControlTotal],
    ['Status',                       safe.status],
    ['Notes',                        safe.notes],
    [],
    ['Per-dataset rows imported into the pack'],
    ['Dataset', 'Rows', '$ volume'],
    ...datasets.map((d) => [d.label, d.rows, d.total ?? '']),
    ['Total', importedRecordCount, importedControlTotal],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 36 }, { wch: 26 }, { wch: 22 }];

  // Apply the right Excel format per row by inspecting the label. The two
  // "Δ vs imported" rows are differentiated by what came before them: the
  // count-delta follows "Record count (imported)", the dollar-delta follows
  // "Source report total (imported invoices)".
  if (ws['!ref']) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    let lastSection: 'count' | 'money' | null = null;
    for (let R = 1; R <= range.e.r; R++) {
      const labelCell = ws[XLSX.utils.encode_cell({ r: R, c: 0 })];
      const valueCell = ws[XLSX.utils.encode_cell({ r: R, c: 1 })];
      const totalCell = ws[XLSX.utils.encode_cell({ r: R, c: 2 })];
      const label = (labelCell?.v ?? '') as string;
      if (typeof label !== 'string') continue;

      // Track which delta we're inside.
      if (label.startsWith('Record count')) lastSection = 'count';
      else if (label.startsWith('Source report total')) lastSection = 'money';

      if (label.startsWith('Source report total') || label.includes('control total')) {
        if (valueCell && valueCell.t === 'n') valueCell.z = FMT_MONEY;
      } else if (label.startsWith('Record count')) {
        if (valueCell && valueCell.t === 'n') valueCell.z = FMT_INT_COMMA;
      } else if (label === 'Δ vs imported') {
        // Choose format based on which section we're in.
        if (valueCell && valueCell.t === 'n') {
          valueCell.z = lastSection === 'money' ? FMT_MONEY : FMT_INT_COMMA;
        }
      }

      // Per-dataset breakdown rows: col 1 = rows (int), col 2 = $ volume (money).
      if (valueCell && valueCell.t === 'n' && totalCell && totalCell.t === 'n') {
        valueCell.z = FMT_INT_COMMA;
        totalCell.z = FMT_MONEY;
      }
    }
  }
  return ws;
}

// ---- bad debt reserve sheet ---------------------------------------------

function badDebtReserveSheet(
  data: ARData,
  period: string,
  entry: BadDebtReserveEntry | undefined,
): XLSX.WorkSheet {
  const c = computeBadDebt(data, period, entry);
  // Migrate older 4-section CECL objects into the current single-paragraph form.
  const ceclMemo = migrateCECLMemo(entry?.cecl).text;
  const comments = entry?.comments ?? '';
  const rows: (string | number | null)[][] = [
    ['Bad Debt Reserve — ' + fmtPeriod(period)],
    ['Standard', 'ASC 326 (CECL) — Current Expected Credit Loss'],
    [],
    ['Method',     BAD_DEBT_METHOD_LABEL[c.method]],
    ['GL account', c.glAccount],
    [],
  ];
  if (c.method === 'manual') {
    rows.push(['Reserve amount (manual)', c.reserve]);
  } else {
    rows.push(
      [c.baseLabel, c.base],
      ['Reserve %', c.percentage],
      ['= Reserve', c.reserve],
    );
  }
  // Track the row indexes of the long-text cells so we can apply tall row
  // heights to them after the sheet is built.
  let memoRowIdx = -1;
  let commentsRowIdx = -1;
  rows.push(
    [],
    ['CECL memo · ASC 326'],
  );
  memoRowIdx = rows.length;
  rows.push([ceclMemo || '(not entered)']);
  rows.push([], ['Comments']);
  commentsRowIdx = rows.length;
  rows.push([comments || '(none)']);
  rows.push(
    [],
    ['Last updated by', c.enteredBy || ''],
    ['Last updated at', c.enteredAt || ''],
  );

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 28 }, { wch: 110 }];

  // Money + percentage formats on the calculation block. Row indexes are
  // computed by counting the header rows: 0 title, 1 standard, 2 blank,
  // 3 method, 4 GL account, 5 blank, 6 either reserve(manual) or base(pct),
  // (7 reserve % + 8 = reserve) for the percentage methods.
  if (c.method === 'manual') {
    applyCellFormat(ws, 'B7', FMT_MONEY);                     // Reserve amount
  } else {
    applyCellFormat(ws, 'B7', FMT_MONEY);                     // base ($)
    applyCellFormat(ws, 'B8', FMT_PERCENT);                   // Reserve %
    applyCellFormat(ws, 'B9', FMT_MONEY);                     // = Reserve
  }

  // Wrap the long CECL paragraph and the comments cell with tall row heights.
  if (memoRowIdx >= 0) wrapTextCell(ws, memoRowIdx, 0, 240);
  if (commentsRowIdx >= 0) wrapTextCell(ws, commentsRowIdx, 0, 80);

  return ws;
}

// ---- period-close sheet -------------------------------------------------

function periodCloseSheet(period: string, closedEntry: ClosedPeriodEntry | undefined): XLSX.WorkSheet {
  if (!closedEntry) {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Period close — ' + fmtPeriod(period)],
      [],
      ['Status', 'OPEN'],
      ['Note',   'Period has not been closed at the time of export.'],
    ]);
    ws['!cols'] = [{ wch: 22 }, { wch: 60 }];
    return ws;
  }
  const rows: (string | number)[][] = [
    ['Period close — ' + fmtPeriod(period)],
    [],
    ['Status',     'CLOSED'],
    ['Closed by',  closedEntry.closedBy],
    ['Closed at',  closedEntry.closedAt],
    ['Reason',     closedEntry.reason || ''],
  ];
  if (closedEntry.unlockHistory.length > 0) {
    rows.push([], ['Unlock history']);
    rows.push(['Unlocked at', 'Unlocked by', 'Reason']);
    for (const h of closedEntry.unlockHistory) {
      rows.push([h.unlockedAt, h.unlockedBy, h.reason || '']);
    }
  }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 60 }];
  return ws;
}

function tickmarksSheet(
  tickmarks: TickmarkMap,
  data: ARData,
  period: string,
  bridgeEntry?: { amount: number; actor: string; timestamp: string },
): XLSX.WorkSheet {
  const signoffs = buildTickmarkSignoffs(tickmarks, data, period, bridgeEntry);
  const rows = signoffs.map((s) => ({
    Section: s.section,
    'Line item': s.line,
    'Row ID': s.rowId,
    Amount: s.amount ?? '',
    Tickmark: (s.letter as unknown as string) === '*' ? '—' : s.letter.toUpperCase(),
    Meaning: s.meaning,
    'Signed by': s.actor,
    'Signed at': s.timestamp,
  }));
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ['Section', 'Line item', 'Row ID', 'Amount', 'Tickmark', 'Meaning', 'Signed by', 'Signed at'],
  });
  ws['!cols'] = [
    { wch: 22 }, { wch: 50 }, { wch: 18 }, { wch: 18 },
    { wch: 8 }, { wch: 36 }, { wch: 20 }, { wch: 22 },
  ];
  applyColFormats(ws, [3], FMT_MONEY); // Amount
  return ws;
}
