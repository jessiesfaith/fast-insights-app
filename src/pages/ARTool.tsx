import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import ThemeToggle from '../components/ui/ThemeToggle';
import PeriodSelector from '../components/ui/PeriodSelector';
import CSVUpload from '../components/upload/CSVUpload';
import ImportSummaryView from '../components/upload/ImportSummary';
import ThreeWayReconCard from '../components/recon/ThreeWayReconCard';
import ARBridgeCard from '../components/recon/ARBridgeCard';
import KPIRow from '../components/kpis/KPIRow';
import AgingChart from '../components/aging/AgingChart';
import AgingTable from '../components/aging/AgingTable';
import BadDebtReserveCard from '../components/audit/BadDebtReserveCard';
import ExceptionsView from '../components/exceptions/ExceptionsView';
import CustomerDrillDown from '../components/customers/CustomerDrillDown';
import AuditPack from '../components/audit/AuditPack';
import OperatorBadge from '../components/ui/OperatorBadge';
import RoleBadge from '../components/ui/RoleBadge';
import ShortcutsHelp from '../components/ui/ShortcutsHelp';
import FilterBar from '../components/layout/FilterBar';
import { DataStoreProvider, useDataStore } from '../lib/dataStore';
import { LockedPeriodProvider } from '../lib/lockedPeriod';
import { ScenarioProvider, useScenario } from '../lib/scenarioStore';
import { availablePeriods, defaultPeriod, periodBounds } from '../lib/period';
import { activeFilterCount, isScenarioPristine } from '../types/scenario';
import { applyScenario } from '../lib/scenario';
import { ARData } from '../types/data';
import { buildAging } from '../lib/aging';
import { fmtMoney } from '../lib/format';
import { isTypingTarget } from '../lib/shortcuts';
import { Maximize2, Minimize2, Presentation } from 'lucide-react';

type MilestoneStatus = 'done' | 'in_progress' | 'pending';
interface MilestoneEntry { n: number; label: string; status: MilestoneStatus }
const MILESTONES: MilestoneEntry[] = [
  { n: 1, label: 'Project scaffold', status: 'done' },
  { n: 2, label: 'CSV ingestion', status: 'done' },
  { n: 3, label: 'Three-way recon', status: 'done' },
  { n: 4, label: 'KPI tiles + aging', status: 'done' },
  { n: 5, label: 'Exception detection', status: 'done' },
  { n: 6, label: 'Workflow + audit log', status: 'done' },
  { n: 7, label: 'Customer drill-down', status: 'done' },
  { n: 8, label: 'Scenario engine', status: 'done' },
  { n: 9, label: 'Audit pack + tickmarks', status: 'done' },
  { n: 10, label: 'Exports (PDF / XLSX / JSON)', status: 'done' },
  { n: 11, label: 'Polish + a11y', status: 'done' },
  { n: 12, label: 'Tests + acceptance sweep', status: 'done' },
];

export default function ARTool() {
  return (
    <DataStoreProvider>
      <ScenarioProvider>
        <Shell />
      </ScenarioProvider>
    </DataStoreProvider>
  );
}

type ShellView = 'upload' | 'dashboard' | 'exceptions' | 'customer' | 'audit';

