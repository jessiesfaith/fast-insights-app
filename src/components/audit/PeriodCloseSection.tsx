// Period-close section pinned to the bottom of the audit pack.
//
// While open: shows a "Close period" call-to-action — gated on both signers
// being present and the rollforward variance tying to $0.
// While closed: shows who closed it and when, plus an admin-only "Unlock"
// button. All edits to bridge balance, sign-off, tickmarks, and completeness
// fields are disabled while closed (enforced at the UI layer in each card).

import { useState } from 'react';
import { CheckCircle2, KeyRound, Lock, Unlock } from 'lucide-react';
import { ARData } from '../../types/data';
import { useDataStore } from '../../lib/dataStore';
import { computeSubledgerAR } from '../../lib/recon';
import { periodBounds } from '../../lib/period';
import { fmtDateTime, fmtMoney, fmtPeriod } from '../../lib/format';
import GlassCard from '../ui/GlassCard';

interface Props {
  data: ARData;
  period: string;
}

export function PeriodCloseSection({ data, period }: Props) {
  const {
    signOff,
    operator,
    userRole,
    isPeriodClosed,
    getClosedPeriodEntry,
    getBridgeBalance,
    closePeriod,
    unlockPeriod,
  } = useDataStore();
  const [closeReason, setCloseReason] = useState('');
  const [unlockReason, setUnlockReason] = useState('');

  const closed = isPeriodClosed(period);
  const closedEntry = getClosedPeriodEntry(period);

  const subEnding = computeSubledgerAR(data, periodBounds(period).end).total;
  const bridge = getBridgeBalance(period);
  const variance = bridge ? bridge.amount - subEnding : null;
  const variancesTie = variance !== null && Math.abs(variance) < 0.005;

  const preparerSigned = !!signOff.preparerName.trim();
  const reviewerSigned = !!signOff.reviewerName.trim();

  const reasonsToBlock: string[] = [];
  if (!variancesTie) reasonsToBlock.push('Rollforward variance must tie to $0 (AR Bridge → Preparer ending balance).');
  if (!preparerSigned) reasonsToBlock.push('Preparer name must be filled in.');
  if (!reviewerSigned) reasonsToBlock.push('Reviewer name must be filled in.');
  if (!operator?.trim()) reasonsToBlock.push('Set your operator name before closing.');
  const canClose = reasonsToBlock.length === 0;

  if (closed && closedEntry) {
    return (
      <GlassCard
        padding={18}
        severity="resolved"
        style={{ paddingLeft: 22, borderColor: 'var(--severity-resolved)' }}
      >
        <header className="row gap-2" style={{ alignItems: 'center', marginBottom: 8 }}>
          <span
            className="center"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'var(--severity-resolved)',
              color: 'var(--accent-contrast)',
            }}
          >
            <Lock size={14} />
          </span>
          <div>
            <div className="label" style={{ color: 'var(--severity-resolved)' }}>
              Period closed — {fmtPeriod(period)}
            </div>
            <h3 style={{ marginTop: 2 }}>This pack is sealed for editing.</h3>
          </div>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            gap: '4px 14px',
            fontSize: 13,
            color: 'var(--text-secondary)',
            padding: '10px 12px',
            background: 'var(--bg-elevated)',
            borderRadius: 8,
          }}
        >
          <span className="label">Closed by</span>
          <span style={{ fontWeight: 600 }}>{closedEntry.closedBy}</span>
          <span className="label">Closed at</span>
          <span>{fmtDateTime(closedEntry.closedAt)}</span>
          {closedEntry.reason && (
            <>
              <span className="label">Reason</span>
              <span>{closedEntry.reason}</span>
            </>
          )}
          {closedEntry.unlockHistory.length > 0 && (
            <>
              <span className="label">Unlock history</span>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {closedEntry.unlockHistory.map((h, i) => (
                  <li key={i} style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {fmtDateTime(h.unlockedAt)} · {h.unlockedBy}
                    {h.reason ? ` — ${h.reason}` : ''}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {userRole === 'admin' ? (
          <div style={{ marginTop: 14 }}>
            <div className="label" style={{ marginBottom: 4 }}>
              Admin unlock
            </div>
            <div className="row gap-2" style={{ alignItems: 'center' }}>
              <input
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="Reason for unlocking (e.g. ERP correction needed)"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!operator?.trim()) return;
                  unlockPeriod(period, unlockReason);
                  setUnlockReason('');
                }}
                disabled={!operator?.trim()}
                className="row gap-2"
                style={{
                  alignItems: 'center',
                  padding: '8px 14px',
                  background: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                  border: '1px solid var(--accent)',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: operator?.trim() ? 'pointer' : 'not-allowed',
                  opacity: operator?.trim() ? 1 : 0.6,
                }}
              >
                <Unlock size={14} /> Unlock period
              </button>
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
              Unlocking is logged to the audit trail with your operator name and timestamp.
            </div>
          </div>
        ) : (
          <div
            className="row gap-2"
            style={{
              marginTop: 14,
              padding: '10px 12px',
              background: 'var(--severity-medium-bg)',
              color: 'var(--severity-medium)',
              borderRadius: 8,
              fontSize: 12,
              alignItems: 'flex-start',
            }}
          >
            <KeyRound size={13} style={{ marginTop: 2 }} />
            <span>
              The team needs to update this period? Switch to <strong>Admin</strong> in the top
              bar to unlock. Only admins can unlock closed periods.
            </span>
          </div>
        )}
      </GlassCard>
    );
  }

  // Open state — close-period CTA
  return (
    <GlassCard padding={18}>
      <header className="row gap-2" style={{ alignItems: 'center', marginBottom: 8 }}>
        <span
          className="center"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
          }}
        >
          <Unlock size={14} />
        </span>
        <div>
          <div className="label">Period open — {fmtPeriod(period)}</div>
          <h3 style={{ marginTop: 2 }}>Close the period when sign-off is complete.</h3>
        </div>
      </header>

      {reasonsToBlock.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: '0 0 12px 0',
            padding: '10px 12px',
            background: 'var(--severity-medium-bg)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--severity-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {reasonsToBlock.map((r) => (
            <li key={r}>· {r}</li>
          ))}
        </ul>
      )}

      <div className="row gap-2" style={{ alignItems: 'center' }}>
        <input
          value={closeReason}
          onChange={(e) => setCloseReason(e.target.value)}
          placeholder="Optional close note (e.g. 'Q1 March close — final')"
          style={{
            flex: 1,
            padding: '8px 10px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (!canClose) return;
            const ok = typeof window === 'undefined'
              ? true
              : window.confirm(
                `Close the audit pack for ${fmtPeriod(period)}?\n\nWhile closed, the preparer ending balance, sign-off, tickmarks, and completeness fields are read-only. Only an admin can unlock.${closeReason ? `\n\nReason: ${closeReason}` : ''}`,
              );
            if (!ok) return;
            closePeriod(period, closeReason);
            setCloseReason('');
          }}
          disabled={!canClose}
          className="row gap-2"
          style={{
            alignItems: 'center',
            padding: '8px 14px',
            background: canClose ? 'var(--severity-resolved)' : 'var(--bg-elevated)',
            color: canClose ? 'var(--accent-contrast)' : 'var(--text-tertiary)',
            border: '1px solid',
            borderColor: canClose ? 'var(--severity-resolved)' : 'var(--border)',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: canClose ? 'pointer' : 'not-allowed',
            opacity: canClose ? 1 : 0.7,
          }}
        >
          {canClose ? <CheckCircle2 size={14} /> : <Lock size={14} />} Close period
        </button>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
        {canClose
          ? `Variance ties to $0; ready to close. Subledger AR ${fmtMoney(subEnding, 0)}.`
          : 'Resolve the items above before closing.'}
      </div>
    </GlassCard>
  );
}

export default PeriodCloseSection;
