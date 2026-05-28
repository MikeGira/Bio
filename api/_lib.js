// api/_lib.js — Shared utilities for all serverless functions

import { createHmac, timingSafeEqual } from 'crypto';

const _rlMap = new Map();

export function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const entry = _rlMap.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
  entry.count++;
  _rlMap.set(key, entry);
  return entry.count <= limit;
}

// Vercel appends the real client IP to x-forwarded-for; taking the last entry
// prevents spoofing via a client-injected X-Forwarded-For header.
export function extractIP(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) {
    const last = fwd.split(',').pop().trim();
    if (last) return last;
  }
  return (req.headers['x-real-ip'] || 'unknown').trim();
}

// Stricter than /^[^\s@]+@[^\s@]+\.[^\s@]+$/: requires ≥2-char alphabetic TLD
export const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function createAuthToken(password) {
  const ts = Date.now();
  const sig = createHmac('sha256', password).update(String(ts)).digest('hex');
  return Buffer.from(JSON.stringify({ ts, sig })).toString('base64');
}

// throws if token is malformed (bad base64/JSON); returns false if invalid or expired
export function verifyAuthToken(token, password, maxAgeMs = 8 * 60 * 60 * 1000) {
  const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
  const expired = (Date.now() - decoded.ts) > maxAgeMs;
  const expectedSig = createHmac('sha256', password).update(String(decoded.ts)).digest('hex');
  let sigValid = false;
  try { sigValid = timingSafeEqual(Buffer.from(String(decoded.sig)), Buffer.from(expectedSig)); } catch {}
  return sigValid && !expired;
}
