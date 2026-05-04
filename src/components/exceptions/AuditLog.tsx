// Append-only audit log display (BUILD.md §10.3).
// One entry per status change, assignment, or comment. Newest at top.

import { CheckCircle2, MessageSquare, UserPlus, UserMinus, Sparkles, ArrowRightCircle } from 'lucide-react';
import { AuditAction, AuditLogEntry } from '../../types/workflow';
import { fmtDateTime } from '../../lib/format';

const ICON: Record<AuditAction, React.ReactNode> = {
  created:        <Sparkles size={12} />,
  status_changed: <ArrowRightCircle size={12} />,
  assigned:       <UserPlus size={12} />,
  unassigned:     <UserMinus size={12} />,
  commented:      <MessageSquare size={12} />,
};

const ACTION_LABEL: Record<AuditAction, string> = {
  created:        'Created',
  status_changed: 'Status',
  assigned:       'Assigned',
  unassigned:     'Unassigned',
  commented:      'Comment',
};

interface Props {
  entries: AuditLogEntry[];
}

export function AuditLog({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div style={{ padding: 12, fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
        No audit entries yet.
      </div>
    );
  }
  // newest first
  const ordered = [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {ordered.map((e, i) => (
        <li
          key={`${e.timestamp}-${i}`}
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 10,
            padding: '8px 12px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
        >
          <span
            className="center"
            style={{
              width: 22, height: 22, borderRadius: 999,
              background: e.action === 'commented' ? 'var(--accent-soft)' : 'var(--severity-resolved-bg)',
              color: e.action === 'commented' ? 'var(--accent)' : 'var(--severity-resolved)',
              alignSelf: 'flex-start', marginTop: 2,
            }}
            title={ACTION_LABEL[e.action]}
          >
            {ICON[e.action] ?? <CheckCircle2 size={12} />}
          </span>
          <div>
            <div className="row gap-2" style={{ alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{e.actor}</span>
              <span className="label" style={{ marginRight: 4 }}>{ACTION_LABEL[e.action]}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{fmtDateTime(e.timestamp)}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2, whiteSpace: 'pre-wrap' }}>{e.note}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default AuditLog;
