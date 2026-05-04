// Workflow state-transition tests. The pure functions own the audit-log
// invariants — every state change appends an entry, status transitions update
// resolved_at, comments don't mutate prior entries.

import { describe, expect, it } from 'vitest';
import {
  applyAssignee,
  applyComment,
  applyStatus,
  ensureWorkflow,
} from '../lib/workflow';
import { newWorkflow } from '../types/workflow';

const NOW = '2026-04-15T12:00:00.000Z';
const LATER = '2026-04-15T12:30:00.000Z';

describe('newWorkflow', () => {
  it('starts in Open status with one created audit entry', () => {
    const wf = newWorkflow('exc-123', 'Alice', NOW);
    expect(wf.status).toBe('Open');
    expect(wf.assignee).toBeNull();
    expect(wf.audit_log).toHaveLength(1);
    expect(wf.audit_log[0].action).toBe('created');
    expect(wf.audit_log[0].actor).toBe('Alice');
    expect(wf.resolved_at).toBeNull();
  });
});

describe('ensureWorkflow', () => {
  it('returns the existing workflow when one is already present', () => {
    const existing = newWorkflow('exc-1', 'Alice', NOW);
    const out = ensureWorkflow(existing, 'exc-1', 'Bob', LATER);
    expect(out).toBe(existing);
  });

  it('creates a new workflow when none exists', () => {
    const out = ensureWorkflow(undefined, 'exc-1', 'Alice', NOW);
    expect(out.exception_id).toBe('exc-1');
    expect(out.audit_log).toHaveLength(1);
  });
});

describe('applyStatus', () => {
  it('appends an audit entry on every status change', () => {
    const wf = newWorkflow('exc-1', 'Alice', NOW);
    const next = applyStatus(wf, 'In Review', 'Alice', '', LATER);
    expect(next.status).toBe('In Review');
    expect(next.audit_log).toHaveLength(2);
    expect(next.audit_log[1].action).toBe('status_changed');
    expect(next.audit_log[1].note).toBe('Open → In Review');
    expect(next.audit_log[1].timestamp).toBe(LATER);
  });

  it('records resolution_note and resolved_at when moving to Resolved', () => {
    const wf = newWorkflow('exc-1', 'Alice', NOW);
    const next = applyStatus(wf, 'Resolved', 'Alice', 'Cash applied to INV-99', LATER);
    expect(next.status).toBe('Resolved');
    expect(next.resolution_note).toBe('Cash applied to INV-99');
    expect(next.resolved_at).toBe(LATER);
    expect(next.audit_log[1].note).toContain('Resolved');
    expect(next.audit_log[1].note).toContain('Cash applied to INV-99');
  });

  it('clears resolved_at when re-opening', () => {
    let wf = newWorkflow('exc-1', 'Alice', NOW);
    wf = applyStatus(wf, 'Resolved', 'Alice', 'fixed', LATER);
    expect(wf.resolved_at).toBe(LATER);
    wf = applyStatus(wf, 'In Review', 'Alice', '', '2026-04-16T00:00:00.000Z');
    expect(wf.resolved_at).toBeNull();
  });

  it('is a no-op when transitioning to the same status', () => {
    const wf = newWorkflow('exc-1', 'Alice', NOW);
    const next = applyStatus(wf, 'Open', 'Alice', '', LATER);
    expect(next).toBe(wf);
  });
});

describe('applyAssignee', () => {
  it('records assignment with note', () => {
    const wf = newWorkflow('exc-1', 'Alice', NOW);
    const next = applyAssignee(wf, 'Bob', 'Alice', LATER);
    expect(next.assignee).toBe('Bob');
    expect(next.audit_log[1].action).toBe('assigned');
    expect(next.audit_log[1].note).toBe('assigned to Bob');
  });

  it('records unassignment when set to null', () => {
    let wf = newWorkflow('exc-1', 'Alice', NOW);
    wf = applyAssignee(wf, 'Bob', 'Alice', LATER);
    wf = applyAssignee(wf, null, 'Alice', '2026-04-16T00:00:00.000Z');
    expect(wf.assignee).toBeNull();
    expect(wf.audit_log[2].action).toBe('unassigned');
    expect(wf.audit_log[2].note).toContain('Bob');
  });

  it('is a no-op when assigning to current value', () => {
    let wf = newWorkflow('exc-1', 'Alice', NOW);
    wf = applyAssignee(wf, 'Bob', 'Alice', LATER);
    const same = applyAssignee(wf, 'Bob', 'Alice', '2026-04-16T00:00:00.000Z');
    expect(same).toBe(wf);
  });
});

describe('applyComment', () => {
  it('appends a commented audit entry with trimmed note', () => {
    const wf = newWorkflow('exc-1', 'Alice', NOW);
    const next = applyComment(wf, '   spoke to customer  ', 'Alice', LATER);
    expect(next.audit_log).toHaveLength(2);
    expect(next.audit_log[1].action).toBe('commented');
    expect(next.audit_log[1].note).toBe('spoke to customer');
  });

  it('ignores empty / whitespace-only comments', () => {
    const wf = newWorkflow('exc-1', 'Alice', NOW);
    const a = applyComment(wf, '', 'Alice', LATER);
    const b = applyComment(wf, '   ', 'Alice', LATER);
    expect(a).toBe(wf);
    expect(b).toBe(wf);
  });
});

describe('audit log immutability', () => {
  it('never mutates earlier audit entries through chained transitions', () => {
    let wf = newWorkflow('exc-1', 'Alice', NOW);
    const created = wf.audit_log[0];
    wf = applyAssignee(wf, 'Bob', 'Alice', LATER);
    wf = applyComment(wf, 'first comment', 'Bob', LATER);
    wf = applyStatus(wf, 'In Review', 'Bob', '', LATER);
    wf = applyStatus(wf, 'Resolved', 'Bob', 'paid', LATER);
    expect(wf.audit_log[0]).toEqual(created);
    expect(wf.audit_log).toHaveLength(5);
    expect(wf.audit_log.map((e) => e.action)).toEqual([
      'created', 'assigned', 'commented', 'status_changed', 'status_changed',
    ]);
  });
});
