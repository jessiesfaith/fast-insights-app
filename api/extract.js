// /api/extract — server-side invoice extraction for the Revenue Schedule tool.
//
// The browser sends Anthropic message content blocks (a base64 PDF document
// block, or spreadsheet text); this function forwards them to the Anthropic
// API and returns the model's text. Runs server-side so the API key never
// reaches the browser. Stateless: nothing is logged or stored.
//
// Requires the ANTHROPIC_API_KEY environment variable (Vercel project
// settings). Without it the endpoint answers 503 and the UI falls back to
// manual entry / demo data. EXTRACT_MODEL optionally overrides the model.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'Extraction is not configured (ANTHROPIC_API_KEY missing).' });
    return;
  }
  const content = req.body?.content;
  if (!Array.isArray(content) || content.length === 0 || content.length > 4) {
    res.status(400).json({ error: 'content must be a non-empty array of message blocks.' });
    return;
  }
  // Only the two shapes the client sends are forwarded: a text block, or a
  // base64 PDF document block. Anything else is rejected.
  const allowed = content.every(
    (b) =>
      b && typeof b === 'object' &&
      ((b.type === 'text' && typeof b.text === 'string') ||
        (b.type === 'document' && b.source?.type === 'base64' && b.source?.media_type === 'application/pdf'))
  );
  if (!allowed) {
    res.status(400).json({ error: 'Unsupported content block.' });
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
        max_tokens: 2000,
        messages: [{ role: 'user', content }],
      }),
    });
    if (!upstream.ok) {
      res.status(502).json({ error: `Reader returned ${upstream.status}.` });
      return;
    }
    const data = await upstream.json();
    const text = (data.content || []).map((c) => (c.type === 'text' ? c.text : '')).join('\n');
    res.status(200).json({ text });
  } catch {
    res.status(502).json({ error: 'Could not reach the reader.' });
  }
}
