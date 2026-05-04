// Lightweight period dropdown — selects from the months present in the data.
// Full scenario engine (QTD/YTD/custom range) ships in milestone 8.

import { Calendar } from 'lucide-react';
import { fmtPeriod } from '../../lib/format';

interface Props {
  value: string;
  options: string[];
  onChange: (period: string) => void;
}

export function PeriodSelector({ value, options, onChange }: Props) {
  return (
    <label
      className="row gap-2"
      style={{
        alignItems: 'center',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '6px 10px 6px 12px',
      }}
    >
      <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.06, color: 'var(--text-tertiary)' }}>
        Period
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          fontWeight: 600,
          fontSize: 13,
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {options.map((p) => (
          <option key={p} value={p}>{fmtPeriod(p)}</option>
        ))}
      </select>
    </label>
  );
}

export default PeriodSelector;
