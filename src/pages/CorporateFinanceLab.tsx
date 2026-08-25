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
  Database,
  FileText,
  GraduationCap,
  Handshake,
  History,
  Globe,
  Home,
  Landmark,
  Percent,
  RefreshCcw,
  Rocket,
  Workflow,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
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
import { ASSET_CLASSES, CUSTOM_SCENARIO_ID, INDUSTRIES, MacroFactors, SCENARIOS, SUB_INDUSTRIES } from '../lib/macroModel';
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
  CPI_PCE_FACTS,
  INFLATION_COMPONENTS,
  assetLens,
  impactTrend,
  inflationNow,
  inflationTrend,
  industryBackdrop,
  levelFor,
  projectDials,
  shortCyclePhase,
} from '../lib/marketAnalysis';
import { FORMULA_GROUPS, GLOSSARY } from '../lib/formulaReference';
import {
  DEFAULT_DCF_INPUTS,
  DEPRECIATION_WALKTHROUGH,
  DcfInputs,
  EV_BRIDGE,
  runDcf,
  sensitivityGrid,
} from '../lib/valuation';
import {
  DALIO_INVEST_PRINCIPLES,
  DALIO_RULES,
  EQ_STATUS_LABEL,
  EquilibriumRead,
  MACHINE_FORCES,
  MachinePoint,
  equilibriumReads,
  leverInterplay,
  leverWatch,
  machineCurve,
} from '../lib/economicMachine';
import { INDUSTRY_PROFILES, adviseCapital } from '../lib/industryPlaybook';
import {
  AnalysisTier,
  BEHAVIORAL_STAPLES,
  DRILL_CARDS,
  DrillCategory,
  EY_EXHIBITS,
  EY_MARKET_ROUTINE,
  EY_OUTLOOK,
  EY_ROUTINE_EXPECTATION,
  EY_STANDARD_ANALYSES,
  GAP_CHECK,
  GapStatus,
  INTERVIEW_FORMAT,
  TAKE_HOME_PLAN,
} from '../lib/eyPrep';
import {
  REPORT_COUNTRIES,
  REPORT_FORMULAS,
  REPORT_HOW_TO_READ,
  REPORT_INDUSTRIES,
  REPORT_STATES,
  ReportRef,
  combinedRead,
  countryReport,
  industryReport,
  refText,
  stateReport,
} from '../lib/reportBuilder';
import {
  DEFAULT_ACCRETION_INPUTS,
  DEFAULT_BETA_INPUTS,
  DEFAULT_BREAKEVEN_INPUTS,
  DEFAULT_CAGR_INPUTS,
  DEFAULT_COMPS_INPUTS,
  DEFAULT_COST_INPUTS,
  DEFAULT_HURDLE_INPUTS,
  DEFAULT_IMPAIR_INPUTS,
  DEFAULT_IRR_INPUTS,
  DEFAULT_LBO_INPUTS,
  DEFAULT_PPA_INPUTS,
  DEFAULT_RNPV_INPUTS,
  DEFAULT_ROIC_INPUTS,
  accretionDilution,
  betaWorkshop,
  breakEven,
  cagr,
  compsCompare,
  costApproach,
  expectedPayoff,
  goodwillImpairment,
  hurdleBuilder,
  incrementalRoic,
  irrLab,
  lboMini,
  ppa,
} from '../lib/gapWorkbench';
import {
  AUCTION_BUYERS,
  BOND_BASICS,
  CUTS_VS_TENYEAR,
  PRACTICAL_SHIFT,
  RATES_SNAPSHOT,
  RATE_STACK,
  SCALE_STORY,
  SNAP_REASONS,
  TERM_PREMIUM_DEF,
  THREE_WAYS_DOWN,
  breakevens,
  curveShape,
  curveSlopes,
} from '../lib/ratesCurve';
import {
  CRE_BENCHMARKS,
  CRE_TRANSMISSION,
  DEFAULT_CRE_INPUTS,
  DEFAULT_PAYMENT_INPUTS,
  RESI_TRANSMISSION,
  RE_DECISION_READS,
  capRateSensitivity,
  creKpis,
  creRateStress,
  housingPaymentRatioPct,
  monthlyPayment,
  mortgageBenchmark,
  paymentSensitivity,
} from '../lib/realEstate';
import {
  DEFAULT_DILUTION_INPUTS,
  FINANCING_MENU,
  IPO_REFERENCE,
  SECTOR_IPO_SOURCE,
  SECTOR_IPO_TRENDS,
  THREE_SCORES_RULE,
  WINDOW_CHECKLISTS,
  dilution,
  sectorIpoRows,
  windowScore,
} from '../lib/ipoWindow';
import {
  BANK_METRICS_NOTE,
  BENCHMARK_SOURCE,
  DAMODARAN_JAN2026,
  DEFAULT_COMPANY_METRICS,
  DEFAULT_RETAIL_INPUTS,
  DEFAULT_RULE40_INPUTS,
  DEFAULT_RUNWAY_INPUTS,
  INDUSTRY_HEALTH_QUESTIONS,
  OBSERVED_NOT_HEALTHY_RULE,
  biotechRunway,
  compareToBenchmark,
  retailKit,
  rule40,
} from '../lib/industryBenchmarks';
import {
  COUNTRY_DEBT,
  COUNTRY_DEBT_SOURCE,
  CURRENCY_SOURCE,
  CURRENCY_TRENDS,
  CURRENCY_YEARS,
  DEBT_TREND_YEARS,
  GDP_IMPACT_COUNTRIES,
  GDP_IMPACT_NOTE,
  GSP_IMPACT_STATES,
  KOREA_CASE,
  POPULISM_NOTE,
  POPULISM_WATCH,
  TRADE_BALANCES,
  TRADE_SOURCE,
  GEO_CALENDAR_COUNTRIES,
  GEO_CALENDAR_NOTE,
  GEO_CALENDAR_STATES,
  GEO_CURRENT,
  GEO_DRIVERS,
  STATE_DEBT,
  STATE_DEBT_SOURCE,
  currencyRows,
  tradeBalanceB,
} from '../lib/debtGeo';
import { DEFAULT_FULL_CYCLE, FullCycleInputs, runFullCycle } from '../lib/fullCycle';
import {
  DATA_MODES,
  PROVIDER_REGISTRY,
  SERIES_CATALOG,
  STORE_AS_OF,
  TIER_LABELS,
  TIMING_RULES,
  latestObservation,
  observationsFor,
  staleness,
} from '../lib/observationStore';
import { BACKTEST_METHOD, REGIMES, runBacktests } from '../lib/regimeBacktest';

// ---------------------------------------------------------------------------
// Small local pieces
// ---------------------------------------------------------------------------

type TabId =
  | 'capital'
  | 'credit'
  | 'analysis'
  | 'machine'
  | 'valuation'
  | 'formulas'
  | 'eygap'
  | 'drill'
  | 'rounds'
  | 'gapwork'
  | 'rates'
  | 'realestate'
  | 'ipo'
  | 'benchmarks'
  | 'debtgeo'
  | 'fullcycle'
  | 'datasources'
  | 'backtest'
  | 'report';

const TABS: { id: TabId; label: string; icon: typeof Briefcase }[] = [
  { id: 'capital', label: "1 · Your company's moves", icon: Briefcase },
  { id: 'credit', label: '2 · Customer credit', icon: ShieldCheck },
  { id: 'analysis', label: '3 · Market analysis', icon: Activity },
  { id: 'machine', label: '4 · The economic machine', icon: Cog },
  { id: 'valuation', label: '5 · Valuation (DCF & comps)', icon: TrendingUp },
  { id: 'formulas', label: '6 · Formulas & decisions', icon: Calculator },
  { id: 'eygap', label: '7 · EY gap check', icon: ClipboardCheck },
  { id: 'drill', label: '8 · EY interview drill', icon: GraduationCap },
  { id: 'rounds', label: '9 · EY round map', icon: Handshake },
  { id: 'gapwork', label: '10 · Gap workbench', icon: Landmark },
  { id: 'rates', label: '11 · Rates & the bond market', icon: Percent },
  { id: 'realestate', label: '12 · Real estate financing', icon: Home },
  { id: 'ipo', label: '13 · IPO & capital markets', icon: Rocket },
  { id: 'benchmarks', label: '14 · Industry benchmarks', icon: Scale },
  { id: 'debtgeo', label: '15 · Debt & geopolitics', icon: Globe },
  { id: 'fullcycle', label: '16 · The full cycle (EV·ROIC·WACC)', icon: Workflow },
  { id: 'datasources', label: '17 · Data & sources', icon: Database },
  { id: 'backtest', label: '18 · Regime backtest', icon: History },
  { id: 'report', label: '19 · Report builder', icon: FileText },
];

const ANALYSIS_TIER_META: Record<AnalysisTier, { label: string; tone: string }> = {
  core: { label: 'core — expect it', tone: 'var(--success, #22c55e)' },
  named: { label: 'named in postings', tone: 'var(--info, #3b82f6)' },
  peripheral: { label: 'peripheral at EY', tone: 'var(--text-tertiary)' },
};

const GAP_STATUS_META: Record<GapStatus, { label: string; tone: string }> = {
  covered: { label: 'Covered in the Lab', tone: 'var(--pos)' },
  partial: { label: 'Partly covered', tone: 'var(--severity-medium)' },
  gap: { label: 'Gap — know the one-liner', tone: 'var(--neg)' },
};

const DRILL_CATEGORY_META: Record<DrillCategory, { title: string; blurb: string }> = {
  technical: {
    title: 'Technical drill',
    blurb: 'The questions reported from EY valuation/CF interviews, each with a model answer. Read the question, answer OUT LOUD, then reveal and compare.',
  },
  behavioral: {
    title: 'Behavioral drill (the HireVue round)',
    blurb: 'Scaffolds, not scripts — the structure interviewers listen for. Fill each with YOUR story and rehearse to 90 seconds.',
  },
  market: {
    title: 'Market-trends drill',
    blurb: 'The current-events answers, anchored to EY-Parthenon’s own 2026 outlook numbers.',
  },
};

const BACKDROP_META: Record<'tailwind' | 'neutral' | 'headwind', { label: string; tone: string }> = {
  tailwind: { label: 'Tailwind', tone: 'var(--pos)' },
  neutral: { label: 'Neutral backdrop', tone: 'var(--severity-medium)' },
  headwind: { label: 'Headwind', tone: 'var(--neg)' },
};

const TREND_DEFAULTS: Record<'industries' | 'assets' | 'subs', string[]> = {
  industries: ['tech', 'financials', 'staples', 'energy'],
  assets: ['stocks', 'bonds-long', 'gold', 'real-estate'],
  subs: ['ai-semis', 'crypto', 'agriculture', 'housing'],
};

