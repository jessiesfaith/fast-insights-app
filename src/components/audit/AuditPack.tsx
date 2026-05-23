// Audit pack (BUILD.md §12) — the dedicated screen auditors review during
// month-end. Renders cover → three-way recon → AR bridge → aging → KPIs →
// exception summary → tickmark legend → sign-off, every key row carrying a
// clickable tickmark cluster that prints with the document.

import { useMemo, useState } from 'react';
import { Building2, Calculator, Calendar, ChevronDown, ChevronRight, FileBadge, FileSignature, ListChecks, ScrollText } from 'lucide-react';
import { ARData } from '../../types/data';
import { CATEGORY_LABEL, ExceptionCategory } from '../../types/exception';
import { SourceRef } from '../../types/recon';
import { ExceptionWorkflow, isResolved } from '../../types/workflow';
import { buildAging } from '../../lib/aging';
import { useDataStore } from '../../lib/dataStore';
import { runDetection } from '../../lib/detect';
import { buildKPIs } from '../../lib/kpis';
import { fmtDate, fmtDateTime, fmtMoney, fmtPct, fmtPeriod } from '../../lib/format';
import { STATUS_TONE } from '../../lib/uiColors';
import { ARBridgeLineRefs, buildARBridge, buildARBridgeRefs, buildThreeWay } from '../../lib/recon';
import { buildTickmarkSignoffs } from '../../lib/tickmarks';
import { TICKMARK_LEGEND_TITLE } from '../../types/audit';
import GlassCard from '../ui/GlassCard';
import EvidencePanel from '../exceptions/EvidencePanel';
import TickmarkCell from './TickmarkCell';
import TickmarkLegend from './TickmarkLegend';
import SignOffBlock from './SignOffBlock';
import ExportToolbar from './ExportToolbar';
import CompletenessEvidenceCard from './CompletenessEvidenceCard';
import AuditMemoCard from './AuditMemoCard';
import PeriodCloseSection from './PeriodCloseSection';
import BadDebtReserveCard from './BadDebtReserveCard';
import AuditPackStatus from './AuditPackStatus';
import PreparerEndingBlock from '../recon/PreparerEndingBlock';

interface Props {
  data: ARData;
  period: string;
}

