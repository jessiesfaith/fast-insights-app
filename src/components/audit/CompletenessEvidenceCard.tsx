// Completeness-evidence card on the audit-pack cover.
//
// Top half: a reference table the auditor can scan — every type of
// completeness evidence with why it matters. Bottom half: the live
// values for THIS pack — pre-filled from the loaded data, editable
// by the preparer, and persisted to localStorage / snapshot.

import { useEffect, useMemo } from 'react';
import { CheckCircle2, Database, FileBadge, FileCheck2, Hash, History, KeyRound, ListChecks, Lock, ServerCog } from 'lucide-react';
import { ARData } from '../../types/data';
import { useDataStore } from '../../lib/dataStore';
import { fmtDateTime, fmtMoney, fmtPeriod } from '../../lib/format';
import { buildDatasetHashes } from '../../lib/export/json';
import GlassCard from '../ui/GlassCard';

interface Props {
  data: ARData;
  period: string;
}

const EVIDENCE_TABLE: { label: string; why: string; icon: React.ReactNode }[] = [
  { label: 'Report parameters',           why: 'Shows the correct period / entity / filter was used',                 icon: <FileBadge size={13} /> },
  { label: 'Report ID / saved-search ID', why: 'Shows it was the approved standard report',                           icon: <ListChecks size={13} /> },
  { label: 'Record count',                why: 'Shows the population size captured',                                  icon: <Database size={13} /> },
  { label: 'Control total',               why: 'Shows the financial total from source',                               icon: <CheckCircle2 size={13} /> },
  { label: 'Export timestamp',            why: 'Shows when the data was pulled',                                      icon: <History size={13} /> },
  { label: 'Run log',                     why: 'Shows the process actually ran',                                      icon: <FileCheck2 size={13} /> },
  { label: 'Source-system audit log',     why: 'Shows who/what ran it',                                               icon: <ServerCog size={13} /> },
  { label: 'Hash of the export file',     why: 'Shows the file was not altered after export',                          icon: <Hash size={13} /> },
  { label: 'Read-only service account',   why: 'Reduces manipulation risk',                                           icon: <KeyRound size={13} /> },
  { label: 'Direct system / API extract', why: 'Stronger than a manually viewed screenshot',                          icon: <Lock size={13} /> },
];

