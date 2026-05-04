// Left-pane exception queue (BUILD.md §10.1).
// Filter bar (category multi-select, severity, customer search), sortable
// columns, severity color stripe, click-to-select. Workflow controls (status,
// assignee, audit log) ship in milestone 6.

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import { CATEGORY_LABEL, DetectedException, ExceptionCategory, Severity } from '../../types/exception';
import { useDataStore } from '../../lib/dataStore';
import { WORKFLOW_STATUSES, WorkflowStatus, isResolved } from '../../types/workflow';
import { isTypingTarget } from '../../lib/shortcuts';
import { fmtMoney } from '../../lib/format';
import { CategoryBadge, SeverityBadge } from './ExceptionBadge';

type SortKey = 'severity' | 'amount_impact' | 'age_days' | 'customer_id' | 'category' | 'status';
type SortDir = 'asc' | 'desc';

interface Props {
  exceptions: DetectedException[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

const ALL_CATEGORIES: ExceptionCategory[] = [
  'unapplied_cash',
  'short_pay',
  'unapplied_credit',
  'missing_gl_posting',
  'duplicate_gl_posting',
  'writeoff_desync',
  'cutoff_timing',
  'bank_only_item',
  'deposit_mismatch',
  'aged_unapplied',
];

export function ExceptionQueue({ exceptions, selectedId, onSelect }: Props) {
  const { workflows, setExceptionStatus } = useDataStore();
  const [sortKey, setSortKey] = useState<SortKey>('amount_impact');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [activeCategories, setActiveCategories] = useState<Set<ExceptionCategory>>(new Set());
  const [activeSeverities, setActiveSeverities] = useState<Set<Severity>>(new Set());
  const [activeStatuses, setActiveStatuses] = useState<Set<WorkflowStatus>>(new Set());
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const selectedRowRef = useRef<HTMLTableRowElement>(null);

  const statusOf = (id: string): WorkflowStatus => workflows[id]?.status ?? 'Open';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exceptions.filter((e) => {
      if (activeCategories.size > 0 && !activeCategories.has(e.category)) return false;
      if (activeSeverities.size > 0 && !activeSeverities.has(e.severity)) return false;
      if (activeStatuses.size > 0 && !activeStatuses.has(statusOf(e.exception_id))) return false;
      if (q) {
        const hay =
          (e.customer_id ?? '').toLowerCase() +
          ' ' + e.description.toLowerCase() +
          ' ' + e.source_records.map((r) => r.id).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exceptions, activeCategories, activeSeverities, activeStatuses, search, workflows]);

  const STATUS_RANK: Record<WorkflowStatus, number> = { Open: 0, 'In Review': 1, Resolved: 2, "Won't Fix": 3 };
  const sorted = useMemo(() => {
    const sign = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'severity':
          return sign * (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
        case 'amount_impact':
          return sign * (Math.abs(a.amount_impact) - Math.abs(b.amount_impact));
        case 'age_days':
          return sign * ((a.age_days ?? 0) - (b.age_days ?? 0));
        case 'customer_id':
          return sign * (a.customer_id ?? '').localeCompare(b.customer_id ?? '');
        case 'category':
          return sign * a.category.localeCompare(b.category);
        case 'status':
          return sign * (STATUS_RANK[statusOf(a.exception_id)] - STATUS_RANK[statusOf(b.exception_id)]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sortKey, sortDir, workflows]);

  const onHeaderClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(['customer_id', 'category'].includes(key) ? 'asc' : 'desc');
    }
  };

  const toggleCategory = (c: ExceptionCategory) => {
    const next = new Set(activeCategories);
    if (next.has(c)) next.delete(c); else next.add(c);
    setActiveCategories(next);
  };
  const toggleSeverity = (s: Severity) => {
    const next = new Set(activeSeverities);
    if (next.has(s)) next.delete(s); else next.add(s);
    setActiveSeverities(next);
  };
  const toggleStatus = (s: WorkflowStatus) => {
    const next = new Set(activeStatuses);
    if (next.has(s)) next.delete(s); else next.add(s);
    setActiveStatuses(next);
  };

  const totalImpact = sorted.reduce((s, e) => s + Math.abs(e.amount_impact), 0);

  // Keyboard navigation for the queue (BUILD.md §10.1).
  // J/K → next/prev row · R → toggle Resolved · / → focus search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) && e.key !== '/') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if (sorted.length === 0) return;
      const curIndex = selectedId ? sorted.findIndex((x) => x.exception_id === selectedId) : -1;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = curIndex < 0 ? 0 : Math.min(sorted.length - 1, curIndex + 1);
        onSelect(sorted[next].exception_id);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = curIndex < 0 ? 0 : Math.max(0, curIndex - 1);
        onSelect(sorted[next].exception_id);
      } else if (e.key === 'r' && curIndex >= 0) {
        e.preventDefault();
        const exc = sorted[curIndex];
        const cur = statusOf(exc.exception_id);
        const next: WorkflowStatus = isResolved(cur) ? 'Open' : 'Resolved';
        setExceptionStatus(exc.exception_id, next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, selectedId, onSelect, workflows, setExceptionStatus]);

  // Keep the selected row in view when J/K moves selection.
  useEffect(() => {
    selectedRowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
        <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 10 }}>
          <div
            className="row gap-2"
            style={{
              flex: 1,
              alignItems: 'center',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '6px 10px',
            }}
          >
            <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              aria-label="Search exceptions by customer, ID, or description"
              placeholder="Search customer, ID, or description (/)"
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', flex: 1, fontSize: 13 }}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {sorted.length} / {exceptions.length}
            <span className="num" style={{ marginLeft: 8, color: 'var(--text-secondary)' }}>{fmtMoney(totalImpact, 0)}</span>
          </span>
        </div>

        <div className="row gap-1" style={{ flexWrap: 'wrap', marginBottom: 6 }}>
          {(['high', 'medium', 'low'] as Severity[]).map((s) => (
            <FilterPill
              key={s}
              active={activeSeverities.has(s)}
              onClick={() => toggleSeverity(s)}
              label={s}
            />
          ))}
          <span style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
          {WORKFLOW_STATUSES.map((s) => (
            <FilterPill
              key={s}
              active={activeStatuses.has(s)}
              onClick={() => toggleStatus(s)}
              label={s}
            />
          ))}
        </div>
        <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
          {ALL_CATEGORIES.map((c) => (
            <FilterPill
              key={c}
              active={activeCategories.has(c)}
              onClick={() => toggleCategory(c)}
              label={CATEGORY_LABEL[c]}
            />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <table className="fin-table">
          <thead>
            <tr>
              <Th label="Sev" sortKey="severity" cur={sortKey} dir={sortDir} onClick={onHeaderClick} />
              <Th label="Category" sortKey="category" cur={sortKey} dir={sortDir} onClick={onHeaderClick} />
              <Th label="Customer" sortKey="customer_id" cur={sortKey} dir={sortDir} onClick={onHeaderClick} />
              <Th label="Status" sortKey="status" cur={sortKey} dir={sortDir} onClick={onHeaderClick} />
              <Th label="Impact" sortKey="amount_impact" cur={sortKey} dir={sortDir} onClick={onHeaderClick} numeric />
              <Th label="Age" sortKey="age_days" cur={sortKey} dir={sortDir} onClick={onHeaderClick} numeric />
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => {
              const status = statusOf(e.exception_id);
              const resolved = isResolved(status);
              const wfAssignee = workflows[e.exception_id]?.assignee;
              const isSel = selectedId === e.exception_id;
              return (
                <tr
                  ref={isSel ? selectedRowRef : null}
                  key={e.exception_id}
                  onClick={() => onSelect(e.exception_id)}
                  className="severity-strip"
                  data-severity={resolved ? 'resolved' : e.severity}
                  aria-selected={isSel}
                  style={{
                    cursor: 'pointer',
                    background: isSel ? 'var(--accent-soft)' : undefined,
                    opacity: resolved ? 0.7 : 1,
                  }}
                >
                  <td style={{ paddingLeft: 14 }}>
                    <SeverityBadge severity={e.severity} />
                  </td>
                  <td>
                    <CategoryBadge category={e.category} />
                  </td>
                  <td>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {e.customer_id ?? '—'}
                    </div>
                    {wfAssignee && (
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                        @ {wfAssignee}
                      </div>
                    )}
                  </td>
                  <td>
                    <RowStatusPill status={status} />
                  </td>
                  <td
                    className="num"
                    style={{
                      fontWeight: 600,
                      textDecoration: resolved ? 'line-through' : undefined,
                    }}
                  >
                    {fmtMoney(e.amount_impact, 0)}
                  </td>
                  <td className="num" style={{ color: 'var(--text-tertiary)' }}>
                    {e.age_days != null ? `${e.age_days}d` : '—'}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                  No exceptions match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowStatusPill({ status }: { status: WorkflowStatus }) {
  const tone = {
    Open:        { bg: 'var(--severity-medium-bg)',   fg: 'var(--severity-medium)' },
    'In Review': { bg: 'var(--accent-soft)',          fg: 'var(--accent-hover)' },
    Resolved:    { bg: 'var(--severity-resolved-bg)', fg: 'var(--severity-resolved)' },
    "Won't Fix": { bg: 'var(--bg-elevated-2)',        fg: 'var(--text-tertiary)' },
  }[status];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        background: tone.bg,
        color: tone.fg,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.06,
      }}
    >
      {status}
    </span>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 999,
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-tertiary)',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'capitalize',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function Th({
  label,
  sortKey,
  cur,
  dir,
  onClick,
  numeric,
}: {
  label: string;
  sortKey: SortKey;
  cur: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
  numeric?: boolean;
}) {
  const isActive = cur === sortKey;
  return (
    <th
      onClick={() => onClick(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none', textAlign: numeric ? 'right' : 'left' }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          color: isActive ? 'var(--accent)' : undefined,
        }}
      >
        {label}
        {isActive && (dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
      </span>
    </th>
  );
}

export default ExceptionQueue;
