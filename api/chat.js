// api/chat.js — Vercel Serverless Proxy

import { checkRateLimit, extractIP, SITE_URL } from './_lib.js';

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

const UPSTREAM_TIMEOUT_MS = 55000;

// One client-facing sentence for every provider-side failure. Phoenix is a nice-to-have on a
// portfolio, so the message points at the part of the site that still works rather than at an error.
const AI_UNAVAILABLE =
  "Phoenix is unavailable at the moment. Everything about Mike's work is on this page, and the contact form still reaches him directly.";

// Anthropic rejects an unavailable tool with a 400 invalid_request naming the tool. Anything
// else (auth, billing, overload, 5xx) is not fixed by dropping the tool and must not be retried.
function isToolRejection(status, data) {
  if (status !== 400) return false;
  const msg = String(data?.error?.message || '');
  return /tool|web_search/i.test(msg);
}

function detectInjection(messages) {
  if (!Array.isArray(messages)) return false;
  return messages.some(m =>
    m.role === 'user' &&
    typeof m.content === 'string' &&
    INJECTION_PATTERNS.some(p => p.test(m.content))
  );
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', SITE_URL);
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
  const ip = extractIP(req);
  if (!checkRateLimit(ip, 20, 60000)) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  // Request size guard
  const bodyStr = JSON.stringify(req.body || {});
  if (bodyStr.length > 32000) {
    return res.status(413).json({ error: 'Request too large.' });
  }

  // Validate and whitelist — never forward arbitrary client fields to Anthropic
  const { messages, system, max_tokens, enableWebSearch, tool_choice } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array.' });
  }
  for (const msg of messages) {
    if (!['user', 'assistant'].includes(msg?.role) || typeof msg?.content !== 'string') {
      return res.status(400).json({ error: 'Invalid message format.' });
    }
  }

  // Prompt injection detection
  if (detectInjection(messages)) {
    console.warn('[chat] prompt injection attempt from', ip.slice(0, 8));
    return res.status(200).json({
      id: 'blocked',
      content: [{ type: 'text', text: "I'm Phoenix — here to tell you about Mike's work and experience. What would you like to know?" }],
      model: 'claude-sonnet-4-6',
      role: 'assistant',
    });
  }

  const useWebSearch = enableWebSearch === true;

  const payload = {
    model: 'claude-sonnet-4-6',
    messages,
    max_tokens: Math.min(Number(max_tokens) || 1024, 4096),
    // 16k, not 10k: the Phoenix prompt carries accuracy constraints that must never be silently
    // truncated away. Raised Jul 28 2026 after the prompt outgrew the old cap.
    ...(system && typeof system === 'string' ? { system: system.slice(0, 16000) } : {}),
    ...(useWebSearch ? { tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }] } : {}),
    ...(useWebSearch && tool_choice && typeof tool_choice === 'object' && typeof tool_choice.type === 'string'
        ? { tool_choice } : {}),
  };

  const anthropicHeaders = {
    'Content-Type':      'application/json',
    'x-api-key':         apiKey,
    'anthropic-version': '2023-06-01',
  };

  const callAnthropic = body => fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: anthropicHeaders,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  try {
    let response = await callAnthropic(payload);
    let data = await response.json();

    // Web search rejected by Anthropic (e.g. not yet enabled in Console → Settings → Privacy).
    // Degrade gracefully: retry without the tool so articles still generate from training data.
    // Narrowed to tool-related 400s: retrying a billing or auth failure just doubles the latency
    // and the spend, which is exactly what happened during the Sep 20 2026 credit outage.
    if (!response.ok && useWebSearch && isToolRejection(response.status, data)) {
      console.warn('[chat] web_search rejected (' + response.status + '), retrying without tool');
      const { tools: _t, tool_choice: _tc, ...fallbackPayload } = payload;
      response = await callAnthropic(fallbackPayload);
      data = await response.json();
    }

    if (!response.ok) {
      // Log the upstream detail, return none of it. The provider's message can name our
      // billing state, our account or our model wiring; a portfolio visitor must never see it.
      console.error('[chat] Anthropic error:', response.status, JSON.stringify(data));
      // 429 (our own rate ceiling) and 529 (Anthropic overloaded) are transient and worth
      // retrying; everything else is an outage from the visitor's point of view.
      if (response.status === 429 || response.status === 529) {
        res.setHeader('Retry-After', '30');
        return res.status(503).json({ error: 'Phoenix is busy right now. Please try again in a moment.' });
      }
      return res.status(502).json({ error: AI_UNAVAILABLE });
    }

    // Normalize web-search responses: merge all text blocks into one so frontend
    // parsing (content[0].text) works regardless of interleaved tool_use blocks.
    if (useWebSearch && Array.isArray(data.content)) {
      const merged = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
      data = { ...data, content: [{ type: 'text', text: merged }] };
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('[chat] proxy error:', err.name, err.message);
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return res.status(504).json({ error: 'Phoenix took too long to answer. Please try again.' });
    }
    return res.status(502).json({ error: AI_UNAVAILABLE });
  }
}
