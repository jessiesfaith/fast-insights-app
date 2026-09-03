// Revenue Schedule (Sub Rev Sch) — invoice-to-amortization tool.
//
// Drop in an invoice (PDF/XLSX/XLS/CSV), set the term, and watch revenue
// spread across the months it belongs to: amortization timeline, revenue by
// month chart, tax-basis schedule, and the accrual-vs-tax comparison whose
// running gap is the deferred revenue balance.
//
// Ported from the approved working prototype (sub-rev-sch repo). Math lives in
// src/lib/revenueSchedule.ts (unit-tested — see src/tests/revenueSchedule.test.ts).
// PDF/spreadsheet extraction calls /api/extract (a Vercel serverless function)
// so the Anthropic API key never reaches the browser. Session only: nothing is
// stored server-side; refresh clears everything.

import { useMemo, useRef, useState } from 'react';
import type { CSSProperties, DragEvent, ReactNode } from 'react';
import * as XLSX from 'xlsx-js-style';
import {
  Bar, CartesianGrid, ComposedChart, LabelList, Legend, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  buildModel, DEMO_LINES, fmtDate, monthKey, monthLabel, normalizeLine,
  parseISO, usd, usdShort, RevenueLine,
} from '../lib/revenueSchedule';

/* ── tokens (prototype palette — vivid green / near-black / paper / amber) ── */
const INK = '#12211C';
const PAPER = '#F6F7F5';
const BAND = '#E7EEE7';
const RULE = '#D3D8D1';
const GREEN = '#1F6F4A';
const AMBER = '#B5741C';
const MUTED = '#5F6B63';

const serif: CSSProperties = { fontFamily: "Georgia, 'Iowan Old Style', serif" };
const num: CSSProperties = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum'" };

const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);

/* ── extraction ─────────────────────────────────────────── */
const EXTRACT_PROMPT = `You are reading a customer invoice. Extract every billable line item.

Return ONLY a JSON array. No prose, no markdown fences. Each element:
{"invoiceNumber":string,"invoiceDate":"YYYY-MM-DD","productName":string,"quantity":number,"amount":number,"isSubscription":boolean,"termMonths":number}

Rules:
- amount is the extended line total in dollars, digits only (no currency symbols or commas).
- invoiceDate is the invoice issue date, repeated on every line from the same invoice.
- isSubscription is true when the line is a recurring/term service: subscription, license, SaaS, maintenance, support plan, retainer, hosting, annual/monthly plan.
- termMonths: use the term stated on the invoice if there is one. Otherwise 12 for a subscription line and 1 for a one-time line.
- Skip subtotals, tax, shipping, and discounts as separate lines.
- If a field is genuinely absent, use "" for text, 0 for numbers.`;

type ContentBlock = Record<string, unknown>;

async function callExtract(content: ContentBlock[]): Promise<Array<Record<string, unknown>>> {
  const res = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (res.status === 503) {
    throw new Error('Invoice reading is not configured on this deployment yet (missing API key).');
  }
  if (!res.ok) throw new Error(`Reader returned ${res.status}.`);
  const data: { text?: string } = await res.json();
  const clean = String(data.text ?? '').replace(/```json/g, '').replace(/```/g, '').trim();
  const a = clean.indexOf('[');
  const b = clean.lastIndexOf(']');
  if (a === -1 || b === -1) throw new Error('No line items found in that file.');
  const parsed: unknown = JSON.parse(clean.slice(a, b + 1));
  if (!Array.isArray(parsed)) throw new Error('No line items found in that file.');
  return parsed as Array<Record<string, unknown>>;
}

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = () => reject(new Error('Could not read that file.'));
    r.readAsDataURL(file);
  });

async function sheetToText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  return wb.SheetNames.slice(0, 3)
    .map((n) => `# Sheet: ${n}\n${XLSX.utils.sheet_to_csv(wb.Sheets[n], { dateNF: 'yyyy-mm-dd' })}`)
    .join('\n\n')
    .slice(0, 60000);
}

async function extractFrom(file: File): Promise<Array<Record<string, unknown>>> {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  if (ext === 'pdf') {
    const b64 = await toBase64(file);
    return callExtract([
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } },
      { type: 'text', text: EXTRACT_PROMPT },
    ]);
  }
  const text = await sheetToText(file);
  return callExtract([{ type: 'text', text: `${EXTRACT_PROMPT}\n\nInvoice data:\n${text}` }]);
}

