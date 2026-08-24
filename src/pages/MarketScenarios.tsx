// Market Scenarios — a step-by-step macro "financial model" teaching tool.
//
// The user enters a capital amount, picks (or builds) a macro scenario —
// growth, inflation, monetary policy, fiscal policy — and the tool walks the
// cause-and-effect chain (Dalio's economic machine + the discount-rate chain)
// and shows the modeled 12-month impact of that capital across asset classes
// and industries. All model math lives in src/lib/macroModel.ts and is shown
// to the user on purpose. Education only; not investment advice.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { track } from '@vercel/analytics';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Cog,
  Compass,
  GraduationCap,
  Sparkles,
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
import { resolveCSSVar } from '../lib/uiColors';
import { fmtMoney } from '../lib/format';
import {
  ASSET_CLASSES,
  CUSTOM_SCENARIO_ID,
  ImpactRow,
  INDUSTRIES,
  MacroFactors,
  SCENARIOS,
  chainSteps,
  impactDollars,
  impactPct,
  impactTable,
} from '../lib/macroModel';
import { MARKET_SNAPSHOT, TODAY_SCENARIO_ID } from '../lib/marketSnapshot';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtAsOf(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${MONTHS[Number(m) - 1] ?? m} ${Number(d)}, ${y}`;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const fmtSignedPct = (p: number) => `${p > 0 ? '+' : ''}${p.toFixed(1)}%`;
const fmtSignedMoney = (d: number) => (d < 0 ? `−${fmtMoney(Math.abs(d), 0)}` : `+${fmtMoney(d, 0)}`);
const toneFor = (v: number) => (v > 0 ? 'var(--pos)' : v < 0 ? 'var(--neg)' : 'var(--text-tertiary)');

/** Re-render when the light/dark toggle flips, so charts re-resolve CSS vars. */
function useThemeVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const obs = new MutationObserver(() => setV((x) => x + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return v;
}

interface DialOption {
  label: string;
  value: number;
}

interface Dial {
  key: keyof MacroFactors;
  label: string;
  hint: string;
  options: DialOption[];
}

const DIALS: Dial[] = [
  {
    key: 'growth',
    label: 'Economic growth',
    hint: 'Are businesses selling and hiring more — or less?',
    options: [
      { label: 'Falling', value: -2 },
      { label: 'Steady', value: 0 },
      { label: 'Rising', value: 2 },
    ],
  },
  {
    key: 'inflation',
    label: 'Inflation',
    hint: 'Are prices accelerating or cooling off?',
    options: [
      { label: 'Falling', value: -2 },
      { label: 'Steady', value: 0 },
      { label: 'Rising', value: 2 },
    ],
  },
  {
    key: 'policy',
    label: 'Monetary policy (the Fed)',
    hint: 'The first lever: interest rates and money printing.',
    options: [
      { label: 'Cutting / QE', value: -2 },
      { label: 'On hold', value: 0 },
      { label: 'Raising rates', value: 2 },
    ],
  },
  {
    key: 'fiscal',
    label: 'Fiscal policy (the government)',
    hint: 'The second lever: taxes and government spending.',
    options: [
      { label: 'Austerity', value: -1 },
      { label: 'Neutral', value: 0 },
      { label: 'Stimulus', value: 1 },
    ],
  },
];

/** Which segmented option is "on" for a factor value — matched by sign, so
    preset factors (e.g. growth +1) still light up the right choice. */
const isDialActive = (opt: DialOption, value: number) =>
  opt.value === 0 ? value === 0 : Math.sign(opt.value) === Math.sign(value) && value !== 0;

const CAPITAL_PRESETS = [10_000, 50_000, 100_000, 500_000, 1_000_000];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MarketScenarios() {
  const [capital, setCapital] = useState(100_000);
  // Land on the real, current environment — the presets are one click away.
  const [scenarioId, setScenarioId] = useState<string>(TODAY_SCENARIO_ID);
  const [factors, setFactors] = useState<MacroFactors>(MARKET_SNAPSHOT.factors);

  const pickScenario = (id: string) => {
    const s = SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    setScenarioId(id);
    setFactors(s.factors);
    track('scenario_pick', { scenario: id });
  };

  const setDial = (key: keyof MacroFactors, value: number) => {
    setScenarioId(CUSTOM_SCENARIO_ID);
    setFactors((f) => ({ ...f, [key]: value }));
  };

  const pickToday = () => {
    setScenarioId(TODAY_SCENARIO_ID);
    setFactors(MARKET_SNAPSHOT.factors);
    track('scenario_pick', { scenario: TODAY_SCENARIO_ID });
  };

  const scenarioName =
    scenarioId === TODAY_SCENARIO_ID
      ? `Today's market (as of ${fmtAsOf(MARKET_SNAPSHOT.asOf)})`
      : SCENARIOS.find((s) => s.id === scenarioId)?.name ?? 'Your custom scenario';

  const steps = useMemo(() => chainSteps(factors), [factors]);
  const assetRows = useMemo(() => impactTable(ASSET_CLASSES, capital, factors), [capital, factors]);
  const industryRows = useMemo(() => impactTable(INDUSTRIES, capital, factors), [capital, factors]);

  const best = assetRows[0];
  const worst = assetRows[assetRows.length - 1];

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
      {/* Two-column layout: steps on the left, sticky user guide on the right.
          Collapses to a single column (guide below) on narrow screens. */}
      <style>{`
        .ms-layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 24px; align-items: start; }
        .ms-guide { position: sticky; top: 24px; max-height: calc(100vh - 48px); overflow-y: auto; }
        @media (max-width: 1040px) {
          .ms-layout { grid-template-columns: 1fr; }
          .ms-guide { position: static; max-height: none; }
        }
      `}</style>
      <header style={{ marginBottom: 40 }}>
        <div className="between" style={{ gap: 16, marginBottom: 12 }}>
          <div
            className="row gap-2"
            style={{
              alignItems: 'center',
              color: 'var(--text-secondary)',
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <Sparkles size={14} />
            <span>FAST Insights</span>
          </div>
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={15} /> All tools
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
          Market Scenarios
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 10, maxWidth: 680, lineHeight: 1.6 }}>
          Enter an amount of capital, pick a market scenario, and see the modeled impact by asset
          class and industry — with the cause-and-effect chain (growth, inflation, and the fiscal
          &amp; monetary policy levers) explained in plain English at every step.{' '}
          <strong>A teaching model, not a forecast. Education only; not investment advice.</strong>
        </p>
      </header>

      <div className="ms-layout">
      <div className="col" style={{ gap: 24 }}>
        {/* ------------------------------------------------ Step 1: capital */}
        <StepCard n={1} icon={<Wallet size={17} />} title="Start with your capital">
          <p style={hintStyle}>How much are you working with? Every result below is shown in both % and dollars on this amount.</p>
          <div className="row gap-3" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              className="row"
              style={{
                alignItems: 'center',
                gap: 6,
                background: 'var(--bg-elevated-2)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
              }}
            >
              <span style={{ fontSize: 16, color: 'var(--text-tertiary)' }}>$</span>
              <input
                aria-label="Your capital in dollars"
                inputMode="numeric"
                value={capital.toLocaleString('en-US')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, '');
                  setCapital(digits ? Math.min(Number(digits), 1_000_000_000) : 0);
                }}
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  width: 140,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              {CAPITAL_PRESETS.map((v) => (
                <Chip key={v} active={capital === v} onClick={() => setCapital(v)}>
                  {fmtMoney(v, 0)}
                </Chip>
              ))}
            </div>
          </div>
        </StepCard>

        {/* ---------------------------------------------- Step 2: scenario */}
        <StepCard n={2} icon={<Compass size={17} />} title="Pick a market scenario">
          <p style={hintStyle}>
            Each preset is a combination of the four forces that drive markets. Start from where the
            market actually is today, pick a classic environment — or build your own with the dials
            below.
          </p>

          {/* Today's market — a dated snapshot of the real current readings. */}
          <GlassCard
            variant="nested"
            padding={18}
            style={{
              marginBottom: 16,
              border: `1px solid ${scenarioId === TODAY_SCENARIO_ID ? 'var(--accent)' : 'var(--border)'}`,
              background: scenarioId === TODAY_SCENARIO_ID ? 'var(--accent-soft)' : undefined,
            }}
          >
            <div className="between" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
              <div className="col" style={{ gap: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Today's market{' '}
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)' }}>
                    — as of {fmtAsOf(MARKET_SNAPSHOT.asOf)}
                  </span>
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{MARKET_SNAPSHOT.headline}</span>
              </div>
              <Chip active={scenarioId === TODAY_SCENARIO_ID} onClick={pickToday}>
                Load today's scenario
              </Chip>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: 10,
              }}
            >
              {MARKET_SNAPSHOT.readings.map((r) => (
                <div key={r.label} className="col" style={{ gap: 2 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    {r.label}
                  </span>
                  <span className="num" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left' }}>{r.value}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{r.detail}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{r.source}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {SCENARIOS.map((s) => {
              const active = s.id === scenarioId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickScenario(s.id)}
                  aria-pressed={active}
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    background: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {s.name}
                  </span>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.blurb}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>{s.echo}</span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: scenarioId === CUSTOM_SCENARIO_ID ? 'var(--accent)' : 'var(--text-tertiary)',
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              {scenarioId === CUSTOM_SCENARIO_ID ? 'Your custom scenario' : 'Fine-tune the four forces (makes it a custom scenario)'}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 14,
              }}
            >
              {DIALS.map((d) => (
                <div key={d.key} className="col gap-1">
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{d.label}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 4 }}>{d.hint}</span>
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    {d.options.map((opt) => (
                      <Chip
                        key={opt.label}
                        active={isDialActive(opt, factors[d.key])}
                        onClick={() => setDial(d.key, opt.value)}
                      >
                        {opt.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </StepCard>

        {/* ------------------------------------------------- Step 3: chain */}
        <StepCard n={3} icon={<Cog size={17} />} title="How the machine reacts">
          <p style={hintStyle}>
            Markets aren't random — the same cause-and-effect chain runs every time. Here it is for{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{scenarioName}</strong>:
          </p>
          <div className="col" style={{ gap: 0 }}>
            {steps.map((s, i) => (
              <div key={s.title} className="row gap-3" style={{ alignItems: 'stretch' }}>
                <div className="col" style={{ alignItems: 'center', width: 28, flexShrink: 0 }}>
                  <div
                    className="center"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: 'var(--border)', margin: '4px 0' }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < steps.length - 1 ? 16 : 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.text}</div>
                </div>
              </div>
            ))}
          </div>
        </StepCard>

        {/* ------------------------------------------------ Step 4: impact */}
        <StepCard
          n={4}
          icon={<BarChart3 size={17} />}
          title={`What it could mean for your ${fmtMoney(capital, 0)}`}
        >
          <p style={hintStyle}>
            Modeled 12-month impact vs. a neutral market if that full amount were placed in each
            option. <span style={{ color: 'var(--pos)', fontWeight: 600 }}>Green = modeled gain</span>,{' '}
            <span style={{ color: 'var(--neg)', fontWeight: 600 }}>red = modeled loss</span>. Hover any
            bar for the why.
          </p>

          {best && worst && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <SummaryTile label="Strongest in this scenario" row={best} />
              <SummaryTile label="Toughest in this scenario" row={worst} />
            </div>
          )}

          <ImpactSection title="By asset class" rows={assetRows} capital={capital} kind="asset class" />
          <div style={{ height: 24 }} />
          <ImpactSection title="By industry (stock sectors)" rows={industryRows} capital={capital} kind="industry" />

          <p style={{ ...hintStyle, marginTop: 18, marginBottom: 0 }}>
            How each number is computed: every row has published sensitivities to the four dials, and
            the impact is simply <span className="mono">sensitivity × dial, summed</span> — a linear
            teaching model. Real markets also run on surprises, sentiment, and starting valuations,
            which is exactly why diversification (not prediction) is the professional's edge.
          </p>
        </StepCard>

        {/* ---------------------------------------------- Step 5: learning */}
        <StepCard n={5} icon={<GraduationCap size={17} />} title="The principles behind this tool">
          <div className="col gap-3">
            <Principle title="The economy is a machine (Ray Dalio)">
              Three forces drive everything: <strong>productivity growth</strong> (slow, powerful,
              always up over time), the <strong>short-term debt cycle</strong> (the 7–10 year business
              cycle: credit expands → economy heats → the Fed brakes → recession → cuts → repeat), and
              the <strong>long-term debt cycle</strong> (decades of accumulating debt until rates hit
              zero and printing money — QE — is the only lever left, like 1932 and 2008).
            </Principle>
            <Principle title="Two levers steer it">
              <strong>Monetary policy</strong> (the Fed: interest rates and QE) and{' '}
              <strong>fiscal policy</strong> (the government: taxes and spending). Watch three
              equilibriums: debt growing no faster than the income that services it; the economy
              running neither too hot nor too cold; and stocks yielding more than bonds, which yield
              more than cash. When one is out of line, the levers move — and markets move with them.
            </Principle>
            <Principle title="Every price is a discounted future (the valuation chain)">
              An investment's value is its future cash flows discounted to today:{' '}
              <span className="mono">value = cash flows ÷ (1 + rate)ᵗ</span>. That's why the chain
              runs <em>policy → interest rates → discount rate → valuations</em>, and why
              long-duration assets (tech, long bonds, real estate) swing hardest when rates move.
            </Principle>
            <Principle title="The Holy Grail: diversification">
              Dalio's core investing principle: <strong>10–15 good, uncorrelated return streams</strong>{' '}
              can cut risk by up to ~80% without giving up return. The point of comparing scenarios
              isn't to bet on one — it's to see that no single asset wins in every environment, and a
              balanced mix survives them all.
            </Principle>
          </div>
        </StepCard>
      </div>

      <GuidePane capital={capital} factors={factors} />
      </div>

      <footer style={{ marginTop: 48, color: 'var(--text-tertiary)', fontSize: 12, lineHeight: 1.6 }}>
        © FAST Insights — Market Scenarios is an educational model with illustrative sensitivities.
        It is not investment advice, not a prediction, and not a recommendation to buy or sell
        anything. Framework inspired by Ray Dalio's economic-machine principles.
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

const hintStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  marginTop: 0,
  marginBottom: 16,
};

function StepCard({
  n,
  icon,
  title,
  children,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard variant="default" padding={24}>
      <div className="row gap-3" style={{ alignItems: 'center', marginBottom: 14 }}>
        <div
          className="center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--surface-2, var(--bg-elevated-2))',
            color: 'var(--accent)',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600, marginRight: 8 }}>{n}.</span>
          {title}
        </h2>
      </div>
      {children}
    </GlassCard>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '6px 12px',
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 999,
        cursor: 'pointer',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        background: active ? 'var(--accent-soft)' : 'var(--bg-elevated-2)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        transition: 'color .15s, border-color .15s, background .15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function SummaryTile({ label, row }: { label: string; row: ImpactRow }) {
  return (
    <GlassCard variant="nested" padding={16}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</div>
      <div className="num" style={{ fontSize: 14, fontWeight: 600, color: toneFor(row.pct), marginTop: 4 }}>
        {fmtSignedPct(row.pct)} · {fmtSignedMoney(row.dollars)}
      </div>
    </GlassCard>
  );
}

function ImpactSection({
  title,
  rows,
  capital,
  kind,
}: {
  title: string;
  rows: ImpactRow[];
  capital: number;
  kind: string;
}) {
  useThemeVersion(); // re-resolve chart colors when the theme flips
  const pos = resolveCSSVar('var(--pos)');
  const neg = resolveCSSVar('var(--neg)');
  const height = 40 + rows.length * 34;

  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
              width={170}
            />
            <ReferenceLine x={0} stroke="var(--border-strong)" />
            <Tooltip
              cursor={{ fill: 'var(--accent-soft)' }}
              contentStyle={{
                background: 'var(--bg-elevated-2)',
                border: '1px solid var(--border-strong)',
                borderRadius: 10,
                color: 'var(--text-primary)',
                maxWidth: 300,
                whiteSpace: 'normal',
              }}
              formatter={(value: number, _name, props) => {
                const row = props?.payload as ImpactRow | undefined;
                const money = row ? fmtSignedMoney(row.dollars) : '';
                const why = row ? ` — ${row.driver}` : '';
                return [`${fmtSignedPct(Number(value))} · ${money}${why}`, ''];
              }}
              labelFormatter={(label) => String(label)}
            />
            <Bar dataKey="pct" radius={4} maxBarSize={18}>
              {rows.map((r) => (
                <Cell key={r.id} fill={r.pct >= 0 ? pos : neg} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ overflowX: 'auto', marginTop: 6 }}>
        <table className="fin-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>{kind[0].toUpperCase() + kind.slice(1)}</th>
              <th className="num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Modeled 12-mo</th>
              <th className="num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>On {fmtMoney(capital, 0)}</th>
              <th style={{ textAlign: 'left' }}>Why it moves</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td className="num" style={{ textAlign: 'right', color: toneFor(r.pct), fontWeight: 600 }}>
                  {fmtSignedPct(r.pct)}
                </td>
                <td className="num" style={{ textAlign: 'right', color: toneFor(r.dollars) }}>
                  {fmtSignedMoney(r.dollars)}
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>{r.driver}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Principle({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <GlassCard variant="nested" padding={16}>
      <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 6 }}>
        <ArrowRight size={14} color="var(--accent)" />
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{children}</div>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Right-pane user guide — how to use each step + the equations, with examples.
// The step-4 worked example is LIVE: it recomputes from the user's current
// capital and dials, so the math on the right always matches the chart on
// the left.
// ---------------------------------------------------------------------------

/** An equation, displayed in a mono block. */
function Eq({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mono"
      style={{
        fontSize: 11.5,
        background: 'var(--bg-elevated-2)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 10px',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        color: 'var(--text-primary)',
        margin: '6px 0',
      }}
    >
      {children}
    </div>
  );
}

function GuideSection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ paddingBottom: 14, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
      <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 6 }}>
        <span
          className="center"
          style={{
            width: 20,
            height: 20,
            borderRadius: 999,
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {n}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

const guideLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: 'var(--text-tertiary)',
  fontWeight: 700,
  margin: '8px 0 3px',
};

function GuidePane({ capital, factors }: { capital: number; factors: MacroFactors }) {
  // Live worked example: US stocks under the user's current dials + capital.
  const stocks = ASSET_CLASSES.find((a) => a.id === 'stocks')!;
  const s = stocks.sens;
  const livePct = impactPct(s, factors);
  const liveDollars = impactDollars(capital, s, factors);

  return (
    <aside className="ms-guide" aria-label="User guide">
      <GlassCard variant="default" padding={20}>
        <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 4 }}>
          <GraduationCap size={16} color="var(--accent)" />
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>User guide</h2>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 16px', lineHeight: 1.5 }}>
          Follows the numbered steps on the left — what to do, plus the exact equation behind each
          one, with examples.
        </p>

        <GuideSection n={1} title="Your capital">
          <span style={guideLabel}>What to do</span>
          Type any dollar amount, or tap a preset chip. Every number below re-computes instantly —
          there is no "calculate" button.
          <span style={guideLabel}>The equation</span>
          <Eq>dollar impact = capital × modeled % ÷ 100</Eq>
          <span style={guideLabel}>Example</span>
          $100,000 with a modeled +7.5% → 100,000 × 7.5 ÷ 100 = <strong>+$7,500</strong>. The same
          −7.5% would be −$7,500 — the math is symmetric.
        </GuideSection>

        <GuideSection n={2} title="Pick a scenario">
          <span style={guideLabel}>What to do</span>
          Start with <em>Load today's scenario</em> (real, dated readings), or pick a classic
          environment. Touch any dial and it becomes your own custom scenario.
          <span style={guideLabel}>The equation</span>
          <Eq>scenario = [growth, inflation, Fed, fiscal]</Eq>
          Each dial is a number from −2 (strongly falling / easing) to +2 (strongly rising /
          tightening).
          <span style={guideLabel}>Example</span>
          "Overheating — Fed hits the brakes" is [+1, +2, +2, 0]: growth a bit above trend,
          inflation hot, the Fed hiking hard, government neutral.
        </GuideSection>

        <GuideSection n={3} title="How the machine reacts">
          <span style={guideLabel}>What to do</span>
          Read the five steps top to bottom — it is the same cause-and-effect chain in every
          environment. Flip a dial and watch the wording change.
          <span style={guideLabel}>The equation (discounting)</span>
          <Eq>value today = cash flow ÷ (1 + rate)^years</Eq>
          <span style={guideLabel}>Example</span>
          $100 arriving in 10 years is worth 100 ÷ 1.03¹⁰ ≈ <strong>$74</strong> today at a 3% rate —
          but only 100 ÷ 1.05¹⁰ ≈ <strong>$61</strong> at 5%. Rates up = today's values down, and the
          further in the future the cash flow, the harder the hit. That is exactly why tech, long
          bonds, and real estate swing most when the Fed moves.
        </GuideSection>

        <GuideSection n={4} title="Reading the impact">
          <span style={guideLabel}>What to do</span>
          Bars are sorted best → worst; green is a modeled gain, red a modeled loss. Hover any bar
          for dollars and the "why". The table repeats every number precisely.
          <span style={guideLabel}>The equation</span>
          <Eq>impact % = Sg×G + Si×I + Sp×P + Sf×F</Eq>
          S = the row's published sensitivities; G, I, P, F = your four dials.
          <span style={guideLabel}>Live example — US stocks, your current settings</span>
          <Eq>
            ({s.growth}×{factors.growth}) + ({s.inflation}×{factors.inflation}) + ({s.policy}×
            {factors.policy}) + ({s.fiscal}×{factors.fiscal}) = {fmtSignedPct(livePct)}
          </Eq>
          On your {fmtMoney(capital, 0)} that is{' '}
          <strong style={{ color: toneFor(liveDollars) }}>{fmtSignedMoney(liveDollars)}</strong>.
          Change a dial or the amount and watch this line change.
        </GuideSection>

        <GuideSection n={5} title="The principles">
          <span style={guideLabel}>What to do</span>
          Read once now, revisit after trying a few scenarios — the patterns will click.
          <span style={guideLabel}>The equation (diversification)</span>
          <Eq>portfolio risk ≈ single-bet risk ÷ √N</Eq>
          N = the number of <em>truly uncorrelated</em> investments.
          <span style={guideLabel}>Example</span>
          15 uncorrelated return streams → risk ÷ √15 ≈ risk ÷ 3.9 — roughly{' '}
          <strong>74% less risk without giving up return</strong>. That is Dalio's "Holy Grail", and
          it is why this tool compares environments instead of picking winners.
        </GuideSection>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          All sensitivities are illustrative teaching values — open any row's "why" to see the
          economic logic. Education only; not investment advice.
        </p>
      </GlassCard>
    </aside>
  );
}
