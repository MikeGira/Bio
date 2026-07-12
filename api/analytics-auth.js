// api/analytics-auth.js
// Server-side authentication for the analytics dashboard.
// The password is stored ONLY in Vercel environment variables — never in client code.

import { scryptSync, timingSafeEqual } from 'crypto';
import { extractIP, checkRateLimit, createAuthToken, SITE_URL } from './_lib.js';

// Fixed salt for HMAC-style comparison against the env var (not for storage — the env var is the secret)
const AUTH_SALT = 'bio-analytics-auth-v1';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  SITE_URL);
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
  // scryptSync adds computational cost (prevents offline brute-force if the hash leaks),
  // and produces equal-length outputs so timingSafeEqual always runs on equal-length inputs.
  const provided = scryptSync(String(password || ''), AUTH_SALT, 64);
  const expected = scryptSync(correctPassword,         AUTH_SALT, 64);
  let match = false;
  try { match = timingSafeEqual(provided, expected); } catch {}
  if (!password || !match) {
    await new Promise(r => setTimeout(r, 800));
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const token = createAuthToken(correctPassword);
  return res.status(200).json({ token });
}
