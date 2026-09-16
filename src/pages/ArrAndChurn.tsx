// ARR and Churn — one 12-month period, three numbers, two columns.
//
// A subscription business keeps customers; a nonprofit keeps donors. The same
// rows tell both stories, so the page reads like a working schedule rather than
// a dashboard: a headline figure with a status pill, the arithmetic, a plain
// SVG visual, then paragraphs that rewrite themselves from the numbers.
//
// All the math and all the copy live in src/lib/arrAndChurn.ts. This file is
// layout only — if you are changing a sentence, you are in the wrong file.
//
// Palette: this module is a deliberately fixed light "paper" document and does
// not follow the app's dark theme, which is the design as reviewed. Two colors
// are mapped to the repo's tokens so there is only one brand green and one ink:
// GREEN = --accent (light) and INK = --text-primary (light). The paper
// neutrals and the amber warning scale are the module's own — the repo has no
// light-mode equivalent for them. Hex, not var(), because var() would flip with
// the theme and invert the page. Nothing here is a second design system.

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  BLANK,
  DEMO,
  HOW,
  VOCAB,
  asStrings,
  calc,
  explain,
  int,
  num,
  pct,
  short,
  usd,
  type ColumnKind,
  type Pill as PillValue,
  type RawInputs,
} from '../lib/arrAndChurn';

const PAPER = '#F6F6F3';
const WHITE = '#FFFFFF';
const INK = '#0a0a0a'; // repo --text-primary (light)
const MUTED = '#63635E';
const RULE = '#D8D8D1';
const BAND = '#ECECE6';
const GREEN = '#006d04'; // repo --accent (light)
const GREEN_SOFT = '#D8E5D6';
const GREEN_INK = '#006d04';
const GREEN_CONTRAST = '#FFFFFF'; // repo --accent-contrast (light)
const AMBER = '#E6A23C';
const AMBER_SOFT = '#F6E3BF';
const AMBER_INK = '#8F5E06';

const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS = 'var(--font-ui)';
const tabular: CSSProperties = { fontVariantNumeric: 'tabular-nums' };

// The app's global stylesheet colors every heading with --text-primary, which
// is near-white in dark mode. Headings on the paper set their own ink.
const heading = (size: number): CSSProperties => ({
  fontFamily: SERIF,
  fontSize: size,
  lineHeight: 1.1,
  margin: 0,
  fontWeight: 400,
  letterSpacing: 'normal',
  color: INK,
});

// ---------------------------------------------------------------------------
// Small parts
// ---------------------------------------------------------------------------

