// api/_lib.js — Shared utilities for all serverless functions

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
