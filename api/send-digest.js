// api/send-digest.js — Send blog digest email to all newsletter subscribers
// Called from the analytics dashboard — requires analytics token auth

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY       = process.env.RESEND_API_KEY;
const ANALYTICS_PASSWORD   = process.env.ANALYTICS_PASSWORD;
const NOTIFY_EMAIL         = process.env.NOTIFY_EMAIL || 'chrismikeparker1@gmail.com';
const SITE_URL             = process.env.SITE_URL || 'https://bio-two-eta.vercel.app';

async function supabase(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey':        SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type':  'application/json',
    },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not set' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    `Stack Signal <hello@mikegira.dev>`,
      to:      Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });
  const data = await res.json();
  return { ok: res.ok, data, error: data.message };
}

function buildDigestHtml(posts, issueNum) {
  const blogUrl = `${SITE_URL}/blog.html`;
  const topPosts = posts.slice(0, 5);

  const postRows = topPosts.map((p, i) => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #e5e5e5">
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ee0000;margin-bottom:6px">${p.category || 'Tech'}</div>
        <a href="${blogUrl}#article-${p.id}" style="font-size:17px;font-weight:700;color:#0d0d12;text-decoration:none;line-height:1.3">${p.title}</a>
        <div style="font-size:14px;color:#52525b;margin-top:6px;line-height:1.6">${p.excerpt || ''}</div>
        <a href="${blogUrl}#article-${p.id}" style="display:inline-block;margin-top:10px;font-size:13px;font-weight:600;color:#ee0000;text-decoration:none">Read article →</a>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Stack Signal Digest</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr>
          <td style="background:#0d0d12;padding:28px 32px">
            <div style="display:flex;align-items:center;gap:12px">
              <table cellpadding="0" cellspacing="0" style="display:inline-table;vertical-align:middle;margin-right:10px">
                <tr><td width="36" height="36" align="center" valign="middle" style="width:36px;height:36px;background:#ee0000;border-radius:9px;font-weight:900;font-size:14px;color:#fff;font-family:Arial,sans-serif;line-height:36px;text-align:center">MT</td></tr>
              </table>
              <span style="font-size:20px;font-weight:800;color:#f4f4f8;vertical-align:middle;letter-spacing:-.02em">Stack Signal</span>
            </div>
            <div style="font-size:13px;color:#8888a0;margin-top:8px">by Michael Twagirayezu · Toronto, ON</div>
          </td>
        </tr>

        <!-- Issue label -->
        <tr>
          <td style="padding:20px 32px 0">
            <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#ee0000">Latest from the blog</div>
          </td>
        </tr>

        <!-- Articles -->
        <tr>
          <td style="padding:8px 32px 8px">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${postRows}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:24px 32px">
            <a href="${blogUrl}" style="display:inline-block;background:#ee0000;color:#fff;font-weight:700;font-size:14px;padding:13px 24px;border-radius:50px;text-decoration:none">Read all articles →</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px 28px;border-top:1px solid #e5e5e5">
            <div style="font-size:12px;color:#8888a0;line-height:1.7">
              You're receiving this because you subscribed to Stack Signal at <a href="${SITE_URL}" style="color:#ee0000">mikegira.dev</a>.<br/>
              To unsubscribe, reply to this email with "unsubscribe".
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── AUTH — same token system as analytics ──
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!ANALYTICS_PASSWORD || !token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const expired = (Date.now() - decoded.ts) > 8 * 60 * 60 * 1000;
    if (decoded.sig !== ANALYTICS_PASSWORD.slice(0, 4) || expired) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not set in Vercel environment variables.' });
  }

  try {
    // Get all active subscribers
    const subscribers = await supabase(
      'newsletter_subscribers?is_active=eq.true&select=email,subscribed_at&order=subscribed_at.desc'
    );

    if (!subscribers || subscribers.length === 0) {
      return res.status(200).json({ sent: 0, message: 'No subscribers to send to.' });
    }

    // Get the blog posts provided in the request body (sent from the dashboard)
    const { posts = [], subject } = req.body || {};
    if (!posts.length) {
      return res.status(400).json({ error: 'No posts provided. Refresh blog data first.' });
    }

    const emailSubject = subject || `Stack Signal: ${posts[0]?.title || 'Latest from the blog'}`;
    const html = buildDigestHtml(posts);

    // Send to each subscriber individually (personalised + avoids bulk spam flags)
    let sent = 0;
    let failed = 0;
    const errors = [];

    for (const sub of subscribers) {
      const result = await sendEmail({
        to:      sub.email,
        subject: emailSubject,
        html,
      });
      if (result.ok) {
        sent++;
      } else {
        failed++;
        errors.push({ email: sub.email, error: result.error });
        console.error('Failed to send to', sub.email, result.error);
      }
      // Small delay to respect Resend rate limits (avoid bursting)
      if (subscribers.length > 10) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    // Notify Michael of the send
    await sendEmail({
      to:      NOTIFY_EMAIL,
      subject: `Stack Signal digest sent to ${sent} subscriber${sent !== 1 ? 's' : ''}`,
      html:    `<p>Digest sent successfully.</p><p>Delivered: <strong>${sent}</strong><br/>Failed: <strong>${failed}</strong></p>${errors.length ? `<p>Errors: ${JSON.stringify(errors)}</p>` : ''}`,
    });

    return res.status(200).json({
      sent,
      failed,
      total: subscribers.length,
      message: `Digest sent to ${sent} of ${subscribers.length} subscriber${subscribers.length !== 1 ? 's' : ''}.`,
      ...(errors.length ? { errors } : {}),
    });

  } catch (err) {
    console.error('send-digest error:', err);
    return res.status(500).json({ error: 'Send failed: ' + err.message });
  }
}