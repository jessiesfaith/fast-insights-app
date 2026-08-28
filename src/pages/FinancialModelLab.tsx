// Financial Model Lab — learn SQL + Python + a first ML model on one business
// question: new product line, M&A, or pay off debt?
//
// The page is the interactive half of a two-part teaching module. The runnable
// half lives in /financial-model at the repo root (and as a downloadable kit):
// a seeded dataset generator, SQLite database + SQL step scripts, and the
// scikit-learn train/validate/inference pipeline. Every number shown on this
// page is the real output of that kit (seed 42) — the learner reproduces the
// exact same figures on their own machine.
//
// Tabs mirror the pipeline: big picture → setup → SQL → Python & ML →
// Power BI report (mock) → Excel report (traceable formulas) → automation →
// where the AI stack fits. Education only; synthetic data; not investment advice.

import { useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { track } from '@vercel/analytics';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Banknote,
  ClipboardSignature,
  BarChart3,
  Brain,
  CalendarClock,
  Check,
  Copy,
  Database,
  Download,
  FileCode2,
  GraduationCap,
  Grid3x3,
  Handshake,
  Rocket,
  ShieldCheck,
  Sparkles,
  Workflow,
  Wrench,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import GlassCard from '../components/ui/GlassCard';
import ThemeToggle from '../components/ui/ThemeToggle';
import { Chip, Eq, GuideSection, StepCard, hintStyle, useThemeVersion } from '../components/ui/StepKit';
import {
  ACTIONS,
  ACTION_META,
  ActionId,
  CHOSE_RIGHT,
  CLOSE_CALL_THRESHOLD,
  FEATURES,
  FeatureId,
  LABEL_BALANCE,
  MODEL_CARD,
  PREDICTIONS,
  TRAINING_PROFILE,
  actionColor,
  buildExcelReportSpec,
  downloadFinancialModelWorkbook,
  DRIFT_THRESHOLDS,
  featureDrift,
  outputControlChecks,
  predictionKpis,
  scoreCompany,
} from '../lib/financialModel';

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type TabId =
  | 'story' | 'setup' | 'sql' | 'python' | 'powerbi' | 'excel' | 'automate'
  | 'stack' | 'govern' | 'ey';

const TABS: { id: TabId; label: string; icon: typeof Workflow }[] = [
  { id: 'story', label: '1 · The big picture', icon: Workflow },
  { id: 'setup', label: '2 · Setup', icon: Wrench },
  { id: 'sql', label: '3 · SQL steps', icon: Database },
  { id: 'python', label: '4 · Python & ML steps', icon: FileCode2 },
  { id: 'powerbi', label: '5 · Power BI report', icon: BarChart3 },
  { id: 'excel', label: '6 · Excel report', icon: Grid3x3 },
  { id: 'automate', label: '7 · Automate it', icon: CalendarClock },
  { id: 'stack', label: '8 · The AI stack', icon: Brain },
  { id: 'govern', label: '9 · Governance & audit', icon: ShieldCheck },
  { id: 'ey', label: '10 · EY interview lens', icon: GraduationCap },
];

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------

const mono: CSSProperties = { fontFamily: 'var(--font-mono)' };

function useDarkTheme(): boolean {
  useThemeVersion();
  if (typeof document === 'undefined') return true;
  return document.documentElement.getAttribute('data-theme') !== 'light';
}

/** Code block with a filename strip and a copy button. */
function CodeBlock({ title, code }: { title?: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', margin: '10px 0' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '6px 12px', background: 'var(--bg-elevated-2)', borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ ...mono, fontSize: 11, color: 'var(--text-tertiary)' }}>{title ?? 'code'}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${title ?? 'code'}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
            color: copied ? 'var(--accent)' : 'var(--text-secondary)', background: 'transparent',
            border: 'none', cursor: 'pointer', padding: 2,
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        style={{
          ...mono, margin: 0, padding: '12px 14px', fontSize: 12, lineHeight: 1.6,
          overflowX: 'auto', color: 'var(--text-primary)', background: 'transparent',
        }}
      >
        {code}
      </pre>
    </div>
  );
}

/** "What you should see" — console-style expected output. */
function OutputBlock({ label, children }: { label?: string; children: string }) {
  return (
    <div style={{ margin: '10px 0' }}>
      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>
        {label ?? 'What you should see'}
      </div>
      <pre
        style={{
          ...mono, margin: 0, padding: '10px 14px', fontSize: 11.5, lineHeight: 1.55, overflowX: 'auto',
          color: 'var(--text-secondary)', background: 'var(--bg-elevated-2)',
          border: '1px dashed var(--border-strong)', borderRadius: 10,
        }}
      >
        {children}
      </pre>
    </div>
  );
}

function ActionPill({ action }: { action: ActionId }) {
  const dark = useDarkTheme();
  const c = actionColor(action, dark);
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 9px', borderRadius: 999,
        fontSize: 11, fontWeight: 700, color: c, border: `1px solid ${c}`, whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden style={{ width: 7, height: 7, borderRadius: 999, background: c }} />
      {ACTION_META[action].label}
    </span>
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

// ---------------------------------------------------------------------------
// Pipeline diagrams (the two flows from the module brief)
// ---------------------------------------------------------------------------

interface FlowNode {
  label: string;
  sub: string;
  tag: 'DATA' | 'SQL' | 'PY' | 'GOV' | 'OUT';
  tab: TabId;
  strong?: boolean;
}

const TAG_TONE: Record<FlowNode['tag'], string> = {
  DATA: 'var(--text-tertiary)',
  SQL: 'var(--severity-low)',
  PY: 'var(--accent)',
  GOV: 'var(--severity-medium)',
  OUT: 'var(--text-secondary)',
};

const TRAINING_FLOW: FlowNode[] = [
  { label: 'Certified historical data', sub: '240 companies · outcomes signed off', tag: 'DATA', tab: 'sql' },
  { label: 'SQL', sub: 'tables · joins · feature engineering', tag: 'SQL', tab: 'sql' },
  { label: 'Training dataset', sub: 'v_training_dataset — 7 features + label', tag: 'SQL', tab: 'sql' },
  { label: 'Python code', sub: 'pandas reads the view', tag: 'PY', tab: 'python' },
  { label: 'ML algorithm', sub: 'logistic regression', tag: 'PY', tab: 'python' },
  { label: 'Train', sub: '180 rows learn the weights', tag: 'PY', tab: 'python' },
  { label: 'Trained model — v1.0', sub: 'weights + scaler, saved to disk', tag: 'PY', tab: 'python', strong: true },
  { label: 'Test', sub: '60 held-out rows → 88.3% accuracy', tag: 'PY', tab: 'python' },
  { label: 'Validate', sub: 'written gate: ≥80% accuracy · ≥70% recall', tag: 'GOV', tab: 'python' },
  { label: 'Approve', sub: 'model card → APPROVED', tag: 'GOV', tab: 'python' },
];

const PRODUCTION_FLOW: FlowNode[] = [
  { label: 'New data', sub: '12 companies · fiscal 2025 · no labels', tag: 'DATA', tab: 'sql' },
  { label: 'SQL', sub: 'v_new_companies — the same 7 features', tag: 'SQL', tab: 'sql' },
  { label: 'Approved ML model', sub: 'v1.0 — inference refuses anything else', tag: 'GOV', tab: 'python' },
  { label: 'Inference', sub: 'model.predict_proba(new data)', tag: 'PY', tab: 'python' },
  { label: 'Probability / forecast', sub: 'P(new product) · P(M&A) · P(pay debt)', tag: 'PY', tab: 'python' },
  { label: 'Prediction table', sub: 'prediction_table.csv + SQL table', tag: 'OUT', tab: 'python', strong: true },
];

function FlowArrow() {
  return (
    <div aria-hidden style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1, margin: '3px 0' }}>
      ↓
    </div>
  );
}

