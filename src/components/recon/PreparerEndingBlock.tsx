// Preparer-entered AR Bridge ending balance + variance + tickmark.
//
// Lives on the audit-pack tab (under the AR Bridge / roll-forward section).
// The preparer fills in their per-records ending AR; the variance is
// (preparer − subledger) and must tie to $0 to unlock the preparer sign-off.
// Each entry is captured to the tickmark sign-off audit trail.
// Read-only when the period has been closed.

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardEdit, Lock } from 'lucide-react';
import { useDataStore } from '../../lib/dataStore';
import { fmtDateTime, fmtMoney } from '../../lib/format';
import TickmarkCell from '../audit/TickmarkCell';

interface Props {
  period: string;
  subledgerEnding: number;
}

export function PreparerEndingBlock({ period, subledgerEnding }: Props) {
  const { getBridgeBalance, setBridgeBalance, isPeriodClosed } = useDataStore();
  const stored = getBridgeBalance(period);
  const closed = isPeriodClosed(period);
  const [draft, setDraft] = useState<string>(stored ? String(stored.amount) : '');

  useEffect(() => {
    setDraft(stored ? String(stored.amount) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored?.amount, stored?.timestamp]);

  const parsed = draft.trim() === '' ? null : Number(draft.replace(/[$,\s]/g, ''));
  const isValid = parsed !== null && Number.isFinite(parsed);
  const variance = isValid ? parsed - subledgerEnding : null;
  const ties = variance !== null && Math.abs(variance) < 0.005;

  const commit = () => {
    if (closed) return;
    if (!isValid) {
      setBridgeBalance(period, null);
      return;
    }
    setBridgeBalance(period, parsed);
  };

  return (
    <div
      style={{
        marginTop: 12,
        padding: 14,
        borderRadius: 12,
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent)',
        opacity: closed ? 0.7 : 1,
      }}
    >
      <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 8 }}>
        <span
          className="center"
          style={{
            width: 26, height: 26, borderRadius: 7,
            background: 'var(--accent)', color: 'var(--accent-contrast)',
          }}
        >
          {closed ? <Lock size={14} /> : <ClipboardEdit size={14} />}
        </span>
        <div>
          <div className="label" style={{ color: 'var(--accent-hover)' }}>
            Preparer ending balance{closed ? ' · period closed' : ''}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {closed
              ? 'This period is closed. Switch to admin in the top bar to unlock for edits.'
              : 'Enter the ending AR per your records — variance must be $0 to unlock preparer sign-off.'}
          </div>
        </div>
      </div>

      <div className="row gap-2" style={{ alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, minWidth: 24 }}>$</span>
        <input
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="0.00"
          aria-label="Preparer ending AR balance"
          readOnly={closed}
          disabled={closed}
          className="num"
          style={{
            flex: 1,
            padding: '8px 10px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 600,
            outline: 'none',
          }}
        />
        {stored && !closed && (
          <button
            type="button"
            onClick={() => {
              setDraft('');
              setBridgeBalance(period, null);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-tertiary)',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>
      {stored && (
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
          Last entered by <strong style={{ color: 'var(--text-secondary)' }}>{stored.actor}</strong>
          {stored.timestamp ? ` · ${fmtDateTime(stored.timestamp)}` : ''}
        </div>
      )}

      <hr className="glass-divider" style={{ margin: '12px 0 10px' }} />

      <div
        className="between"
        style={{
          padding: '8px 10px',
          borderRadius: 8,
          background: ties
            ? 'var(--severity-resolved-bg)'
            : variance === null
            ? 'var(--bg-elevated)'
            : 'var(--severity-high-bg)',
          fontSize: 13,
        }}
      >
        <span
          className="row gap-2"
          style={{
            alignItems: 'center',
            color: ties
              ? 'var(--severity-resolved)'
              : variance === null
              ? 'var(--text-tertiary)'
              : 'var(--severity-high)',
            fontWeight: 600,
          }}
        >
          {ties ? <CheckCircle2 size={14} /> : variance === null ? null : <AlertTriangle size={14} />}
          <span>
            {variance === null
              ? 'Variance — enter your ending balance to compute'
              : ties
              ? 'Variance ties to $0 — sign-off ready'
              : 'Variance vs subledger AR'}
          </span>
        </span>
        <span className="row gap-3" style={{ alignItems: 'center' }}>
          <span
            className="num"
            style={{
              fontWeight: 700,
              color: ties
                ? 'var(--severity-resolved)'
                : variance === null
                ? 'var(--text-tertiary)'
                : 'var(--severity-high)',
            }}
          >
            {variance === null ? '—' : fmtMoney(variance)}
          </span>
          <TickmarkCell type="bridge" id="preparer-variance" />
        </span>
      </div>
    </div>
  );
}

export default PreparerEndingBlock;
