// Reconciling-items list rendered between two balances (BUILD.md §6.2).
// Each line expands inline to the full evidence panel so the AR team can
// see the exact subledger / GL / bank rows backing the variance — and then
// go fix them in the ERP.

import { useState } from 'react';
import { ChevronDown, ChevronRight, MoveRight, Wrench } from 'lucide-react';
import { ARData } from '../../types/data';
import { VarianceLine } from '../../types/recon';
import { fmtMoney } from '../../lib/format';
import EvidencePanel from '../exceptions/EvidencePanel';

interface Props {
  title: string;
  leftLabel: string;
  rightLabel: string;
  variance: number;
  items: VarianceLine[];
  data: ARData;
}

export function VarianceWalk({ title, leftLabel, rightLabel, variance, items, data }: Props) {
  return (
    <div>
      <div className="between" style={{ marginBottom: 8 }}>
        <div className="row gap-2" style={{ alignItems: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
          <span>{title}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{leftLabel}</span>
          <MoveRight size={12} />
          <span style={{ color: 'var(--text-secondary)' }}>{rightLabel}</span>
        </div>
        <span
          className="num"
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: Math.abs(variance) < 0.01 ? 'var(--severity-resolved)' : 'var(--severity-medium)',
          }}
        >
          {fmtMoney(variance, 0)}
        </span>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            padding: '10px 12px',
            fontSize: 12,
            color: 'var(--severity-resolved)',
            background: 'var(--severity-resolved-bg)',
            borderRadius: 8,
          }}
        >
          No reconciling items — sides tie.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((it) => (
            <ItemRow key={it.id} item={it} data={data} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemRow({ item, data }: { item: VarianceLine; data: ARData }) {
  const [open, setOpen] = useState(false);
  const sign = item.amount > 0 ? 'pos' : item.amount < 0 ? 'neg' : 'neutral';

  return (
    <li
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          color: 'inherit',
          textAlign: 'left',
        }}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{item.label}</span>
        <span
          className="num"
          style={{
            fontWeight: 600,
            fontSize: 13,
            color:
              sign === 'pos'
                ? 'var(--severity-medium)'
                : sign === 'neg'
                ? 'var(--severity-low)'
                : 'var(--text-tertiary)',
            minWidth: 100,
          }}
        >
          {item.amount === 0 ? 'timing only' : fmtMoney(item.amount, 0)}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px 14px', borderTop: '1px solid var(--border)' }}>
          <div
            className="row gap-2"
            style={{
              alignItems: 'flex-start',
              padding: '10px 12px',
              marginTop: 10,
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}
          >
            <Wrench size={12} style={{ color: 'var(--accent)', marginTop: 2 }} />
            <span>
              <strong style={{ color: 'var(--text-primary)' }}>Fix in ERP:</strong> {item.description}{' '}
              Records below show the exact rows feeding this variance — re-export the relevant CSVs after correcting.
            </span>
          </div>
          {item.source_records.length > 0 ? (
            <div style={{ marginTop: 10 }}>
              <EvidencePanel sourceRecords={item.source_records} data={data} maxHeight={300} />
            </div>
          ) : (
            <div
              style={{
                marginTop: 10,
                padding: '10px 12px',
                fontSize: 12,
                color: 'var(--text-tertiary)',
              }}
            >
              No supporting records — this is a calculated reconciling item.
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default VarianceWalk;