export function AuditPack({ data, period }: Props) {
  const { signOff, operator, workflows, tickmarks, getBridgeBalance } = useDataStore();
  const recon = useMemo(() => buildThreeWay(data, period), [data, period]);
  const bridge = useMemo(() => buildARBridge(data, period), [data, period]);
  const aging = useMemo(() => buildAging(data, period), [data, period]);
  const kpis = useMemo(() => buildKPIs(data, period), [data, period]);
  const detection = useMemo(() => runDetection(data), [data]);
  const bridgeEntry = getBridgeBalance(period);
  const signoffs = useMemo(
    () => buildTickmarkSignoffs(tickmarks, data, period, bridgeEntry),
    [tickmarks, data, period, bridgeEntry],
  );

  const summaryByCategory = useMemo(() => {
    const map = new Map<ExceptionCategory, { count: number; impact: number; resolved: number }>();
    for (const e of detection.exceptions) {
      const wf = workflows[e.exception_id];
      const isDone = wf ? isResolved(wf.status) : false;
      const cur = map.get(e.category) ?? { count: 0, impact: 0, resolved: 0 };
      cur.count += 1;
      cur.impact += Math.abs(e.amount_impact);
      if (isDone) cur.resolved += 1;
      map.set(e.category, cur);
    }
    return [...map.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.impact - a.impact);
  }, [detection, workflows]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ExportToolbar period={period} />
      <AuditPackStatus data={data} period={period} />

      <PackSection first>
        <Cover period={period} entityName={signOff.entityName} operator={operator} />
      </PackSection>

      <PackSection>
        <SectionAnchor title="1. Three-way reconciliation" icon={<Building2 size={14} />} />
        <ReconSection recon={recon} data={data} />
      </PackSection>

      <PackSection>
        <SectionAnchor title="2. AR Bridge / roll-forward" icon={<ScrollText size={14} />} />
        <BridgeSection bridge={bridge} data={data} period={period} />
        <PreparerEndingBlock period={period} subledgerEnding={bridge.endingARSubledger} />
      </PackSection>

      <PackSection>
        <SectionAnchor title="3. Bad debt reserve" icon={<Calculator size={14} />} />
        <BadDebtReserveCard data={data} period={period} />
      </PackSection>

      <PackSection>
        <SectionAnchor title="4. Aging schedule" icon={<Calendar size={14} />} />
        <AgingSection aging={aging} />
      </PackSection>

      <PackSection>
        <SectionAnchor title="5. KPI summary" icon={<FileBadge size={14} />} />
        <KPISection kpis={kpis} />
      </PackSection>

      <PackSection>
        <SectionAnchor title="6. Exception summary" icon={<ListChecks size={14} />} />
        <ExceptionSummarySection
          summaryByCategory={summaryByCategory}
          exceptions={detection.exceptions}
          workflows={workflows}
          totalCount={detection.exceptions.length}
          totalImpact={detection.exceptions.reduce((s, e) => s + Math.abs(e.amount_impact), 0)}
        />
      </PackSection>

      <PackSection>
        <SectionAnchor title={`7. ${TICKMARK_LEGEND_TITLE}`} icon={<FileSignature size={14} />} />
        <TickmarkLegend />
      </PackSection>

      <PackSection>
        <SectionAnchor title="8. Sign-off" icon={<FileSignature size={14} />} />
        <SignOffBlock data={data} period={period} />
      </PackSection>

      <PackSection>
        <SectionAnchor title="9. Audit lead sheet" icon={<FileSignature size={14} />} />
        <AuditMemoCard data={data} period={period} />
      </PackSection>

      <PackSection>
        <SectionAnchor title="10. Tickmark sign-offs" icon={<FileSignature size={14} />} />
        <TickmarkSignoffsSection signoffs={signoffs} />
      </PackSection>

      <PackSection>
        <SectionAnchor title="11. Completeness evidence" icon={<FileBadge size={14} />} />
        <CompletenessEvidenceCard data={data} period={period} />
      </PackSection>

      <PackSection>
        <SectionAnchor title="12. Period close" icon={<FileSignature size={14} />} />
        <PeriodCloseSection data={data} period={period} />
      </PackSection>

      <PackFooter operator={operator} period={period} />
    </div>
  );
}

/** Wrap each top-level audit-pack section so the print stylesheet can give
 *  it its own page in the PDF. Also pads spacing in the on-screen view. */
function PackSection({
  children,
  first,
}: {
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <section
      className="audit-pack-section"
      data-first={first ? 'true' : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      {children}
    </section>
  );
}

// ---- cover ---------------------------------------------------------------

function Cover({
  period,
  entityName,
  operator,
}: {
  period: string;
  entityName: string;
  operator: string | null;
}) {
  const { setSignOffField } = useDataStore();
  const generatedAt = new Date().toISOString();
  return (
    <GlassCard variant="strong" style={{ padding: 28 }}>
      <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 8 }}>
        <span className="label">AR Tool-Beta · Audit pack</span>
      </div>
      <h1 style={{ fontSize: 28, lineHeight: 1.2 }}>
        Reconciliation pack — {fmtPeriod(period)}
      </h1>
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, alignItems: 'flex-start' }}>
        <div>
          <label className="label" style={{ display: 'block', marginBottom: 4 }}>Entity</label>
          <input
            value={entityName}
            onChange={(e) => setSignOffField('entityName', e.target.value)}
            placeholder="Entity name (e.g., Acme Pharmaceuticals, Inc.)"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 15,
              fontWeight: 600,
              outline: 'none',
            }}
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
          }}
        >
          <CoverMeta label="Period" value={fmtPeriod(period)} />
          <CoverMeta label="Generated" value={fmtDateTime(generatedAt)} />
          <CoverMeta label="Generated by" value={operator ?? '—'} />
          <CoverMeta label="Tool" value="AR Tool-Beta v0.1" />
        </div>
      </div>
    </GlassCard>
  );
}

