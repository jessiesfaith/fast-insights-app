// React context that owns the parsed AR datasets, import summaries, the
// operator-name field used as the actor on workflow audit logs, and the
// per-exception workflow state (status, assignee, comments, audit log).
//
// Everything is persisted to a single localStorage entry so a refresh
// preserves both the data and the in-flight triage work.

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ARData, EMPTY_DATA, ImportSummary } from '../types/data';
import { ExceptionWorkflow, WorkflowStatus } from '../types/workflow';
import { applyAssignee, applyComment, applyStatus, ensureWorkflow } from './workflow';
import {
  BadDebtReserveEntry,
  ClosedPeriodEntry,
  CompletenessEvidence,
  EMPTY_BAD_DEBT_RESERVE,
  EMPTY_COMPLETENESS,
  EMPTY_SIGN_OFF,
  SignOffBlockState,
  SignoffSnapshot,
  TickmarkLetter,
  TickmarkMap,
  TickmarkRecord,
  TickmarkRowType,
  UserRole,
  migrateTickmarks,
  tickmarkKey,
} from '../types/audit';
import { SnapshotV1 } from '../types/snapshot';

const STORAGE_KEY = 'ar-tool-beta:dataStore:v1';

/**
 * AR Bridge preparer-entered ending balance, per period. Stamped with the
 * operator name and timestamp at entry so the audit pack can show "who
 * signed off" — and we can lock the preparer sign-off until variance == 0.
 */
export interface BridgeBalanceEntry {
  amount: number;
  actor: string;
  timestamp: string;
}

interface PersistedState {
  data: ARData;
  summaries: ImportSummary[];
  operator: string | null;
  loadedAt: string | null;
  workflows: Record<string, ExceptionWorkflow>;
  tickmarks: TickmarkMap;
  signOff: SignOffBlockState;
  /** Preparer-entered AR Bridge ending balances, keyed by YYYY-MM. */
  bridgeBalances: Record<string, BridgeBalanceEntry>;
  /** Source-system completeness evidence captured on the audit-pack cover. */
  completenessEvidence: CompletenessEvidence;
  /** Per-period close records — keyed by YYYY-MM. */
  closedPeriods: Record<string, ClosedPeriodEntry>;
  /** Soft user role. Admin can unlock a closed period. */
  userRole: UserRole;
  /** Per-period bad-debt-reserve entries — keyed by YYYY-MM. */
  badDebtReserves: Record<string, BadDebtReserveEntry>;
  /** Per-period sign-off snapshots — captured the first time the preparer signs. */
  signoffSnapshots: Record<string, SignoffSnapshot>;
}

interface DataStoreValue extends PersistedState {
  hasData: boolean;
  setData: (data: ARData, summaries: ImportSummary[]) => void;
  clearData: () => void;
  setOperator: (name: string) => void;
  // workflow API — operates on the workflows map by exception_id
  setExceptionStatus: (exceptionId: string, status: WorkflowStatus, note?: string) => void;
  setExceptionAssignee: (exceptionId: string, assignee: string | null) => void;
  addExceptionComment: (exceptionId: string, note: string) => void;
  getWorkflow: (exceptionId: string) => ExceptionWorkflow | undefined;
  // audit-pack API — tickmarks + sign-off
  toggleTickmark: (type: TickmarkRowType, id: string, letter: TickmarkLetter) => void;
  hasTickmark: (type: TickmarkRowType, id: string, letter: TickmarkLetter) => boolean;
  getTickmark: (type: TickmarkRowType, id: string, letter: TickmarkLetter) => TickmarkRecord | undefined;
  getRowTickmarks: (type: TickmarkRowType, id: string) => TickmarkLetter[];
  setSignOffField: <K extends keyof SignOffBlockState>(field: K, value: SignOffBlockState[K]) => void;
  // bridge preparer-entered ending balance API
  setBridgeBalance: (period: string, amount: number | null) => void;
  getBridgeBalance: (period: string) => BridgeBalanceEntry | undefined;
  // completeness evidence
  setCompletenessField: <K extends keyof CompletenessEvidence>(field: K, value: CompletenessEvidence[K]) => void;
  // period close / role
  setUserRole: (role: UserRole) => void;
  isPeriodClosed: (period: string) => boolean;
  getClosedPeriodEntry: (period: string) => ClosedPeriodEntry | undefined;
  closePeriod: (period: string, reason?: string) => void;
  unlockPeriod: (period: string, reason?: string) => void;
  // bad debt reserve
  getBadDebtReserve: (period: string) => BadDebtReserveEntry | undefined;
  setBadDebtReserve: (period: string, patch: Partial<BadDebtReserveEntry>) => void;
  // sign-off snapshots (change-after-sign-off detection)
  getSignoffSnapshot: (period: string) => SignoffSnapshot | undefined;
  captureSignoffSnapshot: (period: string, snap: SignoffSnapshot) => void;
  // snapshot import — restore a JSON snapshot wholesale
  loadSnapshot: (snapshot: SnapshotV1) => void;
}

