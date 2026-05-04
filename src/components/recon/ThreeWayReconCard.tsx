// Centerpiece of the dashboard (BUILD.md §6).
// Three balances side-by-side as of the selected period-end, with two
// variance walks below — Subledger ↔ GL and GL ↔ Bank.

import { Building2, Database, Landmark } from 'lucide-react';
import { ARData } from '../../types/data';
import { ReconBalance, ThreeWayResult } from '../../types/recon';
import { buildThreeWay } from '../../lib/recon';
import { fmtMoney, fmtPeriod } from '../../lib/format';
import GlassCard from '../ui/GlassCard';
import VarianceWalk from './VarianceWalk';

interface Props {
  data: ARData;
  period: string;
}

export function ThreeWayReconCard({ data, period }: Props) {
  const result = buildThreeWay(data, period);

  return (
    <GlassCard variant="strong" style={{ padding: 24 }}>
      <header className="between" style={{ marginBottom: 16 }}>
        <div>
          <div className="label">Three-way reconciliation</div>
          <h2 style={{ marginTop: 4 }}>
            Subledger AR · GL 1200 · Bank cleared — {fmtPeriod(period)}
          </h2>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
            As of <span className="mono">{result.period.end}</span>
          </div>
        </div>
        <ReconStatusPill result={result} />
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        <BalanceTile
          balance={result.subledgerAR}
          icon={<Building2 size={16} />}
          tone="primary"
          subtitle={`${result.subledgerAR.count} open invoices`}
        />
        <BalanceTile
          balance={result.gl1200}
          icon={<Database size={16} />}
          subtitle="Account 1200 — Accounts Receivable"
        />
        <BalanceTile
          balance={result.bankCleared}
          icon={<Landmark size={16} />}
          subtitle="Period activity, reconciled deposits only"
        />
      </div>

      <hr className="glass-divider" style={{ margin: '20px 0 12px' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <VarianceWalk
          title="Variance walk"
          leftLabel="Subledger AR"
          rightLabel="GL 1200"
          variance={result.subledgerVsGL.variance}
          items={result.subledgerVsGL.items}
          data={data}
        />
        <VarianceWalk
          title="Variance walk"
          leftLabel="GL 1200 (period activity)"
          rightLabel="Bank cleared"
          variance={result.glVsBank.variance}
          items={result.glVsBank.items}
          data={data}
        />
      </div>
    </GlassCard>
  );
}

function BalanceTile({
  balance,
  icon,
  subtitle,
  tone,
}: {
  balance: ReconBalance;
  icon: React.ReactNode;
  subtitle: string;
  tone?: 'primary' | 'default';
}) {
  return (
    <GlassCard variant="nested" padding={18}>
      <div className="row gap-2" style={{ alignItems: 'center', color: 'var(--text-tertiary)' }}>
        <span className="center" style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          {icon}
        </span>
        <span className="label">{balance.label}</span>
      </div>
      <div
        className="num"
        style={{
          marginTop: 10,
          fontSize: 26,
          fontWeight: 700,
          color: tone === 'primary' ? 'var(--accent-hover)' : 'var(--text-primary)',
          textAlign: 'left',
        }}
      >
        {fmtMoney(balance.amount, 0)}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{subtitle}</div>
    </GlassCard>
  );
}

function ReconStatusPill({ result }: { result: ThreeWayResult }) {
  const subVsGL = Math.abs(result.subledgerVsGL.variance);
  const ties = subVsGL < 0.01;
  return (
    <span
      className="glass-pill"
      style={{
        background: ties ? 'var(--severity-resolved-bg)' : 'var(--severity-medium-bg)',
        color: ties ? 'var(--severity-resolved)' : 'var(--severity-medium)',
        fontWeight: 600,
      }}
    >
      {ties ? 'Subledger ties to GL' : `Variance ${fmtMoney(result.subledgerVsGL.variance, 0)} — explained below`}
    </span>
  );
}

export default ThreeWayReconCard;
