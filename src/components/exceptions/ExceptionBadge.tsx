// Small severity / category pills used in the queue and detail header.

import { ExceptionCategory, Severity, CATEGORY_LABEL } from '../../types/exception';

const SEVERITY_STYLE: Record<Severity, { bg: string; fg: string; label: string }> = {
  high:   { bg: 'var(--severity-high-bg)',   fg: 'var(--severity-high)',   label: 'High' },
  medium: { bg: 'var(--severity-medium-bg)', fg: 'var(--severity-medium)', label: 'Medium' },
  low:    { bg: 'var(--severity-low-bg)',    fg: 'var(--severity-low)',    label: 'Low' },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITY_STYLE[severity];
  return (
    <span
      className="glass-pill"
      style={{
        background: s.bg,
        color: s.fg,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.06,
        fontSize: 10,
      }}
    >
      {s.label}
    </span>
  );
}

export function CategoryBadge({ category }: { category: ExceptionCategory }) {
  return (
    <span
      className="glass-pill"
      style={{
        background: 'var(--accent-soft)',
        color: 'var(--text-secondary)',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {CATEGORY_LABEL[category]}
    </span>
  );
}

export default SeverityBadge;
