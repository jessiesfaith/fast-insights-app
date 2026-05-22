// Per-customer drill-down (BUILD.md §11) — the auditor sample-trace surface.
// Header card, AR trend, open invoices with aging, recent receipts, credit
// memos, and any open exceptions for this customer.

import { useMemo } from 'react';
import { ArrowLeft, Building2, CreditCard, ListChecks, Receipt, TrendingDown, TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ARData } from '../../types/data';
import { isResolved } from '../../types/workflow';
import {
  CustomerOpenInvoice,
  buildARTrend,
  buildCustomerCredits,
  buildCustomerOpenInvoices,
  buildCustomerReceipts,
  buildCustomerSummary,
} from '../../lib/customer';
import { runDetection } from '../../lib/detect';
import { useDataStore } from '../../lib/dataStore';
import { fmtDate, fmtMoney, fmtPct, fmtPeriod } from '../../lib/format';
import GlassCard from '../ui/GlassCard';
import { CategoryBadge, SeverityBadge } from '../exceptions/ExceptionBadge';

interface Props {
  customerId: string;
  period: string;
  data: ARData;
  onBack: () => void;
  onSelectException?: (exceptionId: string) => void;
}

const BUCKET_COLOR: Record<string, string> = {
  Current: 'var(--severity-resolved)',
  '1-30':  'var(--severity-low)',
  '31-60': 'var(--accent)',
  '61-90': 'var(--severity-medium)',
  '90+':   'var(--severity-high)',
};

