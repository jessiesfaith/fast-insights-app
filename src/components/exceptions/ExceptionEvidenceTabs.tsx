// Backwards-compat wrapper for the right-pane evidence tabs (BUILD.md §10.2).
// EvidencePanel is the reusable engine; this picks the per-category default
// tab and forwards the exception's source records.

import { ARData } from '../../types/data';
import { DetectedException, ExceptionCategory } from '../../types/exception';
import EvidencePanel from './EvidencePanel';

interface Props {
  exception: DetectedException;
  data: ARData;
}

export function ExceptionEvidenceTabs({ exception, data }: Props) {
  return (
    <EvidencePanel
      sourceRecords={exception.source_records}
      data={data}
      defaultTab={defaultTabForCategory(exception.category)}
    />
  );
}

function defaultTabForCategory(c: ExceptionCategory): 'subledger' | 'gl' | 'bank' {
  switch (c) {
    case 'unapplied_cash':
    case 'short_pay':
    case 'unapplied_credit':
    case 'aged_unapplied':
      return 'subledger';
    case 'missing_gl_posting':
    case 'duplicate_gl_posting':
    case 'writeoff_desync':
      return 'gl';
    case 'cutoff_timing':
    case 'bank_only_item':
    case 'deposit_mismatch':
      return 'bank';
  }
}

export default ExceptionEvidenceTabs;
