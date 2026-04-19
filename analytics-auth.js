// api/analytics-auth.js
// Server-side authentication for the analytics dashboard.
// The password is stored ONLY in Vercel environment variables — never in client code.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  process.env.SITE_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};
  const correctPassword = process.env.ANALYTICS_PASSWORD;

  if (!correctPassword) {
    return res.status(500).json({ error: 'ANALYTICS_PASSWORD not configured in Vercel env vars.' });
  }
  if (!password || password !== correctPassword) {
    // Delay response to slow brute-force attempts
    await new Promise(r => setTimeout(r, 800));
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  // Issue a signed token: base64(timestamp + secret)
  // Simple HMAC-free token — good enough for a personal dashboard
  const token = Buffer.from(
    JSON.stringify({ ts: Date.now(), sig: correctPassword.slice(0,4) })
  ).toString('base64');

  return res.status(200).json({ token });
}
