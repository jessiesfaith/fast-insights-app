// PDF / Excel / JSON snapshot export toolbar (BUILD.md §12).
// Always rendered at the top of the audit pack and hidden in the print
// stylesheet (.no-print).

import { useState } from 'react';
import { FileDown, FileSpreadsheet, FileText, Loader2, Save } from 'lucide-react';
import { useDataStore } from '../../lib/dataStore';
import { useScenario } from '../../lib/scenarioStore';
import { exportAuditPackExcel } from '../../lib/export/excel';
import { buildSnapshot, downloadSnapshot } from '../../lib/export/json';
import { exportPDF } from '../../lib/export/pdf';
import GlassCard from '../ui/GlassCard';

interface Props {
  period: string;
}

export function ExportToolbar({ period }: Props) {
  const {
    data, signOff, operator, summaries, workflows, tickmarks,
    bridgeBalances, getBridgeBalance, completenessEvidence, getClosedPeriodEntry,
    badDebtReserves, getBadDebtReserve, signoffSnapshots,
  } = useDataStore();
  const { scenario } = useScenario();
  const [busy, setBusy] = useState<'pdf' | 'excel' | 'json' | null>(null);
  const [lastFile, setLastFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePDF = () => {
    setBusy('pdf'); setError(null);
    try {
      exportPDF({ entityName: signOff.entityName, period, operator });
      setLastFile('PDF — saved via browser dialog');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF export failed');
    } finally {
      setBusy(null);
    }
  };

  const handleExcel = () => {
    setBusy('excel'); setError(null);
    try {
      const fn = exportAuditPackExcel({
        data, period, signOff, operator, workflows, tickmarks,
        bridgeEntry: getBridgeBalance(period),
        completenessEvidence,
        closedPeriod: getClosedPeriodEntry(period),
        badDebtReserve: getBadDebtReserve(period),
      });
      setLastFile(fn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Excel export failed');
    } finally {
      setBusy(null);
    }
  };

  const handleJSON = () => {
    setBusy('json'); setError(null);
    try {
      const themePref = (typeof window !== 'undefined'
        ? (window.localStorage.getItem('ar-tool-beta:theme') as 'light' | 'dark' | null)
        : null);
      const snap = buildSnapshot({
        data, period, signOff, operator, workflows, tickmarks,
        summaries, scenario, themePreference: themePref,
        bridgeBalances, completenessEvidence,
        badDebtReserves, signoffSnapshots,
      });
      const fn = downloadSnapshot(snap);
      setLastFile(fn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'JSON snapshot failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <GlassCard padding={14} className="no-print">
      <div className="between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="label">Export audit pack</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            PDF prints with the active tickmarks · Excel ships 10 sheets · JSON is the canonical archival snapshot
          </div>
        </div>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <ExportButton
            icon={busy === 'pdf' ? <Loader2 size={14} className="spin" /> : <FileText size={14} />}
            label="PDF"
            sub="print → save"
            onClick={handlePDF}
            disabled={busy !== null}
          />
          <ExportButton
            icon={busy === 'excel' ? <Loader2 size={14} className="spin" /> : <FileSpreadsheet size={14} />}
            label="Excel"
            sub=".xlsx · 10 sheets"
            onClick={handleExcel}
            disabled={busy !== null}
            tone="green"
          />
          <ExportButton
            icon={busy === 'json' ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
            label="JSON snapshot"
            sub="archival, importable"
            onClick={handleJSON}
            disabled={busy !== null}
            tone="violet"
          />
        </div>
      </div>
      {error && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 10px',
            borderRadius: 8,
            background: 'var(--severity-high-bg)',
            color: 'var(--severity-high)',
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}
      {lastFile && !error && (
        <div
          className="row gap-2"
          style={{
            marginTop: 10,
            alignItems: 'center',
            padding: '8px 10px',
            borderRadius: 8,
            background: 'var(--severity-resolved-bg)',
            color: 'var(--severity-resolved)',
            fontSize: 12,
          }}
        >
          <FileDown size={12} />
          <span className="mono">{lastFile}</span>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 0.9s linear infinite; }`}</style>
    </GlassCard>
  );
}

function ExportButton({
  icon, label, sub, onClick, disabled, tone = 'accent',
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'accent' | 'green' | 'violet';
}) {
  const bg =
    tone === 'green'
      ? 'var(--severity-resolved)'
      : tone === 'violet'
      ? 'var(--accent-hover)'
      : 'var(--accent)';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="row gap-2"
      style={{
        alignItems: 'center',
        background: bg,
        color: 'var(--accent-contrast)',
        border: 'none',
        padding: '8px 14px',
        borderRadius: 10,
        boxShadow: '0 6px 18px var(--accent-glow)',
        cursor: disabled ? 'progress' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        fontWeight: 600,
        fontSize: 13,
      }}
    >
      {icon}
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
        {label}
        <span style={{ fontSize: 10, opacity: 0.85 }}>{sub}</span>
      </span>
    </button>
  );
}

export default ExportToolbar;
