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
  const sigBuf = Buffer.from(String(decoded.sig ?? ''));
  const expBuf = Buffer.from(expectedSig);
  let sigValid = false;
  if (sigBuf.length === expBuf.length) sigValid = timingSafeEqual(sigBuf, expBuf);
  return sigValid && !expired;
}

// ── Shared environment configuration ──────────────────────────────────────
export const SUPABASE_URL         = process.env.SUPABASE_URL;
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
export const RESEND_API_KEY       = process.env.RESEND_API_KEY;
export const NOTIFY_EMAIL         = process.env.NOTIFY_EMAIL || 'chrismikeparker1@gmail.com';
export const SITE_URL             = process.env.SITE_URL || 'https://bio-two-eta.vercel.app';

export async function supabase(path, method = 'GET', body = null) {
  const prefer = method === 'POST' ? 'return=representation' : method === 'PATCH' ? 'return=minimal' : '';
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey':        SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type':  'application/json',
      ...(prefer ? { 'Prefer': prefer } : {}),
    },
    body: body ? JSON.stringify(body) : null,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) console.error(`Supabase error ${res.status} on ${method} ${path}:`, text);
  return { ok: res.ok, status: res.status, data };
}

export async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set'); return { ok: false }; }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `Stack Signal <hello@blog.h0m3labs.store>`, to: Array.isArray(to) ? to : [to], subject, html }),
    });
    const data = await res.json();
    if (!res.ok) console.error('Resend error:', data);
    return { ok: res.ok, data, error: data?.message };
  } catch (e) {
    console.error('Email send failed:', e.message);
    return { ok: false };
  }
}
