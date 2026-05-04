// Audit pack types (BUILD.md §12).
// Preparer-facing tickmark letters (a)–(c) plus a separate Reviewer mark (d).
// Each clickable tickmark lives at (rowType, rowId, letter) so the same row
// can carry multiple tickmarks; each click is timestamped with the operator
// name (the "signer") so exports can show who signed off on what.

export const TICKMARK_LETTERS = ['a', 'b', 'c', 'd'] as const;
export type TickmarkLetter = (typeof TICKMARK_LETTERS)[number];

export const TICKMARK_LEGEND: Record<TickmarkLetter, string> = {
  a: 'Traced to bank statement',
  b: 'Traced to AR aging / cash / credit card',
  c: 'Traced to GL',
  d: 'Reviewer',
};

export const TICKMARK_LEGEND_TITLE = 'Preparer Tickmark Legend';

export type TickmarkRowType =
  | 'invoice'
  | 'receipt'
  | 'creditMemo'
  | 'glEntry'
  | 'bankStatement'
  | 'kpi'
  | 'recon'
  | 'bridge'
  | 'aging'
  | 'exception';

/** Storage key — the tickmarks store is `Record<TickmarkKey, TickmarkRecord>`. */
export type TickmarkKey = `${TickmarkRowType}:${string}:${TickmarkLetter}`;

export function tickmarkKey(type: TickmarkRowType, id: string, letter: TickmarkLetter): TickmarkKey {
  return `${type}:${id}:${letter}` as TickmarkKey;
}

/** Captured at click time; "who signed off on this tickmark and when." */
export interface TickmarkRecord {
  /** Operator name at click time, or "unknown" if no operator was set. */
  actor: string;
  /** ISO datetime of the click. */
  timestamp: string;
}

export type TickmarkMap = Record<TickmarkKey, TickmarkRecord>;

/**
 * Coerce legacy storage into the new shape.
 * Older snapshots (and older localStorage entries) carried `Record<key, true>`;
 * those become `{ actor: 'unknown', timestamp: '' }` so the UI keeps
 * showing the marks even though we don't know who clicked them.
 */
export function migrateTickmarks(raw: unknown): TickmarkMap {
  if (!raw || typeof raw !== 'object') return {} as TickmarkMap;
  const out: TickmarkMap = {} as TickmarkMap;
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (val === true) {
      out[key as TickmarkKey] = { actor: 'unknown', timestamp: '' };
    } else if (val && typeof val === 'object' && 'actor' in (val as object)) {
      const v = val as Partial<TickmarkRecord>;
      out[key as TickmarkKey] = {
        actor: typeof v.actor === 'string' ? v.actor : 'unknown',
        timestamp: typeof v.timestamp === 'string' ? v.timestamp : '',
      };
    }
  }
  return out;
}

export interface SignOffBlockState {
  entityName: string;
  preparerName: string;
  preparerDate: string;     // YYYY-MM-DD
  reviewerName: string;
  reviewerDate: string;     // YYYY-MM-DD
  comments: string;
}

export const EMPTY_SIGN_OFF: SignOffBlockState = {
  entityName: '',
  preparerName: '',
  preparerDate: '',
  reviewerName: '',
  reviewerDate: '',
  comments: '',
};

/**
 * Completeness-evidence metadata captured on the audit-pack cover. Helps the
 * reviewer sign off that the population was correctly extracted from the
 * source system. Most fields are preparer-edited; defaults are computed from
 * the loaded data.
 */
export interface CompletenessEvidence {
  reportName: string;                     // e.g., "AR Tool-Beta dashboard"
  reportId: string;                       // saved-search ID / report ID
  sourceSystem: string;                   // NetSuite / Oracle / SAP / Snowflake / etc.
  extractMethod: string;                  // Direct API extract / Scheduled export / Manual download
  serviceAccount: string;                 // read-only account name used for the extract
  runTimestamp: string;                   // ISO datetime; when the source pulled the data
  status: string;                         // Imported / Validated / Reconciled / Signed off
  notes: string;
  /**
   * Preparer-entered population numbers from the source-system run log. We
   * default these to the imported counts when blank; if the preparer enters
   * a value that doesn't match the imported count, the audit pack flags
   * the variance so the reviewer sees it.
   */
  preparerRecordCount: string;            // string so blank state is distinguishable from 0
  preparerControlTotal: string;
}

export const EMPTY_COMPLETENESS: CompletenessEvidence = {
  reportName: 'AR Tool-Beta dashboard',
  reportId: '',
  sourceSystem: '',
  extractMethod: 'Direct system / API extract',
  serviceAccount: '',
  runTimestamp: '',
  status: 'Imported',
  notes: '',
  preparerRecordCount: '',
  preparerControlTotal: '',
};

/**
 * Period-close record. Once closed, every editable surface for that period
 * (preparer ending balance, sign-off fields, tickmarks, completeness fields)
 * is disabled until an admin unlocks. The unlock action records the actor
 * and reason so the audit trail stays intact.
 */
export interface ClosedPeriodEntry {
  closedBy: string;
  closedAt: string;       // ISO datetime
  reason: string;
  unlockHistory: Array<{
    unlockedBy: string;
    unlockedAt: string;
    reason: string;
  }>;
}

/**
 * Operator role. "admin" can unlock closed periods; "user" cannot.
 * Admin-mode is a soft toggle — there's no auth in this local-only tool —
 * but the audit log still captures who took the action and when.
 */
export type UserRole = 'user' | 'admin';

