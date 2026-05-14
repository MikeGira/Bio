// api/visitors.js — Embeddable SVG visitor count badge
// Usage: <a href="/stats"><img src="/api/visitors" alt="visitor count"/></a>

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

function badge(count) {
  const label = count === null ? 'loading...' : `${count.toLocaleString()} visitors`;
  const w = 20 + label.length * 7.2; // approximate text width
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="26" role="img" aria-label="${label}">
  <title>${label}</title>
  <rect rx="13" width="${w}" height="26" fill="#13131a"/>
  <rect rx="13" width="${w}" height="26" fill="none" stroke="rgba(255,255,255,0.13)" stroke-width="1"/>
  <g transform="translate(8,4)" stroke="#ee0000" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1 9s2-5.5 8-5.5S17 9 17 9s-2 5.5-8 5.5S1 9 1 9z"/>
    <circle cx="9" cy="9" r="2.8"/>
  </g>
  <text x="${w / 2 + 6}" y="17" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="11" fill="#c0c0d8" text-anchor="middle">${label}</text>
</svg>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  let count = null;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/page_views?select=views`, {
      headers: {
        'apikey':        SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    const data = await r.json();
    count = Array.isArray(data) ? data.reduce((s, row) => s + (row.views || 0), 0) : 0;
  } catch {}

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).send(badge(count));
}