export function CustomerDrillDown({ customerId, period, data, onBack, onSelectException }: Props) {
  const { workflows } = useDataStore();
  const summary = useMemo(() => buildCustomerSummary(customerId, data, period), [customerId, data, period]);
  const trend = useMemo(() => buildARTrend(customerId, data, period, 5), [customerId, data, period]);
  const openInvoices = useMemo(() => buildCustomerOpenInvoices(customerId, data, period), [customerId, data, period]);
  const receipts = useMemo(() => buildCustomerReceipts(customerId, data, period), [customerId, data, period]);
  const credits = useMemo(() => buildCustomerCredits(customerId, data, period), [customerId, data, period]);
  const detection = useMemo(() => runDetection(data), [data]);
  const customerExceptions = detection.exceptions.filter((e) => e.customer_id === customerId);
  const openCustomerExceptions = customerExceptions.filter((e) => !isResolved(workflows[e.exception_id]?.status ?? 'Open'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Header summary={summary} period={period} onBack={onBack} openExceptionCount={openCustomerExceptions.length} />

      <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <ARTrendCard trend={trend} />
        <AgingMixCard summary={summary} />
      </section>

      {customerExceptions.length > 0 && (
        <ExceptionsCard
          exceptions={customerExceptions}
          openCount={openCustomerExceptions.length}
          onSelect={onSelectException}
        />
      )}

      <OpenInvoicesCard rows={openInvoices} />

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ReceiptsCard rows={receipts} />
        <CreditsCard rows={credits} />
      </section>
    </div>
  );
}

// ---- Header ---------------------------------------------------------------

function Header({
  summary,
  period,
  onBack,
  openExceptionCount,
}: {
  summary: ReturnType<typeof buildCustomerSummary>;
  period: string;
  onBack: () => void;
  openExceptionCount: number;
}) {
  const c = summary.customer;
  return (
    <GlassCard variant="strong" style={{ padding: 24 }}>
      <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 12 }}>
        <button
          type="button"
          onClick={onBack}
          className="row gap-1"
          style={{
            alignItems: 'center',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 10px',
            color: 'var(--text-tertiary)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <span className="label">Customer drill-down</span>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>· as of {fmtDate(summary.asOf)} ({fmtPeriod(period)})</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 26, lineHeight: 1.2 }}>
            {c?.customer_name ?? summary.customer_id}
          </h1>
          <div className="row gap-3" style={{ marginTop: 6, fontSize: 12, color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
            <span className="mono">{summary.customer_id}</span>
            {c?.customer_type && <span>· {c.customer_type}</span>}
            {c?.city && <span>· {c.city}{c.state_country ? `, ${c.state_country}` : ''}</span>}
            {c?.payment_terms && <span>· {c.payment_terms}</span>}
            {c?.credit_limit != null && <span>· limit <span className="num">{fmtMoney(c.credit_limit, 0)}</span></span>}
            {c?.ap_contact && <span>· {c.ap_contact}{c.ap_email ? ` (${c.ap_email})` : ''}</span>}
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
          }}
        >
          <Stat label="Open AR" value={fmtMoney(summary.openAR, 0)} accent />
          <Stat label="% of total AR" value={fmtPct(summary.concentrationPct, 1)} />
          <Stat label="Open invoices" value={String(summary.openInvoiceCount)} />
          <Stat
            label="Open exceptions"
            value={String(openExceptionCount)}
            severity={openExceptionCount > 0}
          />
          <Stat
            label="Days since last pay"
            value={summary.daysSinceLastPayment != null ? `${summary.daysSinceLastPayment}d` : '—'}
          />
          <Stat label="Oldest open invoice" value={`${summary.oldestOpenInvoiceDays}d`} />
        </div>
      </div>
    </GlassCard>
  );
}

function Stat({ label, value, accent, severity }: { label: string; value: string; accent?: boolean; severity?: boolean }) {
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '8px 12px',
      }}
    >
      <div className="label">{label}</div>
      <div
        className="num"
        style={{
          fontSize: 16,
          fontWeight: 700,
          marginTop: 2,
          color: accent ? 'var(--accent-hover)' : severity ? 'var(--severity-high)' : 'var(--text-primary)',
          textAlign: 'left',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ---- AR trend chart -------------------------------------------------------

function ARTrendCard({ trend }: { trend: { period: string; openAR: number }[] }) {
  const first = trend[0]?.openAR ?? 0;
  const last = trend[trend.length - 1]?.openAR ?? 0;
  const delta = last - first;
  const direction = Math.abs(delta) < 0.005 ? 'flat' : delta > 0 ? 'up' : 'down';
  const accent = direction === 'flat' ? 'var(--text-tertiary)' : direction === 'up' ? 'var(--neg)' : 'var(--pos)';
  const accentResolved = resolveCSSVar('var(--accent)');

  return (
    <GlassCard>
      <header className="between" style={{ marginBottom: 12 }}>
        <div>
          <div className="label">AR balance trend</div>
          <h3 style={{ marginTop: 4 }}>Last 6 months</h3>
        </div>
        <div className="row gap-1" style={{ alignItems: 'center', color: accent, fontSize: 12, fontWeight: 600 }}>
          {direction === 'up' && <TrendingUp size={14} />}
          {direction === 'down' && <TrendingDown size={14} />}
          <span className="num">{fmtMoney(delta, 0)}</span>
          <span style={{ color: 'var(--text-tertiary)' }}>over window</span>
        </div>
      </header>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
              tickFormatter={(v) => fmtMoney(Number(v), 0)}
              width={80}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-elevated-2)',
                border: '1px solid var(--border-strong)',
                borderRadius: 10,
                color: 'var(--text-primary)',
              }}
              formatter={(v: number) => fmtMoney(v, 0)}
            />
            <Line
              type="monotone"
              dataKey="openAR"
              stroke={accentResolved}
              strokeWidth={2}
              dot={{ r: 3, fill: accentResolved }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

function AgingMixCard({ summary }: { summary: ReturnType<typeof buildCustomerSummary> }) {
  const buckets = (Object.keys(summary.agingByBucket) as Array<keyof typeof summary.agingByBucket>);
  const total = summary.openAR;
  return (
    <GlassCard>
      <header style={{ marginBottom: 8 }}>
        <div className="label">Aging mix</div>
        <h3 style={{ marginTop: 4 }}>{fmtMoney(total, 0)} open</h3>
      </header>
      {total === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No open balance.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              height: 14,
              borderRadius: 999,
              overflow: 'hidden',
              border: '1px solid var(--border)',
            }}
          >
            {buckets.map((b) => {
              const v = summary.agingByBucket[b];
              const pct = total > 0 ? (v / total) * 100 : 0;
              if (pct <= 0) return null;
              return <div key={b} title={`${b}: ${fmtMoney(v, 0)} (${pct.toFixed(1)}%)`} style={{ width: `${pct}%`, background: BUCKET_COLOR[b] }} />;
            })}
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {buckets.map((b) => {
              const v = summary.agingByBucket[b];
              const pct = total > 0 ? v / total : 0;
              return (
                <li key={b} className="between" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span className="row gap-1" style={{ alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: BUCKET_COLOR[b] }} />
                    {b === 'Current' ? 'Current' : `${b} d`}
                  </span>
                  <span className="row gap-3">
                    <span className="num">{fmtMoney(v, 0)}</span>
                    <span style={{ color: 'var(--text-tertiary)', minWidth: 40, textAlign: 'right' }}>{fmtPct(pct, 1)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </GlassCard>
  );
}

// ---- Exceptions list ------------------------------------------------------

function ExceptionsCard({
  exceptions,
  openCount,
  onSelect,
}: {
  exceptions: ReturnType<typeof runDetection>['exceptions'];
  openCount: number;
  onSelect?: (id: string) => void;
}) {
  return (
    <GlassCard>
      <header className="between" style={{ marginBottom: 10 }}>
        <div>
          <div className="label">Open exceptions for this customer</div>
          <h3 style={{ marginTop: 4 }}>
            <ListChecks size={14} style={{ verticalAlign: -2, marginRight: 6, color: 'var(--accent)' }} />
            {openCount} open · {exceptions.length} total
          </h3>
        </div>
      </header>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {exceptions.slice(0, 8).map((e) => (
          <li
            key={e.exception_id}
            onClick={() => onSelect?.(e.exception_id)}
            className="severity-strip between"
            data-severity={e.severity}
            style={{
              padding: '8px 10px 8px 16px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              cursor: onSelect ? 'pointer' : 'default',
              gap: 8,
            }}
          >
            <span className="row gap-2" style={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
              <SeverityBadge severity={e.severity} />
              <CategoryBadge category={e.category} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.description}
              </span>
            </span>
            <span className="num" style={{ fontWeight: 600, fontSize: 13 }}>{fmtMoney(e.amount_impact, 0)}</span>
          </li>
        ))}
      </ul>
      {exceptions.length > 8 && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
          + {exceptions.length - 8} more — open the Exceptions tab to see all.
        </div>
      )}
    </GlassCard>
  );
}

// ---- Open invoices --------------------------------------------------------

function OpenInvoicesCard({ rows }: { rows: CustomerOpenInvoice[] }) {
  return (
    <GlassCard padding={0}>
      <header className="between" style={{ padding: '16px 20px 8px' }}>
        <div>
          <div className="label">Open invoices</div>
          <h3 style={{ marginTop: 4 }}>
            <Building2 size={14} style={{ verticalAlign: -2, marginRight: 6, color: 'var(--accent)' }} />
            {rows.length} open · {fmtMoney(rows.reduce((s, r) => s + r.openBalance, 0), 0)} balance
          </h3>
        </div>
      </header>
      <div style={{ overflow: 'auto', maxHeight: 360 }}>
        <table className="fin-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Issued</th>
              <th>Due</th>
              <th>Status</th>
              <th>Bucket</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'right' }}>Receipts</th>
              <th style={{ textAlign: 'right' }}>Credits</th>
              <th style={{ textAlign: 'right' }}>Open</th>
              <th style={{ textAlign: 'right' }}>DPD</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.invoice.invoice_id}>
                <td className="mono">{r.invoice.invoice_id}</td>
                <td>{fmtDate(r.invoice.invoice_date)}</td>
                <td>{fmtDate(r.invoice.due_date)}</td>
                <td>{r.invoice.status}</td>
                <td>
                  <span style={{ color: BUCKET_COLOR[r.bucket], fontWeight: 600, fontSize: 12 }}>
                    {r.bucket === 'Current' ? 'Current' : `${r.bucket} d`}
                  </span>
                </td>
                <td className="num">{fmtMoney(r.invoice.total_amount)}</td>
                <td className="num">{r.appliedReceipts === 0 ? '—' : fmtMoney(r.appliedReceipts)}</td>
                <td className="num">{r.appliedCredits === 0 ? '—' : fmtMoney(r.appliedCredits)}</td>
                <td className="num" style={{ fontWeight: 700 }}>{fmtMoney(r.openBalance)}</td>
                <td className="num" style={{ color: r.daysPastDue > 0 ? 'var(--severity-medium)' : 'var(--text-tertiary)' }}>
                  {r.daysPastDue}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={10} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>No open invoices.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

// ---- Receipts -------------------------------------------------------------

function ReceiptsCard({ rows }: { rows: ReturnType<typeof buildCustomerReceipts> }) {
  return (
    <GlassCard padding={0}>
      <header className="between" style={{ padding: '16px 20px 8px' }}>
        <div>
          <div className="label">Recent receipts</div>
          <h3 style={{ marginTop: 4 }}>
            <Receipt size={14} style={{ verticalAlign: -2, marginRight: 6, color: 'var(--accent)' }} />
            Last 90 days · {rows.length} receipt{rows.length === 1 ? '' : 's'}
          </h3>
        </div>
      </header>
      <div style={{ overflow: 'auto', maxHeight: 280 }}>
        <table className="fin-table">
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Date</th>
              <th>Method</th>
              <th>Applied to</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'right' }}>Applied</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.receipt_id}>
                <td className="mono">{r.receipt_id}</td>
                <td>{fmtDate(r.receipt_date)}</td>
                <td>{r.payment_method}</td>
                <td className="mono">{r.invoice_id_applied ?? '—'}</td>
                <td>{r.status}</td>
                <td className="num">{fmtMoney(r.amount)}</td>
                <td className="num">{fmtMoney(r.amount_applied)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>No receipts in window.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

// ---- Credit memos ---------------------------------------------------------

function CreditsCard({ rows }: { rows: ReturnType<typeof buildCustomerCredits> }) {
  return (
    <GlassCard padding={0}>
      <header className="between" style={{ padding: '16px 20px 8px' }}>
        <div>
          <div className="label">Credit memos</div>
          <h3 style={{ marginTop: 4 }}>
            <CreditCard size={14} style={{ verticalAlign: -2, marginRight: 6, color: 'var(--accent)' }} />
            {rows.length} memo{rows.length === 1 ? '' : 's'}
          </h3>
        </div>
      </header>
      <div style={{ overflow: 'auto', maxHeight: 280 }}>
        <table className="fin-table">
          <thead>
            <tr>
              <th>Memo</th>
              <th>Date</th>
              <th>Reason</th>
              <th>Original</th>
              <th>Applied to</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.memo_id}>
                <td className="mono">{m.memo_id}</td>
                <td>{fmtDate(m.memo_date)}</td>
                <td>{m.reason}</td>
                <td className="mono">{m.original_invoice_id || '—'}</td>
                <td className="mono">{m.applied_to_invoice_id ?? '—'}</td>
                <td>{m.status}</td>
                <td className="num">{fmtMoney(m.amount)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>No credit memos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

function resolveCSSVar(varExpr: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') return '#00c805';
  const m = varExpr.match(/var\((--[^)]+)\)/);
  if (!m) return varExpr;
  const value = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim();
  return value || '#00c805';
}

export default CustomerDrillDown;
