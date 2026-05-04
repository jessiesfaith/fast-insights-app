// AR Bridge / period roll-forward (BUILD.md §6.3).
// Beg AR + Billings − Cash − Credits − Write-offs ± Adj = End AR
// Verifies that End AR (computed) ties to End AR (recomputed from subledger).
// Each line is expandable to show the underlying records that fed it — so
// when the bridge doesn't tie, the team can drill straight to the source.

import { useState } from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { ARData } from '../../types/data';
import { SourceRef } from '../../types/recon';
import { ARBridgeLineRefs, buildARBridge, buildARBridgeRefs } from '../../lib/recon';
import { fmtMoney, fmtPeriod } from '../../lib/format';
import GlassCard from '../ui/GlassCard';
import EvidencePanel from '../exceptions/EvidencePanel';

interface Props {
  data: ARData;
  period: string;
}

interface BridgeLine {
  key: keyof ARBridgeLineRefs;
  label: string;
  amount: number;
  sign: '+' | '−' | '±' | '=';
}

export function ARBridgeCard({ data, period }: Props) {
  const r = buildARBridge(data, period);
  const refs = buildARBridgeRefs(data, period);

  const lines: BridgeLine[] = [
    { key: 'beginning',      label: 'Beginning AR',         amount: r.beginningAR,       sign: '=' },
    { key: 'billings',       label: 'Billings (new invoices)', amount: r.billings,        sign: '+' },
    { key: 'cashApplied',    label: 'Cash applied',          amount: -r.cashApplied,      sign: '−' },
    { key: 'creditsApplied', label: 'Credit memos applied',  amount: -r.creditsApplied,   sign: '−' },
    { key: 'writeOffs',      label: 'Write-offs',            amount: -r.writeOffs,        sign: '−' },
    { key: 'adjustments',    label: 'Adjustments',           amount: r.adjustments,       sign: '±' },
  ];

  return (
    <GlassCard>
      <header className="between" style={{ marginBottom: 12 }}>
        <div>
          <div className="label">AR Bridge · roll-forward</div>
          <h2 style={{ marginTop: 4 }}>{fmtPeriod(period)}</h2>
        </div>
        <TieStatus ties={r.ties} variance={r.variance} />
      </header>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {lines.map((l) => (
          <BridgeRow key={l.key} line={l} sourceRecords={refs[l.key]} data={data} />
        ))}
        <li
          className="between"
          style={{
            padding: '14px 0 0',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            borderTop: '2px solid var(--border-strong)',
            marginTop: 6,
          }}
        >
          <span className="row gap-2" style={{ alignItems: 'center' }}>
            <span style={{ width: 18, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>=</span>
            <span>Ending AR (computed)</span>
          </span>
          <span className="num">{fmtMoney(r.endingARComputed, 0)}</span>
        </li>
      </ul>

      <div
        className="between"
        style={{
          marginTop: 12,
          padding: '10px 12px',
          borderRadius: 10,
          background: r.ties ? 'var(--severity-resolved-bg)' : 'var(--severity-high-bg)',
          fontSize: 13,
        }}
      >
        <span className="row gap-2" style={{ alignItems: 'center', color: r.ties ? 'var(--severity-resolved)' : 'var(--severity-high)', fontWeight: 600 }}>
          {r.ties ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {r.ties ? 'Ties to subledger AR' : 'Variance vs subledger'}
          <ArrowRight size={12} />
          <span className="num">{fmtMoney(r.endingARSubledger, 0)}</span>
        </span>
        {!r.ties && (
          <span className="num" style={{ fontWeight: 700, color: 'var(--severity-high)' }}>
            {fmtMoney(r.variance, 0)}
          </span>
        )}
      </div>

    </GlassCard>
  );
}

function BridgeRow({
  line,
  sourceRecords,
  data,
}: {
  line: BridgeLine;
  sourceRecords: SourceRef[];
  data: ARData;
}) {
  const [open, setOpen] = useState(false);
  const expandable = sourceRecords.length > 0;

  return (
    <li
      style={{
        borderBottom: '1px solid var(--border)',
        fontSize: 13,
        color: 'var(--text-secondary)',
      }}
    >
      <button
        type="button"
        onClick={() => expandable && setOpen((v) => !v)}
        aria-expanded={open}
        disabled={!expandable}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '10px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: expandable ? 'pointer' : 'default',
          color: 'inherit',
          textAlign: 'left',
        }}
      >
        <span className="row gap-2" style={{ alignItems: 'center' }}>
          <span
            style={{
              width: 14,
              color: 'var(--text-tertiary)',
              display: 'inline-flex',
            }}
          >
            {expandable ? (open ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : null}
          </span>
          <span
            style={{
              width: 18,
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)',
              fontSize: 12,
            }}
          >
            {line.sign}
          </span>
          <span>{line.label}</span>
          {expandable && (
            <span
              className="glass-pill"
              style={{
                fontSize: 10,
                padding: '1px 7px',
                background: 'var(--bg-elevated)',
                color: 'var(--text-tertiary)',
              }}
            >
              {sourceRecords.length}
            </span>
          )}
        </span>
        <span className="num" style={{ fontWeight: 500 }}>
          {fmtMoney(line.amount, 0)}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 0 12px 32px' }}>
          <EvidencePanel sourceRecords={sourceRecords} data={data} maxHeight={280} />
        </div>
      )}
    </li>
  );
}

function TieStatus({ ties, variance }: { ties: boolean; variance: number }) {
  return (
    <span
      className="glass-pill"
      style={{
        background: ties ? 'var(--severity-resolved-bg)' : 'var(--severity-high-bg)',
        color: ties ? 'var(--severity-resolved)' : 'var(--severity-high)',
        fontWeight: 600,
      }}
    >
      {ties ? 'Ties' : `Δ ${fmtMoney(variance, 0)}`}
    </span>
  );
}

export default ARBridgeCard;
