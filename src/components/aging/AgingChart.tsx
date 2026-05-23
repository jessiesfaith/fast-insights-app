// Aging chart — vertical bars per bucket plus a horizontal stacked "mix" bar.
// Bucket colors escalate by severity to match the rest of the design system.

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { AGING_BUCKETS, AgingResult, AgingBucket } from '../../types/kpi';
import { fmtMoney, fmtPct } from '../../lib/format';
import { BUCKET_COLOR, resolveCSSVar } from '../../lib/uiColors';

interface Props {
  aging: AgingResult;
}

export function AgingChart({ aging }: Props) {
  const data = aging.totals.map((t) => ({ bucket: t.bucket, amount: t.amount, count: t.count }));
  const total = aging.totalOpenAR;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <MixBar aging={aging} />
      {/* Horizontal bar layout — bucket labels on the y-axis, $ amount
          extending to the right. Easier to compare bucket sizes at a glance
          than vertical bars. */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
              tickFormatter={(v) => fmtMoney(Number(v), 0)}
            />
            <YAxis
              type="category"
              dataKey="bucket"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
              width={64}
              tickFormatter={(v) => (v === 'Current' ? 'Current' : `${v} d`)}
            />
            <Tooltip
              cursor={{ fill: 'var(--accent-soft)' }}
              contentStyle={{
                background: 'var(--bg-elevated-2)',
                border: '1px solid var(--border-strong)',
                borderRadius: 10,
                color: 'var(--text-primary)',
              }}
              formatter={(value: number, _name, props) => {
                const amt = Number(value);
                const pct = total > 0 ? amt / total : 0;
                return [`${fmtMoney(amt, 0)}  ·  ${fmtPct(pct, 1)}  ·  ${props?.payload?.count ?? 0} invoices`, ''];
              }}
              labelFormatter={(label) => `${label} ${label === 'Current' ? '(not yet due)' : 'days past due'}`}
            />
            <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
              {data.map((d) => (
                <Cell key={d.bucket} fill={resolveCSSVar(BUCKET_COLOR[d.bucket as AgingBucket])} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MixBar({ aging }: { aging: AgingResult }) {
  const total = aging.totalOpenAR;
  if (total === 0) {
    return <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No open AR.</div>;
  }
  return (
    <div>
      <div className="row gap-2" style={{ alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.06 }}>
          Mix
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }} className="num">
          {fmtMoney(total, 0)} total
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          height: 12,
          borderRadius: 999,
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        {AGING_BUCKETS.map((b) => {
          const v = aging.totals.find((t) => t.bucket === b)?.amount ?? 0;
          const pct = (v / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={b}
              title={`${b}: ${fmtMoney(v, 0)} (${pct.toFixed(1)}%)`}
              style={{ width: `${pct}%`, background: resolveCSSVar(BUCKET_COLOR[b]) }}
            />
          );
        })}
      </div>
      <div className="row gap-3" style={{ marginTop: 8, flexWrap: 'wrap' }}>
        {AGING_BUCKETS.map((b) => (
          <div key={b} className="row gap-1" style={{ alignItems: 'center', fontSize: 11, color: 'var(--text-tertiary)' }}>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 3,
                background: resolveCSSVar(BUCKET_COLOR[b]),
              }}
            />
            <span>{b === 'Current' ? 'Current' : `${b}d`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AgingChart;
