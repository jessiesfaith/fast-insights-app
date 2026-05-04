// One KPI tile with current value, delta vs prior period, and direction-aware color.
// Eight of these render in a 4-column grid on the dashboard (BUILD.md §7).
// The (i) button reveals the auditor-facing formula derivation.

import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Info, Minus } from 'lucide-react';
import { KPIResult } from '../../types/kpi';
import { KPI_FORMULA } from '../../lib/kpis';
import { fmtMoney, fmtPct } from '../../lib/format';
import GlassCard from '../ui/GlassCard';

interface Props {
  kpi: KPIResult;
  hasPrior: boolean;
}

function fmtValue(value: number, unit: KPIResult['unit']): string {
  switch (unit) {
    case 'money': return fmtMoney(value, 0);
    case 'pct':   return fmtPct(value, 1);
    case 'days':  return `${Math.round(value)}d`;
    default:      return value.toLocaleString();
  }
}

function fmtDelta(delta: number, unit: KPIResult['unit']): string {
  const sign = delta > 0 ? '+' : '';
  switch (unit) {
    case 'money': return `${sign}${fmtMoney(delta, 0)}`;
    case 'pct':   return `${sign}${(delta * 100).toFixed(1)}pp`;
    case 'days':  return `${sign}${Math.round(delta)}d`;
    default:      return `${sign}${delta.toLocaleString()}`;
  }
}

export function KPITile({ kpi, hasPrior }: Props) {
  const { key, label, unit, current, delta, goodDirection } = kpi;
  const [showFormula, setShowFormula] = useState(false);
  const formula = KPI_FORMULA[key];

  // determine if delta direction is "good" or "bad"
  let toneClass: 'pos' | 'neg' | 'flat' = 'flat';
  if (delta !== null && Math.abs(delta) > 1e-9) {
    const trendingUp = delta > 0;
    const isGood = (goodDirection === 'up' && trendingUp) || (goodDirection === 'down' && !trendingUp);
    toneClass = isGood ? 'pos' : 'neg';
  }

  const toneColor =
    toneClass === 'pos' ? 'var(--pos)' : toneClass === 'neg' ? 'var(--neg)' : 'var(--text-tertiary)';

  return (
    <GlassCard padding={16} interactive style={{ position: 'relative' }}>
      <div className="between" style={{ alignItems: 'flex-start', minHeight: 14 }}>
        <div className="label">{label}</div>
        {formula && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowFormula((v) => !v);
            }}
            aria-label={`Show formula for ${label}`}
            aria-expanded={showFormula}
            title="Show how this KPI is calculated"
            style={{
              background: showFormula ? 'var(--accent)' : 'transparent',
              color: showFormula ? 'var(--accent-contrast)' : 'var(--text-tertiary)',
              border: `1px solid ${showFormula ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 999,
              padding: 2,
              width: 18,
              height: 18,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Info size={11} />
          </button>
        )}
      </div>
      <div
        className="num"
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginTop: 8,
          textAlign: 'left',
        }}
      >
        {fmtValue(current, unit)}
      </div>
      <div
        className="row gap-1"
        style={{
          alignItems: 'center',
          marginTop: 6,
          fontSize: 12,
          color: toneColor,
          minHeight: 16,
        }}
      >
        {!hasPrior || delta === null ? (
          <span style={{ color: 'var(--text-tertiary)' }}>no prior period</span>
        ) : Math.abs(delta) < 1e-9 ? (
          <>
            <Minus size={12} />
            <span>flat vs prior</span>
          </>
        ) : (
          <>
            {delta > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            <span className="num">{fmtDelta(delta, unit)}</span>
            <span style={{ color: 'var(--text-tertiary)' }}>vs prior</span>
          </>
        )}
      </div>
      {showFormula && formula && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 10px',
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent)',
            borderRadius: 8,
            fontSize: 11,
            lineHeight: 1.4,
            color: 'var(--text-primary)',
          }}
        >
          <div className="label" style={{ marginBottom: 4, color: 'var(--accent-hover)' }}>Formula</div>
          {formula}
        </div>
      )}
    </GlassCard>
  );
}

export default KPITile;
