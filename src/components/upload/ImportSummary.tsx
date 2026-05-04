// Per-file import summary card (BUILD.md §4.7).
// Shown after upload — row counts, period range, $ volume, validation warnings.
// Auditors look here first to sanity-check completeness.

import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { DatasetKey, ImportSummary } from '../../types/data';
import { fmtMoney, fmtPeriod } from '../../lib/format';
import { useDataStore } from '../../lib/dataStore';
import GlassCard from '../ui/GlassCard';

const DATASET_ORDER: DatasetKey[] = [
  'invoices', 'receipts', 'creditMemos', 'glEntries', 'bankStatements', 'customers',
];

interface Props {
  summaries: ImportSummary[];
  onContinue?: () => void;
}

export function ImportSummaryView({ summaries, onContinue }: Props) {
  const { clearData, loadedAt } = useDataStore();
  if (summaries.length === 0) return null;

  const byKey = new Map<DatasetKey, ImportSummary>();
  for (const s of summaries) byKey.set(s.key, s);
  const totalWarnings = summaries.reduce((acc, s) => acc + s.warnings.length, 0);
  const totalRows = summaries.reduce((acc, s) => acc + s.rowCount, 0);

  return (
    <GlassCard>
      <div className="between" style={{ marginBottom: 12 }}>
        <div>
          <h2>Import summary</h2>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
            {summaries.length} of 6 datasets loaded · {totalRows.toLocaleString()} rows
            {loadedAt ? ` · loaded ${new Date(loadedAt).toLocaleString()}` : ''}
          </div>
        </div>
        <div className="row gap-2" style={{ alignItems: 'center' }}>
          {totalWarnings > 0 && (
            <span
              className="glass-pill"
              style={{
                background: 'var(--severity-medium-bg)',
                color: 'var(--severity-medium)',
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={12} />
              {totalWarnings} warning{totalWarnings === 1 ? '' : 's'}
            </span>
          )}
          {onContinue && summaries.length === 6 && (
            <button
              type="button"
              onClick={onContinue}
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                border: '1px solid var(--accent)',
                padding: '7px 12px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Open dashboard →
            </button>
          )}
          <button
            type="button"
            onClick={clearData}
            title="Clear loaded data"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              color: 'var(--text-tertiary)',
              border: '1px solid var(--border)',
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
        {DATASET_ORDER.map((key) => {
          const s = byKey.get(key);
          return s ? <SummaryTile key={key} summary={s} /> : <MissingTile key={key} datasetKey={key} />;
        })}
      </div>
    </GlassCard>
  );
}

function SummaryTile({ summary }: { summary: ImportSummary }) {
  const { label, fileName, rowCount, totalAmount, periodRange, warnings } = summary;
  return (
    <GlassCard
      variant="nested"
      padding={14}
      severity={warnings.length > 0 ? 'medium' : 'resolved'}
      style={{ paddingLeft: 18 }}
    >
      <div className="between" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="label">{label}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {fileName}
          </div>
        </div>
        <CheckCircle2 size={14} style={{ color: 'var(--severity-resolved)' }} />
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Stat label="rows" value={rowCount.toLocaleString()} />
        {totalAmount !== null && <Stat label="volume" value={fmtMoney(totalAmount, 0)} />}
        {periodRange && (
          <Stat
            label="period"
            value={
              periodRange[0] === periodRange[1]
                ? fmtPeriod(periodRange[0])
                : `${fmtPeriod(periodRange[0])} → ${fmtPeriod(periodRange[1])}`
            }
          />
        )}
      </div>
      {warnings.length > 0 && (
        <ul style={{ marginTop: 10, paddingLeft: 16, fontSize: 12, color: 'var(--severity-medium)' }}>
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

function MissingTile({ datasetKey }: { datasetKey: DatasetKey }) {
  const labels: Record<DatasetKey, string> = {
    invoices: 'Invoices',
    receipts: 'Cash Receipts',
    creditMemos: 'Credit Memos',
    glEntries: 'GL Entries',
    bankStatements: 'Bank Statements',
    customers: 'Customers',
  };
  return (
    <GlassCard variant="nested" padding={14} style={{ opacity: 0.55 }}>
      <div className="between">
        <div>
          <div className="label">{labels[datasetKey]}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>not loaded</div>
        </div>
      </div>
    </GlassCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="between" style={{ fontSize: 12 }}>
      <span style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.06 }}>{label}</span>
      <span className="num" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default ImportSummaryView;