function Shell() {
  const { hasData, summaries, data } = useDataStore();
  const { scenario, togglePresentation } = useScenario();
  const fullyLoaded = summaries.length === 6;

  const periods = useMemo(() => availablePeriods(data), [data]);
  const [period, setPeriod] = useState<string>(() => defaultPeriod(data) ?? '');
  useEffect(() => {
    if (period && periods.includes(period)) return;
    const next = defaultPeriod(data);
    if (next) setPeriod(next);
  }, [data, period, periods]);

  // P-key toggles presentation mode; ignored when typing in inputs/textareas.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'p' && e.key !== 'P') return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      togglePresentation();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePresentation]);

  // Scenario-applied view of the data — every child component renders from this.
  const asOf = period ? periodBounds(period).end : '';
  const viewData: ARData = useMemo(() => {
    if (!period) return data;
    if (isScenarioPristine(scenario)) return data;
    return applyScenario(data, scenario, asOf);
  }, [data, scenario, asOf, period]);

  const [view, setView] = useState<ShellView>(() =>
    hasData && fullyLoaded ? 'dashboard' : 'upload',
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [focusExceptionId, setFocusExceptionId] = useState<string | null>(null);
  const effectiveView: ShellView = hasData && fullyLoaded ? view : 'upload';

  // Per-tab scroll memory — switching tabs stashes the current scroll
  // position and restores the new tab's last position on the next paint,
  // so the user doesn't lose their place between Dashboard / Exceptions /
  // Audit pack.
  const scrollByViewRef = useRef<Partial<Record<ShellView, number>>>({});

  const openCustomer = (id: string) => {
    if (typeof window !== 'undefined') {
      scrollByViewRef.current[effectiveView] = window.scrollY;
    }
    setSelectedCustomerId(id);
    setView('customer');
  };
  const openException = (id: string) => {
    if (typeof window !== 'undefined') {
      scrollByViewRef.current[effectiveView] = window.scrollY;
    }
    setFocusExceptionId(id);
    setView('exceptions');
  };
  const switchView = (v: ShellView) => {
    if (typeof window !== 'undefined') {
      scrollByViewRef.current[effectiveView] = window.scrollY;
    }
    if (v !== 'customer') setSelectedCustomerId(null);
    // keep focusExceptionId cleared on every view-change — this ref is only
    // meaningful when openException() set it, and it's read once on entry
    if (v !== 'exceptions') setFocusExceptionId(null);
    setView(v);
  };

  // Restore scroll position when the active view changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const target = scrollByViewRef.current[effectiveView] ?? 0;
    const id = requestAnimationFrame(() => {
      window.scrollTo({ top: target, behavior: 'auto' });
    });
    return () => cancelAnimationFrame(id);
  }, [effectiveView]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!scenario.presentation && <TopBar onSwitchView={switchView} view={effectiveView} />}
      <main
        style={{
          flex: 1,
          padding: scenario.presentation ? '24px 32px' : '32px 40px',
          maxWidth: scenario.presentation ? 1600 : 1320,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Render every "main" view simultaneously and toggle visibility
            via display:none so each tab keeps its internal state (selected
            exception, sort orders, filter chip selections, etc.). The
            customer view is the exception — it's keyed off the currently
            selected customer and remounts on each pick.

            data-print-view tags drive the print stylesheet so the PDF
            export prints Dashboard → Exceptions → Audit pack regardless
            of which tab is currently active. */}
        <div data-print-view="upload" style={{ display: effectiveView === 'upload' ? 'block' : 'none' }}>
          <UploadView onContinue={() => switchView('dashboard')} />
        </div>
        {hasData && fullyLoaded && (
          <>
            <div data-print-view="dashboard" style={{ display: effectiveView === 'dashboard' ? 'block' : 'none' }}>
              <PrintSectionHeader title="Dashboard" />
              <LockedPeriodProvider period={period || null}>
                <Dashboard
                  data={viewData}
                  rawData={data}
                  period={period}
                  periods={periods}
                  onChangePeriod={setPeriod}
                  onSelectCustomer={openCustomer}
                />
              </LockedPeriodProvider>
            </div>
            <div data-print-view="exceptions" style={{ display: effectiveView === 'exceptions' ? 'block' : 'none' }}>
              <PrintSectionHeader title="Exception triage" />
              <ExceptionsView
                data={viewData}
                initialSelectedId={focusExceptionId ?? undefined}
                onSelectCustomer={openCustomer}
              />
            </div>
            <div data-print-view="audit" style={{ display: effectiveView === 'audit' ? 'block' : 'none' }}>
              <PrintSectionHeader title="Audit pack" />
              <LockedPeriodProvider period={period || null}>
                {period && <AuditPack data={viewData} period={period} />}
              </LockedPeriodProvider>
            </div>
            <div data-print-view="customer" style={{ display: effectiveView === 'customer' ? 'block' : 'none' }}>
              {selectedCustomerId && period && (
                <CustomerDrillDown
                  key={selectedCustomerId}
                  customerId={selectedCustomerId}
                  period={period}
                  data={viewData}
                  onBack={() => switchView('dashboard')}
                  onSelectException={openException}
                />
              )}
            </div>
          </>
        )}
      </main>
      {!scenario.presentation && <Footer />}
      {scenario.presentation && <PresentationFooter />}
      <ShortcutsHelp />
    </div>
  );
}

