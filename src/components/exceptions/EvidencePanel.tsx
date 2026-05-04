// Reusable Subledger / GL / Bank evidence tabs.
//
// Drives the right-pane drill on:
//   - exception details (ExceptionEvidenceTabs is a thin wrapper)
//   - three-way recon variance lines (dashboard + audit pack)
//   - AR Bridge lines (dashboard + audit pack)
//
// Resolves SourceRef[] back to actual rows in the loaded ARData and renders
// each in a typed table. The "best initial tab" defaults to the dataset
// with the most records so the user usually lands where they want.

import { useMemo, useState } from 'react';
import { Building2, Database, Landmark } from 'lucide-react';
import { ARData } from '../../types/data';
import { SourceRef } from '../../types/recon';
import { fmtDate, fmtMoney } from '../../lib/format';

interface Props {
  sourceRecords: SourceRef[];
  data: ARData;
  /** Optional override; otherwise we pick whichever side has the most records. */
  defaultTab?: TabKey;
  /** Cap the visible scroll area; pass null for no max. */
  maxHeight?: number | null;
}

type TabKey = 'subledger' | 'gl' | 'bank';

export function EvidencePanel({ sourceRecords, data, defaultTab, maxHeight = 380 }: Props) {
  const sub = useMemo(() => {
    const invIds = new Set(sourceRecords.filter((r) => r.type === 'invoice').map((r) => r.id));
    const recIds = new Set(sourceRecords.filter((r) => r.type === 'receipt').map((r) => r.id));
    const cmIds  = new Set(sourceRecords.filter((r) => r.type === 'creditMemo').map((r) => r.id));
    return {
      invoices: data.invoices.filter((i) => invIds.has(i.invoice_id)),
      receipts: data.receipts.filter((r) => recIds.has(r.receipt_id)),
      creditMemos: data.creditMemos.filter((m) => cmIds.has(m.memo_id)),
    };
  }, [sourceRecords, data]);

  const gl = useMemo(() => {
    const explicit = new Set(sourceRecords.filter((r) => r.type === 'glEntry').map((r) => r.id));
    const sourceDocs = new Set(
      sourceRecords
        .filter((r) => r.type === 'invoice' || r.type === 'receipt' || r.type === 'creditMemo')
        .map((r) => r.id),
    );
    return data.glEntries.filter(
      (e) => explicit.has(e.entry_id) || (e.source_doc && sourceDocs.has(e.source_doc)),
    );
  }, [sourceRecords, data]);

  const bank = useMemo(() => {
    const explicit = new Set(sourceRecords.filter((r) => r.type === 'bankStatement').map((r) => r.id));
    const recIds = new Set(sourceRecords.filter((r) => r.type === 'receipt').map((r) => r.id));
    return data.bankStatements.filter(
      (b) => explicit.has(b.line_id) || b.matched_receipt_ids.some((id) => recIds.has(id)),
    );
  }, [sourceRecords, data]);

  const counts = {
    subledger: sub.invoices.length + sub.receipts.length + sub.creditMemos.length,
    gl: gl.length,
    bank: bank.length,
  };
  const initial: TabKey =
    defaultTab ??
    (counts.subledger >= counts.gl && counts.subledger >= counts.bank
      ? 'subledger'
      : counts.gl >= counts.bank
      ? 'gl'
      : 'bank');
  const [tab, setTab] = useState<TabKey>(initial);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="row gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <Tab active={tab === 'subledger'} onClick={() => setTab('subledger')} icon={<Building2 size={14} />} label="Subledger" count={counts.subledger} />
        <Tab active={tab === 'gl'} onClick={() => setTab('gl')} icon={<Database size={14} />} label="GL" count={counts.gl} />
        <Tab active={tab === 'bank'} onClick={() => setTab('bank')} icon={<Landmark size={14} />} label="Bank" count={counts.bank} />
      </div>

      <div style={maxHeight === null ? undefined : { overflow: 'auto', maxHeight }}>
        {tab === 'subledger' && <SubledgerTab sub={sub} />}
        {tab === 'gl' && <GLTab rows={gl} />}
        {tab === 'bank' && <BankTab rows={bank} />}
      </div>
    </div>
  );
}

function Tab({
  active, onClick, icon, label, count,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
        color: active ? 'var(--accent)' : 'var(--text-tertiary)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        marginBottom: -1,
      }}
    >
      {icon}
      {label}
      <span
        className="glass-pill"
        style={{
          padding: '1px 7px',
          fontSize: 10,
          background: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
          color: active ? 'var(--accent)' : 'var(--text-tertiary)',
        }}
      >
        {count}
      </span>
    </button>
  );
}

