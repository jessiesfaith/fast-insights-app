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
  ArrowLeft,
  BarChart3,
  Briefcase,
  Calculator,
  ClipboardCheck,
  Compass,
  GraduationCap,
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
import { CUSTOM_SCENARIO_ID, MacroFactors, SCENARIOS } from '../lib/macroModel';
import { MARKET_SNAPSHOT, TODAY_SCENARIO_ID } from '../lib/marketSnapshot';
import {
  Band,
  CreditResult,
  CustomerFinancials,
  DEBT_WEIGHT,
  DEFAULT_WACC_INPUTS,
  ERP,
  OptionResult,
  SAMPLE_CUSTOMERS,
  TAX_RATE,
  TREASURY_INSTRUMENTS,
  WaccInputs,
  assessCredit,
  computeCreditMetrics,
  computeWacc,
  evaluateAllOptions,
} from '../lib/corpFinance';

// ---------------------------------------------------------------------------
// Small local pieces
// ---------------------------------------------------------------------------

type TabId = 'capital' | 'credit' | 'treasury';

const TABS: { id: TabId; label: string; icon: typeof Briefcase }[] = [
  { id: 'capital', label: "1 · Your company's moves", icon: Briefcase },
  { id: 'credit', label: '2 · Customer credit', icon: ShieldCheck },
  { id: 'treasury', label: '3 · Treasury & hedging', icon: Umbrella },
];

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

  const wacc = useMemo(() => computeWacc(waccInputs), [waccInputs]);
  const options = useMemo(
    () => evaluateAllOptions(waccInputs, factors, capital),
    [waccInputs, factors, capital],
  );
  const metrics = useMemo(() => computeCreditMetrics(fin), [fin]);
  const credit = useMemo(() => assessCredit(requested, termsDays, fin), [requested, termsDays, fin]);

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
          Three ways to run the numbers: decide <strong>your company's next move</strong> under real
          market conditions, <strong>underwrite a customer</strong> before extending them credit, and
          pick the right <strong>treasury &amp; hedging tools</strong> for the environment.{' '}
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
                    <div className="row gap-2">
                      {[{ l: 'Strong · +2%', v: 2 }, { l: 'Average · +3%', v: 3 }, { l: 'Stretched · +5%', v: 5 }].map((b) => (
                        <Chip key={b.v} active={waccInputs.creditSpread === b.v} onClick={() => setWaccInputs((w) => ({ ...w, creditSpread: b.v }))}>
                          {b.l}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="row gap-3" style={{ flexWrap: 'wrap', marginTop: 16 }}>
                  <StatPill label="Cost of equity" value={`${wacc.costEquity}%`} />
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
                <OptionsSection rows={options} capital={capital} />
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
        </div>

        <GuidePane tab={tab} wacc={wacc} waccInputs={waccInputs} options={options} capital={capital} credit={credit} requested={requested} termsDays={termsDays} fin={fin} />
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

function OptionsSection({ rows, capital }: { rows: OptionResult[]; capital: number }) {
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
              <th className="num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Expected</th>
              <th className="num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Hurdle</th>
              <th className="num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>NPV on {fmtMoney(capital, 0)}</th>
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
          {tab === 'treasury' && 'Picking treasury tools: what each instrument does and when it fits.'}{' '}
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
              rankings conflict on mutually exclusive choices, trust NPV.
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
            <GuideSection n="D" title="Why these six ratios">
              Coverage and leverage ask <em>"can they pay everyone?"</em>; the current ratio asks{' '}
              <em>"can they pay this year?"</em>; margin asks <em>"is there cushion?"</em>; DSO and
              the cash conversion cycle ask <em>"how long is my money inside their business?"</em> —
              the requested {fmtMoney(requested, 0)} is your inventory riding on their answers.
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

        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          Illustrative teaching assumptions throughout. Education only; not investment, credit, or
          tax advice.
        </p>
      </GlassCard>
    </aside>
  );
}
