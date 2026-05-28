// api/analytics-auth.js
// Server-side authentication for the analytics dashboard.
// The password is stored ONLY in Vercel environment variables — never in client code.

import { createHmac, timingSafeEqual } from 'crypto';
import { extractIP, checkRateLimit } from './_lib.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  process.env.SITE_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit: 10 attempts per 15 minutes per IP
  const ip = extractIP(req);
  if (!checkRateLimit(`auth:${ip}`, 10, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many login attempts.' });
  }

  const { password } = req.body || {};
  const correctPassword = process.env.ANALYTICS_PASSWORD;

  if (!correctPassword) {
    return res.status(500).json({ error: 'ANALYTICS_PASSWORD not configured in Vercel env vars.' });
  }
  const pwBuf = Buffer.from(String(password || ''));
  const correctBuf = Buffer.from(correctPassword);
  const match = pwBuf.length === correctBuf.length && timingSafeEqual(pwBuf, correctBuf);
  if (!password || !match) {
    await new Promise(r => setTimeout(r, 800));
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const ts = Date.now();
  const sig = createHmac('sha256', correctPassword).update(String(ts)).digest('hex');
  const token = Buffer.from(JSON.stringify({ ts, sig })).toString('base64');

  return res.status(200).json({ token });
}