function Section({ title, def, children }: { title: string; def: string; children: ReactNode }) {
  return (
    <section style={{ padding: '28px 0', borderBottom: `1px solid ${RULE}` }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={heading(24)}>{title}</h2>
        <p style={{ marginTop: 4, fontSize: 14, color: MUTED, maxWidth: 640, lineHeight: 1.5 }}>{def}</p>
      </div>
      <div className="ac-cols">{children}</div>
    </section>
  );
}

function ColumnLabel({ title }: { title: string }) {
  return (
    <div style={{ fontSize: 12, color: MUTED, borderBottom: `1px solid ${INK}`, paddingBottom: 4 }}>{title}</div>
  );
}

function Row({
  sign,
  label,
  note,
  children,
  strong,
  muted,
}: {
  sign?: string;
  label: string;
  note?: string;
  children?: ReactNode;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${RULE}`, fontSize: 13, padding: '5px 0', minHeight: 34 }}>
      <span style={{ flex: '0 0 16px', textAlign: 'center', color: MUTED }}>{sign || ''}</span>
      <span style={{ flex: '1 1 0%', minWidth: 0, color: muted ? MUTED : INK, fontWeight: strong ? 600 : 400, lineHeight: 1.3 }}>
        {label}
        {note ? <span style={{ color: MUTED }}> ({note})</span> : null}
      </span>
      <span className="ac-val" style={{ ...tabular, flex: '0 0 auto', textAlign: 'right', fontWeight: strong ? 600 : 400, color: muted ? MUTED : INK }}>
        {children}
      </span>
    </div>
  );
}

/**
 * Grouped figures at rest (1,600,000), the plain number while you edit, and a
 * clamp at zero on commit. Accepts a pasted "$1,250.00".
 */
function NumInput({
  id,
  label,
  value,
  onChange,
  money,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  money?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const shown = editing ? draft : value === '' ? '' : int(num(value));
  return (
    <span className="ac-num" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', background: WHITE, border: `1px solid ${RULE}`, padding: '3px 6px' }}>
      {money ? <span style={{ color: MUTED, marginRight: 4 }}>$</span> : null}
      <input
        id={id}
        aria-label={label}
        className="ac-input"
        inputMode="decimal"
        placeholder="0"
        style={{ ...tabular, width: '100%', textAlign: 'right', background: 'transparent', border: 0, padding: 0, fontSize: 13, color: INK, fontFamily: SANS, minWidth: 0 }}
        value={shown}
        onFocus={() => {
          setDraft(value === '' ? '' : String(num(value)));
          setEditing(true);
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          const t = draft.trim();
          onChange(t === '' ? '' : String(Math.max(0, num(t))));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
    </span>
  );
}

function Pill({ tone, children }: { tone: 'good' | 'flat' | 'warn'; children: ReactNode }) {
  const c = tone === 'good' ? { bg: GREEN_SOFT, ink: GREEN_INK } : tone === 'warn' ? { bg: AMBER_SOFT, ink: AMBER_INK } : { bg: BAND, ink: MUTED };
  return <span style={{ fontSize: 12, background: c.bg, color: c.ink, padding: '3px 8px', whiteSpace: 'nowrap' }}>{children}</span>;
}

function Big({ value, label, pill }: { value: string; label: string; pill: PillValue }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, padding: '16px 0' }}>
      <div>
        <div style={{ fontFamily: SERIF, fontSize: 32, lineHeight: 1, ...tabular }}>{value}</div>
        <div style={{ marginTop: 8, fontSize: 12, color: MUTED }}>{label}</div>
      </div>
      {pill ? <Pill tone={pill.tone}>{pill.text}</Pill> : null}
    </div>
  );
}

function Explain({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, lineHeight: 1.55, maxWidth: 520 }}>
      {paragraphs.filter(Boolean).map((p, i) => (
        <p key={i} style={{ margin: 0 }}>{p}</p>
      ))}
    </div>
  );
}

function Warnings({ items }: { items: string[] }) {
  if (!items || !items.length) return null;
  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: AMBER_INK, borderLeft: `3px solid ${AMBER}`, paddingLeft: 8, lineHeight: 1.5, maxWidth: 520 }}>
      {items.map((w, i) => (
        <p key={i} style={{ margin: 0 }}>{w}</p>
      ))}
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5, maxWidth: 520, margin: '16px 0 0' }}>{children}</p>;
}

interface BridgeStep {
  label: string;
  value: number;
  total?: boolean;
}

/** Waterfall: start, four movements, end. Totals in ink, gains green, losses amber. */
function Bridge({ steps, empty }: { steps: BridgeStep[]; empty: string }) {
  const W = 560, H = 200, padL = 6, padR = 6, padT = 26, padB = 34;
  let run = 0;
  const bars = steps.map((s) => {
    if (s.total) {
      run = s.value;
      return { ...s, from: 0, to: s.value };
    }
    const from = run;
    run += s.value;
    return { ...s, from, to: run };
  });
  const vals = bars.flatMap((b) => [b.from, b.to]);
  const max = Math.max(0, ...vals), min = Math.min(0, ...vals), range = max - min;
  if (range <= 0)
    return (
      <div style={{ marginTop: 16, fontSize: 12, color: MUTED, border: `1px dashed ${RULE}`, padding: '22px 12px', textAlign: 'center' }}>{empty}</div>
    );
  const innerH = H - padT - padB;
  const y = (v: number) => padT + ((max - v) / range) * innerH;
  const n = bars.length, slot = (W - padL - padR) / n, bw = Math.min(64, slot * 0.6);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Bridge from the beginning figure to the ending figure" style={{ marginTop: 16, fontFamily: SANS, display: 'block' }}>
      <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke={INK} strokeWidth="1" />
      {bars.map((b, i) => {
        const x = padL + i * slot + (slot - bw) / 2;
        const top = Math.min(y(b.from), y(b.to));
        const h = Math.max(1, Math.abs(y(b.from) - y(b.to)));
        const neg = !b.total && b.value < 0;
        const fill = b.total ? INK : neg ? AMBER : GREEN;
        const labelY = neg ? top + h + 13 : top - 6;
        const nextX = padL + (i + 1) * slot + (slot - bw) / 2;
        const text = b.total ? short(b.value) : `${b.value >= 0 ? '+' : ''}${short(b.value)}`;
        return (
          <g key={i}>
            <rect x={x} y={top} width={bw} height={h} fill={fill} />
            <text x={x + bw / 2} y={labelY} textAnchor="middle" fontSize="11" fill={INK} style={tabular}>{text}</text>
            <text x={x + bw / 2} y={H - 10} textAnchor="middle" fontSize="11" fill={MUTED}>{b.label}</text>
            {i < bars.length - 1 ? <line x1={x + bw} x2={nextX} y1={y(b.to)} y2={y(b.to)} stroke={MUTED} strokeWidth="1" strokeDasharray="2 3" /> : null}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Gross and net retention drawn against a 100% line. Ink is what stayed,
 * amber is what the base gave back, green is growth beyond 100%.
 */
function RetentionBars({ grr, nar }: { grr: number | null; nar: number | null }) {
  if (grr == null || nar == null) return null;
  const W = 560, rowH = 30, labelW = 46, valW = 70, h = 16;
  const barW = W - labelW - valW;
  const scale = Math.max(1.2, nar + 0.15);
  const x = (v: number) => labelW + (Math.max(0, v) / scale) * barW;
  const rows = [{ name: 'Gross', v: grr }, { name: 'Net', v: nar }];
  const H = rows.length * rowH + 20;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Gross and net retention against 100%" style={{ marginTop: 16, fontFamily: SANS, display: 'block' }}>
      {rows.map((r, i) => {
        const yTop = i * rowH + 4;
        const kept = Math.min(r.v, 1);
        return (
          <g key={r.name}>
            <text x={0} y={yTop + 12} fontSize="11" fill={MUTED}>{r.name}</text>
            {r.v < 1 ? <rect x={x(kept)} y={yTop} width={Math.max(0, x(1) - x(kept))} height={h} fill={AMBER_SOFT} /> : null}
            <rect x={x(0)} y={yTop} width={Math.max(0, x(kept) - x(0))} height={h} fill={INK} />
            {r.v > 1 ? <rect x={x(1)} y={yTop} width={Math.max(0, x(r.v) - x(1))} height={h} fill={GREEN} /> : null}
            <text x={x(Math.max(r.v, 1)) + 6} y={yTop + 12} fontSize="11" fill={INK} style={tabular}>{pct(r.v)}</text>
          </g>
        );
      })}
      <line x1={x(1)} x2={x(1)} y1={0} y2={rows.length * rowH + 2} stroke={INK} strokeWidth="1" strokeDasharray="2 2" />
      <text x={x(1)} y={rows.length * rowH + 16} fontSize="10" fill={MUTED} textAnchor="middle">100%</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// The module
// ---------------------------------------------------------------------------

export default function ArrAndChurn({ demo = false }: { demo?: boolean } = {}) {
  const [fp, setFp] = useState<RawInputs>(demo ? asStrings(DEMO.fp) : BLANK);
  const [nfp, setNfp] = useState<RawInputs>(demo ? asStrings(DEMO.nfp) : BLANK);

  const cfp = useMemo(() => calc(fp, 'fp'), [fp]);
  const cnfp = useMemo(() => calc(nfp, 'nfp'), [nfp]);
  const efp = useMemo(() => explain('fp', cfp), [cfp]);
  const enfp = useMemo(() => explain('nfp', cnfp), [cnfp]);

  const cols = [
    { kind: 'fp' as ColumnKind, V: VOCAB.fp, v: fp, c: cfp, e: efp, set: (k: keyof RawInputs) => (val: string) => setFp((s) => ({ ...s, [k]: val })) },
    { kind: 'nfp' as ColumnKind, V: VOCAB.nfp, v: nfp, c: cnfp, e: enfp, set: (k: keyof RawInputs) => (val: string) => setNfp((s) => ({ ...s, [k]: val })) },
  ];

  const runDemo = () => {
    setFp(asStrings(DEMO.fp));
    setNfp(asStrings(DEMO.nfp));
  };
  const clearAll = () => {
    setFp(BLANK);
    setNfp(BLANK);
  };

  const btn: CSSProperties = { fontFamily: SANS, fontSize: 13, padding: '8px 14px', border: `1px solid ${INK}`, cursor: 'pointer' };

  return (
    <div className="ac-page" style={{ background: PAPER, color: INK, fontFamily: SANS, lineHeight: 1.5, minHeight: '100vh' }}>
      <style>{`
        .ac-cols { display: grid; grid-template-columns: minmax(0, 1fr); column-gap: 40px; row-gap: 40px; }
        .ac-cols--top { row-gap: 24px; }
        @media (min-width: 768px) { .ac-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        .ac-val { min-width: 150px; }
        .ac-num { width: 150px; }
        /* Phone: give the labels room back so nothing scrolls sideways. */
        @media (max-width: 480px) { .ac-val { min-width: 104px; } .ac-num { width: 104px; } }
        .ac-input:focus { outline: 2px solid ${GREEN}; outline-offset: 2px; }
        .ac-btn:focus-visible { outline: 2px solid ${GREEN}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .ac-page * { transition: none !important; } }
      `}</style>

      <div style={{ margin: '0 auto', padding: '32px 20px', maxWidth: 1120 }}>
        <Link to="/" style={{ display: 'inline-block', marginBottom: 20, fontSize: 13, color: MUTED, textDecoration: 'none' }}>
          ← All tools
        </Link>

        <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, paddingBottom: 20, borderBottom: `2px solid ${INK}` }}>
          <div>
            <h1 style={heading(32)}>ARR and Churn</h1>
            <p style={{ marginTop: 8, fontSize: 14, color: MUTED, maxWidth: 560, lineHeight: 1.5 }}>
              The same three numbers, two ways. A subscription business keeps customers; a nonprofit keeps donors.
              Enter one 12-month period and each section explains what moved and what it takes to stand still.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="ac-btn" onClick={runDemo} style={{ ...btn, background: GREEN, color: GREEN_CONTRAST, fontWeight: 600 }}>Run demo</button>
            <button type="button" className="ac-btn" onClick={clearAll} style={{ ...btn, background: 'transparent', color: INK }}>Clear</button>
          </div>
        </header>

        {/* Revenue sits at the top of both columns; every section below reads from it. */}
        <div className="ac-cols ac-cols--top" style={{ padding: '24px 0', borderBottom: `1px solid ${RULE}` }}>
          {cols.map(({ kind, V, v, set }) => (
            <div key={kind}>
              <h2 style={heading(22)}>{V.title}</h2>
              <p style={{ fontSize: 14, color: MUTED, margin: '4px 0 10px' }}>{V.sub}</p>
              <Row label={V.revenue} strong>
                <NumInput id={`${kind}-revenue`} label={V.revenue} money value={v.revenue} onChange={set('revenue')} />
              </Row>
            </div>
          ))}
        </div>

        <Section title="ARR" def="Annual recurring revenue: the base you carry into next year, and the four things that can move it. For a business that is active subscriptions, annualized. For a nonprofit it is what the donor base gives.">
          {cols.map(({ kind, V, v, c, e, set }) => (
            <div key={kind}>
              <ColumnLabel title={V.title} />
              <Big value={usd(c.end)} label={V.end} pill={e.arrPill} />
              <Row label={V.begin}><NumInput id={`${kind}-begin`} label={V.begin} money value={v.begin} onChange={set('begin')} /></Row>
              <Row sign="+" label={V.add}><NumInput id={`${kind}-add`} label={V.add} money value={v.add} onChange={set('add')} /></Row>
              <Row sign="+" label={V.up}><NumInput id={`${kind}-up`} label={V.up} money value={v.up} onChange={set('up')} /></Row>
              <Row sign="−" label={V.down}><NumInput id={`${kind}-down`} label={V.down} money value={v.down} onChange={set('down')} /></Row>
              <Row sign="−" label={V.lost}><NumInput id={`${kind}-lost`} label={V.lost} money value={v.lost} onChange={set('lost')} /></Row>
              <Row sign="=" label={V.end} strong>{usd(c.end)}</Row>
              <Row label="Change for the year" muted>
                {`${c.netNew >= 0 ? '+' : '−'}${usd(Math.abs(c.netNew))}${c.growth != null ? ` (${c.growth >= 0 ? '+' : '−'}${pct(Math.abs(c.growth))})` : ''}`}
              </Row>
              <Row label={V.share} note={V.shareNote} muted>{c.share == null ? '—' : pct(c.share, 0)}</Row>
              <Bridge
                empty="The bridge draws itself once there are figures above."
                steps={[
                  { label: V.bridge[0], value: c.begin, total: true },
                  { label: V.bridge[1], value: c.add },
                  { label: V.bridge[2], value: c.up },
                  { label: V.bridge[3], value: -c.down },
                  { label: V.bridge[4], value: -c.lost },
                  { label: V.bridge[5], value: c.end, total: true },
                ]}
              />
              <Explain paragraphs={e.arr} />
              <Warnings items={c.warnings} />
              <Note>{HOW[kind].arr}</Note>
            </div>
          ))}
        </Section>

        <Section title="NAR" def="Net ARR retention: how much of last year's base you still have after upgrades, downgrades and losses, before counting anyone new. It is the number that says whether the business grows on its own.">
          {cols.map(({ kind, V, c, e }) => (
            <div key={kind}>
              <ColumnLabel title={V.title} />
              <Big value={pct(c.nar)} label={V.narLabel} pill={e.narPill} />
              <Row label={V.begin}>{usd(c.begin)}</Row>
              <Row sign="+" label={V.up}>{usd(c.up)}</Row>
              <Row sign="−" label={V.down}>{usd(c.down)}</Row>
              <Row sign="−" label={V.lost}>{usd(c.lost)}</Row>
              <Row sign="=" label={V.retained} strong>{usd(c.retained)}</Row>
              <Row label={V.narLabel} note={V.netNote} strong>{pct(c.nar)}</Row>
              <Row label="Gross retention" note={V.grossNote} muted>{pct(c.grr)}</Row>
              <RetentionBars grr={c.grr} nar={c.nar} />
              <Explain paragraphs={e.nar} />
              <Note>{HOW[kind].nar}</Note>
            </div>
          ))}
        </Section>

        <Section title="Churn" def="What you lost, in dollars and in people, and what it takes to replace it. Counts go here; the dollars come from the ARR section.">
          {cols.map(({ kind, V, v, c, e, set }) => (
            <div key={kind}>
              <ColumnLabel title={V.title} />
              <Big value={kind === 'fp' ? pct(c.dollarChurn) : pct(c.logoChurn)} label={V.churnLabel} pill={e.churnPill} />
              <Row label={V.startCount}><NumInput id={`${kind}-startCount`} label={V.startCount} value={v.startCount} onChange={set('startCount')} /></Row>
              <Row sign="+" label={V.newCount}><NumInput id={`${kind}-newCount`} label={V.newCount} value={v.newCount} onChange={set('newCount')} /></Row>
              <Row sign="−" label={V.lostCount}><NumInput id={`${kind}-lostCount`} label={V.lostCount} value={v.lostCount} onChange={set('lostCount')} /></Row>
              <Row sign="=" label={V.endCount} strong>{int(c.endCount)}</Row>
              <Row label={V.unitChurn} note="lost ÷ start" muted>{pct(c.logoChurn)}</Row>
              <Row label={V.dollarChurn} note="lost $ ÷ beginning" muted>{pct(c.dollarChurn)}</Row>
              <Row label="Net churn" note="lost + down − up, ÷ beginning" muted>{pct(c.netChurn)}</Row>
              <Row label={V.avgLost} muted>{c.avgLost == null ? '—' : usd(c.avgLost)}</Row>
              <Row label={V.avgAccount} muted>{c.avgAccount == null ? '—' : usd(c.avgAccount)}</Row>
              <Row label={V.life} note="1 ÷ churn" muted>{c.lifetime == null ? '—' : `${c.lifetime.toFixed(1)} years`}</Row>
              <Row label={V.standStill} strong>{c.has ? (c.standStill > 0 ? usd(c.standStill) : 'None') : '—'}</Row>
              <Explain paragraphs={e.churn} />
              <Note>{HOW[kind].churn}</Note>
            </div>
          ))}
        </Section>

        <p style={{ marginTop: 20, fontSize: 12, color: MUTED, lineHeight: 1.5, maxWidth: 720 }}>
          All figures cover one 12-month period. Business figures are annualized contract values; nonprofit figures are gifts actually received.
          The ranges quoted are general rules of thumb for reading the numbers, not targets for any particular organization.
        </p>
      </div>
    </div>
  );
}