const CAP_STANCE_META: Record<'offense' | 'balanced' | 'defense', { label: string; tone: string }> = {
  offense: { label: 'Offense — deploy', tone: 'var(--pos)' },
  balanced: { label: 'Balanced — stage it', tone: 'var(--severity-medium)' },
  defense: { label: 'Defense — preserve', tone: 'var(--neg)' },
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

function PctInput({
  value,
  onChange,
  max = 25,
  suffix = '%',
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  suffix?: string;
}) {
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
          if (!Number.isNaN(n) && n <= max) onChange(n);
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
      <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{suffix}</span>
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

  // Tab 3 state (all derived from the shared scenario).
  const pressures = useMemo(() => dialPressures(factors), [factors]);
  const cyclePhase = useMemo(() => shortCyclePhase(factors), [factors]);
  const debtReads = useMemo(() => debtPlaybook(factors), [factors]);
  const trend = useMemo(() => projectDials(factors), [factors]);
  const [trendGroup, setTrendGroup] = useState<'industries' | 'assets' | 'subs'>('industries');
  const [trendSel, setTrendSel] = useState<Record<'industries' | 'assets' | 'subs', string[]>>(TREND_DEFAULTS);
  const toggleTrendSel = (id: string) =>
    setTrendSel((s) => {
      const cur = s[trendGroup];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 4 ? cur : [...cur, id];
      return { ...s, [trendGroup]: next };
    });
  const trendTargets = trendGroup === 'industries' ? INDUSTRIES : trendGroup === 'assets' ? ASSET_CLASSES : SUB_INDUSTRIES;
  const marketTrend = useMemo(() => impactTrend(trendTargets, factors), [trendTargets, factors]);
  const [inflSel, setInflSel] = useState<string[]>(['shelter', 'energy']);
  const toggleInflSel = (id: string) =>
    setInflSel((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 2 ? cur : [...cur, id]));
  const inflTrend = useMemo(() => inflationTrend(factors), [factors]);
  const inflNow = useMemo(() => inflationNow(), []);
  const [lensIndustryId, setLensIndustryId] = useState('tech');
  const [lensAssetSel, setLensAssetSel] = useState<string[]>(['stocks', 'bonds-long', 'gold']);
  const toggleLensAsset = (id: string) =>
    setLensAssetSel((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 3 ? cur : [...cur, id]));
  const lensIndustry = INDUSTRIES.find((i) => i.id === lensIndustryId) ?? INDUSTRIES[0];
  const lensRows = useMemo(() => assetLens(lensIndustryId, factors), [lensIndustryId, factors]);
  const lensTrend = useMemo(
    () => impactTrend([lensIndustry, ...ASSET_CLASSES.filter((a) => lensAssetSel.includes(a.id))], factors),
    [lensIndustry, lensAssetSel, factors],
  );
  const custIndustry = INDUSTRIES.find((i) => i.id === custIndustryId) ?? null;
  const backdrop = useMemo(
    () => (custIndustry ? industryBackdrop(custIndustry, factors) : null),
    [custIndustry, factors],
  );
  const backdropTrend = useMemo(
    () => (custIndustry ? impactTrend([custIndustry], factors) : null),
    [custIndustry, factors],
  );

  // Tab 4 state (also derived from the shared scenario).
  const machineData = useMemo(() => machineCurve(factors), [factors]);
  const [advIndustryId, setAdvIndustryId] = useState('tech');
  const advice = useMemo(
    () => adviseCapital(advIndustryId, effInputs.riskFree, factors),
    [advIndustryId, effInputs, factors],
  );

  // Tab 5 state (valuation workbench).
  const [dcf, setDcf] = useState<DcfInputs>(DEFAULT_DCF_INPUTS);
  const setDcfField = (key: keyof DcfInputs, v: number) => setDcf((d) => ({ ...d, [key]: v }));
  const dcfResult = useMemo(() => runDcf(dcf), [dcf]);
  const dcfGrid = useMemo(() => sensitivityGrid(dcf), [dcf]);
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
        .sticky-conditions { position: sticky; top: 8px; z-index: 40; border-radius: var(--radius-lg, 16px); background: var(--bg, var(--bg-elevated)); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28); }
        .sticky-conditions > * { backdrop-filter: none; background: var(--bg-elevated); }
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
          Six ways to run the numbers: decide <strong>your company's next move</strong> under
          real market conditions — with the <strong>treasury &amp; hedging playbook</strong> right
          under it, protecting what the move leaves exposed — <strong>underwrite a customer</strong>{' '}
          before extending them credit, read the <strong>market itself</strong> — ranges, cross-effects, industry trends, and the
          debt cycles — study <strong>the economic machine</strong>: Dalio's cycles, equilibriums,
          and levers — <strong>value a business</strong> with a DCF, comps, and the sensitivity
          grid — and keep the <strong>formula reference</strong> with every equation, decision
          flow, and acronym. Tabs 7–9 are <strong>EY interview prep</strong>: the gap check, the
          Q&amp;A drill, and the round map; tab 10 is the <strong>gap workbench</strong>; tabs
          11–15 open the <strong>markets themselves</strong>: the bond market and yield curve,
          real-estate financing, IPO &amp; capital markets, industry benchmarks, and sovereign
          debt &amp; geopolitics.{' '}
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
                    <span style={dcfHintStyle}>The cash on the table for one move. Example: $1,000,000 — every NPV below is sized on it.</span>
                  </div>
                  <div className="col" style={{ gap: 6 }}>
                    <span style={labelStyle}>Risk-free rate (10-yr Treasury)</span>
                    <PctInput value={waccInputs.riskFree} onChange={(v) => setWaccInputs((w) => ({ ...w, riskFree: v }))} />
                    <span style={dcfHintStyle}>Today's 10-yr Treasury yield — the price of time with zero credit risk. Example: 4%.</span>
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

              <div className="sticky-conditions">
              <StepCard n="B" icon={<Compass size={17} />} title="Market conditions">
                <p style={hintStyle}>
                  The same four forces as Market Scenarios. They shift each option's expected return —
                  deals get cheap in downturns, long-payoff bets suffer when rates rise. This card
                  stays pinned as you scroll, so you can flip the dials and watch the sections
                  below react.
                </p>
                <ScenarioPicker scenarioId={scenarioId} factors={factors} onToday={pickToday} onPreset={pickPreset} onDial={setDial} />
              </StepCard>
              </div>

              <StepCard n="C" icon={<BarChart3 size={17} />} title={`Which move clears its hurdle — ${scenarioName}`}>
                <p style={hintStyle}>
                  Each option's expected return vs. its <em>risk-adjusted hurdle</em> (WACC + a premium
                  for that option's risk; near-guaranteed uses compare against the risk-free rate
                  instead). Positive spread = the move creates value on your {fmtMoney(capital, 0)}.
                </p>
                <OptionsSection rows={options} capital={capital} neutralNpvById={neutralNpvById} />
              </StepCard>

              <StepCard n="D" icon={<Umbrella size={17} />} title={`Hedge what the move leaves exposed — the treasury playbook — ${scenarioName}`}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
                  {(
                    [
                      ['revenue', 'Revenue (annual)', 'Their total sales for the year, from the income statement. Mesa Supply example: $10,000,000.'],
                      ['cogs', 'Cost of goods sold', 'Direct cost of what they sold — drives the inventory and payables day-counts. Example: $7,000,000.'],
                      ['ebitda', 'EBITDA', 'Operating profit before interest/tax/depreciation — the cash engine the caps size against. Example: $1,200,000.'],
                      ['interest', 'Interest expense', 'Their annual interest bill. Coverage = EBITDA ÷ this. Example: $350,000 → 3.4× (watch band).'],
                      ['totalDebt', 'Total debt', 'All borrowings on the balance sheet. Leverage = this ÷ EBITDA. Example: $3,500,000 → 2.9×.'],
                      ['cash', 'Cash', 'Cash & equivalents — adds to the liquidity cap. Example: $800,000.'],
                      ['currentAssets', 'Current assets', 'Everything turning to cash within a year (cash + AR + inventory…). Example: $4,500,000.'],
                      ['currentLiabilities', 'Current liabilities', 'Everything due within a year — your invoice joins this line. Example: $3,000,000 → current ratio 1.5.'],
                      ['ar', 'Accounts receivable', 'What their customers owe THEM. DSO = AR ÷ revenue × 365. Example: $1,800,000 → 66 days.'],
                      ['inventory', 'Inventory', 'Stock on the shelf. DIO = inventory ÷ COGS × 365. Example: $1,600,000 → 83 days.'],
                      ['ap', 'Accounts payable', 'What they owe suppliers like you. DPO = AP ÷ COGS × 365. Example: $1,400,000 → 73 days.'],
                    ] as [keyof CustomerFinancials, string, string][]
                  ).map(([key, label, hint]) => (
                    <div key={key} className="col" style={{ gap: 5 }}>
                      <span style={labelStyle}>{label}</span>
                      <MoneyInput value={fin[key]} onChange={(v) => setFinField(key, v)} width={110} />
                      <span style={dcfHintStyle}>{hint}</span>
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
                    No industry selected — pick one above, or compare several at once on tab 3's
                    market &amp; industry trends chart.
                  </p>
                )}
              </StepCard>
            </>
          )}

          {tab === 'analysis' && (
            <>
              <div className="sticky-conditions">
              <StepCard n="A" icon={<Compass size={17} />} title="Market conditions">
                <p style={hintStyle}>
                  The same four dials as everywhere else — set them here and the readings below
                  translate each one into real numbers, cross-pressures, and a cycle read. This
                  card stays pinned as you scroll, so you can flip a dial and watch every chart
                  below move.
                </p>
                <ScenarioPicker scenarioId={scenarioId} factors={factors} onToday={pickToday} onPreset={pickPreset} onDial={setDial} />
              </StepCard>
              </div>

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
                  <Chip active={trendGroup === 'subs'} onClick={() => setTrendGroup('subs')}>
                    Sub-industries (AI, crypto, agriculture…)
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

              <StepCard n="E" icon={<Activity size={17} />} title={`Inflation up close — CPI vs PCE — ${scenarioName}`}>
                <p style={hintStyle}>
                  The inflation dial, opened up. <strong>CPI</strong> is the headline gauge;{' '}
                  <strong>PCE</strong> is what the Fed targets at 2% — broader scope, chained
                  formula, usually ~0.3pp lower. Each is a weighted average of components with very
                  different personalities: energy is instant and wild, shelter is huge and ~3
                  quarters late, services are sticky. Both gauges and your chosen components run
                  along the projected path below.
                </p>
                <GlassCard variant="nested" padding={14} style={{ marginBottom: 12 }}>
                  <div className="between" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Current state — as of {inflNow.asOf}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{inflNow.source}</span>
                  </div>
                  <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
                    <StatPill label="CPI (official print)" value={`${inflNow.cpi}% YoY`} strong />
                    <StatPill label="Core CPI (official)" value={`${inflNow.coreCpi}%`} />
                    <StatPill label="PCE (model-implied)" value={`≈${inflNow.pce}%`} />
                    <StatPill label="Core PCE (model-implied)" value={`≈${inflNow.corePce}%`} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '10px 0 0' }}>
                    {inflNow.detail}
                  </p>
                  <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.5, margin: '6px 0 0' }}>
                    The consistency check the tests pin: the component readings below, CPI-weighted,
                    reproduce the official print ({inflNow.weightedCpi}% vs {inflNow.cpi}%), and PCE
                    is DERIVED from the same components with the PCE weights and the substitution
                    formula — the model's claim about how the two gauges relate, applied to today.
                    Under your scenario the model's quarter-0 CPI reads {inflTrend[0].cpi}% —
                    the gap between a model's anchor and the actual print is exactly what markets
                    trade on.
                  </p>
                </GlassCard>
                <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 4 }}>
                  {INFLATION_COMPONENTS.map((c) => (
                    <Chip key={c.id} active={inflSel.includes(c.id)} onClick={() => toggleInflSel(c.id)}>
                      {c.name}
                    </Chip>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '0 0 4px' }}>
                  CPI and PCE always chart; pick up to 2 components to overlay.
                </p>
                <ImpactTrendChart
                  data={inflTrend}
                  series={[
                    { id: 'cpi', label: 'CPI (headline)' },
                    { id: 'pce', label: 'PCE (Fed target gauge)' },
                    ...INFLATION_COMPONENTS.filter((c) => inflSel.includes(c.id)).map((c) => ({ id: c.id, label: c.name })),
                  ]}
                  height={240}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginTop: 12 }}>
                  {INFLATION_COMPONENTS.map((c) => (
                    <GlassCard key={c.id} variant="nested" padding={12}>
                      <div className="between" style={{ gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{c.name}</span>
                        <span className="num" style={{ fontSize: 11, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                          CPI {c.cpiWeightPct}% · PCE {c.pceWeightPct}%
                        </span>
                      </div>
                      <div className="num" style={{ fontSize: 16, fontWeight: 700, color: toneFor(-(inflNow.componentsNow[c.id] ?? 0) + 2.5), textAlign: 'left', marginBottom: 4 }}>
                        now ≈ {inflNow.componentsNow[c.id]}%
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{c.note}</div>
                    </GlassCard>
                  ))}
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.5, margin: '10px 0 0' }}>
                  Teaching model, not data: each component follows the projected inflation dial with
                  its own beta and lag, and the gauges are the weighted averages (PCE less the
                  substitution-formula effect). Neutral dials ⇒ CPI ≈ 2.5%, PCE ≈ 2.25%.
                </p>
              </StepCard>

              <StepCard n="F" icon={<TrendingUp size={17} />} title={`Asset classes by industry — ${scenarioName}`}>
                <p style={hintStyle}>
                  The breakout: pick an <strong>industry</strong> and see how each{' '}
                  <strong>asset class</strong> performs alongside it under this scenario. The bold
                  line is the industry; the others are the assets you select. Below the chart, every
                  asset is scored by how its macro sensitivities <em>align</em> with that industry —
                  assets that move <strong>against</strong> your industry diversify the risk you
                  already run; assets that move <strong>with</strong> it double down.
                </p>
                <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
                  {INDUSTRIES.map((i) => (
                    <Chip key={i.id} active={lensIndustryId === i.id} onClick={() => setLensIndustryId(i.id)}>
                      {i.name}
                    </Chip>
                  ))}
                </div>
                <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 4 }}>
                  {ASSET_CLASSES.map((a) => (
                    <Chip key={a.id} active={lensAssetSel.includes(a.id)} onClick={() => toggleLensAsset(a.id)}>
                      {a.name}
                    </Chip>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '0 0 4px' }}>
                  Pick up to 3 asset classes to chart against {lensIndustry.name}.
                </p>
                <ImpactTrendChart
                  data={lensTrend}
                  series={[
                    { id: lensIndustry.id, label: `${lensIndustry.name} (industry)` },
                    ...ASSET_CLASSES.filter((a) => lensAssetSel.includes(a.id)).map((a) => ({ id: a.id, label: a.name })),
                  ]}
                  height={260}
                />
                <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700, margin: '14px 0 6px' }}>
                  Every asset class vs. {lensIndustry.name} — best diversifiers first
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                  {lensRows.map((row) => {
                    const meta =
                      row.relation === 'against'
                        ? { label: 'Diversifies you', tone: 'var(--pos)' }
                        : row.relation === 'with'
                          ? { label: 'Moves with you', tone: 'var(--neg)' }
                          : { label: 'Independent', tone: 'var(--severity-medium)' };
                    return (
                      <GlassCard key={row.id} variant="nested" padding={12}>
                        <div className="between" style={{ gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{row.name}</span>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              color: meta.tone,
                              border: `1px solid ${meta.tone}`,
                              borderRadius: 999,
                              padding: '2px 9px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                          <span className="num" style={{ color: toneFor(row.now), fontWeight: 700 }}>{fmtSignedPct(row.now)}</span>
                          <span style={{ color: 'var(--text-tertiary)' }}> this scenario · alignment </span>
                          <span className="num" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{row.alignment > 0 ? '+' : ''}{row.alignment}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.5, marginTop: 4 }}>{row.driver}</div>
                      </GlassCard>
                    );
                  })}
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.5, margin: '10px 0 0' }}>
                  Alignment is the cosine of the two macro-sensitivity vectors (−1…+1) — model-space
                  co-movement, not historical correlation. This is Dalio's <strong>Holy Grail</strong>{' '}
                  in miniature: his talk's numbers — average stocks are ~60% correlated with each
                  other, so a thousand of them diversify no better than 5–10; but five{' '}
                  <em>uncorrelated</em> return streams more than halve your risk, and ~15 cut it by
                  ~80%, improving return-to-risk about five-fold. Hunt the zero and negative
                  alignments — and note the trap the chart exposes: for long-duration industries
                  like tech, long bonds move <em>with</em> you when rates are the shock.
                </p>
              </StepCard>

              <StepCard n="G" icon={<Landmark size={17} />} title="The debt cycles — short term & long term">
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

              <StepCard n="H" icon={<Wallet size={17} />} title={`Your debt book — short vs. long term — ${scenarioName}`}>
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
              <div className="sticky-conditions">
              <StepCard n="A" icon={<Compass size={17} />} title="Market conditions">
                <p style={hintStyle}>
                  Ray Dalio's economic machine, made interactive. Set the dials — the equilibrium
                  readings and the lever watch below respond live. This card stays pinned as you
                  scroll, so the cycle chart and equilibrium cards react in view.
                </p>
                <ScenarioPicker scenarioId={scenarioId} factors={factors} onToday={pickToday} onPreset={pickPreset} onDial={setDial} />
              </StepCard>
              </div>

              <StepCard n="B" icon={<Cog size={17} />} title="How the market cycles">
                <p style={hintStyle}>
                  Three forces stacked on each other: <strong>productivity growth</strong> (slow,
                  powerful, always up over time), the <strong>short-term debt cycle</strong> (~
                  7–10 years — the business cycle you feel), and the <strong>long-term debt
                  cycle</strong> (~50–75 years — leverage building above the trend, then the
                  deleveraging below it). <strong>Year 0 is today, positioned by your dials</strong>:
                  growth sets where the short wave starts, the Fed sets which way it's heading and
                  where the long swell sits — move the buttons above and watch the path from "now"
                  change.
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

              <StepCard n="E" icon={<RefreshCcw size={17} />} title="The four big forces + the two levers — vs. the three equilibriums">
                <p style={hintStyle}>
                  Dalio's template from the talk, verbatim: <em>"four big forces, three important
                  equilibriums, and two levers — if you get this down, basically everything through
                  my eyes is along those lines."</em> The four forces (productivity, the short-term
                  debt cycle, the long-term debt cycle, politics) and the two levers (monetary,
                  fiscal), one card each — with the talk's own examples, plus{' '}
                  <strong>two hypotheticals</strong> and <strong>one real episode</strong> so the
                  mechanism sticks.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                  {MACHINE_FORCES.map((force) => (
                    <GlassCard key={force.id} variant="nested" padding={16}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{force.name}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{force.what}</div>
                      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700, margin: '10px 0 4px' }}>
                        Against the three equilibriums
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <li><strong style={{ color: 'var(--text-primary)' }}>1 · Debt vs income:</strong> {force.eq1}</li>
                        <li><strong style={{ color: 'var(--text-primary)' }}>2 · Operating rate:</strong> {force.eq2}</li>
                        <li><strong style={{ color: 'var(--text-primary)' }}>3 · Risk premiums:</strong> {force.eq3}</li>
                      </ul>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 8 }}>
                        <strong style={{ color: 'var(--accent)' }}>The two levers:</strong> {force.lever}
                      </div>
                      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700, margin: '10px 0 4px' }}>
                        Two hypotheticals
                      </div>
                      {force.hypotheticals.map((h) => (
                        <div key={h} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 4 }}>{h}</div>
                      ))}
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-elevated-2)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '8px 10px',
                          marginTop: 6,
                          lineHeight: 1.5,
                        }}
                      >
                        <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700, marginRight: 6 }}>
                          From the past
                        </span>
                        {force.history}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </StepCard>

              <StepCard n="F" icon={<Briefcase size={17} />} title={`What to do with capital — ${scenarioName}`}>
                <p style={hintStyle}>
                  The live recommendation: pick your industry, and the tab-1 capital engine re-runs
                  with that industry's assumptions (beta → cost of equity, credit standing →
                  borrowing spread), colored by the industry's macro backdrop. Change the scenario
                  buttons above and watch the advice turn.
                </p>
                <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
                  {INDUSTRY_PROFILES.map((p) => (
                    <Chip key={p.id} active={advIndustryId === p.id} onClick={() => setAdvIndustryId(p.id)}>
                      {p.name}
                    </Chip>
                  ))}
                </div>
                <GlassCard variant="nested" padding={16} style={{ border: `1px solid ${CAP_STANCE_META[advice.stance].tone}` }}>
                  <div className="between" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: CAP_STANCE_META[advice.stance].tone }}>
                      {CAP_STANCE_META[advice.stance].label}
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: BACKDROP_META[advice.backdrop.level].tone,
                        border: `1px solid ${BACKDROP_META[advice.backdrop.level].tone}`,
                        borderRadius: 999,
                        padding: '3px 10px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Industry {BACKDROP_META[advice.backdrop.level].label.toLowerCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{advice.summary}</div>
                  <div className="row gap-3" style={{ flexWrap: 'wrap', marginTop: 12 }}>
                    <StatPill label="Industry beta" value={String(advice.profile.beta)} />
                    <StatPill label="Spread tier" value={`${advice.profile.spreadTier} · +${advice.waccInputs.creditSpread}%`} />
                    <StatPill label="Industry WACC" value={`${advice.wacc.wacc}%`} strong />
                    <StatPill label="Modeled backdrop" value={`${advice.backdrop.now >= 0 ? '+' : ''}${advice.backdrop.now}%`} />
                  </div>
                  <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700, margin: '12px 0 4px' }}>
                    The ranked moves at this industry's WACC
                  </div>
                  <div className="col" style={{ gap: 4 }}>
                    {[...advice.top, advice.safe].map((o) => {
                      const meta = VERDICT_META[o.verdict];
                      return (
                        <div key={o.id} style={{ fontSize: 12, lineHeight: 1.5 }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{o.name}</strong>{' '}
                          <span className="num" style={{ color: toneFor(o.spread) }}>{fmtSignedPct(o.spread)}</span>{' '}
                          <span style={{ color: meta.tone, fontWeight: 600 }}>· {meta.label}</span>
                          {o.id === advice.safe.id && <span style={{ color: 'var(--text-tertiary)' }}> · the safe benchmark</span>}
                        </div>
                      );
                    })}
                  </div>
                  <details style={{ marginTop: 12 }}>
                    <summary style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}>
                      The assumptions this uses — the {advice.profile.name} master list
                    </summary>
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {advice.profile.assumptions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                      <li>Risk-free rate {effInputs.riskFree}% and $1M of capital — set on tab 1 (the risk-free chip there feeds this directly).</li>
                    </ul>
                  </details>
                  <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.5, margin: '10px 0 0' }}>
                    To make this YOUR answer rather than the sector's: on tab 1, set your real beta,
                    your borrowing spread (or pro forma — pension included), and your capital amount;
                    tab 1 then ranks all seven moves with your numbers under this same scenario.
                  </p>
                </GlassCard>
              </StepCard>

              <StepCard n="G" icon={<GraduationCap size={17} />} title="Dalio's investment principles — from the same talk">
                <p style={hintStyle}>
                  The second half of the video: after the machine, how to invest inside it. Eight
                  principles, each with where in this Lab you practice it — so the video's examples
                  are the default setup, not just quotes.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                  {DALIO_INVEST_PRINCIPLES.map((p) => (
                    <GlassCard key={p.n} variant="nested" padding={14}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                        {p.n}. {p.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{p.what}</div>
                      <div style={{ fontSize: 12, color: 'var(--accent)', lineHeight: 1.5, marginTop: 8 }}>
                        <strong>Practice it:</strong> {p.useIt}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </StepCard>
            </>
          )}

          {tab === 'valuation' && (
            <>
              <StepCard n="A" icon={<Calculator size={17} />} title="The forecast — revenue to free cash flow">
                <p style={hintStyle}>
                  A five-year DCF, built the way you'd narrate it in an interview: revenue grows,
                  EBITDA follows the margin, D&amp;A splits out EBIT for tax, then{' '}
                  <strong>FCF = NOPAT + D&amp;A − capex − ΔNWC</strong>. Every field carries its
                  instruction <em>with the worked-example number</em> — the defaults ARE the
                  example (think of it as one company: $10M of sales, 20% margins, $2M of net
                  debt), and the guide on the right narrates the whole calculation end to end with
                  whatever the fields currently hold.
                </p>
                <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                  <Chip
                    active={JSON.stringify(dcf) === JSON.stringify(DEFAULT_DCF_INPUTS)}
                    onClick={() => setDcf(DEFAULT_DCF_INPUTS)}
                  >
                    Reset to the worked example
                  </Chip>
                  <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                    Type over any field to make it your own; this chip brings the example back.
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12, marginBottom: 8 }}>
                  <div className="col" style={{ gap: 5 }}>
                    <span style={labelStyle}>Revenue (LTM)</span>
                    <MoneyInput value={dcf.revenue} onChange={(v) => setDcfField('revenue', v)} width={110} />
                    <span style={dcfHintStyle}>Sales over the last twelve months — the base everything grows from. Example: $10,000,000.</span>
                  </div>
                  <div className="col" style={{ gap: 5 }}>
                    <span style={labelStyle}>EBITDA margin</span>
                    <PctInput value={dcf.ebitdaMarginPct} onChange={(v) => setDcfField('ebitdaMarginPct', v)} max={60} />
                    <span style={dcfHintStyle}>Operating profit per sales dollar. Example: 20% → $2,000,000 of EBITDA on $10M of revenue.</span>
                  </div>
                  <div className="col" style={{ gap: 5 }}>
                    <span style={labelStyle}>Growth (yrs 1–5)</span>
                    <PctInput value={dcf.growthPct} onChange={(v) => setDcfField('growthPct', v)} />
                    <span style={dcfHintStyle}>Annual revenue growth for the five forecast years. Example: 8%/yr → $10M becomes $10.8M in year 1.</span>
                  </div>
                  <div className="col" style={{ gap: 5 }}>
                    <span style={labelStyle}>D&amp;A (% rev)</span>
                    <PctInput value={dcf.daPctRevenue} onChange={(v) => setDcfField('daPctRevenue', v)} />
                    <span style={dcfHintStyle}>Depreciation &amp; amortization — non-cash, but it shields taxes. Example: 4% of revenue (≈$432k in year 1).</span>
                  </div>
                  <div className="col" style={{ gap: 5 }}>
                    <span style={labelStyle}>Capex (% rev)</span>
                    <PctInput value={dcf.capexPctRevenue} onChange={(v) => setDcfField('capexPctRevenue', v)} />
                    <span style={dcfHintStyle}>Real cash spent on equipment and buildings. Example: 5% — keep it ≥ D&amp;A while the business is growing.</span>
                  </div>
                  <div className="col" style={{ gap: 5 }}>
                    <span style={labelStyle}>ΔNWC (% of growth)</span>
                    <PctInput value={dcf.nwcPctGrowth} onChange={(v) => setDcfField('nwcPctGrowth', v)} max={50} />
                    <span style={dcfHintStyle}>Working capital each NEW dollar of sales ties up (receivables and inventory build first). Example: 10¢ per new $1.</span>
                  </div>
                  <div className="col" style={{ gap: 5 }}>
                    <span style={labelStyle}>WACC</span>
                    <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <PctInput value={dcf.waccPct} onChange={(v) => setDcfField('waccPct', v)} />
                      <Chip active={dcf.waccPct === wacc.wacc} onClick={() => setDcfField('waccPct', wacc.wacc)}>
                        From tab 1 · {wacc.wacc}%
                      </Chip>
                    </div>
                    <span style={dcfHintStyle}>The discount rate — what capital costs you. Example: 8.6%, tab 1's default (4% + 1.1 × 5.5% equity; 5.3% after-tax debt; 70/30 mix).</span>
                  </div>
                  <div className="col" style={{ gap: 5 }}>
                    <span style={labelStyle}>Terminal growth</span>
                    <PctInput value={dcf.terminalGrowthPct} onChange={(v) => setDcfField('terminalGrowthPct', v)} max={6} />
                    <span style={dcfHintStyle}>Growth forever AFTER year 5. Example: 2.5% — at or below long-run GDP growth, and always below WACC.</span>
                  </div>
                  <div className="col" style={{ gap: 5 }}>
                    <span style={labelStyle}>Peer EV/EBITDA</span>
                    <PctInput value={dcf.peerMultiple} onChange={(v) => setDcfField('peerMultiple', v)} max={30} suffix="×" />
                    <span style={dcfHintStyle}>What similar companies trade or sell for, as a multiple of EBITDA. Example: 8× — the market-approach cross-check.</span>
                  </div>
                  <div className="col" style={{ gap: 5 }}>
                    <span style={labelStyle}>Net debt</span>
                    <MoneyInput value={dcf.netDebt} onChange={(v) => setDcfField('netDebt', v)} width={100} />
                    <span style={dcfHintStyle}>Total debt minus cash. Example: $2,000,000 — subtracted from EV to reach what shareholders own.</span>
                  </div>
                </div>
                {!dcfResult.valid ? (
                  <p style={{ fontSize: 12.5, color: 'var(--neg)', fontWeight: 600, margin: '8px 0 0' }}>
                    WACC must exceed terminal growth — a perpetuity growing faster than its discount
                    rate is worth infinity, which is the model telling you the assumption is wrong.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto', marginTop: 6 }}>
                    <table className="fin-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Year</th>
                          {dcfResult.years.map((y) => (
                            <th key={y.year} className="num" style={{ textAlign: 'right' }}>Yr {y.year}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          [
                            ['Revenue', (y: typeof dcfResult.years[0]) => y.revenue],
                            ['EBITDA', (y: typeof dcfResult.years[0]) => y.ebitda],
                            ['EBIT', (y: typeof dcfResult.years[0]) => y.ebit],
                            ['NOPAT', (y: typeof dcfResult.years[0]) => y.nopat],
                            ['− Capex', (y: typeof dcfResult.years[0]) => -y.capex],
                            ['− ΔNWC', (y: typeof dcfResult.years[0]) => -y.deltaNwc],
                            ['Free cash flow', (y: typeof dcfResult.years[0]) => y.fcf],
                            ['PV @ WACC', (y: typeof dcfResult.years[0]) => y.pv],
                          ] as [string, (y: typeof dcfResult.years[0]) => number][]
                        ).map(([label, get]) => (
                          <tr key={label}>
                            <td style={{ fontWeight: label === 'Free cash flow' || label === 'PV @ WACC' ? 700 : 500 }}>{label}</td>
                            {dcfResult.years.map((y) => (
                              <td key={y.year} className="num" style={{ textAlign: 'right' }}>{fmtMoney(get(y), 0)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </StepCard>

              <StepCard n="B" icon={<TrendingUp size={17} />} title="The value bridge — enterprise to equity">
                {dcfResult.valid && (
                  <>
                    <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
                      <StatPill label="PV of 5-yr FCF" value={fmtMoney(dcfResult.pvForecast, 0)} />
                      <StatPill label="PV of terminal value" value={fmtMoney(dcfResult.pvTerminal, 0)} />
                      <StatPill label="Enterprise value (DCF)" value={fmtMoney(dcfResult.ev, 0)} strong />
                      <StatPill label="− net debt → equity value" value={fmtMoney(dcfResult.equity, 0)} strong />
                    </div>
                    <div className="row gap-3" style={{ flexWrap: 'wrap', marginTop: 10 }}>
                      <StatPill label="TV share of EV" value={`${dcfResult.tvSharePct}%`} />
                      <StatPill label={`Exit check (${dcf.peerMultiple}× EBITDA₅)`} value={fmtMoney(dcfResult.evExit, 0)} />
                      <StatPill label="Implied fwd EV/EBITDA" value={`${dcfResult.impliedForwardMultiple}×`} />
                    </div>
                    {dcfResult.tvSharePct >= 75 && (
                      <p style={{ fontSize: 12, color: 'var(--severity-medium)', fontWeight: 600, margin: '10px 0 0' }}>
                        {dcfResult.tvSharePct}% of this valuation sits in the terminal value — the
                        forecast barely matters. That's normal for a DCF, and exactly why the
                        sensitivity grid below is not optional.
                      </p>
                    )}
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 12 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Two answers, one triangulation:</strong>{' '}
                      the income approach (DCF) says {fmtMoney(dcfResult.ev, 0)}; the market approach
                      ({dcf.peerMultiple}× peer multiple on year-5 EBITDA, discounted) says{' '}
                      {fmtMoney(dcfResult.evExit, 0)}. When they diverge, one of your assumptions —
                      growth, margin, or the peers — is doing the talking. Finding which is the job.
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <span style={labelStyle}>The EV ↔ equity bridge</span>
                      <div className="col" style={{ gap: 4, marginTop: 6 }}>
                        {EV_BRIDGE.map((b) => (
                          <div key={b.item} style={{ fontSize: 12, lineHeight: 1.5 }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{b.item}</strong>{' '}
                            <span style={{ color: 'var(--text-tertiary)' }}>— {b.note}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </StepCard>

              <StepCard n="C" icon={<BarChart3 size={17} />} title="Sensitivity — the two-way table">
                <p style={hintStyle}>
                  Enterprise value across WACC (rows, ±1pp) and terminal growth (columns, ±0.5pp).
                  The spread of this grid IS the honest answer — a valuation is a range, not a
                  number.
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table className="fin-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>WACC \ g</th>
                        {dcfGrid.growths.map((g) => (
                          <th key={g} className="num" style={{ textAlign: 'right' }}>{g}%</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dcfGrid.waccs.map((w, i) => (
                        <tr key={w}>
                          <td className="num" style={{ fontWeight: w === dcf.waccPct ? 700 : 500 }}>{w}%</td>
                          {dcfGrid.values[i].map((v, j) => {
                            const isBase = w === dcf.waccPct && dcfGrid.growths[j] === dcf.terminalGrowthPct;
                            return (
                              <td
                                key={j}
                                className="num"
                                style={{
                                  textAlign: 'right',
                                  fontWeight: isBase ? 700 : 400,
                                  color: isBase ? 'var(--accent)' : v === null ? 'var(--text-muted)' : 'var(--text-primary)',
                                  background: isBase ? 'var(--accent-soft)' : undefined,
                                }}
                              >
                                {v === null ? 'n/m' : fmtMoney(v, 0)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </StepCard>

              <StepCard n="D" icon={<ClipboardCheck size={17} />} title='The three statements — "depreciation goes up $10"'>
                <p style={hintStyle}>
                  The classic linkage question, answered in order — income statement first (it has
                  the tax effect), then cash flow, then balance sheet. Tax rate 25%.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {DEPRECIATION_WALKTHROUGH.map((s, i) => (
                    <GlassCard key={s.statement} variant="nested" padding={14}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>
                        {i + 1}. {s.statement}
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {s.lines.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                      <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.5, marginTop: 8 }}>
                        {s.takeaway}
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
                  exposures left over are what you <strong>hedge</strong> (tab 1's step D).
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

          {tab === 'eygap' && (
            <>
              <StepCard n="A" icon={<ClipboardCheck size={17} />} title="The EY technical checklist — item by item">
                <p style={hintStyle}>
                  Everything EY names for its Corporate Finance / Valuation, Modeling &amp;
                  Economics roles, gap-checked against this Lab: where each item lives here — the
                  former knowledge-only gaps are now working calculators on{' '}
                  <strong>tab 10, the gap workbench</strong>. Compiled from EY's own postings and
                  service pages (sources in the study repo).
                </p>
                <div className="col" style={{ gap: 10 }}>
                  {GAP_CHECK.map((g) => {
                    const meta = GAP_STATUS_META[g.status];
                    return (
                      <GlassCard key={g.item} variant="nested" padding={14}>
                        <div className="between" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{g.item}</span>
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
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: 6 }}>{g.where}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                          <strong style={{ color: meta.tone }}>Know:</strong> {g.know}
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </StepCard>

              <StepCard n="B" icon={<Activity size={17} />} title="The market-trends anchor — EY-Parthenon 2026 outlook">
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {EY_OUTLOOK.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              </StepCard>

              <StepCard n="C" icon={<GraduationCap size={17} />} title="What the interview actually looks like">
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {INTERVIEW_FORMAT.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 10 }}>
                  Practice both halves here: <strong>tab 8</strong> drills the questions,{' '}
                  <strong>tab 9</strong> maps the rounds, and <strong>tab 5</strong> is the
                  take-home rehearsal.
                </p>
              </StepCard>

              <StepCard n="D" icon={<Briefcase size={17} />} title="EY's standard analyses — what they use and would expect of me">
                <p style={hintStyle}>
                  The analyses that actually fill an EY Valuation / Corporate Finance week, ranked
                  by how often they appear across EY's own job postings, service pages, and
                  first-year practitioner accounts (researched Aug 2026; sourced write-up in the
                  study repo). Each row says where this Lab practices it. The headline finding:
                  the DCF/comps/precedents triad is table stakes, but{' '}
                  <strong>purchase price allocations are ~half of a first-year valuation
                  analyst's time</strong> — drill tab 10's PPA until it's reflex.
                </p>
                <div className="col" style={{ gap: 10 }}>
                  {EY_STANDARD_ANALYSES.map((a) => {
                    const meta = ANALYSIS_TIER_META[a.tier];
                    return (
                      <GlassCard key={a.name} variant="nested" padding={14}>
                        <div className="between" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</span>
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
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: 6 }}>{a.what}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                          <strong style={{ color: meta.tone }}>In this Lab:</strong> {a.lab}
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </StepCard>

              <StepCard n="E" icon={<BarChart3 size={17} />} title="The reporting & exhibits they'd expect — and the market-update routine">
                <p style={hintStyle}>
                  How EY deliverables <em>look</em>: the exhibit formats a valuation or diligence
                  report is built from, ranked, with where this Lab already renders each — then
                  the keep-current routine, set to EY's own publication cadence.
                </p>
                <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  The exhibits, ranked
                </div>
                <div className="col" style={{ gap: 8, marginBottom: 16 }}>
                  {EY_EXHIBITS.map((e, i) => (
                    <GlassCard key={e.name} variant="nested" padding={12}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                        {i + 1}. {e.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: 4 }}>{e.what}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <strong>In this Lab:</strong> {e.lab}
                      </div>
                    </GlassCard>
                  ))}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  Keeping up with the market, at EY's cadence
                </div>
                <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                  <table className="fin-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Cadence</th>
                        <th>What to read / refresh</th>
                        <th>Where the Lab mirrors it</th>
                      </tr>
                    </thead>
                    <tbody>
                      {EY_MARKET_ROUTINE.map((r) => (
                        <tr key={r.cadence}>
                          <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.cadence}</td>
                          <td>{r.what}</td>
                          <td>{r.labTie}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {EY_ROUTINE_EXPECTATION}
                </p>
              </StepCard>
            </>
          )}

          {tab === 'drill' && (
            <>
              {(['technical', 'behavioral', 'market'] as DrillCategory[]).map((cat, i) => {
                const meta = DRILL_CATEGORY_META[cat];
                const cards = DRILL_CARDS.filter((c) => c.category === cat);
                return (
                  <StepCard key={cat} n={String.fromCharCode(65 + i)} icon={<GraduationCap size={17} />} title={`${meta.title} — ${cards.length} questions`}>
                    <p style={hintStyle}>{meta.blurb}</p>
                    <div className="col" style={{ gap: 10 }}>
                      {cards.map((c) => (
                        <GlassCard key={c.id} variant="nested" padding={14}>
                          <details>
                            <summary style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', lineHeight: 1.5 }}>
                              {c.q}
                            </summary>
                            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65, marginTop: 10 }}>{c.a}</div>
                            {c.practice && (
                              <div style={{ fontSize: 12, color: 'var(--accent)', lineHeight: 1.5, marginTop: 8 }}>
                                <strong>Practice live:</strong> {c.practice}
                              </div>
                            )}
                          </details>
                        </GlassCard>
                      ))}
                    </div>
                  </StepCard>
                );
              })}
            </>
          )}

          {tab === 'rounds' && (
            <>
              <StepCard n="A" icon={<GraduationCap size={17} />} title="Round 1 — the HireVue video (almost entirely behavioral)">
                <p style={hintStyle}>
                  ~5 recorded questions, 30–60 seconds of prep, 90 seconds–2 minutes per answer.
                  Technicals mostly wait for round 2 — this round is won with rehearsed STAR
                  stories, not formulas.
                </p>
                <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700, margin: '4px 0 6px' }}>
                  The staples to have ready (drilled with scaffolds on tab 8)
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {BEHAVIORAL_STAPLES.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <div
                  style={{
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-elevated-2)',
                    border: '1px solid var(--accent)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    marginTop: 10,
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: 'var(--accent)' }}>STAR, every time:</strong> Situation
                  (one line) → Task (what YOU owned) → Action (2–3 decisions, in the first person —
                  this is 60% of the answer) → Result (quantified). One concrete story per question,
                  rehearsed to 90 seconds, ending on the result.
                </div>
              </StepCard>

              <StepCard n="B" icon={<Calculator size={17} />} title="Round 2 — the ~48-hour take-home DCF, and defending it">
                <p style={hintStyle}>
                  The reported round-2 pattern: a take-home Excel DCF case with roughly 48 hours,
                  then a live interview where you walk through and defend your model. The game plan:
                </p>
                <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {TAKE_HOME_PLAN.map((s) => (
                    <li key={s} style={{ marginBottom: 4 }}>{s}</li>
                  ))}
                </ol>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: 10 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Rehearsal:</strong> tab 5 is this
                  exact model in miniature — build the muscle memory there (the guide has the
                  narration script), then the Excel version is transcription.
                </p>
              </StepCard>

              <StepCard n="C" icon={<Activity size={17} />} title="The market-trends anchor — and the one-click scenario">
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {EY_OUTLOOK.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
                <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                  <Chip active={scenarioId === 'supply-shock'} onClick={() => pickPreset('supply-shock')}>
                    Load the Tariff / supply-shock preset — EY's "supply-shock world"
                  </Chip>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {scenarioId === 'supply-shock'
                      ? 'Loaded — now walk tabs 1, 3, 4, and 5 and narrate what it does to hurdles, trends, equilibriums, and the DCF.'
                      : 'Sets the shared dials every tab runs on.'}
                  </span>
                </div>
              </StepCard>
            </>
          )}

          {tab === 'gapwork' && <GapWorkbenchTab />}

          {tab === 'rates' && <RatesTab />}

          {tab === 'realestate' && <RealEstateTab />}

          {tab === 'ipo' && <IpoTab />}

          {tab === 'benchmarks' && <BenchmarksTab />}

          {tab === 'debtgeo' && <DebtGeoTab />}

          {tab === 'fullcycle' && <FullCycleTab />}

          {tab === 'datasources' && <DataSourcesTab />}

          {tab === 'backtest' && <BacktestTab />}

          {tab === 'report' && <ReportTab />}
        </div>

        <GuidePane tab={tab} wacc={wacc} waccInputs={effInputs} options={options} capital={capital} credit={credit} requested={requested} termsDays={termsDays} fin={fin} proformaOn={proformaOn} proRead={proRead} dcf={dcf} dcfResult={dcfResult} />
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

/** Per-field instruction line carrying the worked-example number. */
const dcfHintStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-tertiary)',
  lineHeight: 1.45,
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
            itemStyle={{ color: 'var(--text-primary)' }}
            labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
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
            itemStyle={{ color: 'var(--text-primary)' }}
            labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
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
            ticks={[0, 5, 10, 15, 20, 25, 30, 35, 40]}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            tickFormatter={(v) => (v === 0 ? 'now' : `+${v}y`)}
          />
          <YAxis tick={false} axisLine={{ stroke: 'var(--border)' }} tickLine={false} width={10} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated-2)',
              border: '1px solid var(--border-strong)',
              borderRadius: 10,
              color: 'var(--text-primary)',
            }}
            itemStyle={{ color: 'var(--text-primary)' }}
            labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
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
              itemStyle={{ color: 'var(--text-primary)' }}
              labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
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
// Tab 10 — the gap workbench (self-contained state)
// ---------------------------------------------------------------------------

function WbField({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="col" style={{ gap: 5 }}>
      <span style={labelStyle}>{label}</span>
      {children}
      <span style={dcfHintStyle}>{hint}</span>
    </div>
  );
}

const wbGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 12,
  marginBottom: 10,
};

const wbNote: React.CSSProperties = {
  fontSize: 12.5,
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  marginTop: 10,
};

function GapWorkbenchTab() {
  const [irr, setIrr] = useState(DEFAULT_IRR_INPUTS);
  const [beta, setBeta] = useState(DEFAULT_BETA_INPUTS);
  const [hurdle, setHurdle] = useState(DEFAULT_HURDLE_INPUTS);
  const [rnpv, setRnpv] = useState(DEFAULT_RNPV_INPUTS);
  const [roic, setRoic] = useState(DEFAULT_ROIC_INPUTS);
  const [ppaIn, setPpaIn] = useState(DEFAULT_PPA_INPUTS);
  const [impair, setImpair] = useState(DEFAULT_IMPAIR_INPUTS);
  const [comps, setComps] = useState(DEFAULT_COMPS_INPUTS);
  const [cost, setCost] = useState(DEFAULT_COST_INPUTS);
  const [lbo, setLbo] = useState(DEFAULT_LBO_INPUTS);
  const [acc, setAcc] = useState(DEFAULT_ACCRETION_INPUTS);
  const [be, setBe] = useState(DEFAULT_BREAKEVEN_INPUTS);
  const [cg, setCg] = useState(DEFAULT_CAGR_INPUTS);

  const irrR = useMemo(() => irrLab(irr), [irr]);
  const betaR = useMemo(() => betaWorkshop(beta), [beta]);
  const hurdleR = useMemo(() => hurdleBuilder(hurdle), [hurdle]);
  const roicR = useMemo(() => incrementalRoic(roic), [roic]);
  const ppaR = useMemo(() => ppa(ppaIn), [ppaIn]);
  const impairR = useMemo(() => goodwillImpairment(impair), [impair]);
  const compsR = useMemo(() => compsCompare(comps), [comps]);
  const costR = useMemo(() => costApproach(cost), [cost]);
  const lboR = useMemo(() => lboMini(lbo), [lbo]);
  const accR = useMemo(() => accretionDilution(acc), [acc]);
  const beR = useMemo(() => breakEven(be), [be]);
  const cgR = useMemo(() => cagr(cg), [cg]);

  return (
    <>
      <StepCard n="A" icon={<Calculator size={17} />} title="IRR & NPV lab">
        <p style={hintStyle}>
          Your prep session's example, live: invest 100 and receive 40 / 50 / 50. The session
          quoted "≈18.8%" — the exact solve is <strong>18.1%</strong> (at 18.8% the NPV is already
          negative). That's the "model review" habit in one line: verify every number, even the
          teacher's. Enter units of anything ($ or $M — they cancel); IRR is the rate where NPV
          hits zero, and the NPV shown is computed at your hurdle.
        </p>
        <div style={wbGrid}>
          <WbField label="Investment (year 0)" hint="Cash out today, entered positive. Example: 100.">
            <MoneyInput value={irr.investment} onChange={(v) => setIrr((s) => ({ ...s, investment: v }))} width={90} />
          </WbField>
          {irr.inflows.map((cf, i) => (
            <WbField key={i} label={`Inflow year ${i + 1}`} hint={i < 3 ? `Example: ${[40, 50, 50][i]}.` : 'Leave 0 if none.'}>
              <MoneyInput
                value={cf}
                onChange={(v) =>
                  setIrr((s) => {
                    const inflows = [...s.inflows] as typeof s.inflows;
                    inflows[i] = v;
                    return { ...s, inflows };
                  })
                }
                width={80}
              />
            </WbField>
          ))}
          <WbField label="Hurdle / required return" hint="The risk-adjusted bar (build one in section C). Example: 10%.">
            <PctInput value={irr.hurdlePct} onChange={(v) => setIrr((s) => ({ ...s, hurdlePct: v }))} />
          </WbField>
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          <StatPill label="IRR" value={irrR.irrPct === null ? 'never breaks even' : `${irrR.irrPct}%`} strong />
          <StatPill label={`NPV @ ${irr.hurdlePct}%`} value={fmtMoney(irrR.npv, 0)} />
          <StatPill label="Payback" value={irrR.paybackYears === null ? 'beyond horizon' : `${irrR.paybackYears} yrs`} />
        </div>
        <p style={wbNote}>
          The three-line answer from your session: <strong>NPV = dollars</strong> (value created) ·{' '}
          <strong>IRR = percentage</strong> (implied return) · <strong>payback = time</strong>. And
          the trap: a $1M project at 40% IRR creates $200k; a $100M project at 18% creates $15M —
          when mutually exclusive rankings conflict, trust NPV. Timing is everything: $100 → $150 in
          one year is a 50% IRR; the same $150 in year five is ≈8.45%.
        </p>
      </StepCard>

      <StepCard n="B" icon={<Activity size={17} />} title="Beta workshop — unlever, relever, CAPM">
        <p style={hintStyle}>
          Your session's exact example: a comparable with levered beta 1.4, $300 debt / $700
          equity, 25% tax → <strong>unlevered β ≈ 1.06</strong>; relever at a 20/80 target →{' '}
          <strong>β ≈ 1.26</strong> → CAPM. This is how you value a business whose financing
          differs from its peers.
        </p>
        <div style={wbGrid}>
          <WbField label="Peer levered beta" hint="The comparable's observed equity beta. Example: 1.4.">
            <PctInput value={beta.peerLeveredBeta} onChange={(v) => setBeta((s) => ({ ...s, peerLeveredBeta: v }))} max={3} suffix="β" />
          </WbField>
          <WbField label="Peer debt" hint="Example: 300 — with equity 700, D/E = 0.43.">
            <MoneyInput value={beta.peerDebt} onChange={(v) => setBeta((s) => ({ ...s, peerDebt: v }))} width={80} />
          </WbField>
          <WbField label="Peer equity" hint="Market value of the comparable's equity. Example: 700.">
            <MoneyInput value={beta.peerEquity} onChange={(v) => setBeta((s) => ({ ...s, peerEquity: v }))} width={80} />
          </WbField>
          <WbField label="Tax rate" hint="For the (1−T) in both formulas. Example: 25%.">
            <PctInput value={beta.taxPct} onChange={(v) => setBeta((s) => ({ ...s, taxPct: v }))} max={50} />
          </WbField>
          <WbField label="Target debt %" hint="YOUR sustainable structure, not the peer's. Example: 20% debt / 80% equity.">
            <PctInput value={beta.targetDebtPct} onChange={(v) => setBeta((s) => ({ ...s, targetDebtPct: v }))} max={90} />
          </WbField>
          <WbField label="Risk-free rate" hint="Example: 4% (10-yr Treasury).">
            <PctInput value={beta.riskFreePct} onChange={(v) => setBeta((s) => ({ ...s, riskFreePct: v }))} />
          </WbField>
          <WbField label="Equity risk premium" hint="Example: 5.5% — the extra stocks must pay over risk-free.">
            <PctInput value={beta.erpPct} onChange={(v) => setBeta((s) => ({ ...s, erpPct: v }))} />
          </WbField>
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          <StatPill label="Unlevered β (business risk)" value={String(betaR.unleveredBeta)} />
          <StatPill label="Relevered β (your structure)" value={String(betaR.releveredBeta)} />
          <StatPill label="Cost of equity (CAPM)" value={`${betaR.costOfEquityPct}%`} strong />
        </div>
        <p style={wbNote}>
          The sentence to say: <em>"I unlever comparable betas to isolate operating risk from each
          peer's financing, then relever at a sustainable target structure so the cost of equity
          reflects the risk of the business I'm actually valuing."</em> In practice you'd do this
          across 5–10 comparables and take the median.
        </p>
      </StepCard>

      <StepCard n="C" icon={<ShieldCheck size={17} />} title="Risk-adjusted hurdle builder + rNPV">
        <p style={hintStyle}>
          Not "WACC + 3%": a <strong>project-specific WACC</strong>. Your session's build: project
          beta 1.4 (riskier than the parent) plus a 2% country-risk premium → cost of equity
          13.7% → blended hurdle ≈ 11.6%. The rNPV piece handles binary risk (drug trials, big
          launches) by probability-adjusting the cash flow instead.
        </p>
        <div style={wbGrid}>
          <WbField label="Risk-free rate" hint="Example: 4%.">
            <PctInput value={hurdle.riskFreePct} onChange={(v) => setHurdle((s) => ({ ...s, riskFreePct: v }))} />
          </WbField>
          <WbField label="Project beta" hint="The PROJECT's risk, from comparables in that business — not the parent's. Example: 1.4 (biotech vs a 0.9 device maker).">
            <PctInput value={hurdle.projectBeta} onChange={(v) => setHurdle((s) => ({ ...s, projectBeta: v }))} max={3} suffix="β" />
          </WbField>
          <WbField label="Equity risk premium" hint="Example: 5.5%.">
            <PctInput value={hurdle.erpPct} onChange={(v) => setHurdle((s) => ({ ...s, erpPct: v }))} />
          </WbField>
          <WbField label="Country risk premium" hint="0 for domestic; add for political/currency/legal risk. Example: 2%.">
            <PctInput value={hurdle.countryRiskPct} onChange={(v) => setHurdle((s) => ({ ...s, countryRiskPct: v }))} max={10} />
          </WbField>
          <WbField label="Project debt %" hint="The project's own financing mix. Example: 30%.">
            <PctInput value={hurdle.debtPct} onChange={(v) => setHurdle((s) => ({ ...s, debtPct: v }))} max={90} />
          </WbField>
          <WbField label="Project cost of debt" hint="What lenders charge THIS project — a speculative project borrows dearer than the parent. Example: 9%.">
            <PctInput value={hurdle.costOfDebtPct} onChange={(v) => setHurdle((s) => ({ ...s, costOfDebtPct: v }))} />
          </WbField>
          <WbField label="Tax rate" hint="Example: 25% — check the shield is actually usable.">
            <PctInput value={hurdle.taxPct} onChange={(v) => setHurdle((s) => ({ ...s, taxPct: v }))} max={50} />
          </WbField>
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          <StatPill label="Project cost of equity" value={`${hurdleR.costOfEquityPct}%`} />
          <StatPill label="After-tax cost of debt" value={`${hurdleR.afterTaxDebtPct}%`} />
          <StatPill label="Risk-adjusted hurdle" value={`${hurdleR.hurdlePct}%`} strong />
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 14 }}>
          <WbField label="Probability of success" hint="Example: 30% (a clinical phase).">
            <PctInput value={rnpv.successPct} onChange={(v) => setRnpv((s) => ({ ...s, successPct: v }))} max={100} />
          </WbField>
          <WbField label="Payoff if it works" hint="Example: 300 ($M).">
            <MoneyInput value={rnpv.payoff} onChange={(v) => setRnpv((s) => ({ ...s, payoff: v }))} width={90} />
          </WbField>
          <StatPill label="Probability-adjusted cash flow" value={fmtMoney(expectedPayoff(rnpv), 0)} strong />
        </div>
        <p style={wbNote}>
          The Manager-level warning from your session: <strong>don't double-count risk</strong> —
          if the cash flows are already probability-adjusted for failure, don't also pile a huge
          failure premium into the discount rate.
        </p>
      </StepCard>

      <StepCard n="D" icon={<TrendingUp size={17} />} title="Incremental ROIC vs. WACC">
        <p style={hintStyle}>
          "Where can incremental capital earn attractive returns relative to its risk-adjusted
          cost?" — your session's capital-allocation core. Example: $100 invested producing $15 of
          incremental NOPAT = 15% against a 9% WACC → a +6pp value-creation spread.
        </p>
        <div style={wbGrid}>
          <WbField label="Δ NOPAT (annual)" hint="Extra after-tax operating profit the investment produces. Example: 15.">
            <MoneyInput value={roic.deltaNopat} onChange={(v) => setRoic((s) => ({ ...s, deltaNopat: v }))} width={80} />
          </WbField>
          <WbField label="Δ invested capital" hint="What it takes to get it. Example: 100.">
            <MoneyInput value={roic.deltaCapital} onChange={(v) => setRoic((s) => ({ ...s, deltaCapital: v }))} width={80} />
          </WbField>
          <WbField label="WACC / required return" hint="Example: 9%.">
            <PctInput value={roic.waccPct} onChange={(v) => setRoic((s) => ({ ...s, waccPct: v }))} />
          </WbField>
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          <StatPill label="Incremental ROIC" value={`${roicR.roicPct}%`} />
          <StatPill label="Spread vs WACC" value={`${roicR.spreadPct > 0 ? '+' : ''}${roicR.spreadPct}pp`} strong />
        </div>
        <p style={wbNote}>
          <strong style={{ color: roicR.creatingValue ? 'var(--pos)' : 'var(--neg)' }}>
            {roicR.creatingValue ? 'Creating value' : 'Destroying value'}
          </strong>{' '}
          — ROIC {roicR.creatingValue ? '>' : '≤'} WACC. But timing still matters: $20 of NOPAT
          starting in year 7 can lose to $15 starting next year — that's why you pair this with the
          DCF, never use it alone.
        </p>
      </StepCard>

      <StepCard n="E" icon={<ClipboardCheck size={17} />} title="PPA (ASC 805) & goodwill impairment (ASC 350)">
        <p style={hintStyle}>
          The deal's accounting afterlife. First allocate the price to what you can identify at
          fair value — the leftover is goodwill; later, test that goodwill: if the unit's fair
          value falls below carrying value, write it down. Default: the $800M biotech deal from
          your prep questions.
        </p>
        <div style={wbGrid}>
          <WbField label="Purchase price" hint="What you paid for the business. Example: 800 ($M).">
            <MoneyInput value={ppaIn.purchasePrice} onChange={(v) => setPpaIn((s) => ({ ...s, purchasePrice: v }))} width={80} />
          </WbField>
          <WbField label="Tangibles at fair value" hint="Plant, inventory, receivables — revalued to today. Example: 300.">
            <MoneyInput value={ppaIn.tangiblesFV} onChange={(v) => setPpaIn((s) => ({ ...s, tangiblesFV: v }))} width={80} />
          </WbField>
          <WbField label="Identified intangibles" hint="Patents, customer lists, brands, developed tech. Example: 350.">
            <MoneyInput value={ppaIn.intangiblesFV} onChange={(v) => setPpaIn((s) => ({ ...s, intangiblesFV: v }))} width={80} />
          </WbField>
          <WbField label="Liabilities assumed" hint="Debt and obligations that come with the business. Example: 100.">
            <MoneyInput value={ppaIn.liabilitiesFV} onChange={(v) => setPpaIn((s) => ({ ...s, liabilitiesFV: v }))} width={80} />
          </WbField>
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          <StatPill label="Net identifiable assets" value={fmtMoney(ppaR.netAssetsFV, 0)} />
          <StatPill label="Goodwill" value={fmtMoney(ppaR.goodwill, 0)} strong />
        </div>
        {ppaR.bargainPurchase && (
          <p style={{ ...wbNote, color: 'var(--severity-medium)', fontWeight: 600 }}>
            Negative goodwill = a bargain purchase — booked as a gain, and in practice a signal to
            re-check the fair values before believing it.
          </p>
        )}
        <div className="row gap-3" style={{ flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 14 }}>
          <WbField label="Unit carrying value" hint="Book value of the reporting unit incl. goodwill. Example: 800.">
            <MoneyInput value={impair.carryingValue} onChange={(v) => setImpair((s) => ({ ...s, carryingValue: v }))} width={80} />
          </WbField>
          <WbField label="of which goodwill" hint="The PPA leftover being tested. Example: 250.">
            <MoneyInput value={impair.goodwill} onChange={(v) => setImpair((s) => ({ ...s, goodwill: v }))} width={80} />
          </WbField>
          <WbField label="Unit fair value today" hint="What it's actually worth now (DCF/comps). Example: 650.">
            <MoneyInput value={impair.fairValue} onChange={(v) => setImpair((s) => ({ ...s, fairValue: v }))} width={80} />
          </WbField>
          <StatPill label="Impairment charge" value={fmtMoney(impairR.impairment, 0)} strong />
          <StatPill label="Goodwill remaining" value={fmtMoney(impairR.remainingGoodwill, 0)} />
        </div>
        <p style={wbNote}>
          Impairment is the deal's promise not showing up in the numbers — capped at the goodwill
          balance, tested at least annually, never reversed.
        </p>
      </StepCard>

      <StepCard n="F" icon={<BarChart3 size={17} />} title="Trading vs. precedent comps — and the cost approach">
        <p style={hintStyle}>
          The market approach, split properly: trading comps price minority stakes at today's
          market; precedent transactions price whole companies actually bought — the gap between
          them is roughly the <strong>control premium</strong>. The cost approach is the third leg:
          what rebuilding the assets would cost.
        </p>
        <div style={wbGrid}>
          <WbField label="EBITDA" hint="The subject company's EBITDA. Example: 100 ($M).">
            <MoneyInput value={comps.ebitda} onChange={(v) => setComps((s) => ({ ...s, ebitda: v }))} width={80} />
          </WbField>
          <WbField label="Trading multiple" hint="Where comparable public companies trade. Example: 8×.">
            <PctInput value={comps.tradingMultiple} onChange={(v) => setComps((s) => ({ ...s, tradingMultiple: v }))} max={30} suffix="×" />
          </WbField>
          <WbField label="Precedent multiple" hint="What acquirers actually paid in recent deals. Example: 9.5×.">
            <PctInput value={comps.precedentMultiple} onChange={(v) => setComps((s) => ({ ...s, precedentMultiple: v }))} max={30} suffix="×" />
          </WbField>
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          <StatPill label="EV — trading" value={fmtMoney(compsR.evTrading, 0)} />
          <StatPill label="EV — precedent" value={fmtMoney(compsR.evPrecedent, 0)} />
          <StatPill label="Implied control premium" value={`${compsR.controlPremiumPct}%`} strong />
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 14 }}>
          <WbField label="Replacement cost" hint="What rebuilding the assets from scratch would cost. Example: 400.">
            <MoneyInput value={cost.replacementCost} onChange={(v) => setCost((s) => ({ ...s, replacementCost: v }))} width={80} />
          </WbField>
          <WbField label="Obsolescence" hint="Wear + technological aging haircut. Example: 25%.">
            <PctInput value={cost.obsolescencePct} onChange={(v) => setCost((s) => ({ ...s, obsolescencePct: v }))} max={90} />
          </WbField>
          <WbField label="Liabilities" hint="Netted off the assets. Example: 120.">
            <MoneyInput value={cost.liabilities} onChange={(v) => setCost((s) => ({ ...s, liabilities: v }))} width={80} />
          </WbField>
          <StatPill label="Cost-approach value" value={fmtMoney(costR.equityValue, 0)} strong />
        </div>
        <p style={wbNote}>
          Name all three approaches in an interview — <strong>income</strong> (tab 5's DCF),{' '}
          <strong>market</strong> (these comps), <strong>cost</strong> (this floor, used for
          asset-heavy or no-cash-flow situations) — and say which you'd weight and why.
        </p>
      </StepCard>

      <StepCard n="G" icon={<Briefcase size={17} />} title="LBO mini-model">
        <p style={hintStyle}>
          Buy with mostly debt, pay it down with the company's own cash flow, sell — returns come
          from three sources, and the attribution below is exact. Peripheral for EY, but one clean
          run makes the sentence stick.
        </p>
        <div style={wbGrid}>
          <WbField label="Entry EBITDA" hint="Example: 50 ($M).">
            <MoneyInput value={lbo.entryEbitda} onChange={(v) => setLbo((s) => ({ ...s, entryEbitda: v }))} width={80} />
          </WbField>
          <WbField label="Entry multiple" hint="Price paid ÷ EBITDA. Example: 8× → $400M EV.">
            <PctInput value={lbo.entryMultiple} onChange={(v) => setLbo((s) => ({ ...s, entryMultiple: v }))} max={30} suffix="×" />
          </WbField>
          <WbField label="Debt %" hint="Share of the price funded with debt. Example: 60% → $240M debt, $160M equity.">
            <PctInput value={lbo.debtPct} onChange={(v) => setLbo((s) => ({ ...s, debtPct: v }))} max={90} />
          </WbField>
          <WbField label="EBITDA growth" hint="Annual operating improvement. Example: 8%/yr.">
            <PctInput value={lbo.ebitdaGrowthPct} onChange={(v) => setLbo((s) => ({ ...s, ebitdaGrowthPct: v }))} />
          </WbField>
          <WbField label="FCF conversion" hint="Share of each year's EBITDA that pays down debt. Example: 40%.">
            <PctInput value={lbo.fcfConversionPct} onChange={(v) => setLbo((s) => ({ ...s, fcfConversionPct: v }))} max={90} />
          </WbField>
          <WbField label="Exit multiple" hint="Assume the same 8× unless you can argue expansion — that discipline is the point.">
            <PctInput value={lbo.exitMultiple} onChange={(v) => setLbo((s) => ({ ...s, exitMultiple: v }))} max={30} suffix="×" />
          </WbField>
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          <StatPill label="Entry equity" value={fmtMoney(lboR.entryEquity, 0)} />
          <StatPill label="Exit equity" value={fmtMoney(lboR.exitEquity, 0)} />
          <StatPill label="MOIC" value={`${lboR.moic}×`} />
          <StatPill label="Equity IRR" value={lboR.irrPct === null ? 'n/m' : `${lboR.irrPct}%`} strong />
        </div>
        <p style={wbNote}>
          Attribution of the {fmtMoney(lboR.exitEquity - lboR.entryEquity, 0)} equity gain:{' '}
          <strong>EBITDA growth {fmtMoney(lboR.fromGrowth, 0)}</strong> ·{' '}
          <strong>multiple expansion {fmtMoney(lboR.fromMultiple, 0)}</strong> ·{' '}
          <strong>deleveraging {fmtMoney(lboR.fromDeleveraging, 0)}</strong>. A high IRR produced
          mostly by leverage doesn't mean the business improved — and leverage cuts both ways.
        </p>
      </StepCard>

      <StepCard n="H" icon={<RefreshCcw size={17} />} title="Accretion / dilution">
        <p style={hintStyle}>
          Pro-forma EPS vs. standalone. Default: a buyer at a 10× P/E paying $900M for $60M of
          earnings, half stock half debt — check whether EPS rises, then remember the distinction
          your session flagged: <strong>EPS accretion is not value creation</strong>.
        </p>
        <div style={wbGrid}>
          <WbField label="Acquirer net income" hint="Example: 500 ($M).">
            <MoneyInput value={acc.acqNetIncome} onChange={(v) => setAcc((s) => ({ ...s, acqNetIncome: v }))} width={80} />
          </WbField>
          <WbField label="Acquirer shares" hint="Example: 100 (M) → standalone EPS $5.00.">
            <MoneyInput value={acc.acqShares} onChange={(v) => setAcc((s) => ({ ...s, acqShares: v }))} width={80} />
          </WbField>
          <WbField label="Acquirer share price" hint="Example: 50 → P/E 10×.">
            <MoneyInput value={acc.acqSharePrice} onChange={(v) => setAcc((s) => ({ ...s, acqSharePrice: v }))} width={80} />
          </WbField>
          <WbField label="Target net income" hint="Earnings you acquire. Example: 60.">
            <MoneyInput value={acc.tgtNetIncome} onChange={(v) => setAcc((s) => ({ ...s, tgtNetIncome: v }))} width={80} />
          </WbField>
          <WbField label="Offer value" hint="Price paid for the target's equity. Example: 900 → 15× the target's earnings.">
            <MoneyInput value={acc.offerValue} onChange={(v) => setAcc((s) => ({ ...s, offerValue: v }))} width={80} />
          </WbField>
          <WbField label="% stock" hint="Funded by issuing shares. Example: 50% → 9M new shares at $50.">
            <PctInput value={acc.pctStock} onChange={(v) => setAcc((s) => ({ ...s, pctStock: v }))} max={100} />
          </WbField>
          <WbField label="% debt" hint="Funded by borrowing; the rest is cash on hand. Example: 50%.">
            <PctInput value={acc.pctDebt} onChange={(v) => setAcc((s) => ({ ...s, pctDebt: v }))} max={100} />
          </WbField>
          <WbField label="Debt rate" hint="Cost of the new borrowing. Example: 6% (after tax 4.5%).">
            <PctInput value={acc.debtRatePct} onChange={(v) => setAcc((s) => ({ ...s, debtRatePct: v }))} />
          </WbField>
          <WbField label="Cash yield forgone" hint="What the cash was earning. Example: 4%.">
            <PctInput value={acc.cashYieldPct} onChange={(v) => setAcc((s) => ({ ...s, cashYieldPct: v }))} />
          </WbField>
          <WbField label="Tax rate" hint="Example: 25%.">
            <PctInput value={acc.taxPct} onChange={(v) => setAcc((s) => ({ ...s, taxPct: v }))} max={50} />
          </WbField>
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          <StatPill label="Standalone EPS" value={`$${accR.standaloneEps.toFixed(2)}`} />
          <StatPill label="Pro-forma EPS" value={`$${accR.proFormaEps.toFixed(2)}`} />
          <StatPill label={accR.accretive ? 'Accretive' : 'Dilutive'} value={`${accR.deltaPct > 0 ? '+' : ''}${accR.deltaPct}%`} strong />
        </div>
        <p style={wbNote}>
          The quick rule: compare the target's earnings yield with the cost of the consideration.
          And the interview distinction: a bad deal can still be accretive — value lives in whether
          synergies exceed the premium, not in the EPS artifact.
        </p>
      </StepCard>

      <StepCard n="I" icon={<Wallet size={17} />} title="Operator quick kit — break-even & CAGR">
        <div className="row gap-3" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <WbField label="Fixed costs" hint="Costs you pay regardless of volume. Example: $200,000.">
            <MoneyInput value={be.fixedCosts} onChange={(v) => setBe((s) => ({ ...s, fixedCosts: v }))} width={100} />
          </WbField>
          <WbField label="Price / unit" hint="Example: $50.">
            <MoneyInput value={be.pricePerUnit} onChange={(v) => setBe((s) => ({ ...s, pricePerUnit: v }))} width={70} />
          </WbField>
          <WbField label="Variable cost / unit" hint="Example: $30 → $20 contribution per unit.">
            <MoneyInput value={be.variableCostPerUnit} onChange={(v) => setBe((s) => ({ ...s, variableCostPerUnit: v }))} width={70} />
          </WbField>
          <StatPill label="Break-even" value={beR.breakEvenUnits === null ? 'never (CM ≤ 0)' : `${beR.breakEvenUnits.toLocaleString('en-US')} units`} strong />
          <StatPill label="Contribution margin" value={`${beR.contributionMarginPct}%`} />
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 14 }}>
          <WbField label="Beginning value" hint="Example: 100.">
            <MoneyInput value={cg.beginValue} onChange={(v) => setCg((s) => ({ ...s, beginValue: v }))} width={80} />
          </WbField>
          <WbField label="Ending value" hint="Example: 200.">
            <MoneyInput value={cg.endValue} onChange={(v) => setCg((s) => ({ ...s, endValue: v }))} width={80} />
          </WbField>
          <WbField label="Years" hint="Example: 5 → doubling in five years ≈ 14.9%/yr.">
            <PctInput value={cg.years} onChange={(v) => setCg((s) => ({ ...s, years: v }))} max={50} suffix="yrs" />
          </WbField>
          <StatPill label="CAGR" value={cgR === null ? 'n/m' : `${cgR}%/yr`} strong />
        </div>
        <p style={wbNote}>
          Break-even = fixed costs ÷ contribution per unit — deceptively useful for new products,
          plants, pricing, and AI programs. CAGR smooths: a 15% CAGR does not mean 15% every year.
        </p>
      </StepCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tabs 11 & 12 — rates & the bond market, real estate financing
// ---------------------------------------------------------------------------

function XYLineChart({
  data,
  xKey,
  series,
  height,
  ySuffix = '%',
}: {
  data: Record<string, number | string | null>[];
  xKey: string;
  series: { id: string; label: string }[];
  height: number;
  ySuffix?: string;
}) {
  useThemeVersion();
  const palette = [
    resolveCSSVar('var(--accent)'),
    resolveCSSVar('var(--pos)'),
    resolveCSSVar('var(--neg)'),
    resolveCSSVar('var(--severity-medium)'),
  ];
  const labelOf = Object.fromEntries(series.map((x) => [x.id, x.label]));
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
          <YAxis
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            width={42}
            domain={['auto', 'auto']}
            tickFormatter={(v) => `${v}${ySuffix}`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated-2)',
              border: '1px solid var(--border-strong)',
              borderRadius: 10,
              color: 'var(--text-primary)',
            }}
            itemStyle={{ color: 'var(--text-primary)' }}
            labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
            formatter={(value: number, name: string) => [`${value}${ySuffix}`, labelOf[name] ?? name]}
          />
          {series.length > 1 && <Legend formatter={(value) => labelOf[value] ?? value} wrapperStyle={{ fontSize: 12 }} />}
          {series.map((x, i) => (
            <Line key={x.id} type="monotone" dataKey={x.id} stroke={palette[i % palette.length]} strokeWidth={2} dot={{ r: 2 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const decisionLine: React.CSSProperties = {
  fontSize: 12.5,
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  marginTop: 10,
  borderLeft: '3px solid var(--accent)',
  paddingLeft: 10,
};

function RatesTab() {
  const snap = RATES_SNAPSHOT;
  const slopes = curveSlopes();
  const shape = curveShape();
  const bes = breakevens();
  const curveData = snap.curve.map((c) => ({ maturity: c.maturity, nominal: c.yieldPct, real: c.realPct }));
  const be10 = bes.find((b) => b.maturity === '10Y')!;

  return (
    <>
      <StepCard n="A" icon={<Percent size={17} />} title={`The two numbers that are not the same number — as of ${snap.asOf}`}>
        <p style={hintStyle}>
          The Fed's rate is {snap.fedFundsTarget}. Your mortgage is priced off a number near{' '}
          {snap.curve.find((c) => c.maturity === '10Y')!.yieldPct}% that the Fed does not control —
          and never has. The Fed doesn't ORDER its rate either: it pays banks{' '}
          {snap.iorbPct}% (IORB) to park money risk-free, so no bank lends overnight for less.
          The rate is floored up by a better offer, not commanded down — which is exactly why the
          Fed's power stops where the time horizon stretches.
        </p>
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          <StatPill label="Fed funds target" value={snap.fedFundsTarget} strong />
          <StatPill label="EFFR (actual overnight)" value={`${snap.effrPct}%`} />
          <StatPill label="IORB (the floor)" value={`${snap.iorbPct}%`} />
          <StatPill label="SOFR" value={`≈${snap.sofrPct}%`} />
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap', marginTop: 8 }}>
          <StatPill label="2Y Treasury" value="4.24%" />
          <StatPill label="10Y Treasury" value="4.70%" strong />
          <StatPill label={`30Y Treasury (peak ${snap.thirtyYearWeekPeakPct}%)`} value="5.23%" />
          <StatPill label="30Y fixed mortgage" value={`${snap.mortgage30Pct}%`} strong />
        </div>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> Fed funds ≠ 2Y ≠ 10Y ≠ 30Y ≠ your mortgage. They
          are connected through expectations and risk premiums — but they are not the same number,
          and only the first one is on the FOMC calendar. Sources: {snap.sources[0]}
        </p>
      </StepCard>

      <StepCard n="B" icon={<Landmark size={17} />} title="The rate stack — there is not one interest rate">
        <p style={hintStyle}>
          Eight levels, from the rate the Fed truly sets to the rate in your life. Each level: who
          actually sets it, and what decision it drives.
        </p>
        <div className="col" style={{ gap: 10 }}>
          {RATE_STACK.map((l) => (
            <GlassCard key={l.level} variant="nested" padding={12}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                Level {l.level} — {l.name}
              </div>
              <div className="num" style={{ fontSize: 11.5, color: 'var(--accent)', textAlign: 'left', marginBottom: 4 }}>{l.examples}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Who sets it:</strong> {l.whoSets}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 2 }}>
                <strong style={{ color: 'var(--text-primary)' }}>What it decides:</strong> {l.decides}
              </div>
            </GlassCard>
          ))}
        </div>
      </StepCard>

      <StepCard n="C" icon={<TrendingUp size={17} />} title={`The Treasury yield curve — ${snap.observationDate} (H.15)`}>
        <p style={hintStyle}>
          The full curve, 1M to 30Y — never just the 10-year. The dashed real (TIPS) line is what
          lenders earn AFTER inflation; the gap between the lines is the market's own inflation
          number. Slopes below are computed deterministically from the observations — in
          percentage points AND basis points.
        </p>
        <XYLineChart
          data={curveData}
          xKey="maturity"
          series={[
            { id: 'nominal', label: 'Nominal CMT' },
            { id: 'real', label: 'Real (TIPS) CMT' },
          ]}
          height={260}
        />
        <div className="row gap-3" style={{ flexWrap: 'wrap', marginTop: 10 }}>
          {slopes.map((sl) => (
            <StatPill key={sl.name} label={`${sl.name} (${sl.formula})`} value={`${sl.pct > 0 ? '+' : ''}${sl.pct}pp = ${sl.bps}bp`} />
          ))}
        </div>
        <p style={decisionLine}>
          <strong>Shape: {shape.shape}.</strong> {shape.read}
        </p>
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Maturity</th>
                <th className="num" style={{ textAlign: 'right' }}>Yield</th>
                <th style={{ textAlign: 'left', minWidth: 130 }}>The Fed's grip</th>
                <th style={{ textAlign: 'left' }}>Why it matters</th>
              </tr>
            </thead>
            <tbody>
              {snap.curve.map((c) => (
                <tr key={c.maturity}>
                  <td style={{ fontWeight: 600 }}>{c.maturity}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{c.yieldPct}%</td>
                  <td>
                    <div className="row" style={{ alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 90, height: 8, background: 'var(--bg-elevated-2)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${c.fedGripPct}%`, height: '100%', background: c.fedGripPct >= 60 ? 'var(--pos)' : c.fedGripPct >= 30 ? 'var(--severity-medium)' : 'var(--neg)' }} />
                      </div>
                      <span className="num" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{c.fedGripPct}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{c.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> the chain weakens link by link — overnight follows
          the Fed almost perfectly, the 2Y loosely, the 10Y barely, the 30Y practically not at all.
          Anything in your life priced off levels C–H answers to the CURVE, not the calendar.
        </p>
      </StepCard>

      <StepCard n="D" icon={<Activity size={17} />} title="Real yields & breakeven inflation">
        <p style={hintStyle}>
          Breakeven ≈ nominal − real (TIPS) at the same maturity — a{' '}
          <strong>market-implied approximation</strong>, not a pure forecast. It splits every yield
          move into two very different problems: inflation fear vs. real-rate repricing.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Maturity</th>
                <th className="num" style={{ textAlign: 'right' }}>Nominal</th>
                <th className="num" style={{ textAlign: 'right' }}>Real (TIPS)</th>
                <th className="num" style={{ textAlign: 'right' }}>Breakeven</th>
              </tr>
            </thead>
            <tbody>
              {bes.map((b) => (
                <tr key={b.maturity}>
                  <td style={{ fontWeight: 600 }}>{b.maturity}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{b.nominalPct}%</td>
                  <td className="num" style={{ textAlign: 'right' }}>{b.realPct}%</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 700, color: b.breakevenPct > 2.5 ? 'var(--neg)' : 'var(--text-primary)' }}>{b.breakevenPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> the 10Y breakeven is {be10.breakevenPct}% — the
          bond market is pricing inflation above the Fed's 2% target for the next decade. Nominal
          yield ≈ expected real rate + expected inflation + term premium (a frame, not an exact
          decomposition) — so a yield spike with FLAT breakevens is a real-rate/supply problem, not
          an inflation problem. Different diagnosis, different cure (see tab 3's CPI/PCE section).
        </p>
      </StepCard>

      <StepCard n="E" icon={<RefreshCcw size={17} />} title="The divergence — the Fed cut, the 10Y rose">
        <p style={hintStyle}>
          In every cutting cycle back to the 1980s, the 10Y was lower 100 days after the first cut
          — every single time. Then September 2024: the Fed cut {snap.firstHundredBpWindow.fedCutBp}bp
          and the 10Y ROSE {snap.firstHundredBpWindow.tenYearMoveBp}bp over the same window. Total
          easing since: {snap.easedSinceSep2024Bp}bp — and the 10Y sits higher than where it
          started. Anchors are the cited prints; points between are smoothed.
        </p>
        <XYLineChart
          data={CUTS_VS_TENYEAR as unknown as Record<string, number | string | null>[]}
          xKey="label"
          series={[
            { id: 'fed', label: 'Fed funds (target mid)' },
            { id: 'tenYear', label: '10Y Treasury' },
          ]}
          height={240}
        />
        <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700, margin: '12px 0 4px' }}>
          So who sets the long rate? Nobody — it is discovered at auction, by:
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {AUCTION_BUYERS.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 8 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Term premium:</strong> {TERM_PREMIUM_DEF}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginTop: 10 }}>
          {SNAP_REASONS.map((r) => (
            <GlassCard key={r.name} variant="nested" padding={12}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{r.what}</div>
              <div style={{ fontSize: 11.5, color: 'var(--accent)', lineHeight: 1.5, marginTop: 6 }}>{r.fact}</div>
            </GlassCard>
          ))}
        </div>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> if your plan is "wait for the cut," you are waiting
          for the wrong committee. Supply, competition, and inflation doubt set the rate that
          prices your life — and none of them are on the FOMC agenda.
        </p>
      </StepCard>

      <StepCard n="F" icon={<Calculator size={17} />} title="Bond basics — the four mechanics behind everything above">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {BOND_BASICS.map((b) => (
            <GlassCard key={b.name} variant="nested" padding={12}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{b.name}</div>
              <Eq>{b.eq}</Eq>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{b.plain}</div>
              <div style={{ fontSize: 11.5, color: 'var(--accent)', lineHeight: 1.5, marginTop: 6 }}>{b.example}</div>
            </GlassCard>
          ))}
        </div>
      </StepCard>

      <StepCard n="G" icon={<Cog size={17} />} title="The scale problem — and the only three ways long rates fall">
        <div className="col" style={{ gap: 6 }}>
          {SCALE_STORY.map((x) => (
            <p key={x.slice(0, 30)} style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{x}</p>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginTop: 12 }}>
          {THREE_WAYS_DOWN.map((w) => (
            <GlassCard key={w.name} variant="nested" padding={12}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{w.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{w.what}</div>
              <div style={{ fontSize: 11.5, color: 'var(--severity-medium)', lineHeight: 1.5, marginTop: 6 }}>{w.warning}</div>
            </GlassCard>
          ))}
        </div>
        <p style={decisionLine}>
          <strong>The practical shift:</strong> {PRACTICAL_SHIFT.join(' ')}
        </p>
      </StepCard>
    </>
  );
}

function RealEstateTab() {
  const bench = mortgageBenchmark();
  const [pay, setPay] = useState(DEFAULT_PAYMENT_INPUTS);
  const [income, setIncome] = useState(12_000);
  const [taxesIns, setTaxesIns] = useState(650);
  const [cre, setCre] = useState(DEFAULT_CRE_INPUTS);
  const basePayment = useMemo(() => monthlyPayment(pay), [pay]);
  const sensitivity = useMemo(() => paymentSensitivity(pay), [pay]);
  const kpis = useMemo(() => creKpis(cre), [cre]);
  const stress = useMemo(() => creRateStress(cre), [cre]);
  const caps = useMemo(() => capRateSensitivity(cre.noi), [cre.noi]);
  const ratio = housingPaymentRatioPct({ monthlyPI: basePayment, monthlyTaxesInsHoa: taxesIns, grossMonthlyIncome: income });

  return (
    <>
      <StepCard n="A" icon={<Home size={17} />} title="Your mortgage's real formula — 10Y + spread, never the 30Y">
        <p style={hintStyle}>
          A 30-year mortgage amortizes over 30 years — but because homeowners can refinance the
          moment rates fall, its EFFECTIVE life is far shorter. So it prices off the{' '}
          <strong>10-year Treasury plus a mortgage/MBS spread</strong>, not the 30Y and not the
          Fed. The spread below is computed from the observations, and labeled honestly: a simple
          observed difference (weekly PMMS vs same-day 10Y CMT), NOT an MBS option-adjusted spread.
        </p>
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          <StatPill label={`30Y fixed (PMMS, ${RATES_SNAPSHOT.mortgageAsOf})`} value={`${bench.mortgagePct}%`} strong />
          <StatPill label="10Y Treasury (same day)" value={`${bench.ust10Pct}%`} />
          <StatPill label="Simple mortgage−10Y spread" value={`${bench.spreadBp}bp`} strong />
          <StatPill label="Fed funds (NOT the benchmark)" value={RATES_SNAPSHOT.fedFundsTarget} />
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.5, margin: '8px 0 0' }}>{bench.note}</p>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 10 }}>
          {RESI_TRANSMISSION.map((t) => (
            <div key={t}>{t}</div>
          ))}
        </div>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> to know where mortgages are going, watch the 10Y
          and the spread — two numbers, updated daily, neither on the Fed's calendar. A refi
          becomes worth pricing when the 10Y falls meaningfully AND holds, or when the spread
          compresses.
        </p>
      </StepCard>

      <StepCard n="B" icon={<Calculator size={17} />} title="The payment calculator — what a basis point costs you">
        <p style={hintStyle}>
          The amortizing-payment formula, live: P·r(1+r)ⁿ ÷ ((1+r)ⁿ−1). The sensitivity table is
          the spec's mandatory view — today's rate ±100bp and ±200bp — so a rate headline converts
          instantly into dollars per month.
        </p>
        <div className="row gap-4" style={{ flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 8 }}>
          <div className="col" style={{ gap: 5 }}>
            <span style={labelStyle}>Loan amount</span>
            <MoneyInput value={pay.principal} onChange={(v) => setPay((x) => ({ ...x, principal: v }))} width={110} />
            <span style={dcfHintStyle}>Example: $400,000.</span>
          </div>
          <div className="col" style={{ gap: 5 }}>
            <span style={labelStyle}>Rate</span>
            <PctInput value={pay.ratePct} onChange={(v) => setPay((x) => ({ ...x, ratePct: v }))} max={15} />
            <span style={dcfHintStyle}>Defaults to today's PMMS 6.65%.</span>
          </div>
          <div className="col" style={{ gap: 5 }}>
            <span style={labelStyle}>Term (years)</span>
            <PctInput value={pay.years} onChange={(v) => setPay((x) => ({ ...x, years: Math.max(1, Math.round(v)) }))} max={40} suffix="yrs" />
            <span style={dcfHintStyle}>30 for the standard fixed.</span>
          </div>
          <StatPill label="Monthly P&I" value={`$${basePayment.toLocaleString('en-US')}`} strong />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Scenario</th>
                <th className="num" style={{ textAlign: 'right' }}>Payment</th>
                <th className="num" style={{ textAlign: 'right' }}>vs today</th>
              </tr>
            </thead>
            <tbody>
              {sensitivity.map((row) => (
                <tr key={row.label}>
                  <td style={{ fontWeight: row.delta === 0 ? 700 : 500 }}>{row.label}</td>
                  <td className="num" style={{ textAlign: 'right' }}>${row.payment.toLocaleString('en-US')}</td>
                  <td className="num" style={{ textAlign: 'right', color: row.delta === 0 ? 'var(--text-tertiary)' : toneFor(-row.delta), fontWeight: 600 }}>
                    {row.delta === 0 ? '—' : `${row.delta > 0 ? '+' : ''}$${Math.abs(row.delta).toLocaleString('en-US')}${row.delta < 0 ? ' saved' : ''}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row gap-4" style={{ flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 14 }}>
          <div className="col" style={{ gap: 5 }}>
            <span style={labelStyle}>Gross monthly income</span>
            <MoneyInput value={income} onChange={setIncome} width={90} />
            <span style={dcfHintStyle}>Household, before tax.</span>
          </div>
          <div className="col" style={{ gap: 5 }}>
            <span style={labelStyle}>Taxes + insurance + HOA / mo</span>
            <MoneyInput value={taxesIns} onChange={setTaxesIns} width={80} />
            <span style={dcfHintStyle}>The non-P&I housing costs.</span>
          </div>
          <StatPill label="Housing payment ÷ income" value={`${ratio}%`} strong />
        </div>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> an analytical ratio, not a lending rule — but the
          shape of the decision: every 100bp on a $400k loan is roughly $260/month, and the
          sensitivity table converts "rates moved" into YOUR number before you call any lender.
        </p>
      </StepCard>

      <StepCard n="C" icon={<Landmark size={17} />} title="Commercial real estate — floating vs fixed are different machines">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
          {CRE_BENCHMARKS.map((b) => (
            <GlassCard key={b.kind} variant="nested" padding={12}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, textTransform: 'capitalize' }}>{b.kind}-rate CRE debt</div>
              <Eq>{b.formula}</Eq>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Benchmark:</strong> {b.benchmark}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>{b.why}</div>
            </GlassCard>
          ))}
        </div>
      </StepCard>

      <StepCard n="D" icon={<BarChart3 size={17} />} title="The CRE dashboard — cap rate, DSCR, LTV, debt yield, and the stress test">
        <p style={hintStyle}>
          The four numbers every lender computes, live from your inputs — then the spec's mandatory
          rate stress (+100/+200/+300bp) recomputing the debt service and DSCR, and the cap-rate
          table showing why required-return changes move property values so violently.
        </p>
        <div className="row gap-4" style={{ flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 8 }}>
          <div className="col" style={{ gap: 5 }}>
            <span style={labelStyle}>NOI (annual)</span>
            <MoneyInput value={cre.noi} onChange={(v) => setCre((x) => ({ ...x, noi: v }))} width={100} />
            <span style={dcfHintStyle}>Net operating income — rent minus operating costs, before debt. Example: $1,000,000.</span>
          </div>
          <div className="col" style={{ gap: 5 }}>
            <span style={labelStyle}>Property value</span>
            <MoneyInput value={cre.propertyValue} onChange={(v) => setCre((x) => ({ ...x, propertyValue: v }))} width={110} />
            <span style={dcfHintStyle}>Example: $16,000,000 → a 6.25% cap rate.</span>
          </div>
          <div className="col" style={{ gap: 5 }}>
            <span style={labelStyle}>Loan balance</span>
            <MoneyInput value={cre.loanBalance} onChange={(v) => setCre((x) => ({ ...x, loanBalance: v }))} width={110} />
            <span style={dcfHintStyle}>Example: $10,000,000 → 62.5% LTV.</span>
          </div>
          <div className="col" style={{ gap: 5 }}>
            <span style={labelStyle}>Loan rate</span>
            <PctInput value={cre.loanRatePct} onChange={(v) => setCre((x) => ({ ...x, loanRatePct: v }))} max={15} />
            <span style={dcfHintStyle}>All-in: benchmark + spread. Example: 6.5%.</span>
          </div>
          <div className="col" style={{ gap: 5 }}>
            <span style={labelStyle}>Amortization</span>
            <PctInput value={cre.amortYears} onChange={(v) => setCre((x) => ({ ...x, amortYears: Math.max(0, Math.round(v)) }))} max={40} suffix="yrs" />
            <span style={dcfHintStyle}>0 = interest-only.</span>
          </div>
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          <StatPill label="Cap rate (NOI ÷ value)" value={`${kpis.capRatePct}%`} />
          <StatPill label="Annual debt service" value={`$${kpis.annualDebtService.toLocaleString('en-US')}`} />
          <StatPill label="DSCR (NOI ÷ debt service)" value={`${kpis.dscr}×`} strong />
          <StatPill label="LTV" value={`${kpis.ltvPct}%`} />
          <StatPill label="Debt yield (NOI ÷ loan)" value={`${kpis.debtYieldPct}%`} />
        </div>
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Rate stress</th>
                <th className="num" style={{ textAlign: 'right' }}>Debt service</th>
                <th className="num" style={{ textAlign: 'right' }}>DSCR</th>
              </tr>
            </thead>
            <tbody>
              {stress.map((row) => (
                <tr key={row.label}>
                  <td style={{ fontWeight: row.label.startsWith('today') ? 700 : 500 }}>{row.label}</td>
                  <td className="num" style={{ textAlign: 'right' }}>${row.annualDebtService.toLocaleString('en-US')}</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 700, color: row.dscr >= 1.25 ? 'var(--pos)' : row.dscr >= 1.1 ? 'var(--severity-medium)' : 'var(--neg)' }}>{row.dscr}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Cap rate</th>
                {caps.map((c) => (
                  <th key={c.capRatePct} className="num" style={{ textAlign: 'right' }}>{c.capRatePct}%</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Value of {fmtMoney(cre.noi, 0)} NOI</td>
                {caps.map((c) => (
                  <td key={c.capRatePct} className="num" style={{ textAlign: 'right' }}>{fmtMoney(c.value, 0)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 10 }}>
          {CRE_TRANSMISSION.map((t) => (
            <div key={t}>{t}</div>
          ))}
        </div>
      </StepCard>

      <StepCard n="E" icon={<ClipboardCheck size={17} />} title="What each number tells you to do">
        <div className="col" style={{ gap: 8 }}>
          {RE_DECISION_READS.map((d) => (
            <div key={d.metric} style={{ fontSize: 12.5, lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{d.metric}:</strong>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>{d.read}</span>
            </div>
          ))}
        </div>
      </StepCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tabs 13 & 14 — IPO & capital markets, industry benchmarks
// ---------------------------------------------------------------------------

function IpoTab() {
  const [checked, setChecked] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      WINDOW_CHECKLISTS.map((l) => [l.id, l.items.filter((i) => i.defaultChecked).map((i) => i.id)]),
    ),
  );
  const toggle = (listId: string, itemId: string) =>
    setChecked((c) => ({
      ...c,
      [listId]: c[listId].includes(itemId) ? c[listId].filter((x) => x !== itemId) : [...c[listId], itemId],
    }));
  const scores = WINDOW_CHECKLISTS.map((l) => windowScore(l, checked[l.id]));
  const [dil, setDil] = useState(DEFAULT_DILUTION_INPUTS);
  const dilR = useMemo(() => dilution(dil), [dil]);
  const [sectorSel, setSectorSel] = useState<string[]>(['overall', 'ai', 'biotech', 'tech']);
  const toggleSector = (id: string) =>
    setSectorSel((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 4 ? cur : [...cur, id]));
  const sectorRows = useMemo(() => sectorIpoRows(), []);

  return (
    <>
      <StepCard n="A" icon={<Rocket size={17} />} title={`The IPO market right now — ${IPO_REFERENCE.period}`}>
        <p style={hintStyle}>
          Before any framework: what the market is actually doing. Reference context from{' '}
          {IPO_REFERENCE.source} — anchored to its period, never treated as permanently current.
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {IPO_REFERENCE.facts.map((f) => (
            <li key={f.slice(0, 40)}>{f}</li>
          ))}
        </ul>
      </StepCard>

      <StepCard n="B" icon={<TrendingUp size={17} />} title="IPO by sector — the trend over time (2021 → H1 2026)">
        <p style={hintStyle}>
          The §76 view: sector windows over time, not one market. Pick up to four lines — the
          shape is the lesson: the 2021 mania, the 2022 collapse across sectors (biotech alone kept sliding to a 2025 trough), the slow thaw,
          and a reopening led by AI while biotech's line kept falling (−47% in 2025) even as its
          private financing rose. H1 2026 is a HALF year — read the shape, not the last bar.
        </p>
        <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 4 }}>
          {SECTOR_IPO_TRENDS.map((t) => (
            <Chip key={t.id} active={sectorSel.includes(t.id)} onClick={() => toggleSector(t.id)}>
              {t.name}
            </Chip>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '0 0 4px' }}>Pick up to 4 to chart.</p>
        <XYLineChart
          data={sectorRows}
          xKey="year"
          series={SECTOR_IPO_TRENDS.filter((t) => sectorSel.includes(t.id)).map((t) => ({ id: t.id, label: t.name }))}
          height={260}
          ySuffix=" deals"
        />
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Sector</th>
                <th className="num" style={{ textAlign: 'right' }}>2021</th>
                <th className="num" style={{ textAlign: 'right' }}>2022</th>
                <th className="num" style={{ textAlign: 'right' }}>2023</th>
                <th className="num" style={{ textAlign: 'right' }}>2024</th>
                <th className="num" style={{ textAlign: 'right' }}>2025</th>
                <th className="num" style={{ textAlign: 'right' }}>H1 26</th>
                <th style={{ textAlign: 'left' }}>The read</th>
              </tr>
            </thead>
            <tbody>
              {SECTOR_IPO_TRENDS.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t.name}</td>
                  {t.counts.map((c, i) => (
                    <td key={i} className="num" style={{ textAlign: 'right', fontWeight: i === 5 ? 700 : 400, color: i === 1 ? 'var(--neg)' : i === 5 ? 'var(--accent)' : 'var(--text-secondary)' }}>{c}</td>
                  ))}
                  <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>{SECTOR_IPO_SOURCE}</p>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> the sector line you belong to IS your
          IndustryWindowScore's first checkbox (section C below). AI's half-year beating its every
          full year says that window is wide open; biotech's falling line with rising private
          financing says take the private row of the menu (section E) and wait; consumer's flat
          line says the reopening hasn't reached Main Street. Never read the overall line alone.
        </p>
      </StepCard>

      <StepCard n="C" icon={<ClipboardCheck size={17} />} title="The three windows — scored separately, never collapsed">
        <p style={hintStyle}>
          The IPO decision is three different questions with three different owners. Toggle the
          checklist items to score each one — the defaults are pre-set to the H1-2026 reference
          picture for a biotech-style issuer (overall market open, sector window shut, company
          unproven).
        </p>
        <div className="row gap-3" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
          {scores.map((sc) => (
            <StatPill
              key={sc.id}
              label={`${sc.name} (${sc.checked}/${sc.total})`}
              value={`${sc.scorePct}% — ${sc.read}`}
              strong={sc.id === 'company'}
            />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {WINDOW_CHECKLISTS.map((list) => (
            <GlassCard key={list.id} variant="nested" padding={14}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{list.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginBottom: 8 }}>{list.question}</div>
              <div className="col" style={{ gap: 6 }}>
                {list.items.map((item) => {
                  const on = checked[list.id].includes(item.id);
                  return (
                    <div key={item.id}>
                      <Chip active={on} onClick={() => toggle(list.id, item.id)}>
                        {on ? '✓ ' : ''}{item.label}
                      </Chip>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.45, margin: '3px 0 0 4px' }}>{item.why}</div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          ))}
        </div>
        <p style={decisionLine}>
          <strong>The rule:</strong> {THREE_SCORES_RULE}
        </p>
      </StepCard>

      <StepCard n="D" icon={<Calculator size={17} />} title="Dilution math — what the raise actually costs the owners">
        <p style={hintStyle}>
          Post-money = pre-money + PRIMARY raised; new investors own primary ÷ post-money.
          Secondary shares are existing holders selling — cash to them, zero dilution — and the
          spec's rule is to never blur the two in a headline number. The greenshoe can add up to
          15% more primary shares if bankers exercise it.
        </p>
        <div style={wbGrid}>
          <WbField label="Pre-money value" hint="What the company is worth before new money. Example: 900 ($M).">
            <MoneyInput value={dil.preMoney} onChange={(v) => setDil((x) => ({ ...x, preMoney: v }))} width={90} />
          </WbField>
          <WbField label="Primary raised" hint="NEW money into the company. Example: 100 → post-money 1,000.">
            <MoneyInput value={dil.primaryRaised} onChange={(v) => setDil((x) => ({ ...x, primaryRaised: v }))} width={80} />
          </WbField>
          <WbField label="Existing shares" hint="Fully diluted, before the offering. Example: 90 (M) → $10.00 offer price.">
            <MoneyInput value={dil.existingShares} onChange={(v) => setDil((x) => ({ ...x, existingShares: v }))} width={80} />
          </WbField>
          <WbField label="Greenshoe" hint="Over-allotment option, % of primary. Example: 15%.">
            <PctInput value={dil.greenshoePct} onChange={(v) => setDil((x) => ({ ...x, greenshoePct: v }))} max={25} />
          </WbField>
          <WbField label="Secondary sold" hint="Existing holders' shares sold, $. Cash to sellers — NOT dilution. Example: 50.">
            <MoneyInput value={dil.secondarySold} onChange={(v) => setDil((x) => ({ ...x, secondarySold: v }))} width={80} />
          </WbField>
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          <StatPill label="Post-money" value={fmtMoney(dilR.postMoney, 0)} strong />
          <StatPill label="Offer price (pre ÷ shares)" value={`$${dilR.sharePrice.toLocaleString('en-US')}`} />
          <StatPill label="New shares issued" value={String(dilR.newShares)} />
          <StatPill label="New-investor ownership" value={`${dilR.newOwnershipPct}%`} strong />
          <StatPill label="…if greenshoe exercised" value={`${dilR.newOwnershipWithShoePct}%`} />
        </div>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> dilution is the PRICE of the equity window. Compare
          it against the financing menu below — and remember §82: if you believe intrinsic value
          materially exceeds the market's price, issuing equity transfers value from your existing
          holders to the new ones. That belief should be defended or dropped, not assumed.
        </p>
      </StepCard>

      <StepCard n="E" icon={<Handshake size={17} />} title="The financing menu — IPO against every alternative">
        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Option</th>
                <th style={{ textAlign: 'left' }}>Cash you get</th>
                <th style={{ textAlign: 'left' }}>What it costs</th>
                <th style={{ textAlign: 'left' }}>Best when</th>
              </tr>
            </thead>
            <tbody>
              {FINANCING_MENU.map((f) => (
                <tr key={f.name}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{f.name}</td>
                  <td style={{ fontSize: 12 }}>{f.cash}</td>
                  <td style={{ fontSize: 12 }}>{f.cost}</td>
                  <td style={{ fontSize: 12 }}>{f.bestWhen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> "should we IPO?" is really "which cell of this
          table is cheapest for the cash we actually need, given which windows are open?" —
          biotech's 2025 answer was the private row ($68.5B raised with the IPO window down 47%).
        </p>
      </StepCard>
    </>
  );
}

function BenchmarksTab() {
  const [companyM, setCompanyM] = useState(DEFAULT_COMPANY_METRICS);
  const [industryId, setIndustryId] = useState('pharma');
  const comparison = useMemo(() => compareToBenchmark(companyM, industryId), [companyM, industryId]);
  const [runway, setRunway] = useState(DEFAULT_RUNWAY_INPUTS);
  const runwayR = useMemo(() => biotechRunway(runway), [runway]);
  const [r40, setR40] = useState(DEFAULT_RULE40_INPUTS);
  const r40R = useMemo(() => rule40(r40), [r40]);
  const [retail, setRetail] = useState(DEFAULT_RETAIL_INPUTS);
  const retailR = useMemo(() => retailKit(retail), [retail]);

  return (
    <>
      <StepCard n="A" icon={<Scale size={17} />} title="The observed benchmarks — January 2026 (Damodaran / NYU Stern)">
        <p style={hintStyle}>
          What industries actually look like — the observed averages the spec cites. Read the
          biotech-vs-pharma row twice: same sector family, different planet. Then read the rule
          under the table before using any of it.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Industry</th>
                <th className="num" style={{ textAlign: 'right' }}>Debt/EBITDA</th>
                <th className="num" style={{ textAlign: 'right' }}>Coverage</th>
                <th className="num" style={{ textAlign: 'right' }}>AT oper. margin</th>
                <th className="num" style={{ textAlign: 'right' }}>ROC</th>
                <th style={{ textAlign: 'left' }}>The read</th>
              </tr>
            </thead>
            <tbody>
              {DAMODARAN_JAN2026.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.industry}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{Number.isFinite(b.debtEbitda) ? `${b.debtEbitda}×` : '—'}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{Number.isFinite(b.interestCoverage) ? `${b.interestCoverage}×` : '—'}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{b.afterTaxOperMarginPct}%</td>
                  <td className="num" style={{ textAlign: 'right' }}>{b.rocPct}%</td>
                  <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{b.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>Source: {BENCHMARK_SOURCE}.</p>
        <p style={{ ...decisionLine, borderLeftColor: 'var(--neg)' }}>
          <strong>The rule:</strong> {OBSERVED_NOT_HEALTHY_RULE}
        </p>
      </StepCard>

      <StepCard n="B" icon={<BarChart3 size={17} />} title="Your company vs. the observed average">
        <p style={hintStyle}>
          Type your four numbers, pick the industry, and each comparison comes back with the
          direction discipline attached — higher is NOT automatically better, and the read tells
          you which way each metric cuts.
        </p>
        <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 10 }}>
          {DAMODARAN_JAN2026.map((b) => (
            <Chip key={b.id} active={industryId === b.id} onClick={() => setIndustryId(b.id)}>
              {b.industry}
            </Chip>
          ))}
        </div>
        <div style={wbGrid}>
          <WbField label="Debt / EBITDA" hint="Adjusted debt ÷ EBITDA (tab 1's pro forma computes it). Example: 2.5×.">
            <PctInput value={companyM.debtEbitda} onChange={(v) => setCompanyM((x) => ({ ...x, debtEbitda: v }))} max={15} suffix="×" />
          </WbField>
          <WbField label="Interest coverage" hint="EBITDA ÷ interest. Example: 6.7×.">
            <PctInput value={companyM.interestCoverage} onChange={(v) => setCompanyM((x) => ({ ...x, interestCoverage: v }))} max={50} suffix="×" />
          </WbField>
          <WbField label="After-tax operating margin" hint="NOPAT ÷ revenue. Example: 16%.">
            <PctInput value={companyM.afterTaxOperMarginPct} onChange={(v) => setCompanyM((x) => ({ ...x, afterTaxOperMarginPct: v }))} max={60} />
          </WbField>
          <WbField label="Return on capital" hint="NOPAT ÷ invested capital (tab 10's ROIC kit). Example: 12%.">
            <PctInput value={companyM.rocPct} onChange={(v) => setCompanyM((x) => ({ ...x, rocPct: v }))} max={80} />
          </WbField>
        </div>
        <div className="col" style={{ gap: 8 }}>
          {comparison.rows.map((row) => (
            <GlassCard key={row.metric} variant="nested" padding={12}>
              <div className="between" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{row.metric}</span>
                <span className="num" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  you {row.company} · observed {row.observed}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{row.read}</div>
            </GlassCard>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '8px 0 0' }}>
          Benchmark type: {comparison.benchmarkType} — never displayed as a rule.
        </p>
      </StepCard>

      <StepCard n="C" icon={<Calculator size={17} />} title="Vertical quick kits — the metric that matters in YOUR industry">
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
          Pre-revenue biotech: runway & catalyst coverage
        </div>
        <div style={wbGrid}>
          <WbField label="Cash" hint="Example: 40 ($M).">
            <MoneyInput value={runway.cash} onChange={(v) => setRunway((x) => ({ ...x, cash: v }))} width={70} />
          </WbField>
          <WbField label="Marketable securities" hint="Example: 8.">
            <MoneyInput value={runway.marketableSecurities} onChange={(v) => setRunway((x) => ({ ...x, marketableSecurities: v }))} width={70} />
          </WbField>
          <WbField label="Monthly burn" hint="Example: 2 → 24 months of runway.">
            <MoneyInput value={runway.monthlyBurn} onChange={(v) => setRunway((x) => ({ ...x, monthlyBurn: v }))} width={70} />
          </WbField>
          <WbField label="Months to next catalyst" hint="The value-changing readout/approval. Example: 18.">
            <PctInput value={runway.monthsToNextCatalyst} onChange={(v) => setRunway((x) => ({ ...x, monthsToNextCatalyst: Math.round(v) }))} max={60} suffix="mo" />
          </WbField>
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          <StatPill label="Cash runway" value={`${runwayR.runwayMonths} months`} strong />
          <StatPill label="Band" value={runwayR.bandLabel} />
          <StatPill label="Catalyst coverage (runway − catalyst)" value={`${runwayR.catalystCoverageMonths > 0 ? '+' : ''}${runwayR.catalystCoverageMonths} mo`} strong />
        </div>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> {runwayR.read}
        </p>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', margin: '16px 0 6px' }}>
          SaaS: Rule of 40
        </div>
        <div className="row gap-4" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <WbField label="Revenue growth" hint="ARR growth, %. Example: 28%.">
            <PctInput value={r40.revenueGrowthPct} onChange={(v) => setR40((x) => ({ ...x, revenueGrowthPct: v }))} max={200} />
          </WbField>
          <WbField label="FCF margin" hint="The NAMED profitability measure. Example: 8%.">
            <PctInput value={r40.fcfMarginPct} onChange={(v) => setR40((x) => ({ ...x, fcfMarginPct: v }))} max={60} />
          </WbField>
          <StatPill label="Rule of 40" value={`${r40R.score} — ${r40R.passes ? 'passes' : 'below'}`} strong />
        </div>
        <p style={decisionLine}>{r40R.read}</p>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', margin: '16px 0 6px' }}>
          Retail: turnover, GMROI, and the inventory growth gap
        </div>
        <div style={wbGrid}>
          <WbField label="COGS (annual)" hint="Example: $7,000,000.">
            <MoneyInput value={retail.cogs} onChange={(v) => setRetail((x) => ({ ...x, cogs: v }))} width={100} />
          </WbField>
          <WbField label="Average inventory" hint="Example: $1,600,000 → 4.4 turns.">
            <MoneyInput value={retail.averageInventory} onChange={(v) => setRetail((x) => ({ ...x, averageInventory: v }))} width={100} />
          </WbField>
          <WbField label="Gross margin $" hint="Example: $3,000,000 → GMROI 1.9.">
            <MoneyInput value={retail.grossMarginDollars} onChange={(v) => setRetail((x) => ({ ...x, grossMarginDollars: v }))} width={100} />
          </WbField>
          <WbField label="Inventory growth" hint="YoY, %. Example: 14%.">
            <PctInput value={retail.inventoryGrowthPct} onChange={(v) => setRetail((x) => ({ ...x, inventoryGrowthPct: v }))} max={100} />
          </WbField>
          <WbField label="Revenue growth" hint="YoY, %. Example: 6% → an 8pp warning gap.">
            <PctInput value={retail.revenueGrowthPct} onChange={(v) => setRetail((x) => ({ ...x, revenueGrowthPct: v }))} max={100} />
          </WbField>
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          <StatPill label="Inventory turnover" value={`${retailR.inventoryTurnover}×`} />
          <StatPill label="GMROI" value={String(retailR.gmroi)} />
          <StatPill label="Inventory − revenue growth" value={`${retailR.inventoryGrowthGapPct > 0 ? '+' : ''}${retailR.inventoryGrowthGapPct}pp`} strong />
        </div>
        <p style={decisionLine}>{retailR.read}</p>

        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 14 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Banks:</strong> {BANK_METRICS_NOTE}
        </p>
      </StepCard>

      <StepCard n="D" icon={<GraduationCap size={17} />} title='Before you ever say "is 3× good?" — the §123 questions'>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {INDUSTRY_HEALTH_QUESTIONS.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> a number without its industry, stage, peers, cycle
          position, and downside case is not information — it's a Rorschach test. The comparator
          above forces the first two questions; the rest are yours to ask out loud, which is
          exactly what a Manager-level answer sounds like.
        </p>
      </StepCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 15 — sovereign debt & geopolitics
// ---------------------------------------------------------------------------

function DebtGeoTab() {
  const [sel, setSel] = useState<string[]>(['us', 'china', 'japan', 'germany']);
  const toggleCountry = (id: string) =>
    setSel((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 4 ? cur : [...cur, id]));
  const chartData = DEBT_TREND_YEARS.map((year, i) => {
    const row: Record<string, number | string> = { year: String(year) };
    for (const c of COUNTRY_DEBT) row[c.id] = c.trend[i];
    return row;
  });
  const latestSorted = [...COUNTRY_DEBT].sort((a, b) => b.trend[3] - a.trend[3]);
  const [fxSel, setFxSel] = useState<string[]>(['krw', 'jpy', 'eur', 'cny']);
  const toggleFx = (id: string) =>
    setFxSel((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 4 ? cur : [...cur, id]));
  const fxRows = useMemo(() => currencyRows(), []);
  const tradeSorted = [...TRADE_BALANCES].sort((a, b) => tradeBalanceB(b) - tradeBalanceB(a));

  return (
    <>
      <StepCard n="A" icon={<Globe size={17} />} title="Debt-to-GDP — the ten largest economies, 2000 → today">
        <p style={hintStyle}>
          Dalio's equilibrium 1 at sovereign scale: debt versus the income that services it. Pick
          up to four countries to chart the 25-year ratchet — every downturn met with more
          borrowing, never fully unwound. The table below is sorted by today's level; Japan is the
          endgame exhibit, China the fastest ratchet, Germany the disciplinarian.
        </p>
        <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 4 }}>
          {COUNTRY_DEBT.map((c) => (
            <Chip key={c.id} active={sel.includes(c.id)} onClick={() => toggleCountry(c.id)}>
              {c.name}
            </Chip>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '0 0 4px' }}>Pick up to 4 to chart.</p>
        <XYLineChart
          data={chartData}
          xKey="year"
          series={COUNTRY_DEBT.filter((c) => sel.includes(c.id)).map((c) => ({ id: c.id, label: c.name }))}
          height={260}
        />
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Country</th>
                <th className="num" style={{ textAlign: 'right' }}>2000</th>
                <th className="num" style={{ textAlign: 'right' }}>2010</th>
                <th className="num" style={{ textAlign: 'right' }}>2020</th>
                <th className="num" style={{ textAlign: 'right' }}>~2025</th>
                <th style={{ textAlign: 'left' }}>The read</th>
              </tr>
            </thead>
            <tbody>
              {latestSorted.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  {c.trend.map((v, i) => (
                    <td key={i} className="num" style={{ textAlign: 'right', fontWeight: i === 3 ? 700 : 400, color: i === 3 ? (v >= 100 ? 'var(--neg)' : 'var(--text-primary)') : 'var(--text-secondary)' }}>{v}%</td>
                  ))}
                  <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>{COUNTRY_DEBT_SOURCE}</p>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> the level matters less than the SLOPE against
          income growth (Dalio's rule 1) and the distance to the zero bound (tab 4's long-cycle
          odometer). India deleverages through nominal growth at 82%; Japan needs its central bank
          at 235%; the US at 123% is the tab-11 story — the market has started charging.
        </p>
      </StepCard>

      <StepCard n="B" icon={<Landmark size={17} />} title="The US-state version — where the debt hides">
        <p style={hintStyle}>
          States can't run federal-style deficits — balanced-budget rules cap their bonded debt at
          single-digit percentages of state GDP. So the real long-term liability hides in{' '}
          <strong>pension promises</strong>: Dalio's "liabilities we don't call debt," and the
          exact reason tab 1's pro forma adds pension to leverage. Top ten state economies:
        </p>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={STATE_DEBT.map((st) => ({ name: st.name.length > 10 ? st.name.slice(0, 10) + '…' : st.name, pct: st.debtGspPct }))} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} interval={0} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} width={36} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated-2)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--text-primary)' }}
                itemStyle={{ color: 'var(--text-primary)' }}
                labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                formatter={(value: number) => [`${value}% of GSP`, 'Bonded debt']}
                cursor={{ fill: 'var(--accent-soft)' }}
              />
              <Bar dataKey="pct" radius={4} maxBarSize={34}>
                {STATE_DEBT.map((st) => (
                  <Cell key={st.id} fill={st.debtGspPct >= 10 ? 'var(--neg)' : st.debtGspPct >= 6 ? 'var(--severity-medium)' : 'var(--pos)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>State (GDP rank)</th>
                <th className="num" style={{ textAlign: 'right' }}>Bonded debt / GSP</th>
                <th style={{ textAlign: 'left' }}>The pension layer — the number that isn't on this row</th>
              </tr>
            </thead>
            <tbody>
              {STATE_DEBT.map((st) => (
                <tr key={st.id}>
                  <td style={{ fontWeight: 600 }}>{st.name} (#{st.gdpRank})</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 700, color: st.debtGspPct >= 10 ? 'var(--neg)' : st.debtGspPct >= 6 ? 'var(--severity-medium)' : 'var(--pos)' }}>{st.debtGspPct}%</td>
                  <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{st.pensionNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>{STATE_DEBT_SOURCE}</p>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> read the two columns TOGETHER. New York's 14% with
          funded pensions is a different animal from New Jersey's 12% with a deep pension hole —
          and Illinois proves the bonded number can look moderate while the promise layer is the
          real balance sheet. Same lesson as corporate credit on tab 2: the liabilities you don't
          see are the ones that bite.
        </p>
      </StepCard>

      <StepCard n="C" icon={<BarChart3 size={17} />} title="Imports vs exports — surplus and deficit, the top ten (+ South Korea)">
        <p style={hintStyle}>
          The cash engine of each economy: what it sells the world against what it buys. The
          balance column is COMPUTED (exports − imports). Surplus economies earn the world's
          currency; deficit economies borrow it — which is why the trade line, the currency line
          below, and the debt table above are one story.
        </p>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tradeSorted.map((t) => ({ name: t.name.replace('United States', 'US').replace('United Kingdom', 'UK').replace('South Korea', 'S. Korea'), exports: t.exportsB, imports: t.importsB }))} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} interval={0} angle={-25} textAnchor="end" height={55} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} width={44} tickFormatter={(v) => `$${v}B`} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated-2)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--text-primary)' }}
                itemStyle={{ color: 'var(--text-primary)' }}
                labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                formatter={(value: number, name: string) => [`$${value}B`, name === 'exports' ? 'Exports' : 'Imports']}
                cursor={{ fill: 'var(--accent-soft)' }}
              />
              <Legend formatter={(v) => (v === 'exports' ? 'Exports' : 'Imports')} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="exports" fill="var(--pos)" radius={3} maxBarSize={18} />
              <Bar dataKey="imports" fill="var(--neg)" radius={3} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Country</th>
                <th className="num" style={{ textAlign: 'right' }}>Exports</th>
                <th className="num" style={{ textAlign: 'right' }}>Imports</th>
                <th className="num" style={{ textAlign: 'right' }}>Balance</th>
                <th style={{ textAlign: 'left' }}>The read</th>
              </tr>
            </thead>
            <tbody>
              {tradeSorted.map((t) => {
                const bal = tradeBalanceB(t);
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t.name}</td>
                    <td className="num" style={{ textAlign: 'right' }}>${t.exportsB}B</td>
                    <td className="num" style={{ textAlign: 'right' }}>${t.importsB}B</td>
                    <td className="num" style={{ textAlign: 'right', fontWeight: 700, color: bal >= 0 ? 'var(--pos)' : 'var(--neg)' }}>{bal >= 0 ? '+' : '−'}${Math.abs(bal)}B</td>
                    <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{t.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>{TRADE_SOURCE}</p>
      </StepCard>

      <StepCard n="D" icon={<TrendingUp size={17} />} title="Currency trends vs the dollar (2021 → 2026)">
        <p style={hintStyle}>
          The world's verdict on each economy's claim, indexed to 2021 = 100 — lower means the
          currency bought fewer dollars. The won and the yen are the two big slides; the euro
          mutes its members' moves and pushes the fight into politics instead. Pick up to four.
        </p>
        <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 4 }}>
          {CURRENCY_TRENDS.map((c) => (
            <Chip key={c.id} active={fxSel.includes(c.id)} onClick={() => toggleFx(c.id)}>
              {c.name}
            </Chip>
          ))}
        </div>
        <XYLineChart
          data={fxRows}
          xKey="year"
          series={CURRENCY_TRENDS.filter((c) => fxSel.includes(c.id)).map((c) => ({ id: c.id, label: c.name }))}
          height={250}
          ySuffix=""
        />
        <div className="col" style={{ gap: 4, marginTop: 8 }}>
          {CURRENCY_TRENDS.filter((c) => fxSel.includes(c.id)).map((c) => (
            <div key={c.id} style={{ fontSize: 11.5, lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{c.name}:</strong>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>{c.note}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>{CURRENCY_SOURCE}</p>
        <p style={decisionLine}>
          <strong>Reading the two graphs together:</strong> a surplus economy with a sliding
          currency (Korea, Japan) is the interesting case — the trade engine is fine but capital
          is leaving anyway, which means the story is politics, rates, or governance, not trade.
          That is the case study below.
        </p>
      </StepCard>

      <StepCard n="E" icon={<Globe size={17} />} title={KOREA_CASE.title}>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {KOREA_CASE.facts.map((f) => (
            <li key={f.slice(0, 40)}>{f}</li>
          ))}
        </ul>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 10, background: 'var(--bg-elevated-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
          {KOREA_CASE.chain.map((step) => (
            <div key={step.slice(0, 40)}>{step}</div>
          ))}
        </div>
        <p style={decisionLine}>
          <strong>The lesson:</strong> {KOREA_CASE.lesson}
        </p>
      </StepCard>

      <StepCard n="F" icon={<Landmark size={17} />} title="Populism & the fiscal-policy pipeline — by country">
        <p style={hintStyle}>
          The Dalio chain: wealth gap → populism of both flanks → populism owns the fiscal lever →
          deficits, tariffs, and ultimately the term premium. Per country: how the pressure is
          expressing, what fiscal decisions are in the pipeline over the next 24 months, and the
          economic channel they would hit.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Country</th>
                <th style={{ textAlign: 'left' }}>Pressure</th>
                <th style={{ textAlign: 'left' }}>How it's expressing</th>
                <th style={{ textAlign: 'left' }}>Fiscal pipeline (24 mo)</th>
                <th style={{ textAlign: 'left' }}>Potential impact</th>
              </tr>
            </thead>
            <tbody>
              {POPULISM_WATCH.map((r) => (
                <tr key={r.country}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.country}</td>
                  <td>
                    <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: r.pressure === 'acute' || r.pressure === 'high' ? 'var(--neg)' : r.pressure === 'rising' ? 'var(--severity-medium)' : 'var(--text-tertiary)', border: `1px solid ${r.pressure === 'acute' || r.pressure === 'high' ? 'var(--neg)' : r.pressure === 'rising' ? 'var(--severity-medium)' : 'var(--border-strong)'}`, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                      {r.pressure}
                    </span>
                  </td>
                  <td style={{ fontSize: 11.5 }}>{r.expression}</td>
                  <td style={{ fontSize: 11.5 }}>{r.fiscalPipeline}</td>
                  <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{r.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>{POPULISM_NOTE}</p>
      </StepCard>

      <StepCard n="G" icon={<Activity size={17} />} title="GDP & GSP impact watch — health, food, education (next 24 months)">
        <p style={hintStyle}>
          The NON-fiscal items that move output: disease and health policy (FDA / health
          departments), food and agriculture, and education/workforce changes — keyed to the SAME
          top-ten country and top-ten state lists as the debt tables above.
        </p>
        <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700, margin: '0 0 6px' }}>
          By the top-ten countries
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Country</th>
                <th style={{ textAlign: 'left' }}>Health / disease / FDA-equivalent</th>
                <th style={{ textAlign: 'left' }}>Food & agriculture</th>
                <th style={{ textAlign: 'left' }}>Education / workforce</th>
                <th style={{ textAlign: 'left' }}>The GDP read</th>
              </tr>
            </thead>
            <tbody>
              {GDP_IMPACT_COUNTRIES.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.name}</td>
                  <td style={{ fontSize: 11.5 }}>{r.health}</td>
                  <td style={{ fontSize: 11.5 }}>{r.food}</td>
                  <td style={{ fontSize: 11.5 }}>{r.education}</td>
                  <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{r.read}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700, margin: '14px 0 6px' }}>
          By the top-ten states
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>State</th>
                <th style={{ textAlign: 'left' }}>Health / health department</th>
                <th style={{ textAlign: 'left' }}>Food & agriculture</th>
                <th style={{ textAlign: 'left' }}>Education / workforce</th>
                <th style={{ textAlign: 'left' }}>The GSP read</th>
              </tr>
            </thead>
            <tbody>
              {GSP_IMPACT_STATES.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.name}</td>
                  <td style={{ fontSize: 11.5 }}>{r.health}</td>
                  <td style={{ fontSize: 11.5 }}>{r.food}</td>
                  <td style={{ fontSize: 11.5 }}>{r.education}</td>
                  <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{r.read}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>{GDP_IMPACT_NOTE}</p>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> the dials don't move themselves — an avian-flu
          wave is the food line of tab 3, NHS backlogs are a growth-dial item, a monsoon is
          India's monetary policy. This table is where "etc etc" becomes a checklist.
        </p>
      </StepCard>

      <StepCard n="H" icon={<RefreshCcw size={17} />} title="What is moving geopolitics right now">
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {GEO_CURRENT.map((g) => (
            <li key={g.slice(0, 40)}>{g}</li>
          ))}
        </ul>
      </StepCard>

      <StepCard n="I" icon={<Cog size={17} />} title="What typically moves geopolitics — the standing watch list">
        <p style={hintStyle}>
          Twelve recurring drivers, each mapped to the dial or equilibrium it hits first — so a
          headline converts into a model input instead of a mood.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
          {GEO_DRIVERS.map((d) => (
            <GlassCard key={d.name} variant="nested" padding={12}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{d.what}</div>
              <div style={{ fontSize: 11.5, color: 'var(--accent)', lineHeight: 1.5, marginTop: 6 }}>
                <strong>Hits first:</strong> {d.hits}
              </div>
            </GlassCard>
          ))}
        </div>
      </StepCard>

      <StepCard n="J" icon={<CalendarCheckIcon />} title="The next 24 months — scheduled, by country and by state">
        <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700, margin: '0 0 6px' }}>
          Countries
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>When</th>
                <th style={{ textAlign: 'left' }}>Where</th>
                <th style={{ textAlign: 'left' }}>What</th>
                <th style={{ textAlign: 'left' }}>Why it matters</th>
              </tr>
            </thead>
            <tbody>
              {GEO_CALENDAR_COUNTRIES.map((e) => (
                <tr key={e.where + e.when}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{e.when}</td>
                  <td style={{ fontWeight: 600 }}>{e.where}</td>
                  <td style={{ fontSize: 12 }}>{e.what}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{e.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700, margin: '14px 0 6px' }}>
          US states (the top-10 economies above)
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>When</th>
                <th style={{ textAlign: 'left' }}>Where</th>
                <th style={{ textAlign: 'left' }}>What</th>
                <th style={{ textAlign: 'left' }}>Why it matters</th>
              </tr>
            </thead>
            <tbody>
              {GEO_CALENDAR_STATES.map((e) => (
                <tr key={e.where + e.when}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{e.when}</td>
                  <td style={{ fontWeight: 600 }}>{e.where}</td>
                  <td style={{ fontSize: 12 }}>{e.what}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{e.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '8px 0 0' }}>{GEO_CALENDAR_NOTE}</p>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> November 2026 is the density point — the US
          midterms plus governors in 8 of the 10 largest state economies on one night. For the
          model: election outcomes move the FISCAL dial (tabs 3–4) before any economic data does,
          and the calendar is the one part of geopolitics you can actually diarize.
        </p>
      </StepCard>
    </>
  );
}

function CalendarCheckIcon() {
  return <ClipboardCheck size={17} />;
}

// ---------------------------------------------------------------------------
// Tab 16 — the full cycle: one company, every number, start to finish
// ---------------------------------------------------------------------------

function FullCycleTab() {
  const [inp, setInp] = useState<FullCycleInputs>(DEFAULT_FULL_CYCLE);
  const set = (k: keyof FullCycleInputs, v: number) => setInp((x) => ({ ...x, [k]: v }));
  const r = useMemo(() => runFullCycle(inp), [inp]);
  const m = (n: number) => fmtMoney(n, 0);

  return (
    <>
      <StepCard n="A" icon={<Workflow size={17} />} title="The company — every input, one place">
        <p style={hintStyle}>
          One worked company flows through every calculation below, each stage's output feeding
          the next — the full cycle, no step skipped. Change any input and watch the whole chain
          recompute. Defaults: a $100M-revenue company at a $30 share price, weighing a $50M
          project.
        </p>
        <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <Chip active={JSON.stringify(inp) === JSON.stringify(DEFAULT_FULL_CYCLE)} onClick={() => setInp(DEFAULT_FULL_CYCLE)}>
            Reset to the worked example
          </Chip>
        </div>
        <div style={wbGrid}>
          <WbField label="Revenue" hint="Example: $100,000,000."><MoneyInput value={inp.revenue} onChange={(v) => set('revenue', v)} width={110} /></WbField>
          <WbField label="EBITDA margin" hint="Example: 25% → $25M EBITDA."><PctInput value={inp.ebitdaMarginPct} onChange={(v) => set('ebitdaMarginPct', v)} max={60} /></WbField>
          <WbField label="D&A" hint="Example: $5M → EBIT $20M."><MoneyInput value={inp.da} onChange={(v) => set('da', v)} width={90} /></WbField>
          <WbField label="Tax rate" hint="Example: 25%."><PctInput value={inp.taxPct} onChange={(v) => set('taxPct', v)} max={50} /></WbField>
          <WbField label="Debt / coupon" hint="Example: $40M at 6% → $2.4M interest.">
            <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <MoneyInput value={inp.debt} onChange={(v) => set('debt', v)} width={90} />
              <PctInput value={inp.interestRatePct} onChange={(v) => set('interestRatePct', v)} max={15} />
            </div>
          </WbField>
          <WbField label="Cash" hint="Example: $10M → net debt $30M."><MoneyInput value={inp.cash} onChange={(v) => set('cash', v)} width={90} /></WbField>
          <WbField label="Book equity" hint="For invested capital. Example: $60M → IC $100M."><MoneyInput value={inp.bookEquity} onChange={(v) => set('bookEquity', v)} width={90} /></WbField>
          <WbField label="Shares / price" hint="Example: 10M shares at $30 → $300M market equity.">
            <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <MoneyInput value={inp.shares} onChange={(v) => set('shares', v)} width={90} />
              <MoneyInput value={inp.sharePrice} onChange={(v) => set('sharePrice', v)} width={60} />
            </div>
          </WbField>
          <WbField label="Beta / Rf / ERP" hint="Example: 1.1 / 4% / 5.5% → Re 10.05%.">
            <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <PctInput value={inp.beta} onChange={(v) => set('beta', v)} max={3} suffix="β" />
              <PctInput value={inp.riskFreePct} onChange={(v) => set('riskFreePct', v)} />
              <PctInput value={inp.erpPct} onChange={(v) => set('erpPct', v)} />
            </div>
          </WbField>
          <WbField label="Capex / ΔNWC" hint="Example: $6M / $1M → FCF $13M.">
            <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <MoneyInput value={inp.capex} onChange={(v) => set('capex', v)} width={80} />
              <MoneyInput value={inp.deltaNwc} onChange={(v) => set('deltaNwc', v)} width={70} />
            </div>
          </WbField>
          <WbField label="Long-run growth" hint="Your assumption for the valuation perpetuity. Example: 4%."><PctInput value={inp.growthPct} onChange={(v) => set('growthPct', v)} max={8} /></WbField>
          <WbField label="Project: cost / EBITDA / D&A" hint="The move to finance. Example: $50M cost, $10M EBITDA, $2M D&A → NOPAT $6M.">
            <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <MoneyInput value={inp.projectCost} onChange={(v) => set('projectCost', v)} width={80} />
              <MoneyInput value={inp.projectEbitda} onChange={(v) => set('projectEbitda', v)} width={80} />
              <MoneyInput value={inp.projectDa} onChange={(v) => set('projectDa', v)} width={70} />
            </div>
          </WbField>
          <WbField label="New-bond coupon" hint="If debt-funded. Example: 6.5%."><PctInput value={inp.newDebtRatePct} onChange={(v) => set('newDebtRatePct', v)} max={15} /></WbField>
        </div>
      </StepCard>

      <StepCard n="B" icon={<Calculator size={17} />} title="Stage 1 — the operating engine">
        <Eq>{`EBITDA = revenue × margin = ${m(inp.revenue)} × ${inp.ebitdaMarginPct}% = ${m(r.s1.ebitda)}
EBIT = EBITDA − D&A = ${m(r.s1.ebitda)} − ${m(inp.da)} = ${m(r.s1.ebit)}
NOPAT = EBIT × (1 − ${inp.taxPct}%) = ${m(r.s1.nopat)}   ← the debt-free operating profit
interest = ${m(inp.debt)} × ${inp.interestRatePct}% = ${m(r.s1.interest)}
net income = (EBIT − interest) × (1 − tax) = ${m(r.s1.netIncome)}
EPS = net income ÷ ${m(inp.shares)} shares = $${r.s1.eps}`}</Eq>
        <p style={decisionLine}>
          <strong>What feeds forward:</strong> NOPAT (the whole-business profit, before financing)
          goes to ROIC and FCF; net income and EPS (the shareholders' slice, after interest) go to
          the financing decision. Keeping those two straight is half of corporate finance.
        </p>
      </StepCard>

      <StepCard n="C" icon={<TrendingUp size={17} />} title="Stage 2 — ROIC and the project's ROI">
        <Eq>{`invested capital = debt + book equity = ${m(inp.debt)} + ${m(inp.bookEquity)} = ${m(r.s2.investedCapital)}
ROIC = NOPAT ÷ invested capital = ${m(r.s1.nopat)} ÷ ${m(r.s2.investedCapital)} = ${r.s2.roicPct}%
project NOPAT = (EBITDA − D&A) × (1 − tax) = ${m(r.s2.projectNopat)}
project ROI(C) = ${m(r.s2.projectNopat)} ÷ ${m(inp.projectCost)} = ${r.s2.projectRoicPct}%`}</Eq>
        <p style={decisionLine}>
          <strong>What feeds forward:</strong> ROIC is what the capital already inside the business
          earns; the project's ROI is what the NEXT dollar would earn. Both are meaningless until
          stage 3 gives them something to beat.
        </p>
      </StepCard>

      <StepCard n="D" icon={<Percent size={17} />} title="Stage 3 — the cost of capital (WACC), market-weighted">
        <Eq>{`market equity = shares × price = ${m(inp.shares)} × $${inp.sharePrice} = ${m(r.s3.equityMarket)}
weights: equity ${r.s3.weightEquityPct}% · debt ${r.s3.weightDebtPct}%   (MARKET values, not book)
Re = Rf + β×ERP = ${inp.riskFreePct}% + ${inp.beta} × ${inp.erpPct}% = ${r.s3.rePct}%
Rd after tax = ${inp.interestRatePct}% × (1 − ${inp.taxPct}%) = ${r.s3.rdAfterTaxPct}%
WACC = ${r.s3.weightEquityPct}% × ${r.s3.rePct}% + ${r.s3.weightDebtPct}% × ${r.s3.rdAfterTaxPct}% = ${r.s3.waccPct}%`}</Eq>
        <p style={decisionLine}>
          <strong>What feeds forward:</strong> {r.s3.waccPct}% is the bar for everything — stage
          4's value test, stage 5's discount rate, and stage 6's hurdle for the project. Note the
          circularity the pros manage: the weights use the market equity value that stage 5 is
          about to question.
        </p>
      </StepCard>

      <StepCard n="E" icon={<Activity size={17} />} title="Stage 4 — the value test: ROIC vs WACC">
        <Eq>{`spread = ROIC − WACC = ${r.s2.roicPct}% − ${r.s3.waccPct}% = ${r.s4.spreadPct > 0 ? '+' : ''}${r.s4.spreadPct}pp
economic profit = spread × invested capital = ${r.s4.spreadPct}% × ${m(r.s2.investedCapital)} = ${m(r.s4.economicProfit)}/yr`}</Eq>
        <p style={decisionLine}>
          <strong>{r.s4.spreadPct > 0 ? 'Creating value' : 'Destroying value'}:</strong> every year
          this company earns {m(Math.abs(r.s4.economicProfit))} {r.s4.spreadPct > 0 ? 'more than' : 'less than'}{' '}
          its capital costs. This single line is what "value creation" means in dollars — and the
          project's {r.s2.projectRoicPct}% vs {r.s3.waccPct}% is the same test for the next dollar.
        </p>
      </StepCard>

      <StepCard n="F" icon={<BarChart3 size={17} />} title="Stage 5 — valuation: EV → EQV → per share, vs the market">
        {r.s5.valid ? (
          <>
            <Eq>{`FCF = NOPAT + D&A − capex − ΔNWC = ${m(r.s1.nopat)} + ${m(inp.da)} − ${m(inp.capex)} − ${m(inp.deltaNwc)} = ${m(r.s5.fcf)}
EV = FCF×(1+g) ÷ (WACC − g) = ${m(r.s5.fcf)}×${(1 + inp.growthPct / 100).toFixed(2)} ÷ (${r.s3.waccPct}% − ${inp.growthPct}%) = ${m(r.s5.ev)}
net debt = ${m(inp.debt)} − ${m(inp.cash)} = ${m(r.s5.netDebt)}
EQV = EV − net debt = ${m(r.s5.eqv)}
intrinsic per share = EQV ÷ ${m(inp.shares)} = $${r.s5.perShareIntrinsic}   vs market $${inp.sharePrice}
market EV = market equity + net debt = ${m(r.s5.marketEv)}
implied growth in the market price: g* = ${r.s5.impliedGrowthPct}%   (your assumption: ${inp.growthPct}%)`}</Eq>
            <p style={decisionLine}>
              <strong>What this tells you:</strong> at YOUR {inp.growthPct}% growth the shares are
              worth ${r.s5.perShareIntrinsic}; the market pays ${inp.sharePrice} — a{' '}
              {r.s5.premiumPct > 0 ? `${r.s5.premiumPct}% premium` : `${Math.abs(r.s5.premiumPct)}% discount`}, which is the market
              betting on {r.s5.impliedGrowthPct}% growth forever. The disagreement between those two
              growth numbers IS the investment debate — and it decides stage 6. (Tab 5 runs the
              full five-year version of this valuation.)
            </p>
          </>
        ) : (
          <p style={{ fontSize: 12.5, color: 'var(--neg)', fontWeight: 600 }}>Growth must be below WACC for the perpetuity — lower g or raise the discount rate.</p>
        )}
      </StepCard>

      <StepCard n="G" icon={<Handshake size={17} />} title={`Stage 6 — fund the ${m(inp.projectCost)} project: bonds vs stock`}>
        <Eq>{`project value = project FCF ÷ WACC = ${m(r.s2.projectNopat)} ÷ ${r.s3.waccPct}% = ${m(r.s6.projectValue)}
project NPV = value − cost = ${m(r.s6.projectValue)} − ${m(inp.projectCost)} = ${m(r.s6.projectNpv)}`}</Eq>
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Lens</th>
                <th className="num" style={{ textAlign: 'right' }}>{r.s6.bonds.label}</th>
                <th className="num" style={{ textAlign: 'right' }}>{r.s6.stock.label}</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>New shares issued</td><td className="num" style={{ textAlign: 'right' }}>0</td><td className="num" style={{ textAlign: 'right' }}>{m(r.s6.stock.newShares)}</td></tr>
              <tr><td>Total debt</td><td className="num" style={{ textAlign: 'right' }}>{m(r.s6.bonds.totalDebt)}</td><td className="num" style={{ textAlign: 'right' }}>{m(r.s6.stock.totalDebt)}</td></tr>
              <tr><td>Net income</td><td className="num" style={{ textAlign: 'right' }}>{m(r.s6.bonds.netIncome)}</td><td className="num" style={{ textAlign: 'right' }}>{m(r.s6.stock.netIncome)}</td></tr>
              <tr>
                <td style={{ fontWeight: 700 }}>EPS (was ${r.s1.eps})</td>
                <td className="num" style={{ textAlign: 'right', fontWeight: 700, color: toneFor(r.s6.bonds.epsChangePct) }}>${r.s6.bonds.eps} ({r.s6.bonds.epsChangePct > 0 ? '+' : ''}{r.s6.bonds.epsChangePct}%)</td>
                <td className="num" style={{ textAlign: 'right', fontWeight: 700, color: toneFor(r.s6.stock.epsChangePct) }}>${r.s6.stock.eps} ({r.s6.stock.epsChangePct > 0 ? '+' : ''}{r.s6.stock.epsChangePct}%)</td>
              </tr>
              <tr><td>Debt / EBITDA</td><td className="num" style={{ textAlign: 'right' }}>{r.s6.bonds.debtToEbitda}×</td><td className="num" style={{ textAlign: 'right' }}>{r.s6.stock.debtToEbitda}×</td></tr>
              <tr><td>EBIT interest coverage</td><td className="num" style={{ textAlign: 'right' }}>{r.s6.bonds.coverage}×</td><td className="num" style={{ textAlign: 'right' }}>{r.s6.stock.coverage}×</td></tr>
              <tr><td>Pro-forma WACC</td><td className="num" style={{ textAlign: 'right' }}>{r.s6.bonds.waccPct}%</td><td className="num" style={{ textAlign: 'right' }}>{r.s6.stock.waccPct}%</td></tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Intrinsic value / share (was ${r.s5.perShareIntrinsic})</td>
                <td className="num" style={{ textAlign: 'right', fontWeight: 700 }}>${r.s6.bonds.perShareIntrinsic}</td>
                <td className="num" style={{ textAlign: 'right', fontWeight: 700 }}>${r.s6.stock.perShareIntrinsic}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 8 }}>
          <div><strong style={{ color: 'var(--text-primary)' }}>Bonds:</strong> {r.s6.bonds.read}</div>
          <div style={{ marginTop: 4 }}><strong style={{ color: 'var(--text-primary)' }}>Stock:</strong> {r.s6.stock.read}</div>
        </div>
        <div className="col" style={{ gap: 4, marginTop: 10 }}>
          {r.s6.verdict.map((v) => (
            <p key={v.slice(0, 30)} style={{ ...decisionLine, marginTop: 0 }}>{v}</p>
          ))}
        </div>
      </StepCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tabs 17 & 18 — the observation store, and the regime backtest
// ---------------------------------------------------------------------------

function DataSourcesTab() {
  const gdpVintages = observationsFor('GDP_Q_ANN').filter((o) => o.observationDate === '2026-Q1');
  return (
    <>
      <StepCard n="A" icon={<Database size={17} />} title={`The data layer — modes and providers (as of ${STORE_AS_OF})`}>
        <p style={hintStyle}>
          The master spec's deterministic data layer, implemented as this app's local cache: every
          number a tab shows traces back to a cataloged series with full lineage, and the provider
          interfaces exist but are OFF — no API is called, no paid service is ever contacted.
        </p>
        <div className="row gap-3" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
          {Object.entries(DATA_MODES).map(([k, v]) => (
            <StatPill key={k} label={k} value={v} strong={v === 'ON'} />
          ))}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Provider</th>
                <th style={{ textAlign: 'left' }}>Domain</th>
                <th style={{ textAlign: 'left' }}>Serves</th>
                <th style={{ textAlign: 'left' }}>Tier</th>
                <th style={{ textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {PROVIDER_REGISTRY.map((pr) => (
                <tr key={pr.name}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{pr.name}</td>
                  <td className="num" style={{ fontSize: 11.5, textAlign: 'left' }}>{pr.domain}</td>
                  <td style={{ fontSize: 11.5 }}>{pr.serves}</td>
                  <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{TIER_LABELS[pr.tier].split(' — ')[0]}</td>
                  <td>
                    <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: pr.status === 'local-cache' ? 'var(--pos)' : 'var(--severity-medium)', border: `1px solid ${pr.status === 'local-cache' ? 'var(--pos)' : 'var(--severity-medium)'}`, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                      {pr.status === 'local-cache' ? 'active · local' : 'registered · off'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StepCard>

      <StepCard n="B" icon={<ClipboardCheck size={17} />} title="The series catalog — every number, with its lineage and freshness">
        <p style={hintStyle}>
          Each row is one series the Lab uses: original source (never just the aggregator),
          observation vs release vs retrieval dates, units, tier, and a COMPUTED staleness read
          against each series' refresh budget. Derived series name their parents — nothing here
          was eyeballed.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Series</th>
                <th className="num" style={{ textAlign: 'right' }}>Latest</th>
                <th style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>Obs / released / retrieved</th>
                <th style={{ textAlign: 'left' }}>Source (tier)</th>
                <th style={{ textAlign: 'left' }}>Freshness</th>
              </tr>
            </thead>
            <tbody>
              {SERIES_CATALOG.map((m) => {
                const latest = latestObservation(m.seriesId);
                const st = staleness(m);
                return (
                  <tr key={m.seriesId}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.name}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                        {m.seriesId} · {m.unit} · {m.seasonalAdjustment}
                        {m.derivedFrom ? ` · DERIVED: ${m.derivedFrom}` : ''}
                      </div>
                    </td>
                    <td className="num" style={{ textAlign: 'right', fontWeight: 700 }}>
                      {latest ? latest.value : '—'}
                      {latest?.revisionStatus !== 'final' && latest ? (
                        <span style={{ fontSize: 9.5, color: 'var(--severity-medium)', display: 'block' }}>{latest.revisionStatus}</span>
                      ) : null}
                    </td>
                    <td className="num" style={{ fontSize: 10.5, textAlign: 'left', whiteSpace: 'nowrap' }}>
                      {latest ? `${latest.observationDate} / ${latest.releaseDate} / ${latest.retrievedAt}` : '—'}
                    </td>
                    <td style={{ fontSize: 11 }}>
                      {m.sourceProvider}
                      <span style={{ color: 'var(--text-tertiary)' }}> (T{m.tier})</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: st.stale ? 'var(--neg)' : 'var(--pos)', border: `1px solid ${st.stale ? 'var(--neg)' : 'var(--pos)'}`, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                        {st.stale ? `STALE — ${st.daysOld}d old` : `fresh (${st.daysOld}d / ${st.budgetDays}d)`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={decisionLine}>
          <strong>What this tells you:</strong> a number without lineage is a rumor with decimals.
          Every dashboard in the Lab can answer "says who, observed when, retrieved when, how
          fresh" — and when the answer is "stale," it says so instead of posing as current.
        </p>
      </StepCard>

      <StepCard n="C" icon={<RefreshCcw size={17} />} title="The vintage discipline — revisions never overwrite history">
        <p style={hintStyle}>
          Q1-2026 GDP, demonstrated: the advance estimate and the (illustrative) second estimate
          live as SEPARATE rows. The original is never deleted — because backtests, and the
          decisions made on the old number, happened against the old number.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="fin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Observation</th>
                <th className="num" style={{ textAlign: 'right' }}>Value</th>
                <th style={{ textAlign: 'left' }}>Released</th>
                <th style={{ textAlign: 'left' }}>Status</th>
                <th style={{ textAlign: 'left' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {gdpVintages.map((o) => (
                <tr key={o.releaseDate}>
                  <td style={{ fontWeight: 600 }}>{o.observationDate} real GDP</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 700 }}>{o.value}%</td>
                  <td className="num" style={{ textAlign: 'left', fontSize: 11.5 }}>{o.releaseDate}</td>
                  <td style={{ fontSize: 11, textTransform: 'uppercase', color: o.revisionStatus === 'revised' ? 'var(--severity-medium)' : 'var(--text-secondary)' }}>{o.revisionStatus}</td>
                  <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{o.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65, marginTop: 12 }}>
          {TIMING_RULES.map((t) => (
            <div key={t.slice(0, 30)} style={{ marginBottom: 4 }}>• {t}</div>
          ))}
        </div>
      </StepCard>
    </>
  );
}

function BacktestTab() {
  const results = useMemo(() => runBacktests(), []);
  return (
    <>
      <StepCard n="A" icon={<History size={17} />} title="The method — write it down, then test it everywhere">
        <p style={hintStyle}>
          Dalio's discipline from the talk, made executable: each rule below is written as
          explicit criteria, then RUN through five real regimes using the Lab's own models — the
          capital engine, the debt playbook, the asset sensitivities, the equilibrium reads.
          Nothing is asserted; every verdict is computed, and one famous rule fails on purpose.
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {BACKTEST_METHOD.map((m2) => (
            <li key={m2.slice(0, 30)}>{m2}</li>
          ))}
        </ul>
      </StepCard>

      <StepCard n="B" icon={<Compass size={17} />} title="The five regimes">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
          {REGIMES.map((reg) => (
            <GlassCard key={reg.id} variant="nested" padding={12}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{reg.year} — {reg.name}</div>
              <div className="num" style={{ fontSize: 11, color: 'var(--accent)', textAlign: 'left', margin: '4px 0' }}>
                dials [g {reg.factors.growth} · i {reg.factors.inflation} · Fed {reg.factors.policy} · fiscal {reg.factors.fiscal}] · funds {reg.fedFundsPct}% · 10Y {reg.tenYearPct}%
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reg.whatHappened}</div>
            </GlassCard>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '8px 0 0' }}>
          Dial settings and rate anchors are approximate teaching values for well-documented episodes.
        </p>
      </StepCard>

      {results.map((rule, idx) => (
        <StepCard
          key={rule.id}
          n={String.fromCharCode(67 + idx)}
          icon={rule.timeless ? <ClipboardCheck size={17} /> : <RefreshCcw size={17} />}
          title={`Rule ${idx + 1}: ${rule.name} — ${rule.timeless ? 'TIMELESS (survives all five)' : 'NOT timeless'}`}
        >
          <Eq>{rule.criteria}</Eq>
          <div style={{ overflowX: 'auto' }}>
            <table className="fin-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Regime</th>
                  <th style={{ textAlign: 'left' }}>Fired?</th>
                  <th style={{ textAlign: 'left' }}>Verdict</th>
                  <th style={{ textAlign: 'left' }}>What the models computed</th>
                </tr>
              </thead>
              <tbody>
                {rule.verdicts.map((v) => (
                  <tr key={v.regimeId}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{v.year}</td>
                    <td style={{ fontSize: 11.5 }}>{v.fired ? 'fired' : 'silent'}</td>
                    <td>
                      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: v.correct ? 'var(--pos)' : 'var(--neg)', border: `1px solid ${v.correct ? 'var(--pos)' : 'var(--neg)'}`, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                        {v.correct ? 'correct' : 'FAILED'}
                      </span>
                    </td>
                    <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{v.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={decisionLine}>
            <strong>The lesson:</strong> {rule.lesson}
          </p>
        </StepCard>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Right-pane guide — switches with the active tab.
// ---------------------------------------------------------------------------

function RefLine({ r }: { r: ReportRef }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginTop: 8 }}>
      Reference: {refText(r)}
    </div>
  );
}

function ReportTab() {
  const [scenarioId, setScenarioId] = useState<string>(TODAY_SCENARIO_ID);
  const [showCountry, setShowCountry] = useState(true);
  const [showState, setShowState] = useState(true);
  const [showIndustry, setShowIndustry] = useState(true);
  const [countryId, setCountryId] = useState('us');
  const [stateId, setStateId] = useState('ca');
  const [industryId, setIndustryId] = useState('tech');

  const factors: MacroFactors =
    scenarioId === TODAY_SCENARIO_ID
      ? MARKET_SNAPSHOT.factors
      : (SCENARIOS.find((x) => x.id === scenarioId)?.factors ?? MARKET_SNAPSHOT.factors);

  const country = useMemo(() => countryReport(countryId), [countryId]);
  const state = useMemo(() => stateReport(stateId), [stateId]);
  const industry = useMemo(
    () => industryReport(industryId, DEFAULT_WACC_INPUTS.riskFree, factors),
    [industryId, factors],
  );

  const secTitle: React.CSSProperties = {
    fontSize: 11.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--text-tertiary)',
    margin: '14px 0 8px',
  };
  const bodyText: React.CSSProperties = { fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 };
  const noteText: React.CSSProperties = { fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.55 };

  let step = 0;
  const letter = () => String.fromCharCode(68 + step++); // D, E, F… after the fixed A–C

  return (
    <>
      <StepCard n="A" icon={<Cog size={17} />} title="Build the report — pick your lenses">
        <p style={hintStyle}>
          Toggle each lens on or off and pick its subject. Any combination works — country
          alone, "California by industry," or all three. Every section below is pulled live
          from the same models the source tabs use, and carries its tab · step reference.
        </p>
        <div className="col" style={{ gap: 10 }}>
          <GlassCard variant="nested" padding={12}>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip active={showCountry} onClick={() => setShowCountry(!showCountry)}>
                Country lens: {showCountry ? 'ON' : 'off'}
              </Chip>
              {showCountry &&
                REPORT_COUNTRIES.map((c) => (
                  <Chip key={c.id} active={countryId === c.id} onClick={() => setCountryId(c.id)}>
                    {c.name}
                  </Chip>
                ))}
            </div>
          </GlassCard>
          <GlassCard variant="nested" padding={12}>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip active={showState} onClick={() => setShowState(!showState)}>
                State lens: {showState ? 'ON' : 'off'}
              </Chip>
              {showState &&
                REPORT_STATES.map((c) => (
                  <Chip key={c.id} active={stateId === c.id} onClick={() => setStateId(c.id)}>
                    {c.name}
                  </Chip>
                ))}
            </div>
          </GlassCard>
          <GlassCard variant="nested" padding={12}>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip active={showIndustry} onClick={() => setShowIndustry(!showIndustry)}>
                Industry lens: {showIndustry ? 'ON' : 'off'}
              </Chip>
              {showIndustry &&
                REPORT_INDUSTRIES.map((c) => (
                  <Chip key={c.id} active={industryId === c.id} onClick={() => setIndustryId(c.id)}>
                    {c.name}
                  </Chip>
                ))}
            </div>
          </GlassCard>
          <GlassCard variant="nested" padding={12}>
            <div style={{ ...noteText, marginBottom: 8 }}>
              Scenario for the dial-driven sections (industry backdrop, capital stance,
              sub-lenses). Country and state facts are snapshot data and do not move.
            </div>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <Chip active={scenarioId === TODAY_SCENARIO_ID} onClick={() => setScenarioId(TODAY_SCENARIO_ID)}>
                Today ({MARKET_SNAPSHOT.asOf})
              </Chip>
              {SCENARIOS.map((x) => (
                <Chip key={x.id} active={scenarioId === x.id} onClick={() => setScenarioId(x.id)}>
                  {x.name}
                </Chip>
              ))}
            </div>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <StatPill label="Growth dial" value={`${factors.growth >= 0 ? '+' : ''}${factors.growth}`} />
              <StatPill label="Inflation dial" value={`${factors.inflation >= 0 ? '+' : ''}${factors.inflation}`} />
              <StatPill label="Fed dial" value={`${factors.policy >= 0 ? '+' : ''}${factors.policy}`} />
              <StatPill label="Fiscal dial" value={`${factors.fiscal >= 0 ? '+' : ''}${factors.fiscal}`} />
            </div>
          </GlassCard>
        </div>
      </StepCard>

      <StepCard n="B" icon={<GraduationCap size={17} />} title="How to read this report">
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {REPORT_HOW_TO_READ.map((h) => (
            <li key={h.slice(0, 40)}>{h}</li>
          ))}
        </ol>
      </StepCard>

      <StepCard n="C" icon={<Calculator size={17} />} title="The formulas behind every number here">
        <div className="col" style={{ gap: 8 }}>
          {REPORT_FORMULAS.map((f) => (
            <GlassCard key={f.name} variant="nested" padding={12}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{f.name}</div>
              <Eq>{f.formula}</Eq>
              <div style={noteText}>{f.how}</div>
              <RefLine r={f.ref} />
            </GlassCard>
          ))}
        </div>
      </StepCard>

      {showCountry && (
        <StepCard n={letter()} icon={<Globe size={17} />} title={`Country report — ${country.name}`}>
          {country.debt ? (
            <>
              <div style={secTitle}>Debt-to-GDP, 2000 → 2025</div>
              <XYLineChart
                data={DEBT_TREND_YEARS.map((y, i) => ({ year: String(y), pct: country.debt!.row.trend[i] }))}
                xKey="year"
                series={[{ id: 'pct', label: 'Debt / GDP %' }]}
                height={180}
              />
              <div style={{ ...bodyText, marginTop: 6 }}>{country.debt.row.note}</div>
              <div style={{ ...noteText, marginTop: 4 }}>{country.debt.how}</div>
              <RefLine r={country.debt.ref} />
            </>
          ) : (
            <div style={noteText}>
              Not in the top-10 debt list (tab 15 tracks the ten largest economies) — the trade,
              currency, and case-study sections below carry this country's story.
            </div>
          )}

          {country.trade && (
            <>
              <div style={secTitle}>Trade balance</div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <StatPill label="Exports" value={`$${country.trade.row.exportsB}B`} />
                <StatPill label="Imports" value={`$${country.trade.row.importsB}B`} />
                <StatPill
                  label="Balance (computed)"
                  value={`${country.trade.balanceB >= 0 ? '+' : '−'}$${Math.abs(country.trade.balanceB)}B`}
                  strong
                />
              </div>
              <div style={{ ...bodyText, marginTop: 6 }}>{country.trade.row.note}</div>
              <div style={{ ...noteText, marginTop: 4 }}>{country.trade.how}</div>
              <RefLine r={country.trade.ref} />
            </>
          )}

          {country.currency && (
            <>
              <div style={secTitle}>Currency vs the dollar (2021 = 100)</div>
              <XYLineChart
                data={CURRENCY_YEARS.map((y, i) => ({ year: y, idx: country.currency!.row.index[i] }))}
                xKey="year"
                series={[{ id: 'idx', label: country.currency.row.name }]}
                height={180}
                ySuffix=""
              />
              <div style={{ ...bodyText, marginTop: 6 }}>{country.currency.row.note}</div>
              <div style={{ ...noteText, marginTop: 4 }}>{country.currency.how}</div>
              <RefLine r={country.currency.ref} />
            </>
          )}
          {country.currencyNote && (
            <>
              <div style={secTitle}>Currency</div>
              <div style={bodyText}>{country.currencyNote}</div>
            </>
          )}

          {country.populism && (
            <>
              <div style={secTitle}>Populism & the fiscal pipeline</div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                <StatPill label="Pressure" value={country.populism.row.pressure} strong />
              </div>
              <div style={bodyText}>
                <strong>Expression:</strong> {country.populism.row.expression}
              </div>
              <div style={{ ...bodyText, marginTop: 4 }}>
                <strong>Fiscal pipeline (24m):</strong> {country.populism.row.fiscalPipeline}
              </div>
              <div style={{ ...bodyText, marginTop: 4 }}>
                <strong>Economic channel:</strong> {country.populism.row.impact}
              </div>
              <div style={{ ...noteText, marginTop: 4 }}>{country.populism.how}</div>
              <RefLine r={country.populism.ref} />
            </>
          )}

          {country.impactWatch && (
            <>
              <div style={secTitle}>GDP impact watch — health / food / education (24m)</div>
              <div style={bodyText}>
                <strong>Health:</strong> {country.impactWatch.row.health}
              </div>
              <div style={{ ...bodyText, marginTop: 4 }}>
                <strong>Food & agriculture:</strong> {country.impactWatch.row.food}
              </div>
              <div style={{ ...bodyText, marginTop: 4 }}>
                <strong>Education & workforce:</strong> {country.impactWatch.row.education}
              </div>
              <div style={{ ...bodyText, marginTop: 4 }}>
                <strong>The read:</strong> {country.impactWatch.row.read}
              </div>
              <RefLine r={country.impactWatch.ref} />
            </>
          )}

          {country.calendar.events.length > 0 && (
            <>
              <div style={secTitle}>24-month calendar</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {country.calendar.events.map((e) => (
                  <li key={`${e.when}-${e.what}`}>
                    <strong>{e.when}</strong> — {e.what}. {e.why}
                  </li>
                ))}
              </ul>
              <div style={{ ...noteText, marginTop: 4 }}>{country.calendar.how}</div>
              <RefLine r={country.calendar.ref} />
            </>
          )}

          {country.caseStudy && (
            <>
              <div style={secTitle}>{country.caseStudy.title}</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {country.caseStudy.facts.map((x) => (
                  <li key={x.slice(0, 40)}>{x}</li>
                ))}
              </ul>
              <div style={{ ...bodyText, marginTop: 8 }}>
                <strong>The chain:</strong> {country.caseStudy.chain.join(' → ')}
              </div>
              <div style={{ ...bodyText, marginTop: 6 }}>{country.caseStudy.lesson}</div>
              <RefLine r={{ tab: 15, step: 'E', label: 'The South Korea case study' }} />
            </>
          )}
        </StepCard>
      )}

      {showState && (
        <StepCard n={letter()} icon={<Landmark size={17} />} title={`State report — ${state.name}`}>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <StatPill label="GSP rank (economy size)" value={`#${state.debt.row.gdpRank}`} />
            <StatPill label="Bonded debt / GSP" value={`${state.debt.row.debtGspPct}%`} strong />
            <StatPill label="Debt rank among top ten" value={`#${state.debt.rankAmongTen}`} />
          </div>
          <div style={{ ...bodyText, marginTop: 8 }}>
            <strong>The pension layer (the real balance sheet):</strong> {state.debt.row.pensionNote}
          </div>
          <div style={{ ...noteText, marginTop: 4 }}>{state.debt.how}</div>
          <RefLine r={state.debt.ref} />

          {state.impactWatch && (
            <>
              <div style={secTitle}>GSP impact watch — health / food / education (24m)</div>
              <div style={bodyText}>
                <strong>Health:</strong> {state.impactWatch.row.health}
              </div>
              <div style={{ ...bodyText, marginTop: 4 }}>
                <strong>Food & agriculture:</strong> {state.impactWatch.row.food}
              </div>
              <div style={{ ...bodyText, marginTop: 4 }}>
                <strong>Education & workforce:</strong> {state.impactWatch.row.education}
              </div>
              <div style={{ ...bodyText, marginTop: 4 }}>
                <strong>The read:</strong> {state.impactWatch.row.read}
              </div>
              <RefLine r={state.impactWatch.ref} />
            </>
          )}

          {state.calendar.events.length > 0 && (
            <>
              <div style={secTitle}>24-month calendar</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {state.calendar.events.map((e) => (
                  <li key={`${e.when}-${e.what}`}>
                    <strong>{e.when}</strong> — {e.what}. {e.why}
                  </li>
                ))}
              </ul>
              <RefLine r={state.calendar.ref} />
            </>
          )}
        </StepCard>
      )}

      {showIndustry && (
        <StepCard n={letter()} icon={<BarChart3 size={17} />} title={`Industry report — ${industry.name}`}>
          <div style={secTitle}>Backdrop under the current dials</div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <StatPill label="Backdrop" value={industry.backdrop.read.level} strong />
            <StatPill label="Modeled impact now" value={fmtSignedPct(industry.backdrop.read.now)} />
            <StatPill label="In 8 quarters" value={fmtSignedPct(industry.backdrop.read.later)} />
          </div>
          <div style={{ ...bodyText, marginTop: 6 }}>{industry.backdrop.read.note}</div>
          <div style={{ ...noteText, marginTop: 4 }}>{industry.backdrop.how}</div>
          <RefLine r={industry.backdrop.ref} />

          <div style={secTitle}>Capital stance & WACC</div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <StatPill label="Stance" value={industry.advice.result.stance} strong />
            <StatPill label="Industry WACC" value={`${industry.advice.result.wacc.wacc}%`} />
            <StatPill label="Beta" value={`${industry.profile.beta}`} />
          </div>
          <div style={{ ...bodyText, marginTop: 6 }}>{industry.advice.result.summary}</div>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            {industry.profile.assumptions.map((a) => (
              <li key={a.slice(0, 40)}>{a}</li>
            ))}
          </ul>
          <div style={{ ...noteText, marginTop: 4 }}>{industry.advice.how}</div>
          <RefLine r={industry.advice.ref} />

          <div style={secTitle}>Benchmarks — what normal looks like here</div>
          {industry.benchmarks.rows.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="fin-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Damodaran industry</th>
                    <th>Debt/EBITDA</th>
                    <th>Coverage</th>
                    <th>Margin</th>
                    <th>ROC</th>
                  </tr>
                </thead>
                <tbody>
                  {industry.benchmarks.rows.map((b) => (
                    <tr key={b.id}>
                      <td>{b.industry}</td>
                      <td>{Number.isNaN(b.debtEbitda) ? '—' : `${b.debtEbitda}×`}</td>
                      <td>{Number.isNaN(b.interestCoverage) ? '—' : `${b.interestCoverage}×`}</td>
                      <td>{b.afterTaxOperMarginPct}%</td>
                      <td>{b.rocPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={noteText}>
              No Damodaran row in tab 14's teaching set maps to this industry — use tab 14's
              vertical toolkits and the observed-not-healthy rule when you find real data.
            </div>
          )}
          <div style={{ ...noteText, marginTop: 4 }}>{industry.benchmarks.how}</div>
          <RefLine r={industry.benchmarks.ref} />

          {industry.ipo && (
            <>
              <div style={secTitle}>The equity window — sector IPO counts</div>
              <XYLineChart
                data={industry.ipo.years.map((y, i) => ({ year: y, n: industry.ipo!.row.counts[i] }))}
                xKey="year"
                series={[{ id: 'n', label: industry.ipo.row.name }]}
                height={180}
                ySuffix=""
              />
              <div style={{ ...bodyText, marginTop: 6 }}>{industry.ipo.row.note}</div>
              <div style={{ ...noteText, marginTop: 4 }}>{industry.ipo.how}</div>
              <RefLine r={industry.ipo.ref} />
            </>
          )}

          {industry.subs.reads.length > 0 && (
            <>
              <div style={secTitle}>Sub-industry lenses at this scenario</div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                {industry.subs.reads.map((sub) => (
                  <StatPill key={sub.target.id} label={sub.target.name} value={fmtSignedPct(Math.round(sub.nowPct * 10) / 10)} />
                ))}
              </div>
              <div style={{ ...noteText, marginTop: 6 }}>{industry.subs.how}</div>
              <RefLine r={industry.subs.ref} />
            </>
          )}
        </StepCard>
      )}

      {showState && showIndustry && (
        <StepCard n={letter()} icon={<Compass size={17} />} title={`The combined read — ${state.name} × ${industry.name}`}>
          <div style={bodyText}>{combinedRead(stateId, industryId, DEFAULT_WACC_INPUTS.riskFree, factors)}</div>
          <div style={{ ...noteText, marginTop: 8 }}>
            Computed from the same models as the sections above — change the industry, state, or
            scenario chips and this paragraph re-derives.
          </div>
        </StepCard>
      )}
    </>
  );
}

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
  dcf,
  dcfResult,
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
  dcf: DcfInputs;
  dcfResult: ReturnType<typeof runDcf>;
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
          {tab === 'analysis' && 'Reading the machine: real-number ranges, cross-effects, trends, and the debt cycles.'}
          {tab === 'machine' && "Dalio's economic machine: how it cycles, the three equilibriums, the two levers."}
          {tab === 'valuation' && 'The valuation workbench: DCF → terminal value → EV → equity, with comps and sensitivity.'}
          {tab === 'formulas' && 'The reference: every formula, grouped by the decision it serves, plus the full glossary.'}
          {tab === 'eygap' && 'The EY checklist, gap-checked: what the Lab covers, and the one-liners for what it deliberately leaves out.'}
          {tab === 'drill' && 'Practice mode: answer out loud first, then reveal the model answer and compare.'}
          {tab === 'rounds' && 'The interview, round by round: HireVue behaviorals, the take-home DCF, and the market anchor.'}
          {tab === 'gapwork' && 'Every former gap as a working calculator, defaulted to your prep session’s exact numbers.'}
          {tab === 'rates' && 'The bond market, level by level: the Fed’s floor, the curve, real yields, and who really sets the long rate.'}
          {tab === 'realestate' && 'Real estate financing: the 10Y+spread mortgage formula, the payment math, and the CRE lender dashboard.'}
          {tab === 'ipo' && 'The IPO decision as three separate windows — market, industry, company — plus the dilution math and the financing menu.'}
          {tab === 'benchmarks' && 'Industry benchmarks with discipline: observed averages are not healthy ranges, and every vertical has its own metric.'}
          {tab === 'debtgeo' && 'Sovereign debt-to-GDP for the ten largest economies, the US-state pension layer, and the geopolitical watch list & calendar.'}
          {tab === 'fullcycle' && 'One company traced through every formula — operating engine → ROIC → WACC → economic profit → valuation → the bonds-vs-stock decision.'}
          {tab === 'datasources' && 'The data layer: every series with lineage, freshness computed against its budget, vintages preserved, providers registered but OFF.'}
          {tab === 'backtest' && 'Dalio’s discipline, executable: four written rules run through five regimes by the Lab’s own models — one fails on purpose.'}
          {tab === 'report' && 'One filterable report — country, state, industry, or any combination — every section pulled live from its source tab, with the reference to go deeper.'}{' '}
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
            <GuideSection n="F" title="The hedging chips — how to read them">
              Set the scenario, then read each card's live verdict. Chips: <strong style={{ color: 'var(--pos)' }}>Fits</strong> —
              the environment argues for it; <strong style={{ color: 'var(--severity-medium)' }}>Situational</strong> — depends on
              your exposures; <strong style={{ color: 'var(--neg)' }}>Not the moment</strong> — the environment argues against.
            </GuideSection>
            <GuideSection n="G" title="The hedge math">
              <Eq>
                swap savings ≈ notional × Δrate{'\n'}hedged cost = quantity × locked forward price{'\n'}option cost = premium (known max loss)
              </Eq>
              <span style={guideLabel}>Example</span>
              $1M of floating-rate debt, rates rise 1%: a pay-fixed swap saves ≈ $1,000,000 × 1% ={' '}
              <strong>$10,000/yr</strong>. The same math in reverse is what you LOSE by locking right
              before cuts — direction matters.
            </GuideSection>
            <GuideSection n="H" title="The one hedging rule">
              Hedge <em>committed exposures</em> — inventory you must buy, debt you already owe,
              invoices already signed — to buy <strong>certainty</strong>. A hedge with nothing
              behind it is just a market bet with extra paperwork. And keep Dalio's frame: you don't
              need to predict the environment if the position is built to survive every one.
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
              motion. Compare up to four at once (industries, asset classes, or the sub-industry
              lens — AI &amp; semis, crypto, agriculture, housing, travel, defense, biotech,
              e-commerce, autos, oil &amp; gas), and use the industry views as a customer-type screen: a line sliding below zero is a customer
              segment whose credit you should be re-reading on tab 2.
            </GuideSection>
            <GuideSection n="E" title="CPI vs PCE — how to read an inflation print">
              {CPI_PCE_FACTS.slice(0, 4).join(' ')} The reading order when a hot number drops:
              energy first (instant, noisy), food next, then check whether core services confirm
              the trend — and remember shelter is telling you about LAST year's leases, not
              today's. That's why the Fed says "core PCE" when everyone else says "CPI." The current-state
              panel is anchored to the official BLS print (same one-small-file snapshot pattern as
              "today's market," refreshed by hand until the automation lands) — and PCE is derived
              from the same components, so you can watch the model's claim about the CPI–PCE gap
              hold against real numbers.
            </GuideSection>
            <GuideSection n="F" title="Asset classes by industry">
              The bold line is the industry you picked; the rest are asset classes under the same
              scenario. The alignment score below the chart is the cosine of their macro-sensitivity
              vectors: <strong style={{ color: 'var(--neg)' }}>moves with you</strong> means the
              asset catches the same shocks as your business (holding it doubles your bet),{' '}
              <strong style={{ color: 'var(--pos)' }}>diversifies you</strong> means it tends to pay
              when your industry is hurting. Use it to build the treasury sleeve that offsets the
              risk your operations already carry — and to spot false hedges (long bonds do NOT
              protect a long-duration business from a rate shock).
            </GuideSection>
            <GuideSection n="G" title="Short-term vs. long-term debt (yours)">
              Rule of thumb: <strong>floating debt reprices in days; fixed debt reprices at
              refinancing.</strong> So a hiking cycle punishes floating and protects fixed
              (inflation even erodes fixed debt in real terms), while a cutting cycle rewards
              floating and strands old high-coupon fixed. The pay-fixed swap in tab 1's hedging playbook (step D) is the tool that
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
            <GuideSection n="E" title="Reading the live cycle chart">
              Year 0 is today. The <strong>growth</strong> dial sets where the short wave starts
              (above or below trend); the <strong>Fed</strong> dial sets which side of the wave
              you're on — tightening means past the peak and rolling over, easing means climbing
              out — and positions the long swell (easy money = leveraging up, hard tightening =
              near the top). Productivity stays a straight line on purpose: no dial moves it,
              because no lever can. Click through the presets and watch the path from "now" flip.
            </GuideSection>
            <GuideSection n="F" title="The template: 4 forces · 3 equilibriums · 2 levers">
              Learn it the way the talk numbers it: FOUR big forces (productivity, the short-term
              debt cycle, the long-term debt cycle, politics), THREE equilibriums the machine pulls
              toward, TWO levers that steer it. Each force card gives the definition, the hit on
              all three equilibriums, two hypotheticals, and a real episode — the hypothetical is
              the mechanism, the history is the proof. Section G adds the talk's second half: the
              eight investment principles, each mapped to the tab where you practice it.
            </GuideSection>
            <GuideSection n="G" title="The capital recommendation — what it needs">
              The advice runs on three inputs: (1) the <strong>scenario dials</strong> above, (2)
              your <strong>industry</strong> — which supplies beta, a borrowing-spread tier, and
              macro sensitivities from the master list (expand "assumptions" on the card to see
              exactly what's assumed), and (3) the <strong>risk-free rate and capital</strong> from
              tab 1. Offense = tailwind and a move clears its hurdle; defense = headwind or nothing
              clears; balanced = in between. It's the sector's answer, not yours — replace beta and
              spread with your own numbers (or pro forma) on tab 1 to personalize it.
            </GuideSection>
            <GuideSection n="H" title="Why this matters for tabs 1–3">
              The equilibriums price everything upstream: equilibrium 3 sets your WACC inputs (tab
              1), equilibrium 1 decides how easily your customer refinances (tab 2), and the levers
              drive every hedge verdict (tab 1's playbook) and trend (tab 3). Dalio's frame: you don't need to
              predict the machine — you need to know where it is and build positions that survive
              every phase.
            </GuideSection>
          </>
        )}

        {tab === 'valuation' && (
          <>
            <GuideSection n="A" title='"Walk me through a DCF" — the script'>
              <Eq>1. project FCF 5 yrs: NOPAT + D&A − capex − ΔNWC{'\n'}2. TV = FCF₅(1+g) ÷ (WACC − g){'\n'}3. discount both at WACC → enterprise value{'\n'}4. EV − net debt = equity value</Eq>
              Say it in that order, then name the two judgment calls: the forecast drivers and the
              discount rate. Everything else is arithmetic — which is exactly what this tab lets
              you practice by feel.
            </GuideSection>
            <GuideSection n="A2" title="The worked example, end to end — live">
              {dcfResult.valid ? (
                <>
                  These are YOUR current field values run through the whole chain — change any
                  field and this paragraph recomputes:
                  <Eq>
                    revenue {fmtMoney(dcf.revenue, 0)} grows {dcf.growthPct}%/yr{'\n'}
                    yr-1: EBITDA {fmtMoney(dcfResult.years[0].ebitda, 0)} → FCF {fmtMoney(dcfResult.years[0].fcf, 0)}{'\n'}
                    yr-5: FCF {fmtMoney(dcfResult.years[4].fcf, 0)}{'\n'}
                    PV of 5 yrs = {fmtMoney(dcfResult.pvForecast, 0)}{'\n'}
                    TV = FCF₅×{(1 + dcf.terminalGrowthPct / 100).toFixed(3)} ÷ ({dcf.waccPct}% − {dcf.terminalGrowthPct}%){'\n'}
                    PV of TV = {fmtMoney(dcfResult.pvTerminal, 0)} ({dcfResult.tvSharePct}% of value){'\n'}
                    EV = {fmtMoney(dcfResult.ev, 0)}{'\n'}
                    − net debt {fmtMoney(dcf.netDebt, 0)} = equity {fmtMoney(dcfResult.equity, 0)}
                  </Eq>
                  Cross-check: {dcf.peerMultiple}× peer multiple says {fmtMoney(dcfResult.evExit, 0)};
                  the DCF implies {dcfResult.impliedForwardMultiple}× forward EV/EBITDA. Practice
                  loop: predict which of these numbers moves before you change a field — that's how
                  the fields become intuition.
                </>
              ) : (
                <>Set WACC above terminal growth and the full worked example appears here, computed
                from your fields.</>
              )}
            </GuideSection>
            <GuideSection n="B" title="Enterprise vs. equity value">
              EV is the price of the whole operating business, whoever financed it; equity value is
              the shareholders' slice after the lenders. Bridge: <em>equity + debt − cash = EV</em>.
              That's also why EV pairs with EBITDA (pre-interest, whole-business profit) while P/E
              pairs with net income (post-interest, shareholders' profit) — never cross them.
            </GuideSection>
            <GuideSection n="C" title="Why EV/EBITDA">
              It's capital-structure neutral (EBITDA is before interest) and ignores D&A policy
              differences — so two identically-run businesses with different debt loads and
              depreciation schedules still compare cleanly. Its blind spot: EBITDA isn't cash flow —
              it ignores capex and working capital, which is why the DCF exists.
            </GuideSection>
            <GuideSection n="D" title="Terminal value honesty">
              The TV routinely carries 60–80% of a DCF's value — meaning most of the number rests
              on two small assumptions (WACC, g). That's not a flaw to hide; it's why you present
              the sensitivity grid, keep g at or below long-run GDP growth (~2–3%), and cross-check
              against the exit multiple.
            </GuideSection>
            <GuideSection n="E" title="Working capital's role">
              Growth consumes cash before it returns it: every new dollar of revenue drags ΔNWC out
              of free cash flow (receivables and inventory build first). It's the same lesson as
              tab 2's cash conversion cycle, seen from inside the company — fast-growing firms can
              be simultaneously profitable and cash-starved.
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

        {tab === 'eygap' && (
          <>
            <GuideSection n="A" title="How to use the gap check">
              Green items: practice them in the named tab until you can narrate without looking.
              Amber and red items: memorize the "Know" line — being able to NAME what you haven't
              built (PPA, impairment, the cost approach) reads as maturity, not weakness. "I built
              the covered column into a working tool" is itself an interview answer.
            </GuideSection>
            <GuideSection n="B" title="The honest framing">
              This Lab is a teaching model and says so. If asked about its limits, volunteer them:
              linear sensitivities, illustrative bands, one peer multiple. Knowing a model's limits
              is the skill EY literally sells as "model review."
            </GuideSection>
            <GuideSection n="C" title="Reading the standard-analyses list (step D)">
              The badges are evidence tiers, not importance: "core" items appear in nearly every
              EY source, "named" items in specific postings or service pages, "peripheral" is
              honest about what EY does less of (LBOs — EY isn't an underwriter). Interview move:
              when asked what the work is, answer with the core tier IN ORDER — DCF, comps,
              precedents, then say "and I understand PPAs are where first-years spend half their
              time, so I built one" and open tab 10.
            </GuideSection>
            <GuideSection n="D" title="The routine is an interview answer (step E)">
              "How do you stay current?" now has a sourced answer: daily curve, monthly CPI/PCE and
              EY's M&amp;A activity insights, quarterly IPO Trends / CEO Outlook / Valuation Market
              Essentials, EY-Parthenon's twice-yearly global outlook, Damodaran every January —
              and name the posting language itself: "staying abreast of current business and
              economic developments" is a listed responsibility. Tab 17 shows you already treat
              data freshness as a discipline.
            </GuideSection>
          </>
        )}

        {tab === 'drill' && (
          <>
            <GuideSection n="A" title="How to drill">
              Cover the answer. Say yours out loud — actually out loud, timed to ~90 seconds. Then
              reveal and diff: what did the model answer include that you skipped? Re-drill only
              the misses. Two passes a day beats ten silent read-throughs.
            </GuideSection>
            <GuideSection n="B" title="Behavioral scaffolds are not scripts">
              The behavioral cards give structure and what interviewers listen for — the stories
              must be yours. Write your 4–5 STAR stories once, map each staple question to one of
              them, and rehearse the mapping, not the wording.
            </GuideSection>
            <GuideSection n="C" title="Tie answers back to the Lab">
              Every technical card names where to practice it live. In the interview, "I built
              this into a working model — here's what surprised me" turns a memorized answer into
              evidence.
            </GuideSection>
          </>
        )}

        {tab === 'gapwork' && (
          <>
            <GuideSection n="A" title="What this tab is">
              Everything tab 7's gap check used to mark "know the one-liner" is now a working
              calculator — and the defaults are the exact worked numbers from your prep session:
              the 100 → 40/50/50 IRR (~18.8%), the 1.4 → 1.06 → 1.26 beta chain, the 13.7% project
              cost of equity with country risk, 30% × $300M rNPV, the 15-vs-9 ROIC spread, and the
              $800M deal for the PPA. Verify each by hand once, then change one field and predict
              the result before it updates.
            </GuideSection>
            <GuideSection n="B" title="The chain every answer should walk">
              <Eq>market change → business driver → financial statements{'\n'}→ cash flow → valuation / capital → scenarios → decision</Eq>
              Your session's core frame, and EY's: never stop at "rates are high." Rates → cost of
              debt → interest and refinancing → FCF → WACC → valuation → capital allocation →{' '}
              <em>what should management do?</em> Each calculator here is one link of that chain in
              isolation; tabs 1–5 are the chain assembled.
            </GuideSection>
            <GuideSection n="C" title="Judgment beats formulas">
              What separates the answers your session called Manager-level: don't double-count risk
              (cash flows OR discount rate), don't crown the highest IRR (dollars beat
              percentages), don't blindly apply corporate WACC to a risky project, don't confuse
              EPS accretion with value creation, and don't quote a peer multiple without saying why
              the subject deserves a premium or discount.
            </GuideSection>
          </>
        )}

        {tab === 'rounds' && (
          <>
            <GuideSection n="A" title="Round 1 strategy">
              HireVue is a rehearsal test, not a thinking test: camera at eye level, 90-second
              answers, end on the result. Record yourself once — everyone's first take runs long.
            </GuideSection>
            <GuideSection n="B" title="Round 2 strategy">
              The take-home is graded on structure, labeled assumptions, and the sensitivity range
              more than the point answer. The defense is graded on ownership: know which three
              assumptions matter, and what evidence would change your mind.
            </GuideSection>
            <GuideSection n="C" title="The market answer">
              Numbers first (3.4% → 2.9% → 3.2%), mechanism second (tariff-driven divergence,
              supply shocks), implication third (AI as the upside; why sensitivity analysis earns
              its keep). Load the supply-shock preset and practice the chain across tabs 1, 4, 5,
              and 6 until it's one continuous story.
            </GuideSection>
          </>
        )}

        {tab === 'rates' && (
          <>
            <GuideSection n="A" title="The one-sentence version">
              The Fed sets a FLOOR under overnight money by being the best counterparty (IORB);
              everything longer is priced by a market — and your life is priced off the long end.
              The old shortcut ("Fed cuts ⇒ everything gets cheaper") broke in September 2024, and
              this tab shows exactly where.
            </GuideSection>
            <GuideSection n="B" title="How to read the curve">
              <Eq>2s10s = 10Y − 2Y{'\n'}3m10y = 10Y − 3M{'\n'}5s30s = 30Y − 5Y{'\n'}breakeven ≈ nominal − real (TIPS)</Eq>
              All computed deterministically from the official H.15 observations — the tool never
              eyeballs a graph. Positive slopes = normal; the front of the curve is the Fed, the
              back is supply, inflation doubt, and term premium.
            </GuideSection>
            <GuideSection n="C" title="Which maturity is YOUR benchmark">
              Savings/money market → overnight (level A). Corporate cash → bills (B). Mortgages and
              DCF discount rates → the 10Y (C). Fixed CRE → the Treasury tenor matching the loan
              (5/7/10Y). Floating anything → SOFR. The 30Y is the government's problem, not your
              mortgage's — tab 12 explains why.
            </GuideSection>
            <GuideSection n="D" title="Data & freshness">
              Latest official observations as of {RATES_SNAPSHOT.asOf} (curve observed{' '}
              {RATES_SNAPSHOT.observationDate}): Treasury is the underlying authority for the par
              curve; the Fed's H.15 is the historical panel; Freddie Mac PMMS is weekly. Same
              one-file snapshot pattern as the market and inflation snapshots — observation date,
              release date, and retrieval date are different things, and the panel says which is
              which. Refreshed by hand until the automation lands.
            </GuideSection>
          </>
        )}

        {tab === 'realestate' && (
          <>
            <GuideSection n="A" title="The architectural decision">
              A 30-year mortgage is NOT benchmarked to the 30Y Treasury just because it lasts 30
              years: prepayment/refinancing shortens its effective life, so it prices off the{' '}
              <strong>10Y + mortgage/MBS spread</strong>. CRE splits by structure: floating = SOFR
              + lender spread; fixed = the 5/7/10Y Treasury matched to the loan term + a
              property/borrower spread. Never pick a benchmark without saying why.
            </GuideSection>
            <GuideSection n="B" title="The formulas">
              <Eq>payment = P·r(1+r)ⁿ ÷ ((1+r)ⁿ − 1){'\n'}cap rate = NOI ÷ value · DSCR = NOI ÷ debt service{'\n'}LTV = loan ÷ value · debt yield = NOI ÷ loan</Eq>
              All deterministic, all live. The stress test (+100/200/300bp) is mandatory because
              the question is never "what is DSCR today" — it is "how much repricing can this
              property survive."
            </GuideSection>
            <GuideSection n="C" title="Reading the spread">
              The 196bp mortgage−10Y spread is a SIMPLE observed difference (weekly PMMS vs
              same-day 10Y CMT) — a useful dashboard measure, not an MBS option-adjusted spread.
              Wide spreads can compress even when the 10Y doesn't move: that is refinancing relief
              nobody announces.
            </GuideSection>
            <GuideSection n="D" title="The decision chain">
              <Eq>10Y (or SOFR) moves → your rate moves → payment/DSCR moves → the decision moves</Eq>
              Residential: refi when the 10Y falls and HOLDS, or the spread compresses. CRE:
              negative leverage (cap rate below loan rate) means the deal needs NOI growth to work;
              a DSCR that breaches ~1.25× under +200bp means fix the rate, pay down, or renegotiate
              BEFORE the reset — tab 1's hedging playbook has the tools.
            </GuideSection>
          </>
        )}

        {tab === 'ipo' && (
          <>
            <GuideSection n="A0" title="Reading the sector trend chart">
              Three shapes to memorize: the SHARED trough (2022 — sectors collapsed together,
              because the discount rate is shared; biotech alone slid on to a 2025 trough), the DIVERGENT reopening (AI's
              half-year beats its every full year while biotech keeps falling — windows are
              sector-specific), and the SUBSTITUTION effect (biotech IPOs −47% with private
              financing +11% — a closed public window reroutes capital, it doesn't stop it).
              Approximate teaching values anchored to the cited prints; H1 2026 is a half year.
            </GuideSection>
            <GuideSection n="A" title="Why three scores">
              Because the failure modes are different: IPO-ing into a closed sector window prices
              you off broken comps; IPO-ing unready turns the first missed quarter into a
              multi-year discount; and skipping an open window because your sector is quiet may
              still be right if private capital is flowing (biotech 2025: IPOs −47%, financing
              +11% to $68.5B). One blended score hides exactly the distinction that matters.
            </GuideSection>
            <GuideSection n="B" title="The dilution mechanics">
              <Eq>post-money = pre-money + primary raised{'\n'}new ownership = primary ÷ post-money</Eq>
              Primary = new money into the company (dilutes). Secondary = existing holders selling
              (cash to them, zero dilution). The greenshoe adds up to ~15% more primary if
              exercised. And §82's flag: issuing equity below intrinsic value transfers value from
              existing holders — say it out loud before signing it.
            </GuideSection>
            <GuideSection n="C" title="EY relevance">
              This tab is the capital-markets half of the EY conversation: readiness (§78) is
              literally EY's IPO-advisory checklist, and the H1-2026 numbers (62 vs 34 deals,
              12 mega-deals, AI-driven, selective buyers) are EY's own published trend data — the
              market-awareness answer with sources attached.
            </GuideSection>
          </>
        )}

        {tab === 'benchmarks' && (
          <>
            <GuideSection n="A" title="The two disciplines">
              (1) Classify before comparing: industry → subsector → stage → model — biotech vs
              pharma is the same sector and a different planet (6.2× vs 2.4× observed leverage).
              (2) Observed ≠ healthy: an average answers "what does this industry look like," never
              "what should this company be." Every number here carries its benchmark-type label.
            </GuideSection>
            <GuideSection n="B" title="Direction discipline">
              Higher is not better by default: leverage is worse when higher, margins usually
              better, cash runway has diminishing returns, and bank leverage isn't even the right
              metric family. The comparator's reads encode the direction per metric so the
              conclusion can't flip by accident.
            </GuideSection>
            <GuideSection n="C" title="The vertical kits">
              <Eq>runway = (cash + securities) ÷ monthly burn{'\n'}catalyst coverage = runway − months to catalyst{'\n'}Rule of 40 = revenue growth % + FCF margin %{'\n'}GMROI = GM$ ÷ avg inventory · gap = inv growth − rev growth</Eq>
              Each industry has ONE number that does the talking: biotech is runway-to-catalyst,
              SaaS is the growth/profit trade, retail is inventory discipline, banks are capital
              ratios. The runway bands are an INTERNAL ANALYTICAL HEURISTIC — labeled, not law.
            </GuideSection>
          </>
        )}

        {tab === 'debtgeo' && (
          <>
            <GuideSection n="A" title="How to read the country chart">
              Levels alone mislead — the read is level × slope × income growth × zero-bound
              distance. Japan at 235% is stable BECAUSE its central bank absorbs it; the US at
              123% just started paying a term premium for it (tab 11); China at 88% official is
              the fastest ratchet with a hidden local-government layer. Dalio's rule 1 is the
              whole chart: don't let debt rise faster than the income that services it.
            </GuideSection>
            <GuideSection n="B" title="Why states look safe and aren't automatically">
              Balanced-budget rules cap bonded debt, so the state table's percentages look tame —
              the long-term debt cycle went underground into pensions. Read bonded debt and the
              pension note as ONE balance sheet: Illinois and New Jersey are the compounding
              cases, Georgia the discipline benchmark.
            </GuideSection>
            <GuideSection n="B2" title="Trade × currency × equities — the health check">
              Four gauges, read together: the trade balance (the cash engine), the currency trend
              (does the world still want the claim?), the equity discount (what governance
              costs), and politics (the accelerant). Korea 2024–26 moves all four at once — a
              SURPLUS economy with a sliding won tells you the story is politics and governance,
              not trade. Balances are computed (exports − imports); currency indexed 2021 = 100.
            </GuideSection>
            <GuideSection n="B3" title="Populism → the fiscal pipeline">
              The wealth gap produces populism of both flanks; populism owns the fiscal lever; the
              fiscal lever writes deficits and tariffs; deficits and tariffs price the term
              premium. The table names each country's next 24 months of that pipe — and the
              GDP/GSP watch below it adds the non-fiscal movers (disease/FDA, food, education)
              keyed to the same top-ten lists.
            </GuideSection>
            <GuideSection n="C" title="Using the geopolitics layer">
              The driver cards convert headlines into model inputs: every card names the dial or
              equilibrium it hits first, so "tariff news" becomes "inflation dial up, growth dial
              down — reprice tabs 1, 3, and 11." The calendar is the diarizable part; the tab-11
              caveat stands — the biggest movers (auctions, plenums, conflicts) aren't on ballots.
            </GuideSection>
            <GuideSection n="D" title="Data honesty">
              Country figures are approximate IMF-WEO-style values, state figures are internal
              teaching estimates, and calendar entries are constitutional schedules — all labeled
              in place, all to be refreshed from imf.org / fiscaldata.treasury.gov / Census of
              Governments before citing. Same snapshot discipline as tabs 3 and 11.
            </GuideSection>
          </>
        )}

        {tab === 'fullcycle' && (
          <>
            <GuideSection n="A" title="How to use this tab">
              This is the full cycle you asked for: every number derived on screen, with the
              substituted arithmetic shown, and each stage's output named as it feeds the next.
              The learning move: change ONE input in step A, predict which downstream numbers
              move, then scroll and check. When you can predict stage 6 from a stage-A change,
              you own the chain.
            </GuideSection>
            <GuideSection n="B" title="The chain in one glance">
              <Eq>revenue → EBITDA → EBIT → NOPAT (and NI/EPS){'\n'}NOPAT ÷ invested capital = ROIC{'\n'}CAPM + market weights = WACC{'\n'}(ROIC − WACC) × capital = economic profit{'\n'}FCF ÷ (WACC − g) → EV → −net debt → EQV → per share{'\n'}project NPV + financing mix → the decision</Eq>
              Two numbers to never confuse: NOPAT (whole-business, pre-financing — feeds ROIC and
              FCF) vs net income (shareholders' slice, post-interest — feeds EPS). And two value
              views: intrinsic (your model) vs market (the price) — stage 5 computes the growth
              rate that reconciles them, which is where every debate actually lives.
            </GuideSection>
            <GuideSection n="C" title="Reading the bonds-vs-stock table">
              Three lenses that legitimately disagree: EPS (bonds usually win — cheap after-tax
              coupons beat share count), intrinsic value per share (depends on whether the market
              price is rich or cheap vs your intrinsic — issuing expensive stock HELPS existing
              holders even as EPS calls it dilution), and risk (stock always wins — no coupons in
              the downside). Manager-level is naming which lens rules and why, then adding §54:
              no plan survives being unable to service the debt in the bad scenario.
            </GuideSection>
            <GuideSection n="D" title="Where the deeper versions live">
              Tab 5: the five-year DCF with terminal value and the sensitivity grid. Tab 10: the
              beta workshop (where the 1.1 should really come from), accretion/dilution, and
              incremental ROIC. Tab 13: the dilution and windows machinery if the answer is
              equity. Tab 11: why the coupon is what it is.
            </GuideSection>
          </>
        )}

        {tab === 'datasources' && (
          <>
            <GuideSection n="A" title="Why a teaching app has a data layer">
              Because the spec's first discipline is that numbers are computed and traceable, not
              asserted. This tab is the audit trail for every other tab: which source, which
              tier, observed when vs released when vs retrieved when, how fresh, and — for
              derived series — which parents and which formula.
            </GuideSection>
            <GuideSection n="B" title="The three dates">
              <Eq>observation date ≠ release date ≠ retrieval date</Eq>
              The EFFR row shows all three differing. Backtests run on observation dates;
              real-time decisions were made on release dates; this store's honesty runs on
              retrieval dates. Confusing them is how "the data said so" goes wrong.
            </GuideSection>
            <GuideSection n="C" title="Vintages: why revisions never overwrite">
              Q1 GDP was +2.1% when the world reacted to it, and (illustratively) +1.9% after
              revision. Both are true — about different moments of knowledge. Keeping both rows
              is what makes tab 18's backtesting honest: rules must be judged against what was
              KNOWN, not what was later true.
            </GuideSection>
            <GuideSection n="D" title="The OFF switches">
              API_MODE and PAID_API_MODE are OFF by design: V1 runs on free public data and this
              local cache. The provider registry is the spec's promise that turning them on later
              is a config change, not a rewrite — and that no paid service is ever contacted
              without an explicit decision.
            </GuideSection>
          </>
        )}

        {tab === 'report' && (
          <>
            <GuideSection n="A" title="What this tab is">
              The whole Lab, filtered to one subject and read as a single report. Nothing here is
              new data — every section is pulled live from the model behind its source tab, and
              the reference line under each section is the address: "Tab 15 · step A" means go to
              tab 15, section A for the interactive version, worked examples, and guide.
            </GuideSection>
            <GuideSection n="B" title="Filter recipes">
              Country only: the four-gauge sovereign health check (debt slope → trade balance →
              currency → politics). State only: the muni lens — bonded debt plus the pension
              truth. Industry only: revenue weather → capital stance → benchmarks → equity
              window. State + industry ("California by technology"): both layers plus the
              combined read at the bottom, which joins them in one paragraph. All three on:
              the full briefing.
            </GuideSection>
            <GuideSection n="C" title="What moves and what doesn't">
              The scenario chips drive ONLY the dial-driven sections — industry backdrop, capital
              stance, sub-lenses, and the combined read. Country and state sections are dated
              snapshot data (approximate teaching values, sources on tab 15) and hold still. If
              a number surprises you, step C's formula cards show the exact math, each with its
              own reference.
            </GuideSection>
            <GuideSection n="D" title="Using it for the interview">
              This is the "walk me through how you'd brief a client on X" rehearsal: pick the
              client's industry and home state, read the report top to bottom out loud, and
              practice ending each section with the so-what. The EY-expected exhibits on tab 7
              step E tell you which of these sections would become which slide.
            </GuideSection>
          </>
        )}

        {tab === 'backtest' && (
          <>
            <GuideSection n="A" title="What this proves">
              The verdicts are not opinions — each rule is executed against each regime's dials
              by the same functions the other tabs run (the capital engine, the debt playbook,
              the asset sensitivities, the equilibrium reads). The tab is the Lab testing itself.
            </GuideSection>
            <GuideSection n="B" title="Why rule 3 fails, and why that's the exhibit">
              "Bonds hedge stocks" worked for four decades of DEMAND shocks (2008, 2020: money
              runs to safety) and failed in the INFLATION shock (2022 — and again in the 2026
              term-premium regime), because rate shocks hit every long-duration asset at once.
              A pattern held long enough becomes invisible as an assumption — until the regime
              that breaks it. Dalio's fix is tab 3's alignment view: diversify by environment,
              not by habit.
            </GuideSection>
            <GuideSection n="C" title="Writing your own rules">
              The template: state the trigger as dials (IF policy &gt; 0…), state the action,
              state what SILENCE means, then demand correctness in all five regimes — scoring
              the tops (2000, 2022) as strictly as the bottoms. If you can't write the trigger
              as a condition on observable state, it isn't a rule yet.
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
