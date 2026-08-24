// Corporate Finance Lab — three scenario-driven analyses on one page:
//
//   1. Your company's moves — given market conditions and your cost of capital
//      (WACC via CAPM), which use of capital clears its risk-adjusted hurdle:
//      M&A, new product line, capacity, AI platform, debt paydown, buybacks,
//      or waiting in T-bills.
//   2. Customer credit — underwrite a customer's financials to size an open
//      trade-credit line (e.g. $1M of inventory): classic credit ratios,
//      a weighted score, and a recommended limit with terms.
//   3. Treasury & hedging — which instruments fit the scenario: money market,
//      rate swaps, commodity forwards, options, FX forwards.
//
// Model math lives in src/lib/corpFinance.ts and is shown to the user in the
// right-pane guide. Education only; not investment, credit, or tax advice.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { track } from '@vercel/analytics';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Briefcase,
  Calculator,
  ClipboardCheck,
  Cog,
  Compass,
  GraduationCap,
  Handshake,
  Landmark,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Umbrella,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import GlassCard from '../components/ui/GlassCard';
import ThemeToggle from '../components/ui/ThemeToggle';
import {
  Chip,
  Eq,
  GuideSection,
  StepCard,
  fmtSignedMoney,
  fmtSignedPct,
  guideLabel,
  hintStyle,
  toneFor,
  useThemeVersion,
} from '../components/ui/StepKit';
import { resolveCSSVar } from '../lib/uiColors';
import { fmtMoney } from '../lib/format';
import { ASSET_CLASSES, CUSTOM_SCENARIO_ID, INDUSTRIES, MacroFactors, SCENARIOS } from '../lib/macroModel';
import { MARKET_SNAPSHOT, TODAY_SCENARIO_ID } from '../lib/marketSnapshot';
import {
  Band,
  CompanyProforma,
  CreditResult,
  CustomerFinancials,
  DEBT_WEIGHT,
  DEFAULT_PROFORMA,
  DEFAULT_WACC_INPUTS,
  ERP,
  ProformaRead,
  OptionResult,
  SAMPLE_CUSTOMERS,
  SECURITY_KIND_LABEL,
  SecurityKind,
  SecurityLadder,
  TAX_RATE,
  TREASURY_INSTRUMENTS,
  WaccInputs,
  assessCredit,
  buildSecurityLadder,
  computeCreditMetrics,
  computeWacc,
  evaluateAllOptions,
  readProforma,
} from '../lib/corpFinance';
import {
  CROSS_EFFECTS,
  DIAL_PROFILES,
  DebtRead,
  DialPressure,
  LONG_CYCLE,
  TrendPoint,
  debtPlaybook,
  dialPressures,
  impactTrend,
  industryBackdrop,
  levelFor,
  projectDials,
  shortCyclePhase,
} from '../lib/marketAnalysis';
import { FORMULA_GROUPS, GLOSSARY } from '../lib/formulaReference';
import {
  DALIO_RULES,
  EQ_STATUS_LABEL,
  EquilibriumRead,
  MachinePoint,
  equilibriumReads,
  leverInterplay,
  leverWatch,
  machineCurve,
} from '../lib/economicMachine';

// ---------------------------------------------------------------------------
// Small local pieces
// ---------------------------------------------------------------------------

type TabId = 'capital' | 'credit' | 'treasury' | 'analysis' | 'machine' | 'formulas';

const TABS: { id: TabId; label: string; icon: typeof Briefcase }[] = [
  { id: 'capital', label: "1 · Your company's moves", icon: Briefcase },
  { id: 'credit', label: '2 · Customer credit', icon: ShieldCheck },
  { id: 'treasury', label: '3 · Treasury & hedging', icon: Umbrella },
  { id: 'analysis', label: '4 · Market analysis', icon: Activity },
  { id: 'machine', label: '5 · The economic machine', icon: Cog },
  { id: 'formulas', label: '6 · Formulas & decisions', icon: Calculator },
];

const BACKDROP_META: Record<'tailwind' | 'neutral' | 'headwind', { label: string; tone: string }> = {
  tailwind: { label: 'Tailwind', tone: 'var(--pos)' },
  neutral: { label: 'Neutral backdrop', tone: 'var(--severity-medium)' },
  headwind: { label: 'Headwind', tone: 'var(--neg)' },
};

const TREND_DEFAULTS: Record<'industries' | 'assets', string[]> = {
  industries: ['tech', 'financials', 'staples', 'energy'],
  assets: ['stocks', 'bonds-long', 'gold', 'real-estate'],
};

const EQ_STATUS_TONE: Record<EquilibriumRead['status'], string> = {
  balanced: 'var(--pos)',
  above: 'var(--severity-medium)',
  below: 'var(--severity-medium)',
  torn: 'var(--neg)',
};

/** Display names for the dials, matching the scenario picker. */
const DIAL_NAME: Record<keyof MacroFactors, string> = {
  growth: 'Growth',
  inflation: 'Inflation',
  policy: 'The Fed',
  fiscal: "Gov't",
};

const STANCE_META: Record<DebtRead['stance'], { label: string; tone: string }> = {
  tailwind: { label: 'Tailwind', tone: 'var(--pos)' },
  neutral: { label: 'Neutral', tone: 'var(--severity-medium)' },
  pressure: { label: 'Pressure', tone: 'var(--neg)' },
};

const BAND_TONE: Record<Band, string> = {
  good: 'var(--pos)',
  watch: 'var(--severity-medium)',
  risk: 'var(--neg)',
};
const BAND_LABEL: Record<Band, string> = { good: 'Good', watch: 'Watch', risk: 'Risk' };

const VERDICT_META: Record<OptionResult['verdict'], { label: string; tone: string }> = {
  go: { label: 'Clears the hurdle', tone: 'var(--pos)' },
  marginal: { label: 'Borderline', tone: 'var(--severity-medium)' },
  no: { label: "Doesn't clear", tone: 'var(--neg)' },
};

const KIND_TONE: Record<SecurityKind, string> = {
  unsecured: 'var(--pos)',
  secured: 'var(--severity-medium)',
  prepay: 'var(--neg)',
};
const KIND_CHIP: Record<SecurityKind, string> = {
  unsecured: 'Unsecured',
  secured: 'Secured',
  prepay: 'Prepay',
};

const FIT_META: Record<string, { label: string; tone: string }> = {
  fit: { label: 'Fits this scenario', tone: 'var(--pos)' },
  neutral: { label: 'Situational', tone: 'var(--severity-medium)' },
  avoid: { label: 'Not the moment', tone: 'var(--neg)' },
};

function MoneyInput({
  value,
  onChange,
  width = 130,
  max = 1_000_000_000,
}: {
  value: number;
  onChange: (v: number) => void;
  width?: number;
  max?: number;
}) {
  return (
    <div
      className="row"
      style={{
        alignItems: 'center',
        gap: 5,
        background: 'var(--bg-elevated-2)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
      }}
    >
      <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>$</span>
      <input
        inputMode="numeric"
        value={value.toLocaleString('en-US')}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, '');
          onChange(digits ? Math.min(Number(digits), max) : 0);
        }}
        style={{
          fontSize: 15,
          fontWeight: 600,
          width,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
        }}
      />
    </div>
  );
}

function PctInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div
      className="row"
      style={{
        alignItems: 'center',
        gap: 4,
        background: 'var(--bg-elevated-2)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        padding: '6px 10px',
      }}
    >
      <input
        inputMode="decimal"
        value={String(value)}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^0-9.]/g, '');
          const n = Number(cleaned);
          if (!Number.isNaN(n) && n <= 25) onChange(n);
        }}
        style={{
          fontSize: 14,
          fontWeight: 600,
          width: 44,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          textAlign: 'right',
        }}
      />
      <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>%</span>
    </div>
  );
}

interface Dial {
  key: keyof MacroFactors;
  label: string;
  options: { label: string; value: number }[];
}

const DIALS: Dial[] = [
  { key: 'growth', label: 'Growth', options: [{ label: 'Falling', value: -2 }, { label: 'Steady', value: 0 }, { label: 'Rising', value: 2 }] },
  { key: 'inflation', label: 'Inflation', options: [{ label: 'Falling', value: -2 }, { label: 'Steady', value: 0 }, { label: 'Rising', value: 2 }] },
  { key: 'policy', label: 'The Fed', options: [{ label: 'Cutting / QE', value: -2 }, { label: 'On hold', value: 0 }, { label: 'Raising rates', value: 2 }] },
  { key: 'fiscal', label: 'Government', options: [{ label: 'Austerity', value: -1 }, { label: 'Neutral', value: 0 }, { label: 'Stimulus', value: 1 }] },
];

const isDialActive = (optValue: number, value: number) =>
  optValue === 0 ? value === 0 : Math.sign(optValue) === Math.sign(value) && value !== 0;