export function CompletenessEvidenceCard({ data, period }: Props) {
  const { completenessEvidence: ev, setCompletenessField, loadedAt, signOff, isPeriodClosed } = useDataStore();
  const closed = isPeriodClosed(period);

  // Pre-fill the run timestamp on first use from the most recent CSV import.
  useEffect(() => {
    if (!ev.runTimestamp && loadedAt) setCompletenessField('runTimestamp', loadedAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedAt]);

  // Population stats are derived from the loaded data. Per-dataset breakdown
  // is shown read-only so the preparer can see each source-report's row count
  // and dollar volume; preparer can also enter the source-system numbers
  // themselves so any drift versus what was imported is visible.
  const stats = useMemo(() => {
    const datasets = [
      {
        key: 'invoices',
        label: 'Invoices',
        rows: data.invoices.length,
        total: data.invoices.reduce((s, i) => s + i.total_amount, 0),
      },
      {
        key: 'receipts',
        label: 'Cash receipts',
        rows: data.receipts.length,
        total: data.receipts.reduce((s, r) => s + r.amount, 0),
      },
      {
        key: 'creditMemos',
        label: 'Credit memos',
        rows: data.creditMemos.length,
        total: data.creditMemos.reduce((s, m) => s + m.amount, 0),
      },
      {
        key: 'glEntries',
        label: 'GL entries',
        rows: data.glEntries.length,
        total: data.glEntries.reduce((s, g) => s + g.debit, 0),
      },
      {
        key: 'bankStatements',
        label: 'Bank statements',
        rows: data.bankStatements.length,
        total: data.bankStatements.reduce((s, b) => s + b.credit, 0),
      },
      {
        key: 'customers',
        label: 'Customers',
        rows: data.customers.length,
        total: null as number | null,
      },
    ];
    const importedRecordCount = datasets.reduce((s, d) => s + d.rows, 0);
    const importedControlTotal = data.invoices.reduce((s, i) => s + i.total_amount, 0);
    return {
      datasets,
      importedRecordCount,
      importedControlTotal,
      hashes: buildDatasetHashes(data),
    };
  }, [data]);

  // Coerce preparer-entered strings into numbers for variance display.
  const parsedRecordCount = ev.preparerRecordCount.trim() === ''
    ? null
    : Number(ev.preparerRecordCount.replace(/[,\s]/g, ''));
  const parsedControlTotal = ev.preparerControlTotal.trim() === ''
    ? null
    : Number(ev.preparerControlTotal.replace(/[$,\s]/g, ''));
  const recordCountVariance =
    parsedRecordCount !== null && Number.isFinite(parsedRecordCount)
      ? parsedRecordCount - stats.importedRecordCount
      : null;
  const controlTotalVariance =
    parsedControlTotal !== null && Number.isFinite(parsedControlTotal)
      ? parsedControlTotal - stats.importedControlTotal
      : null;

  const hashSummary = Object.entries(stats.hashes)
    .map(([k, v]) => `${k}:${v}`)
    .join('  ·  ');

  return (
    <GlassCard padding={20}>
      <header style={{ marginBottom: 12 }}>
        <div className="label">Completeness evidence</div>
        <h3 style={{ marginTop: 4 }}>
          Population proof — how this pack ties to the source system
        </h3>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
          Every audit-ready close should be able to answer all of the questions on the left.
          Fill in the blanks below for this period; computed values update automatically.
        </div>
      </header>

      <table className="fin-table" style={{ marginBottom: 18 }}>
        <thead>
          <tr>
            <th>Completeness evidence</th>
            <th>Why it helps</th>
          </tr>
        </thead>
        <tbody>
          {EVIDENCE_TABLE.map((row) => (
            <tr key={row.label}>
              <td>
                <span className="row gap-2" style={{ alignItems: 'center', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent)' }}>{row.icon}</span>
                  <span style={{ fontWeight: 600 }}>{row.label}</span>
                </span>
              </td>
              <td style={{ color: 'var(--text-tertiary)' }}>{row.why}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="between" style={{ marginBottom: 6 }}>
        <div className="label">For this pack</div>
        {closed && (
          <span
            className="glass-pill"
            style={{
              background: 'var(--severity-resolved-bg)',
              color: 'var(--severity-resolved)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.06,
              fontSize: 10,
            }}
          >
            Period closed · read-only
          </span>
        )}
      </div>
      <div
        style={{
          padding: 14,
          border: '1px solid var(--border-strong)',
          borderRadius: 10,
          background: 'var(--bg-elevated)',
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          gap: '6px 14px',
          fontSize: 13,
          opacity: closed ? 0.7 : 1,
        }}
      >
        {/* When the period is closed every editable field becomes read-only;
            we omit onChange to drive the Field component's read-only branch. */}
        <Field label="Report"        value={ev.reportName}    onChange={closed ? undefined : (v) => setCompletenessField('reportName', v)} />
        <Field label="Period"        value={fmtPeriod(period)}                                              readOnly />
        <Field label="Entity"        value={signOff.entityName || '(set on cover above)'}                   readOnly />
        <Field label="Report / saved-search ID" value={ev.reportId}     onChange={closed ? undefined : (v) => setCompletenessField('reportId', v)} placeholder="e.g. NS-SS-3120 or AR-DEFREV-LIST" />
        <Field label="Source"        value={ev.sourceSystem}  onChange={closed ? undefined : (v) => setCompletenessField('sourceSystem', v)} placeholder="NetSuite saved search / Oracle report / SAP table / Snowflake view" />
        <Field label="Extract method" value={ev.extractMethod} onChange={closed ? undefined : (v) => setCompletenessField('extractMethod', v)} placeholder="Direct API extract / Scheduled export / Manual download" />
        <Field label="Service account" value={ev.serviceAccount} onChange={closed ? undefined : (v) => setCompletenessField('serviceAccount', v)} placeholder="Read-only account name" />
        <Field
          label="Run timestamp"
          value={ev.runTimestamp ? fmtDateTime(ev.runTimestamp) : (loadedAt ? fmtDateTime(loadedAt) : '')}
          onChange={closed ? undefined : (v) => setCompletenessField('runTimestamp', v)}
          placeholder="When the source pulled the data"
        />
        <Field
          label="Record count (source)"
          value={ev.preparerRecordCount}
          onChange={closed ? undefined : (v) => setCompletenessField('preparerRecordCount', v)}
          placeholder={`Imported: ${stats.importedRecordCount.toLocaleString()} — overwrite with the source-report run-log count`}
          numeric
          variance={recordCountVariance == null ? undefined : recordCountVariance.toLocaleString()}
          varianceTone={
            recordCountVariance == null
              ? 'neutral'
              : Math.abs(recordCountVariance) < 0.5
              ? 'good'
              : 'warn'
          }
        />
        <Field
          label="Source report total"
          value={ev.preparerControlTotal}
          onChange={closed ? undefined : (v) => setCompletenessField('preparerControlTotal', v)}
          placeholder={`Imported invoices: ${fmtMoney(stats.importedControlTotal, 0)} — overwrite with source control total`}
          numeric
          variance={controlTotalVariance == null ? undefined : fmtMoney(controlTotalVariance, 0)}
          varianceTone={
            controlTotalVariance == null
              ? 'neutral'
              : Math.abs(controlTotalVariance) < 0.5
              ? 'good'
              : 'warn'
          }
        />
        <Field label="Status" value={ev.status} onChange={closed ? undefined : (v) => setCompletenessField('status', v)} placeholder="Imported · Validated · Reconciled · Signed off" />
        <ReadOnlyValue
          label="Export-file hash"
          value={hashSummary}
          mono
          dim
        />
        <Field
          label="Notes"
          value={ev.notes}
          onChange={closed ? undefined : (v) => setCompletenessField('notes', v)}
          placeholder="Anything special about this period — re-runs, ad-hoc adjustments, exclusions"
          multiline
        />
      </div>

      <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>
        Per-dataset rows imported into the pack
      </div>
      <table className="fin-table">
        <thead>
          <tr>
            <th>Dataset</th>
            <th style={{ textAlign: 'right' }}>Rows</th>
            <th style={{ textAlign: 'right' }}>$ volume</th>
            <th>Hash</th>
          </tr>
        </thead>
        <tbody>
          {stats.datasets.map((d) => (
            <tr key={d.key}>
              <td style={{ fontWeight: 600 }}>{d.label}</td>
              <td className="num">{d.rows.toLocaleString()}</td>
              <td className="num">{d.total == null ? '—' : fmtMoney(d.total, 0)}</td>
              <td>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {(stats.hashes as Record<string, string | undefined>)[d.key] ?? ''}
                </span>
              </td>
            </tr>
          ))}
          <tr>
            <td style={{ fontWeight: 700 }}>Total</td>
            <td className="num" style={{ fontWeight: 700 }}>{stats.importedRecordCount.toLocaleString()}</td>
            <td className="num" style={{ fontWeight: 700, color: 'var(--text-tertiary)' }}>
              invoices: {fmtMoney(stats.importedControlTotal, 0)}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </GlassCard>
  );
}

// ---- inline field helpers --------------------------------------------------

function Field({
  label,
  value,
  onChange,
  placeholder,
  readOnly,
  multiline,
  numeric,
  variance,
  varianceTone,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  multiline?: boolean;
  numeric?: boolean;
  variance?: string;
  varianceTone?: 'good' | 'warn' | 'neutral';
}) {
  const sharedStyle: React.CSSProperties = {
    background: readOnly ? 'transparent' : 'var(--bg-elevated-2)',
    border: readOnly ? 'none' : '1px solid var(--border)',
    borderRadius: 6,
    padding: readOnly ? '4px 6px' : '6px 10px',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontFamily: 'inherit',
    width: '100%',
    outline: 'none',
  };
  const varianceColor =
    varianceTone === 'good'
      ? 'var(--severity-resolved)'
      : varianceTone === 'warn'
      ? 'var(--severity-medium)'
      : 'var(--text-tertiary)';
  return (
    <>
      <div style={{ color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.06, paddingTop: readOnly ? 4 : 8 }}>
        {label}
      </div>
      <div>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly || !onChange}
            rows={2}
            style={{ ...sharedStyle, resize: 'vertical', minHeight: 36 }}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly || !onChange}
            inputMode={numeric ? 'decimal' : undefined}
            className={numeric ? 'num' : undefined}
            style={sharedStyle}
          />
        )}
        {variance !== undefined && (
          <div style={{ marginTop: 3, fontSize: 11, color: varianceColor, fontWeight: 600 }}>
            Δ vs imported: <span className="num">{variance}</span>
          </div>
        )}
      </div>
    </>
  );
}

function ReadOnlyValue({
  label,
  value,
  mono,
  dim,
}: {
  label: string;
  value: string;
  mono?: boolean;
  dim?: boolean;
}) {
  return (
    <>
      <div style={{ color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.06, paddingTop: 4 }}>
        {label}
      </div>
      <div
        className={mono ? 'mono' : undefined}
        style={{
          fontSize: mono ? 11 : 13,
          fontWeight: 600,
          color: dim ? 'var(--text-tertiary)' : 'var(--text-primary)',
          padding: '4px 6px',
          wordBreak: mono ? 'break-all' : undefined,
        }}
      >
        {value}
      </div>
    </>
  );
}

export default CompletenessEvidenceCard;