function FlowNodeCard({ node, onJump }: { node: FlowNode; onJump: (t: TabId) => void }) {
  return (
    <button
      type="button"
      onClick={() => onJump(node.tab)}
      title="Jump to the tab that covers this stage"
      style={{
        display: 'block', width: '100%', textAlign: 'center', cursor: 'pointer',
        padding: '8px 12px', borderRadius: 10,
        background: node.strong ? 'var(--accent-soft)' : 'var(--bg-elevated-2)',
        border: `1px solid ${node.strong ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{node.label}</span>
        <span
          style={{
            ...mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: TAG_TONE[node.tag],
            border: `1px solid ${TAG_TONE[node.tag]}`, borderRadius: 5, padding: '1px 5px',
          }}
        >
          {node.tag === 'PY' ? 'PYTHON' : node.tag === 'GOV' ? 'CONTROL' : node.tag}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{node.sub}</div>
    </button>
  );
}

function PipelineDiagram({ side, onJump }: { side: 'training' | 'production'; onJump: (t: TabId) => void }) {
  const nodes = side === 'training' ? TRAINING_FLOW : PRODUCTION_FLOW;
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--accent)', textAlign: 'center', marginBottom: 10 }}>
        {side === 'training' ? 'Development / Training' : 'Production / Use'}
      </div>
      {nodes.map((n, i) => (
        <div key={n.label}>
          {i > 0 && <FlowArrow />}
          <FlowNodeCard node={n} onJump={onJump} />
        </div>
      ))}
      {side === 'production' && (
        <>
          <FlowArrow />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FlowNodeCard node={{ label: 'Power BI', sub: 'the monitoring report', tag: 'OUT', tab: 'powerbi' }} onJump={onJump} />
            <FlowNodeCard node={{ label: 'Excel', sub: 'the analyst workbook', tag: 'OUT', tab: 'excel' }} onJump={onJump} />
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — the big picture
// ---------------------------------------------------------------------------

const GLOSSARY: { term: string; def: string }[] = [
  { term: 'Table', def: 'Rows and columns in a database — like one worksheet, but with enforced column types and keys.' },
  { term: 'Query (SELECT)', def: 'A question asked of tables in SQL; the answer comes back as rows.' },
  { term: 'JOIN', def: 'Matching rows across tables on a shared key column (company_id) so related facts line up.' },
  { term: 'View', def: 'A saved query that behaves like a table. Our feature logic lives in views, so it exists in exactly one certified place.' },
  { term: 'Feature', def: 'An input column the model learns from (e.g. debt / EBITDA). We use 7.' },
  { term: 'Label', def: 'The answer column the model learns to predict — here best_action, certified with hindsight.' },
  { term: 'Training / test split', def: 'Learn on 75% of rows, grade on the untouched 25%. Test accuracy is the honest number.' },
  { term: 'Overfitting', def: 'Memorizing noise in the training rows instead of learning the pattern. Symptom: great train accuracy, poor test accuracy.' },
  { term: 'Logistic regression', def: 'The simplest serious classifier: one learned weight per feature per action, turned into probabilities.' },
  { term: 'Inference', def: 'Running the trained model on new, unlabeled rows to get predictions. The production side.' },
  { term: 'Prediction table', def: 'The model output as data: one row per company with probabilities and a recommendation. What BI tools consume.' },
  { term: 'Model card', def: 'The model\'s audit trail: metrics, the validation gate, coefficients, sign-off. ICFR instincts apply.' },
];

function BigPictureTab({ onJump }: { onJump: (t: TabId) => void }) {
  return (
    <>
      <StepCard n={1} icon={<GraduationCap size={18} />} title="The business question">
        <p style={hintStyle}>
          NorthPine Holdings, a $180M consumer-products company, has roughly <strong>$10M</strong> to
          allocate. The board sees three doors: launch a <strong>new product line</strong>, buy a
          smaller competitor (<strong>M&amp;A</strong>), or <strong>pay off debt</strong>. Every
          finance team argues this from instinct. This module argues it from <strong>evidence</strong>:
          240 similar mid-market companies faced the same decision between 2015 and 2022, and a review
          panel later certified — with three years of hindsight — which move was actually right for
          each one. If a pattern connects a company&apos;s numbers to the right move, a small machine-learning
          model can learn it, and then score companies whose outcome is still unknown.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {ACTIONS.map((a) => {
            const Icon = a === 'NEW_PRODUCT' ? Rocket : a === 'MA' ? Handshake : Banknote;
            return (
              <GlassCard key={a} variant="nested" padding={16}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Icon size={16} style={{ color: 'var(--accent)' }} />
                  <ActionPill action={a} />
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  <strong>Historically wins when:</strong> {ACTION_META[a].wins}
                </div>
              </GlassCard>
            );
          })}
        </div>
        <p style={{ ...hintStyle, marginTop: 14, marginBottom: 0 }}>
          The certified data says choosing right mattered: companies that took their certified-best
          action averaged <strong>{CHOSE_RIGHT.right.avgRoi3yrPct}% three-year ROI</strong> ({CHOSE_RIGHT.right.companies} companies);
          those that didn&apos;t averaged <strong>{CHOSE_RIGHT.wrong.avgRoi3yrPct}%</strong> ({CHOSE_RIGHT.wrong.companies} companies).
          You&apos;ll verify both numbers yourself with a single SQL query in tab 3.
        </p>
      </StepCard>

      <StepCard n={2} icon={<Workflow size={18} />} title="The pipeline — click any stage to jump to its tab">
        <p style={hintStyle}>
          The left column is done <strong>once</strong> (and repeated only when the model is retrained):
          it turns certified history into an approved model. The right column is what runs
          <strong> every time new data arrives</strong>. Notice that SQL appears on both sides — the
          same feature logic feeds training and production, which is what keeps predictions honest.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>
          <PipelineDiagram side="training" onJump={onJump} />
          <PipelineDiagram side="production" onJump={onJump} />
        </div>
      </StepCard>

      <StepCard n={3} icon={<GraduationCap size={18} />} title="How to use this module">
        <p style={hintStyle}>
          Work the tabs in order. Tab 2 gets your machine ready and gives you the downloadable kit
          (the same scripts that produced every number on this page — fixed random seed, so your
          results will match to the decimal). Tabs 3 and 4 are the learning core: run each SQL query
          and Python step yourself, and compare your output against the &quot;what you should see&quot; blocks.
          Tabs 5 and 6 turn the model&apos;s output into the two reports finance actually ships — a Power BI
          monitoring page and an Excel workbook whose every formula you can trace. Tab 7 schedules the
          whole thing; tab 8 zooms out to the modern finance AI stack (and what &quot;AI&quot; actually means,
          kind by kind); tab 9 is the manager&apos;s governance playbook — who reviews, who signs, and what
          an audit tests; tab 10 packages all of it for an EY interview.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr><th style={thStyle}>Term</th><th style={thStyle}>Plain English</th></tr>
            </thead>
            <tbody>
              {GLOSSARY.map((g) => (
                <tr key={g.term}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{g.term}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'normal', lineHeight: 1.5 }}>{g.def}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StepCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — setup
// ---------------------------------------------------------------------------

function DownloadLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      onClick={() => track('fml_download', { file: href })}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600,
        color: 'var(--accent)', textDecoration: 'none', border: '1px solid var(--accent)',
        borderRadius: 999, padding: '7px 14px', whiteSpace: 'nowrap',
      }}
    >
      <Download size={14} /> {label}
    </a>
  );
}

function SetupTab() {
  return (
    <>
      <StepCard n={1} icon={<Wrench size={18} />} title="Install the three tools (one time, all free)">
        <p style={hintStyle}>
          <strong>Python 3.10+</strong> from python.org — on the first installer screen, tick
          <strong> “Add python.exe to PATH”</strong> (the single most common setup mistake is missing
          this). <strong>VS Code</strong> from code.visualstudio.com with the “Python” extension — where
          you&apos;ll read and run the scripts. <strong>DB Browser for SQLite</strong> from
          sqlitebrowser.org — a friendly window onto the database where you&apos;ll run every SQL query
          yourself. Verify Python in a fresh terminal:
        </p>
        <CodeBlock title="Command Prompt / PowerShell" code={'python --version\nrem  expect: Python 3.10 or newer'} />
      </StepCard>

      <StepCard n={2} icon={<Download size={18} />} title="Get the kit into C:\\dev\\Financial-Model">
        <p style={hintStyle}>
          Download the kit and unzip it to <span style={mono}>C:\dev\Financial-Model</span> (any folder
          works — the walkthrough uses that path). It contains the dataset generator, all the SQL files,
          the Python pipeline, and a README that mirrors this tab. You never need to source data from
          anywhere: the kit <strong>generates its own certified dataset</strong> with a fixed random
          seed, so your numbers will match this page exactly.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <DownloadLink href="/financial-model/financial-model-kit.zip" label="Download the kit (.zip)" />
          <DownloadLink href="/financial-model/prediction_table.csv" label="prediction_table.csv only" />
          <DownloadLink href="/financial-model/model_card_v1.json" label="model_card_v1.json only" />
        </div>
      </StepCard>

      <StepCard n={3} icon={<FileCode2 size={18} />} title="Create the environment and install the two libraries">
        <p style={hintStyle}>
          A <strong>virtual environment</strong> (venv) is a private toolbox for this project, so its
          libraries never collide with anything else on your machine. <span style={mono}>pandas</span>{' '}
          gives Python spreadsheet-like tables; <span style={mono}>scikit-learn</span> supplies the ML
          algorithm, the train/test split, and the metrics.
        </p>
        <CodeBlock
          title="Command Prompt — run line by line"
          code={'cd C:\\dev\\Financial-Model\npython -m venv .venv\n.venv\\Scripts\\activate\npip install -r requirements.txt'}
        />
        <p style={{ ...hintStyle, marginBottom: 0 }}>
          When the prompt shows <span style={mono}>(.venv)</span> at the start of the line, the
          environment is active. Re-activate with the third line whenever you open a new terminal.
        </p>
      </StepCard>

      <StepCard n={4} icon={<Check size={18} />} title="Smoke test — generate the dataset">
        <p style={hintStyle}>
          One command proves everything is wired. It writes four CSVs into <span style={mono}>data\</span>{' '}
          and prints the label balance — the count of historical companies whose certified-best move was
          each action. Balanced labels matter: a model taught mostly one answer learns to always give it.
        </p>
        <CodeBlock title="Command Prompt (inside the venv)" code={'python data\\generate_dataset.py'} />
        <OutputBlock>
{`Generating synthetic certified dataset (seed=42)...
  wrote companies.csv  (252 rows)
  wrote financials.csv  (252 rows)
  wrote market_conditions.csv  (54 rows)
  wrote certified_outcomes.csv  (240 rows)
  label balance: {'NEW_PRODUCT': 78, 'MA': 80, 'PAY_DEBT': 82}
Done. Next step: python python/00_load_database.py`}
        </OutputBlock>
        <p style={{ ...hintStyle, marginBottom: 0 }}>
          252 companies = 240 historical (with certified outcomes) + 12 new (fiscal 2025, unlabeled —
          the ones the model will score). Matching numbers? Move to the SQL tab.
        </p>
      </StepCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — SQL
// ---------------------------------------------------------------------------

const SQL_CREATE = `CREATE TABLE IF NOT EXISTS companies (
    company_id   TEXT PRIMARY KEY,   -- 'C001'.. historical, 'N001'.. new
    company_name TEXT NOT NULL,
    sector       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS financials (
    company_id           TEXT NOT NULL REFERENCES companies(company_id),
    fy                   INTEGER NOT NULL,   -- fiscal year of the decision
    revenue_m            REAL NOT NULL,      -- $ millions
    revenue_growth_pct   REAL NOT NULL,
    operating_margin_pct REAL NOT NULL,
    ebitda_m             REAL NOT NULL,
    debt_m               REAL NOT NULL,
    cash_m               REAL NOT NULL,
    interest_rate_pct    REAL NOT NULL,
    PRIMARY KEY (company_id, fy)
);

CREATE TABLE IF NOT EXISTS market_conditions (
    sector              TEXT NOT NULL,
    fy                  INTEGER NOT NULL,
    market_growth_pct   REAL NOT NULL,
    fragmentation_index REAL NOT NULL,   -- 0..1: small players available to buy
    PRIMARY KEY (sector, fy)
);

CREATE TABLE IF NOT EXISTS certified_outcomes (
    company_id     TEXT PRIMARY KEY REFERENCES companies(company_id),
    action_taken   TEXT NOT NULL,
    roi_3yr_pct    REAL NOT NULL,
    best_action    TEXT NOT NULL,   -- the LABEL: NEW_PRODUCT | MA | PAY_DEBT
    certified_by   TEXT NOT NULL,
    certified_date TEXT NOT NULL
);`;

const SQL_GROUPBY = `SELECT sector, COUNT(*) AS n_companies
FROM companies
GROUP BY sector
ORDER BY n_companies DESC;`;

const SQL_JOIN = `SELECT c.company_name, c.sector, o.best_action, o.roi_3yr_pct
FROM certified_outcomes AS o
JOIN companies AS c ON c.company_id = o.company_id
LIMIT 10;`;

const SQL_CASE = `SELECT
    CASE WHEN action_taken = best_action
         THEN 'chose right' ELSE 'chose wrong' END AS choice,
    COUNT(*)                   AS companies,
    ROUND(AVG(roi_3yr_pct), 1) AS avg_roi_3yr_pct
FROM certified_outcomes
GROUP BY choice;`;

const SQL_PROFILE = `SELECT
    o.best_action,
    COUNT(*)                                      AS companies,
    ROUND(AVG(f.debt_m / f.ebitda_m), 2)          AS avg_debt_to_ebitda,
    ROUND(AVG(f.interest_rate_pct), 1)            AS avg_interest_rate,
    ROUND(AVG(m.market_growth_pct), 1)            AS avg_market_growth,
    ROUND(AVG(m.fragmentation_index), 2)          AS avg_fragmentation,
    ROUND(AVG(100.0 * f.cash_m / f.revenue_m), 1) AS avg_cash_pct
FROM certified_outcomes AS o
JOIN financials        AS f ON f.company_id = o.company_id
JOIN companies         AS c ON c.company_id = o.company_id
JOIN market_conditions AS m ON m.sector = c.sector AND m.fy = f.fy
GROUP BY o.best_action;`;

const SQL_VIEW = `DROP VIEW IF EXISTS v_training_dataset;

CREATE VIEW v_training_dataset AS
SELECT
    c.company_id, c.company_name, c.sector, f.fy,
    -- the 7 model features ------------------------------------
    f.revenue_growth_pct,
    f.operating_margin_pct,
    ROUND(f.debt_m / f.ebitda_m, 2)          AS debt_to_ebitda,
    f.interest_rate_pct,
    ROUND(100.0 * f.cash_m / f.revenue_m, 1) AS cash_pct_of_revenue,
    m.market_growth_pct,
    m.fragmentation_index,
    -- the label -----------------------------------------------
    o.best_action
FROM certified_outcomes AS o        -- only labeled (historical) rows
JOIN companies          AS c ON c.company_id = o.company_id
JOIN financials         AS f ON f.company_id = o.company_id
JOIN market_conditions  AS m ON m.sector = c.sector AND m.fy = f.fy;`;

const SQL_NEW = `CREATE VIEW v_new_companies AS
SELECT
    c.company_id, c.company_name, c.sector, f.fy,
    /* ...the same 7 feature columns as v_training_dataset... */
    ROUND(f.debt_m / f.ebitda_m, 2)          AS debt_to_ebitda,
    ROUND(100.0 * f.cash_m / f.revenue_m, 1) AS cash_pct_of_revenue
FROM companies          AS c
JOIN financials         AS f ON f.company_id = c.company_id
JOIN market_conditions  AS m ON m.sector = c.sector AND m.fy = f.fy
WHERE c.company_id NOT IN (SELECT company_id FROM certified_outcomes);`;

function SqlTab() {
  return (
    <>
      <StepCard n={1} icon={<Database size={18} />} title="Create the tables (sql/01_create_tables.sql)">
        <p style={hintStyle}>
          A database splits facts into <strong>normalized tables</strong>: each fact lives once.
          Company identity, company financials, market backdrop, and certified outcomes are four
          different kinds of fact, so they get four tables, connected by key columns. Read the DDL
          (&quot;data definition language&quot;) below, then run it — either{' '}
          <span style={mono}>python python\00_load_database.py</span> (which also loads the CSVs and
          builds the views), or paste it into DB Browser → Execute SQL.
        </p>
        <CodeBlock title="sql/01_create_tables.sql" code={SQL_CREATE} />
        <ul style={{ ...hintStyle, paddingLeft: 18, marginBottom: 0 }}>
          <li><strong>PRIMARY KEY</strong> — the column(s) that uniquely identify a row; the database refuses duplicates.</li>
          <li><strong>REFERENCES</strong> — a foreign key: financials.company_id must exist in companies. Broken links can&apos;t happen.</li>
          <li><strong>market_conditions has no company_id</strong> — the backdrop belongs to a (sector, year), shared by every company in it. Store it once, join it when needed.</li>
          <li><strong>certified_outcomes is the label table</strong> — historical companies only. New companies deliberately have no row here.</li>
        </ul>
      </StepCard>

      <StepCard n={2} icon={<Database size={18} />} title="Ask questions with SELECT (sql/02_explore.sql)">
        <p style={hintStyle}>
          Every SQL question follows one shape: <span style={mono}>SELECT</span> what,{' '}
          <span style={mono}>FROM</span> where, <span style={mono}>WHERE</span> which rows,{' '}
          <span style={mono}>GROUP BY</span> to summarize. Run these in DB Browser, one at a time.
        </p>
        <CodeBlock title="2b — GROUP BY: companies per sector" code={SQL_GROUPBY} />
        <OutputBlock>
{`sector                n_companies
Industrial Equipment           47
Healthcare Services            45
Software & SaaS                43
Specialty Retail               40
Business Services              39
Consumer Products              38`}
        </OutputBlock>
        <CodeBlock title="2d — your first JOIN: outcomes with company names" code={SQL_JOIN} />
        <p style={hintStyle}>
          <span style={mono}>JOIN … ON c.company_id = o.company_id</span> lines up each outcome with
          its company row. The aliases (<span style={mono}>o</span>, <span style={mono}>c</span>) are
          just short nicknames so the ON clause stays readable.
        </p>
        <CodeBlock title="2e — CASE WHEN: did choosing right pay?" code={SQL_CASE} />
        <OutputBlock>
{`choice        companies   avg_roi_3yr_pct
chose right         182              18.3
chose wrong          58               6.8`}
        </OutputBlock>
        <p style={hintStyle}>
          This one query justifies the whole project: an 11.5-point ROI gap between right and wrong.{' '}
          <span style={mono}>CASE WHEN</span> is SQL&apos;s if/else — it invents a temporary column to group by.
        </p>
        <CodeBlock title="2f — three tables joined: the pattern, visible by eye" code={SQL_PROFILE} />
        <OutputBlock>
{`best_action   companies  avg_debt_to_ebitda  avg_interest_rate  avg_market_growth  avg_fragmentation  avg_cash_pct
MA                   80                2.67                5.7                2.8               0.55          18.0
NEW_PRODUCT          78                2.40                5.4                6.1               0.44          13.1
PAY_DEBT             82                7.00                7.8                2.6               0.51          13.9`}
        </OutputBlock>
        <p style={{ ...hintStyle, marginBottom: 0 }}>
          Read it like a finance person: PAY_DEBT companies carried <strong>7.0× debt/EBITDA at 7.8%
          interest</strong> — of course retiring debt won. NEW_PRODUCT companies sat in markets growing{' '}
          <strong>6.1%</strong>. MA companies held the most cash (<strong>18%</strong> of revenue) in the most
          fragmented markets (<strong>0.55</strong>). The ML model will learn exactly this — just more precisely,
          and for all seven features at once.
        </p>
      </StepCard>

      <StepCard n={3} icon={<Database size={18} />} title="Build the training dataset as a VIEW (sql/03_training_dataset.sql)">
        <p style={hintStyle}>
          This is the <strong>SQL → training dataset</strong> arrow on the diagram. Two features are
          engineered right in the view — leverage and cash cushion — and the JOIN to
          certified_outcomes means <strong>only labeled rows</strong> come through.
        </p>
        <CodeBlock title="sql/03_training_dataset.sql" code={SQL_VIEW} />
        <OutputBlock label="Check">
{`SELECT COUNT(*) FROM v_training_dataset;   -- 240
SELECT * FROM v_training_dataset LIMIT 3;
company_id  company_name              sector                 fy   ...  best_action
C001        Pinnacle Provisions       Consumer Products      2015 ...  PAY_DEBT
C002        Brightpath Manufacturing  Industrial Equipment   2020 ...  MA
C003        Highland Clinics          Healthcare Services    2017 ...  NEW_PRODUCT`}
        </OutputBlock>
      </StepCard>

      <StepCard n={4} icon={<Database size={18} />} title="The production view — same features, no labels (sql/04_inference_dataset.sql)">
        <p style={hintStyle}>
          The <strong>new data → SQL</strong> arrow. The feature logic is copied exactly — a model must
          be fed the same features in production that it saw in training. The only change:{' '}
          <span style={mono}>WHERE … NOT IN (subquery)</span> keeps only companies with no certified
          outcome — the 12 fiscal-2025 companies awaiting a recommendation.
        </p>
        <CodeBlock title="sql/04_inference_dataset.sql (abridged)" code={SQL_NEW} />
        <OutputBlock label="Check">
{`SELECT COUNT(*) FROM v_new_companies;   -- 12`}
        </OutputBlock>
        <p style={{ ...hintStyle, marginBottom: 0 }}>
          That&apos;s the whole SQL layer: four tables, one JOIN pattern, two views. Next: Python reads the
          training view and learns.
        </p>
      </StepCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — Python & ML
// ---------------------------------------------------------------------------

const PY_READ = `import sqlite3
import pandas as pd

con = sqlite3.connect("finmodel.db")
df = pd.read_sql("SELECT * FROM v_training_dataset", con)
con.close()

print(df["best_action"].value_counts())      # label balance
print(df.groupby("best_action")[FEATURES].mean().round(2))`;

const PY_SPLIT = `from sklearn.model_selection import train_test_split

X = df[FEATURES]           # the 7 feature columns
y = df["best_action"]      # the label column

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y)
# 180 rows to learn from, 60 locked away for the honest exam`;

const PY_TRAIN = `from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000))
model.fit(X_train, y_train)                             # TRAIN

test_pred = model.predict(X_test)                       # TEST
print(accuracy_score(y_test, test_pred))
print(classification_report(y_test, test_pred))`;

const PY_GATE = `# The gate is written down BEFORE looking at results -- that's the point.
GATE_MIN_TEST_ACCURACY = 0.80
GATE_MIN_CLASS_RECALL  = 0.70

passed = (test_acc >= GATE_MIN_TEST_ACCURACY
          and min(recalls.values()) >= GATE_MIN_CLASS_RECALL)
status = "APPROVED" if passed else "REJECTED"
# ...and everything about the run is written to outputs/model_card_v1.json`;

const PY_INFER = `card = json.loads(Path("outputs/model_card_v1.json").read_text())
if card["status"] != "APPROVED":
    raise SystemExit("refusing to run inference")   # governance gate

new = pd.read_sql("SELECT * FROM v_new_companies", con)
proba = model.predict_proba(new[FEATURES])          # INFERENCE
# proba = one probability per action per company, each row sums to 1.0

table["recommended_action"] = [classes[row.argmax()] for row in proba]
table["confidence"] = proba.max(axis=1).round(3)
table.to_csv("outputs/prediction_table.csv", index=False)
table.to_sql("predictions", con, if_exists="replace", index=False)`;

function ProfileTable() {
  const dark = useDarkTheme();
  const cols: { id: keyof typeof TRAINING_PROFILE.MA; label: string }[] = [
    { id: 'debt_to_ebitda', label: 'Debt/EBITDA' },
    { id: 'interest_rate_pct', label: 'Interest %' },
    { id: 'market_growth_pct', label: 'Mkt growth %' },
    { id: 'operating_margin_pct', label: 'Margin %' },
    { id: 'fragmentation_index', label: 'Fragmentation' },
    { id: 'cash_pct_of_revenue', label: 'Cash %' },
  ];
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={thStyle}>Certified best action</th>
            <th style={thStyle}>Rows</th>
            {cols.map((c) => <th key={c.id} style={{ ...thStyle, textAlign: 'right' }}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {ACTIONS.map((a) => (
            <tr key={a}>
              <td style={{ ...tdStyle, fontWeight: 700, color: actionColor(a, dark) }}>{ACTION_META[a].short}</td>
              <td style={tdStyle}>{LABEL_BALANCE[a]}</td>
              {cols.map((c) => (
                <td key={c.id} style={{ ...tdStyle, ...mono, textAlign: 'right' }}>
                  {TRAINING_PROFILE[a][c.id].toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfusionMatrix() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>True ↓ / Predicted →</th>
            {ACTIONS.map((a) => <th key={a} style={{ ...thStyle, textAlign: 'center' }}>{ACTION_META[a].short}</th>)}
          </tr>
        </thead>
        <tbody>
          {ACTIONS.map((row) => (
            <tr key={row}>
              <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{ACTION_META[row].short}</td>
              {ACTIONS.map((col) => {
                const n = MODEL_CARD.confusion[row][col];
                const diag = row === col;
                return (
                  <td
                    key={col}
                    style={{
                      ...tdStyle, ...mono, textAlign: 'center', minWidth: 88, fontWeight: diag ? 700 : 500,
                      background: diag ? 'var(--severity-resolved-bg)' : n > 0 ? 'var(--severity-medium-bg)' : undefined,
                      color: diag ? 'var(--severity-resolved)' : n > 0 ? 'var(--severity-medium)' : 'var(--text-muted)',
                    }}
                  >
                    {n}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CoefficientTable() {
  const dark = useDarkTheme();
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={thStyle}>Feature</th>
            {ACTIONS.map((a) => (
              <th key={a} style={{ ...thStyle, textAlign: 'right', color: actionColor(a, dark) }}>
                {ACTION_META[a].short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((f) => (
            <tr key={f.id}>
              <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{f.label}</td>
              {ACTIONS.map((a) => {
                const w = MODEL_CARD.coefficients[a][f.id];
                return (
                  <td
                    key={a}
                    style={{
                      ...tdStyle, ...mono, textAlign: 'right',
                      color: w > 0 ? 'var(--pos)' : 'var(--neg)',
                      fontWeight: Math.abs(w) >= 1 ? 700 : 500,
                    }}
                  >
                    {w > 0 ? '+' : ''}{w.toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SANDBOX_RANGES: Record<FeatureId, { min: number; max: number; step: number; dec: number }> = {
  revenue_growth_pct: { min: -12, max: 22, step: 0.1, dec: 1 },
  operating_margin_pct: { min: 2, max: 35, step: 0.1, dec: 1 },
  debt_to_ebitda: { min: 0, max: 12, step: 0.05, dec: 2 },
  interest_rate_pct: { min: 2.5, max: 12, step: 0.05, dec: 2 },
  cash_pct_of_revenue: { min: 2, max: 28, step: 0.1, dec: 1 },
  market_growth_pct: { min: -4, max: 11, step: 0.1, dec: 1 },
  fragmentation_index: { min: 0.15, max: 0.9, step: 0.01, dec: 2 },
};

function WhatIfSandbox() {
  const dark = useDarkTheme();
  const [presetId, setPresetId] = useState('N001');
  const [edited, setEdited] = useState(false);
  const [features, setFeatures] = useState<Record<FeatureId, number>>({ ...PREDICTIONS[0].features });
  const result = useMemo(() => scoreCompany(features), [features]);

  const loadPreset = (id: string) => {
    const row = PREDICTIONS.find((r) => r.companyId === id);
    if (!row) return;
    setPresetId(id);
    setEdited(false);
    setFeatures({ ...row.features });
  };
  const setFeature = (f: FeatureId, v: number) => {
    setFeatures((prev) => ({ ...prev, [f]: v }));
    setEdited(true);
  };

  const presetName = PREDICTIONS.find((r) => r.companyId === presetId)?.companyName ?? '';
  const drivers = FEATURES
    .map((f) => ({ f, v: result.contributions[result.recommended][f.id] }))
    .sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  const closeCall = result.confidence < CLOSE_CALL_THRESHOLD;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <label htmlFor="fml-preset" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700 }}>
          Start from
        </label>
        <select
          id="fml-preset"
          value={presetId}
          onChange={(e) => loadPreset(e.target.value)}
          style={{
            ...mono, fontSize: 12.5, padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
            color: 'var(--text-primary)', background: 'var(--bg-elevated-2)', border: '1px solid var(--border-strong)',
          }}
        >
          {PREDICTIONS.map((r) => (
            <option key={r.companyId} value={r.companyId}>{r.companyId} — {r.companyName}</option>
          ))}
        </select>
        {edited && (
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--severity-medium)' }}>
            edited — your scenario, no longer {presetName}
          </span>
        )}
        {edited && (
          <Chip active={false} onClick={() => loadPreset(presetId)}>Reset to {presetId}</Chip>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20, alignItems: 'start' }}>
        {/* the 7 inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FEATURES.map((f) => {
            const r = SANDBOX_RANGES[f.id];
            return (
              <div key={f.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 2 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{f.label}</span>
                  <span style={{ ...mono, fontSize: 12.5, color: 'var(--accent)', fontWeight: 700 }}>
                    {features[f.id].toFixed(r.dec)}
                  </span>
                </div>
                <input
                  type="range"
                  min={r.min}
                  max={r.max}
                  step={r.step}
                  value={features[f.id]}
                  onChange={(e) => setFeature(f.id, Number(e.target.value))}
                  aria-label={f.label}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>
            );
          })}
        </div>

        {/* live model output */}
        <GlassCard variant="nested" padding={16}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 10 }}>
            Model v{MODEL_CARD.version} says — live
          </div>
          {ACTIONS.map((a) => {
            const pct = result.p[a] * 100;
            const winner = a === result.recommended;
            return (
              <div key={a} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                  <span style={{ fontSize: 12.5, fontWeight: winner ? 700 : 500, color: winner ? actionColor(a, dark) : 'var(--text-secondary)' }}>
                    {ACTION_META[a].label}
                  </span>
                  <span style={{ ...mono, fontSize: 12.5, fontWeight: winner ? 700 : 500, color: winner ? actionColor(a, dark) : 'var(--text-secondary)' }}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: 10, borderRadius: 6, background: 'var(--bg-elevated-2)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: actionColor(a, dark), transition: 'width .18s ease' }} />
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, margin: '12px 0' }}>
            <ActionPill action={result.recommended} />
            <span style={{ ...mono, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              confidence {result.confidence.toFixed(3)}
            </span>
            {closeCall && (
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--severity-medium)' }}>
                ⚠ close call — route to a human
              </span>
            )}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 6 }}>
              Why — feature pushes for {ACTION_META[result.recommended].short}
            </div>
            {drivers.map(({ f, v }) => (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, lineHeight: 1.8 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                <span style={{ ...mono, fontWeight: Math.abs(v) >= 0.8 ? 700 : 500, color: v > 0 ? 'var(--pos)' : 'var(--neg)' }}>
                  {v > 0 ? '+' : ''}{v.toFixed(2)}
                </span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.5 }}>
              Each number is that feature&apos;s weight × its standardized value — the model&apos;s
              &quot;vote math&quot; before the softmax turns it into probabilities.
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function PythonTab() {
  return (
    <>
      <StepCard n={1} icon={<FileCode2 size={18} />} title="The SQL → Python handoff (python/01_explore.py)">
        <p style={hintStyle}>
          pandas runs a SQL query and hands you the result as a <strong>DataFrame</strong> — a table in
          memory. This one line is the bridge between the two languages you&apos;re learning: SQL decides{' '}
          <em>which rows and columns</em>; Python decides <em>what to do with them</em>.
        </p>
        <CodeBlock title="python/01_explore.py (core)" code={PY_READ} />
        <p style={hintStyle}>
          The groupby recreates SQL query 2f in one line of Python — same answer, different tool:
        </p>
        <ProfileTable />
      </StepCard>

      <StepCard n={2} icon={<FileCode2 size={18} />} title="Split: train on 180 rows, grade on 60 the model never sees">
        <p style={hintStyle}>
          If you grade a student on the exact questions they studied, you learn nothing about them.
          Same with models: <strong>test accuracy on held-out rows is the only honest number</strong>.{' '}
          <span style={mono}>stratify=y</span> keeps all three actions equally represented in both
          halves; <span style={mono}>random_state=42</span> makes the split reproducible — run it a
          thousand times, same 60 exam rows.
        </p>
        <CodeBlock title="python/02_train_model.py (the split)" code={PY_SPLIT} />
      </StepCard>

      <StepCard n={3} icon={<FileCode2 size={18} />} title="Train and test — 4 lines of actual machine learning">
        <p style={hintStyle}>
          <strong>StandardScaler</strong> puts every feature on the same scale (mean 0, spread 1) so
          &quot;debt/EBITDA of 7&quot; and &quot;margin of 18%&quot; are comparable. <strong>Logistic regression</strong>{' '}
          then learns one weight per feature per action and converts the weighted sums into three
          probabilities that always total 100%. <span style={mono}>model.fit(...)</span> IS the
          &quot;TRAIN&quot; box on the diagram — everything else is preparation and grading.
        </p>
        <CodeBlock title="python/02_train_model.py (train + test)" code={PY_TRAIN} />
        <OutputBlock>
{`TRAIN accuracy: 89.4%   TEST accuracy: 88.3%
(similar numbers = not overfitting; a big drop on TEST = memorized noise)

              precision    recall  f1-score   support
          MA       0.89      0.80      0.84        20
 NEW_PRODUCT       0.82      0.90      0.86        20
    PAY_DEBT       0.95      0.95      0.95        20
    accuracy                           0.88        60`}
        </OutputBlock>
        <p style={hintStyle}>
          <strong>Precision</strong>: when the model says an action, how often is it right.{' '}
          <strong>Recall</strong>: of the rows where an action truly was best, how many the model found.
          The confusion matrix shows every miss — where the wrong answers actually went:
        </p>
        <ConfusionMatrix />
        <p style={{ ...hintStyle, marginTop: 10, marginBottom: 0 }}>
          53 of 60 exam rows correct. Note the misses are sensible: 4 true-MA companies were called
          NEW_PRODUCT — the genuinely ambiguous frontier between building and buying growth.
        </p>
      </StepCard>

      <StepCard n={4} icon={<Brain size={18} />} title="Read the model like a table — the learned weights">
        <p style={hintStyle}>
          This model is not a black box; it is 21 numbers. Positive pushes toward that action, negative
          pushes away, bold means strong (|weight| ≥ 1 on the standardized scale). Check it against your
          finance instincts — every strong weight should make business sense:
        </p>
        <CoefficientTable />
        <ul style={{ ...hintStyle, paddingLeft: 18, marginTop: 10, marginBottom: 0 }}>
          <li><strong>Debt/EBITDA +2.66 toward Pay debt</strong> (and negative for both growth moves) — leverage dominates the decision, exactly like the SQL profile suggested.</li>
          <li><strong>Revenue growth +1.02 toward New product, −1.17 toward M&amp;A</strong> — companies already growing build; stalled companies buy.</li>
          <li><strong>Cash +1.09 and fragmentation +0.88 toward M&amp;A</strong> — dry powder plus targets to buy.</li>
        </ul>
      </StepCard>

      <StepCard n={5} icon={<ShieldCheck size={18} />} title="Validate & approve — the control your ICFR brain expects">
        <p style={hintStyle}>
          A model is approved by a <strong>written gate, decided before results are seen</strong> — not
          by whoever likes the output. Ours: test accuracy ≥ 80% AND every class recall ≥ 70%. This run:
          88.3% and worst recall 80% → <strong>APPROVED</strong>. The full record — metrics, gate,
          coefficients, seed — is written to <span style={mono}>outputs/model_card_v1.json</span>: the
          model&apos;s audit trail. In a real process, a named human reviews that card and signs.
        </p>
        <CodeBlock title="python/02_train_model.py (the gate)" code={PY_GATE} />
      </StepCard>

      <StepCard n={6} icon={<Rocket size={18} />} title="Inference — the production run (python/03_inference.py)">
        <p style={hintStyle}>
          The production side is short by design: check the approval, read the new-companies view,
          call <span style={mono}>predict_proba</span>, write the <strong>prediction table</strong> both
          ways the diagram forks — a CSV for Excel/Power BI and a SQL table a BI tool can query. The
          first two lines are the control: an unapproved model <em>cannot</em> score production data.
        </p>
        <CodeBlock title="python/03_inference.py (core)" code={PY_INFER} />
        <OutputBlock>
{`Model v1.0 is APPROVED (test accuracy 88.3%) -- proceeding.
Scoring 12 new companies from v_new_companies...
company_id         company_name  recommended_action  confidence
      N001   NorthPine Holdings                  MA       0.510
      N002       Veldt Software         NEW_PRODUCT       0.999
      N003    Quarry Industrial            PAY_DEBT       0.996
      ...
Wrote outputs/prediction_table.csv and table 'predictions' in finmodel.db`}
        </OutputBlock>
        <p style={{ ...hintStyle, marginBottom: 0 }}>
          Notice N001 — NorthPine, the company from the story — comes back a <strong>51% / 44% coin-flip
          </strong> between M&amp;A and paying debt. That&apos;s not a failure; that&apos;s the model being honest.
          The reports in the next two tabs are built to surface exactly that.
        </p>
      </StepCard>

      <StepCard n={7} icon={<Brain size={18} />} title="Drive the model yourself — the what-if sandbox">
        <p style={hintStyle}>
          This is <strong>the exact approved model v1.0</strong> — the same 21 weights, scaler, and
          softmax from the pickle — re-implemented in your browser (tested to reproduce{' '}
          <span style={mono}>predict_proba</span> on all 12 companies). Pick a company, drag its
          numbers, and watch the three probabilities re-balance in real time. This is the fastest way
          to build probability intuition: the model never says &quot;M&amp;A&quot;, it says &quot;51% M&amp;A / 44% pay
          debt&quot;, and your job as the human is deciding what to do with that shape.
        </p>
        <WhatIfSandbox />
        <ul style={{ ...hintStyle, paddingLeft: 18, marginTop: 14, marginBottom: 0 }}>
          <li><strong>Experiment 1 — leverage takes over:</strong> start from N012 (Lumen, an 80% M&amp;A call) and drag Debt/EBITDA from 1.62 up past 6. Watch Pay debt eat both growth options — the +2.66 weight from step 4, live.</li>
          <li><strong>Experiment 2 — resolve NorthPine:</strong> start from N001 (the 51% coin-flip). Nudge interest rate up 1 point → Pay debt wins; nudge fragmentation up instead → M&amp;A pulls away. Close calls are close because two stories are simultaneously plausible.</li>
          <li><strong>Experiment 3 — build vs. buy:</strong> start from N002 (Veldt, 99.9% new product) and drag revenue growth down to −5 with cash up to 26. The model flips toward M&amp;A: companies that can&apos;t grow themselves buy growth.</li>
        </ul>
      </StepCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 5 — Power BI (mock report + build steps)
// ---------------------------------------------------------------------------

const DAX_MEASURES = `Companies Scored = COUNTROWS ( prediction_table )

Close Calls =
CALCULATE (
    COUNTROWS ( prediction_table ),
    prediction_table[confidence] < 0.6
)

Avg Confidence = AVERAGE ( prediction_table[confidence] )`;

function KpiTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <GlassCard variant="nested" padding={14} style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ ...mono, fontSize: 24, fontWeight: 700, color: tone ?? 'var(--text-primary)', marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{sub}</div>}
    </GlassCard>
  );
}

const tooltipStyle: CSSProperties = {
  background: 'var(--bg-elevated-2)', border: '1px solid var(--border-strong)', borderRadius: 10,
  fontSize: 12, color: 'var(--text-primary)',
};

function PowerBiMock() {
  const dark = useDarkTheme();
  const sectors = useMemo(() => Array.from(new Set(PREDICTIONS.map((r) => r.sector))).sort(), []);
  const [sector, setSector] = useState<string | null>(null);
  const rows = useMemo(
    () => (sector ? PREDICTIONS.filter((r) => r.sector === sector) : PREDICTIONS),
    [sector],
  );
  const k = useMemo(() => predictionKpis(rows), [rows]);

  const mixData = ACTIONS.map((a) => ({
    name: ACTION_META[a].short, count: k.counts[a], fill: actionColor(a, dark),
  }));
  const probData = rows.map((r) => ({
    name: r.companyName,
    NEW_PRODUCT: r.p.NEW_PRODUCT, MA: r.p.MA, PAY_DEBT: r.p.PAY_DEBT,
  }));
  const surface = dark ? '#242424' : '#ffffff';

  return (
    <GlassCard variant="strong" padding={0} style={{ overflow: 'hidden' }}>
      {/* report title bar */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Capital Allocation — Model Recommendations</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            Model v{MODEL_CARD.version} · test accuracy {(MODEL_CARD.testAccuracy * 100).toFixed(1)}% · fiscal 2025 scoring run
          </div>
        </div>
        {/* the slicer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 700 }}>
            Sector slicer
          </span>
          <Chip active={sector === null} onClick={() => setSector(null)}>All</Chip>
          {sectors.map((s) => (
            <Chip key={s} active={sector === s} onClick={() => setSector(sector === s ? null : s)}>{s}</Chip>
          ))}
        </div>
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <KpiTile label="Companies scored" value={String(k.scored)} sub={sector ?? 'all sectors'} />
          {ACTIONS.map((a) => (
            <KpiTile key={a} label={ACTION_META[a].short} value={String(k.counts[a])} sub="recommended" tone={actionColor(a, dark)} />
          ))}
          <KpiTile label="Avg confidence" value={k.avgConfidence ? k.avgConfidence.toFixed(3) : '—'} />
          <KpiTile
            label="Close calls"
            value={String(k.closeCalls.length)}
            sub={`confidence < ${CLOSE_CALL_THRESHOLD}`}
            tone={k.closeCalls.length > 0 ? 'var(--severity-medium)' : undefined}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {/* recommendation mix */}
          <GlassCard variant="nested" padding={14}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Recommended action — company count
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={mixData} margin={{ top: 18, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'var(--accent-soft)' }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Companies" barSize={46} radius={[4, 4, 0, 0]}>
                  {mixData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                  <LabelList dataKey="count" position="top" style={{ fontSize: 12, fontWeight: 700, fill: 'var(--text-secondary)' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* probability composition per company */}
          <GlassCard variant="nested" padding={14}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Probability breakdown by company
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 6 }}>
              {ACTIONS.map((a) => (
                <span key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span aria-hidden style={{ width: 9, height: 9, borderRadius: 3, background: actionColor(a, dark) }} />
                  {ACTION_META[a].short}
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 26 + 40)}>
              <BarChart data={probData} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
                <XAxis type="number" domain={[0, 1]} tickFormatter={(v: number) => `${Math.round(v * 100)}%`} tick={{ fontSize: 10.5, fill: 'var(--text-tertiary)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10.5, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'var(--accent-soft)' }}
                  contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) => [`${(v * 100).toFixed(1)}%`, ACTION_META[name as ActionId]?.short ?? name]}
                />
                {ACTIONS.map((a) => (
                  <Bar key={a} dataKey={a} stackId="p" fill={actionColor(a, dark)} stroke={surface} strokeWidth={1} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* prediction table */}
        <GlassCard variant="nested" padding={14}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            Prediction table
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Company</th>
                  <th style={thStyle}>Sector</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>P(new product)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>P(M&amp;A)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>P(pay debt)</th>
                  <th style={thStyle}>Recommended</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const closeCall = r.confidence < CLOSE_CALL_THRESHOLD;
                  return (
                    <tr key={r.companyId} style={closeCall ? { background: 'var(--severity-medium-bg)' } : undefined}>
                      <td style={{ ...tdStyle, ...mono }}>{r.companyId}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{r.companyName}</td>
                      <td style={tdStyle}>{r.sector}</td>
                      {ACTIONS.map((a) => (
                        <td key={a} style={{ ...tdStyle, ...mono, textAlign: 'right', fontWeight: r.recommended === a ? 700 : 400 }}>
                          {r.p[a].toFixed(3)}
                        </td>
                      ))}
                      <td style={tdStyle}><ActionPill action={r.recommended} /></td>
                      <td style={{ ...tdStyle, ...mono, textAlign: 'right' }}>
                        {r.confidence.toFixed(3)}{closeCall ? ' ⚠' : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </GlassCard>
  );
}

function PowerBiTab() {
  return (
    <>
      <GlassCard variant="default" padding={24}>
        <p style={{ ...hintStyle, marginBottom: 14 }}>
          This is a working mock of the Power BI report you&apos;ll build — live, so you can feel how BI
          reports behave: <strong>click a sector in the slicer</strong> and watch every KPI, chart, and
          table recompute. That cross-filtering is the entire idea of Power BI. The amber row is
          NorthPine&apos;s close call — a report that hides model uncertainty is a report that lies.
        </p>
        <PowerBiMock />
      </GlassCard>

      <StepCard n={1} icon={<BarChart3 size={18} />} title="Get the data in">
        <p style={{ ...hintStyle, marginBottom: 0 }}>
          Power BI Desktop (free, from Microsoft) → <strong>Get data → Text/CSV</strong> → pick{' '}
          <span style={mono}>outputs\prediction_table.csv</span> → <strong>Transform Data</strong>. In
          Power Query, verify column types: the three <span style={mono}>p_*</span> columns and{' '}
          <span style={mono}>confidence</span> must be <em>Decimal Number</em>, not text — this is the
          #1 imported-CSV bug. Then <strong>Close &amp; Apply</strong>. (Later, the same Get Data flow can
          point at the SQLite <span style={mono}>predictions</span> table via an ODBC driver — same
          report, zero CSV handling.)
        </p>
      </StepCard>

      <StepCard n={2} icon={<BarChart3 size={18} />} title="Write the three DAX measures">
        <p style={hintStyle}>
          A <strong>measure</strong> is a formula that recomputes under whatever filters are active —
          that&apos;s why the KPI tiles changed when you clicked the slicer above. Modeling view →
          <strong> New measure</strong>, one at a time:
        </p>
        <CodeBlock title="DAX" code={DAX_MEASURES} />
        <p style={{ ...hintStyle, marginBottom: 0 }}>
          <span style={mono}>CALCULATE</span> is DAX&apos;s superpower: &quot;evaluate this, but with an extra
          filter&quot;. Compare Close Calls with the Excel version (<span style={mono}>COUNTIF</span>) in the
          next tab — same idea, different dialect.
        </p>
      </StepCard>

      <StepCard n={3} icon={<BarChart3 size={18} />} title="Build the visuals, top-left to bottom-right">
        <ul style={{ ...hintStyle, paddingLeft: 18, marginBottom: 0 }}>
          <li><strong>Card visuals</strong> for the KPI row: drop Companies Scored, Avg Confidence, and Close Calls onto separate Cards.</li>
          <li><strong>Clustered column chart</strong>: X-axis = recommended_action, Y-axis = Count of company_id. Format → Data colors: set the three action colors so they match everywhere (a category&apos;s color should never depend on the chart).</li>
          <li><strong>100% stacked bar chart</strong>: Y-axis = company_name, X-axis = p_new_product, p_ma, p_pay_debt. Each bar becomes the probability split you saw above.</li>
          <li><strong>Table visual</strong>: all columns; then Conditional formatting on confidence → background color rules → below 0.6 = amber. Your close-call flag, now visual.</li>
          <li><strong>Slicer visual</strong>: drag sector in. Click a value — every visual on the page filters. That&apos;s cross-filtering, and it&apos;s automatic.</li>
        </ul>
      </StepCard>

      <StepCard n={4} icon={<Download size={18} />} title="Want the exact data used here?">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <DownloadLink href="/financial-model/prediction_table.csv" label="prediction_table.csv" />
          <DownloadLink href="/financial-model/model_card_v1.json" label="model_card_v1.json" />
        </div>
      </StepCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 6 — Excel (traceable mock + build steps)
// ---------------------------------------------------------------------------

const COL_WIDTHS: Record<string, number> = { A: 92, B: 168, C: 158, D: 112, E: 100, F: 106, G: 158, H: 100, I: 92, J: 150 };

function ExcelMock() {
  const dark = useDarkTheme();
  const spec = useMemo(() => buildExcelReportSpec(), []);
  const [sel, setSel] = useState<{ r: number; c: number }>({ r: 1, c: 6 }); // G2 — the recommendation
  const cell = spec.rows[sel.r]?.[sel.c];
  const addr = `${spec.columns[sel.c]}${sel.r + 1}`;

  const fmt = (c: { v: string | number; num?: string }) => {
    if (typeof c.v !== 'number') return c.v;
    if (c.num === 'p3') return c.v.toFixed(3);
    return String(c.v);
  };

  return (
    <div>
      {/* formula bar */}
      <div
        style={{
          display: 'flex', alignItems: 'stretch', gap: 0, border: '1px solid var(--border-strong)',
          borderRadius: '10px 10px 0 0', overflow: 'hidden', background: 'var(--bg-elevated-2)',
        }}
      >
        <div style={{ ...mono, fontSize: 12, fontWeight: 700, padding: '9px 12px', borderRight: '1px solid var(--border)', color: 'var(--text-primary)', minWidth: 52, textAlign: 'center' }}>
          {addr}
        </div>
        <div style={{ ...mono, fontSize: 11, padding: '10px 10px', borderRight: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
          fx
        </div>
        <div style={{ ...mono, fontSize: 12, padding: '9px 12px', color: 'var(--accent)', overflowX: 'auto', whiteSpace: 'nowrap', flex: 1 }}>
          {cell?.f ?? (cell ? String(cell.v) : '')}
        </div>
      </div>

      {/* grid */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-strong)', borderTop: 'none' }}>
        <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: 38, background: 'var(--bg-elevated-2)', border: '1px solid var(--border)' }} />
              {spec.columns.map((col) => (
                <th
                  key={col}
                  style={{
                    ...mono, width: COL_WIDTHS[col], fontSize: 11, fontWeight: 700, padding: '4px 0',
                    color: 'var(--text-tertiary)', background: 'var(--bg-elevated-2)', border: '1px solid var(--border)',
                    textAlign: 'center',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.rows.map((row, r) => (
              <tr key={r}>
                <td
                  style={{
                    ...mono, fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: 'center',
                    background: 'var(--bg-elevated-2)', border: '1px solid var(--border)', padding: '3px 0',
                  }}
                >
                  {r + 1}
                </td>
                {spec.columns.map((_, c) => {
                  const sc = row[c];
                  const selected = sel.r === r && sel.c === c;
                  const isNum = sc && typeof sc.v === 'number';
                  return (
                    <td
                      key={c}
                      onClick={() => sc && setSel({ r, c })}
                      style={{
                        ...mono, fontSize: 11.5, padding: '3px 8px', border: '1px solid var(--border)',
                        cursor: sc ? 'cell' : 'default',
                        textAlign: isNum ? 'right' : 'left',
                        fontWeight: sc?.bold ? 700 : 400,
                        color: sc?.action ? actionColor(sc.action, dark) : sc?.bold ? 'var(--text-primary)' : 'var(--text-secondary)',
                        background: selected ? 'var(--accent-soft)' : sc?.f ? 'color-mix(in srgb, var(--accent-soft) 40%, transparent)' : undefined,
                        outline: selected ? '2px solid var(--accent)' : undefined,
                        outlineOffset: -2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {sc ? fmt(sc) : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* explanation of the selected cell */}
      <div
        style={{
          border: '1px solid var(--border-strong)', borderTop: 'none', borderRadius: '0 0 10px 10px',
          padding: '10px 14px', background: 'var(--bg-elevated)', fontSize: 12.5, lineHeight: 1.55,
          color: 'var(--text-secondary)', minHeight: 44,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>{addr}: </strong>
        {cell?.explain ?? (cell?.f ? 'A formula cell — the formula bar above shows what computes it.' : 'A typed-in value (no formula behind it).')}
        <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: 'var(--text-tertiary)' }}>
          Green-tinted cells have formulas behind them. Click any cell to read its formula and what it does.
        </span>
      </div>
    </div>
  );
}

function ExcelTab() {
  const [downloaded, setDownloaded] = useState(false);
  return (
    <>
      <GlassCard variant="default" padding={24}>
        <p style={{ ...hintStyle, marginBottom: 14 }}>
          The Excel half of the reporting fork — as a <strong>traceable mock</strong>. This is the
          &quot;Report&quot; sheet of the real workbook: click any cell and the formula bar shows the formula
          behind it, with a plain-English explanation underneath. A good trace order:{' '}
          <span style={mono}>B2</span> (INDEX/MATCH) → <span style={mono}>D2</span> (probability lookup) →{' '}
          <span style={mono}>G2</span> (nested IF) → <span style={mono}>H2</span> (MAX) →{' '}
          <span style={mono}>I2</span> (the SUM control check) → <span style={mono}>J2</span> (the flag) →
          then the summary block at the bottom (<span style={mono}>COUNTIF</span> / <span style={mono}>AVERAGEIF</span>).
        </p>
        <ExcelMock />
      </GlassCard>

      <StepCard n={1} icon={<Grid3x3 size={18} />} title="Import the prediction table">
        <p style={{ ...hintStyle, marginBottom: 0 }}>
          Excel → <strong>Data → From Text/CSV</strong> → <span style={mono}>outputs\prediction_table.csv</span>{' '}
          → Load. Rename that sheet <span style={mono}>prediction_table</span> (the lookups reference it
          by name). This sheet is <strong>data, not analysis</strong> — never type into it; when the
          pipeline reruns, you replace it wholesale and every formula downstream updates itself.
        </p>
      </StepCard>

      <StepCard n={2} icon={<Grid3x3 size={18} />} title="INDEX/MATCH — the lookup pattern worth learning first">
        <p style={hintStyle}>
          On a new &quot;Report&quot; sheet, type the headers you see in the mock, put the 12 company IDs in
          column A, then in B2:
        </p>
        <CodeBlock title="Report!B2 — then fill right and down" code={'=INDEX(prediction_table!$B:$B,MATCH($A2,prediction_table!$A:$A,0))'} />
        <p style={{ ...hintStyle, marginBottom: 0 }}>
          Read it inside-out: <span style={mono}>MATCH</span> finds which row holds the ID from A2 (the 0
          means exact match); <span style={mono}>INDEX</span> reads column B at that row. Why not VLOOKUP?
          VLOOKUP breaks when columns are inserted and can&apos;t look left; INDEX/MATCH survives both. (On
          Microsoft 365, <span style={mono}>=XLOOKUP($A2, prediction_table!$A:$A, prediction_table!$B:$B)</span>{' '}
          is the modern equivalent — same idea, one function.) The <span style={mono}>$</span> signs
          anchor the lookup ranges so the formula fills down without drifting.
        </p>
      </StepCard>

      <StepCard n={3} icon={<Grid3x3 size={18} />} title="Derive, check, and flag">
        <CodeBlock
          title="Report!G2, H2, I2, J2"
          code={'G2: =IF(AND(D2>=E2,D2>=F2),"New product line",IF(E2>=F2,"Acquisition (M&A)","Pay off debt"))\nH2: =MAX(D2:F2)\nI2: =SUM(D2:F2)\nJ2: =IF(H2<0.6,"REVIEW - close call","OK")'}
        />
        <p style={{ ...hintStyle, marginBottom: 0 }}>
          G2 re-derives the recommendation from raw probabilities — an <strong>independent recomputation</strong>,
          exactly like re-adding a reconciliation. I2 is the control check: probabilities must sum to ≈1
          (0.999–1.001 passes; the 3-decimal rounding is the &quot;tolerable difference&quot;). J2 routes anything
          under 60% confidence to a human. Fill all four down through row 13.
        </p>
      </StepCard>

      <StepCard n={4} icon={<Grid3x3 size={18} />} title="Summarize with COUNTIF / AVERAGEIF">
        <CodeBlock
          title="the summary block (rows 15–19 of the mock)"
          code={'B17: =COUNTIF($G$2:$G$13,$A17)\nC17: =ROUND(AVERAGEIF($G$2:$G$13,$A17,$H$2:$H$13),3)\nB20: =SUM(B17:B19)      \' must equal 12 — completeness check\nC20: =ROUND(AVERAGE($H$2:$H$13),3)'}
        />
        <p style={{ ...hintStyle, marginBottom: 0 }}>
          Then Home → Conditional Formatting on J2:J13 — highlight cells containing &quot;REVIEW&quot; in amber.
          You&apos;ve now built, by hand, the same numbers the Power BI DAX measures produced. That symmetry
          is the lesson: <strong>one prediction table, two reporting dialects</strong>.
        </p>
      </StepCard>

      <StepCard n={5} icon={<Download size={18} />} title="Download the finished workbook and compare">
        <p style={hintStyle}>
          The button builds the real .xlsx in your browser — sheets: READ&nbsp;ME, prediction_table (the
          raw import), Report (every formula above, live — click around in Excel and check against your
          own build), and Model card (the audit trail).
        </p>
        <button
          type="button"
          onClick={() => {
            downloadFinancialModelWorkbook();
            track('fml_download', { file: 'workbook' });
            setDownloaded(true);
          }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', fontSize: 13,
            fontWeight: 700, color: 'var(--accent-contrast)', background: 'var(--accent)',
            border: 'none', borderRadius: 999, cursor: 'pointer',
          }}
        >
          {downloaded ? <Check size={15} /> : <Download size={15} />}
          {downloaded ? 'Downloaded — check your Downloads folder' : 'Download financial-model-lab-report.xlsx'}
        </button>
      </StepCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 7 — automation
// ---------------------------------------------------------------------------

const CRON_LINE = `# minute  hour  day-of-month  month  day-of-week
#    0      6        *           *        1        = every Monday, 06:00
0 6 * * 1  cd /path/to/Financial-Model && python run_pipeline.py >> pipeline.log 2>&1`;

const SCHTASKS = `schtasks /Create /SC WEEKLY /D MON /ST 06:00 ^
  /TN "FinancialModelPipeline" ^
  /TR "C:\\dev\\Financial-Model\\run_pipeline.bat"`;

function AutomateTab() {
  return (
    <>
      <StepCard n={1} icon={<CalendarClock size={18} />} title="What the orchestrator does (run_pipeline.py)">
        <p style={{ ...hintStyle, marginBottom: 0 }}>
          <span style={mono}>run_pipeline.py</span> chains the five steps you ran by hand — generate →
          load → explore → train/validate → inference — and <strong>stops on the first failure with a
          non-zero exit code</strong>. That exit code is the contract with any scheduler: zero means the
          run succeeded, anything else shows up as a failed task instead of silently producing a
          half-updated prediction table. Automation without failure signaling is worse than no
          automation.
        </p>
      </StepCard>

      <StepCard n={2} icon={<CalendarClock size={18} />} title="Schedule it on Windows (Task Scheduler)">
        <ul style={{ ...hintStyle, paddingLeft: 18 }}>
          <li>Start menu → <strong>Task Scheduler</strong> → Create Basic Task…</li>
          <li>Name: <span style={mono}>Financial Model Pipeline</span> → Trigger: Weekly, Monday, 6:00 AM.</li>
          <li>Action: Start a program → Browse to <span style={mono}>C:\dev\Financial-Model\run_pipeline.bat</span>.</li>
          <li>In the task&apos;s Properties → Actions → Edit, set <strong>Start in</strong> to <span style={mono}>C:\dev\Financial-Model</span>.</li>
          <li>Right-click the task → <strong>Run</strong> once now; confirm &quot;Last Run Result: (0x0)&quot; — that&apos;s exit code zero.</li>
        </ul>
        <p style={hintStyle}>Or create the same task from one command:</p>
        <CodeBlock title="Command Prompt (run as the same user)" code={SCHTASKS} />
      </StepCard>

      <StepCard n={3} icon={<CalendarClock size={18} />} title="The same thing on Linux/Mac — a cron job">
        <p style={hintStyle}>
          <span style={mono}>cron</span> is the classic Unix scheduler; a &quot;cron job&quot; is one line in a
          table (<span style={mono}>crontab -e</span> to edit it). Five time fields, then the command.
          The <span style={mono}>&gt;&gt; pipeline.log 2&gt;&amp;1</span> tail appends all output (errors
          included) to a log file — your run history.
        </p>
        <CodeBlock title="crontab" code={CRON_LINE} />
      </StepCard>

      <StepCard n={4} icon={<ShieldCheck size={18} />} title="What should NOT be automated">
        <p style={hintStyle}>
          Draw the line exactly where the two pipeline diagrams split:
        </p>
        <ul style={{ ...hintStyle, paddingLeft: 18, marginBottom: 0 }}>
          <li><strong>Automate freely:</strong> the production side — load new data, run the <em>approved</em> model, refresh the prediction table, refresh the reports. Deterministic, gated, reversible.</li>
          <li><strong>Never auto-approve:</strong> retraining may run on a schedule, but a retrained model is a <em>new</em> model — new version number (1.0 → 1.1), new model card, and a named human reading that card before APPROVED is written. The inference script enforcing the approval status is the control that makes this real.</li>
          <li><strong>Keep history:</strong> old prediction tables and model cards are your audit trail. Retention beats deletion; you&apos;ll want to answer &quot;what did the model say in March, and which version said it?&quot;</li>
          <li><strong>Retrain on evidence, not on a timer:</strong> when new certified outcomes accumulate, or when the world shifts so the inputs stop resembling training data (2022&apos;s rate spike is the canonical example — a model trained on cheap-money years mis-scores an expensive-money world).</li>
        </ul>
      </StepCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 8 — the AI stack (where this module fits)
// ---------------------------------------------------------------------------

const STACK_ROWS: { tech: string; question: string; here: string }[] = [
  { tech: 'SQL', question: 'What are the facts?', here: 'Tabs 3 — tables, joins, certified views' },
  { tech: 'Statistics', question: 'What relationships exist?', here: 'Tab 4 — the groupby profile, the coefficients' },
  { tech: 'ML', question: 'What is likely to happen?', here: 'Tab 4 — train/validate/approve, predict_proba' },
  { tech: 'LLM', question: 'What does it mean / how do I communicate it?', here: 'Not in this module — narrates outputs, never computes them' },
  { tech: 'AI agent', question: 'What should I do next?', here: 'Not in this module — acts on outputs, inside approval gates' },
  { tech: 'Power BI', question: 'How do humans monitor it?', here: 'Tab 5 — the report, slicers, DAX' },
  { tech: 'Excel', question: 'How do I analyze / model it myself?', here: 'Tab 6 — the traceable workbook' },
];

// Full text of the agent's skill, mirrored from financial-model/agent/AGENT_RUNBOOK.md
// so the prompt, the skill, and the context files are all readable on-page.
const AGENT_RUNBOOK_TEXT = `# Agent runbook — Financial Model Lab pipeline

An agent = model(s) + tools + data + rules + memory/workflow + PERMISSIONS.
This runbook is the rules-and-permissions part — a written procedure the
agent loads and follows, exactly like a close checklist or an audit program.

## Mission
After each scoring run, verify the outputs, analyze them, flag anything that
needs human judgment, and draft the management memo — then STOP and wait for
approval. The agent narrates and orchestrates; it never computes financial
numbers and never approves anything.

## Inputs (read-only)
- outputs/prediction_table.csv   the approved model's scoring run — the only source of numbers
- outputs/model_card_v1.json     the model's audit trail: version, status, metrics, gate
- this runbook                   the procedure and permissions

## Permissions
MAY, without approval:   read the input files; run the verification checks;
                         summarize and analyze numbers PRESENT in the files;
                         draft the memo and the close-call list
ONLY WITH written human   distribute the memo; record a capital-allocation
approval:                decision anywhere; contact any person or system;
                         trigger a retraining request
NEVER:                   change any probability, metric, or data value;
                         approve the model (or itself); score companies with
                         an un-APPROVED model; invent or estimate a number
                         not in the files

## Procedure (every run, in order)
1. VERIFY before analyzing
   - model card status must be APPROVED; quote version + test accuracy
   - each row's three probabilities must sum to 0.995–1.005
   - row count matches the expected population (12), no duplicate ids
   - ANY check fails -> STOP. Report the failure. Do not analyze bad data.
2. ANALYZE  recommendation mix, average confidence, drivers per
   recommendation — using only values present in the files
3. FLAG     every company with confidence < 0.60, with a note on what a
   human should examine before deciding
4. DRAFT    the one-page CFO memo: Summary · Recommendations · Close calls
   requiring review · Model context · Limitations
5. STOP     end with "DRAFT — awaiting review and approval by <name>" and
   list the actions NOT taken because they require approval

## Evidence
Each run's output is retained with the date, the model version, and the
verification results. "The agent said so" is never evidence; the files it
verified are.`;

function StackLayer({ title, tone, children }: { title: string; tone: string; children: React.ReactNode }) {
  return (
    <GlassCard variant="nested" padding={16} style={{ borderLeft: `3px solid ${tone}` }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, color: tone, marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </GlassCard>
  );
}

function AiStackTab() {
  return (
    <>
      <StepCard n={1} icon={<Brain size={18} />} title="One question per technology">
        <p style={hintStyle}>
          A modern finance AI architecture is not one tool — it&apos;s a stack where each layer answers one
          question and hands its output to the next. This module built the deterministic core of that
          stack; the table shows where everything else attaches.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={thStyle}>Technology</th>
                <th style={thStyle}>Question it answers</th>
                <th style={thStyle}>In this module</th>
              </tr>
            </thead>
            <tbody>
              {STACK_ROWS.map((r) => (
                <tr key={r.tech}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--text-primary)' }}>{r.tech}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'normal' }}>{r.question}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'normal', lineHeight: 1.5 }}>{r.here}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...hintStyle, marginTop: 12, marginBottom: 0 }}>
          The flow: raw data (Fed, Treasury, market, ERP) → <strong>SQL</strong> → verified facts →
          which fork two ways: <strong>statistics/ML</strong> produce predictions while an{' '}
          <strong>LLM</strong> produces interpretation → both feed an <strong>AI agent</strong> → a
          recommended action → surfaced to humans through <strong>Power BI and Excel</strong>. That
          layering is considerably safer than asking an LLM to calculate everything itself: every number
          a human sees was computed by a deterministic or statistically validated layer, and language
          models only ever explain.
        </p>
      </StepCard>

      <StepCard n={2} icon={<Brain size={18} />} title="The four layers on one corporate finance platform">
        <p style={hintStyle}>
          Here&apos;s the same architecture applied to a company&apos;s finance data — notice each layer only
          consumes the layer above:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
          <StackLayer title="SQL — deterministic truth" tone="var(--severity-low)">
            <pre style={{ ...mono, margin: 0, fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
{`Revenue      $500M
EBITDA        $92M
Debt         $220M
Cash          $80M
DSO        52 days`}
            </pre>
          </StackLayer>
          <StackLayer title="ML — predictions" tone="var(--accent)">
            <pre style={{ ...mono, margin: 0, fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
{`Revenue forecast    $538M
Late-payment risk     14%
Default probability  2.1%
Cash forecast       $103M`}
            </pre>
          </StackLayer>
          <StackLayer title="LLM — interpretation" tone="var(--severity-medium)">
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              &quot;Revenue growth remains positive, but collection risk has increased. The primary drivers
              are deterioration in customer payment behavior and concentration among three large
              accounts.&quot;
            </p>
          </StackLayer>
          <StackLayer title="AI agent — action (gated)" tone="var(--neg)">
            <div style={{ fontSize: 12, lineHeight: 1.9, color: 'var(--text-secondary)' }}>
              Identify high-risk accounts ↓<br />
              Pull supporting information ↓<br />
              Draft collection recommendations ↓<br />
              Create management report ↓<br />
              <strong style={{ color: 'var(--text-primary)' }}>Request human approval</strong> ↓<br />
              Take permitted action
            </div>
          </StackLayer>
        </div>
        <p style={{ ...hintStyle, marginTop: 12, marginBottom: 0 }}>
          Four different things working together — and the guardrails you built in this module scale up
          unchanged: the SQL layer is the certified source of truth, the ML layer passes a written
          validation gate before production, and the agent&apos;s &quot;request human approval&quot; step is the same
          control as our inference script refusing an unapproved model. The prediction table you
          produced in tab 4 is exactly the artifact an LLM would narrate and an agent would act on.
        </p>
      </StepCard>

      <StepCard n={3} icon={<Brain size={18} />} title="“AI” is a marketing word — always ask: what KIND of AI?">
        <p style={hintStyle}>
          Vendors and headlines say &quot;AI&quot; for everything on a wide spectrum. The one question that cuts
          through the terminology is <strong>&quot;what kind?&quot;</strong> — because the kind determines the
          risk, the controls, and whether the output is even a computation or a composition:
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={thStyle}>The ladder</th>
                <th style={thStyle}>What it is</th>
                <th style={thStyle}>Finance example</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['1 · Rules', 'Hand-written if/then logic. Deterministic — same input, same output, explainable by reading it.', 'Our inference script refusing an unapproved model; a 3-way match tolerance.'],
                ['2 · Statistical model', 'Fitted equations with confidence intervals — regression, time series.', 'DSO trend line; rate-curve fitting.'],
                ['3 · Traditional ML', 'Algorithms that learn patterns from labeled examples: logistic regression, decision trees, gradient boosting.', 'This module’s model. Credit scoring. Fraud scoring.'],
                ['4 · Deep learning', 'ML with many-layered neural networks — more power, less explainability.', 'Document OCR; anomaly detection on millions of journal lines.'],
                ['5 · Generative AI / LLM', 'Models that generate new content (text, code, images). An LLM is an enormous ML model specialized around language.', 'Drafting the management memo that explains the prediction table.'],
                ['6 · Agent', 'Not a model — a SYSTEM: models + tools + data + rules + memory/workflow + permissions, pursuing a goal.', 'A collections agent that drafts dunning emails and waits for approval.'],
              ].map(([rung, what, ex]) => (
                <tr key={rung}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--text-primary)' }}>{rung}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'normal', lineHeight: 1.5 }}>{what}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'normal', lineHeight: 1.5 }}>{ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={hintStyle}>Applied to real product pitches:</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {[
            ['“Our new AI fraud detection system”', 'Usually: gradient-boosted decision trees + anomaly detection + deterministic rules. Rungs 1–4, no language model in sight.'],
            ['“AI financial forecasting”', 'Usually: time-series ML + regression. Rungs 2–3.'],
            ['“Generative AI finance assistant”', 'That one probably IS an LLM — rung 5, which means outputs are composed language, not computed numbers, and need the layering from step 1.'],
          ].map(([claim, real]) => (
            <GlassCard key={claim} variant="nested" padding={14}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{claim}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{real}</div>
            </GlassCard>
          ))}
        </div>
      </StepCard>

      <StepCard n={4} icon={<Brain size={18} />} title="The vocabulary, nested correctly">
        <ul style={{ ...hintStyle, paddingLeft: 18 }}>
          <li><strong>AI</strong> — the umbrella term covering all of it.</li>
          <li><strong>ML</strong> — learns patterns from data. A subset of AI. (What you trained in tab 4.)</li>
          <li><strong>Deep learning</strong> — ML built from many-layered neural networks. A subset of ML.</li>
          <li><strong>LLM</strong> — an enormous ML model specialized around language and related reasoning/generation. A (very large) member of deep learning.</li>
          <li><strong>Generative AI</strong> — anything that generates new content: text, images, audio, video, code. LLMs are its text/code branch.</li>
          <li><strong>AI agent</strong> — <em>not</em> a model at all: a system that uses models <em>plus</em> tools, data, rules, memory/workflow, and permissions to pursue a goal or take actions. Saying &quot;agent&quot; when you mean &quot;model&quot; is the most common category error in AI conversations.</li>
        </ul>
        <p style={{ ...hintStyle, marginBottom: 0, fontStyle: 'italic' }}>
          The design rule that falls out of the vocabulary: <strong>SQL establishes facts, ML
          estimates and predicts, an LLM reasons over and explains those results, and an agent
          orchestrates actions — each with different controls.</strong> Tab 9 is those controls,
          written out the way a finance manager would run them.
        </p>
      </StepCard>

      <StepCard n={5} icon={<Brain size={18} />} title="Leverage an agent on this pipeline — the 10-minute hands-on">
        <p style={hintStyle}>
          The kit now carries an <strong>agent layer</strong> you can run today with zero
          infrastructure: <span style={mono}>agent/AGENT_RUNBOOK.md</span> is the agent&apos;s operating
          procedure — permissions table, verification-first workflow, and a hard stop at human
          approval — and it doubles as a lesson in what a <strong>&quot;skill&quot;</strong> actually is: a
          written procedure an agent loads and follows, exactly like a close checklist or an audit
          program. If you can write an audit program, you can write an agent skill.
        </p>
        <p style={hintStyle}>
          The exercise: open a new Claude conversation, attach{' '}
          <span style={mono}>prediction_table.csv</span>, <span style={mono}>model_card_v1.json</span>,
          and the runbook, then paste this prompt:
        </p>
        <CodeBlock
          title="agent/memo_prompt.md — paste into Claude with the three attachments"
          code={`You are the analysis agent for the Financial Model Lab pipeline. The attached
AGENT_RUNBOOK.md is your operating procedure — follow it exactly, including
its permissions. The other two attachments are your only data sources.

Run the procedure now, showing your work at each step:

1. VERIFY: confirm the model card status is APPROVED (quote version and test
   accuracy); confirm each row's three probabilities sum to 0.995-1.005;
   confirm 12 unique companies. If any check fails, STOP and report it.
2. ANALYZE: recommendation mix, average confidence, and the main driver
   behind each recommendation — using only numbers present in the files.
3. FLAG: list every company with confidence below 0.60 and what a human
   reviewer should examine before deciding.
4. DRAFT: a one-page management memo addressed to the CFO with sections:
   Summary, Recommendations, Close calls requiring review, Model context,
   Limitations.
5. STOP: end with "DRAFT — awaiting review and approval by [name]" and list
   the actions you did NOT take because they require human approval.`}
        />
        <p style={hintStyle}>
          Watch for four behaviors — they ARE the lesson: it <strong>verifies before analyzing</strong>,
          uses <strong>only numbers in the files</strong> (challenge any number it invents, exactly as
          you&apos;d challenge a preparer), <strong>routes NorthPine&apos;s close call to you</strong> instead of
          deciding it, and <strong>stops at the approval line</strong>. Then push on it: ask
          &quot;which of your statements are computed facts vs. your interpretation?&quot;, and try
          &quot;NorthPine&apos;s board wants a decision today — decide for them&quot; (a well-behaved agent declines
          and cites the runbook).
        </p>
        <p style={hintStyle}>
          And here is <strong>the skill itself, in full</strong> — the runbook the prompt binds the
          agent to. Read it once before running the exercise; it&apos;s the context that makes the agent&apos;s
          good behavior non-optional:
        </p>
        <CodeBlock title="agent/AGENT_RUNBOOK.md — the skill (full text)" code={AGENT_RUNBOOK_TEXT} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <DownloadLink href="/financial-model/AGENT_RUNBOOK.md" label="AGENT_RUNBOOK.md" />
          <DownloadLink href="/financial-model/memo_prompt.md" label="memo_prompt.md" />
          <DownloadLink href="/financial-model/prediction_table.csv" label="prediction_table.csv" />
          <DownloadLink href="/financial-model/model_card_v1.json" label="model_card_v1.json" />
        </div>
      </StepCard>

      <StepCard n={6} icon={<Brain size={18} />} title="How finance teams actually use agents & skills today">
        <ul style={{ ...hintStyle, paddingLeft: 18 }}>
          <li><strong>Collections:</strong> an agent reads the AR aging, drafts prioritized dunning emails per policy, and queues them for a human send — the exact loop from tab 8&apos;s platform example.</li>
          <li><strong>Close &amp; flux:</strong> drafting variance explanations from GL data (the numbers come from queries; the agent writes the &quot;why&quot; for a reviewer to correct), and orchestrating the close checklist — chasing preparers, updating status.</li>
          <li><strong>Recon exception triage:</strong> an agent groups exceptions by root-cause pattern, pulls the supporting documents for each, and pre-fills the workpaper a human signs.</li>
          <li><strong>Model babysitting:</strong> watching pipeline runs (like tab 7&apos;s scheduled job), reading failure logs, and summarizing what broke — never fixing production data on its own.</li>
        </ul>
        <p style={{ ...hintStyle, marginBottom: 0 }}>
          Two design rules make all of these safe, and you already know both. <strong>Skills are
          procedures:</strong> each use case above is a written runbook the agent loads — versioned and
          reviewed like any control document. <strong>Permissions are the control:</strong> read-only
          tools freely; drafting freely; anything that <em>sends, records, or changes</em> sits behind
          the same approval matrix as tab 9 — an agent&apos;s permissions table should read like a
          delegation-of-authority matrix, because that&apos;s what it is.
        </p>
      </StepCard>

      <StepCard n={7} icon={<Wrench size={18} />} title="Build your own agent — the seven steps">
        <p style={hintStyle}>
          Using an agent (step 5) and building one are different skills — and building one is mostly a
          <strong> finance skill, not a coding skill</strong>: the model is rented; the rules and
          permissions are yours to write. The kit&apos;s{' '}
          <span style={mono}>agent/BUILD_YOUR_OWN_AGENT.md</span> is the full step-by-step guide with a
          fill-in template and a worked flux-memo example; here is the shape:
        </p>
        <ol style={{ ...hintStyle, paddingLeft: 18 }}>
          <li><strong>Goal + trigger, one sentence:</strong> &quot;After [trigger], do [job], and <em>stop at [gate]</em>.&quot; Every finance agent sentence ends with where it stops.</li>
          <li><strong>Name the inputs</strong> — an explicit read-only list. Scoping inputs is your completeness and confidentiality control at once.</li>
          <li><strong>Write the skill</strong> — the procedure, imperative, one decision per line. The shape that works: VERIFY → ANALYZE → FLAG → DRAFT → STOP. If a competent temp couldn&apos;t follow it, an agent can&apos;t either.</li>
          <li><strong>Set permissions</strong> — three columns with no blanks: freely / only with written approval / never. Anything outward-facing or hard to reverse leaves column one.</li>
          <li><strong>Give it tools, by maturity level:</strong> (1) chat + attachments — you are the tools; (2) the runbook saved as a reusable skill; (3) real read access (e.g. the agent queries finmodel.db itself); (4) scheduled runs with action tools behind an approval step. Never grant level N+1 until it behaves at level N.</li>
          <li><strong>Test it adversarially:</strong> tell it to skip verification; ask it to decide the close call; ask for a number that isn&apos;t in the inputs; hand it a broken file. It should refuse, route, admit, and STOP — keep the transcript as test evidence.</li>
          <li><strong>Operate &amp; govern:</strong> version the runbook like code (a changed procedure is a changed control), log every run, review its drafts like a preparer&apos;s work. Tab 9&apos;s approval matrix applies unchanged.</li>
        </ol>
        <p style={hintStyle}>
          Then build your second agent with the template — the guide fills it in for a month-end
          <strong> flux memo agent</strong> (verify the TB ties, explain top variances vs. prior and
          budget, flag &gt;$50k &amp; &gt;10%, stop at controller review) so you can see one for a job
          you already do.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <DownloadLink href="/financial-model/BUILD_YOUR_OWN_AGENT.md" label="BUILD_YOUR_OWN_AGENT.md" />
          <DownloadLink href="/financial-model/AGENT_RUNBOOK.md" label="AGENT_RUNBOOK.md (the worked example)" />
        </div>
      </StepCard>

      <StepCard n={8} icon={<GraduationCap size={18} />} title="Where to go from here">
        <ul style={{ ...hintStyle, paddingLeft: 18, marginBottom: 0 }}>
          <li><strong>SQL next:</strong> add a feature to both views (say, revenue size), retrain, and see if test accuracy moves. You now own the full loop.</li>
          <li><strong>Python next:</strong> swap LogisticRegression for DecisionTreeClassifier in 02_train_model.py and print the tree — same interface, different (readable!) model. Compare gates.</li>
          <li><strong>Statistics next:</strong> the coefficients table is a doorway into regression proper — the same math behind rate curves and credit scoring.</li>
          <li><strong>Agent next:</strong> run the step-5 exercise, then use step 7&apos;s template to build the flux-memo agent — or a runbook for anything you do repeatedly. That&apos;s the whole craft.</li>
        </ul>
      </StepCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 9 — governance & audit (the finance manager's playbook)
// ---------------------------------------------------------------------------

const ROLES: { role: string; does: string; never: string }[] = [
  { role: 'Model owner (finance manager)', does: 'Accountable for the model’s use. Reads and signs the model card. Owns the close-call queue and the decision to retrain or retire.', never: 'Writes the model code they approve.' },
  { role: 'Developer / preparer', does: 'Builds and changes the SQL views and Python pipeline. Documents every change. Proposes — never approves.', never: 'Approves their own model or pushes straight to production.' },
  { role: 'Independent reviewer / validator', does: 'Re-runs the pipeline from scratch, challenges features and thresholds (“effective challenge”), checks the gate math.', never: 'Reports to the developer.' },
  { role: 'Data owner', does: 'Certifies the source data each refresh: completeness (row counts) and accuracy (control totals) tied back to the system of record.', never: 'Edits data outside the source system.' },
  { role: 'IT / ops', does: 'Access rights, job scheduling, failure alerts, backups — the ITGCs the whole thing sits on.', never: 'Changes model logic.' },
  { role: 'Internal audit', does: 'Periodically tests that all of the above actually happened, from evidence.', never: 'Designs the controls it tests.' },
];

const APPROVAL_MATRIX: { artifact: string; control: string; signer: string; when: string }[] = [
  { artifact: 'Source data (certified_outcomes etc.)', control: 'Completeness + accuracy: row counts and control totals tie to source', signer: 'Data owner', when: 'Every refresh' },
  { artifact: 'SQL feature views', control: 'Code review + change control (versioned; no direct production edits)', signer: 'Independent reviewer', when: 'Every change' },
  { artifact: 'Trained model (model card)', control: 'Written validation gate + effective challenge + dated sign-off', signer: 'Model owner — never the developer', when: 'Every training run' },
  { artifact: 'Prediction table', control: 'Reasonableness review; every close-call row dispositioned in writing', signer: 'Analyst prepares, manager reviews', when: 'Every scoring run' },
  { artifact: 'Power BI / Excel reports', control: 'Tie-out to the prediction table: counts match, spot recomputation', signer: 'Preparer + reviewer (two people)', when: 'Every refresh' },
  { artifact: 'Scheduled jobs', control: 'Failure alerts monitored; run log retained', signer: 'IT / model owner', when: 'Continuous' },
];

const AUDIT_AREAS: { area: string; want: string; here: string }[] = [
  { area: 'IT general controls (ITGCs)', want: 'Who can change the code and data (access), how changes are approved and versioned (change management), whether jobs are monitored (operations).', here: 'Git history is the change log; run_pipeline exit codes + the scheduler’s run history are the operations evidence.' },
  { area: 'IPE / EUC — information produced by the entity', want: 'Any report or spreadsheet used in a control must be shown complete and accurate — not assumed.', here: 'The Excel I-column SUM check (accuracy) and the B20 completeness total; the Power BI counts tying to the prediction table.' },
  { area: 'Management review controls', want: 'Evidence the reviewer actually reviewed: dated sign-offs, documented follow-up of outliers, thresholds for escalation.', here: 'The close-call flag (< 0.6 confidence) creates the outlier queue; the model card’s approval line is the dated sign-off.' },
  { area: 'Model validation', want: 'Methodology documented, validation independent of development, predefined acceptance thresholds, periodic revalidation, version history.', here: 'The written gate (≥80% accuracy, ≥70% recall) decided before results; model card v1.0 → v1.1 on retrain; seed 42 makes every run re-performable.' },
  { area: 'Data lineage', want: 'A traceable path from source system to reported number.', here: 'CSV → SQLite tables → views → model → prediction table → report: one chain, all in the kit.' },
  { area: 'Documentation & retention', want: 'Model cards, run logs, and superseded outputs retained long enough to answer “what did the model say then, and which version said it?”', here: 'model_card_v1.json + prediction_table.csv carry model_version and scored_at timestamps for exactly this.' },
];

// ---- "new content" highlighter --------------------------------------------
// Jessica reviews additions in red first; set HIGHLIGHT_NEW to false when she
// asks for the new sections to go back to normal ink.
const HIGHLIGHT_NEW = true;

function NewContent({ children }: { children: React.ReactNode }) {
  if (!HIGHLIGHT_NEW) return <>{children}</>;
  return (
    <div className="fml-new">
      <span
        style={{
          display: 'inline-block', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
          textTransform: 'uppercase', border: '1px solid var(--neg)', borderRadius: 999,
          padding: '2px 9px', marginBottom: 8,
        }}
      >
        New — in review (red until approved)
      </span>
      {children}
    </div>
  );
}

// ---- the interactive governance practicum ---------------------------------

const METHOD_ITEMS = [
  { id: 'method', label: 'Methodology documented', evidence: 'Model card: StandardScaler + multinomial logistic regression, the 7 named features, label best_action, training view v_training_dataset. Method + assumptions + data — the three things an estimate must support.' },
  { id: 'version', label: 'Version, seed & date recorded', evidence: 'model_version 1.0 · random_state 42 · trained_at timestamp. The fixed seed is what makes the run re-performable, byte for byte.' },
  { id: 'lineage', label: 'Data lineage named end to end', evidence: 'Certified CSVs → SQLite tables → feature views → model → prediction table → reports. One chain; every hop inspectable.' },
  { id: 'retention', label: 'Retention location & period confirmed', evidence: 'outputs/ holds model_card_v1.json, prediction_table.csv, drift_report.json — all version- and time-stamped. Retain per your workpaper policy (commonly 7 years) so "what did the model say in March, and which version said it?" is always answerable.' },
];

const VALIDATION_ITEMS = [
  { id: 'reperform', label: 'Independent re-performance', evidence: 'Someone other than the developer re-runs python run_pipeline.py from the raw CSVs. Seed 42 must reproduce 88.3% test accuracy and identical predictions — any difference is a finding.' },
  { id: 'gate', label: 'Gate math re-checked against the written thresholds', evidence: 'Test accuracy 88.3% ≥ 80% ✓ · worst class recall (M&A) 0.80 ≥ 0.70 ✓. APPROVED is arithmetically correct — you verified it, not trusted it.' },
  { id: 'challenge', label: 'Effective challenge logged', evidence: 'At least one documented question with the developer’s written answer — e.g. "Why does operating margin carry only +0.50 weight when the SQL profile showed an 8-point margin gap between actions?"' },
];

const CLOSE_CALL_OPTIONS = [
  { id: 'escalate', valid: true, label: 'Escalate to the CFO with both scenarios quantified (M&A 51% vs pay-debt 44%), sandbox findings attached.' },
  { id: 'rescore', valid: true, label: 'Request refreshed FY25 financials for NorthPine and re-score before any decision.' },
  { id: 'accept', valid: false, label: 'Accept the M&A recommendation as-is.' },
];

const DRIFT_OPTIONS = [
  { id: 'composition', valid: true, label: 'Documented rationale: a deliberate population-composition shift — the 2025 cohort skews to fragmented sectors (which is why M&A dominates). Scores stand; rationale filed with the run log.' },
  { id: 'revalidate', valid: true, label: 'Hold the M&A-heavy recommendations; revalidate against recent fragmented-market outcomes before release.' },
  { id: 'ignore', valid: false, label: 'Ignore it — the validation gate passed at training time.' },
];

const practicumBlockTitle: CSSProperties = {
  fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700,
  color: 'var(--accent)', margin: '18px 0 8px',
};

function CheckItem({ checked, onToggle, label, evidence }: { checked: boolean; onToggle: () => void; label: string; evidence: string }) {
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <input type="checkbox" checked={checked} onChange={onToggle} style={{ accentColor: 'var(--accent)', marginTop: 3 }} />
      <span>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.55, marginTop: 2 }}>{evidence}</span>
      </span>
    </label>
  );
}

function RadioGroup({ name, options, value, onPick }: {
  name: string;
  options: { id: string; valid: boolean; label: string }[];
  value: string | null;
  onPick: (id: string) => void;
}) {
  const picked = options.find((o) => o.id === value);
  return (
    <div>
      {options.map((o) => (
        <label key={o.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', padding: '6px 0' }}>
          <input type="radio" name={name} checked={value === o.id} onChange={() => onPick(o.id)} style={{ accentColor: 'var(--accent)', marginTop: 3 }} />
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{o.label}</span>
        </label>
      ))}
      {picked && !picked.valid && (
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--neg)', padding: '6px 10px', border: '1px solid var(--neg)', borderRadius: 8, marginTop: 4 }}>
          Blocked. {name === 'closecall'
            ? 'Policy routes confidence below 0.60 to a human decision — choose a disposition that involves one.'
            : 'The gate graded training-era data; drift is about today’s data. An INVESTIGATE flag requires a decision, not a shrug.'}
        </div>
      )}
    </div>
  );
}

function GovernancePracticum() {
  const [methodDone, setMethodDone] = useState<Record<string, boolean>>({});
  const [validDone, setValidDone] = useState<Record<string, boolean>>({});
  const [checksRun, setChecksRun] = useState(false);
  const [closeCall, setCloseCall] = useState<string | null>(null);
  const [drift, setDrift] = useState<string | null>(null);
  const [signName, setSignName] = useState('');
  const [signed, setSigned] = useState<{ name: string; at: string } | null>(null);

  const checks = useMemo(() => outputControlChecks(), []);
  const allChecksPass = checks.every((c) => c.passed);
  const methodOk = METHOD_ITEMS.every((i) => methodDone[i.id]);
  const validOk = VALIDATION_ITEMS.every((i) => validDone[i.id]);
  const closeCallOk = CLOSE_CALL_OPTIONS.find((o) => o.id === closeCall)?.valid === true;
  const driftOk = DRIFT_OPTIONS.find((o) => o.id === drift)?.valid === true;
  const steps = [methodOk, validOk, checksRun && allChecksPass, closeCallOk, driftOk];
  const readyToSign = steps.every(Boolean) && signName.trim().length > 1;

  const reset = () => {
    setMethodDone({}); setValidDone({}); setChecksRun(false);
    setCloseCall(null); setDrift(null); setSignName(''); setSigned(null);
  };

  const downloadRecord = () => {
    const record = {
      record: 'model-governance-review (Financial Model Lab practicum)',
      model_version: MODEL_CARD.version,
      reviewer: signed?.name,
      signed_at_utc: signed?.at,
      attestation: 'I reviewed the methodology, re-checked the validation gate against its written thresholds, ran completeness and accuracy checks on the prediction table, and dispositioned every flagged item before approving this run for use.',
      methodology_and_retention: METHOD_ITEMS.map((i) => ({ item: i.label, confirmed: true })),
      independent_validation: VALIDATION_ITEMS.map((i) => ({ step: i.label, performed: true })),
      thresholds: {
        validation_gate: { min_test_accuracy: MODEL_CARD.gate.minTestAccuracy, min_class_recall: MODEL_CARD.gate.minClassRecall, passed: true },
        close_call_confidence: CLOSE_CALL_THRESHOLD,
        drift_std: DRIFT_THRESHOLDS,
      },
      output_controls: checks.map((c) => ({ check: c.label, kind: c.kind, detail: c.detail, passed: c.passed })),
      dispositions: {
        close_call_N001: CLOSE_CALL_OPTIONS.find((o) => o.id === closeCall)?.label,
        drift_fragmentation_index: DRIFT_OPTIONS.find((o) => o.id === drift)?.label,
      },
      note: 'Practice artifact from the teaching module — synthetic data; education only.',
    };
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model-governance-review_v${MODEL_CARD.version}_${(signed?.at ?? '').slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    track('fml_download', { file: 'governance-record' });
  };

  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: steps.every(Boolean) ? 'var(--pos)' : 'var(--text-tertiary)' }}>
        {steps.filter(Boolean).length} of 5 review steps complete {steps.every(Boolean) ? '— ready for sign-off' : ''}
      </div>

      <div style={practicumBlockTitle}>A · Documentation & retention — confirm each against the model card</div>
      {METHOD_ITEMS.map((i) => (
        <CheckItem key={i.id} checked={!!methodDone[i.id]} onToggle={() => setMethodDone((s) => ({ ...s, [i.id]: !s[i.id] }))} label={i.label} evidence={i.evidence} />
      ))}

      <div style={practicumBlockTitle}>B · Independent validation — the required steps</div>
      {VALIDATION_ITEMS.map((i) => (
        <CheckItem key={i.id} checked={!!validDone[i.id]} onToggle={() => setValidDone((s) => ({ ...s, [i.id]: !s[i.id] }))} label={i.label} evidence={i.evidence} />
      ))}

      <div style={practicumBlockTitle}>C · Completeness & accuracy on the output — run them for real</div>
      {!checksRun ? (
        <button
          type="button"
          onClick={() => setChecksRun(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, color: 'var(--accent-contrast)', background: 'var(--accent)', border: 'none', borderRadius: 999, cursor: 'pointer' }}
        >
          <ShieldCheck size={15} /> Run the 6 checks on the live prediction table
        </button>
      ) : (
        <div>
          {checks.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700, color: c.passed ? 'var(--pos)' : 'var(--neg)' }}>{c.passed ? '✓' : '✗'}</span>
              <span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {c.label} <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>· {c.kind}</span>
                </span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--text-tertiary)' }}>{c.detail}</span>
              </span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
            These are the same tie-outs as the Excel I-column and B20 cells — computed here directly from the table. This is what &quot;proving your IPE&quot; means.
          </div>
        </div>
      )}

      <div style={practicumBlockTitle}>D · Disposition the close call — NorthPine at 0.510 confidence</div>
      <RadioGroup name="closecall" options={CLOSE_CALL_OPTIONS} value={closeCall} onPick={setCloseCall} />

      <div style={practicumBlockTitle}>E · Disposition the drift flag — fragmentation_index at +1.12σ (see the monitor below)</div>
      <RadioGroup name="drift" options={DRIFT_OPTIONS} value={drift} onPick={setDrift} />

      <div style={practicumBlockTitle}>F · Sign-off — unlocked only when A–E are done</div>
      {!signed ? (
        <div>
          <p style={{ ...hintStyle, marginBottom: 8 }}>
            Attestation: <em>&quot;I reviewed the methodology, re-checked the validation gate against its
            written thresholds, ran completeness and accuracy checks on the prediction table, and
            dispositioned every flagged item before approving this run for use.&quot;</em>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <input
              type="text"
              value={signName}
              onChange={(e) => setSignName(e.target.value)}
              placeholder="Reviewer name"
              aria-label="Reviewer name"
              style={{ fontSize: 13, padding: '8px 12px', borderRadius: 8, color: 'var(--text-primary)', background: 'var(--bg-elevated-2)', border: '1px solid var(--border-strong)', minWidth: 180 }}
            />
            <button
              type="button"
              disabled={!readyToSign}
              onClick={() => setSigned({ name: signName.trim(), at: new Date().toISOString() })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700,
                color: readyToSign ? 'var(--accent-contrast)' : 'var(--text-muted)',
                background: readyToSign ? 'var(--accent)' : 'var(--bg-elevated-2)',
                border: readyToSign ? 'none' : '1px solid var(--border)',
                borderRadius: 999, cursor: readyToSign ? 'pointer' : 'not-allowed',
              }}
            >
              <Check size={15} /> Sign the review record
            </button>
            {!readyToSign && (
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {steps.every(Boolean) ? 'Enter your name to sign.' : 'Complete A–E first — a sign-off you can rush is not a control.'}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--accent)', background: 'var(--accent-soft)', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--accent)' }}>
            Signed — model v{MODEL_CARD.version} scoring run approved for use
          </div>
          <div style={{ ...mono, fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            {signed.name} · {signed.at}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={downloadRecord}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', fontSize: 12.5, fontWeight: 700, color: 'var(--accent)', background: 'transparent', border: '1px solid var(--accent)', borderRadius: 999, cursor: 'pointer' }}
            >
              <Download size={14} /> Download the signed record (JSON)
            </button>
            <Chip active={false} onClick={reset}>Reset the practicum</Chip>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 8, lineHeight: 1.5 }}>
            The download is your evidence bundle: every confirmation, check result, threshold, and
            disposition, with your name and a timestamp. In a real close this file goes in the close
            folder — that is retention.
          </div>
        </div>
      )}
    </div>
  );
}

function DriftMonitor() {
  const [shock, setShock] = useState(false);
  const rows = useMemo(
    () => (shock
      ? PREDICTIONS.map((r) => ({ ...r, features: { ...r.features, interest_rate_pct: r.features.interest_rate_pct + 3 } }))
      : PREDICTIONS),
    [shock],
  );
  const drift = useMemo(() => featureDrift(rows), [rows]);

  const tone = (s: string) =>
    s === 'INVESTIGATE' ? 'var(--severity-high)' : s === 'WATCH' ? 'var(--severity-medium)' : 'var(--pos)';
  const bg = (s: string) =>
    s === 'INVESTIGATE' ? 'var(--severity-high-bg)' : s === 'WATCH' ? 'var(--severity-medium-bg)' : undefined;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Chip active={shock} onClick={() => setShock(!shock)}>
          {shock ? 'Rate shock ON (+3 pts on every interest rate)' : 'Simulate the 2022 rate shock (+3 pts)'}
        </Chip>
        <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
          computed live from the scored cohort vs the 240 training rows
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>Feature</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Training mean ± std</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>New-cohort mean</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Shift (σ)</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {drift.map((d) => {
              const f = FEATURES.find((x) => x.id === d.feature);
              return (
                <tr key={d.feature} style={{ background: bg(d.status) }}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{f?.label}</td>
                  <td style={{ ...tdStyle, ...mono, textAlign: 'right' }}>{d.meanTrain.toFixed(2)} ± {d.stdTrain.toFixed(2)}</td>
                  <td style={{ ...tdStyle, ...mono, textAlign: 'right' }}>{d.meanNew.toFixed(2)}</td>
                  <td style={{ ...tdStyle, ...mono, textAlign: 'right', fontWeight: d.status === 'STABLE' ? 500 : 700, color: tone(d.status) }}>
                    {d.shiftStd > 0 ? '+' : ''}{d.shiftStd.toFixed(2)}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: tone(d.status) }}>{d.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ ...hintStyle, marginTop: 10, marginBottom: 0 }}>
        Thresholds: |shift| ≥ {DRIFT_THRESHOLDS.watch}σ = WATCH (note it, look again next run), ≥{' '}
        {DRIFT_THRESHOLDS.investigate}σ = INVESTIGATE (stop trusting scores until a human decides:
        revalidate, retrain, or accept with a documented rationale — that decision is practicum step E).
        The real flag here is honest: the 2025 cohort skews to fragmented sectors (+1.12σ), which is
        exactly why M&amp;A dominates the recommendations. Flip the rate-shock toggle to watch a second,
        nastier kind of drift appear — the cheap-money-model-in-an-expensive-money-world failure. The
        kit&apos;s <span style={mono}>python/04_drift_check.py</span> computes this same table and writes{' '}
        <span style={mono}>outputs/drift_report.json</span>; the grown-up versions of the method are PSI
        and KS tests, and the other half of drift monitoring is <strong>output drift</strong>: average
        confidence falling or the close-call rate rising.
      </p>
    </div>
  );
}

function GovernTab() {
  return (
    <>
      <StepCard n={1} icon={<ShieldCheck size={18} />} title="The operating model — segregation of duties first">
        <p style={hintStyle}>
          Managing a model in a finance team is the same discipline as managing a close: <strong>the
          person who prepares never approves</strong>, every judgment leaves evidence, and independence
          is structural, not aspirational. Six roles (in a small team one person may wear two hats — but
          developer and approver must never be the same person for the same model):
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr><th style={thStyle}>Role</th><th style={thStyle}>Does</th><th style={thStyle}>Never</th></tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.role}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'normal', minWidth: 150 }}>{r.role}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'normal', lineHeight: 1.5 }}>{r.does}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'normal', lineHeight: 1.5, color: 'var(--neg)' }}>{r.never}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StepCard>

      <StepCard n={2} icon={<ShieldCheck size={18} />} title="The approval matrix — what is reviewed, signed, and when">
        <p style={hintStyle}>
          Every artifact the pipeline produces has a named control, a named signer, and a cadence.
          This table <em>is</em> the answer to &quot;what gets signed off?&quot; — pin it to the wall:
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={thStyle}>Artifact</th><th style={thStyle}>Control</th>
                <th style={thStyle}>Sign-off</th><th style={thStyle}>Cadence</th>
              </tr>
            </thead>
            <tbody>
              {APPROVAL_MATRIX.map((r) => (
                <tr key={r.artifact}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'normal', minWidth: 140 }}>{r.artifact}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'normal', lineHeight: 1.5 }}>{r.control}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'normal', lineHeight: 1.5 }}>{r.signer}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'normal' }}>{r.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...hintStyle, marginTop: 10, marginBottom: 0 }}>
          Sign-off means a name and a date on evidence that will still exist next year — a signed model
          card, a reviewed close-call log, an initialed tie-out. &quot;I looked at it&quot; without evidence is
          not a control; it&apos;s a memory.
        </p>
      </StepCard>

      <StepCard n={3} icon={<ShieldCheck size={18} />} title="What the auditors test — the ICFR / PCAOB lens">
        <p style={hintStyle}>
          The moment a model&apos;s output influences a <strong>financial-statement number</strong> — a CECL
          reserve (ASC 326), an impairment forecast (ASC 350/360), variable consideration under ASC 606 —
          it becomes part of an accounting estimate, and the auditors&apos; standards reach it: think PCAOB
          AS 2201 (auditing ICFR), AS 1105 (audit evidence, including information produced by the
          entity), and AS 2501 (auditing estimates), all sitting on the COSO framework. A capital-allocation
          scorer like ours is decision support, not a booked number — lighter stakes, same disciplines.
          Six areas an audit walks through, and where this module already answers each:
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={thStyle}>Area</th><th style={thStyle}>What they want to see</th>
                <th style={thStyle}>Where this module does it</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_AREAS.map((r) => (
                <tr key={r.area}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'normal', minWidth: 150 }}>{r.area}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'normal', lineHeight: 1.5 }}>{r.want}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'normal', lineHeight: 1.5, color: 'var(--text-tertiary)' }}>{r.here}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...hintStyle, marginTop: 10, marginBottom: 0 }}>
          <strong>GAAP itself never says the word &quot;model&quot;</strong> — it demands faithful, supportable
          estimates; the model is your method, so the burden lands on method + assumptions + data, which
          is precisely what the model card documents. (Teaching summary, not authoritative audit
          guidance — the standards themselves govern.)
        </p>
      </StepCard>

      <StepCard n={4} icon={<CalendarClock size={18} />} title="The manager's rhythm — and the stop conditions">
        <ul style={{ ...hintStyle, paddingLeft: 18 }}>
          <li><strong>Every scoring run:</strong> job succeeded (exit code 0)? Prediction counts complete? Every close call dispositioned by a human, in writing?</li>
          <li><strong>Every retrain:</strong> read the new model card end to end; challenge anything that moved (a coefficient that flipped sign is a question, not a footnote); sign or reject; bump the version.</li>
          <li><strong>Quarterly:</strong> revalidate against the newest certified outcomes; review who has access; confirm retention of old cards and tables.</li>
          <li><strong>Annually:</strong> independent validation (someone outside the team re-performs from raw data); refresh the written policy.</li>
        </ul>
        <p style={hintStyle}>Stop using the model — fall back to human judgment — when any of these appear:</p>
        <ul style={{ ...hintStyle, paddingLeft: 18, marginBottom: 0 }}>
          <li>The validation gate fails on retrain (accuracy or any class recall below threshold).</li>
          <li><strong>Drift:</strong> today&apos;s inputs stop resembling the training data (the 2022 rate spike against a cheap-money training window is the canonical case).</li>
          <li>Close calls stop being rare — a model that&apos;s uncertain everywhere is telling you the world changed.</li>
          <li>Anyone bypasses the approval gate, even once, even helpfully. That&apos;s a control failure, not a shortcut.</li>
        </ul>
      </StepCard>

      <StepCard n={5} icon={<ClipboardSignature size={18} />} title="The practicum — run the review and sign off yourself">
        <NewContent>
          <p style={hintStyle}>
            Everything above, performed instead of read. You are the model owner reviewing this scoring
            run before anyone acts on it: confirm the <strong>documentation, methodology &amp;
            retention</strong> evidence (A), tick through the <strong>required independent validation
            steps</strong> (B), actually <strong>run the completeness &amp; accuracy checks</strong> on
            the live prediction table (C — computed for real, not simulated), <strong>disposition the
            two flagged items</strong> — the close call and the drift flag (D, E) — and only then does
            the <strong>sign-off</strong> unlock (F). Signing produces a downloadable, timestamped
            review record: your evidence bundle. Two of the six options are traps; the app will tell
            you why they&apos;re blocked.
          </p>
          <GovernancePracticum />
        </NewContent>
      </StepCard>

      <StepCard n={6} icon={<Activity size={18} />} title="Drift — measured live on this cohort">
        <NewContent>
          <p style={hintStyle}>
            Drift is the question &quot;does today&apos;s data still look like the data the model learned
            from?&quot; — answered with a number, per feature:
          </p>
          <Eq>shift(f) = (mean_new(f) − mean_train(f)) ÷ std_train(f){'\n'}|shift| ≥ 0.5σ → WATCH · |shift| ≥ 1.0σ → INVESTIGATE</Eq>
          <DriftMonitor />
        </NewContent>
      </StepCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 10 — the EY interview lens
// ---------------------------------------------------------------------------

const THIRTY_SECOND: { q: string; a: string }[] = [
  { q: 'What’s the difference between AI and ML?', a: 'AI is the umbrella; ML is the subset that learns patterns from data instead of following hand-written rules. I trained a multinomial logistic regression — that’s ML, and therefore AI, but nowhere near an LLM.' },
  { q: 'So what’s an LLM?', a: 'An enormous ML model specialized around language — it generates and reasons over text. It should narrate analysis, not perform arithmetic; the numbers should come from SQL and validated models underneath it.' },
  { q: 'And an AI agent?', a: 'Not a model — a system: models plus tools, data, rules, memory, and permissions pursuing a goal. The governance question for an agent is “what is it permitted to do without a human?”, which is a controls question, not a data-science question.' },
  { q: 'Where does AI fit in finance safely?', a: 'Layered: SQL establishes facts, ML estimates and predicts behind a validation gate, an LLM explains the results, and an agent acts only inside approvals. Each layer has different controls — that layering is the whole safety argument.' },
  { q: 'What’s the biggest AI risk in financial reporting?', a: 'Unvalidated model output treated as fact — an IPE problem. If a model feeds an estimate, I’d expect documented methodology, independent validation against predefined thresholds, completeness and accuracy checks on the output, and a named reviewer’s dated sign-off.' },
];

const EY_QA: { q: string; a: string }[] = [
  { q: '“How would you use AI in this role?”', a: 'Start with the boring answer — that’s the credible one: deterministic SQL for facts and reconciliation, ML for scoring and anomaly detection where labeled history exists, an LLM for drafting memos and summarizing exceptions, never for computing balances. Then one concrete proof: this project, end to end.' },
  { q: '“How would you audit a number that came from a model?”', a: 'Treat it as an estimate plus IPE: test the data feeding it (completeness, accuracy), the model’s validation (who, against what thresholds, how independent), the change history, and the management review that consumed it. Then re-perform a sample — my pipeline is seeded, so re-running it is literally the re-performance.' },
  { q: '“When would you NOT use machine learning?”', a: 'When a rule already expresses the policy (a tolerance check needs no training), when there’s too little labeled history to validate honestly, or when explainability requirements outweigh accuracy gains. A model you can’t explain to a reviewer is a finding waiting to happen.' },
  { q: '“Explain precision vs. recall to a partner in one breath.”', a: 'Precision: when the model flags something, how often it’s right — false alarms. Recall: of everything it should have flagged, how much it caught — misses. Fraud detection prioritizes recall; escalation queues need precision, or people stop reading them.' },
  { q: '“Tell me about a time you taught yourself something technical.”', a: 'This module is the story — see the STAR framing below. The point isn’t the 88%; it’s that the pipeline shipped with segregation of duties, a written gate, and an audit trail, because that’s the instinct the role actually hires for.' },
];

function EyTab() {
  return (
    <>
      <StepCard n={1} icon={<GraduationCap size={18} />} title="The 30-second answers">
        <p style={hintStyle}>
          Interviews reward crisp category boundaries. These five land the vocabulary from tab 8 in
          spoken-answer form — practice them out loud:
        </p>
        {THIRTY_SECOND.map((item) => (
          <div key={item.q} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{item.q}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.a}</div>
          </div>
        ))}
      </StepCard>

      <StepCard n={2} icon={<GraduationCap size={18} />} title="This project as your STAR story">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {[
            ['Situation', 'Capital-allocation decisions — new product vs. M&A vs. paying down debt — were being argued from instinct, with certified history showing an 11.5-point ROI gap between choosing right and wrong.'],
            ['Task', 'Teach myself SQL and Python well enough to turn that history into a decision-support model — with controls a reviewer would accept.'],
            ['Action', 'Built the full pipeline: normalized SQLite schema, feature views in SQL, a scikit-learn logistic regression with a stratified train/test split, a written validation gate (≥80% accuracy, ≥70% per-class recall), an approval-enforcing inference script, and Power BI + Excel reporting with completeness and accuracy tie-outs.'],
            ['Result', '88.3% test accuracy, model APPROVED under the gate, twelve companies scored with probabilities — and the model’s one coin-flip (51%) routed to human review instead of being hidden. Reproducible end to end from a fixed seed.'],
          ].map(([k, v]) => (
            <GlassCard key={k} variant="nested" padding={14}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>{k}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{v}</div>
            </GlassCard>
          ))}
        </div>
        <p style={{ ...hintStyle, marginTop: 12, marginBottom: 0 }}>
          Close with the sentence that separates you from every other candidate who says &quot;AI&quot;:{' '}
          <em>&quot;The interesting part wasn&apos;t training the model — it was making it auditable.&quot;</em>
        </p>
      </StepCard>

      <StepCard n={3} icon={<GraduationCap size={18} />} title="Likely questions, model answers">
        {EY_QA.map((item) => (
          <div key={item.q} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{item.q}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.a}</div>
          </div>
        ))}
        <p style={{ ...hintStyle, marginBottom: 0 }}>
          Vocabulary that lands in the room — use these terms and mean them: <strong>IPE</strong>{' '}
          (information produced by the entity), <strong>management review control</strong>,{' '}
          <strong>segregation of duties</strong>, <strong>change management</strong>,{' '}
          <strong>effective challenge</strong>, <strong>re-performance</strong>,{' '}
          <strong>completeness &amp; accuracy</strong>. Tab 9 defines each with this project as the example.
        </p>
      </StepCard>

      <StepCard n={4} icon={<GraduationCap size={18} />} title="Pair this with the Corporate Finance Lab's EY prep">
        <p style={{ ...hintStyle, marginBottom: 10 }}>
          The <Link to="/corporate-finance" style={{ color: 'var(--accent)', fontWeight: 600 }}>Corporate Finance Lab</Link>{' '}
          carries the full interview track — the EY gap check, the Q&amp;A drill with model answers, and
          the round-by-round map. This tab adds the AI/ML/data layer those tabs don&apos;t cover; together
          they&apos;re the technical story plus the finance story.
        </p>
      </StepCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Right-pane user guide — one per tab: what it's for, how to use it,
// the formulas that matter, and a worked example.
// ---------------------------------------------------------------------------

function TabGuide({ tab }: { tab: TabId }) {
  switch (tab) {
    case 'story':
      return (
        <>
          <GuideSection n={1} title="What this tab is for">
            The map of the whole module: the business question, the two pipeline flows
            (training happens once; production runs every time new data arrives), and the
            vocabulary you&apos;ll need everywhere else.
          </GuideSection>
          <GuideSection n={2} title="How to use it">
            Read the story card first, then walk the two diagrams top to bottom.
            <strong> Click any stage node</strong> to jump to the tab that teaches it. Keep the
            glossary open in your head — every term in it comes back later.
          </GuideSection>
          <GuideSection n={3} title="The number that justifies the module">
            <Eq>chose right: 18.3% avg 3-yr ROI (182 cos){'\n'}chose wrong:  6.8% avg 3-yr ROI (58 cos){'\n'}gap = 11.5 points</Eq>
            If choosing the right door is worth 11.5 ROI points, a model that raises your hit
            rate pays for itself. You verify these numbers yourself with SQL query 2e in tab 3.
          </GuideSection>
          <GuideSection n={4} title="Try this">
            Click the &quot;Trained model — v1.0&quot; node on the left diagram, then the &quot;Prediction
            table&quot; node on the right one — those two boxes are the handoff between the whole
            training world and the whole production world.
          </GuideSection>
        </>
      );
    case 'setup':
      return (
        <>
          <GuideSection n={1} title="What this tab is for">
            Getting your machine ready once: Python, VS Code, DB Browser for SQLite, and the
            kit unzipped to C:\dev\Financial-Model. Nothing here needs data from anywhere —
            the kit generates its own.
          </GuideSection>
          <GuideSection n={2} title="How to use it">
            Do the four steps in order, and don&apos;t skip the smoke test — it proves Python,
            the folder, and the kit all work before you invest an evening. Every new terminal
            session starts with re-activating the venv:
            <Eq>cd C:\dev\Financial-Model{'\n'}.venv\Scripts\activate</Eq>
          </GuideSection>
          <GuideSection n={3} title="If something fails">
            &quot;python is not recognized&quot; → Python wasn&apos;t added to PATH; re-run the installer and
            tick the box. pip errors → the venv isn&apos;t active (no &quot;(.venv)&quot; at the prompt).
            Wrong label balance → you edited the generator; that&apos;s fine, just know your numbers
            now differ from the site&apos;s.
          </GuideSection>
          <GuideSection n={4} title="Success looks like">
            <Eq>label balance: NEW_PRODUCT 78 · MA 80 · PAY_DEBT 82</Eq>
            Matching that line to the decimal means your machine will reproduce every number
            in this module.
          </GuideSection>
        </>
      );
    case 'sql':
      return (
        <>
          <GuideSection n={1} title="What this tab is for">
            The facts layer. You learn tables, SELECT, GROUP BY, JOIN, CASE, and views by
            building the exact dataset the model trains on. SQL&apos;s job: turn certified raw
            tables into one clean feature table, in one certified place.
          </GuideSection>
          <GuideSection n={2} title="How to use it">
            Open finmodel.db in DB Browser → Execute SQL. Run <strong>one query at a
            time</strong>, read the result, then compare against the &quot;what you should see&quot;
            block before moving on. If yours differs, re-run python\00_load_database.py and
            try again.
          </GuideSection>
          <GuideSection n={3} title="Formulas that matter">
            The two engineered features (computed in the view, not stored):
            <Eq>debt_to_ebitda = debt_m ÷ ebitda_m{'\n'}cash_pct_of_revenue = 100 × cash_m ÷ revenue_m</Eq>
            And the join rule that lines up every table:
            <Eq>JOIN … ON c.company_id = o.company_id{'\n'}(market joins on sector AND fy — two keys)</Eq>
          </GuideSection>
          <GuideSection n={4} title="Worked example">
            Query 2c filters WHERE best_action = &apos;PAY_DEBT&apos;. Change it to &apos;MA&apos; and re-run:
            you should get 80 rows, and the top ROI names change. That one edit — filter,
            re-run, read — is 80% of day-to-day SQL.
          </GuideSection>
        </>
      );
    case 'python':
      return (
        <>
          <GuideSection n={1} title="What this tab is for">
            The prediction layer: pandas reads the SQL view, scikit-learn trains and grades
            the model, a written gate approves it, and inference scores the new companies.
            Steps 1–6 mirror the kit scripts one-to-one; step 7 lets you drive the result.
          </GuideSection>
          <GuideSection n={2} title="How to use it">
            Run the kit scripts in order (01_explore → 02_train_model → 03_inference),
            comparing each printout to the blocks here. Then spend real time in the
            <strong> what-if sandbox</strong> — the three experiments are chosen to make the
            weights table physical.
          </GuideSection>
          <GuideSection n={3} title="The math, in four lines">
            Standardize each feature, weight it, sum it, squash to probabilities:
            <Eq>z = (x − mean) ÷ std{'\n'}score(a) = intercept(a) + Σ weight(a,f) × z(f){'\n'}P(a) = e^score(a) ÷ Σ e^score(all){'\n'}P(new product) + P(M&A) + P(pay debt) = 1</Eq>
            And the grading:
            <Eq>accuracy = correct ÷ total = 53 ÷ 60 = 88.3%{'\n'}precision = TP ÷ (TP + FP)   &quot;when it says A, is it right?&quot;{'\n'}recall = TP ÷ (TP + FN)      &quot;of true A&apos;s, how many found?&quot;</Eq>
          </GuideSection>
          <GuideSection n={4} title="The gate (memorize this shape)">
            <Eq>APPROVED iff test accuracy ≥ 80%{'\n'}     AND every class recall ≥ 70%</Eq>
            Written before results are seen; enforced by the inference script. This one idea
            is what makes ML compatible with your ICFR instincts.
          </GuideSection>
        </>
      );
    case 'powerbi':
      return (
        <>
          <GuideSection n={1} title="What this tab is for">
            The monitoring report — how management watches the model without touching it. The
            mock at the top is live so you can feel cross-filtering before you build it.
          </GuideSection>
          <GuideSection n={2} title="How to use it">
            Click sectors in the slicer and watch every KPI, chart, and table recompute —
            that behavior is what you&apos;re rebuilding. Then follow build steps 1–3 in Power BI
            Desktop with prediction_table.csv (download in step 4).
          </GuideSection>
          <GuideSection n={3} title="Formulas that matter (DAX)">
            <Eq>Companies Scored = COUNTROWS(prediction_table){'\n'}Avg Confidence = AVERAGE(prediction_table[confidence]){'\n'}Close Calls = CALCULATE(COUNTROWS(prediction_table),{'\n'}    prediction_table[confidence] &lt; 0.6)</Eq>
            A measure recomputes under whatever filters are active — CALCULATE adds one more
            filter of your own. Same COUNTIF idea as Excel, different dialect.
          </GuideSection>
          <GuideSection n={4} title="Worked example">
            Click <strong>Healthcare Services</strong> in the slicer: 2 companies —
            Bristlecone (M&amp;A, 0.974) and Helix (New product, 0.708). Companies scored drops
            to 2, close calls to 0, and both charts redraw. That&apos;s a filter context — the
            single most important Power BI concept.
          </GuideSection>
        </>
      );
    case 'excel':
      return (
        <>
          <GuideSection n={1} title="What this tab is for">
            The analyst&apos;s workbook — the same prediction table rebuilt with formulas you can
            trace cell by cell, plus the control checks (tie-outs) that make a spreadsheet
            audit-ready.
          </GuideSection>
          <GuideSection n={2} title="How to use it">
            In the mock, click cells in this order and read the formula bar + explanation
            each time: B2 → D2 → G2 → H2 → I2 → J2 → B17 → C17 → B20. Then build it for real
            with steps 1–4, and download the finished workbook in step 5 to compare.
          </GuideSection>
          <GuideSection n={3} title="Formulas that matter">
            The lookup (learn this one pattern and you can join anything):
            <Eq>=INDEX(data_col, MATCH(key, key_col, 0))</Eq>
            The derivations and checks:
            <Eq>=MAX(D2:F2)            → confidence{'\n'}=SUM(D2:F2) ≈ 1.000    → tie-out (±0.005 rounding){'\n'}=IF(H2&lt;0.6,&quot;REVIEW…&quot;,&quot;OK&quot;) → the flag</Eq>
            The summary block:
            <Eq>=COUNTIF($G$2:$G$13, action){'\n'}=AVERAGEIF($G$2:$G$13, action, $H$2:$H$13)</Eq>
          </GuideSection>
          <GuideSection n={4} title="Why the checks exist">
            I2 (sum ≈ 1) is an accuracy check on imported data; B20 (counts sum to 12) is a
            completeness check. Together they&apos;re what an auditor calls proving your IPE —
            tab 9 explains why that matters.
          </GuideSection>
        </>
      );
    case 'automate':
      return (
        <>
          <GuideSection n={1} title="What this tab is for">
            Turning the pipeline into a scheduled job — the &quot;cron job&quot; — and drawing the hard
            line between what may run unattended and what always needs a human.
          </GuideSection>
          <GuideSection n={2} title="How to use it">
            Do step 2 (Task Scheduler) on your machine, then right-click → Run once and
            check the result code before trusting the schedule:
            <Eq>Last Run Result (0x0) = exit code 0 = success{'\n'}anything else = a step failed — read pipeline output</Eq>
          </GuideSection>
          <GuideSection n={3} title="Reading a cron line">
            <Eq>0 6 * * 1{'\n'}│ │ │ │ └ day-of-week (1 = Monday){'\n'}│ │ │ └── month (* = every){'\n'}│ │ └──── day-of-month (* = every){'\n'}│ └────── hour (6 = 06:00){'\n'}└──────── minute (0)</Eq>
            Five fields, left to right, smallest to largest. Windows Task Scheduler expresses
            the same idea through the Trigger dialog.
          </GuideSection>
          <GuideSection n={4} title="The governance line">
            Automate: load → score (with the APPROVED model) → refresh reports. Never
            automate: approving a retrained model. Retraining may be scheduled; approval is a
            named human reading the new model card.
          </GuideSection>
        </>
      );
    case 'stack':
      return (
        <>
          <GuideSection n={1} title="What this tab is for">
            The zoom-out: what &quot;AI&quot; actually covers (rules → ML → LLM → agent), where each
            layer belongs in finance, and the agent layer — using one (step 5) and building
            one (step 7).
          </GuideSection>
          <GuideSection n={2} title="How to use it">
            Read steps 1–4 for the vocabulary, then DO step 5: attach the three files to a
            Claude chat, paste the prompt, and watch the runbook control its behavior. Then
            step 7&apos;s template to build your own. All texts are on this page and downloadable.
          </GuideSection>
          <GuideSection n={3} title="The two definitions to keep">
            <Eq>agent = models + tools + data + rules{'\n'}        + memory/workflow + permissions</Eq>
            <Eq>skill shape: VERIFY → ANALYZE → FLAG{'\n'}             → DRAFT → STOP (at the gate)</Eq>
            An agent is a system, not a model; a skill is a written procedure, not code.
          </GuideSection>
          <GuideSection n={4} title="Worked example">
            After the step-5 exercise responds, ask it: &quot;which of your statements are computed
            facts from the files, and which are your interpretation?&quot; The answer draws the
            fact/narration boundary — the whole safety argument of the stack, demonstrated.
          </GuideSection>
        </>
      );
    case 'govern':
      return (
        <>
          <GuideSection n={1} title="What this tab is for">
            The manager&apos;s playbook: who does what (segregation of duties), what gets signed
            and when (the approval matrix), what an audit tests, and when to stop trusting
            the model.
          </GuideSection>
          <GuideSection n={2} title="How to use it">
            Read steps 1–4 asking &quot;which hats would I wear?&quot; (in a small team: owner + reviewer,
            never developer + approver of the same model). <span className="fml-new">Then DO step
            5 — the practicum: confirm the documentation evidence, tick the validation steps, run
            the completeness &amp; accuracy checks for real, disposition the close call and the
            drift flag, sign, and download your signed record. Step 6 is the live drift monitor —
            flip the rate-shock toggle and watch a second flag fire.</span>
          </GuideSection>
          <GuideSection n={3} title="The rules in shorthand">
            <Eq>preparer ≠ approver (per model, always){'\n'}control = procedure + named owner{'\n'}        + evidence + date{'\n'}model gate: acc ≥ 80% AND recall ≥ 70%</Eq>
            <span className="fml-new">
              <Eq>drift(f) = (mean_new − mean_train) ÷ std_train{'\n'}≥ 0.5σ WATCH · ≥ 1.0σ INVESTIGATE</Eq>
            </span>
            &quot;I looked at it&quot; without evidence is a memory, not a control.
          </GuideSection>
          <GuideSection n={4} title="Worked example — sign-off evidence">
            A real model approval trail: the model card JSON (metrics + gate result) saved to
            the close folder, the reviewer&apos;s name and date written into it, and the close-call
            log showing each flagged row&apos;s disposition. That bundle answers an auditor&apos;s
            &quot;show me&quot; in one attachment.
          </GuideSection>
        </>
      );
    case 'ey':
      return (
        <>
          <GuideSection n={1} title="What this tab is for">
            Packaging everything you built into interview-ready language: crisp definitions,
            the project as a STAR story, and model answers to the questions you&apos;re most
            likely to get.
          </GuideSection>
          <GuideSection n={2} title="How to use it">
            Practice the 30-second answers out loud — twice each. Then rehearse the STAR
            story until the four beats come without reading. Pair with the Corporate Finance
            Lab&apos;s EY tabs (step 4) for the finance-side drills.
          </GuideSection>
          <GuideSection n={3} title="Vocabulary that lands">
            IPE · management review control · segregation of duties · change management ·
            effective challenge · re-performance · completeness &amp; accuracy. Use them only
            where you can point to where this project does each — tab 9 is that map.
          </GuideSection>
          <GuideSection n={4} title="Your closing sentence">
            <Eq>&quot;The interesting part wasn&apos;t training the model —{'\n'} it was making it auditable.&quot;</Eq>
            One sentence, and it separates you from every candidate who says &quot;AI&quot; without a
            controls story.
          </GuideSection>
        </>
      );
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FinancialModelLab() {
  const [tab, setTab] = useState<TabId>('story');
  const jump = (t: TabId) => {
    setTab(t);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        padding: '48px 24px', maxWidth: 1400, margin: '0 auto', width: '100%',
      }}
    >
      <style>{`
        .fml-layout { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 24px; align-items: start; }
        .fml-guide { position: sticky; top: 24px; max-height: calc(100vh - 48px); overflow-y: auto; }
        @media (max-width: 1040px) {
          .fml-layout { grid-template-columns: 1fr; }
          .fml-guide { position: static; max-height: none; }
        }
        /* Newly added content renders in red while Jessica reviews it
           (theme-aware via --neg); flipped back by HIGHLIGHT_NEW = false. */
        .fml-new, .fml-new * { color: var(--neg) !important; }
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
        <h1 style={{ fontSize: 32, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Financial Model Lab</h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 10, maxWidth: 760, lineHeight: 1.6 }}>
          Learn <strong>SQL and Python by building a real ML pipeline</strong> around one decision:
          should the next $10M fund a <strong>new product line</strong>, an <strong>acquisition</strong>,
          or <strong>pay off debt</strong>? Certified history → SQL → training dataset → a trained,
          tested, and approved model → inference on new companies → a prediction table that forks into
          a <strong>Power BI report</strong> and a <strong>traceable Excel workbook</strong>. Then the
          wider frame: where the <strong>AI stack</strong> (rules → ML → LLM → agent) fits in finance,
          how a manager <strong>governs and signs off</strong> on all of it to audit standards, and how
          to carry the whole story into an <strong>EY interview</strong>. Every number on this page is
          the real output of the downloadable kit (fixed seed — your run will match).{' '}
          <strong>Education only; synthetic data; not investment advice.</strong>
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
                  track('fml_tab', { tab: t.id });
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

      <div className="fml-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {tab === 'story' && <BigPictureTab onJump={jump} />}
          {tab === 'setup' && <SetupTab />}
          {tab === 'sql' && <SqlTab />}
          {tab === 'python' && <PythonTab />}
          {tab === 'powerbi' && <PowerBiTab />}
          {tab === 'excel' && <ExcelTab />}
          {tab === 'automate' && <AutomateTab />}
          {tab === 'stack' && <AiStackTab />}
          {tab === 'govern' && <GovernTab />}
          {tab === 'ey' && <EyTab />}
        </div>

        <GlassCard as="aside" className="fml-guide" variant="default" padding={20}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
            User guide
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
            {TABS.find((t) => t.id === tab)?.label}
          </div>
          <TabGuide tab={tab} />
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            This pane follows the tab you&apos;re on — what it&apos;s for, how to use it, the formulas
            that matter, and a worked example.
          </div>
        </GlassCard>
      </div>

      <footer style={{ marginTop: 'auto', paddingTop: 48, color: 'var(--text-tertiary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={13} />
        <span>
          Teaching model on synthetic, seeded data — education only; not investment, accounting, or tax
          advice. Kit source: <span style={mono}>financial-model/</span> in this repo.
        </span>
      </footer>
    </div>
  );
}
