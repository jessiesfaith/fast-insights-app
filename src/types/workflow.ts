// Workflow state per exception (BUILD.md §10.3).
// Append-only audit_log captures every change with timestamp + actor + note.
// Workflows are keyed by deterministic exception_id, so the same dataset
// re-loaded will rejoin its previously-recorded triage state.

export const WORKFLOW_STATUSES = ['Open', 'In Review', 'Resolved', "Won't Fix"] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export type AuditAction =
  | 'created'
  | 'status_changed'
  | 'assigned'
  | 'unassigned'
  | 'commented';

export interface AuditLogEntry {
  timestamp: string;     // ISO datetime
  actor: string;
  action: AuditAction;
  note: string;
}

export interface ExceptionWorkflow {
  exception_id: string;
  status: WorkflowStatus;
  assignee: string | null;
  resolution_note: string;
  audit_log: AuditLogEntry[];
  created_at: string;
  resolved_at: string | null;
}

export function newWorkflow(exception_id: string, actor: string, now: string): ExceptionWorkflow {
  return {
    exception_id,
    status: 'Open',
    assignee: null,
    resolution_note: '',
    audit_log: [
      {
        timestamp: now,
        actor: actor || 'system',
        action: 'created',
        note: 'Exception detected.',
      },
    ],
    created_at: now,
    resolved_at: null,
  };
}

export function isResolved(status: WorkflowStatus): boolean {
  return status === 'Resolved' || status === "Won't Fix";
}
