// Pure workflow state transitions. Each action returns a new workflow value
// with an audit_log entry appended — never mutates in place.
//
// Tested independently of React so the audit-log invariants are easy to lock
// down. The dataStore drives these; UI components do not.

import {
  AuditLogEntry,
  ExceptionWorkflow,
  WorkflowStatus,
  isResolved,
  newWorkflow,
} from '../types/workflow';

function append(wf: ExceptionWorkflow, entry: AuditLogEntry): ExceptionWorkflow {
  return { ...wf, audit_log: [...wf.audit_log, entry] };
}

export function ensureWorkflow(
  existing: ExceptionWorkflow | undefined,
  exception_id: string,
  actor: string,
  now: string,
): ExceptionWorkflow {
  return existing ?? newWorkflow(exception_id, actor, now);
}

export function applyStatus(
  wf: ExceptionWorkflow,
  next: WorkflowStatus,
  actor: string,
  note: string,
  now: string,
): ExceptionWorkflow {
  if (wf.status === next) return wf;
  const updated = append(wf, {
    timestamp: now,
    actor: actor || 'system',
    action: 'status_changed',
    note: `${wf.status} → ${next}${note ? ` — ${note}` : ''}`,
  });
  const becomingResolved = !isResolved(wf.status) && isResolved(next);
  const becomingUnresolved = isResolved(wf.status) && !isResolved(next);
  return {
    ...updated,
    status: next,
    resolution_note: isResolved(next) && note ? note : updated.resolution_note,
    resolved_at: becomingResolved ? now : becomingUnresolved ? null : updated.resolved_at,
  };
}

export function applyAssignee(
  wf: ExceptionWorkflow,
  next: string | null,
  actor: string,
  now: string,
): ExceptionWorkflow {
  const cur = wf.assignee ?? null;
  if (cur === next) return wf;
  const action: AuditLogEntry = next == null
    ? { timestamp: now, actor: actor || 'system', action: 'unassigned', note: cur ? `unassigned ${cur}` : 'unassigned' }
    : { timestamp: now, actor: actor || 'system', action: 'assigned', note: `assigned to ${next}` };
  return { ...append(wf, action), assignee: next };
}

export function applyComment(
  wf: ExceptionWorkflow,
  note: string,
  actor: string,
  now: string,
): ExceptionWorkflow {
  const trimmed = note.trim();
  if (!trimmed) return wf;
  return append(wf, {
    timestamp: now,
    actor: actor || 'system',
    action: 'commented',
    note: trimmed,
  });
}

// re-export so tests/UI have a single import surface
export { newWorkflow, isResolved };
