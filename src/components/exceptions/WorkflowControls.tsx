// Workflow controls for the right pane (BUILD.md §10.2).
// Status pill row, assignee input ("Assign to me" shortcut), comment composer.
// All edits append to the exception's audit_log via the data store.

import { useState } from 'react';
import { Send, UserPlus } from 'lucide-react';
import { DetectedException } from '../../types/exception';
import {
  ExceptionWorkflow,
  WORKFLOW_STATUSES,
  WorkflowStatus,
  isResolved,
} from '../../types/workflow';
import { useDataStore } from '../../lib/dataStore';
import { STATUS_TONE } from '../../lib/uiColors';
import AuditLog from './AuditLog';

interface Props {
  exception: DetectedException;
  workflow: ExceptionWorkflow | undefined;
}

export function WorkflowControls({ exception, workflow }: Props) {
  const { operator, setExceptionStatus, setExceptionAssignee, addExceptionComment } = useDataStore();
  const [resolutionNote, setResolutionNote] = useState('');
  const [comment, setComment] = useState('');
  const [assigneeDraft, setAssigneeDraft] = useState(workflow?.assignee ?? '');

  const status: WorkflowStatus = workflow?.status ?? 'Open';
  const assignee = workflow?.assignee ?? null;

  const handleStatus = (next: WorkflowStatus) => {
    if (next === status) return;
    const note = isResolved(next) ? resolutionNote.trim() : '';
    setExceptionStatus(exception.exception_id, next, note);
    if (isResolved(next)) setResolutionNote('');
  };

  const handleAssign = (value: string | null) => {
    setExceptionAssignee(exception.exception_id, value);
    setAssigneeDraft(value ?? '');
  };

  const handleComment = () => {
    const trimmed = comment.trim();
    if (!trimmed) return;
    addExceptionComment(exception.exception_id, trimmed);
    setComment('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div className="label" style={{ marginBottom: 6 }}>Status</div>
        <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
          {WORKFLOW_STATUSES.map((s) => {
            const active = status === s;
            const tone = STATUS_TONE[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => handleStatus(s)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: `1px solid ${active ? tone.fg : 'var(--border)'}`,
                  background: active ? tone.bg : 'transparent',
                  color: active ? tone.fg : 'var(--text-tertiary)',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
        {!isResolved(status) && (
          <input
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            placeholder="Optional: resolution note (will attach when you mark Resolved / Won't Fix)"
            style={{
              marginTop: 8,
              width: '100%',
              padding: '8px 10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          />
        )}
        {workflow?.resolution_note && isResolved(status) && (
          <div
            style={{
              marginTop: 8,
              padding: '8px 10px',
              background: 'var(--severity-resolved-bg)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-primary)',
            }}
          >
            <span className="label" style={{ marginRight: 6 }}>Resolution</span>
            {workflow.resolution_note}
          </div>
        )}
      </div>

      <div>
        <div className="label" style={{ marginBottom: 6 }}>Assignee</div>
        <div className="row gap-2" style={{ alignItems: 'center' }}>
          <input
            value={assigneeDraft}
            onChange={(e) => setAssigneeDraft(e.target.value)}
            onBlur={() => handleAssign(assigneeDraft.trim() || null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAssign(assigneeDraft.trim() || null);
              }
            }}
            placeholder="Free text — anyone, by name"
            style={{
              flex: 1,
              padding: '8px 10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          />
          {operator && operator !== assignee && (
            <button
              type="button"
              onClick={() => handleAssign(operator)}
              className="row gap-1"
              style={{
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <UserPlus size={12} /> Assign to me
            </button>
          )}
          {assignee && (
            <button
              type="button"
              onClick={() => handleAssign(null)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-tertiary)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div>
        <div className="label" style={{ marginBottom: 6 }}>Comment</div>
        <div className="row gap-2" style={{ alignItems: 'flex-end' }}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleComment();
              }
            }}
            rows={2}
            placeholder="Add a note. Cmd/Ctrl + Enter to submit."
            style={{
              flex: 1,
              padding: '8px 10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontFamily: 'inherit',
              resize: 'vertical',
              minHeight: 50,
            }}
          />
          <button
            type="button"
            onClick={handleComment}
            disabled={!comment.trim()}
            className="row gap-2"
            style={{
              alignItems: 'center',
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--accent)',
              background: comment.trim() ? 'var(--accent)' : 'var(--accent-soft)',
              color: comment.trim() ? 'var(--accent-contrast)' : 'var(--accent)',
              fontSize: 12,
              fontWeight: 600,
              cursor: comment.trim() ? 'pointer' : 'not-allowed',
              opacity: comment.trim() ? 1 : 0.7,
            }}
          >
            <Send size={12} /> Post
          </button>
        </div>
      </div>

      <div>
        <div className="label" style={{ marginBottom: 6 }}>Audit log</div>
        <AuditLog entries={workflow?.audit_log ?? []} />
      </div>
    </div>
  );
}

export default WorkflowControls;
