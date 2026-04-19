// api/db.js — Supabase Database Proxy

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

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

export default async function handler(req, res) {
  // CORS — open for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Database not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in Vercel.' });
  }

  const bodyStr = JSON.stringify(req.body || {});
  if (bodyStr.length > 8000) return res.status(413).json({ error: 'Request too large.' });

  const { action } = req.query;

  try {
    // ── CONTACT FORM ──────────────────────────────
    if (action === 'contact' && req.method === 'POST') {
      const { name, email, opportunity, message } = req.body;
      if (!name || !email || !message) return res.status(400).json({ error: 'Missing required fields.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email.' });
      const result = await supabase('contact_submissions', 'POST', {
        name: name.slice(0, 100),
        email: email.slice(0, 200),
        opportunity: (opportunity || 'Other').slice(0, 100),
        message: message.slice(0, 5000),
        created_at: new Date().toISOString(),
      });
      if (!result.ok) return res.status(500).json({ error: 'DB insert failed: ' + JSON.stringify(result.data) });
      return res.status(200).json({ success: true });
    }

    // ── NEWSLETTER ────────────────────────────────
    if (action === 'subscribe' && req.method === 'POST') {
      const { email } = req.body;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email.' });
      await supabase('newsletter_subscribers?on_conflict=email', 'POST', {
        email: email.slice(0, 200),
        subscribed_at: new Date().toISOString(),
      });
      return res.status(200).json({ success: true });
    }

    // ── PAGE VIEW ─────────────────────────────────
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

    // ── BLOG VIEW ─────────────────────────────────
    if (action === 'blogview' && req.method === 'POST') {
      const { post_id, title, category } = req.body;
      if (!post_id || !title) return res.status(400).json({ error: 'Missing post_id or title.' });
      const existing = await supabase(`blog_post_views?post_id=eq.${encodeURIComponent(String(post_id))}&select=id,views`);
      if (existing.data && existing.data.length > 0) {
        const row = existing.data[0];
        await supabase(`blog_post_views?id=eq.${row.id}`, 'PATCH', { views: (row.views || 0) + 1, last_viewed: new Date().toISOString() });
      } else {
        await supabase('blog_post_views', 'POST', { post_id: String(post_id).slice(0, 50), title: title.slice(0, 300), category: (category || 'General').slice(0, 100), views: 1, first_viewed: new Date().toISOString(), last_viewed: new Date().toISOString() });
      }
      return res.status(200).json({ success: true });
    }

    // ── ANALYTICS (protected) ─────────────────────
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
