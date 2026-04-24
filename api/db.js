// api/db.js — Supabase Database Proxy + Email via Resend

import crypto from 'crypto';

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY       = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL         = process.env.NOTIFY_EMAIL || 'chrismikeparker1@gmail.com';
const SITE_URL             = process.env.SITE_URL || 'https://bio-two-eta.vercel.app';

function makeUnsubToken(email) {
  return crypto
    .createHmac('sha256', process.env.ANALYTICS_PASSWORD || 'fallback')
    .update(email.toLowerCase())
    .digest('hex')
    .slice(0, 40);
}

async function supabase(path, method = 'GET', body = null) {
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
  if (!res.ok) {
    console.error(`Supabase error ${res.status} on ${method} ${path}:`, text);
  }
  return { ok: res.ok, status: res.status, data };
}

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set'); return false; }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `Stack Signal <hello@blog.h0m3labs.store>`, to: Array.isArray(to) ? to : [to], subject, html }),
    });
    const data = await res.json();
    if (!res.ok) console.error('Resend error:', data);
    return res.ok;
  } catch(e) { console.error('Email send failed:', e.message); return false; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Database not configured.' });
  }

  const bodyStr = JSON.stringify(req.body || {});
  if (bodyStr.length > 8000) return res.status(413).json({ error: 'Request too large.' });

  const { action } = req.query;

  try {

    // ── CONTACT FORM ──────────────────────────────────────────────────
    if (action === 'contact' && req.method === 'POST') {
      const { name, email, opportunity, message } = req.body;
      if (!name || !email || !message) return res.status(400).json({ error: 'Missing required fields.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email.' });
      const result = await supabase('contact_submissions', 'POST', {
        name: name.slice(0,100), email: email.slice(0,200),
        opportunity: (opportunity||'Other').slice(0,100), message: message.slice(0,5000),
        created_at: new Date().toISOString(),
      });
      if (!result.ok) return res.status(500).json({ error: 'DB insert failed.' });
      await sendEmail({
        to: NOTIFY_EMAIL,
        subject: `New contact from ${name} — ${opportunity||'General'}`,
        html: `<h2 style="color:#ee0000">New message on Mike's Bio</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p><p><strong>Opportunity:</strong> ${opportunity||'Not specified'}</p><p><strong>Message:</strong></p><blockquote style="border-left:3px solid #ee0000;padding-left:12px;color:#444">${message.replace(/\n/g,'<br>')}</blockquote>`,
      });
      return res.status(200).json({ success: true });
    }

    // ── NEWSLETTER ────────────────────────────────────────────────────
    if (action === 'subscribe' && req.method === 'POST') {
      const { email } = req.body;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email.' });
      await supabase('newsletter_subscribers?on_conflict=email', 'POST', {
        email: email.slice(0,200), subscribed_at: new Date().toISOString(),
      });
      const unsubUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${makeUnsubToken(email)}`;
      await sendEmail({
        to: email, subject: "You're subscribed to Stack Signal",
        html: `<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto"><h2 style="color:#ee0000">Welcome to Stack Signal!</h2><p>You're now subscribed to Michael Twagirayezu's tech blog covering cloud architecture, DevSecOps, AI integration, and more.</p><p style="color:#888;font-size:13px">— Michael · Toronto, ON</p><hr style="border:1px solid #eee;margin:24px 0"/><p style="font-size:11px;color:#aaa">Don't want these emails? <a href="${unsubUrl}" style="color:#aaa">Unsubscribe</a>.</p></div>`,
      });
      await sendEmail({
        to: NOTIFY_EMAIL, subject: `New blog subscriber: ${email}`,
        html: `<p>New subscriber: <strong>${email}</strong></p><p>${new Date().toLocaleString()}</p>`,
      });
      return res.status(200).json({ success: true });
    }

    // ── PAGE VIEW ─────────────────────────────────────────────────────
    if (action === 'pageview' && req.method === 'POST') {
      const { page } = req.body;
      if (!page) return res.status(400).json({ error: 'Missing page.' });
      const pageKey = String(page).trim().slice(0, 100);
      const existing = await supabase(`page_views?page=eq.${encodeURIComponent(pageKey)}&select=id,views`);
      if (existing.data && existing.data.length > 0) {
        const row = existing.data[0];
        await supabase(`page_views?id=eq.${row.id}`, 'PATCH', { views: (row.views||0) + 1, last_visited: new Date().toISOString() });
      } else {
        await supabase('page_views', 'POST', { page: pageKey, views: 1, first_visited: new Date().toISOString(), last_visited: new Date().toISOString() });
      }
      return res.status(200).json({ success: true });
    }

    // ── BLOG VIEW ─────────────────────────────────────────────────────
    if (action === 'blogview' && req.method === 'POST') {
      const { post_id, title, category } = req.body;
      if (!post_id || !title) return res.status(400).json({ error: 'Missing post_id or title.' });
      const stableId = String(post_id).trim().slice(0, 50);
      const existing = await supabase(`blog_post_views?post_id=eq.${encodeURIComponent(stableId)}&select=id,views`);
      if (existing.data && existing.data.length > 0) {
        const row = existing.data[0];
        await supabase(`blog_post_views?id=eq.${row.id}`, 'PATCH', { views: (row.views||0) + 1, last_viewed: new Date().toISOString() });
      } else {
        await supabase('blog_post_views', 'POST', {
          post_id: stableId, title: title.slice(0,300),
          category: (category||'General').slice(0,100),
          views: 1, first_viewed: new Date().toISOString(), last_viewed: new Date().toISOString()
        });
      }
      return res.status(200).json({ success: true });
    }

    // ── ANALYTICS ─────────────────────────────────────────────────────
    if (action === 'analytics' && req.method === 'GET') {
      // Auth check — but ALWAYS return real data even if token validation is skipped
      const authHeader = req.headers['authorization'] || '';
      const token = authHeader.replace('Bearer ', '').trim();
      const analyticsPassword = process.env.ANALYTICS_PASSWORD;

      if (analyticsPassword && token) {
        try {
          const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
          const expired = (Date.now() - decoded.ts) > 8 * 60 * 60 * 1000;
          if (decoded.sig !== analyticsPassword.slice(0, 4) || expired) {
            return res.status(401).json({ error: 'Session expired. Please log in again.' });
          }
        } catch {
          return res.status(401).json({ error: 'Invalid token.' });
        }
      } else if (analyticsPassword && !token) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      // Fetch all four tables in parallel
      const [pages, posts, subscribers, contacts] = await Promise.all([
        supabase('page_views?select=page,views,last_visited&order=views.desc'),
        supabase('blog_post_views?select=post_id,title,category,views,last_viewed&order=views.desc&limit=50'),
        supabase('newsletter_subscribers?select=email,subscribed_at&order=subscribed_at.desc&limit=100'),
        supabase('contact_submissions?select=name,email,opportunity,message,created_at&order=created_at.desc&limit=50'),
      ]);

      // Log what we got so Vercel logs show the actual data
      console.log('Analytics query results:', {
        page_views:  pages.data?.length ?? 'error',
        top_posts:   posts.data?.length ?? 'error',
        subscribers: subscribers.data?.length ?? 'error',
        contacts:    contacts.data?.length ?? 'error',
      });

      return res.status(200).json({
        page_views:  pages.data    || [],
        top_posts:   posts.data    || [],
        subscribers: subscribers.data || [],
        contacts:    contacts.data || [],
        _fetched_at: new Date().toISOString(), // timestamp so frontend can confirm fresh data
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Database error: ' + err.message });
  }
}