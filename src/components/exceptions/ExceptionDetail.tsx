// Right-pane detail (BUILD.md §10.2). Header + evidence tabs + workflow
// controls + audit log, all in a single scrollable panel.

import { ARData } from '../../types/data';
import { DetectedException } from '../../types/exception';
import { isResolved } from '../../types/workflow';
import { useDataStore } from '../../lib/dataStore';
import { fmtMoney, fmtDateTime } from '../../lib/format';
import { periodBounds } from '../../lib/period';
import GlassCard from '../ui/GlassCard';
import { CategoryBadge, SeverityBadge } from './ExceptionBadge';
import ExceptionEvidenceTabs from './ExceptionEvidenceTabs';
import WorkflowControls from './WorkflowControls';
import ERPFixCallout from './ERPFixCallout';
import { WorkflowStatus } from '../../types/workflow';

interface Props {
  exception: DetectedException | null;
  data: ARData;
  onSelectCustomer?: (id: string) => void;
}

export function ExceptionDetail({ exception, data, onSelectCustomer }: Props) {
  const { getWorkflow } = useDataStore();

  if (!exception) {
    return (
      <GlassCard padding={28} style={{ height: '100%' }}>
        <div className="center" style={{ height: '100%', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ color: 'var(--text-tertiary)' }}>Select an exception</h3>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 280, textAlign: 'center' }}>
            Pick a row on the left to see the underlying invoice, GL, and bank evidence,
            then triage it with the workflow controls.
          </p>
        </div>
      </GlassCard>
    );
  }

  const workflow = getWorkflow(exception.exception_id);
  const status: WorkflowStatus = workflow?.status ?? 'Open';
  const resolved = isResolved(status);

  return (
    <GlassCard
      padding={20}
      severity={resolved ? 'resolved' : exception.severity}
      style={{ paddingLeft: 24, maxHeight: 760, overflow: 'auto' }}
    >
      <header style={{ marginBottom: 12 }}>
        <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 8 }}>
          <SeverityBadge severity={exception.severity} />
          <CategoryBadge category={exception.category} />
          <StatusBadge status={status} />
          {workflow?.assignee && (
            <span
              className="glass-pill"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--text-secondary)',
                fontSize: 11,
              }}
            >
              {workflow.assignee}
            </span>
          )}
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {exception.exception_id}
          </span>
        </div>
        <div
          className="num"
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--text-primary)',
            textAlign: 'left',
            textDecoration: resolved ? 'line-through' : undefined,
            opacity: resolved ? 0.7 : 1,
          }}
        >
          {fmtMoney(exception.amount_impact)}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
          {exception.description}
        </div>
        <div className="row gap-3" style={{ marginTop: 10, fontSize: 12, color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
          <Meta
            label="Customer"
            value={exception.customer_id ?? '—'}
            mono
            onClick={exception.customer_id && onSelectCustomer ? () => onSelectCustomer(exception.customer_id!) : undefined}
          />
          <Meta label="Period" value={exception.period} />
          {exception.age_days != null && <Meta label="Age" value={`${exception.age_days}d`} />}
          <Meta label="Detected" value={fmtDateTime(exception.detected_at)} />
          {workflow?.resolved_at && <Meta label="Resolved" value={fmtDateTime(workflow.resolved_at)} />}
        </div>
      </header>

      <hr className="glass-divider" />

      <ERPFixCallout
        exception={exception}
        data={data}
        asOf={exception.period ? periodBounds(exception.period).end : new Date().toISOString().slice(0, 10)}
      />

      <hr className="glass-divider" />

      <ExceptionEvidenceTabs exception={exception} data={data} />

      <hr className="glass-divider" />

      <WorkflowControls exception={exception} workflow={workflow} />
    </GlassCard>
  );
}

function StatusBadge({ status }: { status: WorkflowStatus }) {
  const tone = {
    Open:        { bg: 'var(--severity-medium-bg)',   fg: 'var(--severity-medium)' },
    'In Review': { bg: 'var(--accent-soft)',          fg: 'var(--accent-hover)' },
    Resolved:    { bg: 'var(--severity-resolved-bg)', fg: 'var(--severity-resolved)' },
    "Won't Fix": { bg: 'var(--bg-elevated-2)',        fg: 'var(--text-tertiary)' },
  }[status];
  return (
    <span
      className="glass-pill"
      style={{
        background: tone.bg,
        color: tone.fg,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.06,
      }}
    >
      {status}
    </span>
  );
}

function Meta({
  label,
  value,
  mono,
  onClick,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onClick?: () => void;
}) {
  const interactive = !!onClick;
  return (
    <span>
      <span className="label" style={{ marginRight: 4 }}>{label}</span>
      <span
        onClick={onClick}
        className={mono ? 'mono' : undefined}
        style={{
          color: interactive ? 'var(--accent)' : 'var(--text-secondary)',
          textDecoration: interactive ? 'underline' : undefined,
          cursor: interactive ? 'pointer' : undefined,
        }}
        title={interactive ? 'Open customer drill-down' : undefined}
      >
        {value}
      </span>
    </span>
  );
}

export default ExceptionDetail;