const DataStoreContext = createContext<DataStoreValue | null>(null);

function emptyState(): PersistedState {
  return {
    data: EMPTY_DATA,
    summaries: [],
    operator: null,
    loadedAt: null,
    workflows: {},
    tickmarks: {} as TickmarkMap,
    signOff: { ...EMPTY_SIGN_OFF },
    bridgeBalances: {},
    completenessEvidence: { ...EMPTY_COMPLETENESS },
    closedPeriods: {},
    userRole: 'user',
    badDebtReserves: {},
    signoffSnapshots: {},
  };
}

function readPersisted(): PersistedState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      data: parsed.data ?? EMPTY_DATA,
      summaries: parsed.summaries ?? [],
      operator: parsed.operator ?? null,
      loadedAt: parsed.loadedAt ?? null,
      workflows: parsed.workflows ?? {},
      tickmarks: migrateTickmarks(parsed.tickmarks),
      signOff: { ...EMPTY_SIGN_OFF, ...(parsed.signOff ?? {}) },
      bridgeBalances: parsed.bridgeBalances ?? {},
      completenessEvidence: { ...EMPTY_COMPLETENESS, ...(parsed.completenessEvidence ?? {}) },
      closedPeriods: parsed.closedPeriods ?? {},
      userRole: parsed.userRole === 'admin' ? 'admin' : 'user',
      badDebtReserves: parsed.badDebtReserves ?? {},
      signoffSnapshots: parsed.signoffSnapshots ?? {},
    };
  } catch {
    return emptyState();
  }
}