function CoverMeta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
      <div className="label">{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

// ---- section anchor ------------------------------------------------------

function SectionAnchor({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <h2 className="row gap-2" style={{ alignItems: 'center', fontSize: 16, marginTop: 8 }}>
      <span
        className="center"
        style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)' }}
      >
        {icon}
      </span>
      {title}
    </h2>
  );
}

// ---- recon ---------------------------------------------------------------

function ReconSection({ recon, data }: { recon: ReturnType<typeof buildThreeWay>; data: ARData }) {
  const subVsGL = recon.subledgerVsGL.variance;
  const ties = Math.abs(subVsGL) < 0.01;
  return (
    <GlassCard>
      <table className="fin-table">
        <thead>
          <tr>
            <th>Side</th>
            <th>As of</th>
            <th>Item count</th>
            <th style={{ textAlign: 'right' }}>Balance</th>
            <th>Tickmarks</th>
          </tr>
        </thead>
        <tbody>
          <ReconRow id="sub" label="A. Subledger AR" balance={recon.subledgerAR} />
          <ReconRow id="gl"  label="B. GL 1200" balance={recon.gl1200} />
          <ReconRow id="bank" label="C. Bank cleared" balance={recon.bankCleared} />
        </tbody>
      </table>
      <hr className="glass-divider" />
      <ReconWalkBlock title="Subledger ↔ GL variance" walk={recon.subledgerVsGL} data={data} />
      <ReconWalkBlock title="GL ↔ Bank variance" walk={recon.glVsBank} data={data} />
      <div
        className="between"
        style={{
          marginTop: 8,
          padding: '10px 12px',
          background: ties ? 'var(--severity-resolved-bg)' : 'var(--severity-medium-bg)',
          color: ties ? 'var(--severity-resolved)' : 'var(--severity-medium)',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        <span>{ties ? 'Subledger ties to GL.' : 'Subledger and GL differ — see reconciling items above.'}</span>
        <span className="num">{fmtMoney(subVsGL, 0)}</span>
      </div>
    </GlassCard>
  );
}

function ReconRow({ id, label, balance }: { id: string; label: string; balance: { amount: number; count: number; asOf: string } }) {
  return (
    <tr>
      <td style={{ fontWeight: 600 }}>{label}</td>
      <td>{fmtDate(balance.asOf)}</td>
      <td className="num">{balance.count}</td>
      <td className="num" style={{ fontWeight: 700 }}>{fmtMoney(balance.amount, 0)}</td>
      <td><TickmarkCell type="recon" id={id} /></td>
    </tr>
  );
}

function ReconWalkBlock({
  title,
  walk,
  data,
}: {
  title: string;
  walk: { variance: number; items: { id: string; label: string; amount: number; description: string; source_records: SourceRef[] }[] };
  data: ARData;
}) {
  if (walk.items.length === 0) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div className="between" style={{ marginBottom: 6 }}>
        <span className="label">{title}</span>
        <span className="num" style={{ fontWeight: 600, color: 'var(--severity-medium)' }}>{fmtMoney(walk.variance, 0)}</span>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {walk.items.map((it) => (
          <ReconWalkItem key={it.id} item={it} data={data} />
        ))}
      </ul>
    </div>
  );
}

function ReconWalkItem({
  item,
  data,
}: {
  item: { id: string; label: string; amount: number; description: string; source_records: SourceRef[] };
  data: ARData;
}) {
  const [open, setOpen] = useState(false);
  const expandable = item.source_records.length > 0;
  return (
    <li
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div className="between" style={{ padding: '8px 12px', fontSize: 13 }}>
        <button
          type="button"
          onClick={() => expandable && setOpen((v) => !v)}
          aria-expanded={open}
          disabled={!expandable}
          className="row gap-2"
          style={{
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: 'inherit',
            textAlign: 'left',
            cursor: expandable ? 'pointer' : 'default',
            flex: 1,
            minWidth: 0,
          }}
        >
          {expandable ? (
            open ? <ChevronDown size={12} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />
          ) : (
            <span style={{ width: 12 }} />
          )}
          <span style={{ minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>{item.label}</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 12, marginLeft: 8 }}>{item.description}</span>
          </span>
        </button>
        <span className="row gap-3" style={{ alignItems: 'center' }}>
          <span className="num" style={{ fontWeight: 600 }}>
            {item.amount === 0 ? 'timing' : fmtMoney(item.amount, 0)}
          </span>
          <TickmarkCell type="recon" id={item.id} />
        </span>
      </div>
      {open && expandable && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 12px' }}>
          <EvidencePanel sourceRecords={item.source_records} data={data} maxHeight={300} />
        </div>
      )}
    </li>
  );
}

