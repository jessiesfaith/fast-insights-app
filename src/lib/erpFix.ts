// "Fix in ERP" hints for detected exceptions.
//
// Tells the AR team: what action to take, on which record, and surfaces
// candidate target records (e.g., an unapplied receipt's customer's open
// invoices) so they don't have to leave the dashboard to find them.

import { ARData } from '../types/data';
import { DetectedException } from '../types/exception';
import { computeSubledgerAR } from './recon';
import { fmtMoney, fmtDate } from './format';

export interface ERPFixCandidate {
  type: 'invoice' | 'receipt' | 'creditMemo' | 'glEntry' | 'bankStatement';
  id: string;
  description: string;       // human-readable single-line summary
  amount?: number;
  date?: string;
}

export interface ERPFixHint {
  action: string;            // imperative verb phrase: "Apply receipt", "Post GL entry"
  target: string;            // the primary record acted upon, e.g., "RCP-00109"
  detail: string;            // 1–2 sentence explanation of what to change in the ERP
  candidates: ERPFixCandidate[];
}

const ID_OF = (records: { type: string; id: string }[], type: string): string | undefined =>
  records.find((r) => r.type === type)?.id;

const ALL_OF = (records: { type: string; id: string }[], type: string): string[] =>
  records.filter((r) => r.type === type).map((r) => r.id);

/** Return the customer's open invoices as fix candidates for a given period_end. */
function customerOpenInvoiceCandidates(
  data: ARData,
  customerId: string | null,
  periodEnd: string,
  limit = 8,
): ERPFixCandidate[] {
  if (!customerId) return [];
  const sub = computeSubledgerAR(data, periodEnd);
  return sub.rows
    .filter((r) => r.invoice.customer_id === customerId)
    .sort((a, b) => b.openBalance - a.openBalance)
    .slice(0, limit)
    .map((r) => ({
      type: 'invoice',
      id: r.invoice.invoice_id,
      description: `Open balance ${fmtMoney(r.openBalance)} · due ${fmtDate(r.invoice.due_date)} · status ${r.invoice.status}`,
      amount: r.openBalance,
      date: r.invoice.due_date,
    }));
}

