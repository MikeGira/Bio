// api/chat.js — Vercel Serverless Proxy

const _rlMap = new Map();
function checkRateLimit(ip, limit, windowMs) {
  const now = Date.now();
  const entry = _rlMap.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
  entry.count++;
  _rlMap.set(ip, entry);
  return entry.count <= limit;
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+|previous\s+|above\s+|prior\s+)?instructions/i,
  /\[SYSTEM\]/i,
  /you\s+are\s+now\s+/i,
  /<\|im_start\|>/i,
  /forget\s+(everything|all|your\s+instructions)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /disregard\s+(your\s+|all\s+)?previous/i,
  /new\s+prompt:/i,
  /act\s+as\s+if\s+you\s+(have\s+no|are\s+not)/i,
];

function detectInjection(messages) {
  if (!Array.isArray(messages)) return false;
  return messages.some(m =>
    m.role === 'user' &&
    typeof m.content === 'string' &&
    INJECTION_PATTERNS.some(p => p.test(m.content))
  );
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured in Vercel environment variables.' });
  }

  // Rate limit: 20 requests per minute per IP
  const ip = (req.headers['x-real-ip'] || (req.headers['x-forwarded-for'] || '').split(',')[0] || 'unknown').trim();
  if (!checkRateLimit(ip, 20, 60000)) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  // Request size guard
  const bodyStr = JSON.stringify(req.body || {});
  if (bodyStr.length > 32000) {
    return res.status(413).json({ error: 'Request too large.' });
  }

  // Prompt injection detection
  if (detectInjection(req.body?.messages)) {
    console.warn('[chat] prompt injection attempt from', ip.slice(0, 8));
    return res.status(200).json({
      id: 'blocked',
      content: [{ type: 'text', text: "I'm Phoenix — here to tell you about Mike's work and experience. What would you like to know?" }],
      model: 'claude-sonnet-4-6',
      role: 'assistant',
    });
  }

  // Always use the correct model
  if (req.body) req.body.model = 'claude-sonnet-4-6';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', response.status, JSON.stringify(data));
      return res.status(response.status).json({ error: data.error?.message || data.error || 'Anthropic API error ' + response.status });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}
