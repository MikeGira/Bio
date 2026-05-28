// api/analytics-auth.js
// Server-side authentication for the analytics dashboard.
// The password is stored ONLY in Vercel environment variables — never in client code.

import { createHash, timingSafeEqual } from 'crypto';
import { extractIP, checkRateLimit, createAuthToken } from './_lib.js';

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
  // Hash both passwords to identical 32-byte buffers so timingSafeEqual always
  // runs on equal-length inputs — eliminates the length-based timing oracle.
  const provided = createHash('sha256').update(String(password || '')).digest();
  const expected = createHash('sha256').update(correctPassword).digest();
  let match = false;
  try { match = timingSafeEqual(provided, expected); } catch {}
  if (!password || !match) {
    await new Promise(r => setTimeout(r, 800));
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const token = createAuthToken(correctPassword);
  return res.status(200).json({ token });
}
