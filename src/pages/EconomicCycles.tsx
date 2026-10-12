// Economic Cycles — a two-tab reference module.
//
//   Tab 1 · Business cycle indicators — the "U.S. Business Cycle Indicators:
//           Leading, Coincident and Lagging" graphic rebuilt as a live chart
//           in the app's design system (light/dark, hover detail, table view,
//           breadth tiles). Data lives in src/lib/businessCycle.ts.
//   Tab 2 · CPA tax reference — a gallery of study diagrams (partnership vs
//           S-corp basis, property contribution/distribution, end-to-end
//           entity workflows, the all-entities TCP grid). Images live in
//           public/economic-cycles/; add an entry to REFERENCE_IMAGES to add one.
//
// Education only; not investment, accounting, or tax advice.

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { track } from '@vercel/analytics';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  FileCheck2,
  ExternalLink,
  ImageOff,
  Maximize2,
  Sparkles,
  X,
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import ThemeToggle from '../components/ui/ThemeToggle';
import {
  CycleGroupMeta,
  CycleIndicator,
  GROUPS,
  SNAPSHOT,
  breadth,
  breadthLabel,
  cycleHeight,
  indicatorsFor,
} from '../lib/businessCycle';
import {
  DEBT_BASIS_GRID,
  GridCell,
  SCORP_CORRECTIONS,
  SCORP_EXAMPLE,
  fmtAmt,
  sCorpWorkflow,
} from '../lib/entityTaxReference';

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type TabId = 'cycle' | 'reference' | 'digital';

const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: 'cycle', label: '1 · Business cycle indicators', icon: Activity },
  { id: 'reference', label: '2 · CPA tax reference', icon: BookOpen },
  { id: 'digital', label: '3 · Digital rebuild (corrected)', icon: FileCheck2 },
];

const mono: CSSProperties = { fontFamily: 'var(--font-mono)' };

const SIGNAL_COLOR: Record<CycleIndicator['signal'] | 'transition', string> = {
  expansion: 'var(--pos)',
  contraction: 'var(--neg)',
  transition: 'var(--severity-medium)',
};

// ---------------------------------------------------------------------------
// Tab 1 — the cycle chart
// ---------------------------------------------------------------------------

// SVG geometry (viewBox units). The chart scales with its container width.
const VB_W = 1200;
const VB_H = 385;
const PLOT_L = 70;
const PLOT_R = 1160;
const Y_TROUGH = 322;
const Y_PEAK = 182;
const Y_BASE = 334;

const px = (x: number) => PLOT_L + x * (PLOT_R - PLOT_L);
const py = (x: number, peakAt: number) => Y_TROUGH - cycleHeight(x, peakAt) * (Y_TROUGH - Y_PEAK);

function curvePath(peakAt: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const x = i / 120;
    pts.push(`${i === 0 ? 'M' : 'L'}${px(x).toFixed(1)},${py(x, peakAt).toFixed(1)}`);
  }
  return pts.join(' ');
}

/** Wrap a label onto ≤2 lines so neighbouring labels don't collide. */
function wrapName(name: string, max = 15): string[] {
  if (name.length <= max) return [name];
  const words = name.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  if (lines.length > 2) return [lines[0], lines.slice(1).join(' ')];
  return lines;
}

function BetterArrow({ dir, size = 11 }: { dir: CycleIndicator['better']; size?: number }) {
  const up = dir === 'up';
  return (
    <span
      aria-label={up ? 'increase is generally better' : 'decrease is generally better'}
      title={up ? 'Increase is generally better' : 'Decrease is generally better'}
      style={{ color: up ? 'var(--pos)' : 'var(--neg)', fontSize: size, fontWeight: 800, lineHeight: 1 }}
    >
      {up ? '▲' : '▼'}
    </span>
  );
}

function SignalPill({ signal }: { signal: CycleIndicator['signal'] }) {
  const c = SIGNAL_COLOR[signal];
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 9px', borderRadius: 999,
        fontSize: 11, fontWeight: 700, color: c, border: `1px solid ${c}`, whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden style={{ width: 7, height: 7, borderRadius: 999, background: c }} />
      {signal === 'expansion' ? 'Expansion signal' : 'Contraction signal'}
    </span>
  );
}