function UploadView({ onContinue }: { onContinue: () => void }) {
  const { hasData, summaries } = useDataStore();
  return (
    <>
      <Hero />
      <section style={{ marginTop: 24 }}>
        <CSVUpload />
      </section>
      {hasData && (
        <section style={{ marginTop: 16 }}>
          <ImportSummaryView summaries={summaries} onContinue={summaries.length === 6 ? onContinue : undefined} />
        </section>
      )}
      <section style={{ marginTop: 24 }}>
        <BuildProgress />
      </section>
    </>
  );
}

interface DashboardProps {
  data: ARData;
  rawData: ARData;
  period: string;
  periods: string[];
  onChangePeriod: (p: string) => void;
  onSelectCustomer: (id: string) => void;
}

function Dashboard({ data, rawData, period, periods, onChangePeriod, onSelectCustomer }: DashboardProps) {
  const { scenario } = useScenario();

  if (!period) {
    return (
      <GlassCard>
        <h2>No periods detected in loaded data.</h2>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 8 }}>
          Upload at least one of <span className="mono">invoices.csv</span>,{' '}
          <span className="mono">cash_receipts.csv</span>, or{' '}
          <span className="mono">gl_entries.csv</span> with parseable dates.
        </p>
      </GlassCard>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DashboardHeader period={period} periods={periods} onChange={onChangePeriod} />
      {!scenario.presentation && (
        // Sticky so it stays in view while scrolling through KPIs / recon /
        // aging. `top: 64` clears the sticky top bar (~60px). z-index is
        // higher than the cards below (which create stacking contexts via
        // backdrop-filter) so the bar — and its portaled dropdowns —
        // overlay everything cleanly.
        <GlassCard
          padding={14}
          style={{
            position: 'sticky',
            top: 64,
            zIndex: 30,
            overflow: 'visible',
          }}
        >
          <FilterBar data={rawData} />
        </GlassCard>
      )}
      <KPIRow data={data} period={period} />
      <ThreeWayReconCard data={data} period={period} />
      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <ARBridgeCard data={data} period={period} />
        <AgingCard data={data} period={period} />
      </section>
      <BadDebtReserveCard data={data} period={period} compact />
      <AgingTableCard data={data} period={period} onSelectCustomer={onSelectCustomer} />
    </div>
  );
}

function AgingCard({ data, period }: { data: ReturnType<typeof useDataStore>['data']; period: string }) {
  const aging = buildAging(data, period);
  return (
    <GlassCard>
      <header className="between" style={{ marginBottom: 12 }}>
        <div>
          <div className="label">Aging schedule</div>
          <h2 style={{ marginTop: 4 }}>Open AR by bucket</h2>
        </div>
        <span className="glass-pill">
          <span className="num">{fmtMoney(aging.totalOpenAR, 0)}</span>
        </span>
      </header>
      <AgingChart aging={aging} />
    </GlassCard>
  );
}

function AgingTableCard({
  data,
  period,
  onSelectCustomer,
}: {
  data: ReturnType<typeof useDataStore>['data'];
  period: string;
  onSelectCustomer?: (id: string) => void;
}) {
  const aging = buildAging(data, period);
  return (
    <GlassCard padding={0}>
      <header className="between" style={{ padding: '16px 20px 8px' }}>
        <div>
          <div className="label">Customer breakdown</div>
          <h3 style={{ marginTop: 4 }}>Aging by customer · click a row to drill in</h3>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          {aging.byCustomer.length} customer{aging.byCustomer.length === 1 ? '' : 's'} with open AR
        </div>
      </header>
      <AgingTable aging={aging} onSelectCustomer={onSelectCustomer} />
    </GlassCard>
  );
}

