// "Fix in ERP" callout for the right-pane exception detail.
// Tells the AR team what to change in the ERP and surfaces candidate target
// records so they don't have to leave the dashboard to find them.

import { ArrowRight, RefreshCw, Wrench } from 'lucide-react';
import { ARData } from '../../types/data';
import { DetectedException } from '../../types/exception';
import { ERPFixCandidate, fixHintFor } from '../../lib/erpFix';
import { fmtMoney } from '../../lib/format';

interface Props {
  exception: DetectedException;
  data: ARData;
  asOf: string;
}

export function ERPFixCallout({ exception, data, asOf }: Props) {
  const hint = fixHintFor(exception, data, asOf);
  return (
    <div
      style={{
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent)',
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
        <span
          className="center"
          style={{
            width: 30,
            height: 30,
            minWidth: 30,
            borderRadius: 8,
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
          }}
        >
          <Wrench size={15} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row gap-2" style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span className="label" style={{ color: 'var(--accent-hover)' }}>Fix in ERP</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{hint.action}</span>
            <ArrowRight size={12} style={{ color: 'var(--accent)' }} />
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{hint.target}</span>
          </div>
          <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            {hint.detail}
          </p>
        </div>
      </div>

      {hint.candidates.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="label" style={{ marginBottom: 6 }}>
            Candidate target{hint.candidates.length === 1 ? '' : 's'}
          </div>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {hint.candidates.map((c) => (
              <CandidateRow key={`${c.type}:${c.id}`} candidate={c} />
            ))}
          </ul>
        </div>
      )}

      <div
        className="row gap-2"
        style={{
          marginTop: 12,
          padding: '6px 10px',
          background: 'var(--bg-elevated)',
          border: '1px dashed var(--border-strong)',
          borderRadius: 8,
          color: 'var(--text-tertiary)',
          fontSize: 11,
          alignItems: 'center',
        }}
      >
        <RefreshCw size={11} />
        <span>
          After fixing, re-export the relevant CSVs from the ERP and drop them onto
          the Import tab — the dashboard will refresh and this exception should drop off.
        </span>
      </div>
    </div>
  );
}

function CandidateRow({ candidate }: { candidate: ERPFixCandidate }) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '6px 10px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        fontSize: 12,
      }}
    >
      <span className="row gap-2" style={{ alignItems: 'center', minWidth: 0 }}>
        <span className="mono" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{candidate.id}</span>
        <span style={{ color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {candidate.description}
        </span>
      </span>
      {candidate.amount != null && (
        <span className="num" style={{ fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>
          {fmtMoney(candidate.amount)}
        </span>
      )}
    </li>
  );
}

export default ERPFixCallout;
