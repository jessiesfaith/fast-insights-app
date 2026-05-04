// Eight-tile KPI row, computed live from the recon engine.

import { ARData } from '../../types/data';
import { buildKPIs } from '../../lib/kpis';
import KPITile from './KPITile';

interface Props {
  data: ARData;
  period: string;
}

export function KPIRow({ data, period }: Props) {
  const bundle = buildKPIs(data, period);
  const hasPrior = bundle.period.prior !== null;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
      }}
    >
      {bundle.results.map((k) => (
        <KPITile key={k.key} kpi={k} hasPrior={hasPrior} />
      ))}
    </div>
  );
}

export default KPIRow;