/* ── shared style fragments ─────────────────────────────── */
const btnBase: CSSProperties = {
  borderRadius: 2, padding: '8px 16px', fontSize: 14, cursor: 'pointer',
  font: 'inherit', lineHeight: 1.4,
};
const btnPrimary: CSSProperties = { ...btnBase, fontWeight: 500, color: '#fff', background: INK, border: 'none' };
const btnGreen: CSSProperties = { ...btnBase, fontWeight: 500, color: '#fff', background: GREEN, border: 'none' };
const btnGhost: CSSProperties = { ...btnBase, background: 'transparent', color: INK, border: `1px solid ${RULE}` };
const btnSmall: CSSProperties = { ...btnGhost, padding: '6px 12px' };

const PAGE_CSS = `
.rs-cell { padding: 8px 12px; vertical-align: middle; }
.rs-r { text-align: right; }
.rs-input {
  width: 100%; background: transparent; color: inherit; font: inherit;
  border: none; border-bottom: 1px solid transparent; padding: 4px 0; outline: none;
}
.rs-input:hover { border-bottom-color: ${RULE}; }
.rs-input:focus { border-bottom-color: ${MUTED}; }
.rs-scroll { overflow-x: auto; }
`;

/* ── app ────────────────────────────────────────────────── */
export default function RevenueSchedule() {
  const [invoices, setInvoices] = useState<RevenueLine[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    setError('');
    for (const file of files) {
      setBusy(file.name);
      try {
        const rows = await extractFrom(file);
        const parsed = rows.map((r) => normalizeLine(r, file.name, uid(), todayISO()));
        if (!parsed.length) throw new Error('No line items found.');
        setInvoices((prev) => [...prev, ...parsed]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Something went wrong.';
        setError(`${file.name}: ${msg} Add the line by hand below, or try a clearer copy of the file.`);
      }
    }
    setBusy(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  const patch = <K extends keyof RevenueLine>(id: string, field: K, value: RevenueLine[K]) =>
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  const remove = (id: string) => setInvoices((prev) => prev.filter((i) => i.id !== id));
  const addBlank = () =>
    setInvoices((prev) => [
      ...prev,
      normalizeLine(
        { invoiceNumber: '', invoiceDate: todayISO(), productName: '', quantity: 1, amount: 0, isSubscription: true, termMonths: 12 },
        'Entered by hand', uid(), todayISO(),
      ),
    ]);
  const loadDemo = () => {
    setError('');
    setInvoices(DEMO_LINES.map((r) => normalizeLine(r, 'Demo data', uid(), todayISO())));
  };
  const clearAll = () => { setError(''); setInvoices([]); };

  /* one pass builds every schedule, the month columns, and the totals */
  const model = useMemo(() => buildModel(invoices), [invoices]);
  const { schedules, keys, totals, chart, cash, compare } = model;
  const billed = invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const recognized = chart.reduce((s, m) => s + m.amount, 0);

  const exportCsv = () => {
    const header = ['Invoice', 'Product', 'Start', 'End', 'Term (mo)', 'Invoice amount', ...keys.map(monthLabel)];
    const body = schedules.map(({ inv, rows, end }) => {
      const byKey = new Map(rows.map((r) => [r.key, r.amount]));
      return [
        inv.invoiceNumber, `"${inv.productName.replace(/"/g, "'")}"`,
        inv.invoiceDate, end ? end.toISOString().slice(0, 10) : '',
        inv.termMonths, inv.amount,
        ...keys.map((k) => byKey.get(k) ?? ''),
      ].join(',');
    });
    const footer = ['Total', '', '', '', '', billed, ...keys.map((k) => totals.get(k) ?? 0)].join(',');
    const csv = [header.join(','), ...body, footer].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revenue-timeline.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: PAPER, color: INK }}>
      <style>{PAGE_CSS}</style>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '40px 20px' }}>

        <header
          style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between',
            gap: 24, paddingBottom: 20, borderBottom: `2px solid ${INK}`,
          }}
        >
          <div>
            <h1 style={{ ...serif, fontSize: 34, lineHeight: 1.1, letterSpacing: '-0.01em', margin: 0, fontWeight: 400 }}>
              Subscription revenue schedule
            </h1>
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14, maxWidth: 448, color: MUTED }}>
              Drop in an invoice, set the term, and watch it spread across the months it belongs to.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            <Stat label="Billed" value={usdShort(billed)} />
            <Stat label="Scheduled" value={usdShort(recognized)} accent={GREEN} />
          </div>
        </header>

        {/* upload */}
        <section style={{ marginTop: 32 }}>
          <div
            onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDrag(false); void handleFiles(e.dataTransfer.files); }}
            style={{
              borderRadius: 2, padding: '40px 24px', textAlign: 'center',
              transition: 'background-color .15s ease, border-color .15s ease',
              border: `1.5px dashed ${drag ? GREEN : RULE}`, background: drag ? BAND : 'transparent',
            }}
          >
            {busy ? (
              <p style={{ fontSize: 14, color: GREEN, margin: 0 }}>Reading {busy}…</p>
            ) : (
              <>
                <p style={{ ...serif, fontSize: 19, margin: 0 }}>Drop a PDF or Excel invoice here</p>
                <p style={{ marginTop: 4, marginBottom: 0, fontSize: 14, color: MUTED }}>PDF, XLSX, XLS or CSV. Several at once is fine.</p>
                <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
                  <button onClick={() => fileRef.current?.click()} style={btnPrimary}>Choose files</button>
                  <button onClick={loadDemo} style={btnGreen}>Run demo</button>
                  <button onClick={addBlank} style={btnGhost}>Enter a line by hand</button>
                </div>
                <p style={{ marginTop: 12, marginBottom: 0, fontSize: 12, color: MUTED }}>
                  Run demo fills every section with seven sample invoice lines — good for walking someone through it.
                  Session only: files are read once and discarded; nothing is stored.
                </p>
              </>
            )}
            <input
              ref={fileRef} type="file" multiple hidden accept=".pdf,.xlsx,.xls,.csv"
              onChange={(e) => void handleFiles(e.target.files)}
            />
          </div>
          {error && <p style={{ marginTop: 12, fontSize: 14, color: AMBER }}>{error}</p>}
        </section>

        {/* invoice lines */}
        <Section
          title="Invoice lines"
          note={invoices.length ? `${invoices.length} line${invoices.length > 1 ? 's' : ''} · every field is editable` : ''}
        >
          {invoices.length === 0 ? (
            <p style={{ padding: '24px 0', fontSize: 14, color: MUTED }}>
              Nothing loaded yet. Upload an invoice and its lines land here.
            </p>
          ) : (
            <div className="rs-scroll">
              <table style={{ width: '100%', fontSize: 14, minWidth: 1140, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${INK}`, color: MUTED, textAlign: 'left', fontSize: 12 }}>
                    <th className="rs-cell">Invoice</th>
                    <th className="rs-cell">Product</th>
                    <th className="rs-cell">Starts</th>
                    <th className="rs-cell">Through</th>
                    <th className="rs-cell">Type</th>
                    <th className="rs-cell rs-r" style={{ minWidth: 64 }}>Qty</th>
                    <th className="rs-cell rs-r" style={{ minWidth: 160 }}>Amount</th>
                    <th className="rs-cell">Months</th>
                    <th className="rs-cell"></th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(({ inv, end, pointInTime }, idx) => (
                    <tr key={inv.id} style={{ background: idx % 2 ? BAND : 'transparent' }}>
                      <td className="rs-cell">
                        <input
                          className="rs-input" value={inv.invoiceNumber} placeholder="INV-0000"
                          onChange={(e) => patch(inv.id, 'invoiceNumber', e.target.value)}
                        />
                      </td>
                      <td className="rs-cell" style={{ minWidth: 230 }}>
                        <input
                          className="rs-input" value={inv.productName} placeholder="Product or service"
                          onChange={(e) => patch(inv.id, 'productName', e.target.value)}
                        />
                      </td>
                      <td className="rs-cell" style={num}>
                        <input
                          type="date" className="rs-input" value={inv.invoiceDate}
                          onChange={(e) => patch(inv.id, 'invoiceDate', e.target.value)}
                        />
                      </td>
                      <td className="rs-cell" style={{ ...num, color: MUTED, whiteSpace: 'nowrap' }}>
                        {pointInTime ? 'At invoice' : end ? fmtDate(end) : '—'}
                      </td>
                      <td className="rs-cell">
                        <button
                          onClick={() => {
                            const next = !inv.isSubscription;
                            patch(inv.id, 'isSubscription', next);
                            patch(inv.id, 'termMonths', next ? 12 : 1);
                          }}
                          style={{
                            borderRadius: 2, padding: '4px 8px', fontSize: 12, cursor: 'pointer', font: 'inherit',
                            ...(inv.isSubscription
                              ? { background: GREEN, color: '#fff', border: 'none' }
                              : { background: 'transparent', border: `1px solid ${RULE}`, color: MUTED }),
                          }}
                        >
                          {inv.isSubscription ? 'Subscription' : 'One-time'}
                        </button>
                      </td>
                      <td className="rs-cell rs-r" style={num}>
                        <input
                          type="number" min="0" className="rs-input rs-r" value={inv.quantity}
                          onChange={(e) => patch(inv.id, 'quantity', Number(e.target.value))}
                        />
                      </td>
                      <td className="rs-cell rs-r" style={{ ...num, minWidth: 160, whiteSpace: 'nowrap' }}>
                        <MoneyInput value={inv.amount} onCommit={(n) => patch(inv.id, 'amount', n)} />
                      </td>
                      <td className="rs-cell">
                        <select
                          value={inv.termMonths}
                          onChange={(e) => patch(inv.id, 'termMonths', Number(e.target.value))}
                          style={{ borderRadius: 2, padding: '4px 8px', fontSize: 14, border: `1px solid ${RULE}`, background: '#fff', color: INK, ...num }}
                        >
                          {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </td>
                      <td className="rs-cell rs-r">
                        <button
                          onClick={() => remove(inv.id)}
                          style={{ fontSize: 12, textDecoration: 'underline', color: MUTED, background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button onClick={addBlank} style={btnSmall}>Add a line</button>
                <button onClick={loadDemo} style={btnSmall}>Reload demo</button>
                <button onClick={clearAll} style={{ ...btnSmall, color: MUTED }}>Start over</button>
              </div>
            </div>
          )}
        </Section>

        {/* one chart: bars by month, cumulative line over the top */}
        {chart.length > 0 && (
          <Section
            title="Revenue by month"
            note={`${chart.length} month${chart.length > 1 ? 's' : ''} · one bar each; the dashed line is the running total`}
          >
            <div className="rs-scroll" style={{ paddingBottom: 4 }}>
              <div style={{ height: 360, minWidth: Math.max(560, chart.length * 68) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chart} margin={{ top: 28, right: 14, left: 4, bottom: 26 }}>
                    <CartesianGrid stroke={RULE} strokeDasharray="2 4" vertical={false} />
                    <XAxis
                      dataKey="month" interval={0} tick={{ fontSize: 11, fill: MUTED }}
                      tickLine={false} axisLine={{ stroke: RULE }}
                      angle={-45} textAnchor="end" height={52}
                    />
                    <YAxis yAxisId="left" tickFormatter={usdShort} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} width={64} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={usdShort} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} width={64} />
                    <Tooltip
                      formatter={(v: number) => usd(v)} cursor={{ fill: BAND }}
                      contentStyle={{ fontSize: 12, borderRadius: 2, border: `1px solid ${RULE}` }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} verticalAlign="top" />
                    <Bar yAxisId="left" dataKey="amount" name="Recognized this month" fill={GREEN} radius={[2, 2, 0, 0]} maxBarSize={44}>
                      <LabelList dataKey="amount" position="top" formatter={(v: number) => usdShort(v)} style={{ fontSize: 10, fill: INK, ...num }} />
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative" stroke={INK} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Section>
        )}

        {/* timeline: every line item spread left to right across the months */}
        {chart.length > 0 && (
          <Section title="Revenue timeline" note="Each line spread across its service months — first and last months prorated by day">
            <div className="rs-scroll">
              <table style={{ fontSize: 14, minWidth: 720, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${INK}`, color: MUTED, textAlign: 'left', fontSize: 12 }}>
                    <th className="rs-cell" style={{ minWidth: 200 }}>Line</th>
                    <th className="rs-cell">Starts</th>
                    <th className="rs-cell">Through</th>
                    <th className="rs-cell rs-r" style={{ minWidth: 120 }}>Amount</th>
                    {keys.map((k) => (
                      <th key={k} className="rs-cell rs-r" style={{ minWidth: 112 }}>{monthLabel(k)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(({ inv, rows, end, pointInTime }, idx) => {
                    const byKey = new Map(rows.map((r) => [r.key, r]));
                    return (
                      <tr key={inv.id} style={{ background: idx % 2 ? BAND : 'transparent' }}>
                        <td className="rs-cell">
                          <span>{inv.productName || 'Unnamed line'}</span>
                          <span style={{ marginLeft: 8, fontSize: 12, color: MUTED, ...num }}>
                            {inv.invoiceNumber || '—'} · {inv.termMonths} mo
                          </span>
                        </td>
                        <td className="rs-cell" style={{ ...num, color: MUTED, whiteSpace: 'nowrap' }}>{inv.invoiceDate}</td>
                        <td className="rs-cell" style={{ ...num, color: MUTED, whiteSpace: 'nowrap' }}>
                          {pointInTime ? 'At invoice' : end ? fmtDate(end) : '—'}
                        </td>
                        <td className="rs-cell rs-r" style={{ ...num, whiteSpace: 'nowrap' }}>{usd(Number(inv.amount) || 0)}</td>
                        {keys.map((k) => {
                          const r = byKey.get(k);
                          return (
                            <td
                              key={k} className="rs-cell rs-r"
                              style={{ ...num, color: r ? (r.partial ? AMBER : INK) : '#C3C9C3' }}
                              title={r && r.days > 0 ? `${r.days} day${r.days > 1 ? 's' : ''}` : ''}
                            >
                              {r ? usd(r.amount) : '·'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: `2px solid ${INK}` }}>
                    <td className="rs-cell" style={{ fontWeight: 500 }}>Total by month</td>
                    <td className="rs-cell"></td>
                    <td className="rs-cell"></td>
                    <td className="rs-cell rs-r" style={{ ...num, fontWeight: 500 }}>{usd(billed)}</td>
                    {keys.map((k) => (
                      <td key={k} className="rs-cell rs-r" style={{ ...num, fontWeight: 500 }}>{usd(totals.get(k) ?? 0)}</td>
                    ))}
                  </tr>
                  <tr style={{ color: MUTED }}>
                    <td className="rs-cell" style={{ fontSize: 12 }}>Cumulative</td>
                    <td className="rs-cell"></td>
                    <td className="rs-cell"></td>
                    <td className="rs-cell"></td>
                    {chart.map((m) => (
                      <td key={m.key} className="rs-cell rs-r" style={{ ...num, fontSize: 12 }}>{usd(m.cumulative)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
              <button onClick={exportCsv} style={btnSmall}>Download CSV</button>
              <p style={{ fontSize: 12, color: AMBER, margin: 0 }}>Amber figures are partial months.</p>
            </div>
          </Section>
        )}

        {/* tax basis: nothing spreads, everything lands when invoiced */}
        {chart.length > 0 && (
          <Section title="Tax basis schedule" note="Same lines, no spreading — the full invoice lands in the month it was issued">
            <div className="rs-scroll">
              <table style={{ fontSize: 14, minWidth: 720, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${INK}`, color: MUTED, textAlign: 'left', fontSize: 12 }}>
                    <th className="rs-cell" style={{ minWidth: 200 }}>Line</th>
                    <th className="rs-cell">Invoiced</th>
                    <th className="rs-cell rs-r" style={{ minWidth: 120 }}>Amount</th>
                    {keys.map((k) => (
                      <th key={k} className="rs-cell rs-r" style={{ minWidth: 112 }}>{monthLabel(k)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(({ inv }, idx) => {
                    const s = parseISO(inv.invoiceDate);
                    const hit = s ? monthKey(s.getFullYear(), s.getMonth() + 1) : null;
                    return (
                      <tr key={inv.id} style={{ background: idx % 2 ? BAND : 'transparent' }}>
                        <td className="rs-cell">
                          <span>{inv.productName || 'Unnamed line'}</span>
                          <span style={{ marginLeft: 8, fontSize: 12, color: MUTED, ...num }}>{inv.invoiceNumber || '—'}</span>
                        </td>
                        <td className="rs-cell" style={{ ...num, color: MUTED, whiteSpace: 'nowrap' }}>{inv.invoiceDate}</td>
                        <td className="rs-cell rs-r" style={{ ...num, whiteSpace: 'nowrap' }}>{usd(Number(inv.amount) || 0)}</td>
                        {keys.map((k) => (
                          <td key={k} className="rs-cell rs-r" style={{ ...num, color: k === hit ? INK : '#C3C9C3' }}>
                            {k === hit ? usd(Number(inv.amount) || 0) : '·'}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: `2px solid ${INK}` }}>
                    <td className="rs-cell" style={{ fontWeight: 500 }}>Total by month</td>
                    <td className="rs-cell"></td>
                    <td className="rs-cell rs-r" style={{ ...num, fontWeight: 500 }}>{usd(billed)}</td>
                    {keys.map((k) => (
                      <td key={k} className="rs-cell rs-r" style={{ ...num, fontWeight: 500 }}>{usd(cash.get(k) ?? 0)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* the reconciliation */}
        {chart.length > 0 && (
          <Section title="Accrual vs. tax" note="The gap is deferred revenue — what you have billed but not yet earned">
            <div className="rs-scroll">
              <table style={{ fontSize: 14, minWidth: 640, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${INK}`, color: MUTED, textAlign: 'left', fontSize: 12 }}>
                    <th className="rs-cell" style={{ minWidth: 180 }}>Basis</th>
                    {keys.map((k) => (
                      <th key={k} className="rs-cell rs-r" style={{ minWidth: 112 }}>{monthLabel(k)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="rs-cell">Accrual — earned</td>
                    {compare.map((c) => (
                      <td key={c.key} className="rs-cell rs-r" style={num}>{usd(c.accrual)}</td>
                    ))}
                  </tr>
                  <tr style={{ background: BAND }}>
                    <td className="rs-cell">Tax — as invoiced</td>
                    {compare.map((c) => (
                      <td key={c.key} className="rs-cell rs-r" style={num}>{usd(c.tax)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="rs-cell">Difference</td>
                    {compare.map((c) => (
                      <td
                        key={c.key} className="rs-cell rs-r"
                        style={{ ...num, color: c.diff > 0 ? AMBER : c.diff < 0 ? GREEN : MUTED }}
                      >
                        {usd(c.diff)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderTop: `2px solid ${INK}` }}>
                    <td className="rs-cell" style={{ fontWeight: 500 }}>Deferred revenue balance</td>
                    {compare.map((c) => (
                      <td key={c.key} className="rs-cell rs-r" style={{ ...num, fontWeight: 500 }}>{usd(c.deferred)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: 12, fontSize: 12, color: MUTED }}>
              Both bases total {usd(billed)} over the full term — only the timing differs.
              Amber months are ones where you are taxed ahead of the book revenue.
            </p>
          </Section>
        )}

        <footer style={{ marginTop: 56, paddingTop: 16, borderTop: `1px solid ${RULE}`, fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
          Revenue Schedule is a support tool. It is not accounting, tax, or legal advice, and it does not constitute an
          audit, review, or compilation. Figures are generated from files you supply using automated extraction that can
          misread documents. You are responsible for reviewing every figure before relying on it and for determining the
          appropriate revenue recognition policy under ASC 606 or other applicable standards. Fast Insights disclaims
          all warranties and accepts no liability arising from use of this output. Review with your CPA before recording
          anything.
        </footer>
      </div>
    </div>
  );
}

function MoneyInput({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;
  return (
    <input
      className="rs-input rs-r"
      inputMode="decimal"
      style={{ ...num, whiteSpace: 'nowrap', minWidth: '11ch', textOverflow: 'clip' }}
      value={editing ? draft : usd(Number(value) || 0)}
      onFocus={() => setDraft(String(value ?? ''))}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      onBlur={() => {
        const n = Number(String(draft ?? '').replace(/[^0-9.-]/g, '')) || 0;
        onCommit(Math.round(Math.abs(n) * 100) / 100);
        setDraft(null);
      }}
    />
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{label}</p>
      <p style={{ ...serif, ...num, fontSize: 26, color: accent ?? INK, margin: 0 }}>{value}</p>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 44 }}>
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between',
          gap: 8, paddingBottom: 12, borderBottom: `1px solid ${RULE}`,
        }}
      >
        <h2 style={{ ...serif, fontSize: 21, margin: 0, fontWeight: 400 }}>{title}</h2>
        {note && <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{note}</p>}
      </div>
      <div style={{ paddingTop: 16 }}>{children}</div>
    </section>
  );
}
