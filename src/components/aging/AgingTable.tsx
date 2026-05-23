// Customer breakdown for the aging schedule (BUILD.md §8).
// Sortable by any column; row click is a placeholder for the customer
// drill-down that ships in milestone 7.

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { AGING_BUCKETS, AgingBucket, AgingResult, AgingCustomerRow } from '../../types/kpi';
import { fmtMoney } from '../../lib/format';
import { BUCKET_COLOR } from '../../lib/uiColors';

type SortKey = 'customer_name' | 'invoiceCount' | AgingBucket | 'total';
type SortDir = 'asc' | 'desc';

interface Props {
  aging: AgingResult;
  onSelectCustomer?: (customerId: string) => void;
  maxRows?: number;
}

export function AgingTable({ aging, onSelectCustomer, maxRows = 50 }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('total');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const rows = useMemo(() => {
    const sorted = [...aging.byCustomer].sort((a, b) => compare(a, b, sortKey, sortDir));
    return sorted.slice(0, maxRows);
  }, [aging.byCustomer, sortKey, sortDir, maxRows]);

  const remaining = aging.byCustomer.length - rows.length;

  const onHeaderClick = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(['customer_name'].includes(key) ? 'asc' : 'desc');
    }
  };

  return (
    <div style={{ overflow: 'auto', maxHeight: 460 }}>
      <table className="fin-table">
        <thead>
          <tr>
            <Th label="Customer" sortKey="customer_name" cur={sortKey} dir={sortDir} onClick={onHeaderClick} />
            <Th label="Inv" sortKey="invoiceCount" cur={sortKey} dir={sortDir} onClick={onHeaderClick} numeric />
            {AGING_BUCKETS.map((b) => (
              <Th key={b} label={b === 'Current' ? 'Current' : `${b} d`} sortKey={b} cur={sortKey} dir={sortDir} onClick={onHeaderClick} numeric />
            ))}
            <Th label="Total" sortKey="total" cur={sortKey} dir={sortDir} onClick={onHeaderClick} numeric />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.customer_id}
              onClick={() => onSelectCustomer?.(r.customer_id)}
              style={{ cursor: onSelectCustomer ? 'pointer' : 'default' }}
            >
              <td>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.customer_name}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{r.customer_id}</div>
              </td>
              <td className="num">{r.invoiceCount}</td>
              {AGING_BUCKETS.map((b) => (
                <td key={b} className="num" style={{ color: BUCKET_COLOR[b] }}>
                  {r.totals[b] === 0 ? '—' : fmtMoney(r.totals[b], 0)}
                </td>
              ))}
              <td className="num" style={{ fontWeight: 700 }}>{fmtMoney(r.total, 0)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={2 + AGING_BUCKETS.length + 1} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 18 }}>
                No customers with open AR.
              </td>
            </tr>
          )}
        </tbody>
        {/* Grand total — sums every customer in the underlying aging,
            not just the visible page, so the foot-row matches the
            three-way recon's Subledger AR balance regardless of paging. */}
        {aging.byCustomer.length > 0 && (
          <tfoot>
            <tr
              style={{
                background: 'var(--bg-elevated)',
                borderTop: '2px solid var(--border-strong)',
              }}
            >
              <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                Grand total
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)' }}>
                  All {aging.byCustomer.length} customer{aging.byCustomer.length === 1 ? '' : 's'} with open AR
                </div>
              </td>
              <td className="num" style={{ fontWeight: 700 }}>
                {aging.byCustomer.reduce((s, c) => s + c.invoiceCount, 0)}
              </td>
              {AGING_BUCKETS.map((b) => (
                <td key={b} className="num" style={{ fontWeight: 700, color: BUCKET_COLOR[b] }}>
                  {fmtMoney(aging.byCustomer.reduce((s, c) => s + c.totals[b], 0), 0)}
                </td>
              ))}
              <td className="num" style={{ fontWeight: 700, color: 'var(--accent-hover)' }}>
                {fmtMoney(aging.totalOpenAR, 0)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
      {remaining > 0 && (
        <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-tertiary)' }}>
          + {remaining} more customer{remaining === 1 ? '' : 's'} not shown above — they are still included in the grand total
        </div>
      )}
    </div>
  );
}

function compare(a: AgingCustomerRow, b: AgingCustomerRow, key: SortKey, dir: SortDir): number {
  const sign = dir === 'asc' ? 1 : -1;
  if (key === 'customer_name') return sign * a.customer_name.localeCompare(b.customer_name);
  if (key === 'invoiceCount') return sign * (a.invoiceCount - b.invoiceCount);
  if (key === 'total') return sign * (a.total - b.total);
  return sign * (a.totals[key] - b.totals[key]);
}

function Th({
  label,
  sortKey,
  cur,
  dir,
  onClick,
  numeric,
}: {
  label: string;
  sortKey: SortKey;
  cur: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
  numeric?: boolean;
}) {
  const isActive = cur === sortKey;
  return (
    <th
      onClick={() => onClick(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none', textAlign: numeric ? 'right' : 'left' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: isActive ? 'var(--accent)' : undefined }}>
        {label}
        {isActive && (dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
      </span>
    </th>
  );
}

export default AgingTable;
