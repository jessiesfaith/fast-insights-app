// What-if sliders (BUILD.md §9.3). Virtual-only — these never mutate the
// loaded data. KPIs, recon, aging, exceptions all recompute on slider change
// because every consumer of `data` reads the scenario-applied view.

import { RotateCcw, Sliders } from 'lucide-react';
import { useScenario } from '../../lib/scenarioStore';
import { fmtPct } from '../../lib/format';
import GlassCard from '../ui/GlassCard';

export function WhatIfPanel() {
  const { scenario, setWhatIf, resetWhatIf } = useScenario();
  const w = scenario.whatIf;
  const dirty =
    w.resolveUnappliedCashPct > 0 ||
    w.applyAllUnappliedCredits ||
    w.writeOffPastDueDays > 0 ||
    w.collectPastDuePct > 0;

  return (
    <GlassCard>
      <header className="between" style={{ marginBottom: 12 }}>
        <div className="row gap-2" style={{ alignItems: 'center' }}>
          <span
            className="center"
            style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            <Sliders size={14} />
          </span>
          <div>
            <div className="label">What-if</div>
            <h3 style={{ marginTop: 2 }}>Virtual adjustments — read-only</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={resetWhatIf}
          disabled={!dirty}
          className="row gap-1"
          style={{
            alignItems: 'center',
            padding: '6px 10px',
            borderRadius: 8,
            background: 'transparent',
            border: '1px solid var(--border)',
            color: dirty ? 'var(--text-secondary)' : 'var(--text-tertiary)',
            fontSize: 11,
            cursor: dirty ? 'pointer' : 'not-allowed',
            opacity: dirty ? 1 : 0.5,
          }}
        >
          <RotateCcw size={11} /> Reset
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SliderRow
          label="Resolve unapplied cash"
          value={w.resolveUnappliedCashPct}
          display={fmtPct(w.resolveUnappliedCashPct, 0)}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => setWhatIf({ resolveUnappliedCashPct: v })}
          hint="Apply this share of currently-unapplied receipts"
        />
        <Toggle
          label="Apply every unapplied credit memo"
          checked={w.applyAllUnappliedCredits}
          onChange={(v) => setWhatIf({ applyAllUnappliedCredits: v })}
        />
        <SliderRow
          label="Write off past-due over (days)"
          value={w.writeOffPastDueDays}
          display={w.writeOffPastDueDays === 0 ? 'disabled' : `${w.writeOffPastDueDays}d`}
          min={0}
          max={180}
          step={5}
          onChange={(v) => setWhatIf({ writeOffPastDueDays: v })}
          hint="0 disables; otherwise virtually mark older invoices as Written Off"
        />
        <SliderRow
          label="Collect past-due AR"
          value={w.collectPastDuePct}
          display={fmtPct(w.collectPastDuePct, 0)}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => setWhatIf({ collectPastDuePct: v })}
          hint="Synthesize receipts equal to this share of every past-due open balance"
        />
      </div>

      {scenario.demoState === 'cleaned' && (
        <div
          style={{
            marginTop: 12,
            padding: '8px 10px',
            background: 'var(--severity-medium-bg)',
            color: 'var(--severity-medium)',
            borderRadius: 8,
            fontSize: 11,
          }}
        >
          Demo state is "Cleaned" — sliders are ignored until you switch back to "As-is".
        </div>
      )}
    </GlassCard>
  );
}

function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <div>
      <div className="between" style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        <span className="num" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)' }}
      />
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{hint}</div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="row gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: 'var(--accent)' }}
      />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
    </label>
  );
}

export default WhatIfPanel;