function writePersisted(state: PersistedState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be full or disabled — silently ignore so the app still works
  }
}

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => readPersisted());

  useEffect(() => {
    writePersisted(state);
  }, [state]);

  const setData = useCallback((data: ARData, summaries: ImportSummary[]) => {
    setState((prev) => ({
      ...prev,
      data,
      summaries,
      loadedAt: new Date().toISOString(),
    }));
  }, []);

  const clearData = useCallback(() => {
    setState((prev) => ({
      ...prev,
      data: EMPTY_DATA,
      summaries: [],
      loadedAt: null,
      // intentionally retain operator; clear workflows + tickmarks + bridge
      // balances since they reference data that's now gone
      workflows: {},
      tickmarks: {} as TickmarkMap,
      bridgeBalances: {},
      // sign-off block survives across re-imports; the entity name in
      // particular is annoying to retype
    }));
  }, []);

  const setOperator = useCallback((name: string) => {
    setState((prev) => ({ ...prev, operator: name.trim() || null }));
  }, []);

  const setExceptionStatus = useCallback(
    (exceptionId: string, status: WorkflowStatus, note: string = '') => {
      setState((prev) => {
        const now = new Date().toISOString();
        const actor = prev.operator ?? 'unknown';
        const wf = ensureWorkflow(prev.workflows[exceptionId], exceptionId, actor, now);
        const next = applyStatus(wf, status, actor, note, now);
        return { ...prev, workflows: { ...prev.workflows, [exceptionId]: next } };
      });
    },
    [],
  );

  const setExceptionAssignee = useCallback(
    (exceptionId: string, assignee: string | null) => {
      setState((prev) => {
        const now = new Date().toISOString();
        const actor = prev.operator ?? 'unknown';
        const wf = ensureWorkflow(prev.workflows[exceptionId], exceptionId, actor, now);
        const next = applyAssignee(wf, assignee, actor, now);
        return { ...prev, workflows: { ...prev.workflows, [exceptionId]: next } };
      });
    },
    [],
  );

  const addExceptionComment = useCallback((exceptionId: string, note: string) => {
    setState((prev) => {
      const now = new Date().toISOString();
      const actor = prev.operator ?? 'unknown';
      const wf = ensureWorkflow(prev.workflows[exceptionId], exceptionId, actor, now);
      const next = applyComment(wf, note, actor, now);
      return { ...prev, workflows: { ...prev.workflows, [exceptionId]: next } };
    });
  }, []);

  const getWorkflow = useCallback(
    (exceptionId: string): ExceptionWorkflow | undefined => state.workflows[exceptionId],
    [state.workflows],
  );

  const toggleTickmark = useCallback(
    (type: TickmarkRowType, id: string, letter: TickmarkLetter) => {
      setState((prev) => {
        const key = tickmarkKey(type, id, letter);
        const next = { ...prev.tickmarks };
        if (next[key]) {
          delete next[key];
        } else {
          next[key] = {
            actor: prev.operator?.trim() || 'unknown',
            timestamp: new Date().toISOString(),
          };
        }
        return { ...prev, tickmarks: next };
      });
    },
    [],
  );

  const hasTickmark = useCallback(
    (type: TickmarkRowType, id: string, letter: TickmarkLetter): boolean =>
      state.tickmarks[tickmarkKey(type, id, letter)] != null,
    [state.tickmarks],
  );

  const getTickmark = useCallback(
    (type: TickmarkRowType, id: string, letter: TickmarkLetter): TickmarkRecord | undefined =>
      state.tickmarks[tickmarkKey(type, id, letter)],
    [state.tickmarks],
  );

  const getRowTickmarks = useCallback(
    (type: TickmarkRowType, id: string): TickmarkLetter[] => {
      const out: TickmarkLetter[] = [];
      for (const letter of ['a', 'b', 'c', 'd'] as TickmarkLetter[]) {
        if (state.tickmarks[tickmarkKey(type, id, letter)]) out.push(letter);
      }
      return out;
    },
    [state.tickmarks],
  );

  const setSignOffField = useCallback(
    <K extends keyof SignOffBlockState>(field: K, value: SignOffBlockState[K]) => {
      setState((prev) => ({ ...prev, signOff: { ...prev.signOff, [field]: value } }));
    },
    [],
  );

  const loadSnapshot = useCallback((snapshot: SnapshotV1) => {
    type Loose = Partial<SnapshotV1> & {
      bridgeBalances?: Record<string, BridgeBalanceEntry>;
      completenessEvidence?: CompletenessEvidence;
      closedPeriods?: Record<string, ClosedPeriodEntry>;
      badDebtReserves?: Record<string, BadDebtReserveEntry>;
      signoffSnapshots?: Record<string, SignoffSnapshot>;
      userRole?: UserRole;
    };
    const ext = snapshot as Loose;
    setState((prev) => ({
      data: snapshot.data,
      summaries: snapshot.summaries ?? [],
      operator: snapshot.operator ?? null,
      loadedAt: snapshot.metadata.generatedAt,
      workflows: snapshot.workflows ?? {},
      tickmarks: migrateTickmarks(snapshot.tickmarks),
      signOff: { ...EMPTY_SIGN_OFF, ...(snapshot.signOff ?? {}) },
      bridgeBalances: ext.bridgeBalances ?? {},
      completenessEvidence: { ...EMPTY_COMPLETENESS, ...(ext.completenessEvidence ?? {}) },
      closedPeriods: ext.closedPeriods ?? {},
      // user role isn't snapshotted — preserve the current session's role
      userRole: prev.userRole,
      badDebtReserves: ext.badDebtReserves ?? {},
      signoffSnapshots: ext.signoffSnapshots ?? {},
    }));
  }, []);

  const setBridgeBalance = useCallback((period: string, amount: number | null) => {
    setState((prev) => {
      const next = { ...prev.bridgeBalances };
      if (amount == null || !Number.isFinite(amount)) {
        delete next[period];
      } else {
        next[period] = {
          amount,
          actor: prev.operator?.trim() || 'unknown',
          timestamp: new Date().toISOString(),
        };
      }
      return { ...prev, bridgeBalances: next };
    });
  }, []);

  const getBridgeBalance = useCallback(
    (period: string): BridgeBalanceEntry | undefined => state.bridgeBalances[period],
    [state.bridgeBalances],
  );

  const setCompletenessField = useCallback(
    <K extends keyof CompletenessEvidence>(field: K, value: CompletenessEvidence[K]) => {
      setState((prev) => ({ ...prev, completenessEvidence: { ...prev.completenessEvidence, [field]: value } }));
    },
    [],
  );

  const setUserRole = useCallback((role: UserRole) => {
    setState((prev) => ({ ...prev, userRole: role }));
  }, []);

  const isPeriodClosed = useCallback(
    (period: string): boolean => state.closedPeriods[period] != null,
    [state.closedPeriods],
  );

  const getClosedPeriodEntry = useCallback(
    (period: string): ClosedPeriodEntry | undefined => state.closedPeriods[period],
    [state.closedPeriods],
  );

  const closePeriod = useCallback((period: string, reason: string = '') => {
    setState((prev) => {
      if (prev.closedPeriods[period]) return prev; // already closed
      return {
        ...prev,
        closedPeriods: {
          ...prev.closedPeriods,
          [period]: {
            closedBy: prev.operator?.trim() || 'unknown',
            closedAt: new Date().toISOString(),
            reason: reason.trim(),
            unlockHistory: [],
          },
        },
      };
    });
  }, []);

  const getBadDebtReserve = useCallback(
    (period: string): BadDebtReserveEntry | undefined => state.badDebtReserves[period],
    [state.badDebtReserves],
  );

  const getSignoffSnapshot = useCallback(
    (period: string): SignoffSnapshot | undefined => state.signoffSnapshots[period],
    [state.signoffSnapshots],
  );

  const captureSignoffSnapshot = useCallback((period: string, snap: SignoffSnapshot) => {
    setState((prev) => {
      // Capture once per period — the first sign-off freezes the baseline. If
      // an admin unlocks and re-signs we keep the original baseline so any
      // drift between original sign-off and current state is still visible.
      if (prev.signoffSnapshots[period]) return prev;
      return {
        ...prev,
        signoffSnapshots: { ...prev.signoffSnapshots, [period]: snap },
      };
    });
  }, []);

  const setBadDebtReserve = useCallback(
    (period: string, patch: Partial<BadDebtReserveEntry>) => {
      setState((prev) => {
        const existing = prev.badDebtReserves[period] ?? { ...EMPTY_BAD_DEBT_RESERVE };
        const next: BadDebtReserveEntry = {
          ...existing,
          ...patch,
          enteredBy: prev.operator?.trim() || 'unknown',
          enteredAt: new Date().toISOString(),
        };
        return {
          ...prev,
          badDebtReserves: { ...prev.badDebtReserves, [period]: next },
        };
      });
    },
    [],
  );

  const unlockPeriod = useCallback((period: string, reason: string = '') => {
    setState((prev) => {
      const existing = prev.closedPeriods[period];
      if (!existing) return prev;
      // Only admin can unlock; this is also gated in the UI but we enforce
      // here so a stray hook caller can't bypass it.
      if (prev.userRole !== 'admin') return prev;
      // History is preserved on the closed entry, then the entry is removed
      // — matched by the period being open again. The history we keep
      // separately would be useful for a future "audit trail" view.
      void existing.unlockHistory.push({
        unlockedBy: prev.operator?.trim() || 'unknown',
        unlockedAt: new Date().toISOString(),
        reason: reason.trim(),
      });
      const next = { ...prev.closedPeriods };
      delete next[period];
      return { ...prev, closedPeriods: next };
    });
  }, []);

  const value = useMemo<DataStoreValue>(() => {
    const totalRows =
      state.data.invoices.length +
      state.data.receipts.length +
      state.data.creditMemos.length +
      state.data.glEntries.length +
      state.data.bankStatements.length +
      state.data.customers.length;
    return {
      ...state,
      hasData: totalRows > 0,
      setData,
      clearData,
      setOperator,
      setExceptionStatus,
      setExceptionAssignee,
      addExceptionComment,
      getWorkflow,
      toggleTickmark,
      hasTickmark,
      getTickmark,
      getRowTickmarks,
      setSignOffField,
      setBridgeBalance,
      getBridgeBalance,
      setCompletenessField,
      setUserRole,
      isPeriodClosed,
      getClosedPeriodEntry,
      closePeriod,
      unlockPeriod,
      getBadDebtReserve,
      setBadDebtReserve,
      getSignoffSnapshot,
      captureSignoffSnapshot,
      loadSnapshot,
    };
  }, [
    state, setData, clearData, setOperator,
    setExceptionStatus, setExceptionAssignee, addExceptionComment, getWorkflow,
    toggleTickmark, hasTickmark, getTickmark, getRowTickmarks, setSignOffField,
    setBridgeBalance, getBridgeBalance, setCompletenessField,
    setUserRole, isPeriodClosed, getClosedPeriodEntry, closePeriod, unlockPeriod,
    getBadDebtReserve, setBadDebtReserve,
    getSignoffSnapshot, captureSignoffSnapshot,
    loadSnapshot,
  ]);

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
}

export function useDataStore(): DataStoreValue {
  const ctx = useContext(DataStoreContext);
  if (!ctx) {
    throw new Error('useDataStore must be used within DataStoreProvider');
  }
  return ctx;
}
