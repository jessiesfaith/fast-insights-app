// Audit-ready memo (lead-sheet style) — printed at the front of every pack.
//
// Purpose, scope, preparer + reviewer procedures, tickmark legend reference,
// conclusion. Header pulls live values from sign-off state so the lead sheet
// always reflects who's working the close.

import { ARData } from '../../types/data';
import { useDataStore } from '../../lib/dataStore';
import { fmtDate, fmtPeriod } from '../../lib/format';
import { TICKMARK_LEGEND, TICKMARK_LETTERS } from '../../types/audit';
import { bridgeTie } from '../../lib/recon';
import { periodBounds } from '../../lib/period';
import GlassCard from '../ui/GlassCard';

interface Props {
  data: ARData;
  period: string;
}

export function AuditMemoCard({ data, period }: Props) {
  const { signOff, getBridgeBalance } = useDataStore();
  const bounds = periodBounds(period);
  const { variance, ties } = bridgeTie(data, period, getBridgeBalance(period)?.amount ?? null);

  return (
    <GlassCard padding={0}>
      <div
        style={{
          padding: '16px 22px 12px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="row gap-2" style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span
            className="label"
            style={{
              padding: '2px 8px',
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              borderRadius: 4,
              letterSpacing: 0.08,
            }}
          >
            Audit lead sheet
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Accounts receivable reconciliation memo · {fmtPeriod(period)}
          </span>
        </div>
        <h3 style={{ marginTop: 8, fontSize: 17 }}>Standard procedures — preparer & reviewer</h3>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 0,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <HeaderCell label="Entity"      value={signOff.entityName || '—'} />
        <HeaderCell label="Period"      value={fmtPeriod(period)} bordered />
        <HeaderCell label="Account"     value="1200 — Accounts Receivable" />
        <HeaderCell label="As of"       value={fmtDate(bounds.end)} bordered />
        <HeaderCell label="Prepared by" value={signOff.preparerName || '(unsigned)'} />
        <HeaderCell label="Prepared on" value={signOff.preparerDate ? fmtDate(signOff.preparerDate) : '—'} bordered />
        <HeaderCell label="Reviewed by" value={signOff.reviewerName || '(unsigned)'} />
        <HeaderCell label="Reviewed on" value={signOff.reviewerDate ? fmtDate(signOff.reviewerDate) : '—'} bordered />
      </div>

      <Section title="Purpose">
        Document evidence of the completeness, accuracy, valuation, and proper
        period attribution of accounts receivable activity for the period stated
        above. The pack supports preparer self-review, reviewer attestation, and
        external auditor PBC.
      </Section>

      <Section title="Scope">
        <ul style={listStyle}>
          <li>Subledger AR — open invoices net of receipts and credit memos.</li>
          <li>General ledger account 1200 — control account activity and ending balance.</li>
          <li>Bank-cleared deposits — receipts that posted to the bank inside the period.</li>
          <li>Reconciling items between subledger ↔ GL and GL ↔ bank.</li>
          <li>Roll-forward of the period: Beginning AR + Billings − Cash − Credits − Write-offs ± Adjustments = Ending AR.</li>
          <li>Detected exceptions: unapplied cash, short pay, missing / duplicate GL postings, write-off desync, cutoff timing, bank-only items, deposit mismatch, aged unapplied.</li>
        </ul>
      </Section>

      <Section title="Procedures — preparer">
        <ol style={listStyle}>
          <li>Pull the six standard reports from the source system using the read-only service account; record details on the Completeness-evidence card.</li>
          <li>Drag the six CSVs onto the Import tab. Confirm row counts, period range, and total $ volume on the import-summary card.</li>
          <li>Open the Dashboard. Verify the three-way reconciliation either ties or exposes every reconciling item.</li>
          <li>Review the AR Bridge. Enter your records' ending balance in the "Preparer ending balance" field; investigate every variance until it ties to $0.</li>
          <li>For each detected exception, drill into the underlying records, correct the root cause in the ERP, re-export the affected CSV, and re-import.</li>
          <li>Tickmark each row reviewed using <Mono>(a) Traced to bank statement</Mono>, <Mono>(b) Traced to AR aging / cash / credit card</Mono>, or <Mono>(c) Traced to GL</Mono> as evidence of the test performed.</li>
          <li>Update workflow status (Open → In Review → Resolved) and add notes on any exception that won't be cleared by source data alone.</li>
          <li>Once rollforward variance is $0, the preparer sign-off block unlocks. Sign and date.</li>
          <li>Export the JSON snapshot to archive the close.</li>
        </ol>
      </Section>

      <Section title="Procedures — reviewer">
        <ol style={listStyle}>
          <li>Verify the preparer's name, date, and ending-balance entry on the AR Bridge.</li>
          <li>Sample 3–5 customers from the aging schedule (drill-down view) and trace open invoices to subledger detail and to the GL.</li>
          <li>Independently recompute one balance per category (KPI tile, recon row, bridge line) and apply the <Mono>(d) Reviewer</Mono> tickmark.</li>
          <li>Read the exception summary; confirm each item is either Resolved with a clear note or Won't Fix with an explanation.</li>
          <li>Confirm the tickmark sign-off table reflects the population of work performed.</li>
          <li>Sign and date the Reviewer block. Export the PDF and Excel pack and attach to the close folder.</li>
        </ol>
      </Section>

      <Section title="Tickmark legend">
        <ul style={listStyle}>
          {TICKMARK_LETTERS.map((l) => (
            <li key={l}>
              <Mono>({l})</Mono> {TICKMARK_LEGEND[l]}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Conclusion" last>
        {ties ? (
          <span>
            <strong style={{ color: 'var(--severity-resolved)' }}>Cleared to sign-off.</strong> The
            preparer ending balance ties to the subledger AR for {fmtPeriod(period)} ($0 variance).
            Sign-off block at section 7 of the audit pack indicates completion.
          </span>
        ) : variance === null ? (
          <span>
            <strong style={{ color: 'var(--severity-medium)' }}>In progress.</strong> Preparer
            ending balance has not been entered. Once entered and the rollforward variance ties
            to $0, the preparer sign-off unlocks.
          </span>
        ) : (
          <span>
            <strong style={{ color: 'var(--severity-high)' }}>Not yet ready for sign-off.</strong>{' '}
            Rollforward variance is currently <Mono>{variance.toFixed(2)}</Mono>. Investigate the
            AR Bridge variance walk and the open exceptions before signing.
          </span>
        )}
      </Section>
    </GlassCard>
  );
}

function HeaderCell({
  label,
  value,
  bordered,
}: {
  label: string;
  value: string;
  bordered?: boolean;
}) {
  return (
    <div
      style={{
        padding: '10px 18px',
        borderRight: bordered ? 'none' : '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
      }}
    >
      <div className="label" style={{ fontSize: 10 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ padding: '14px 22px', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div className="label" style={{ marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: 12,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        padding: '0 6px',
        borderRadius: 4,
        color: 'var(--text-primary)',
      }}
    >
      {children}
    </span>
  );
}

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 22,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

export default AuditMemoCard;