function ScenarioPicker({
  scenarioId,
  factors,
  onToday,
  onPreset,
  onDial,
}: {
  scenarioId: string;
  factors: MacroFactors;
  onToday: () => void;
  onPreset: (id: string) => void;
  onDial: (key: keyof MacroFactors, value: number) => void;
}) {
  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <Chip active={scenarioId === TODAY_SCENARIO_ID} onClick={onToday}>
          Today's market
        </Chip>
        {SCENARIOS.map((s) => (
          <Chip key={s.id} active={scenarioId === s.id} onClick={() => onPreset(s.id)}>
            {s.name}
          </Chip>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))',
          gap: 10,
        }}
      >
        {DIALS.map((d) => (
          <div key={d.key} className="col" style={{ gap: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {d.label}
            </span>
            <div className="row" style={{ gap: 5, flexWrap: 'wrap' }}>
              {d.options.map((opt) => (
                <Chip key={opt.label} active={isDialActive(opt.value, factors[d.key])} onClick={() => onDial(d.key, opt.value)}>
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>
        ))}
      </div>
      {scenarioId === CUSTOM_SCENARIO_ID && (
        <span style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 600 }}>Custom scenario</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CorporateFinanceLab() {
  const [tab, setTab] = useState<TabId>('capital');

  // Shared market scenario (tabs 1 and 3).
  const [scenarioId, setScenarioId] = useState<string>(TODAY_SCENARIO_ID);
  const [factors, setFactors] = useState<MacroFactors>(MARKET_SNAPSHOT.factors);
  const pickToday = () => {
    setScenarioId(TODAY_SCENARIO_ID);
    setFactors(MARKET_SNAPSHOT.factors);
  };
  const pickPreset = (id: string) => {
    const s = SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    setScenarioId(id);
    setFactors(s.factors);
  };
  const setDial = (key: keyof MacroFactors, value: number) => {
    setScenarioId(CUSTOM_SCENARIO_ID);
    setFactors((f) => ({ ...f, [key]: value }));
  };

  // Tab 1 state.
  const [capital, setCapital] = useState(1_000_000);
  const [waccInputs, setWaccInputs] = useState<WaccInputs>(DEFAULT_WACC_INPUTS);
  const [proformaOn, setProformaOn] = useState(false);
  const [proforma, setProforma] = useState<CompanyProforma>(DEFAULT_PROFORMA);
  const setProformaField = (key: keyof CompanyProforma, v: number) =>
    setProforma((p) => ({ ...p, [key]: v }));

  // Tab 2 state.
  const [requested, setRequested] = useState(1_000_000);
  const [termsDays, setTermsDays] = useState(30);
  const [sampleId, setSampleId] = useState('average');
  const [fin, setFin] = useState<CustomerFinancials>(SAMPLE_CUSTOMERS[1].fin);
  const loadSample = (id: string) => {
    const s = SAMPLE_CUSTOMERS.find((x) => x.id === id);
    if (!s) return;
    setSampleId(id);
    setFin(s.fin);
  };
  const setFinField = (key: keyof CustomerFinancials, v: number) => {
    setSampleId('custom');
    setFin((f) => ({ ...f, [key]: v }));
  };
  const [custIndustryId, setCustIndustryId] = useState<string | null>(null);

  const proRead = useMemo(() => readProforma(proforma), [proforma]);
  // When the pro forma is on, its ratio-derived spread replaces the chip.
  const effInputs = useMemo<WaccInputs>(
    () => (proformaOn ? { ...waccInputs, creditSpread: proRead.spread } : waccInputs),
    [proformaOn, waccInputs, proRead],
  );
  const wacc = useMemo(() => computeWacc(effInputs), [effInputs]);
  const options = useMemo(
    () => evaluateAllOptions(effInputs, factors, capital),
    [effInputs, factors, capital],
  );
  // Neutral-market baseline, for tracking how the scenario moves each NPV.
  const neutralNpvById = useMemo(() => {
    const rows = evaluateAllOptions(effInputs, { growth: 0, inflation: 0, policy: 0, fiscal: 0 }, capital);
    return Object.fromEntries(rows.map((r) => [r.id, r.npv]));
  }, [effInputs, capital]);
  const metrics = useMemo(() => computeCreditMetrics(fin), [fin]);
  const credit = useMemo(() => assessCredit(requested, termsDays, fin), [requested, termsDays, fin]);
  const ladder = useMemo(() => buildSecurityLadder(requested, termsDays, fin), [requested, termsDays, fin]);

  // Tab 4 state (all derived from the shared scenario).
  const pressures = useMemo(() => dialPressures(factors), [factors]);
  const cyclePhase = useMemo(() => shortCyclePhase(factors), [factors]);
  const debtReads = useMemo(() => debtPlaybook(factors), [factors]);
  const trend = useMemo(() => projectDials(factors), [factors]);
  const [trendGroup, setTrendGroup] = useState<'industries' | 'assets'>('industries');
  const [trendSel, setTrendSel] = useState<Record<'industries' | 'assets', string[]>>(TREND_DEFAULTS);
  const toggleTrendSel = (id: string) =>
    setTrendSel((s) => {
      const cur = s[trendGroup];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 4 ? cur : [...cur, id];
      return { ...s, [trendGroup]: next };
    });
  const trendTargets = trendGroup === 'industries' ? INDUSTRIES : ASSET_CLASSES;
  const marketTrend = useMemo(() => impactTrend(trendTargets, factors), [trendTargets, factors]);
  const custIndustry = INDUSTRIES.find((i) => i.id === custIndustryId) ?? null;
  const backdrop = useMemo(
    () => (custIndustry ? industryBackdrop(custIndustry, factors) : null),
    [custIndustry, factors],
  );
  const backdropTrend = useMemo(
    () => (custIndustry ? impactTrend([custIndustry], factors) : null),
    [custIndustry, factors],
  );

  // Tab 5 state (also derived from the shared scenario).
  const machineData = useMemo(() => machineCurve(), []);
  const eqReads = useMemo(() => equilibriumReads(factors, effInputs.riskFree), [factors, effInputs]);
  const levers = useMemo(() => leverWatch(factors), [factors]);
  const interplay = useMemo(() => leverInterplay(factors), [factors]);

  const scenarioName =
    scenarioId === TODAY_SCENARIO_ID
      ? "Today's market"
      : SCENARIOS.find((s) => s.id === scenarioId)?.name ?? 'Your custom scenario';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 24px',
        maxWidth: 1400,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <style>{`
        .ms-layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 24px; align-items: start; }
        .ms-guide { position: sticky; top: 24px; max-height: calc(100vh - 48px); overflow-y: auto; }
        @media (max-width: 1040px) {
          .ms-layout { grid-template-columns: 1fr; }
          .ms-guide { position: static; max-height: none; }
        }
      `}</style>

      <header style={{ marginBottom: 28 }}>
        <div className="between" style={{ gap: 16, marginBottom: 12 }}>
          <div
            className="row gap-2"
            style={{ alignItems: 'center', color: 'var(--text-secondary)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            <Sparkles size={14} />
            <span>FAST Insights</span>
          </div>
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              <ArrowLeft size={15} /> All tools
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Corporate Finance Lab</h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 10, maxWidth: 720, lineHeight: 1.6 }}>
          Six ways to run the numbers: decide <strong>your company's next move</strong> under real
          market conditions, <strong>underwrite a customer</strong> before extending them credit,
          pick the right <strong>treasury &amp; hedging tools</strong> for the environment, read
          the <strong>market itself</strong> — ranges, cross-effects, industry trends, and the debt
          cycles — study <strong>the economic machine</strong>: Dalio's cycles, equilibriums, and
          levers — and keep the <strong>formula reference</strong> with every equation, decision
          flow, and acronym.{' '}
          <strong>A teaching model — education only; not investment, credit, or tax advice.</strong>
        </p>
        <div className="row gap-2" style={{ flexWrap: 'wrap', marginTop: 18 }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  track('cfl_tab', { tab: t.id });
                }}
                aria-pressed={active}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  fontSize: 13.5,
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  background: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="ms-layout">
        <div className="col" style={{ gap: 24 }}>
          {tab === 'capital' && (
            <>
              <StepCard n="A" icon={<Calculator size={17} />} title="Your capital & cost of capital">
                <p style={hintStyle}>
                  How much is on the table, and what return must any use of it beat? Your WACC is
                  computed live from three inputs — the guide on the right shows the full equation.
                </p>
                <div className="row gap-4" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div className="col" style={{ gap: 6 }}>
                    <span style={labelStyle}>Capital to deploy</span>
                    <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <MoneyInput value={capital} onChange={setCapital} />
                      {[500_000, 1_000_000, 5_000_000].map((v) => (
                        <Chip key={v} active={capital === v} onClick={() => setCapital(v)}>
                          {fmtMoney(v, 0)}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div className="col" style={{ gap: 6 }}>
                    <span style={labelStyle}>Risk-free rate (10-yr Treasury)</span>
                    <PctInput value={waccInputs.riskFree} onChange={(v) => setWaccInputs((w) => ({ ...w, riskFree: v }))} />
                  </div>
                  <div className="col" style={{ gap: 6 }}>
                    <span style={labelStyle}>Business risk (beta)</span>
                    <div className="row gap-2">
                      {[{ l: 'Defensive · 0.8', v: 0.8 }, { l: 'Typical · 1.1', v: 1.1 }, { l: 'Aggressive · 1.4', v: 1.4 }].map((b) => (
                        <Chip key={b.v} active={waccInputs.beta === b.v} onClick={() => setWaccInputs((w) => ({ ...w, beta: b.v }))}>
                          {b.l}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div className="col" style={{ gap: 6 }}>
                    <span style={labelStyle}>Borrowing spread</span>
                    <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                      <Chip active={proformaOn} onClick={() => setProformaOn(true)}>
                        From my pro forma
                      </Chip>
                      {[{ l: 'Strong · +2%', v: 2 }, { l: 'Average · +3%', v: 3 }, { l: 'Stretched · +5%', v: 5 }].map((b) => (
                        <Chip
                          key={b.v}
                          active={!proformaOn && waccInputs.creditSpread === b.v}
                          onClick={() => {
                            setProformaOn(false);
                            setWaccInputs((w) => ({ ...w, creditSpread: b.v }));
                          }}
                        >
                          {b.l}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
                {proformaOn && <ProformaSection proforma={proforma} read={proRead} onField={setProformaField} />}
                <div className="row gap-3" style={{ flexWrap: 'wrap', marginTop: 16 }}>
                  <StatPill label="Cost of equity" value={`${wacc.costEquity}%`} />
                  {proformaOn && <StatPill label="Spread (from ratios)" value={`+${proRead.spread}% · ${proRead.tier}`} />}
                  <StatPill label="Cost of debt (after tax)" value={`${wacc.costDebtAfterTax}%`} />
                  <StatPill label="Your WACC" value={`${wacc.wacc}%`} strong />
                </div>
              </StepCard>

              <StepCard n="B" icon={<Compass size={17} />} title="Market conditions">
                <p style={hintStyle}>
                  The same four forces as Market Scenarios. They shift each option's expected return —
                  deals get cheap in downturns, long-payoff bets suffer when rates rise.
                </p>
                <ScenarioPicker scenarioId={scenarioId} factors={factors} onToday={pickToday} onPreset={pickPreset} onDial={setDial} />
              </StepCard>

              <StepCard n="C" icon={<BarChart3 size={17} />} title={`Which move clears its hurdle — ${scenarioName}`}>
                <p style={hintStyle}>
                  Each option's expected return vs. its <em>risk-adjusted hurdle</em> (WACC + a premium
                  for that option's risk; near-guaranteed uses compare against the risk-free rate
                  instead). Positive spread = the move creates value on your {fmtMoney(capital, 0)}.
                </p>
                <OptionsSection rows={options} capital={capital} neutralNpvById={neutralNpvById} />
              </StepCard>
            </>
          )}

          {tab === 'credit' && (
            <>
              <StepCard n="A" icon={<Wallet size={17} />} title="The ask">
                <p style={hintStyle}>
                  A customer wants to buy your inventory on open terms — you ship now, they pay later.
                  How much credit, and on what terms?
                </p>
                <div className="row gap-4" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div className="col" style={{ gap: 6 }}>
                    <span style={labelStyle}>Credit requested</span>
                    <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <MoneyInput value={requested} onChange={setRequested} />
                      {[250_000, 500_000, 1_000_000].map((v) => (
                        <Chip key={v} active={requested === v} onClick={() => setRequested(v)}>
                          {fmtMoney(v, 0)}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div className="col" style={{ gap: 6 }}>
                    <span style={labelStyle}>Payment terms</span>
                    <div className="row gap-2">
                      {[30, 60, 90].map((d) => (
                        <Chip key={d} active={termsDays === d} onClick={() => setTermsDays(d)}>
                          Net {d}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              </StepCard>

              <StepCard n="B" icon={<ClipboardCheck size={17} />} title="The customer's financials">
                <p style={hintStyle}>
                  From their financial statements (annual figures). Load a sample to see how the read
                  changes, or type a real customer's numbers.
                </p>
                <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
                  {SAMPLE_CUSTOMERS.map((s) => (
                    <Chip key={s.id} active={sampleId === s.id} onClick={() => loadSample(s.id)}>
                      {s.name} — {s.desc}
                    </Chip>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
                  {(
                    [
                      ['revenue', 'Revenue (annual)'],
                      ['cogs', 'Cost of goods sold'],
                      ['ebitda', 'EBITDA'],
                      ['interest', 'Interest expense'],
                      ['totalDebt', 'Total debt'],
                      ['cash', 'Cash'],
                      ['currentAssets', 'Current assets'],
                      ['currentLiabilities', 'Current liabilities'],
                      ['ar', 'Accounts receivable'],
                      ['inventory', 'Inventory'],
                      ['ap', 'Accounts payable'],
                    ] as [keyof CustomerFinancials, string][]
                  ).map(([key, label]) => (
                    <div key={key} className="col" style={{ gap: 5 }}>
                      <span style={labelStyle}>{label}</span>
                      <MoneyInput value={fin[key]} onChange={(v) => setFinField(key, v)} width={110} />
                    </div>
                  ))}
                </div>
              </StepCard>

              <StepCard n="C" icon={<ShieldCheck size={17} />} title="The credit read">
                <DecisionBanner credit={credit} requested={requested} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginTop: 16 }}>
                  {metrics.map((m) => (
                    <GlassCard key={m.id} variant="nested" padding={14}>
                      <div className="between" style={{ gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{m.label}</span>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            color: BAND_TONE[m.band],
                            background: 'var(--bg-elevated-2)',
                            border: `1px solid ${BAND_TONE[m.band]}`,
                            borderRadius: 999,
                            padding: '2px 9px',
                          }}
                        >
                          {BAND_LABEL[m.band]}
                        </span>
                      </div>
                      <div className="num" style={{ fontSize: 20, fontWeight: 700, color: BAND_TONE[m.band], textAlign: 'left' }}>
                        {m.display}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 6px' }}>{m.benchmark}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{m.why}</div>
                    </GlassCard>
                  ))}
                </div>
              </StepCard>

              <StepCard n="D" icon={<Handshake size={17} />} title="Security & guarantees — the classification ladder">
                <p style={hintStyle}>
                  The score decides how this customer may buy: <strong>unsecured</strong> open terms,{' '}
                  <strong>secured</strong> terms (guarantee, deposit, or letter of credit), or{' '}
                  <strong>prepay / COD</strong>. Each rung below shows how much of the{' '}
                  {fmtMoney(requested, 0)} ask that structure supports on Net {termsDays}.
                </p>
                <SecurityLadderSection ladder={ladder} requested={requested} />
              </StepCard>

              <StepCard n="E" icon={<Activity size={17} />} title="The industry backdrop — what kind of customer is this?">
                <p style={hintStyle}>
                  The same customer numbers read differently in different industries and markets.
                  Pick the customer's industry to see its modeled trend under the current scenario
                  (from the Market Scenarios sensitivities) — advisory context, it does not change
                  the score.
                </p>
                <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
                  {INDUSTRIES.map((i) => (
                    <Chip key={i.id} active={custIndustryId === i.id} onClick={() => setCustIndustryId(custIndustryId === i.id ? null : i.id)}>
                      {i.name}
                    </Chip>
                  ))}
                </div>
                {custIndustry && backdrop && backdropTrend ? (
                  <GlassCard variant="nested" padding={16}>
                    <div className="between" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{custIndustry.name}</span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: BACKDROP_META[backdrop.level].tone,
                          border: `1px solid ${BACKDROP_META[backdrop.level].tone}`,
                          borderRadius: 999,
                          padding: '3px 10px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {BACKDROP_META[backdrop.level].label}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: 8 }}>{custIndustry.driver}</div>
                    <ImpactTrendChart data={backdropTrend} series={[{ id: custIndustry.id, label: custIndustry.name }]} height={170} />
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 8 }}>
                      <strong style={{ color: BACKDROP_META[backdrop.level].tone }}>For underwriting:</strong> {backdrop.note}
                    </div>
                  </GlassCard>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
                    No industry selected — pick one above, or compare several at once on tab 4's
                    market &amp; industry trends chart.
                  </p>
                )}
              </StepCard>
            </>
          )}

          {tab === 'treasury' && (
            <>
              <StepCard n="A" icon={<Compass size={17} />} title="Market conditions">
                <p style={hintStyle}>
                  The environment decides the playbook: rate direction drives cash and swap decisions,
                  inflation drives inventory hedging, and uncertainty makes options worth their premium.
                </p>
                <ScenarioPicker scenarioId={scenarioId} factors={factors} onToday={pickToday} onPreset={pickPreset} onDial={setDial} />
              </StepCard>

              <StepCard n="B" icon={<Umbrella size={17} />} title={`The playbook — ${scenarioName}`}>
                <p style={hintStyle}>
                  Every instrument, with a live verdict for this scenario. The rule that keeps you out
                  of trouble: <strong>hedge committed exposures for certainty — never to speculate.</strong>
                </p>
                <div className="col" style={{ gap: 12 }}>
                  {TREASURY_INSTRUMENTS.map((inst) => {
                    const fit = inst.fit(factors);
                    const meta = FIT_META[fit.level];
                    return (
                      <GlassCard key={inst.id} variant="nested" padding={16}>
                        <div className="between" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{inst.name}</span>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              color: meta.tone,
                              border: `1px solid ${meta.tone}`,
                              borderRadius: 999,
                              padding: '3px 10px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{inst.what}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 6 }}>
                          <strong style={{ color: meta.tone }}>This scenario:</strong> {fit.reason}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-elevated-2)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            padding: '8px 10px',
                            marginTop: 8,
                            lineHeight: 1.5,
                          }}
                        >
                          <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700, marginRight: 6 }}>
                            Example
                          </span>
                          {inst.example}
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </StepCard>
            </>
          )}

          {tab === 'analysis' && (
            <>
              <StepCard n="A" icon={<Compass size={17} />} title="Market conditions">
                <p style={hintStyle}>
                  The same four dials as everywhere else — set them here and the readings below
                  translate each one into real numbers, cross-pressures, and a cycle read.
                </p>
                <ScenarioPicker scenarioId={scenarioId} factors={factors} onToday={pickToday} onPreset={pickPreset} onDial={setDial} />
              </StepCard>

              <StepCard n="B" icon={<Activity size={17} />} title="The dials in real numbers">
                <p style={hintStyle}>
                  What each setting means in the numbers practitioners watch — and the kinds of
                  changes that move each dial. Your current setting is highlighted.
                </p>
                <DialRangesSection factors={factors} />
              </StepCard>

              <StepCard n="C" icon={<RefreshCcw size={17} />} title={`How the dials push each other — ${scenarioName}`}>
                <p style={hintStyle}>
                  The dials are not independent: growth feeds inflation, inflation forces the Fed,
                  the Fed cools both with a lag, and fiscal policy feeds demand. Given your
                  settings, here is where each dial is being pushed next.
                </p>
                <PressuresSection pressures={pressures} />
                <div style={{ marginTop: 16 }}>
                  <span style={labelStyle}>The trend those pushes trace — next 8 quarters</span>
                  <TrendChart data={trend} />
                  <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.5, margin: '6px 0 0' }}>
                    Each quarter, every dial drifts toward where the others are pushing it (the
                    cross-effects above, damped). Watch the feedback loop work: a boom pulls the Fed
                    up, the Fed pulls growth and inflation back down. Direction of travel, not a
                    forecast — and gov't stays where you set it, because budgets are chosen, not
                    caused.
                  </p>
                </div>
              </StepCard>

              <StepCard n="D" icon={<BarChart3 size={17} />} title={`Market & industry trends — ${scenarioName}`}>
                <p style={hintStyle}>
                  The Market Scenarios sensitivities run along the projected path above: each line is
                  one industry or asset class's modeled 12-month impact as the environment evolves.
                  Use it to see which <strong>customer types</strong> face tailwinds or headwinds —
                  and pick your customer's industry on tab 2 to pull it into the credit read.
                </p>
                <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
                  <Chip active={trendGroup === 'industries'} onClick={() => setTrendGroup('industries')}>
                    Industries
                  </Chip>
                  <Chip active={trendGroup === 'assets'} onClick={() => setTrendGroup('assets')}>
                    Asset classes
                  </Chip>
                </div>
                <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 4 }}>
                  {trendTargets.map((t) => (
                    <Chip key={t.id} active={trendSel[trendGroup].includes(t.id)} onClick={() => toggleTrendSel(t.id)}>
                      {t.name}
                    </Chip>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '0 0 4px' }}>
                  Pick up to 4 to compare. {trendSel[trendGroup].length === 0 ? 'Nothing selected yet.' : ''}
                </p>
                <ImpactTrendChart
                  data={marketTrend}
                  series={trendTargets.filter((t) => trendSel[trendGroup].includes(t.id)).map((t) => ({ id: t.id, label: t.name }))}
                  height={260}
                />
              </StepCard>

              <StepCard n="E" icon={<Landmark size={17} />} title="The debt cycles — short term & long term">
                <p style={hintStyle}>
                  Dalio's frame: the economy runs on two debt cycles stacked on productivity growth.
                  The short one is the business cycle you feel; the long one decides what tools are
                  left when it turns.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                  <GlassCard variant="nested" padding={16}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                      Short-term debt cycle (~7–10 years)
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      Credit expands → the economy heats up → inflation rises → the Fed brakes →
                      downturn → cuts → repeat. Spending is amplified by credit on the way up and
                      strangled by it on the way down.
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-elevated-2)',
                        border: '1px solid var(--accent)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        marginTop: 10,
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', fontWeight: 700, marginRight: 6 }}>
                        Your scenario reads as
                      </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{cyclePhase.name}.</strong> {cyclePhase.desc}
                    </div>
                  </GlassCard>
                  <GlassCard variant="nested" padding={16}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                      {LONG_CYCLE.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{LONG_CYCLE.desc}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, margin: '10px 0 4px' }}>
                      What to watch
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {LONG_CYCLE.watch.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </GlassCard>
                </div>
              </StepCard>

              <StepCard n="F" icon={<Wallet size={17} />} title={`Your debt book — short vs. long term — ${scenarioName}`}>
                <p style={hintStyle}>
                  The same cycle, seen from your own balance sheet: floating debt reprices with the
                  Fed within days, while long-term fixed debt locks today's rate until the
                  refinancing date.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                  {debtReads.map((d) => {
                    const meta = STANCE_META[d.stance];
                    return (
                      <GlassCard key={d.id} variant="nested" padding={16}>
                        <div className="between" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</span>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              color: meta.tone,
                              border: `1px solid ${meta.tone}`,
                              borderRadius: 999,
                              padding: '3px 10px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: 8 }}>{d.what}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                          <strong style={{ color: meta.tone }}>This scenario:</strong> {d.read}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 6 }}>
                          <strong style={{ color: 'var(--text-primary)' }}>The move:</strong> {d.action}
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </StepCard>
            </>
          )}

          {tab === 'machine' && (
            <>
              <StepCard n="A" icon={<Compass size={17} />} title="Market conditions">
                <p style={hintStyle}>
                  Ray Dalio's economic machine, made interactive. Set the dials — the equilibrium
                  readings and the lever watch below respond live.
                </p>
                <ScenarioPicker scenarioId={scenarioId} factors={factors} onToday={pickToday} onPreset={pickPreset} onDial={setDial} />
              </StepCard>

              <StepCard n="B" icon={<Cog size={17} />} title="How the market cycles">
                <p style={hintStyle}>
                  Three forces stacked on each other: <strong>productivity growth</strong> (slow,
                  powerful, always up over time), the <strong>short-term debt cycle</strong> (~
                  7–10 years — the business cycle you feel), and the <strong>long-term debt
                  cycle</strong> (~50–75 years — leverage building above the trend, then the
                  deleveraging below it). The economy you live in is the sum of all three.
                </p>
                <MachineChart data={machineData} />
                <div
                  style={{
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-elevated-2)',
                    border: '1px solid var(--accent)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    marginTop: 10,
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', fontWeight: 700, marginRight: 6 }}>
                    Where your dials sit in the short cycle
                  </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{cyclePhase.name}.</strong> {cyclePhase.desc}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, margin: '14px 0 4px' }}>
                  Dalio's three rules of thumb
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {DALIO_RULES.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </StepCard>

              <StepCard n="C" icon={<Activity size={17} />} title={`The three equilibriums — ${scenarioName}`}>
                <p style={hintStyle}>
                  The machine is always pulling toward three equilibriums. When one is out, the
                  forces that restore it ARE the market moves you experience — so the readings
                  below are the watch list.
                </p>
                <div className="col" style={{ gap: 12 }}>
                  {eqReads.map((eq) => {
                    const tone = EQ_STATUS_TONE[eq.status];
                    return (
                      <GlassCard key={eq.id} variant="nested" padding={16}>
                        <div className="between" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {eq.n}. {eq.name}
                          </span>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              color: tone,
                              border: `1px solid ${tone}`,
                              borderRadius: 999,
                              padding: '3px 10px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {EQ_STATUS_LABEL[eq.status]}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: 8 }}>
                          <em>The rule:</em> {eq.rule}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                          <strong style={{ color: tone }}>Right now:</strong> {eq.read}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 6 }}>
                          <strong style={{ color: 'var(--text-primary)' }}>How it restores:</strong> {eq.restore}
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </StepCard>

              <StepCard n="D" icon={<Landmark size={17} />} title="Watching the two levers">
                <p style={hintStyle}>
                  Everything above is steered by just two levers — <strong>monetary</strong> (the
                  Fed) and <strong>fiscal</strong> (the government). Watch the concrete changes
                  below; each one is a dial move you can see coming.
                </p>
                <div
                  className="row"
                  style={{
                    alignItems: 'baseline',
                    gap: 10,
                    border: '1px solid var(--accent)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-soft)',
                    padding: '10px 14px',
                    flexWrap: 'wrap',
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{interplay.name}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{interplay.desc}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                  {levers.map((lv) => (
                    <GlassCard key={lv.id} variant="nested" padding={16}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{lv.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', margin: '2px 0 8px' }}>{lv.holder}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                        <strong style={{ color: 'var(--accent)' }}>Position now:</strong> {lv.position}
                      </div>
                      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700, margin: '10px 0 4px' }}>
                        Watch for
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {lv.watchFor.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 8 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Transmission:</strong> {lv.transmission}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </StepCard>
            </>
          )}

          {tab === 'formulas' && (
            <>
              <StepCard n="A" icon={<Calculator size={17} />} title="How the whole Lab computes — the decision map">
                <p style={hintStyle}>
                  Every formula in the Lab, grouped by the <strong>decision it serves</strong>. Read
                  each group left to right along its flow line: the output of one equation is the
                  input of the next, and the last output is the decision. Acronym unfamiliar? The
                  glossary in the guide on the right defines every one.
                </p>
                <div className="col" style={{ gap: 8 }}>
                  {FORMULA_GROUPS.map((g) => (
                    <div
                      key={g.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '220px 1fr',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'var(--bg-elevated-2)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{g.decision}</span>
                      <span className="num" style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'left' }}>{g.flow}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '10px 0 0' }}>
                  And the big loop that ties the groups together: the <strong>machine</strong> (tabs
                  4–5) sets rates and premiums → which set your <strong>WACC and hurdles</strong>{' '}
                  (tab 1) → which decide what you build or buy → your customers live in the same
                  machine, so it also sets their <strong>credit backdrop</strong> (tab 2) → and the
                  exposures left over are what you <strong>hedge</strong> (tab 3).
                </p>
              </StepCard>

              {FORMULA_GROUPS.map((g, gi) => (
                <StepCard key={g.id} n={String.fromCharCode(66 + gi)} icon={<Calculator size={17} />} title={`${g.decision}`}>
                  <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', margin: '0 0 6px' }}>{g.tab}</p>
                  <div
                    className="num"
                    style={{
                      fontSize: 11.5,
                      color: 'var(--accent)',
                      background: 'var(--accent-soft)',
                      border: '1px solid var(--accent)',
                      borderRadius: 8,
                      padding: '7px 10px',
                      marginBottom: 12,
                      lineHeight: 1.5,
                      textAlign: 'left',
                    }}
                  >
                    {g.flow}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                    {g.formulas.map((f) => (
                      <GlassCard key={f.name} variant="nested" padding={14}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{f.name}</div>
                        <Eq>{f.eq}</Eq>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{f.plain}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 6 }}>
                          <strong style={{ color: 'var(--accent)' }}>Feeds:</strong> {f.feeds}
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </StepCard>
              ))}
            </>
          )}
        </div>

        <GuidePane tab={tab} wacc={wacc} waccInputs={effInputs} options={options} capital={capital} credit={credit} requested={requested} termsDays={termsDays} fin={fin} proformaOn={proformaOn} proRead={proRead} />
      </div>

      <footer style={{ marginTop: 48, color: 'var(--text-tertiary)', fontSize: 12, lineHeight: 1.6 }}>
        © FAST Insights — Corporate Finance Lab is an educational model with illustrative assumptions.
        It is not investment, credit, accounting, or tax advice, and no output is a recommendation to
        extend or deny credit to any real party.
      </footer>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

function StatPill({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className="row"
      style={{
        alignItems: 'baseline',
        gap: 8,
        background: strong ? 'var(--accent-soft)' : 'var(--bg-elevated-2)',
        border: `1px solid ${strong ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '8px 14px',
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</span>
      <span className="num" style={{ fontSize: 16, fontWeight: 700, color: strong ? 'var(--accent)' : 'var(--text-primary)', textAlign: 'left' }}>{value}</span>
    </div>
  );
}

function DecisionBanner({ credit, requested }: { credit: CreditResult; requested: number }) {
  const meta =
    credit.decision === 'approve'
      ? { tone: 'var(--pos)', title: `Approve ${fmtMoney(credit.limit, 0)}` }
      : credit.decision === 'conditional'
        ? { tone: 'var(--severity-medium)', title: `Conditional — ${fmtMoney(credit.limit, 0)} with security` }
        : { tone: 'var(--neg)', title: 'Decline open terms — prepay / COD only' };
  return (
    <GlassCard variant="nested" padding={18} style={{ border: `1px solid ${meta.tone}` }}>
      <div className="between" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div className="col" style={{ gap: 4 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: meta.tone }}>{meta.title}</span>
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
            Requested: {fmtMoney(requested, 0)} · cash-flow cap {fmtMoney(credit.cashCap, 0)} · liquidity cap {fmtMoney(credit.liquidityCap, 0)}
          </span>
        </div>
        <div className="col" style={{ alignItems: 'flex-end', gap: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Credit score</span>
          <span className="num" style={{ fontSize: 26, fontWeight: 700, color: meta.tone }}>{credit.score}<span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>/100</span></span>
        </div>
      </div>
      <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {credit.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </GlassCard>
  );
}

const PROFORMA_FIELDS: [keyof CompanyProforma, string, string][] = [
  ['revenue', 'Revenue (annual)', 'Annual sales — the denominator for your margin.'],
  ['ebitda', 'EBITDA', 'Operating profit before interest, tax, depreciation — the cash engine lenders size everything against.'],
  ['interest', 'Interest expense', 'Your annual interest bill. Coverage = EBITDA ÷ interest; below 2.5× lenders get nervous.'],
  ['totalDebt', 'Total debt', 'Balance-sheet borrowings only: loans, bonds, drawn revolver.'],
  ['pension', 'Pension & lease obligations', 'The field people forget: unfunded pension shortfall + operating leases. Debt-like — lenders and rating agencies ADD it to debt before computing leverage. Enter 0 if your plan is fully funded and you own your sites.'],
  ['cash', 'Cash & equivalents', 'Nets against debt in negotiations — lenders quote gross leverage but price net.'],
];

function ProformaSection({
  proforma,
  read,
  onField,
}: {
  proforma: CompanyProforma;
  read: ProformaRead;
  onField: (key: keyof CompanyProforma, v: number) => void;
}) {
  const times = (v: number) => (Number.isFinite(v) ? `${(Math.round(v * 10) / 10).toFixed(1)}×` : 'n/m');
  return (
    <GlassCard variant="nested" padding={16} style={{ marginTop: 14 }}>
      <p style={{ ...hintStyle, marginTop: 0 }}>
        Your own financials, read the way a lender reads them: pension and lease obligations are
        added to debt, the <em>weaker</em> of leverage and coverage sets your tier, and the tier
        sets the borrowing spread that flows into your WACC below.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {PROFORMA_FIELDS.map(([key, label, hint]) => (
          <div key={key} className="col" style={{ gap: 5 }}>
            <span style={labelStyle}>{label}</span>
            <MoneyInput value={proforma[key]} onChange={(v) => onField(key, v)} width={110} />
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.45 }}>{hint}</span>
          </div>
        ))}
      </div>
      <div className="row gap-3" style={{ flexWrap: 'wrap', marginTop: 14 }}>
        <StatPill label="Adjusted debt (incl. pension)" value={fmtMoney(read.adjustedDebt, 0)} />
        <StatPill label="Leverage (adj. debt / EBITDA)" value={times(read.leverage)} />
        <StatPill label="Coverage (EBITDA / interest)" value={times(read.coverage)} />
        <StatPill label="Tier → spread" value={`${read.tier} · +${read.spread}%`} strong />
      </div>
      {read.notes.length > 0 && (
        <ul style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {read.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

function DialRangesSection({ factors }: { factors: MacroFactors }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
      {DIAL_PROFILES.map((p) => {
        const current = levelFor(p, factors[p.key]);
        return (
          <GlassCard key={p.key} variant="nested" padding={16}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', margin: '2px 0 10px', lineHeight: 1.5 }}>{p.measures}</div>
            <div className="col" style={{ gap: 4 }}>
              {p.levels.map((l) => {
                const active = l.value === current.value;
                return (
                  <div
                    key={l.value}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 1fr',
                      gap: 8,
                      padding: '5px 8px',
                      borderRadius: 8,
                      border: `1px solid ${active ? 'var(--accent)' : 'transparent'}`,
                      background: active ? 'var(--accent-soft)' : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: 11.5, fontWeight: active ? 700 : 600, color: active ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      {l.label}
                    </span>
                    <span style={{ fontSize: 11.5, lineHeight: 1.45 }}>
                      <span className="num" style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600 }}>{l.range}</span>
                      <span style={{ color: 'var(--text-tertiary)' }}> — {l.meaning}</span>
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700, margin: '10px 0 4px' }}>
              What moves it
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {p.levers.map((lv) => (
                <li key={lv}>{lv}</li>
              ))}
            </ul>
          </GlassCard>
        );
      })}
    </div>
  );
}

function PressuresSection({ pressures }: { pressures: DialPressure[] }) {
  return (
    <div className="col" style={{ gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {pressures.map((pr) => {
          const tone = pr.net > 0 ? 'var(--pos)' : pr.net < 0 ? 'var(--neg)' : 'var(--severity-medium)';
          const headline =
            pr.drivers.length === 0
              ? 'No push from the other dials'
              : pr.net > 0
                ? 'Being pushed UP'
                : pr.net < 0
                  ? 'Being pushed DOWN'
                  : 'Crosscurrents cancel out';
          return (
            <GlassCard key={pr.to} variant="nested" padding={14}>
              <div className="between" style={{ gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{DIAL_NAME[pr.to]}</span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: tone,
                    border: `1px solid ${tone}`,
                    borderRadius: 999,
                    padding: '2px 9px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {headline}
                </span>
              </div>
              {pr.drivers.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                  The other dials are set to neutral, so nothing is leaning on this one.
                </div>
              ) : (
                <div className="col" style={{ gap: 6 }}>
                  {pr.drivers.map((d) => (
                    <div key={d.from} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 700, color: d.push > 0 ? 'var(--pos)' : 'var(--neg)' }}>
                        {d.push > 0 ? '↑' : '↓'}
                      </span>{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>{DIAL_NAME[d.from]}</strong>{' '}
                      <span style={{ color: 'var(--text-tertiary)' }}>({d.lag}):</span> {d.why}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
        Direction and rough lag only — the {CROSS_EFFECTS.length} teaching links here are why "the
        Fed hiked" in one quarter becomes "growth slowed" a year later, and why no dial stays put
        while the others move.
      </div>
    </div>
  );
}

function TrendChart({ data }: { data: TrendPoint[] }) {
  useThemeVersion();
  const series: { key: keyof MacroFactors; color: string }[] = [
    { key: 'growth', color: resolveCSSVar('var(--pos)') },
    { key: 'inflation', color: resolveCSSVar('var(--neg)') },
    { key: 'policy', color: resolveCSSVar('var(--accent)') },
    { key: 'fiscal', color: resolveCSSVar('var(--severity-medium)') },
  ];
  return (
    <div style={{ height: 240, marginTop: 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="quarter" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
          <YAxis
            domain={[-2, 2]}
            ticks={[-2, -1, 0, 1, 2]}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            width={30}
          />
          <ReferenceLine y={0} stroke="var(--border-strong)" />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated-2)',
              border: '1px solid var(--border-strong)',
              borderRadius: 10,
              color: 'var(--text-primary)',
            }}
            formatter={(value: number, name: string) => [String(value), DIAL_NAME[name as keyof MacroFactors] ?? name]}
          />
          <Legend formatter={(value) => DIAL_NAME[value as keyof MacroFactors] ?? value} wrapperStyle={{ fontSize: 12 }} />
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ImpactTrendChart({
  data,
  series,
  height,
}: {
  data: { quarter: string; [k: string]: number | string }[];
  series: { id: string; label: string }[];
  height: number;
}) {
  useThemeVersion();
  const palette = [
    resolveCSSVar('var(--accent)'),
    resolveCSSVar('var(--pos)'),
    resolveCSSVar('var(--neg)'),
    resolveCSSVar('var(--severity-medium)'),
  ];
  const labelOf = Object.fromEntries(series.map((s) => [s.id, s.label]));
  if (series.length === 0) return null;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="quarter" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
          <YAxis
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            width={42}
            tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
          />
          <ReferenceLine y={0} stroke="var(--border-strong)" />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated-2)',
              border: '1px solid var(--border-strong)',
              borderRadius: 10,
              color: 'var(--text-primary)',
            }}
            formatter={(value: number, name: string) => [`${value > 0 ? '+' : ''}${value}%`, labelOf[name] ?? name]}
          />
          {series.length > 1 && <Legend formatter={(value) => labelOf[value] ?? value} wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, i) => (
            <Line key={s.id} type="monotone" dataKey={s.id} stroke={palette[i % palette.length]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const MACHINE_LINE_LABEL: Record<string, string> = {
  productivity: 'Productivity growth',
  shortTerm: '+ short-term debt cycle',
  economy: '+ long-term debt cycle (the economy)',
};

function MachineChart({ data }: { data: MachinePoint[] }) {
  useThemeVersion();
  const accent = resolveCSSVar('var(--accent)');
  const mid = resolveCSSVar('var(--severity-medium)');
  const pos = resolveCSSVar('var(--pos)');
  return (
    <div style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            ticks={[0, 10, 20, 30, 40, 50, 60, 70]}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            tickFormatter={(v) => `yr ${v}`}
          />
          <YAxis tick={false} axisLine={{ stroke: 'var(--border)' }} tickLine={false} width={10} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated-2)',
              border: '1px solid var(--border-strong)',
              borderRadius: 10,
              color: 'var(--text-primary)',
            }}
            labelFormatter={(label) => `Year ${label}`}
            formatter={(value: number, name: string) => [String(value), MACHINE_LINE_LABEL[name] ?? name]}
          />
          <Legend formatter={(value) => MACHINE_LINE_LABEL[value] ?? value} wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="productivity" stroke={accent} strokeWidth={2} strokeDasharray="6 4" dot={false} />
          <Line type="monotone" dataKey="shortTerm" stroke={mid} strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="economy" stroke={pos} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SecurityLadderSection({ ladder, requested }: { ladder: SecurityLadder; requested: number }) {
  const tone = KIND_TONE[ladder.classification];
  return (
    <div className="col" style={{ gap: 12 }}>
      <div
        className="row"
        style={{
          alignItems: 'center',
          gap: 10,
          border: `1px solid ${tone}`,
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-elevated-2)',
          padding: '10px 14px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          This customer's classification
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: tone }}>{SECURITY_KIND_LABEL[ladder.classification]}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {ladder.rungs.map((r) => {
          const rungTone = KIND_TONE[r.kind];
          return (
            <GlassCard key={r.id} variant="nested" padding={14} style={r.available ? undefined : { opacity: 0.65 }}>
              <div className="between" style={{ gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{r.name}</span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: rungTone,
                    background: 'var(--bg-elevated-2)',
                    border: `1px solid ${rungTone}`,
                    borderRadius: 999,
                    padding: '2px 9px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {KIND_CHIP[r.kind]}
                </span>
              </div>
              <div className="num" style={{ fontSize: 20, fontWeight: 700, color: r.available ? rungTone : 'var(--text-muted)', textAlign: 'left' }}>
                {r.available ? fmtMoney(r.supportedLimit, 0) : 'Not available'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 6px' }}>
                {r.available ? `supports of the ${fmtMoney(requested, 0)} ask` : 'for this customer today'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 6 }}>{r.requirement}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.why}</div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

function OptionsSection({
  rows,
  capital,
  neutralNpvById,
}: {
  rows: OptionResult[];
  capital: number;
  neutralNpvById: Record<string, number>;
}) {
  useThemeVersion();
  const pos = resolveCSSVar('var(--pos)');
  const neg = resolveCSSVar('var(--neg)');
  const height = 40 + rows.length * 34;

  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}pp`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
              width={190}
            />
            <ReferenceLine x={0} stroke="var(--border-strong)" />
            <Tooltip
              cursor={{ fill: 'var(--accent-soft)' }}
              contentStyle={{
                background: 'var(--bg-elevated-2)',
                border: '1px solid var(--border-strong)',
                borderRadius: 10,
                color: 'var(--text-primary)',
                maxWidth: 320,
                whiteSpace: 'normal',
              }}
              formatter={(value: number, _name, props) => {
                const row = props?.payload as OptionResult | undefined;
                if (!row) return [`${fmtSignedPct(Number(value))}`, ''];
                return [
                  `return ${row.expReturn}% vs hurdle ${row.hurdle}% → spread ${fmtSignedPct(row.spread)} · NPV ${fmtSignedMoney(row.npv)}`,
                  '',
                ];
              }}
              labelFormatter={(label) => String(label)}
            />
            <Bar dataKey="spread" radius={4} maxBarSize={18}>
              {rows.map((r) => (
                <Cell key={r.id} fill={r.spread >= 0 ? pos : neg} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ overflowX: 'auto', marginTop: 6 }}>
        <table className="fin-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Option</th>
              <th className="num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Expected (IRR)</th>
              <th className="num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Hurdle</th>
              <th className="num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>NPV on {fmtMoney(capital, 0)}</th>
              <th className="num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Δ NPV vs neutral</th>
              <th style={{ textAlign: 'left' }}>Verdict & why</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const meta = VERDICT_META[r.verdict];
              return (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{r.expReturn}%</td>
                  <td className="num" style={{ textAlign: 'right' }}>{r.hurdle}%</td>
                  <td className="num" style={{ textAlign: 'right', color: toneFor(r.npv), fontWeight: 600 }}>{fmtSignedMoney(r.npv)}</td>
                  {(() => {
                    const delta = r.npv - (neutralNpvById[r.id] ?? 0);
                    return (
                      <td className="num" style={{ textAlign: 'right', color: delta === 0 ? 'var(--text-tertiary)' : toneFor(delta) }}>
                        {delta === 0 ? '—' : fmtSignedMoney(delta)}
                      </td>
                    );
                  })()}
                  <td style={{ fontSize: 12.5 }}>
                    <span style={{ color: meta.tone, fontWeight: 700 }}>{meta.label}.</span>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{r.driver}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right-pane guide — switches with the active tab.
// ---------------------------------------------------------------------------

function GuidePane({
  tab,
  wacc,
  waccInputs,
  options,
  capital,
  credit,
  requested,
  termsDays,
  fin,
  proformaOn,
  proRead,
}: {
  tab: TabId;
  wacc: ReturnType<typeof computeWacc>;
  waccInputs: WaccInputs;
  options: OptionResult[];
  capital: number;
  credit: CreditResult;
  requested: number;
  termsDays: number;
  fin: CustomerFinancials;
  proformaOn: boolean;
  proRead: ProformaRead;
}) {
  const best = options[0];
  const dso = fin.revenue > 0 ? Math.round((fin.ar / fin.revenue) * 365) : 0;

  return (
    <aside className="ms-guide" aria-label="User guide">
      <GlassCard variant="default" padding={20}>
        <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 4 }}>
          <GraduationCap size={16} color="var(--accent)" />
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>User guide</h2>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 16px', lineHeight: 1.5 }}>
          {tab === 'capital' && 'Deciding your own move: cost of capital → hurdle → spread → NPV.'}
          {tab === 'credit' && 'Underwriting a customer: ratios → score → sized credit limit.'}
          {tab === 'treasury' && 'Picking treasury tools: what each instrument does and when it fits.'}
          {tab === 'analysis' && 'Reading the machine: real-number ranges, cross-effects, trends, and the debt cycles.'}
          {tab === 'machine' && "Dalio's economic machine: how it cycles, the three equilibriums, the two levers."}
          {tab === 'formulas' && 'The reference: every formula, grouped by the decision it serves, plus the full glossary.'}{' '}
          The worked numbers below are live — they follow your inputs.
        </p>

        {tab === 'capital' && (
          <>
            <GuideSection n="A" title="Cost of capital (WACC)">
              <span style={guideLabel}>The equations</span>
              <Eq>cost of equity = Rf + β × ERP{'\n'}WACC = E/V × Re + D/V × Rd × (1 − tax)</Eq>
              <span style={guideLabel}>Live example — your inputs</span>
              <Eq>
                Re = {waccInputs.riskFree}% + {waccInputs.beta} × {ERP}% = {wacc.costEquity}%{'\n'}
                Rd = {waccInputs.riskFree}% + {waccInputs.creditSpread}% = {wacc.costDebtPreTax}% → ×(1−{TAX_RATE}) = {wacc.costDebtAfterTax}%{'\n'}
                WACC = {Math.round((1 - DEBT_WEIGHT) * 100)}%×{wacc.costEquity} + {Math.round(DEBT_WEIGHT * 100)}%×{wacc.costDebtAfterTax} = {wacc.wacc}%
              </Eq>
              Interest is tax-deductible, so debt's cost is taken after the tax shield. The 70/30
              equity/debt mix is a teaching assumption.
            </GuideSection>
            <GuideSection n="A2" title="The pro forma — when to use it">
              The spread chips are a shortcut. Pick <em>"From my pro forma"</em> instead when you
              want your own statements to set the spread: lenders read{' '}
              <Eq>adjusted debt = debt + pension & lease obligations{'\n'}leverage = adjusted debt ÷ EBITDA{'\n'}coverage = EBITDA ÷ interest</Eq>
              and the <em>weaker</em> ratio sets the tier (≤2× & ≥5× strong · ≤4× & ≥2.5× average ·
              beyond stretched).{' '}
              {proformaOn ? (
                <>
                  <span style={guideLabel}>Live — your pro forma</span>
                  <Eq>
                    leverage {Number.isFinite(proRead.leverage) ? proRead.leverage.toFixed(1) : 'n/m'}× · coverage {Number.isFinite(proRead.coverage) ? proRead.coverage.toFixed(1) : 'n/m'}× → {proRead.tier} → +{proRead.spread}%
                  </Eq>
                </>
              ) : null}
              <strong>Where pension matters:</strong> an unfunded pension is a debt you owe your own
              retirees — it has no loan document, but lenders add it to leverage all the same. It
              becomes an input the moment the plan is underfunded (or you carry big operating
              leases); leave it 0 otherwise.
            </GuideSection>
            <GuideSection n="B" title="The risk-adjusted hurdle">
              <span style={guideLabel}>The equation</span>
              <Eq>hurdle = WACC + option risk premium</Eq>
              Riskier moves must clear more: a competitor acquisition carries +4pp for integration
              risk, an AI platform +8pp. Near-guaranteed uses (paying down debt, T-bills) compare
              against the risk-free rate instead — using WACC there would be unfair.
            </GuideSection>
            <GuideSection n="C" title="The decision: spread and NPV">
              <span style={guideLabel}>The equations</span>
              <Eq>spread = expected return − hurdle{'\n'}NPV = Σ CF/(1+h)^t − investment</Eq>
              <span style={guideLabel}>Live example — best option now</span>
              {best ? (
                <>
                  <Eq>
                    {best.name}:{'\n'}{best.expReturn}% − {best.hurdle}% = {fmtSignedPct(best.spread)} → NPV {fmtSignedMoney(best.npv)} on {fmtMoney(capital, 0)}
                  </Eq>
                  Positive spread means the move earns more than capital costs — it creates value.
                  If nothing clears, returning capital or waiting IS the disciplined answer.
                </>
              ) : null}
            </GuideSection>
            <GuideSection n="D" title="NPV vs. IRR (interview-grade)">
              IRR is the rate where NPV = 0 — a <em>percentage</em>. NPV is <em>dollars of value
              created</em>. A tiny project can have a huge IRR and still create little value; when
              rankings conflict on mutually exclusive choices, trust NPV. In this model's flat cash
              flows the IRR <em>equals</em> the expected return — that's why the table shows one
              "Expected (IRR)" column, and why NPV flips positive exactly where IRR beats the hurdle.
            </GuideSection>
            <GuideSection n="E" title="Tracking Δ NPV">
              The "Δ NPV vs neutral" column is each project's NPV under YOUR scenario minus its NPV
              in a neutral market — the dollars the environment itself adds or removes. Change a
              dial and watch which projects the market giveth and which it taketh away; that delta,
              not the raw NPV, is what scenario risk means for a capital plan.
            </GuideSection>
          </>
        )}

        {tab === 'credit' && (
          <>
            <GuideSection n="A" title="What to do">
              Set the requested line and terms, then load a sample customer or type real financials.
              Every ratio, the score, and the recommendation recompute as you type.
            </GuideSection>
            <GuideSection n="B" title="The ratios">
              <span style={guideLabel}>The equations</span>
              <Eq>
                coverage = EBITDA ÷ interest{'\n'}leverage = debt ÷ EBITDA{'\n'}current = current assets ÷ current liabilities{'\n'}DSO = AR ÷ revenue × 365{'\n'}DIO = inventory ÷ COGS × 365{'\n'}DPO = AP ÷ COGS × 365{'\n'}CCC = DSO + DIO − DPO
              </Eq>
              <span style={guideLabel}>Live example — this customer</span>
              <Eq>DSO = {fmtMoney(fin.ar, 0)} ÷ {fmtMoney(fin.revenue, 0)} × 365 ≈ {dso} days</Eq>
              They collect from their own customers in ~{dso} days — if that's longer than your Net{' '}
              {termsDays}, expect your invoice to wait too.
            </GuideSection>
            <GuideSection n="C" title="Score → sized limit">
              <span style={guideLabel}>The equations</span>
              <Eq>
                cash-flow cap = 30% × (EBITDA − interest) × terms factor{'\n'}liquidity cap = 20% × (working capital + cash) × terms factor{'\n'}limit = min(requested, caps) — gated by score
              </Eq>
              <span style={guideLabel}>Live example</span>
              <Eq>
                caps: {fmtMoney(credit.cashCap, 0)} / {fmtMoney(credit.liquidityCap, 0)}{'\n'}score {credit.score}/100 → {credit.decision === 'approve' ? 'approve' : credit.decision === 'conditional' ? 'half the cap + security' : 'decline'} → {fmtMoney(credit.limit, 0)}
              </Eq>
              Score ≥70 approves up to the caps; 45–69 gets half with security (deposit, letter of
              credit, or guarantee); below 45, sell prepay/COD instead. Longer terms scale the caps
              down — Net 60 ×0.75, Net 90 ×0.6 — because your exposure lives longer.
            </GuideSection>
            <GuideSection n="D" title="Security & the classification ladder">
              The score maps to a classification: <strong style={{ color: 'var(--pos)' }}>≥70 unsecured</strong>,{' '}
              <strong style={{ color: 'var(--severity-medium)' }}>45–69 secured</strong>,{' '}
              <strong style={{ color: 'var(--neg)' }}>&lt;45 prepay/COD</strong>. Security moves a
              customer up the ladder: a <em>guarantee</em> improves recovery, so it unlocks the full
              computed cap (but adds no cash — it can't rescue a decline); a <em>cash deposit</em> or{' '}
              <em>standby letter of credit</em> is dollar-for-dollar collateral, so it can support
              the full {fmtMoney(requested, 0)} at any score. Prepay works for anyone — zero exposure.
            </GuideSection>
            <GuideSection n="E" title="Why these six ratios">
              Coverage and leverage ask <em>"can they pay everyone?"</em>; the current ratio asks{' '}
              <em>"can they pay this year?"</em>; margin asks <em>"is there cushion?"</em>; DSO and
              the cash conversion cycle ask <em>"how long is my money inside their business?"</em> —
              the requested {fmtMoney(requested, 0)} is your inventory riding on their answers.
            </GuideSection>
            <GuideSection n="F" title="The industry backdrop">
              Ratios are a photo; the industry trend is the weather. Pick the customer's industry
              and the model shows its projected backdrop under your scenario — a headwind means the
              same "watch" ratios deserve more skepticism, shorter terms, and heavier security; a
              tailwind makes good ratios more believable. It never changes the score: it changes
              how much you trust it.
            </GuideSection>
          </>
        )}

        {tab === 'treasury' && (
          <>
            <GuideSection n="A" title="What to do">
              Set the scenario, then read each card's live verdict. Chips: <strong style={{ color: 'var(--pos)' }}>Fits</strong> —
              the environment argues for it; <strong style={{ color: 'var(--severity-medium)' }}>Situational</strong> — depends on
              your exposures; <strong style={{ color: 'var(--neg)' }}>Not the moment</strong> — the environment argues against.
            </GuideSection>
            <GuideSection n="B" title="The equations">
              <Eq>
                swap savings ≈ notional × Δrate{'\n'}hedged cost = quantity × locked forward price{'\n'}option cost = premium (known max loss)
              </Eq>
              <span style={guideLabel}>Example</span>
              $1M of floating-rate debt, rates rise 1%: a pay-fixed swap saves ≈ $1,000,000 × 1% ={' '}
              <strong>$10,000/yr</strong>. The same math in reverse is what you LOSE by locking right
              before cuts — direction matters.
            </GuideSection>
            <GuideSection n="C" title="The one rule">
              Hedge <em>committed exposures</em> — inventory you must buy, debt you already owe,
              invoices already signed — to buy <strong>certainty</strong>. A hedge with nothing
              behind it is just a market bet with extra paperwork. And keep Dalio's frame: you don't
              need to predict the environment if the position is built to survive every one.
            </GuideSection>
          </>
        )}

        {tab === 'analysis' && (
          <>
            <GuideSection n="A" title="What to do">
              Set the dials (or load a preset / today's market), then read down: what each setting
              means in real numbers, where the dials are pushing each other, the projected drift,
              and what it all means for debt — the economy's and yours.
            </GuideSection>
            <GuideSection n="B" title="The ranges are anchors, not lines">
              The −2…+2 dials abstract real indicators: GDP around a ~2% trend, CPI around the
              Fed's 2% target, fed funds around a ~3% neutral rate, deficits around ~3% of GDP.
              The ranges shown are teaching anchors — what matters is <em>vs. expectations</em>:
              markets move on surprise, not on the level itself.
            </GuideSection>
            <GuideSection n="C" title="Why the dials move each other">
              <span style={guideLabel}>The loop</span>
              <Eq>growth ↑ → inflation ↑ → Fed ↑ → (12–18 mo) → growth ↓ → inflation ↓ → Fed ↓ → repeat</Eq>
              That single loop IS the short-term debt cycle. The trend chart just runs it forward:
              each quarter every dial drifts toward where the others push it. Fiscal is the odd one
              out — it pushes but isn't pushed, because budgets are political choices, not market
              consequences.
            </GuideSection>
            <GuideSection n="D" title="Reading the market & industry trends">
              Each line is one industry or asset class's modeled 12-month impact, recomputed at
              every projected quarter — the static impact table from Market Scenarios, set in
              motion. Compare up to four at once (industries or asset classes), and use the
              industry view as a customer-type screen: a line sliding below zero is a customer
              segment whose credit you should be re-reading on tab 2.
            </GuideSection>
            <GuideSection n="E" title="Short-term vs. long-term debt (yours)">
              Rule of thumb: <strong>floating debt reprices in days; fixed debt reprices at
              refinancing.</strong> So a hiking cycle punishes floating and protects fixed
              (inflation even erodes fixed debt in real terms), while a cutting cycle rewards
              floating and strands old high-coupon fixed. Tab 3's pay-fixed swap is the tool that
              moves debt from one column to the other without reissuing it.
            </GuideSection>
          </>
        )}

        {tab === 'machine' && (
          <>
            <GuideSection n="A" title="What to do">
              Set the dials, then read down: the cycle chart shows the three stacked forces, the
              equilibrium cards score where the machine is out of balance, and the lever cards tell
              you which policy changes to watch for next. Everything recomputes as you move a dial.
            </GuideSection>
            <GuideSection n="B" title="The machine in one paragraph">
              The economy is the sum of transactions, and <em>credit</em> is the biggest, most
              volatile part — one person's spending is another's income, so credit amplifies both
              directions. Stack three forces: productivity (the trend), the short-term debt cycle
              (~7–10 yrs of credit expanding and contracting), and the long-term debt cycle
              (~50–75 yrs of leverage ratcheting up until deleveraging). Most of what feels like
              news is just where you sit on those two waves.
            </GuideSection>
            <GuideSection n="C" title="The three equilibriums">
              <Eq>1. debt growth ≈ income growth{'\n'}2. operating rate: not too hot, not too cold{'\n'}3. equities &gt; bonds &gt; cash, by fair premiums</Eq>
              The machine constantly pulls toward all three; the pull IS the market move. An
              out-of-balance reading is not a prediction — it's a direction: it tells you what
              forces (Fed moves, repricing, deleveraging) are being summoned to restore it.
            </GuideSection>
            <GuideSection n="D" title="The two levers">
              Monetary (the Fed: rates + QE/QT) and fiscal (taxes + spending) are the only steering
              inputs — everything else is the machine responding. Watch them together, not
              separately: pushing the same way is maximum force (2020), opposed is an offset that
              distorts (2022), and both idle means the cycle runs free. The lever positions are
              your dials — which is the point: this whole page is those two levers plus their
              consequences.
            </GuideSection>
            <GuideSection n="E" title="Why this matters for tabs 1–4">
              The equilibriums price everything upstream: equilibrium 3 sets your WACC inputs (tab
              1), equilibrium 1 decides how easily your customer refinances (tab 2), and the levers
              drive every hedge verdict (tab 3) and trend (tab 4). Dalio's frame: you don't need to
              predict the machine — you need to know where it is and build positions that survive
              every phase.
            </GuideSection>
          </>
        )}

        {tab === 'formulas' && (
          <>
            <GuideSection n="A" title="What this tab is for">
              A single reference: every equation the Lab uses, grouped by decision, each with the
              formula, what it says in words, and what its output feeds. Use it two ways — look up
              one formula when a tab surprises you, or read a whole group top to bottom to see how
              a decision is actually assembled.
            </GuideSection>
            <GuideSection n="B" title="How the groups connect">
              <Eq>machine → rates & premiums → WACC → hurdles → your moves{'\n'}machine → customer's backdrop → ratios → score → limit{'\n'}what's left exposed → the hedging playbook</Eq>
              No formula stands alone: the same four dials sit under every group, which is why one
              scenario change ripples through every tab at once. Practicing that ripple — move a
              dial, predict which numbers change, then check — is the fastest way to learn the
              system.
            </GuideSection>
            <GuideSection n="C" title="Where the numbers come from">
              Fixed teaching assumptions (ERP 5.5%, 25% tax, 70/30 mix, the band thresholds, the
              sensitivities) are deliberately visible and deliberately simple — the point is the
              mechanism. Every threshold appears in the formula cards, so you can challenge any of
              them: "why 30% of free cash flow?" is exactly the right question.
            </GuideSection>
          </>
        )}

        <details style={{ marginBottom: 14 }}>
          <summary style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}>
            Glossary — every acronym in the Lab
          </summary>
          <div className="col" style={{ gap: 6, marginTop: 8 }}>
            {GLOSSARY.map((g) => (
              <div key={g.term} style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>{g.term}</strong>{' '}
                <span style={{ color: 'var(--text-tertiary)' }}>— {g.full}.</span>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{g.def}</span>
              </div>
            ))}
          </div>
        </details>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          Illustrative teaching assumptions throughout. Education only; not investment, credit, or
          tax advice.
        </p>
      </GlassCard>
    </aside>
  );
}
