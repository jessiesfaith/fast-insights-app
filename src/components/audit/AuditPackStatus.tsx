// Auto-certification status + change-after-sign-off detection.
//
// Displays a single status banner at the top of the audit pack:
//   - GREEN  "Auto-certified"  when every gate passes
//   - YELLOW "Manual review required" with a bullet list of failing gates
//   - RED    "Data changed after sign-off" when the dataset hashes differ
//             from the captured baseline
//
// Captures a baseline snapshot the first time the preparer fills in name +
// date, so subsequent re-imports / scenario edits become detectable drift.

import { useEffect, useMemo } from 'react';
import { AlertTriangle, BadgeCheck, RefreshCw, ShieldAlert } from 'lucide-react';
import { ARData } from '../../types/data';
import { useDataStore } from '../../lib/dataStore';
import { runDetection } from '../../lib/detect';
import { computeSubledgerAR } from '../../lib/recon';
import { periodBounds } from '../../lib/period';
import { buildDatasetHashes } from '../../lib/export/json';
import { fmtDateTime, fmtMoney } from '../../lib/format';
import GlassCard from '../ui/GlassCard';

interface Props {
  data: ARData;
  period: string;
}

export function AuditPackStatus({ data, period }: Props) {
  const {
    summaries,
    signOff,
    workflows,
    getBridgeBalance,
    getSignoffSnapshot,
    captureSignoffSnapshot,
    isPeriodClosed,
  } = useDataStore();

  // Build the gate list — each is a one-liner failure reason if not yet met.
  const gates = useMemo(() => {
    const reasons: string[] = [];
    if (summaries.length !== 6) reasons.push(`${summaries.length} of 6 datasets loaded — load the full population.`);
    const bridge = getBridgeBalance(period);
    if (!bridge) reasons.push('Preparer ending balance not entered on AR Bridge.');
    const subEnd = computeSubledgerAR(data, periodBounds(period).end).total;
    const variance = bridge ? bridge.amount - subEnd : null;
    const ties = variance !== null && Math.abs(variance) < 0.005;
    if (bridge && !ties) reasons.push(`Rollforward variance is ${fmtMoney(variance!, 0)} — must tie to $0.`);
    const detection = runDetection(data);
    const openHigh = detection.exceptions.filter((e) => {
      if (e.severity !== 'high') return false;
      const wf = workflows[e.exception_id];
      return !(wf?.status === 'Resolved' || wf?.status === "Won't Fix");
    });
    if (openHigh.length > 0) reasons.push(`${openHigh.length} high-severity exception${openHigh.length === 1 ? '' : 's'} still open.`);
    if (!signOff.preparerName.trim()) reasons.push('Preparer has not signed off.');
    if (!signOff.preparerDate.trim()) reasons.push('Preparer date is missing.');
    if (!signOff.reviewerName.trim()) reasons.push('Reviewer has not signed off.');
    if (!signOff.reviewerDate.trim()) reasons.push('Reviewer date is missing.');
    return {
      reasons,
      passed: reasons.length === 0,
      detection,
      subEnd,
    };
  }, [data, period, summaries, signOff, workflows, getBridgeBalance]);

  // Capture the sign-off baseline the first time both preparer name + date
  // are filled. Subsequent imports / scenario changes that move the dataset
  // hashes show up as drift.
  useEffect(() => {
    if (!signOff.preparerName.trim() || !signOff.preparerDate.trim()) return;
    if (getSignoffSnapshot(period)) return;
    captureSignoffSnapshot(period, {
      hashes: buildDatasetHashes(data),
      capturedAt: new Date().toISOString(),
      signedBy: signOff.preparerName.trim(),
      subledgerAR: gates.subEnd,
      exceptionCount: gates.detection.exceptions.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signOff.preparerName, signOff.preparerDate, period]);

  const baseline = getSignoffSnapshot(period);
  const driftHashes: string[] = [];
  if (baseline) {
    const current = buildDatasetHashes(data);
    for (const k of Object.keys(baseline.hashes)) {
      if (current[k as keyof typeof current] !== baseline.hashes[k]) driftHashes.push(k);
    }
  }
  const drift = driftHashes.length > 0;
  const closed = isPeriodClosed(period);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {drift && (
        <GlassCard
          padding={14}
          style={{
            background: 'var(--severity-high-bg)',
            border: '1px solid var(--severity-high)',
          }}
        >
          <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
            <span
              className="center"
              style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'var(--severity-high)', color: 'var(--accent-contrast)',
              }}
            >
              <RefreshCw size={14} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="label" style={{ color: 'var(--severity-high)' }}>
                Data changed after preparer sign-off
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                The {driftHashes.length} dataset{driftHashes.length === 1 ? '' : 's'}{' '}
                <span className="mono" style={{ color: 'var(--severity-high)' }}>{driftHashes.join(', ')}</span>{' '}
                no longer match the hashes captured when{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{baseline!.signedBy}</strong>{' '}
                signed on {fmtDateTime(baseline!.capturedAt)}. The reviewer must
                re-walk the recon and re-sign before exporting the audit pack.
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
                Captured baseline: subledger AR{' '}
                <span className="num">{fmtMoney(baseline!.subledgerAR, 0)}</span>
                {' · '}
                {baseline!.exceptionCount.toLocaleString()} exceptions
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard
        padding={14}
        style={{
          background: gates.passed
            ? 'var(--severity-resolved-bg)'
            : 'var(--severity-medium-bg)',
          border: `1px solid ${gates.passed ? 'var(--severity-resolved)' : 'var(--severity-medium)'}`,
        }}
      >
        <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
          <span
            className="center"
            style={{
              width: 28, height: 28, borderRadius: 7,
              background: gates.passed ? 'var(--severity-resolved)' : 'var(--severity-medium)',
              color: 'var(--accent-contrast)',
            }}
          >
            {gates.passed ? <BadgeCheck size={14} /> : <ShieldAlert size={14} />}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="between" style={{ alignItems: 'baseline' }}>
              <div
                className="label"
                style={{
                  color: gates.passed ? 'var(--severity-resolved)' : 'var(--severity-medium)',
                }}
              >
                {gates.passed ? 'Auto-certified · all gates pass' : 'Manual review required'}
              </div>
              <span
                className="mono"
                style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.06 }}
              >
                {gates.passed ? 'AR_AUTO_CERT_001 · PASS' : 'AR_AUTO_CERT_001 · REVIEW'}
              </span>
            </div>
            {gates.passed ? (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                Six datasets loaded · preparer ending balance entered · rollforward
                variance ties to $0 · no high-severity exceptions open · preparer
                and reviewer signed.{closed ? ' Period closed.' : ''}
              </div>
            ) : (
              <ul
                style={{
                  margin: '6px 0 0',
                  paddingLeft: 22,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {gates.reasons.map((r) => (
                  <li key={r} className="row gap-2" style={{ alignItems: 'flex-start' }}>
                    <AlertTriangle size={12} style={{ color: 'var(--severity-medium)', marginTop: 3, flexShrink: 0 }} />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export default AuditPackStatus;