function CyclePanel({ meta }: { meta: CycleGroupMeta }) {
  const rows = useMemo(() => indicatorsFor(meta.id), [meta.id]);
  const [hover, setHover] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const peakX = px(meta.peakAt);
  const hovered = rows.find((r) => r.id === hover) ?? null;
  const gradId = `cycle-bg-${meta.id}`;

  return (
    <GlassCard variant="default" padding={0} style={{ overflow: 'hidden' }}>
      <div className="econ-panel">
        {/* Left rail — the group's question */}
        <div className="econ-rail">
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--accent)' }}>
            {meta.title}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginTop: 6, lineHeight: 1.25 }}>
            {meta.question}
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '10px 0 0' }}>{meta.blurb}</p>
          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 10, lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Economic activity:</strong> {meta.activity}
          </div>
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-pressed={showTable}
            style={{
              marginTop: 14, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', padding: '6px 10px', borderRadius: 999,
              color: showTable ? 'var(--accent)' : 'var(--text-secondary)',
              background: showTable ? 'var(--accent-soft)' : 'var(--bg-elevated-2)',
              border: `1px solid ${showTable ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {showTable ? 'Hide table' : 'Show as table'}
          </button>
        </div>

        {/* Chart — scrolls sideways on narrow screens instead of shrinking past legibility */}
        <div style={{ position: 'relative', minWidth: 0, overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            role="img"
            aria-label={`${meta.title}: ${rows.length} indicators placed along an expansion-to-contraction cycle curve`}
            style={{ width: '100%', minWidth: 760, height: 'auto', display: 'block', fontFamily: 'var(--font-ui)' }}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="var(--pos)" stopOpacity="0.10" />
                <stop offset={(meta.peakAt - 0.1).toFixed(3)} stopColor="var(--pos)" stopOpacity="0.07" />
                <stop offset={(meta.peakAt + 0.1).toFixed(3)} stopColor="var(--neg)" stopOpacity="0.07" />
                <stop offset="1" stopColor="var(--neg)" stopOpacity="0.10" />
              </linearGradient>
              <marker id={`arrow-${meta.id}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--text-muted)' }} />
              </marker>
            </defs>

            {/* phase background */}
            <rect x={PLOT_L} y={4} width={PLOT_R - PLOT_L} height={Y_BASE - 4} fill={`url(#${gradId})`} rx={8} />

            {/* y axis */}
            <line x1={48} y1={Y_BASE} x2={48} y2={24} style={{ stroke: 'var(--text-muted)' }} strokeWidth={1.5} markerEnd={`url(#arrow-${meta.id})`} />
            <text x={40} y={Y_BASE} transform={`rotate(-90 40 ${Y_BASE})`} fontSize={11} fontWeight={700} style={{ fill: 'var(--text-tertiary)' }}>
              Economic activity
            </text>

            {/* baseline + phase labels */}
            <line x1={PLOT_L} y1={Y_BASE} x2={PLOT_R} y2={Y_BASE} style={{ stroke: 'var(--border-strong)' }} strokeWidth={1.5} />
            <text x={(PLOT_L + peakX) / 2} y={Y_BASE + 26} textAnchor="middle" fontSize={14} fontWeight={800} style={{ fill: 'var(--pos)' }} letterSpacing="0.04em">
              EXPANSION <tspan fontWeight={500} fontSize={11.5} style={{ fill: 'var(--text-secondary)' }}>(economy going up)</tspan> →
            </text>
            <text x={(peakX + PLOT_R) / 2} y={Y_BASE + 26} textAnchor="middle" fontSize={14} fontWeight={800} style={{ fill: 'var(--neg)' }} letterSpacing="0.04em">
              CONTRACTION <tspan fontWeight={500} fontSize={11.5} style={{ fill: 'var(--text-secondary)' }}>(economy going down)</tspan> →
            </text>

            {/* the curve */}
            <path d={curvePath(meta.peakAt)} fill="none" style={{ stroke: 'var(--text-secondary)' }} strokeWidth={2.5} strokeLinecap="round" />

            {/* trough / peak / trough markers */}
            {[
              { x: 0, label: 'TROUGH', dy: 24 },
              { x: meta.peakAt, label: 'PEAK', dy: -18 },
              { x: 1, label: 'TROUGH', dy: 24 },
            ].map((m) => (
              <g key={`${m.label}-${m.x}`}>
                <circle cx={px(m.x)} cy={py(m.x, meta.peakAt)} r={8} style={{ fill: SIGNAL_COLOR.transition, stroke: 'var(--bg-base)' }} strokeWidth={2} />
                <text x={px(m.x)} y={py(m.x, meta.peakAt) + m.dy} textAnchor="middle" fontSize={11.5} fontWeight={800} style={{ fill: 'var(--text-tertiary)' }} letterSpacing="0.06em">
                  {m.label}
                </text>
              </g>
            ))}

            {/* indicators */}
            {rows.map((r, i) => {
              const cx = px(r.x);
              const cy = py(r.x, meta.peakAt);
              const far = i % 2 === 1; // alternate near/far tiers so labels never collide
              const lines = wrapName(r.name);
              const boxH = 14 * lines.length + 26; // name lines + value + date
              const bottom = cy - (far ? 120 : 38);
              const top = bottom - boxH;
              const active = hover === r.id;
              const color = SIGNAL_COLOR[r.signal];
              return (
                <g
                  key={r.id}
                  onMouseEnter={() => setHover(r.id)}
                  onFocus={() => setHover(r.id)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${r.name}: ${r.value}${r.change ? ` (${r.change})` : ''}, ${r.asOf}, ${r.signal} signal`}
                  style={{ cursor: 'default', outline: 'none' }}
                >
                  <line x1={cx} y1={cy - 9} x2={cx} y2={bottom + 2} style={{ stroke: active ? color : 'var(--border-strong)' }} strokeWidth={1} strokeDasharray={far ? '3 3' : undefined} />
                  {/* hit target larger than the mark */}
                  <circle cx={cx} cy={cy} r={16} fill="transparent" />
                  <circle cx={cx} cy={cy} r={active ? 10 : 8} style={{ fill: color, stroke: 'var(--bg-base)' }} strokeWidth={2} />
                  <text x={cx} y={top + 12} textAnchor="middle" fontSize={11.5} fontWeight={700} style={{ fill: active ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {lines.map((ln, k) => (
                      <tspan key={k} x={cx} dy={k === 0 ? 0 : 13}>{ln}</tspan>
                    ))}
                  </text>
                  <text x={cx} y={top + 12 + 13 * lines.length} textAnchor="middle" fontSize={11} fontWeight={600} style={{ fill: 'var(--text-secondary)' }}>
                    {r.value}
                    {r.change ? <tspan fontWeight={400} style={{ fill: 'var(--text-tertiary)' }}> ({r.change})</tspan> : null}
                    <tspan dx={4} fontSize={10} fontWeight={800} style={{ fill: r.better === 'up' ? 'var(--pos)' : 'var(--neg)' }}>{r.better === 'up' ? '▲' : '▼'}</tspan>
                  </text>
                  <text x={cx} y={top + 12 + 13 * lines.length + 12} textAnchor="middle" fontSize={9.5} style={{ fill: 'var(--text-muted)' }}>
                    {r.asOf}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* hover detail */}
          {hovered && (
            <div
              role="status"
              style={{
                position: 'absolute',
                left: `${(px(hovered.x) / VB_W) * 100}%`,
                top: `${(py(hovered.x, meta.peakAt) / VB_H) * 100}%`,
                transform: `translate(${hovered.x > 0.7 ? '-105%' : '14px'}, 12px)`,
                pointerEvents: 'none',
                background: 'var(--bg-elevated-2)', border: '1px solid var(--border-strong)', borderRadius: 10,
                boxShadow: 'var(--shadow-card)', padding: '8px 11px', minWidth: 190, zIndex: 2,
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{hovered.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                <span style={mono}>{hovered.value}</span>
                {hovered.change ? <span style={{ color: 'var(--text-tertiary)' }}> ({hovered.change})</span> : null}
                {' '}<BetterArrow dir={hovered.better} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{hovered.asOf} · {hovered.source}</div>
              <div style={{ marginTop: 6 }}><SignalPill signal={hovered.signal} /></div>
            </div>
          )}
        </div>
      </div>

      {showTable && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Indicator', 'Latest', 'Change / note', 'As of', 'Better direction', 'Signal', 'Source'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</td>
                  <td style={{ ...tdStyle, ...mono }}>{r.value}</td>
                  <td style={tdStyle}>{r.change ?? '—'}</td>
                  <td style={tdStyle}>{r.asOf}</td>
                  <td style={tdStyle}><BetterArrow dir={r.better} /> {r.better === 'up' ? 'Increase' : 'Decrease'}</td>
                  <td style={tdStyle}><SignalPill signal={r.signal} /></td>
                  <td style={{ ...tdStyle, whiteSpace: 'normal' }}>{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}

const thStyle: CSSProperties = {
  textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
  color: 'var(--text-tertiary)', fontWeight: 700, padding: '6px 10px', borderBottom: '1px solid var(--border-strong)',
  whiteSpace: 'nowrap',
};
const tdStyle: CSSProperties = {
  fontSize: 12.5, color: 'var(--text-secondary)', padding: '6px 10px',
  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
};

function LegendItem({ color, label, sub }: { color: string; label: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
      <span aria-hidden style={{ width: 12, height: 12, borderRadius: 999, background: color, border: '2px solid var(--bg-base)', boxShadow: '0 0 0 1px var(--border-strong)' }} />
      <span><strong style={{ color: 'var(--text-primary)' }}>{label}</strong>{sub ? <span style={{ color: 'var(--text-tertiary)' }}> {sub}</span> : null}</span>
    </div>
  );
}

function BreadthTiles() {
  const reads = useMemo(() => breadth(), []);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
      {reads.map((b) => {
        const meta = GROUPS.find((g) => g.id === b.group)!;
        const label = breadthLabel(b);
        const tone = label === 'Broadly expanding' ? 'var(--pos)' : label === 'Broadly contracting' ? 'var(--neg)' : 'var(--severity-medium)';
        return (
          <GlassCard key={b.group} variant="nested" padding={16}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-tertiary)' }}>{meta.title}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <span style={{ ...mono, fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>{b.expansion}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}> / {b.total}</span></span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>signalling expansion</span>
            </div>
            <div style={{ display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', marginTop: 10, gap: 2, background: 'var(--border)' }}>
              <span style={{ width: `${b.expansionShare * 100}%`, background: 'var(--pos)' }} />
              <span style={{ flex: 1, background: 'var(--neg)' }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: tone }}>{label}</div>
          </GlassCard>
        );
      })}
    </div>
  );
}

function CycleTab() {
  return (
    <>
      <GlassCard variant="default" padding={20}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ maxWidth: 680 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>U.S. business cycle indicators: leading, coincident and lagging</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '8px 0 0' }}>
              Multiple indicators, a broader perspective. Each dot is one indicator placed where its latest reading
              sits on a stylised cycle curve. Hover a dot for the detail; use <em>Show as table</em> for the
              screen-reader / copy-paste view. Latest data available as of <strong>{SNAPSHOT.releasesAsOf}</strong>{' '}
              (market data through <strong>{SNAPSHOT.marketDataThrough}</strong>). Values are rounded.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 8, minWidth: 250 }}>
            <LegendItem color={SIGNAL_COLOR.expansion} label="Expansion signal" sub="(on upswing)" />
            <LegendItem color={SIGNAL_COLOR.transition} label="Trough or peak" sub="/ transition" />
            <LegendItem color={SIGNAL_COLOR.contraction} label="Contraction signal" sub="(on downswing)" />
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
              <div><BetterArrow dir="up" /> Increase is generally better</div>
              <div><BetterArrow dir="down" /> Decrease is generally better</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Arrow = the direction that is better for the economy for that indicator.</div>
            </div>
          </div>
        </div>
      </GlassCard>

      <BreadthTiles />

      {GROUPS.map((g) => (
        <CyclePanel key={g.id} meta={g} />
      ))}

      <div className="econ-footer-grid">
        <GlassCard variant="nested" padding={16}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>Context matters</div>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            No single indicator determines a recession or expansion. The NBER dates business cycles using a broad set of
            coincident indicators. <strong>Follow the direction. Look for breadth. Use the data.</strong>
          </p>
        </GlassCard>
        <GlassCard variant="nested" padding={16}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>Sources</div>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {SNAPSHOT.sources} Latest releases as of {SNAPSHOT.releasesAsOf}; market data through {SNAPSHOT.marketDataThrough}.
            Values are rounded. The readings on this page are a dated snapshot for teaching — refresh them from the source
            agencies before relying on them.
          </p>
        </GlassCard>
      </div>

      <details style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}>Compare with the source graphic</summary>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '8px 0' }}>
          The reference image this chart was rebuilt from. Note: the source draws LEI with a down arrow; this page uses
          an up arrow because a rising LEI is the better direction (the legend&apos;s own rule).
        </p>
        <img
          src="/economic-cycles/business-cycle-indicators-source.webp"
          alt="Source graphic: U.S. Business Cycle Indicators — Leading, Coincident and Lagging"
          style={{ width: '100%', height: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}
          loading="lazy"
        />
      </details>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — CPA tax reference gallery
// ---------------------------------------------------------------------------

interface RefImage {
  id: string;
  title: string;
  caption: string;
  /** Path under public/ (served from the site root). */
  src: string;
  section: string;
  /** True while the file has not been added to public/economic-cycles/ yet. */
  pending?: boolean;
}

const REFERENCE_IMAGES: RefImage[] = [
  {
    id: 'debt-basis-grid',
    section: 'Debt, liabilities & basis',
    title: 'Debt & basis master comparison grid',
    caption: 'Fifteen liability fact patterns side by side: partnership outside basis (§752), S-corp shareholder stock/debt basis (§1366(d)), and the separate at-risk limitation (§465).',
    src: '/economic-cycles/debt-basis-master-comparison-grid.png',
  },
  {
    id: 'tcp-liabilities',
    section: 'Debt, liabilities & basis',
    title: 'TCP: Partnership vs. S-Corp — liabilities and debt basis',
    caption: 'The biggest TCP distinction: partnership liabilities can lift outside basis under §752 even when the partner lent nothing; S-corp liabilities need bona fide debt running directly to the shareholder (§1366(d)).',
    src: '/economic-cycles/tcp-partnership-vs-scorp-liabilities.png',
  },
  {
    id: 'property-contribution-distribution',
    section: 'Contributions & distributions',
    title: 'Property contribution & distribution — all entities at a glance',
    caption: 'What value is used (FMV or NBV), when gain is recognised, and how basis is determined for partnerships (§721–§723, §731–§734), S-corps (§351, §362, §311(b), §1368) and C-corps (§301, §311(b), §316, §336), with worked examples.',
    src: '/economic-cycles/property-contribution-distribution-all-entities.webp',
  },
  {
    id: 'partnership-workflow',
    section: 'End-to-end workflows',
    title: 'Partnership (GP/LP) end-to-end workflow — 20% partner example',
    caption: 'Formation → operations → nonliquidating distribution → sale/transfer of interest → liquidation → Forms 1065 / K-1 / 1040, with the partner\'s outside basis tracked at every step.',
    src: '/economic-cycles/partnership-end-to-end-workflow.webp',
  },
  {
    id: 'scorp-workflow',
    section: 'End-to-end workflows',
    title: 'S-Corporation end-to-end workflow (swimlane diagram)',
    caption: 'Contribution (§351, §362) → operations (§1366, §1367) → nonliquidating distribution (§311(b), §1368) → liquidation (§331, §336) → Forms 1120-S / 1040, with stock basis tracked across the swimlanes.',
    src: '/economic-cycles/scorp-end-to-end-workflow.webp',
  },
  {
    id: 'ccorp-workflow',
    section: 'End-to-end workflows',
    title: 'C-Corporation end-to-end workflow — 80% shareholder example',
    caption: 'Formation (§351, §362, §358) → operations (§11, §312, §316) → nonliquidating distribution (§301, §311, §316) → liquidation (§331, §336, §337) → shareholder basis, E&P and Forms 1120 / 1099-DIV / 1040.',
    src: '/economic-cycles/ccorp-end-to-end-workflow.webp',
  },
  {
    id: 'tcp-all-entities',
    section: 'All entities — IRC rules + easy math',
    title: 'CPA TCP: all business entities — IRC rules + easy math',
    caption: 'One grid for partnership, S-corp and C-corp across contribution, operations & gain character, debt & loss limitations, nonliquidating distribution, sale/liquidation and tax forms, plus the asset-specific sections (§1231, §1245, §1250, §751).',
    src: '/economic-cycles/cpa-tcp-all-entities-irc-rules.webp',
  },
];

function fileNameOf(src: string): string {
  return src.split('/').pop() ?? src;
}

function PendingPlaceholder({ img }: { img: RefImage }) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        minHeight: 180, borderRadius: 10, border: '1px dashed var(--border-strong)', background: 'var(--bg-elevated-2)',
        color: 'var(--text-tertiary)', padding: 16, textAlign: 'center',
      }}
    >
      <ImageOff size={22} />
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Image not uploaded yet</div>
      <div style={{ fontSize: 11.5, lineHeight: 1.5 }}>
        Drop the file in the repo at <span style={mono}>public/economic-cycles/{fileNameOf(img.src)}</span> and push.
      </div>
    </div>
  );
}

function Lightbox({ img, onClose }: { img: RefImage; onClose: () => void }) {
  const [actualSize, setActualSize] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={img.title}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.82)', display: 'flex',
        flexDirection: 'column', padding: 16, gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, color: '#fafaf7' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.title}</div>
          <div style={{ fontSize: 11.5, opacity: 0.75 }}>Click the image to toggle fit / actual size · Esc to close</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <a
            href={img.src}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#fafaf7', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 999, padding: '6px 12px' }}
          >
            <ExternalLink size={13} /> Open file
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#fafaf7', background: 'transparent', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 999, padding: '6px 12px', cursor: 'pointer' }}
          >
            <X size={13} /> Close
          </button>
        </div>
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', alignItems: actualSize ? 'flex-start' : 'center', justifyContent: actualSize ? 'flex-start' : 'center' }}
      >
        <img
          src={img.src}
          alt={img.title}
          onClick={() => setActualSize((v) => !v)}
          style={
            actualSize
              ? { cursor: 'zoom-out', maxWidth: 'none', display: 'block' }
              : { cursor: 'zoom-in', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', borderRadius: 6 }
          }
        />
      </div>
    </div>
  );
}

function ReferenceTab() {
  const [open, setOpen] = useState<RefImage | null>(null);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const sections = useMemo(() => {
    const order: string[] = [];
    const by: Record<string, RefImage[]> = {};
    for (const img of REFERENCE_IMAGES) {
      if (!by[img.section]) {
        by[img.section] = [];
        order.push(img.section);
      }
      by[img.section].push(img);
    }
    return order.map((s) => ({ section: s, images: by[s] }));
  }, []);

  return (
    <>
      <GlassCard variant="default" padding={20}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>CPA tax reference — entity basis, contributions, distributions and workflows</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '8px 0 0', maxWidth: 820 }}>
          Study diagrams for the TCP (Tax Compliance and Planning) section: how liabilities and basis work in a
          partnership vs. an S-corp, what value is used and when gain is recognised on property contributions and
          distributions across all three entities, and the end-to-end workflow for each entity with worked numbers.
          Click any card to view it full size. More diagrams will be added here over time.
        </p>
      </GlassCard>

      {sections.map(({ section, images }) => (
        <section key={section}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--accent)', margin: '4px 0 10px' }}>{section}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {images.map((img) => {
              const missing = img.pending || failed[img.id];
              return (
                <GlassCard key={img.id} variant="default" padding={14} interactive={!missing} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {missing ? (
                    <PendingPlaceholder img={img} />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(img);
                        track('econ_ref_open', { image: img.id });
                      }}
                      aria-label={`View ${img.title} full size`}
                      style={{ position: 'relative', padding: 0, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--bg-elevated-2)', cursor: 'zoom-in' }}
                    >
                      <img
                        src={img.src}
                        alt={img.title}
                        loading="lazy"
                        onError={() => setFailed((f) => ({ ...f, [img.id]: true }))}
                        style={{ width: '100%', height: 220, objectFit: 'contain', display: 'block' }}
                      />
                      <span
                        aria-hidden
                        style={{ position: 'absolute', right: 8, bottom: 8, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-elevated-2)', border: '1px solid var(--border-strong)', borderRadius: 999, padding: '4px 9px' }}
                      >
                        <Maximize2 size={11} /> Full size
                      </span>
                    </button>
                  )}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{img.title}</div>
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '6px 0 0' }}>{img.caption}</p>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>
      ))}

      {open && <Lightbox img={open} onClose={() => setOpen(null)} />}
    </>
  );
}


// ---------------------------------------------------------------------------
// Tab 3 — digital rebuild of two reference diagrams (data-driven, corrected)
// ---------------------------------------------------------------------------

const VERDICT_TONE: Record<GridCell['verdict'], { color: string; label: string }> = {
  yes: { color: 'var(--pos)', label: 'Yes' },
  no: { color: 'var(--neg)', label: 'No' },
  conditional: { color: 'var(--severity-medium)', label: 'Conditional' },
  note: { color: 'var(--text-tertiary)', label: '' },
};

function VerdictCell({ cell }: { cell: GridCell }) {
  const t = VERDICT_TONE[cell.verdict];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {t.label && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: t.color }}>
          <span aria-hidden style={{ width: 7, height: 7, borderRadius: 999, background: t.color }} />
          {t.label}
        </span>
      )}
      {cell.text && <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{cell.text}</span>}
    </div>
  );
}

function DebtBasisGrid() {
  return (
    <GlassCard variant="default" padding={0} style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px 10px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Debt &amp; basis master comparison grid</h3>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '6px 0 0' }}>
          &ldquo;Basis&rdquo; means partnership outside basis or S-corp shareholder stock/debt basis. The partnership
          column assumes the liability is allocated as described. A partnership liability can increase outside basis
          without satisfying the separate at-risk limitation, and a guarantee&apos;s treatment depends on its actual
          enforceability and economic substance.
        </p>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr>
              {['#', 'Debt / liability fact pattern', 'Partnership basis §752', 'S-Corp shareholder basis §1366(d)', 'At-risk §465'].map((h) => (
                <th key={h} style={{ ...thStyle, whiteSpace: 'normal', background: 'var(--bg-elevated-2)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEBT_BASIS_GRID.map((r) => (
              <tr key={r.n}>
                <td style={{ ...tdStyle, ...mono, verticalAlign: 'top', color: 'var(--text-muted)' }}>{r.n}</td>
                <td style={{ ...tdStyle, whiteSpace: 'normal', verticalAlign: 'top', fontWeight: 600, color: 'var(--text-primary)', minWidth: 180 }}>{r.pattern}</td>
                <td style={{ ...tdStyle, whiteSpace: 'normal', verticalAlign: 'top' }}><VerdictCell cell={r.partnership} /></td>
                <td style={{ ...tdStyle, whiteSpace: 'normal', verticalAlign: 'top' }}><VerdictCell cell={r.sCorp} /></td>
                <td style={{ ...tdStyle, whiteSpace: 'normal', verticalAlign: 'top' }}><VerdictCell cell={r.atRisk} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

interface LaneCell {
  code: string;
  title: string;
  rows?: { label: string; value: string; strong?: boolean; tone?: 'pos' | 'neg' }[];
  notes?: string[];
  /** Index into SCORP_CORRECTIONS when this cell corrects the image. */
  corrected?: boolean;
}

function SwimCell({ cell }: { cell: LaneCell }) {
  return (
    <div
      style={{
        border: `1px solid ${cell.corrected ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 10,
        background: 'var(--bg-elevated-2)', padding: '10px 12px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ ...mono, fontSize: 10.5, fontWeight: 700, color: 'var(--accent)' }}>{cell.code}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{cell.title}</span>
        {cell.corrected && (
          <span title="This cell corrects the source image" style={{ marginLeft: 'auto', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.06em', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 5, padding: '1px 5px' }}>
            CORRECTED
          </span>
        )}
      </div>
      {cell.rows && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            {cell.rows.map((r) => (
              <tr key={r.label}>
                <td style={{ fontSize: 11.5, color: r.strong ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: r.strong ? 700 : 400, padding: '2px 6px 2px 0', borderBottom: '1px solid var(--border)', lineHeight: 1.35 }}>{r.label}</td>
                <td style={{ ...mono, fontSize: 11.5, textAlign: 'right', whiteSpace: 'nowrap', padding: '2px 0', borderBottom: '1px solid var(--border)', fontWeight: r.strong ? 700 : 500, color: r.tone === 'pos' ? 'var(--pos)' : r.tone === 'neg' ? 'var(--neg)' : 'var(--text-primary)' }}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {cell.notes && (
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          {cell.notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      )}
    </div>
  );
}

function SCorpSwimlane() {
  const w = useMemo(() => sCorpWorkflow(SCORP_EXAMPLE), []);
  const a = w.a;
  const pct = `${(a.ownership * 100).toFixed(0)}%`;
  const stages = [
    { n: 1, title: 'Contribution', refs: '§351, §358, §362' },
    { n: 2, title: 'Operations & income', refs: '§1366, §1367' },
    { n: 3, title: 'Nonliquidating distribution', refs: '§311(b), §1368' },
    { n: 4, title: 'Liquidation', refs: '§331, §336' },
    { n: 5, title: 'Tax return', refs: 'Forms 1120-S, K-1, 1040' },
  ];
  const lanes: { title: string; sub: string; cells: LaneCell[] }[] = [
    {
      title: 'S-Corp', sub: 'entity level',
      cells: [
        { code: '1A', title: 'Receive property', rows: [
          { label: `Asset received: ${a.contribution.asset}`, value: '' },
          { label: 'Tax basis (carryover, §362)', value: fmtAmt(a.contribution.basis) },
          { label: 'FMV', value: fmtAmt(a.contribution.fmv) },
          { label: 'Gain recognised (§351 control ≥ 80%)', value: fmtAmt(w.contributionGain), strong: true },
        ] },
        { code: '2A', title: 'Operate the business', rows: [
          { label: 'Ordinary income', value: fmtAmt(a.operations.ordinaryIncome) },
          { label: 'Depreciation', value: fmtAmt(-a.operations.depreciation) },
          { label: 'Other deductions', value: fmtAmt(-a.operations.otherDeductions) },
          { label: 'Net income (passes through)', value: fmtAmt(w.netIncome), strong: true },
        ], notes: ['No entity-level tax (S-corp).'] },
        { code: '3A', title: 'Distribute appreciated property', rows: [
          { label: `Asset distributed: ${a.distribution.asset}`, value: '' },
          { label: 'FMV', value: fmtAmt(a.distribution.fmv) },
          { label: 'Tax basis', value: fmtAmt(a.distribution.basis) },
          { label: 'Entity gain recognised (§311(b))', value: fmtAmt(w.entityGainOnDistribution), strong: true },
        ], notes: ['Treated as if sold at FMV; gain passes through to shareholders (§1366) and is separately stated on K-1.'] },
        { code: '4A', title: 'Liquidate (§336)', rows: [
          { label: 'Remaining asset: cash', value: fmtAmt(a.liquidation.cash) },
          { label: 'Tax basis', value: fmtAmt(a.liquidation.cash) },
          { label: 'Entity gain', value: fmtAmt(w.entityGainOnLiquidation), strong: true },
        ], notes: ['No entity-level tax; the corporation terminates.'] },
        { code: '5A', title: 'File Form 1120-S (final)', notes: [
          `Ordinary business income ${fmtAmt(w.netIncome)} and the separately stated §311(b) gain ${fmtAmt(w.entityGainOnDistribution)}.`,
          'Schedule K-1 to each shareholder; mark the final return.',
        ] },
      ],
    },
    {
      title: 'Shareholder', sub: `${pct} owner`,
      cells: [
        { code: '1B', title: 'Contribute property', rows: [
          { label: 'Basis in stock received (§358)', value: fmtAmt(w.initialStockBasis), strong: true },
          { label: 'Gain to shareholder', value: fmtAmt(w.contributionGain) },
        ], notes: [`Owns ${pct} of the stock.`] },
        { code: '2B', title: 'Receive K-1 allocations', rows: [
          { label: `Share of net income (${pct} × ${fmtAmt(w.netIncome)})`, value: fmtAmt(w.incomeShare), strong: true },
        ], notes: ['Reported on Form 1040 (Schedule E, from K-1 box 1); increases stock basis.'] },
        { code: '3B', title: 'Receive the property', corrected: true, rows: [
          { label: `Share of §311(b) gain (${pct} × ${fmtAmt(w.entityGainOnDistribution)})`, value: fmtAmt(w.gainShare), tone: 'neg' },
          { label: 'Distribution amount (FMV of property)', value: fmtAmt(w.distributionAmount) },
          { label: 'Gain on the distribution itself (excess over basis)', value: fmtAmt(w.distributionGain), strong: true },
          { label: `Basis in ${a.distribution.asset.toLowerCase()} received (FMV)`, value: fmtAmt(w.shareholderBasisInProperty) },
        ], notes: ['The pass-through gain is taxable now; the distribution is tax-free only to the extent of stock basis, and the excess (if any) is capital gain (§1368(b)(2)).'] },
        { code: '4B', title: 'Receive liquidating distribution', corrected: true, rows: [
          { label: `Cash received (${pct} × ${fmtAmt(a.liquidation.cash)})`, value: fmtAmt(w.liquidationCash) },
          { label: 'Stock basis before', value: fmtAmt(w.steps[3].basis) },
          { label: 'Capital gain recognised (§331)', value: fmtAmt(w.liquidationGain), strong: true, tone: 'neg' },
        ] },
        { code: '5B', title: 'File Form 1040', notes: [
          `Ordinary income ${fmtAmt(w.incomeShare)} (Schedule E).`,
          `Capital gain from the property distribution ${fmtAmt(w.gainShare + w.distributionGain)} and from liquidation ${fmtAmt(w.liquidationGain)} (Schedule D / Form 8949).`,
          'Capital gains taxed at 0% / 15% / 20% depending on income.',
        ] },
      ],
    },
    {
      title: 'Basis tracking', sub: 'stock basis',
      cells: [
        { code: '1C', title: 'Initial stock basis', rows: [
          { label: 'Basis in contributed property', value: fmtAmt(w.initialStockBasis) },
          { label: 'Stock basis', value: fmtAmt(w.steps[0].basis), strong: true },
        ] },
        { code: '2C', title: 'Increase for income', rows: [
          { label: 'Beginning basis', value: fmtAmt(w.steps[0].basis) },
          { label: '+ Share of income', value: fmtAmt(w.incomeShare) },
          { label: 'Ending basis', value: fmtAmt(w.steps[1].basis), strong: true },
        ] },
        { code: '3C', title: 'Gain first, then the distribution', corrected: true, rows: [
          { label: 'Beginning basis', value: fmtAmt(w.steps[1].basis) },
          { label: '+ Share of §311(b) gain', value: fmtAmt(w.gainShare) },
          { label: '= Basis before distribution', value: fmtAmt(w.steps[2].basis) },
          { label: '− Distribution (FMV, limited to basis)', value: fmtAmt(w.steps[3].applied) },
          { label: 'Ending basis (never below zero)', value: fmtAmt(w.steps[3].basis), strong: true },
        ], notes: ['Ordering: increases for income/gain first, then distributions (Reg. §1.1367-1(f)).'] },
        { code: '4C', title: 'Final basis at liquidation', corrected: true, rows: [
          { label: 'Beginning basis', value: fmtAmt(w.steps[3].basis) },
          { label: '− Cash received (limited to basis)', value: fmtAmt(w.steps[4].applied) },
          { label: 'Excess = capital gain', value: fmtAmt(w.liquidationGain) },
          { label: 'Ending basis', value: fmtAmt(w.finalBasis), strong: true },
        ] },
        { code: '5C', title: 'Stock basis summary', rows: [
          { label: 'Initial basis', value: fmtAmt(w.initialStockBasis) },
          { label: '+ Share of income', value: fmtAmt(w.incomeShare) },
          { label: '+ Share of §311(b) gain', value: fmtAmt(w.gainShare) },
          { label: '− Property distribution', value: fmtAmt(w.steps[3].applied) },
          { label: '− Liquidating cash', value: fmtAmt(w.steps[4].applied) },
          { label: 'Ending basis', value: fmtAmt(w.finalBasis) },
          { label: 'Total capital gains recognised', value: fmtAmt(w.totalCapitalGain), strong: true, tone: 'neg' },
        ] },
      ],
    },
    {
      title: 'Tax reporting', sub: 'forms & items',
      cells: [
        { code: '1D', title: 'No immediate reporting', notes: ['No gain on the §351 contribution.', 'No K-1 item.', 'Keep records of the property\'s basis and FMV.'] },
        { code: '2D', title: 'Annual reporting', notes: ['Form 1120-S: ordinary income, deductions, credits.', `K-1 to the shareholder; Form 1040 reports ${fmtAmt(w.incomeShare)} ordinary income.`] },
        { code: '3D', title: 'Reporting the distribution', notes: [
          `Form 1120-S: ${fmtAmt(w.entityGainOnDistribution)} §311(b) gain, separately stated.`,
          `K-1: shareholder\'s share ${fmtAmt(w.gainShare)} (capital / §1231 character follows the asset).`,
          'Shareholder reports it on Schedule D / Form 8949.',
        ] },
        { code: '4D', title: 'Final return', notes: [
          'Form 1120-S final return; issue final K-1s.',
          `Shareholder reports the §331 liquidation gain ${fmtAmt(w.liquidationGain)} on Schedule D / Form 8949.`,
        ] },
        { code: '5D', title: 'Key forms & K-1 items', rows: [
          { label: 'Form 1120-S', value: 'entity return' },
          { label: 'Schedule K-1', value: 'ordinary · cap. gains' },
          { label: 'Form 1040', value: 'Sch. E · Sch. D' },
          { label: 'Form 8949 / Sch. D', value: 'capital gains' },
        ] },
      ],
    },
  ];

  return (
    <GlassCard variant="default" padding={0} style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px 12px', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ maxWidth: 640 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>S-corporation end-to-end workflow — {pct} shareholder example</h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '6px 0 0' }}>
            Contribution → operations → nonliquidating property distribution → liquidation → tax return. Every number
            below is computed from the assumptions on the right by <span style={mono}>sCorpWorkflow()</span>, with stock
            basis rolled forward under the §1367 ordering rules and floored at zero. Cells marked{' '}
            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.06em', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 5, padding: '1px 5px' }}>CORRECTED</span>{' '}
            differ from the source image — see the list underneath.
          </p>
        </div>
        <GlassCard variant="nested" padding={12} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, minWidth: 260 }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>Example assumptions</div>
          <div>Shareholder owns <strong>{pct}</strong>.</div>
          <div>Contributes {a.contribution.asset.toLowerCase()} with basis <span style={mono}>{fmtAmt(a.contribution.basis)}</span> and FMV <span style={mono}>{fmtAmt(a.contribution.fmv)}</span>.</div>
          <div>Entity earns net income <span style={mono}>{fmtAmt(w.netIncome)}</span>.</div>
          <div>Later distributes the {a.distribution.asset.toLowerCase()} (FMV <span style={mono}>{fmtAmt(a.distribution.fmv)}</span>) to this shareholder, then liquidates with cash <span style={mono}>{fmtAmt(a.liquidation.cash)}</span>.</div>
        </GlassCard>
      </div>

      <div style={{ overflowX: 'auto', padding: '0 18px 18px' }}>
        <div style={{ minWidth: 1100 }}>
          <div className="econ-swim-head">
            <div />
            {stages.map((s) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
                <span className="center" style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--accent)', color: 'var(--accent-contrast)', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{s.n}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{s.title}</div>
                  <div style={{ ...mono, fontSize: 10, color: 'var(--text-tertiary)' }}>{s.refs}</div>
                </div>
              </div>
            ))}
          </div>
          {lanes.map((lane) => (
            <div key={lane.title} className="econ-swim-row">
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{lane.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{lane.sub}</div>
              </div>
              {lane.cells.map((c) => <SwimCell key={c.code} cell={c} />)}
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px 18px' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>
          Corrections vs. the source image
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
          {SCORP_CORRECTIONS.map((c) => (
            <GlassCard key={c.cell} variant="nested" padding={12}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{c.cell}</div>
              <div style={{ fontSize: 11.5, color: 'var(--neg)', marginTop: 4, lineHeight: 1.45 }}><strong>Image:</strong> {c.image}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45 }}><strong style={{ color: 'var(--pos)' }}>Correct:</strong> {c.correct}</div>
              <div style={{ ...mono, fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 6 }}>{c.ref}</div>
            </GlassCard>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function DigitalTab() {
  return (
    <>
      <GlassCard variant="default" padding={20}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Digital rebuild — the reference diagrams as data, corrected</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '8px 0 0', maxWidth: 860 }}>
          The diagrams on tab 2 are AI-generated images: dense and useful, but they cannot be edited where they are
          wrong, they ignore light/dark mode, and nothing in them is searchable or testable. This tab rebuilds two of
          them as data in the app itself. The comparison grid becomes a real table; the S-corp workflow becomes a
          swimlane whose numbers are <strong>computed from the assumptions</strong> and checked by unit tests, with
          each correction to the image called out. If this format works, the remaining diagrams follow the same
          pattern. Study material only; not tax advice.
        </p>
      </GlassCard>
      <DebtBasisGrid />
      <SCorpSwimlane />
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EconomicCycles() {
  const [tab, setTab] = useState<TabId>('cycle');

  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        padding: '48px 24px', maxWidth: 1400, margin: '0 auto', width: '100%',
      }}
    >
      <style>{`
        .econ-panel { display: grid; grid-template-columns: 210px minmax(0, 1fr); gap: 0; align-items: stretch; }
        .econ-rail { padding: 18px 16px; border-right: 1px solid var(--border); background: var(--bg-elevated-2); }
        .econ-footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .econ-swim-head, .econ-swim-row { display: grid; grid-template-columns: 120px repeat(5, minmax(0, 1fr)); gap: 8px; margin-bottom: 8px; align-items: stretch; }
        @media (max-width: 900px) {
          .econ-panel { grid-template-columns: 1fr; }
          .econ-rail { border-right: none; border-bottom: 1px solid var(--border); }
          .econ-footer-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <header style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <Sparkles size={14} />
            <span>FAST Insights</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              <ArrowLeft size={15} /> All tools
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Economic Cycles</h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 10, maxWidth: 760, lineHeight: 1.6 }}>
          Where the U.S. economy is in the business cycle, read three ways: <strong>leading</strong> indicators that
          turn first, <strong>coincident</strong> indicators that move with it, and <strong>lagging</strong> indicators
          that confirm it. A second tab holds CPA tax reference diagrams (entity basis, contributions, distributions
          and end-to-end workflows), and a third rebuilds them as corrected, data-driven pages. <strong>Education only; not investment, accounting, or tax advice.</strong>
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  track('econ_tab', { tab: t.id });
                }}
                aria-pressed={active}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                  fontSize: 13.5, fontWeight: 600, borderRadius: 'var(--radius-md)', cursor: 'pointer',
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {tab === 'cycle' && <CycleTab />}
        {tab === 'reference' && <ReferenceTab />}
        {tab === 'digital' && <DigitalTab />}
      </div>

      <footer style={{ marginTop: 'auto', paddingTop: 48, color: 'var(--text-tertiary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={13} />
        <span>
          Reference material for study — education only; not investment, accounting, or tax advice. Indicator values
          are a dated snapshot; verify against the source agencies before use.
        </span>
      </footer>
    </div>
  );
}
