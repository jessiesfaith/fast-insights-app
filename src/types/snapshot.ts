// JSON snapshot — the canonical archival artifact for an AR close (BUILD.md §12).
//
// Embeds: the loaded ARData, import summaries, workflow + audit log, tickmarks,
// sign-off, current scenario, theme preference, plus a per-dataset hash so a
// re-import can detect tampering.

import { ARData, DatasetKey, ImportSummary } from './data';
import { ExceptionWorkflow } from './workflow';
import { ExceptionCategory } from './exception';
import {
  BadDebtReserveEntry,
  CompletenessEvidence,
  TickmarkMap,
  SignOffBlockState,
  SignoffSnapshot,
} from './audit';
import { ScenarioState } from './scenario';

export const SNAPSHOT_SCHEMA_VERSION = 1;

export type DatasetHashes = Partial<Record<DatasetKey, string>>;

export interface SnapshotV1 {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  metadata: {
    tool: 'AR Tool-Beta';
    toolVersion: string;
    entityName: string;
    period: string;
    generatedAt: string;        // ISO datetime
    generatedBy: string | null;
    rowCounts: Partial<Record<DatasetKey, number>>;
  };
  hashes: DatasetHashes;
  data: ARData;
  summaries: ImportSummary[];
  operator: string | null;
  workflows: Record<string, ExceptionWorkflow>;
  tickmarks: TickmarkMap;
  signOff: SignOffBlockState;
  /** Per-period preparer-entered AR Bridge ending balances (added v1.1). */
  bridgeBalances?: Record<string, { amount: number; actor: string; timestamp: string }>;
  /** Source-system completeness evidence (added v1.2). */
  completenessEvidence?: CompletenessEvidence;
  /** Per-period bad-debt-reserve entries (added v1.3). */
  badDebtReserves?: Record<string, BadDebtReserveEntry>;
  /** Per-period sign-off baseline snapshots for change-after-sign-off detection (added v1.4). */
  signoffSnapshots?: Record<string, SignoffSnapshot>;
  scenario: ScenarioState;
  detection: {
    detectedAt: string;
    totalCount: number;
    totalImpact: number;
    byCategory: { category: ExceptionCategory; count: number; impact: number }[];
  };
  themePreference: 'light' | 'dark' | null;
}