function SubledgerTab({ sub }: { sub: { invoices: any[]; receipts: any[]; creditMemos: any[] } }) {
  if (sub.invoices.length === 0 && sub.receipts.length === 0 && sub.creditMemos.length === 0) {
    return <Empty />;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {sub.invoices.length > 0 && (
        <Section title="Invoices">
          <table className="fin-table">
            <thead>
              <tr><th>Invoice</th><th>Customer</th><th>Status</th><th>Date</th><th>Due</th><th style={{ textAlign: 'right' }}>Total</th></tr>
            </thead>
            <tbody>
              {sub.invoices.map((i) => (
                <tr key={i.invoice_id}>
                  <td className="mono">{i.invoice_id}</td>
                  <td className="mono">{i.customer_id}</td>
                  <td>{i.status}</td>
                  <td>{fmtDate(i.invoice_date)}</td>
                  <td>{fmtDate(i.due_date)}</td>
                  <td className="num">{fmtMoney(i.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
      {sub.receipts.length > 0 && (
        <Section title="Cash receipts">
          <table className="fin-table">
            <thead>
              <tr><th>Receipt</th><th>Customer</th><th>Method</th><th>Date</th><th>Applied to</th><th>Status</th><th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'right' }}>Applied</th></tr>
            </thead>
            <tbody>
              {sub.receipts.map((r) => (
                <tr key={r.receipt_id}>
                  <td className="mono">{r.receipt_id}</td>
                  <td className="mono">{r.customer_id}</td>
                  <td>{r.payment_method}</td>
                  <td>{fmtDate(r.receipt_date)}</td>
                  <td className="mono">{r.invoice_id_applied ?? '—'}</td>
                  <td>{r.status}</td>
                  <td className="num">{fmtMoney(r.amount)}</td>
                  <td className="num">{fmtMoney(r.amount_applied)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
      {sub.creditMemos.length > 0 && (
        <Section title="Credit memos">
          <table className="fin-table">
            <thead>
              <tr><th>Memo</th><th>Customer</th><th>Reason</th><th>Date</th><th>Applied to</th><th>Status</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
            </thead>
            <tbody>
              {sub.creditMemos.map((m) => (
                <tr key={m.memo_id}>
                  <td className="mono">{m.memo_id}</td>
                  <td className="mono">{m.customer_id}</td>
                  <td>{m.reason}</td>
                  <td>{fmtDate(m.memo_date)}</td>
                  <td className="mono">{m.applied_to_invoice_id ?? '—'}</td>
                  <td>{m.status}</td>
                  <td className="num">{fmtMoney(m.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
    </div>
  );
}

function GLTab({ rows }: { rows: any[] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <table className="fin-table">
      <thead>
        <tr>
          <th>Entry</th>
          <th>Date</th>
          <th>Account</th>
          <th>Type</th>
          <th>Source</th>
          <th style={{ textAlign: 'right' }}>Debit</th>
          <th style={{ textAlign: 'right' }}>Credit</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((e) => (
          <tr key={e.entry_id}>
            <td className="mono">{e.entry_id}</td>
            <td>{fmtDate(e.entry_date)}</td>
            <td className="mono">{e.account_code} · {e.account_name}</td>
            <td>{e.entry_type}</td>
            <td className="mono">{e.source_doc}</td>
            <td className="num">{e.debit > 0 ? fmtMoney(e.debit) : '—'}</td>
            <td className="num">{e.credit > 0 ? fmtMoney(e.credit) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BankTab({ rows }: { rows: any[] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <table className="fin-table">
      <thead>
        <tr>
          <th>Line</th>
          <th>Bank Date</th>
          <th>Value Date</th>
          <th>Type</th>
          <th>Description</th>
          <th>Reconciled</th>
          <th style={{ textAlign: 'right' }}>Debit</th>
          <th style={{ textAlign: 'right' }}>Credit</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((b) => (
          <tr key={b.line_id}>
            <td className="mono">{b.line_id}</td>
            <td>{fmtDate(b.bank_date)}</td>
            <td>{fmtDate(b.value_date)}</td>
            <td>{b.transaction_type}</td>
            <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.description}</td>
            <td>{b.reconciled}</td>
            <td className="num">{b.debit > 0 ? fmtMoney(b.debit) : '—'}</td>
            <td className="num">{b.credit > 0 ? fmtMoney(b.credit) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
      No records on this side.
    </div>
  );
}

export default EvidencePanel;
