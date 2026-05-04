// Exception types for the detection engine (BUILD.md §5).
// Detection logic is structural — every rule must work after the `notes`
// column is stripped (acceptance §16 #2).

import { SourceRef } from './recon';

export type ExceptionCategory =
  | 'unapplied_cash'
  | 'short_pay'
  | 'unapplied_credit'
  | 'missing_gl_posting'
  | 'duplicate_gl_posting'
  | 'writeoff_desync'
  | 'cutoff_timing'
  | 'bank_only_item'
  | 'deposit_mismatch'
  | 'aged_unapplied';

export type Severity = 'high' | 'medium' | 'low';

export const CATEGORY_LABEL: Record<ExceptionCategory, string> = {
  unapplied_cash:        'Unapplied cash',
  short_pay:             'Short pay',
  unapplied_credit:      'Unapplied credit memo',
  missing_gl_posting:    'Missing GL posting',
  duplicate_gl_posting:  'Duplicate GL posting',
  writeoff_desync:       'Write-off desync',
  cutoff_timing:         'Cutoff timing',
  bank_only_item:        'Bank-only item',
  deposit_mismatch:      'Deposit total mismatch',
  aged_unapplied:        'Aged unapplied',
};

export const CATEGORY_SEVERITY: Record<ExceptionCategory, Severity> = {
  unapplied_cash:        'high',
  short_pay:             'medium',
  unapplied_credit:      'medium',
  missing_gl_posting:    'high',
  duplicate_gl_posting:  'high',
  writeoff_desync:       'medium',
  cutoff_timing:         'low',
  bank_only_item:        'high',
  deposit_mismatch:      'high',
  aged_unapplied:        'medium',
};

export interface DetectedException {
  exception_id: string;       // deterministic from (category, sorted source ids, period)
  category: ExceptionCategory;
  severity: Severity;
  period: string;
  customer_id: string | null;
  amount_impact: number;      // signed $ impact on AR
  source_records: SourceRef[];
  description: string;
  detected_at: string;        // ISO datetime
  age_days: number | null;    // days between detection date and the source record
}

export interface DetectionResult {
  exceptions: DetectedException[];
  /** counts and totals per category — useful for the dashboard summary */
  byCategory: { category: ExceptionCategory; count: number; impact: number }[];
  detectedAt: string;
}
