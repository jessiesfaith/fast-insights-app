// As-is / Cleaned period toggle (BUILD.md §9.2).
// Custom-snapshot demo state ships with the JSON snapshot import in milestone 10.

import { Sparkles, GaugeCircle } from 'lucide-react';
import { DemoState } from '../../types/scenario';
import { useScenario } from '../../lib/scenarioStore';

export function ScenarioTabs() {
  const { scenario, setDemoState, resetWhatIf } = useScenario();
  const select = (next: DemoState) => {
    setDemoState(next);
    if (next === 'as-is') resetWhatIf();
  };

  return (
    <div
      className="row"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 999,
        padding: 2,
      }}
    >
      <Tab active={scenario.demoState === 'as-is'} onClick={() => select('as-is')} icon={<GaugeCircle size={12} />} label="As-is" />
      <Tab active={scenario.demoState === 'cleaned'} onClick={() => select('cleaned')} icon={<Sparkles size={12} />} label="Cleaned" />
    </div>
  );
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="row gap-1"
      style={{
        alignItems: 'center',
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
      {icon} {label}
    </button>
  );
}

export default ScenarioTabs;
