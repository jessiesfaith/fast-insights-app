// Shared presentation maps for the UI layer: aging-bucket colors and
// workflow-status tones, plus the CSS-variable resolver charts need.
//
// These were previously copy-pasted across several components; keeping one
// copy here means a palette change lands everywhere at once.

import { AgingBucket } from '../types/kpi';
import { WorkflowStatus } from '../types/workflow';

/** Aging bucket → CSS color variable. */
export const BUCKET_COLOR: Record<AgingBucket, string> = {
  Current: 'var(--severity-resolved)',
  '1-30':  'var(--severity-low)',
  '31-60': 'var(--accent)',
  '61-90': 'var(--severity-medium)',
  '90+':   'var(--severity-high)',
};

/** Workflow status → background / foreground color pair for status pills. */
export const STATUS_TONE: Record<WorkflowStatus, { bg: string; fg: string }> = {
  Open:        { bg: 'var(--severity-medium-bg)',   fg: 'var(--severity-medium)' },
  'In Review': { bg: 'var(--accent-soft)',          fg: 'var(--accent-hover)' },
  Resolved:    { bg: 'var(--severity-resolved-bg)', fg: 'var(--severity-resolved)' },
  "Won't Fix": { bg: 'var(--bg-elevated-2)',        fg: 'var(--text-tertiary)' },
};

// Recharts needs concrete color values, not CSS vars. Resolve at render time.
export function resolveCSSVar(varExpr: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') return '#00c805';
  const m = varExpr.match(/var\((--[^)]+)\)/);
  if (!m) return varExpr;
  const value = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim();
  return value || '#00c805';
}