/**
 * Snapshot captured the moment the preparer signs off. Subsequent imports
 * or scenario changes that move the dataset hashes mean "data changed
 * after sign-off" — the audit pack flags it so the reviewer re-checks.
 */
export interface SignoffSnapshot {
  /** Per-dataset FNV-1a hashes captured at sign-off. */
  hashes: Record<string, string>;
  /** ISO datetime the snapshot was captured. */
  capturedAt: string;
  /** Preparer name in the sign-off block at capture time. */
  signedBy: string;
  /** Subledger AR at capture (for headline drift display). */
  subledgerAR: number;
  /** Total exception count at capture. */
  exceptionCount: number;
}

/**
 * Bad-debt-reserve / allowance-for-doubtful-accounts entry, per period.
 * Three methods: a percentage of period sales, a percentage of period-end
 * AR, or a flat manual amount. The preparer fills in the parameters; the
 * computed reserve amount feeds the audit-pack memo and the Excel sheet.
 */
export type BadDebtMethod = 'pct_of_sales' | 'pct_of_ar' | 'manual';

export const BAD_DEBT_METHOD_LABEL: Record<BadDebtMethod, string> = {
  pct_of_sales: '% of period sales',
  pct_of_ar:    '% of period-end AR',
  manual:       'Manual amount',
};

/**
 * CECL memo (ASC 326 — Current Expected Credit Loss).
 *
 * One condensed audit-grade paragraph instead of four sub-sections — the
 * preparer fills in the methodology, the team uses the open comment box
 * for any period-specific narrative.
 */
export interface CECLMemo {
  /** Single condensed CECL methodology paragraph. */
  text: string;
}

export const EMPTY_CECL_MEMO: CECLMemo = {
  text: '',
};

/**
 * Default CECL memo for the loss-rate-on-sales approach. Drafted to satisfy
 * a Big-Four (EY-style) review of an ASC 326 estimate for short-duration
 * trade AR — references the standard's specific paragraphs, the rationale
 * for the model election, the historical look-back, the pool / segmentation
 * framework, the qualitative-factor categories, the reasonable-and-
 * supportable forecast horizon, and the reversion methodology, all in one
 * concise paragraph.
 *
 * The preparer should tune the specific numbers (look-back months, forecast
 * horizon, segment definitions) to the Company's actual policy.
 */
export const CECL_DEFAULT_TEMPLATE: CECLMemo = {
  text:
    'The Company estimates expected credit losses on trade accounts receivable in accordance with ASC 326-20 (CECL), using the loss-rate method applied to period sales. This approach is permitted under ASC 326-20-30-3 for short-duration trade receivables where the population is homogeneous, sufficient historical loss data is available, and customer mix, credit terms, and underwriting have remained directionally consistent. The reserve is computed as gross period sales × adjusted loss rate. The adjusted rate combines (i) a historical loss rate derived from the trailing twenty-four months of customer-level write-offs net of recoveries, segmented into pools where credit-risk profiles materially differ and reaggregated to a portfolio-weighted rate; (ii) qualitative adjustments per ASC 326-20-30-8 covering current conditions, Company-specific factors, forward-looking macroeconomic indicators, and data-quality limitations, each documented separately at every measurement date; and (iii) a reasonable-and-supportable forecast over a twelve-month horizon, after which the adjusted rate reverts on a straight-line basis over an additional twelve months to the historical mean per ASC 326-20-30-9. The resulting allowance is recorded as a contra-asset to GL 1290 — Allowance for Doubtful Accounts. Methodology, key inputs, Q-factors, and the reversion are reviewed each reporting period; sensitivity analysis and back-testing of prior estimates against subsequent actual losses are performed at least annually and documented in the model-validation working papers.',
};

export interface BadDebtReserveEntry {
  method: BadDebtMethod;
  /** Percentage as a fraction (0.025 = 2.5 %). Used by pct_of_sales / pct_of_ar. */
  percentage: number;
  /** Manual reserve amount, used only when method = 'manual'. */
  manualAmount: number;
  /** GL account number / name, e.g. "1290 — Allowance for Doubtful Accounts". */
  glAccount: string;
  /** Legacy free-text memo — retained for backward compatibility. */
  memo: string;
  /** CECL methodology — single condensed paragraph (ASC 326). */
  cecl: CECLMemo;
  /** Open comment box shared by preparer and reviewer for this period's reserve. */
  comments: string;
  /** Captured at last edit. */
  enteredBy: string;
  enteredAt: string;
}

export const EMPTY_BAD_DEBT_RESERVE: BadDebtReserveEntry = {
  method: 'pct_of_sales',
  percentage: 0,
  manualAmount: 0,
  glAccount: '1290 — Allowance for Doubtful Accounts',
  memo: '',
  cecl: { ...EMPTY_CECL_MEMO },
  comments: '',
  enteredBy: '',
  enteredAt: '',
};

/**
 * Coerce older persisted shapes (which had the four-section CECL object) to
 * the current single-paragraph form. Old fields are concatenated so no
 * preparer narrative is lost on first load after the upgrade.
 */
export function migrateCECLMemo(raw: unknown): CECLMemo {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_CECL_MEMO };
  const obj = raw as Record<string, unknown>;
  if (typeof obj.text === 'string') return { text: obj.text };
  // legacy shape: methodology / historicalBasis / qualitativeFactors / forecastReversion
  const parts = [
    obj.methodology,
    obj.historicalBasis,
    obj.qualitativeFactors,
    obj.forecastReversion,
  ]
    .filter((p): p is string => typeof p === 'string' && p.trim() !== '')
    .map((p) => p.trim());
  return { text: parts.join('\n\n') };
}