function DashboardHeader({
  period,
  periods,
  onChange,
}: {
  period: string;
  periods: string[];
  onChange: (p: string) => void;
}) {
  const { data, clearData } = useDataStore();
  const { scenario, togglePresentation } = useScenario();
  const totalAR = data.invoices
    .filter((i) => i.status === 'Open' || i.status === 'Short Pay - Open')
    .reduce((s, i) => s + i.total_amount, 0);
  const filterCount = activeFilterCount(scenario);

  return (
    <div className="between" style={{ flexWrap: 'wrap', gap: 12 }}>
      <div>
        <div className="label">Dashboard</div>
        <h1 style={{ marginTop: 4, fontSize: 22 }}>AR reconciliation</h1>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
          Open invoice volume <span className="num" style={{ color: 'var(--text-secondary)' }}>{fmtMoney(totalAR, 0)}</span>
          {filterCount > 0 && (
            <span style={{ marginLeft: 8, color: 'var(--accent)' }}>
              · {filterCount} filter{filterCount === 1 ? '' : 's'} active
            </span>
          )}
        </div>
      </div>
      <div className="row gap-2" style={{ alignItems: 'center' }}>
        <PeriodSelector value={period} options={periods} onChange={onChange} />
        <button
          type="button"
          onClick={togglePresentation}
          title="Presentation mode (P)"
          className="row gap-1"
          style={{
            alignItems: 'center',
            background: scenario.presentation ? 'var(--accent)' : 'transparent',
            color: scenario.presentation ? 'var(--accent-contrast)' : 'var(--text-tertiary)',
            border: '1px solid var(--border)',
            padding: '7px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {scenario.presentation ? <Minimize2 size={12} /> : <Presentation size={12} />}
          {scenario.presentation ? 'Exit' : 'Present'}
        </button>
        <button
          type="button"
          onClick={clearData}
          style={{
            background: 'transparent',
            color: 'var(--text-tertiary)',
            border: '1px solid var(--border)',
            padding: '7px 12px',
            borderRadius: 8,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Clear data
        </button>
      </div>
    </div>
  );
}

function PresentationFooter() {
  const { togglePresentation } = useScenario();
  return (
    <div
      className="row gap-2"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        alignItems: 'center',
        background: 'var(--bg-elevated-2)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid var(--border-strong)',
        borderRadius: 999,
        padding: '6px 14px',
        boxShadow: 'var(--shadow-card-strong)',
        fontSize: 11,
        color: 'var(--text-tertiary)',
        zIndex: 20,
      }}
    >
      <Maximize2 size={11} />
      <span>Presentation mode — press <kbd style={{ padding: '0 4px', border: '1px solid var(--border)', borderRadius: 3 }}>P</kbd> or</span>
      <button
        type="button"
        onClick={togglePresentation}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--accent)',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: 11,
          padding: 0,
        }}
      >
        click to exit
      </button>
    </div>
  );
}

function TopBar({ onSwitchView, view }: { onSwitchView: (v: ShellView) => void; view: ShellView }) {
  const { hasData, summaries } = useDataStore();
  const fullyLoaded = summaries.length === 6;
  return (
    <header className="glass-bar" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '12px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          <Logo />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>AR Tool-Beta</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              Reconciliation · Exception triage · Audit pack
            </div>
          </div>
        </div>
        <div className="row gap-2" style={{ alignItems: 'center' }}>
          {fullyLoaded && (
            <div
              className="row"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 999,
                padding: 2,
              }}
            >
              <NavToggle active={view === 'upload'} onClick={() => onSwitchView('upload')} label="Import" />
              <NavToggle active={view === 'dashboard'} onClick={() => onSwitchView('dashboard')} label="Dashboard" />
              <NavToggle active={view === 'exceptions'} onClick={() => onSwitchView('exceptions')} label="Exceptions" />
              <NavToggle active={view === 'audit'} onClick={() => onSwitchView('audit')} label="Audit pack" />
            </div>
          )}
          <span className="glass-pill">
            {hasData ? `${summaries.length} / 6 datasets` : 'no data loaded'}
          </span>
          {fullyLoaded && <OperatorBadge />}
          {fullyLoaded && <RoleBadge />}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}
            aria-label="Keyboard shortcuts (press ?)"
            title="Keyboard shortcuts (press ?)"
            className="row gap-1"
            style={{
              alignItems: 'center',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '4px 10px',
              color: 'var(--text-tertiary)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ?
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function NavToggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 999,
        border: 'none',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'var(--accent-contrast)' : 'var(--text-tertiary)',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function Logo() {
  return (
    <a
      href="https://fastinsights.io"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="fastinsights.io"
      className="center"
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
        color: 'var(--accent-contrast)',
        boxShadow: '0 6px 18px var(--accent-glow)',
        textDecoration: 'none',
      }}
    >
      <Sparkles size={18} />
    </a>
  );
}

