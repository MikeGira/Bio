// api/stats.js — Public aggregated portfolio stats (no auth required)

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const CACHE_SECONDS = 300;

async function supabase(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey':        SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type':  'application/json',
    },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function buildSparkline(events, days) {
  if (!Array.isArray(events) || events.length === 0) return [];
  const counts = {};
  for (const ev of events) {
    const day = (ev.created_at || '').slice(0, 10);
    if (day) counts[day] = (counts[day] || 0) + 1;
  }
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: counts[key] || 0 });
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Not configured.' });
  }

  const VALID_PERIODS = { '7d': 7, '30d': 30, '90d': 90, 'all': null };
  const periodKey = VALID_PERIODS.hasOwnProperty(req.query.period) ? req.query.period : '30d';
  const days      = VALID_PERIODS[periodKey];
  const since     = days ? new Date(Date.now() - days * 86400000).toISOString() : null;
  const tf        = since ? `&created_at=gte.${encodeURIComponent(since)}` : '';

  try {
    const [
      pageViewsData,
      blogPostsData,
      contactsData,
      subsData,
      chatStartsData,
      chatMsgsData,
      projectClicksData,
      ctaClicksData,
      sparklineData,
    ] = await Promise.all([
      supabase('page_views?select=views'),
      supabase('blog_post_views?select=title,category,views&order=views.desc&limit=5'),
      supabase('contact_submissions?select=id&limit=1000'),
      supabase('newsletter_subscribers?is_active=eq.true&select=id&limit=5000'),
      supabase(`analytics_events?event_type=eq.chat_start&select=id${tf}&limit=100000`),
      supabase(`analytics_events?event_type=eq.chat_message&select=id${tf}&limit=100000`),
      supabase(`analytics_events?event_type=eq.project_click&select=id${tf}&limit=100000`),
      supabase(`analytics_events?event_type=eq.cta_click&select=id${tf}&limit=100000`),
      supabase(`analytics_events?event_type=eq.pageview&select=created_at,metadata${tf}&order=created_at.asc&limit=100000`),
    ]);

    const totalPageViews = Array.isArray(pageViewsData)
      ? pageViewsData.reduce((sum, r) => sum + (r.views || 0), 0) : 0;
    const contacts      = Array.isArray(contactsData)       ? contactsData.length       : 0;
    const subscribers   = Array.isArray(subsData)           ? subsData.length           : 0;
    const chatStarts    = Array.isArray(chatStartsData)     ? chatStartsData.length     : 0;
    const chatMessages  = Array.isArray(chatMsgsData)       ? chatMsgsData.length       : 0;
    const projectClicks = Array.isArray(projectClicksData)  ? projectClicksData.length  : 0;
    const ctaClicks     = Array.isArray(ctaClicksData)      ? ctaClicksData.length      : 0;
    const conversionRate = totalPageViews > 0
      ? ((contacts / totalPageViews) * 100).toFixed(2) : '0.00';

    const pageviewEvents = Array.isArray(sparklineData) ? sparklineData : [];
    const sparkline = buildSparkline(pageviewEvents, days || 30);

    // Aggregate metadata breakdowns from pageview events
    const countries = {}, cities = {}, browsers = {}, os_map = {}, devices = {}, langs = {};
    let newV = 0, retV = 0;
    for (const ev of pageviewEvents) {
      const m = ev.metadata || {};
      if (m.country && m.country !== 'Unknown') countries[m.country] = (countries[m.country] || 0) + 1;
      if (m.city    && m.city    !== 'Unknown') cities[m.city]       = (cities[m.city]       || 0) + 1;
      if (m.browser && m.browser !== 'Unknown') browsers[m.browser]  = (browsers[m.browser]  || 0) + 1;
      if (m.os      && m.os      !== 'Unknown') os_map[m.os]         = (os_map[m.os]         || 0) + 1;
      if (m.device  && m.device  !== 'Unknown') devices[m.device]    = (devices[m.device]    || 0) + 1;
      const lc = (m.lang || '').slice(0, 2).toLowerCase();
      if (lc && lc !== 'un') langs[lc] = (langs[lc] || 0) + 1;
      if (m.new_visitor === 'true')  newV++;
      if (m.new_visitor === 'false') retV++;
    }

    function topN(obj, n = 10) {
      return Object.entries(obj)
        .sort(([, a], [, b]) => b - a)
        .slice(0, n)
        .map(([name, count]) => ({ name, count }));
    }

    const payload = {
      period: periodKey,
      since:  since || 'all',
      stats: {
        page_views:      totalPageViews,
        ai_chats:        chatStarts,
        ai_messages:     chatMessages,
        contacts,
        subscribers,
        project_clicks:  projectClicks,
        cta_clicks:      ctaClicks,
        conversion_rate: conversionRate,
      },
      top_posts:  Array.isArray(blogPostsData) ? blogPostsData : [],
      sparkline,
      breakdowns: {
        countries: topN(countries, 15),
        cities:    topN(cities, 10),
        browsers:  topN(browsers),
        os:        topN(os_map),
        devices:   topN(devices),
        languages: topN(langs, 10),
        visitors:  { new: newV, returning: retV },
      },
      generated_at: new Date().toISOString(),
    };

    res.setHeader('Cache-Control', `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=60`);
    return res.status(200).json(payload);

  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: 'Stats unavailable.' });
  }
}
