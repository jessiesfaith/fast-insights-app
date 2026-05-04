// Bad-debt-reserve calculation helpers.
//
// Three methods:
//   pct_of_sales — reserve = (period sales) × percentage
//   pct_of_ar    — reserve = (period-end subledger AR) × percentage
//   manual       — reserve = the preparer-entered amount
//
// "Period sales" = Σ invoices.total_amount where invoice.period == current period.

import { ARData } from '../types/data';
import { BadDebtMethod, BadDebtReserveEntry, EMPTY_BAD_DEBT_RESERVE } from '../types/audit';
import { computeSubledgerAR } from './recon';
import { periodBounds } from './period';

export interface BadDebtComputed {
  method: BadDebtMethod;
  percentage: number;
  manualAmount: number;
  base: number;        // amount the % is applied to (sales / AR / 0 for manual)
  baseLabel: string;   // human label of the base
  reserve: number;     // computed reserve dollars
  glAccount: string;
  memo: string;
  enteredBy: string;
  enteredAt: string;
}

export function computeBadDebt(
  data: ARData,
  period: string,
  entry?: BadDebtReserveEntry,
): BadDebtComputed {
  const e = entry ?? EMPTY_BAD_DEBT_RESERVE;
  const periodSales = data.invoices
    .filter((i) => i.period === period)
    .reduce((s, i) => s + i.total_amount, 0);
  const arEnd = computeSubledgerAR(data, periodBounds(period).end).total;

  let base = 0;
  let baseLabel = '';
  let reserve = 0;
  switch (e.method) {
    case 'pct_of_sales':
      base = periodSales;
      baseLabel = 'Period sales';
      reserve = periodSales * (e.percentage || 0);
      break;
    case 'pct_of_ar':
      base = arEnd;
      baseLabel = 'Period-end AR';
      reserve = arEnd * (e.percentage || 0);
      break;
    case 'manual':
      base = 0;
      baseLabel = '—';
      reserve = e.manualAmount || 0;
      break;
  }
  return {
    method: e.method,
    percentage: e.percentage,
    manualAmount: e.manualAmount,
    base,
    baseLabel,
    reserve,
    glAccount: e.glAccount,
    memo: e.memo,
    enteredBy: e.enteredBy,
    enteredAt: e.enteredAt,
  };
}
