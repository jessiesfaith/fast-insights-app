// /api/extract — server-side invoice extraction for the Revenue Schedule tool.
//
// The browser sends either a base64 PDF ({kind:'pdf', data}) or spreadsheet
// text ({kind:'sheet', text}); this function wraps it with the extraction
// prompt server-side and forwards it to the Anthropic API. Runs server-side so
// the API key never reaches the browser, and the prompt lives here so the
// endpoint cannot be used to run arbitrary prompts on the account's key.
// Stateless: nothing is logged or stored.
//
// Hardening (an unauthenticated endpoint on a public site):
// - Origin allowlist: browser POSTs must come from this product's origins.
//   This blocks cross-site abuse; it is not a substitute for real rate
//   limiting (add Vercel WAF / an auth gate if abuse ever shows up).
// - Payload caps sized to what the client legitimately sends (Vercel already
//   hard-caps request bodies at ~4.5MB before this code runs).
//
// Requires the ANTHROPIC_API_KEY environment variable (Vercel project
// settings). Without it the endpoint answers 503 and the UI falls back to
// manual entry / demo data. EXTRACT_MODEL optionally overrides the model.

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

const MAX_PDF_B64_CHARS = 6_000_000; // ~4.5MB decoded — Vercel's body cap anyway
const MAX_SHEET_CHARS = 120_000; // client slices to 60k; leave headroom

function originAllowed(req) {
  const origin = req.headers.origin || req.headers.referer || '';
  if (!origin) return false; // browsers always send Origin on cross- and same-origin POSTs
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'https:' && protocol !== 'http:') return false;
    return (
      hostname === 'app.fastinsights.io' ||
      hostname === 'fastinsights.io' ||
      hostname.endsWith('.vercel.app') || // this project's preview deploys
      hostname === 'localhost' ||
      hostname === '127.0.0.1'
    );
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  if (!originAllowed(req)) {
    res.status(403).json({ error: 'Forbidden.' });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'Extraction is not configured (ANTHROPIC_API_KEY missing).' });
    return;
  }

  const { kind, data, text } = req.body ?? {};
  let content;
  if (kind === 'pdf' && typeof data === 'string' && data.length > 0 && data.length <= MAX_PDF_B64_CHARS && /^[A-Za-z0-9+/=]+$/.test(data)) {
    content = [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } },
      { type: 'text', text: EXTRACT_PROMPT },
    ];
  } else if (kind === 'sheet' && typeof text === 'string' && text.length > 0 && text.length <= MAX_SHEET_CHARS) {
    content = [{ type: 'text', text: `${EXTRACT_PROMPT}\n\nInvoice data:\n${text}` }];
  } else {
    res.status(400).json({ error: 'Expected {kind:"pdf", data} or {kind:"sheet", text} within size limits.' });
    return;
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.EXTRACT_MODEL || 'claude-sonnet-5',
        max_tokens: 4000,
        messages: [{ role: 'user', content }],
      }),
    });
    if (!upstream.ok) {
      res.status(502).json({ error: `Reader returned ${upstream.status}.` });
      return;
    }
    const body = await upstream.json();
    if (body.stop_reason === 'max_tokens') {
      res.status(502).json({ error: 'That invoice has too many lines to read in one pass. Split the file and try again.' });
      return;
    }
    const out = (body.content || []).map((c) => (c.type === 'text' ? c.text : '')).join('\n');
    res.status(200).json({ text: out });
  } catch {
    res.status(502).json({ error: 'Could not reach the reader.' });
  }
}
