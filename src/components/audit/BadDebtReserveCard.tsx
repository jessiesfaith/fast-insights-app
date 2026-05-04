// Bad-debt-reserve / allowance-for-doubtful-accounts card with a CECL-style
// (ASC 326) memo. The methodology / historical basis / qualitative factors /
// forecast & reversion sections are structured so an external auditor can
// verify each component independently. Preparer and reviewer comments are
// captured separately. All fields are read-only when the period is closed.

import { useEffect, useMemo, useState } from 'react';
import { Calculator, FileText, Lock, MessageSquare, Sparkles } from 'lucide-react';
import { ARData } from '../../types/data';
import {
  BAD_DEBT_METHOD_LABEL,
  BadDebtMethod,
  CECLMemo,
  CECL_DEFAULT_TEMPLATE,
  EMPTY_BAD_DEBT_RESERVE,
  migrateCECLMemo,
} from '../../types/audit';
import { computeBadDebt } from '../../lib/badDebt';
import { useDataStore } from '../../lib/dataStore';
import { fmtDateTime, fmtMoney, fmtPct } from '../../lib/format';
import GlassCard from '../ui/GlassCard';

interface Props {
  data: ARData;
  period: string;
  /** Slim variant skips the CECL memo for the dashboard tile slot. */
  compact?: boolean;
}

