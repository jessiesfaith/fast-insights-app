// Two-pane exception workspace (BUILD.md §10).
// Queue on the left, detail on the right. Detection runs once per dataset
// load and is cached at this level.

import { useEffect, useMemo, useState } from 'react';
import { ARData } from '../../types/data';
import { runDetection } from '../../lib/detect';
import GlassCard from '../ui/GlassCard';
import ExceptionQueue from './ExceptionQueue';
import ExceptionDetail from './ExceptionDetail';
import { fmtMoney } from '../../lib/format';

interface Props {
  data: ARData;
  initialSelectedId?: string;
  onSelectCustomer?: (id: string) => void;
}

export function ExceptionsView({ data, initialSelectedId, onSelectCustomer }: Props) {
  const detection = useMemo(() => runDetection(data), [data]);
  const [selectedId, setSelectedId] = useState<string | null>(
    () =>
      (initialSelectedId && detection.exceptions.find((e) => e.exception_id === initialSelectedId)?.exception_id) ??
      detection.exceptions[0]?.exception_id ??
      null,
  );

  // when the parent navigates with a fresh focus id, jump to it
  useEffect(() => {
    if (initialSelectedId && detection.exceptions.find((e) => e.exception_id === initialSelectedId)) {
      setSelectedId(initialSelectedId);
    }
  }, [initialSelectedId, detection]);

  // Keep selection valid if the data changes underneath
  useEffect(() => {
    if (!detection.exceptions.find((e) => e.exception_id === selectedId)) {
      setSelectedId(detection.exceptions[0]?.exception_id ?? null);
    }
  }, [detection, selectedId]);

  const selected = detection.exceptions.find((e) => e.exception_id === selectedId) ?? null;

  const totalImpact = detection.exceptions.reduce((s, e) => s + Math.abs(e.amount_impact), 0);
  const high = detection.exceptions.filter((e) => e.severity === 'high').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header className="between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="label">Exception triage</div>
          <h1 style={{ marginTop: 4, fontSize: 22 }}>
            {detection.exceptions.length.toLocaleString()} open exception
            {detection.exceptions.length === 1 ? '' : 's'}
          </h1>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Total $ impact <span className="num" style={{ color: 'var(--text-secondary)' }}>{fmtMoney(totalImpact, 0)}</span>
            {' · '}
            <span style={{ color: 'var(--severity-high)' }}>{high} high</span> severity
          </div>
        </div>
        <CategorySummary detection={detection} />
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(420px, 0.9fr) minmax(0, 1.4fr)',
          gap: 16,
          minHeight: 640,
        }}
      >
        <GlassCard padding={0} style={{ overflow: 'hidden', height: 760 }}>
          <ExceptionQueue
            exceptions={detection.exceptions}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </GlassCard>
        <ExceptionDetail exception={selected} data={data} onSelectCustomer={onSelectCustomer} />
      </div>
    </div>
  );
}

function CategorySummary({ detection }: { detection: ReturnType<typeof runDetection> }) {
  const top = [...detection.byCategory]
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 4);
  return (
    <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
      {top.map((c) => (
        <div
          key={c.category}
          className="glass-pill"
          style={{
            background: 'var(--accent-soft)',
            color: 'var(--text-secondary)',
            fontSize: 11,
          }}
        >
          <span style={{ fontWeight: 600 }}>{c.count}</span>
          <span style={{ color: 'var(--text-tertiary)' }}>·</span>
          <span className="num" style={{ fontWeight: 600 }}>{fmtMoney(c.impact, 0)}</span>
        </div>
      ))}
    </div>
  );
}

export default ExceptionsView;
