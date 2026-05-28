// api/send-digest.js — Send blog digest email to all newsletter subscribers
// Called from the analytics dashboard — requires analytics token auth

import { createHmac } from 'crypto';
import {
  extractIP, checkRateLimit, verifyAuthToken,
  SITE_URL, NOTIFY_EMAIL, supabase, sendEmail,
} from './_lib.js';

const ANALYTICS_PASSWORD = process.env.ANALYTICS_PASSWORD;

function makeUnsubToken(email) {
  const secret = process.env.UNSUBSCRIBE_SECRET || ANALYTICS_PASSWORD;
  if (!secret) throw new Error('UNSUBSCRIBE_SECRET not configured');
  return createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 40);
}

function buildDigestHtml(posts, subscriberEmail) {
  const blogUrl  = `${SITE_URL}/blog.html`;
  const unsubUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(subscriberEmail)}&token=${makeUnsubToken(subscriberEmail)}`;
  const topPosts = posts.slice(0, 5);

  const postRows = topPosts.map(p => `
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
              You're receiving this because you subscribed to Stack Signal at <a href="${SITE_URL}" style="color:#ee0000">Mike's Bio</a>.<br/>
              Don't want these emails? <a href="${unsubUrl}" style="color:#8888a0">Unsubscribe</a>.
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
  res.setHeader('Access-Control-Allow-Origin', SITE_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit: 5 send attempts per hour per IP
  const ip = extractIP(req);
  if (!checkRateLimit(`digest:${ip}`, 5, 60 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many requests.' });
  }

  // ── AUTH — same token system as analytics ──
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!ANALYTICS_PASSWORD || !token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    if (!verifyAuthToken(token, ANALYTICS_PASSWORD)) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const { data: subscribers } = await supabase(
      'newsletter_subscribers?is_active=eq.true&select=email,subscribed_at&order=subscribed_at.desc'
    );

    if (!subscribers || subscribers.length === 0) {
      return res.status(200).json({ sent: 0, message: 'No subscribers to send to.' });
    }

    const { posts = [], subject } = req.body || {};
    if (!posts.length) {
      return res.status(400).json({ error: 'No posts provided. Refresh blog data first.' });
    }

    const emailSubject = (typeof subject === 'string' ? subject.slice(0, 200) : null)
      || `Stack Signal: ${String(posts[0]?.title || 'Latest from the blog').slice(0, 100)}`;

    let sent = 0;
    let failed = 0;
    const errors = [];

    for (const sub of subscribers) {
      const html = buildDigestHtml(posts, sub.email);
      const result = await sendEmail({ to: sub.email, subject: emailSubject, html });
      if (result.ok) {
        sent++;
      } else {
        failed++;
        errors.push({ email: sub.email, error: result.error });
        console.error('Failed to send to', sub.email, result.error);
      }
      if (subscribers.length > 10) await new Promise(r => setTimeout(r, 100));
    }

    await sendEmail({
      to:      NOTIFY_EMAIL,
      subject: `Stack Signal digest sent to ${sent} subscriber${sent !== 1 ? 's' : ''}`,
      html:    `<p>Digest sent successfully.</p><p>Delivered: <strong>${sent}</strong><br/>Failed: <strong>${failed}</strong></p>${errors.length ? `<p>Errors: ${JSON.stringify(errors)}</p>` : ''}`,
    });

    return res.status(200).json({
      sent, failed, total: subscribers.length,
      message: `Digest sent to ${sent} of ${subscribers.length} subscriber${subscribers.length !== 1 ? 's' : ''}.`,
      ...(errors.length ? { errors } : {}),
    });

  } catch (err) {
    console.error('send-digest error:', err.message);
    return res.status(500).json({ error: 'Send failed.' });
  }
}
