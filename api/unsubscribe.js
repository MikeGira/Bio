import crypto from 'crypto';

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ANALYTICS_PASSWORD   = process.env.ANALYTICS_PASSWORD;
const SITE_URL             = process.env.SITE_URL || 'https://bio-two-eta.vercel.app';

function makeUnsubToken(email) {
  return crypto
    .createHmac('sha256', ANALYTICS_PASSWORD || 'fallback')
    .update(email.toLowerCase())
    .digest('hex')
    .slice(0, 40);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  const { email, token } = req.query;

  if (!email || !token) {
    return res.status(400).send(page('Invalid link', 'This unsubscribe link is missing required parameters.', false));
  }

  const normalised = decodeURIComponent(String(email)).toLowerCase().trim();

  if (!ANALYTICS_PASSWORD) {
    return res.status(500).send(page('Configuration error', 'Unsubscribe is not configured. Please contact Michael directly.', false));
  }

  const expected = makeUnsubToken(normalised);
  const valid =
    token.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));

  if (!valid) {
    return res.status(400).send(page('Invalid link', 'This unsubscribe link is invalid or has already been used.', false));
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).send(page('Database error', 'Could not process your request. Please try again later.', false));
  }

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/newsletter_subscribers?email=eq.${encodeURIComponent(normalised)}`,
    {
      method: 'PATCH',
      headers: {
        'apikey':        SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({ is_active: false }),
    }
  );

  if (!r.ok) {
    return res.status(500).send(page('Something went wrong', 'Could not unsubscribe you. Please try again or contact Michael directly.', false));
  }

  return res.status(200).send(page(
    'Unsubscribed',
    `${normalised} has been removed from Stack Signal. You won't receive any more emails.`,
    true
  ));
}

function page(title, message, success) {
  const color = success ? '#22c55e' : '#ef4444';
  const icon  = success ? '✓' : '✗';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${title} — Stack Signal</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0d0d12;color:#f0f0f8;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{background:#13131a;border:1px solid rgba(255,255,255,.11);border-radius:20px;padding:40px;max-width:420px;width:100%;text-align:center}
.icon{width:52px;height:52px;border-radius:50%;background:${color}22;color:${color};font-size:1.4rem;display:flex;align-items:center;justify-content:center;margin:0 auto 20px}
h1{font-size:1.3rem;font-weight:800;letter-spacing:-.02em;margin-bottom:10px}
p{font-size:.875rem;color:#c0c0d8;line-height:1.6;margin-bottom:24px}
a{display:inline-block;background:#ee0000;color:#fff;font-weight:600;font-size:.875rem;padding:11px 24px;border-radius:50px;text-decoration:none}
</style>
</head>
<body>
<div class="card">
  <div class="icon">${icon}</div>
  <h1>${title}</h1>
  <p>${message}</p>
  <a href="${SITE_URL}">Back to Mike's Bio →</a>
</div>
</body>
</html>`;
}
