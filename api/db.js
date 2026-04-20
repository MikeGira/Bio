// api/db.js — Supabase Database Proxy + Email via Resend

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY       = process.env.RESEND_API_KEY;        // add this in Vercel env vars
const NOTIFY_EMAIL         = process.env.NOTIFY_EMAIL || 'chrismikeparker1@gmail.com';

async function supabase(path, method = 'GET', body = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey':        SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        method === 'POST' ? 'return=representation' : '',
    },
    body: body ? JSON.stringify(body) : null,
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

// Send email via Resend API
async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — email not sent');
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'Mike\'s Bio <hello@blog.h0m3labs.store>',  // must be verified domain on Resend
        to:      Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) console.error('Resend error:', data);
    return res.ok;
  } catch(e) {
    console.error('Email send failed:', e.message);
    return false;
  }
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

      // Save to Supabase
      const result = await supabase('contact_submissions', 'POST', {
        name:        name.slice(0, 100),
        email:       email.slice(0, 200),
        opportunity: (opportunity || 'Other').slice(0, 100),
        message:     message.slice(0, 5000),
        created_at:  new Date().toISOString(),
      });
      if (!result.ok) return res.status(500).json({ error: 'DB insert failed.' });

      // Notify Michael by email
      await sendEmail({
        to:      NOTIFY_EMAIL,
        subject: `New contact from ${name} — ${opportunity || 'General'}`,
        html: `
          <h2 style="color:#ee0000">New message on blog.h0m3labs.store</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Opportunity:</strong> ${opportunity || 'Not specified'}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left:3px solid #ee0000;padding-left:12px;color:#444">${message.replace(/\n/g,'<br>')}</blockquote>
          <p style="color:#888;font-size:12px">Sent via blog.h0m3labs.store contact form</p>
        `,
      });

      return res.status(200).json({ success: true });
    }

    // ── NEWSLETTER ────────────────────────────────────────────────────
    if (action === 'subscribe' && req.method === 'POST') {
      const { email } = req.body;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email.' });

      // Save to Supabase (upsert — no duplicate)
      await supabase('newsletter_subscribers?on_conflict=email', 'POST', {
        email:         email.slice(0, 200),
        subscribed_at: new Date().toISOString(),
      });

      // Welcome email to subscriber
      await sendEmail({
        to:      email,
        subject: "You're subscribed to Michael's Tech Blog",
        html: `
          <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#ee0000">Welcome to Michael's Tech Blog 🔥</h2>
            <p>Hi there! You're now subscribed to <strong>The Stack Signal by Michael Twagirayezu</strong> — a blog about cloud architecture, DevSecOps, AI integration, and tech that matters.</p>
            <p>You'll hear from me when there's something worth reading. No spam, ever.</p>
            <p style="color:#888;font-size:13px">— Michael Twagirayezu · Toronto, ON</p>
            <hr style="border:1px solid #eee;margin:24px 0"/>
            <p style="font-size:11px;color:#aaa">You subscribed at The Stack Signal by Michael Twagirayezu. To unsubscribe, reply with "unsubscribe".</p>
          </div>
        `,
      });

      // Notify Michael
      await sendEmail({
        to:      NOTIFY_EMAIL,
        subject: `New blog subscriber: ${email}`,
        html:    `<p>New subscriber: <strong>${email}</strong></p><p>Subscribed at: ${new Date().toLocaleString()}</p>`,
      });

      return res.status(200).json({ success: true });
    }

    // ── PAGE VIEW ─────────────────────────────────────────────────────
    if (action === 'pageview' && req.method === 'POST') {
      const { page } = req.body;
      if (!page) return res.status(400).json({ error: 'Missing page.' });
      const existing = await supabase(`page_views?page=eq.${encodeURIComponent(page)}&select=id,views`);
      if (existing.data && existing.data.length > 0) {
        const row = existing.data[0];
        await supabase(`page_views?id=eq.${row.id}`, 'PATCH', { views: (row.views || 0) + 1, last_visited: new Date().toISOString() });
      } else {
        await supabase('page_views', 'POST', { page, views: 1, first_visited: new Date().toISOString(), last_visited: new Date().toISOString() });
      }
      return res.status(200).json({ success: true });
    }

    // ── BLOG VIEW ─────────────────────────────────────────────────────
    if (action === 'blogview' && req.method === 'POST') {
      const { post_id, title, category } = req.body;
      if (!post_id || !title) return res.status(400).json({ error: 'Missing post_id or title.' });
      const existing = await supabase(`blog_post_views?post_id=eq.${encodeURIComponent(String(post_id))}&select=id,views`);
      if (existing.data && existing.data.length > 0) {
        const row = existing.data[0];
        await supabase(`blog_post_views?id=eq.${row.id}`, 'PATCH', { views: (row.views || 0) + 1, last_viewed: new Date().toISOString() });
      } else {
        await supabase('blog_post_views', 'POST', { post_id: String(post_id).slice(0,50), title: title.slice(0,300), category: (category||'General').slice(0,100), views: 1, first_viewed: new Date().toISOString(), last_viewed: new Date().toISOString() });
      }
      return res.status(200).json({ success: true });
    }

    // ── ANALYTICS ─────────────────────────────────────────────────────
    if (action === 'analytics' && req.method === 'GET') {
      const authHeader = req.headers['authorization'] || '';
      const token = authHeader.replace('Bearer ', '').trim();
      const analyticsPassword = process.env.ANALYTICS_PASSWORD;
      if (analyticsPassword && token) {
        try {
          const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
          if (decoded.sig !== analyticsPassword.slice(0, 4) || (Date.now() - decoded.ts) > 8 * 60 * 60 * 1000) {
            return res.status(401).json({ error: 'Unauthorized' });
          }
        } catch { return res.status(401).json({ error: 'Unauthorized' }); }
      }
      const [pages, posts, subscribers, contacts] = await Promise.all([
        supabase('page_views?select=page,views,last_visited&order=views.desc'),
        supabase('blog_post_views?select=title,category,views&order=views.desc&limit=20'),
        supabase('newsletter_subscribers?select=email,subscribed_at&order=subscribed_at.desc&limit=100'),
        supabase('contact_submissions?select=name,email,opportunity,message,created_at&order=created_at.desc&limit=50'),
      ]);
      return res.status(200).json({
        page_views:  pages.data    || [],
        top_posts:   posts.data    || [],
        subscribers: subscribers.data || [],
        contacts:    contacts.data || [],
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Database error: ' + err.message });
  }
}
