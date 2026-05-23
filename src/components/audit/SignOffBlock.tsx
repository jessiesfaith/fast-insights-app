// Sign-off block (BUILD.md §12) — preparer + reviewer with name, signature
// line, and date. Preparer card is locked until the rollforward variance
// (preparer ending balance vs subledger AR) ties to $0.

import { useEffect } from 'react';
import { Lock } from 'lucide-react';
import { ARData } from '../../types/data';
import { useDataStore } from '../../lib/dataStore';
import { fmtDate, fmtMoney } from '../../lib/format';
import { bridgeTie } from '../../lib/recon';
import { periodBounds } from '../../lib/period';
import GlassCard from '../ui/GlassCard';

interface Props {
  data: ARData;
  period: string;
}

export function SignOffBlock({ data, period }: Props) {
  const { signOff, setSignOffField, operator, getBridgeBalance, isPeriodClosed } = useDataStore();

  // Default preparer to operator name on first use — they can override.
  useEffect(() => {
    if (!signOff.preparerName && operator) {
      setSignOffField('preparerName', operator);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operator]);

  // Rollforward variance gate — preparer signature blocked until $0.
  const entry = getBridgeBalance(period);
  const { subledgerEnding, variance, ties } = bridgeTie(data, period, entry?.amount ?? null);
  const closed = isPeriodClosed(period);
  // Preparer is locked when the rollforward doesn't tie OR the period is closed.
  const preparerLocked = !ties || closed;
  const reviewerLocked = closed;

  return (
    <GlassCard>
      <div className="label" style={{ marginBottom: 12 }}>Sign-off</div>

      {closed ? (
        <div
          className="row gap-2"
          style={{
            alignItems: 'flex-start',
            padding: '10px 12px',
            marginBottom: 12,
            background: 'var(--severity-resolved-bg)',
            border: '1px solid var(--severity-resolved)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--severity-resolved)',
          }}
        >
          <Lock size={14} style={{ marginTop: 1 }} />
          <span>
            <strong>Period closed.</strong> Sign-off block is read-only. Switch to the
            <strong> Admin</strong> role in the top bar and unlock from the period-close section
            below if updates are needed.
          </span>
        </div>
      ) : preparerLocked ? (
        <div
          className="row gap-2"
          style={{
            alignItems: 'flex-start',
            padding: '10px 12px',
            marginBottom: 12,
            background: 'var(--severity-medium-bg)',
            border: '1px solid var(--severity-medium)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--severity-medium)',
          }}
        >
          <Lock size={14} style={{ marginTop: 1 }} />
          <span>
            <strong>Preparer sign-off locked.</strong>{' '}
            {entry == null
              ? 'Enter the preparer ending balance on the AR Bridge so the rollforward variance can be computed.'
              : `Rollforward variance is ${fmtMoney(variance!, 0)} — must tie to $0 before sign-off. Update your bridge entry or correct the underlying data.`}
            {' '}Subledger AR as of {fmtDate(periodBounds(period).end)}:{' '}
            <span className="num" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              {fmtMoney(subledgerEnding, 0)}
            </span>
          </span>
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SignerCard
          role="Preparer"
          name={signOff.preparerName}
          date={signOff.preparerDate}
          onName={(v) => setSignOffField('preparerName', v)}
          onDate={(v) => setSignOffField('preparerDate', v)}
          locked={preparerLocked}
        />
        <SignerCard
          role="Reviewer"
          name={signOff.reviewerName}
          date={signOff.reviewerDate}
          onName={(v) => setSignOffField('reviewerName', v)}
          onDate={(v) => setSignOffField('reviewerDate', v)}
          locked={reviewerLocked}
        />
      </div>
      <div style={{ marginTop: 14 }}>
        <label className="label" style={{ display: 'block', marginBottom: 4 }}>
          Comments
        </label>
        <textarea
          rows={3}
          value={signOff.comments}
          onChange={(e) => setSignOffField('comments', e.target.value)}
          placeholder="Free-form auditor comments — printed on the cover page."
          readOnly={closed}
          disabled={closed}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            fontSize: 12,
            outline: 'none',
            resize: 'vertical',
            opacity: closed ? 0.6 : 1,
          }}
        />
      </div>
    </GlassCard>
  );
}

function SignerCard({
  role,
  name,
  date,
  onName,
  onDate,
  locked,
}: {
  role: string;
  name: string;
  date: string;
  onName: (v: string) => void;
  onDate: (v: string) => void;
  locked?: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div
      style={{
        padding: 14,
        border: `1px solid ${locked ? 'var(--border)' : 'var(--border)'}`,
        borderRadius: 10,
        background: 'var(--bg-elevated)',
        opacity: locked ? 0.55 : 1,
        position: 'relative',
      }}
    >
      <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 6 }}>
        <span className="label">{role}</span>
        {locked && <Lock size={11} style={{ color: 'var(--text-tertiary)' }} aria-label="Sign-off locked" />}
      </div>
      <input
        value={name}
        onChange={(e) => onName(e.target.value)}
        placeholder={locked ? `${role} sign-off locked` : `${role} name`}
        readOnly={locked}
        disabled={locked}
        style={inputStyle}
      />
      <div
        style={{
          marginTop: 14,
          marginBottom: 4,
          height: 36,
          borderBottom: '1px solid var(--border-strong)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          fontSize: 10,
          color: 'var(--text-tertiary)',
          letterSpacing: 0.06,
          textTransform: 'uppercase',
          paddingBottom: 2,
        }}
      >
        signature
      </div>
      <div className="row gap-2" style={{ alignItems: 'center', marginTop: 8 }}>
        <span className="label">Date</span>
        <input
          type="date"
          value={date}
          onChange={(e) => onDate(e.target.value)}
          readOnly={locked}
          disabled={locked}
          style={{ ...inputStyle, flex: 1 }}
        />
        {!locked && !date && (
          <button
            type="button"
            onClick={() => onDate(today)}
            style={{
              padding: '4px 8px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--text-tertiary)',
              fontSize: 11,
              cursor: 'pointer',
            }}
            title={`Set to today (${fmtDate(today)})`}
          >
            today
          </button>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: 13,
  outline: 'none',
};

export default SignOffBlock;
