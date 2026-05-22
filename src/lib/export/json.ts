// JSON snapshot export + import (BUILD.md §12).
//
// File-name convention: `ar-tool-beta-snapshot_{entity}_{period}_{ISO}.json`.
// The snapshot includes per-dataset FNV-1a hashes so a future re-import can
// flag tampering without needing a backend signature service.

import { ARData, DatasetKey } from '../../types/data';
import {
  DatasetHashes,
  SNAPSHOT_SCHEMA_VERSION,
  SnapshotV1,
} from '../../types/snapshot';
import { runDetection } from '../detect';
import { fnv1aHex } from '../hash';
import { fileTimestamp, slugForFileName } from '../format';

export const TOOL_VERSION = '0.1.0';

// ---- hashing -------------------------------------------------------------

// Re-exported so existing importers (and tests) keep working unchanged.
export { fnv1aHex };

export function hashDataset(rows: unknown[]): string {
  return fnv1aHex(JSON.stringify(rows));
}

export function buildDatasetHashes(data: ARData): DatasetHashes {
  return {
    invoices:       hashDataset(data.invoices),
    receipts:       hashDataset(data.receipts),
    creditMemos:    hashDataset(data.creditMemos),
    glEntries:      hashDataset(data.glEntries),
    bankStatements: hashDataset(data.bankStatements),
    customers:      hashDataset(data.customers),
  };
}

export function rowCountsOf(data: ARData): Partial<Record<DatasetKey, number>> {
  return {
    invoices:       data.invoices.length,
    receipts:       data.receipts.length,
    creditMemos:    data.creditMemos.length,
    glEntries:      data.glEntries.length,
    bankStatements: data.bankStatements.length,
    customers:      data.customers.length,
  };
}

// ---- build ---------------------------------------------------------------

export interface SnapshotInput {
  data: ARData;
  summaries: SnapshotV1['summaries'];
  operator: string | null;
  workflows: SnapshotV1['workflows'];
  tickmarks: SnapshotV1['tickmarks'];
  signOff: SnapshotV1['signOff'];
  scenario: SnapshotV1['scenario'];
  themePreference: 'light' | 'dark' | null;
  period: string;
  generatedAt?: string;
  bridgeBalances?: SnapshotV1['bridgeBalances'];
  completenessEvidence?: SnapshotV1['completenessEvidence'];
  badDebtReserves?: SnapshotV1['badDebtReserves'];
  signoffSnapshots?: SnapshotV1['signoffSnapshots'];
}

export function buildSnapshot(input: SnapshotInput): SnapshotV1 {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const detection = runDetection(input.data, generatedAt);
  const totalImpact = detection.exceptions.reduce((s, e) => s + Math.abs(e.amount_impact), 0);

  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    metadata: {
      tool: 'AR Tool-Beta',
      toolVersion: TOOL_VERSION,
      entityName: input.signOff.entityName,
      period: input.period,
      generatedAt,
      generatedBy: input.operator,
      rowCounts: rowCountsOf(input.data),
    },
    hashes: buildDatasetHashes(input.data),
    data: input.data,
    summaries: input.summaries,
    operator: input.operator,
    workflows: input.workflows,
    tickmarks: input.tickmarks,
    signOff: input.signOff,
    scenario: input.scenario,
    detection: {
      detectedAt: detection.detectedAt,
      totalCount: detection.exceptions.length,
      totalImpact,
      byCategory: detection.byCategory,
    },
    themePreference: input.themePreference,
    bridgeBalances: input.bridgeBalances,
    completenessEvidence: input.completenessEvidence,
    badDebtReserves: input.badDebtReserves,
    signoffSnapshots: input.signoffSnapshots,
  };
}

// ---- file IO -------------------------------------------------------------

export function snapshotFileName(entity: string, period: string, generatedAt: string): string {
  const ts = fileTimestamp(generatedAt); // YYYY-MM-DDTHH-MM-SS
  return `ar-tool-beta-snapshot_${slugForFileName(entity || 'entity')}_${slugForFileName(period || 'period')}_${ts}.json`;
}

export function downloadSnapshot(snapshot: SnapshotV1): string {
  const text = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const fileName = snapshotFileName(snapshot.metadata.entityName, snapshot.metadata.period, snapshot.metadata.generatedAt);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 0);
  return fileName;
}

export interface SnapshotImportResult {
  snapshot: SnapshotV1;
  hashWarnings: string[];
}

/**
 * Parse + validate a JSON snapshot. Throws on malformed input. Hash mismatches
 * become non-fatal warnings (a re-import where someone hand-edited the embedded
 * data would still be loadable, but flagged).
 */
export async function importSnapshot(file: File): Promise<SnapshotImportResult> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON: ${err instanceof Error ? err.message : 'parse failed'}`);
  }
  return validateSnapshot(parsed);
}

export function validateSnapshot(raw: unknown): SnapshotImportResult {
  if (!raw || typeof raw !== 'object') throw new Error('snapshot is not an object');
  const snap = raw as Partial<SnapshotV1>;
  if (snap.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) {
    throw new Error(`unsupported schemaVersion ${snap.schemaVersion} (expected ${SNAPSHOT_SCHEMA_VERSION})`);
  }
  if (snap.metadata?.tool !== 'AR Tool-Beta') {
    throw new Error(`tool mismatch: ${snap.metadata?.tool ?? 'unknown'}`);
  }
  if (!snap.data) throw new Error('missing data');

  // verify hashes — non-fatal so a hand-edited file still imports with a warning
  const recomputed = buildDatasetHashes(snap.data as ARData);
  const hashWarnings: string[] = [];
  if (snap.hashes) {
    for (const key of Object.keys(recomputed) as DatasetKey[]) {
      const stored = snap.hashes[key];
      const live = recomputed[key];
      if (stored && live && stored !== live) {
        hashWarnings.push(`${key}: stored hash ${stored} ≠ recomputed ${live} (data may have been edited)`);
      }
    }
  }

  return {
    snapshot: snap as SnapshotV1,
    hashWarnings,
  };
}