function Hero() {
  return (
    <GlassCard variant="strong" style={{ padding: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32, alignItems: 'center' }}>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>Build complete · 12 / 12 milestones</div>
          <h1 style={{ fontSize: 28, lineHeight: 1.2 }}>
            AR Tool-Beta — three-way recon, exception triage, audit pack, all in one HTML file.
          </h1>
          <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: 14, maxWidth: 620 }}>
            Drop in the six CSVs and the dashboard derives the recon, the AR bridge,
            the aging schedule, the KPIs, and every exception structurally — never
            reading the <span className="mono">notes</span> field. Triage exceptions
            with drill-down to the underlying records, fix in the ERP, re-import the
            CSVs, sign off, and export to PDF / Excel / JSON snapshot. Press{' '}
            <HeroKbd>?</HeroKbd> for keyboard shortcuts.
          </p>
        </div>
        <GlassCard variant="nested" padding={18}>
          <div className="label" style={{ marginBottom: 6 }}>Three-way recon · preview</div>
          <ReconPreview label="Subledger AR"  value={4_281_503.18} />
          <ReconPreview label="GL 1200"       value={4_281_503.18} muted />
          <ReconPreview label="Bank cleared"  value={3_429_423.66} muted />
          <hr className="glass-divider" />
          <div className="between" style={{ fontSize: 12 }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Variance — explained</span>
            <span className="num" style={{ color: 'var(--severity-medium)', fontWeight: 600 }}>
              {fmtMoney(852_079.52, 0)}
            </span>
          </div>
        </GlassCard>
      </div>
    </GlassCard>
  );
}

// Visible only when printing — used as a section divider on the PDF so the
// reader sees "Dashboard", "Exception triage", "Audit pack" headings between
// the paginated sections.
function PrintSectionHeader({ title }: { title: string }) {
  return (
    <div
      className="print-only"
      style={{
        padding: '24px 0 12px',
        borderBottom: '2px solid #000',
        marginBottom: 16,
        breakInside: 'avoid',
      }}
    >
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.08, color: '#666' }}>
        AR Tool-Beta
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{title}</div>
    </div>
  );
}

function HeroKbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        padding: '1px 6px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-strong)',
        borderRadius: 4,
        color: 'var(--text-primary)',
        fontWeight: 600,
        verticalAlign: 1,
      }}
    >
      {children}
    </kbd>
  );
}

function ReconPreview({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div
      className="between"
      style={{
        padding: '8px 0',
        borderBottom: '1px solid var(--border)',
        fontSize: 13,
        color: muted ? 'var(--text-secondary)' : 'var(--text-primary)',
      }}
    >
      <span>{label}</span>
      <span className="num" style={{ fontWeight: 600 }}>{fmtMoney(value, 0)}</span>
    </div>
  );
}

function BuildProgress() {
  return (
    <GlassCard>
      <div className="between" style={{ marginBottom: 12 }}>
        <h2>Build progress</h2>
        <span
          className="glass-pill"
          style={{
            background: 'var(--severity-resolved-bg)',
            color: 'var(--severity-resolved)',
            fontWeight: 700,
          }}
        >
          all 12 milestones complete
        </span>
      </div>
      <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {MILESTONES.map((m) => (
          <li
            key={m.n}
            className="severity-strip"
            data-severity={
              m.status === 'done' ? 'resolved' : m.status === 'in_progress' ? 'medium' : 'low'
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              paddingLeft: 18,
              borderBottom: '1px solid var(--border)',
              fontSize: 13,
              opacity: m.status === 'pending' ? 0.7 : 1,
            }}
          >
            <span className="mono" style={{ color: 'var(--text-tertiary)', width: 28 }}>
              {String(m.n).padStart(2, '0')}
            </span>
            <span style={{ flex: 1 }}>{m.label}</span>
            <span
              className="glass-pill"
              style={{
                fontSize: 11,
                background:
                  m.status === 'done'
                    ? 'var(--severity-resolved-bg)'
                    : m.status === 'in_progress'
                    ? 'var(--severity-medium-bg)'
                    : 'var(--accent-soft)',
                color:
                  m.status === 'done'
                    ? 'var(--severity-resolved)'
                    : m.status === 'in_progress'
                    ? 'var(--severity-medium)'
                    : 'var(--text-tertiary)',
              }}
            >
              {m.status === 'done' ? 'done' : m.status === 'in_progress' ? 'in progress' : 'pending'}
            </span>
          </li>
        ))}
      </ol>
    </GlassCard>
  );
}

function Footer() {
  return (
    <footer
      style={{
        padding: '16px 40px',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--text-tertiary)',
      }}
    >
      AR Tool-Beta · runs locally · no backend · single-file build
    </footer>
  );
}