export function BadDebtReserveCard({ data, period, compact = false }: Props) {
  const { getBadDebtReserve, setBadDebtReserve, isPeriodClosed } = useDataStore();
  const closed = isPeriodClosed(period);
  const stored = getBadDebtReserve(period) ?? EMPTY_BAD_DEBT_RESERVE;
  const computed = computeBadDebt(data, period, stored);
  // Coerce older 4-section CECL objects into the single-paragraph shape.
  const cecl: CECLMemo = useMemo(() => migrateCECLMemo(stored.cecl), [stored.cecl]);

  // Local drafts so typing doesn't fire setBadDebtReserve on every keystroke.
  const [pctDraft, setPctDraft] = useState<string>(stored.percentage ? (stored.percentage * 100).toString() : '');
  const [manualDraft, setManualDraft] = useState<string>(stored.manualAmount ? String(stored.manualAmount) : '');
  const [glDraft, setGlDraft] = useState<string>(stored.glAccount || EMPTY_BAD_DEBT_RESERVE.glAccount);
  const [memoDraft, setMemoDraft] = useState<string>(cecl.text);
  const [commentsDraft, setCommentsDraft] = useState<string>(stored.comments ?? '');

  useEffect(() => {
    setPctDraft(stored.percentage ? (stored.percentage * 100).toString() : '');
    setManualDraft(stored.manualAmount ? String(stored.manualAmount) : '');
    setGlDraft(stored.glAccount || EMPTY_BAD_DEBT_RESERVE.glAccount);
    setMemoDraft(cecl.text);
    setCommentsDraft(stored.comments ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored.percentage, stored.manualAmount, stored.glAccount, stored.enteredAt, cecl]);

  const onMethod = (m: BadDebtMethod) => {
    if (closed) return;
    setBadDebtReserve(period, { method: m });
  };
  const commitPct = () => {
    if (closed) return;
    const n = pctDraft.trim() === '' ? 0 : Number(pctDraft.replace(/[%\s]/g, '')) / 100;
    setBadDebtReserve(period, { percentage: Number.isFinite(n) ? n : 0 });
  };
  const commitManual = () => {
    if (closed) return;
    const n = manualDraft.trim() === '' ? 0 : Number(manualDraft.replace(/[$,\s]/g, ''));
    setBadDebtReserve(period, { manualAmount: Number.isFinite(n) ? n : 0 });
  };
  const commitGL = () => {
    if (closed) return;
    setBadDebtReserve(period, { glAccount: glDraft.trim() || EMPTY_BAD_DEBT_RESERVE.glAccount });
  };

  const commitMemo = () => {
    if (closed) return;
    setBadDebtReserve(period, { cecl: { text: memoDraft } });
  };
  const commitComments = () => {
    if (closed) return;
    setBadDebtReserve(period, { comments: commentsDraft });
  };
  const insertTemplate = () => {
    if (closed) return;
    setMemoDraft(CECL_DEFAULT_TEMPLATE.text);
    setBadDebtReserve(period, { cecl: { text: CECL_DEFAULT_TEMPLATE.text } });
  };

  return (
    <GlassCard padding={compact ? 16 : 20}>
      <header className="row gap-2" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
        <span
          className="center"
          style={{
            width: 30, height: 30, borderRadius: 8,
            background: closed ? 'var(--severity-resolved)' : 'var(--accent)',
            color: 'var(--accent-contrast)',
          }}
        >
          {closed ? <Lock size={14} /> : <Calculator size={14} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="label">Bad debt reserve · ASC 326 (CECL)</div>
          <h3 style={{ marginTop: 2 }}>
            Allowance for doubtful accounts — {BAD_DEBT_METHOD_LABEL[computed.method]}
          </h3>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {closed
              ? 'Period closed — fields are read-only.'
              : `Reserve = ${BAD_DEBT_METHOD_LABEL[computed.method]} × percentage. Posted to the contra-AR allowance account.`}
          </div>
        </div>
      </header>

      {/* Method selector */}
      <div className="row gap-1" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
        {(['pct_of_sales', 'pct_of_ar', 'manual'] as BadDebtMethod[]).map((m) => {
          const active = computed.method === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onMethod(m)}
              disabled={closed}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                color: active ? 'var(--accent-hover)' : 'var(--text-tertiary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: closed ? 'not-allowed' : 'pointer',
                opacity: closed ? 0.6 : 1,
              }}
            >
              {BAD_DEBT_METHOD_LABEL[m]}
            </button>
          );
        })}
      </div>

      {/* Calculation grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          gap: '6px 14px',
          fontSize: 13,
          padding: 14,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          opacity: closed ? 0.7 : 1,
        }}
      >
        {computed.method === 'manual' ? (
          <>
            <Label>Reserve amount ($)</Label>
            <input
              inputMode="decimal"
              value={manualDraft}
              onChange={(e) => setManualDraft(e.target.value)}
              onBlur={commitManual}
              readOnly={closed}
              disabled={closed}
              placeholder="0.00"
              className="num"
              style={inputStyle}
            />
          </>
        ) : (
          <>
            <Label>{computed.method === 'pct_of_sales' ? 'Period sales' : 'Period-end AR'}</Label>
            <ReadOnly>{fmtMoney(computed.base, 0)}</ReadOnly>
            <Label>Reserve %</Label>
            <input
              inputMode="decimal"
              value={pctDraft}
              onChange={(e) => setPctDraft(e.target.value)}
              onBlur={commitPct}
              readOnly={closed}
              disabled={closed}
              placeholder="e.g. 2.50"
              className="num"
              style={inputStyle}
            />
            <Label>= Reserve</Label>
            <ReadOnly bold accent>
              {fmtMoney(computed.reserve, 0)}
              <span style={{ fontWeight: 500, color: 'var(--text-tertiary)', marginLeft: 8, fontSize: 12 }}>
                ({fmtPct(computed.percentage, 2)} of {computed.baseLabel.toLowerCase()})
              </span>
            </ReadOnly>
          </>
        )}
        <Label>GL account</Label>
        <input
          value={glDraft}
          onChange={(e) => setGlDraft(e.target.value)}
          onBlur={commitGL}
          readOnly={closed}
          disabled={closed}
          placeholder="1290 — Allowance for Doubtful Accounts"
          style={inputStyle}
        />
        {computed.method === 'manual' && (
          <>
            <Label>= Reserve</Label>
            <ReadOnly bold accent>{fmtMoney(computed.reserve, 0)}</ReadOnly>
          </>
        )}
      </div>

      {!compact && (
        <>
          <div className="between" style={{ marginTop: 16, marginBottom: 8 }}>
            <div className="label">
              <FileText size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
              CECL memo · ASC 326
            </div>
            {!closed && (
              <button
                type="button"
                onClick={insertTemplate}
                className="row gap-1"
                style={{
                  alignItems: 'center',
                  padding: '5px 10px',
                  borderRadius: 8,
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent-hover)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Insert the standard CECL methodology template; existing comments are preserved."
              >
                <Sparkles size={11} /> Insert CECL template
              </button>
            )}
          </div>

          <CECLField
            label="CECL methodology · ASC 326"
            hint="One condensed paragraph — model election, historical basis, Q-factors, forecast & reversion."
            value={memoDraft}
            onChange={setMemoDraft}
            onBlur={commitMemo}
            disabled={closed}
            rows={8}
          />

          <div className="label" style={{ marginTop: 14, marginBottom: 4 }}>
            <MessageSquare size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
            Comments
          </div>
          <textarea
            value={commentsDraft}
            onChange={(e) => setCommentsDraft(e.target.value)}
            onBlur={commitComments}
            readOnly={closed}
            disabled={closed}
            rows={3}
            placeholder="Open thread shared by preparer and reviewer for this period's reserve — rate changes, special situations, follow-ups, supporting working-paper references."
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: 12,
              lineHeight: 1.5,
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </>
      )}

      {stored.enteredAt && (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
          Last updated by <strong style={{ color: 'var(--text-secondary)' }}>{stored.enteredBy}</strong>
          {stored.enteredAt ? ` · ${fmtDateTime(stored.enteredAt)}` : ''}
        </div>
      )}
    </GlassCard>
  );
}

function CECLField({
  label,
  hint,
  value,
  onChange,
  onBlur,
  disabled,
  rows = 3,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  disabled: boolean;
  rows?: number;
}) {
  return (
    <div style={{ marginTop: 10 }}>
      <div className="between" style={{ marginBottom: 4 }}>
        <span className="label">{label}</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{hint}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        readOnly={disabled}
        disabled={disabled}
        rows={rows}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
          fontSize: 12,
          lineHeight: 1.5,
          outline: 'none',
          resize: 'vertical',
        }}
      />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.06, paddingTop: 8 }}>
      {children}
    </div>
  );
}

function ReadOnly({
  children,
  bold,
  accent,
}: {
  children: React.ReactNode;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className="num"
      style={{
        padding: '8px 10px',
        fontSize: 13,
        fontWeight: bold ? 700 : 500,
        color: accent ? 'var(--accent-hover)' : 'var(--text-primary)',
        textAlign: 'left',
      }}
    >
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: 13,
  outline: 'none',
};

export default BadDebtReserveCard;
