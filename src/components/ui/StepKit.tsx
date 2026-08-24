// Shared building blocks for the step-by-step teaching tools
// (Market Scenarios, Corporate Finance Lab): numbered step cards, chip
// buttons, the right-pane guide pieces, signed formatters, and the
// theme-version hook charts use to re-resolve CSS variables.

import { useEffect, useState } from 'react';
import GlassCard from './GlassCard';
import { fmtMoney } from '../../lib/format';

export const fmtSignedPct = (p: number) => `${p > 0 ? '+' : ''}${p.toFixed(1)}%`;
export const fmtSignedMoney = (d: number) =>
  d < 0 ? `−${fmtMoney(Math.abs(d), 0)}` : `+${fmtMoney(d, 0)}`;
export const toneFor = (v: number) =>
  v > 0 ? 'var(--pos)' : v < 0 ? 'var(--neg)' : 'var(--text-tertiary)';

/** Re-render when the light/dark toggle flips, so charts re-resolve CSS vars. */
export function useThemeVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const obs = new MutationObserver(() => setV((x) => x + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return v;
}

export const hintStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  marginTop: 0,
  marginBottom: 16,
};

export function StepCard({
  n,
  icon,
  title,
  children,
}: {
  n: number | string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard variant="default" padding={24}>
      <div className="row gap-3" style={{ alignItems: 'center', marginBottom: 14 }}>
        <div
          className="center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--surface-2, var(--bg-elevated-2))',
            color: 'var(--accent)',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600, marginRight: 8 }}>{n}.</span>
          {title}
        </h2>
      </div>
      {children}
    </GlassCard>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '6px 12px',
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 999,
        cursor: 'pointer',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        background: active ? 'var(--accent-soft)' : 'var(--bg-elevated-2)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        transition: 'color .15s, border-color .15s, background .15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

/** An equation, displayed in a wrapping mono block. */
export function Eq({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mono"
      style={{
        fontSize: 11.5,
        background: 'var(--bg-elevated-2)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 10px',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        color: 'var(--text-primary)',
        margin: '6px 0',
      }}
    >
      {children}
    </div>
  );
}

export function GuideSection({
  n,
  title,
  children,
}: {
  n: number | string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ paddingBottom: 14, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
      <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 6 }}>
        <span
          className="center"
          style={{
            width: 20,
            height: 20,
            borderRadius: 999,
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {n}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

export const guideLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: 'var(--text-tertiary)',
  fontWeight: 700,
  margin: '8px 0 3px',
};
