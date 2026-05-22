// Shared formatters for money, percent, and dates.
// Money: two decimals, comma thousands, parentheses for negative — finance-grade convention.

const usd2 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usd0 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const num2 = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function fmtMoney(n: number | null | undefined, decimals = 2): string {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  const formatted = decimals === 0 ? usd0.format(abs) : usd2.format(abs);
  return n < 0 ? `(${formatted})` : formatted;
}

export function fmtNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  const s = num2.format(abs);
  return n < 0 ? `(${s})` : s;
}

export function fmtPct(n: number | null | undefined, decimals = 1): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${(n * 100).toFixed(decimals)}%`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtPeriod(period: string | null | undefined): string {
  if (!period) return '—';
  // YYYY-MM → "Mon YYYY"
  const [y, m] = period.split('-');
  if (!y || !m) return period;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const idx = Number(m) - 1;
  return `${months[idx] ?? m} ${y}`;
}

/** Make a string safe to embed in a file name — alphanumerics and dashes only. */
export function slugForFileName(s: string): string {
  return s.replace(/[^a-zA-Z0-9-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'unknown';
}

/** Turn an ISO timestamp into a file-name-safe stamp: YYYY-MM-DDTHH-MM-SS. */
export function fileTimestamp(iso: string): string {
  return iso.replace(/[:]/g, '-').replace(/\..+$/, '');
}