export function fixHintFor(
  exception: DetectedException,
  data: ARData,
  periodEnd: string,
): ERPFixHint {
  const refs = exception.source_records;

  switch (exception.category) {
    case 'unapplied_cash': {
      const receiptId = ID_OF(refs, 'receipt') ?? '?';
      const receipt = data.receipts.find((r) => r.receipt_id === receiptId);
      const cust = exception.customer_id;
      return {
        action: 'Apply receipt to one or more open invoices',
        target: receiptId,
        detail: receipt
          ? `Receipt ${receiptId} for ${fmtMoney(receipt.amount)} from ${cust ?? 'unknown customer'} (${receipt.payment_method}, ref ${receipt.reference || '—'}) is sitting unapplied. In the ERP, apply it against the customer's open invoice(s) below; partial apply is fine. After fixing, re-export and re-upload the CSVs.`
          : `Apply receipt ${receiptId} in the ERP. Re-export CSVs after fixing.`,
        candidates: customerOpenInvoiceCandidates(data, cust, periodEnd),
      };
    }

    case 'aged_unapplied': {
      // could be a receipt or a credit memo
      const receiptId = ID_OF(refs, 'receipt');
      const memoId = ID_OF(refs, 'creditMemo');
      const cust = exception.customer_id;
      if (receiptId) {
        return {
          action: 'Resolve aged unapplied receipt',
          target: receiptId,
          detail: `Receipt ${receiptId} has been unapplied for over 30 days. Apply, refund, or escalate. After fixing in the ERP, re-export and re-upload the CSVs.`,
          candidates: customerOpenInvoiceCandidates(data, cust, periodEnd),
        };
      }
      return {
        action: 'Resolve aged unapplied credit memo',
        target: memoId ?? '?',
        detail: `Credit memo ${memoId ?? '?'} has been unapplied for over 30 days. Apply against an open invoice, refund the customer, or write off. Re-export CSVs after fixing.`,
        candidates: customerOpenInvoiceCandidates(data, cust, periodEnd),
      };
    }

    case 'short_pay': {
      const invoiceId = ID_OF(refs, 'invoice') ?? '?';
      return {
        action: 'Resolve short payment',
        target: invoiceId,
        detail: `Invoice ${invoiceId} was paid less than billed. Investigate the dispute, then either issue a credit memo for the shortfall, write off the variance, or contact the customer for the balance. Re-export CSVs after fixing.`,
        candidates: [],
      };
    }

    case 'unapplied_credit': {
      const memoId = ID_OF(refs, 'creditMemo') ?? '?';
      const memo = data.creditMemos.find((m) => m.memo_id === memoId);
      const cust = exception.customer_id;
      return {
        action: 'Apply credit memo to an open invoice',
        target: memoId,
        detail: memo
          ? `Credit memo ${memoId} (${fmtMoney(memo.amount)} · ${memo.reason}) is unapplied. Apply it to one of the customer's open invoices below, or process a refund. Re-export CSVs after fixing.`
          : `Apply credit memo ${memoId} in the ERP, then re-export CSVs.`,
        candidates: customerOpenInvoiceCandidates(data, cust, periodEnd),
      };
    }

    case 'missing_gl_posting': {
      const invoiceId = ID_OF(refs, 'invoice') ?? '?';
      const invoice = data.invoices.find((i) => i.invoice_id === invoiceId);
      return {
        action: 'Post the missing GL entry',
        target: invoiceId,
        detail: invoice
          ? `Invoice ${invoiceId} (${fmtMoney(invoice.total_amount)}, ${invoice.invoice_date}) exists in the subledger but has no AR debit on GL 1200. Post the journal: Dr 1200 / Cr 4000 (or the appropriate revenue account). Re-export the GL CSV after fixing.`
          : `Post the missing GL entry for ${invoiceId}, then re-export GL CSV.`,
        candidates: [],
      };
    }

    case 'duplicate_gl_posting': {
      const invoiceId = ID_OF(refs, 'invoice') ?? '?';
      const dupGlIds = ALL_OF(refs, 'glEntry');
      return {
        action: 'Reverse duplicate GL posting(s)',
        target: invoiceId,
        detail: `Invoice ${invoiceId} is posted to GL 1200 more than once. Keep the first entry; reverse the others (${dupGlIds.length > 1 ? dupGlIds.slice(1).join(', ') : 'see GL entries below'}). Re-export GL CSV after fixing.`,
        candidates: dupGlIds.map((id) => {
          const e = data.glEntries.find((x) => x.entry_id === id);
          return {
            type: 'glEntry',
            id,
            description: e ? `${e.entry_type} on ${e.entry_date} · Dr ${fmtMoney(e.debit)} / Cr ${fmtMoney(e.credit)}` : id,
            amount: e?.debit ?? 0,
            date: e?.entry_date,
          };
        }),
      };
    }

    case 'writeoff_desync': {
      const invoiceId = ID_OF(refs, 'invoice') ?? '?';
      const invoice = data.invoices.find((i) => i.invoice_id === invoiceId);
      const inSync = invoice?.status === 'Written Off';
      return {
        action: inSync ? 'Auditor review: confirm write-off' : 'Update subledger invoice status',
        target: invoiceId,
        detail: inSync
          ? `${invoiceId} has been written off in GL and the subledger status reflects "Written Off". Auditor review the supporting documentation and tickmark when satisfied.`
          : `${invoiceId} has a Write-Off journal entry in GL but the subledger invoice status is "${invoice?.status}". Update the invoice status to "Written Off" in the ERP, then re-export the invoices CSV.`,
        candidates: [],
      };
    }

    case 'cutoff_timing': {
      const receiptId = ID_OF(refs, 'receipt') ?? '?';
      const lineId = ID_OF(refs, 'bankStatement') ?? '?';
      return {
        action: 'Confirm cut-off treatment',
        target: receiptId,
        detail: `Receipt ${receiptId} is dated in this period but the bank line ${lineId} clears in the next period. Either record an in-transit receivable / cash-in-transit accrual, or accept the timing variance. Make the GL adjustment in the ERP and re-export CSVs.`,
        candidates: [],
      };
    }

    case 'bank_only_item': {
      const lineId = ID_OF(refs, 'bankStatement') ?? '?';
      const line = data.bankStatements.find((b) => b.line_id === lineId);
      return {
        action: 'Post a journal entry for the bank-only item',
        target: lineId,
        detail: line
          ? `Bank line ${lineId} (${line.transaction_type}, ${fmtMoney(line.debit > 0 ? line.debit : line.credit)} on ${line.value_date}) hit the bank but has no GL counterpart. Typical posting: Dr expense (e.g., bank fees) / Cr cash for fees, or Dr AR / Cr cash for NSF reversals. Re-export GL CSV after posting.`
          : `Post a journal for bank line ${lineId}, then re-export GL CSV.`,
        candidates: [],
      };
    }

    case 'deposit_mismatch': {
      const lineId = ID_OF(refs, 'bankStatement') ?? '?';
      const line = data.bankStatements.find((b) => b.line_id === lineId);
      const matchedReceiptIds = ALL_OF(refs, 'receipt');
      const matchedSum = matchedReceiptIds.reduce((s, id) => {
        const r = data.receipts.find((row) => row.receipt_id === id);
        return s + (r?.amount ?? 0);
      }, 0);
      const variance = (line?.credit ?? 0) - matchedSum;
      return {
        action: 'Investigate deposit total mismatch',
        target: lineId,
        detail: `Deposit ${line?.deposit_id || lineId} cleared the bank for ${fmtMoney(line?.credit ?? 0)} but the matched receipts total ${fmtMoney(matchedSum)} (variance ${fmtMoney(variance)}). Verify each receipt's amount and the bank-side capture of the deposit. Re-export CSVs after correction.`,
        candidates: matchedReceiptIds.map((id) => {
          const r = data.receipts.find((row) => row.receipt_id === id);
          return {
            type: 'receipt',
            id,
            description: r ? `${fmtMoney(r.amount)} on ${r.receipt_date} from ${r.customer_id} (${r.payment_method})` : id,
            amount: r?.amount,
            date: r?.receipt_date,
          };
        }),
      };
    }
  }
}
