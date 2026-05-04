// Type shapes returned by the three-way reconciliation and AR Bridge engines.
// All math lives in src/lib/recon.ts; UI components consume these results.

export type SourceRefType = 'invoice' | 'receipt' | 'creditMemo' | 'glEntry' | 'bankStatement';

export interface SourceRef {
  type: SourceRefType;
  id: string;
}

// One reconciling line within a variance walk.
// Sign convention: a positive amount means "this item makes the LEFT side
// (Subledger / GL) higher than the RIGHT side (GL / Bank)."  The walk math is
// symmetric — UI renders the sign next to a clear label like "in-transit cash".
export interface VarianceLine {
  id: string;
  label: string;
  amount: number;
  description: string;
  source_records: SourceRef[];
}

export interface ReconBalance {
  label: string;
  amount: number;
  count: number;
  asOf: string;       // ISODate
  source: SourceRef[];
}

export interface ThreeWayResult {
  period: { start: string; end: string; key: string };
  subledgerAR: ReconBalance;
  gl1200: ReconBalance;
  bankCleared: ReconBalance;
  subledgerVsGL: { variance: number; items: VarianceLine[] };
  glVsBank: { variance: number; items: VarianceLine[] };
}

export interface ARBridgeResult {
  period: { start: string; end: string; key: string };
  beginningAR: number;
  billings: number;
  cashApplied: number;
  creditsApplied: number;
  writeOffs: number;
  adjustments: number;
  endingARComputed: number;     // = beg + bill − cash − credits − writeoffs ± adj
  endingARSubledger: number;    // independent recompute from invoices @ period_end
  variance: number;             // computed − subledger
  ties: boolean;                // |variance| < $0.01
}