// ---- bridge --------------------------------------------------------------

function BridgeSection({
  bridge,
  data,
  period,
}: {
  bridge: ReturnType<typeof buildARBridge>;
  data: ARData;
  period: string;
}) {
  const refs = buildARBridgeRefs(data, period);
  const lines: {
    id: string;
    refsKey: keyof ARBridgeLineRefs;
    label: string;
    amount: number;
    sign: '+' | '−' | '±' | '=';
  }[] = [
    { id: 'beg',     refsKey: 'beginning',      label: 'Beginning AR',         amount: bridge.beginningAR,       sign: '=' },
    { id: 'bill',    refsKey: 'billings',       label: 'Billings (new)',        amount: bridge.billings,          sign: '+' },
    { id: 'cash',    refsKey: 'cashApplied',    label: 'Cash applied',          amount: -bridge.cashApplied,      sign: '−' },
    { id: 'credits', refsKey: 'creditsApplied', label: 'Credit memos applied',  amount: -bridge.creditsApplied,   sign: '−' },
    { id: 'wo',      refsKey: 'writeOffs',      label: 'Write-offs',            amount: -bridge.writeOffs,        sign: '−' },
    { id: 'adj',     refsKey: 'adjustments',    label: 'Adjustments',           amount: bridge.adjustments,       sign: '±' },
  ];
  return (
    <GlassCard padding={0}>
      <ul style={{ listStyle: 'none', margin: 0, padding: '0 18px' }}>
        {lines.map((l) => (
          <BridgeAuditRow
            key={l.id}
            id={l.id}
            label={l.label}
            sign={l.sign}
            amount={l.amount}
            sourceRecords={refs[l.refsKey]}
            data={data}
          />
        ))}
        <li
          className="between"
          style={{
            padding: '14px 0 16px',
            borderTop: '2px solid var(--border-strong)',
            marginTop: 4,
          }}
        >
          <span className="row gap-2" style={{ alignItems: 'center', fontWeight: 700 }}>
            <span style={{ width: 18, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>=</span>
            <span>Ending AR (computed)</span>
          </span>
          <span className="row gap-3" style={{ alignItems: 'center' }}>
            <span className="num" style={{ fontWeight: 700 }}>{fmtMoney(bridge.endingARComputed, 0)}</span>
            <TickmarkCell type="bridge" id="ending" />
          </span>
        </li>
      </ul>
      <div
        className="between"
        style={{
          margin: '0 18px 16px',
          padding: '10px 12px',
          background: bridge.ties ? 'var(--severity-resolved-bg)' : 'var(--severity-high-bg)',
          color: bridge.ties ? 'var(--severity-resolved)' : 'var(--severity-high)',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span>{bridge.ties ? 'Ties to ending subledger AR.' : 'Variance vs ending subledger AR'}</span>
        <span className="row gap-3">
          <span className="num">{fmtMoney(bridge.endingARSubledger, 0)}</span>
          <span className="num" style={{ color: bridge.ties ? 'var(--severity-resolved)' : 'var(--severity-high)' }}>
            Δ {fmtMoney(bridge.variance, 0)}
          </span>
        </span>
      </div>
    </GlassCard>
  );
}

function BridgeAuditRow({
  id,
  label,
  sign,
  amount,
  sourceRecords,
  data,
}: {
  id: string;
  label: string;
  sign: '+' | '−' | '±' | '=';
  amount: number;
  sourceRecords: SourceRef[];
  data: ARData;
}) {
  const [open, setOpen] = useState(false);
  const expandable = sourceRecords.length > 0;
  return (
    <li style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="between" style={{ padding: '10px 0', fontSize: 13 }}>
        <button
          type="button"
          onClick={() => expandable && setOpen((v) => !v)}
          aria-expanded={open}
          disabled={!expandable}
          className="row gap-2"
          style={{
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: 'inherit',
            textAlign: 'left',
            cursor: expandable ? 'pointer' : 'default',
          }}
        >
          {expandable ? (
            open ? <ChevronDown size={12} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />
          ) : (
            <span style={{ width: 12 }} />
          )}
          <span style={{ width: 18, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{sign}</span>
          <span style={{ fontWeight: 600 }}>{label}</span>
          {expandable && (
            <span
              className="glass-pill"
              style={{ fontSize: 10, padding: '1px 7px', background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}
            >
              {sourceRecords.length}
            </span>
          )}
        </button>
        <span className="row gap-3" style={{ alignItems: 'center' }}>
          <span className="num">{fmtMoney(amount, 0)}</span>
          <TickmarkCell type="bridge" id={id} />
        </span>
      </div>
      {open && expandable && (
        <div style={{ padding: '0 0 12px 32px' }}>
          <EvidencePanel sourceRecords={sourceRecords} data={data} maxHeight={280} />
        </div>
      )}
    </li>
  );
}

// ---- aging ---------------------------------------------------------------

function AgingSection({ aging }: { aging: ReturnType<typeof buildAging> }) {
  const totalCount = aging.totals.reduce((s, t) => s + t.count, 0);
  return (
    <GlassCard padding={0}>
      <header className="between" style={{ padding: '14px 18px 6px' }}>
        <div>
          <div className="label">As of {fmtDate(aging.asOf)}</div>
          <h3 style={{ marginTop: 4 }}>{fmtMoney(aging.totalOpenAR, 0)} total open</h3>
        </div>
      </header>
      {/* Standard aging-format layout — buckets across the top, metrics
          ($ amount, % of total, invoice count) flowing in rows. Tickmark row
          at the bottom so each bucket can still be signed off. */}
      <table className="fin-table">
        <thead>
          <tr>
            <th></th>
            {aging.totals.map((t) => (
              <th key={t.bucket} style={{ textAlign: 'right' }}>
                {t.bucket === 'Current' ? 'Current' : `${t.bucket} d`}
              </th>
            ))}
            <th style={{ textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ fontWeight: 600 }}>$ amount</td>
            {aging.totals.map((t) => (
              <td key={t.bucket} className="num">{fmtMoney(t.amount, 0)}</td>
            ))}
            <td className="num" style={{ fontWeight: 700 }}>{fmtMoney(aging.totalOpenAR, 0)}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600 }}>% of total</td>
            {aging.totals.map((t) => (
              <td key={t.bucket} className="num">
                {aging.totalOpenAR > 0 ? fmtPct(t.amount / aging.totalOpenAR, 1) : '—'}
              </td>
            ))}
            <td className="num" style={{ fontWeight: 700 }}>
              {aging.totalOpenAR > 0 ? '100.0%' : '—'}
            </td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600 }}>Invoice count</td>
            {aging.totals.map((t) => (
              <td key={t.bucket} className="num">{t.count.toLocaleString()}</td>
            ))}
            <td className="num" style={{ fontWeight: 700 }}>{totalCount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600 }}>Tickmarks</td>
            {aging.totals.map((t) => (
              <td key={t.bucket}><TickmarkCell type="aging" id={t.bucket} /></td>
            ))}
            <td></td>
          </tr>
        </tbody>
      </table>
      <hr className="glass-divider" style={{ margin: '8px 18px' }} />
      <div className="label" style={{ padding: '0 18px 6px' }}>Top 10 customers</div>
      <table className="fin-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th style={{ textAlign: 'right' }}>Open AR</th>
            <th style={{ textAlign: 'right' }}>% of total</th>
            <th>Tickmarks</th>
          </tr>
        </thead>
        <tbody>
          {aging.byCustomer.slice(0, 10).map((c) => (
            <tr key={c.customer_id}>
              <td>
                <div style={{ fontWeight: 600 }}>{c.customer_name}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{c.customer_id}</div>
              </td>
              <td className="num">{fmtMoney(c.total, 0)}</td>
              <td className="num">{aging.totalOpenAR > 0 ? fmtPct(c.total / aging.totalOpenAR, 1) : '—'}</td>
              <td><TickmarkCell type="aging" id={c.customer_id} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}

// ---- KPI -----------------------------------------------------------------

function KPISection({ kpis }: { kpis: ReturnType<typeof buildKPIs> }) {
  return (
    <GlassCard padding={0}>
      <table className="fin-table">
        <thead>
          <tr>
            <th>KPI</th>
            <th style={{ textAlign: 'right' }}>Value</th>
            <th style={{ textAlign: 'right' }}>Prior period</th>
            <th style={{ textAlign: 'right' }}>Δ</th>
            <th>Tickmarks</th>
          </tr>
        </thead>
        <tbody>
          {kpis.results.map((k) => (
            <tr key={k.key}>
              <td style={{ fontWeight: 600 }}>{k.label}</td>
              <td className="num">{formatKPI(k.current, k.unit)}</td>
              <td className="num" style={{ color: 'var(--text-tertiary)' }}>{k.prior == null ? '—' : formatKPI(k.prior, k.unit)}</td>
              <td className="num">{k.delta == null ? '—' : formatKPI(k.delta, k.unit, true)}</td>
              <td><TickmarkCell type="kpi" id={k.key} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}

function formatKPI(v: number, unit: string, signed = false) {
  const sign = signed && v > 0 ? '+' : '';
  if (unit === 'money') return `${sign}${fmtMoney(v, 0)}`;
  if (unit === 'pct')   return `${sign}${(v * 100).toFixed(1)}%`;
  if (unit === 'days')  return `${sign}${Math.round(v)}d`;
  return String(v);
}

// ---- exception summary ---------------------------------------------------

function ExceptionSummarySection({
  summaryByCategory,
  exceptions,
  workflows,
  totalCount,
  totalImpact,
}: {
  summaryByCategory: { category: ExceptionCategory; count: number; impact: number; resolved: number }[];
  exceptions: ReturnType<typeof runDetection>['exceptions'];
  workflows: Record<string, ExceptionWorkflow>;
  totalCount: number;
  totalImpact: number;
}) {
  // Group the full exception list by category once so each expandable row can
  // pull its own slice without re-iterating every render.
  const byCategory = useMemo(() => {
    const map = new Map<ExceptionCategory, typeof exceptions>();
    for (const e of exceptions) {
      const arr = map.get(e.category) ?? [];
      arr.push(e);
      map.set(e.category, arr);
    }
    return map;
  }, [exceptions]);

  return (
    <GlassCard padding={0}>
      <header className="between" style={{ padding: '14px 18px 6px' }}>
        <div>
          <div className="label">Detected exceptions</div>
          <h3 style={{ marginTop: 4 }}>
            {totalCount.toLocaleString()} total · {fmtMoney(totalImpact, 0)} impact
          </h3>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          Click a category to expand the per-exception detail and reviewer comments.
        </div>
      </header>
      <table className="fin-table">
        <thead>
          <tr>
            <th></th>
            <th>Category</th>
            <th style={{ textAlign: 'right' }}>Count</th>
            <th style={{ textAlign: 'right' }}>Resolved</th>
            <th style={{ textAlign: 'right' }}>Impact</th>
            <th>Tickmarks</th>
          </tr>
        </thead>
        <tbody>
          {summaryByCategory.map((row) => (
            <ExceptionCategoryRow
              key={row.category}
              row={row}
              items={byCategory.get(row.category) ?? []}
              workflows={workflows}
            />
          ))}
          {summaryByCategory.length === 0 && (
            <tr><td colSpan={6} style={{ padding: 18, textAlign: 'center', color: 'var(--text-tertiary)' }}>No exceptions detected.</td></tr>
          )}
        </tbody>
      </table>
    </GlassCard>
  );
}

function ExceptionCategoryRow({
  row,
  items,
  workflows,
}: {
  row: { category: ExceptionCategory; count: number; impact: number; resolved: number };
  items: ReturnType<typeof runDetection>['exceptions'];
  workflows: Record<string, ExceptionWorkflow>;
}) {
  const [open, setOpen] = useState(false);
  const expandable = items.length > 0;
  const sorted = useMemo(
    () => [...items].sort((a, b) => Math.abs(b.amount_impact) - Math.abs(a.amount_impact)),
    [items],
  );
  return (
    <>
      <tr
        onClick={() => expandable && setOpen((v) => !v)}
        style={{
          cursor: expandable ? 'pointer' : 'default',
          background: open ? 'var(--accent-soft)' : undefined,
        }}
      >
        <td style={{ width: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          {expandable ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
        </td>
        <td style={{ fontWeight: 600 }}>{CATEGORY_LABEL[row.category]}</td>
        <td className="num">{row.count}</td>
        <td className="num">
          <span style={{ color: row.resolved === row.count ? 'var(--severity-resolved)' : 'var(--text-secondary)' }}>
            {row.resolved} / {row.count}
          </span>
        </td>
        <td className="num" style={{ fontWeight: 600 }}>{fmtMoney(row.impact, 0)}</td>
        <td onClick={(e) => e.stopPropagation()}><TickmarkCell type="exception" id={row.category} /></td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} style={{ padding: '10px 18px 18px 18px', background: 'var(--bg-elevated)' }}>
            <ExceptionDetailList items={sorted} workflows={workflows} />
          </td>
        </tr>
      )}
    </>
  );
}

function ExceptionDetailList({
  items,
  workflows,
}: {
  items: ReturnType<typeof runDetection>['exceptions'];
  workflows: Record<string, ExceptionWorkflow>;
}) {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {items.map((e) => {
        const wf = workflows[e.exception_id];
        const status = wf?.status ?? 'Open';
        const done = isResolved(status);
        const comments = (wf?.audit_log ?? []).filter((entry) => entry.action === 'commented');
        return (
          <li
            key={e.exception_id}
            className="severity-strip"
            data-severity={done ? 'resolved' : e.severity}
            style={{
              padding: '8px 12px 8px 18px',
              background: 'var(--bg-elevated-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              opacity: done ? 0.85 : 1,
            }}
          >
            <div className="between" style={{ flexWrap: 'wrap', gap: 8 }}>
              <span className="row gap-2" style={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: 'var(--accent-soft)',
                    color: 'var(--accent-hover)',
                  }}
                >
                  {e.exception_id.slice(-8)}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {e.customer_id ?? '—'}
                </span>
                <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.description}
                </span>
              </span>
              <span className="row gap-2" style={{ alignItems: 'center', flexShrink: 0 }}>
                <StatusPill status={status} />
                {wf?.assignee && (
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>@ {wf.assignee}</span>
                )}
                <span
                  className="num"
                  style={{
                    fontWeight: 700,
                    color: done ? 'var(--severity-resolved)' : 'var(--text-primary)',
                    textDecoration: done ? 'line-through' : undefined,
                  }}
                >
                  {fmtMoney(e.amount_impact, 0)}
                </span>
                <TickmarkCell type="exception" id={e.exception_id} />
              </span>
            </div>
            {wf?.resolution_note && done && (
              <div
                style={{
                  marginTop: 6,
                  padding: '6px 10px',
                  background: 'var(--severity-resolved-bg)',
                  borderRadius: 6,
                  fontSize: 11,
                  color: 'var(--text-primary)',
                }}
              >
                <span className="label" style={{ marginRight: 6, color: 'var(--severity-resolved)' }}>Resolution</span>
                {wf.resolution_note}
              </div>
            )}
            {comments.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div className="label" style={{ marginBottom: 4 }}>
                  Comments ({comments.length})
                </div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {comments.map((c, i) => (
                    <li
                      key={i}
                      style={{
                        padding: '6px 10px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        fontSize: 11,
                      }}
                    >
                      <div className="row gap-2" style={{ alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{c.actor}</span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>
                          {fmtDateTime(c.timestamp)}
                        </span>
                      </div>
                      <div style={{ marginTop: 2, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                        {c.note}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function StatusPill({ status }: { status: ExceptionWorkflow['status'] }) {
  const tone = STATUS_TONE[status];
  return (
    <span
      style={{
        padding: '1px 8px',
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

// ---- tickmark sign-offs --------------------------------------------------

function TickmarkSignoffsSection({
  signoffs,
}: {
  signoffs: ReturnType<typeof buildTickmarkSignoffs>;
}) {
  if (signoffs.length === 0) {
    return (
      <GlassCard padding={14}>
        <div className="label" style={{ marginBottom: 4 }}>Tickmark sign-offs</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          No tickmarks have been clicked yet. Click any (a)–(d) cell on a row to sign off.
        </div>
      </GlassCard>
    );
  }
  return (
    <GlassCard padding={0}>
      <header className="between" style={{ padding: '14px 18px 6px' }}>
        <div>
          <div className="label">Tickmark sign-offs</div>
          <h3 style={{ marginTop: 4 }}>
            {signoffs.length} sign-off{signoffs.length === 1 ? '' : 's'} across{' '}
            {new Set(signoffs.map((s) => `${s.type}:${s.rowId}`)).size} line item{new Set(signoffs.map((s) => `${s.type}:${s.rowId}`)).size === 1 ? '' : 's'}
          </h3>
        </div>
      </header>
      <table className="fin-table">
        <thead>
          <tr>
            <th>Section</th>
            <th>Line item</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
            <th>Tickmark</th>
            <th>Meaning</th>
            <th>Signed by</th>
            <th>Signed at</th>
          </tr>
        </thead>
        <tbody>
          {signoffs.map((s, i) => {
            const isSynthetic = (s.letter as unknown as string) === '*';
            return (
              <tr key={`${s.type}:${s.rowId}:${s.letter}:${i}`}>
                <td>{s.section}</td>
                <td>
                  <span className="mono" style={{ fontSize: 12 }}>{s.line}</span>
                </td>
                <td className="num">
                  {s.amount == null ? '—' : fmtMoney(s.amount, 0)}
                </td>
                <td>
                  {isSynthetic ? (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      —
                    </span>
                  ) : (
                    <span
                      className="mono"
                      style={{
                        display: 'inline-block',
                        padding: '1px 8px',
                        background: 'var(--accent)',
                        color: 'var(--accent-contrast)',
                        borderRadius: 4,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {s.letter}
                    </span>
                  )}
                </td>
                <td style={isSynthetic ? { fontStyle: 'italic', color: 'var(--text-tertiary)' } : undefined}>
                  {s.meaning}
                </td>
                <td style={{ fontWeight: 600 }}>{s.actor}</td>
                <td>{s.timestamp ? fmtDateTime(s.timestamp) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </GlassCard>
  );
}

// ---- footer --------------------------------------------------------------

function PackFooter({ operator, period }: { operator: string | null; period: string }) {
  return (
    <div
      className="between"
      style={{
        marginTop: 8,
        padding: '14px 18px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        fontSize: 11,
        color: 'var(--text-tertiary)',
      }}
    >
      <span>AR Tool-Beta · audit pack · {fmtPeriod(period)}</span>
      <span>
        Generated {fmtDateTime(new Date().toISOString())}
        {operator ? ` by ${operator}` : ''}
      </span>
    </div>
  );
}

export default AuditPack;
