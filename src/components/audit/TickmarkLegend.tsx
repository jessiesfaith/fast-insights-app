// Tickmark reference card — small definition list pinned to the audit pack.

import { TICKMARK_LEGEND, TICKMARK_LEGEND_TITLE, TICKMARK_LETTERS } from '../../types/audit';
import GlassCard from '../ui/GlassCard';

export function TickmarkLegend() {
  return (
    <GlassCard padding={16}>
      <div className="label" style={{ marginBottom: 8 }}>{TICKMARK_LEGEND_TITLE}</div>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 8,
        }}
      >
        {TICKMARK_LETTERS.map((letter) => (
          <li
            key={letter}
            className="row gap-2"
            style={{
              alignItems: 'center',
              padding: '6px 10px',
              background: 'var(--bg-elevated)',
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 12,
            }}
          >
            <span
              className="center"
              style={{
                width: 22, height: 22, borderRadius: 5,
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
              }}
            >
              {letter}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>{TICKMARK_LEGEND[letter]}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export default TickmarkLegend;
