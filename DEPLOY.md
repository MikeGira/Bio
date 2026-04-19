# 🚀 MikeGira.dev — Go Live on Vercel (Free)

## Why Vercel and not GitHub Pages?

GitHub Pages only serves static files — it can't hide your API key.
Vercel gives you **static hosting + serverless functions** for free.
Your API key lives in Vercel's secure environment — visitors never see it.

---

## Files You Now Have

```
mikegira/
├── index.html          ← Main portfolio (calls /api/chat)
├── blog.html           ← Tech blog (calls /api/chat)
├── manifest.json       ← PWA manifest
├── sw.js               ← Service Worker
├── vercel.json         ← Vercel config (routes, headers)
├── api/
│   └── chat.js         ← 🔐 Secure proxy (your key never leaves here)
└── DEPLOY.md           ← This file
```

---

## Step 1 — Get Your Anthropic API Key (5 min)

1. Go to **https://console.anthropic.com**
2. Sign up / log in
3. Click **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)
5. Add $5 credits under **Billing** (enough for thousands of conversations)

> ⚠️ Never paste this key into any HTML or JS file. It goes ONLY into Vercel's dashboard.

---

## Step 2 — Push to GitHub (3 min)

```bash
# In your project folder:
git init
git add .
git commit -m "Initial deploy — MikeGira.dev"

# Create a new repo at github.com (call it: mikegira)
# Then:
git remote add origin https://github.com/YOUR_USERNAME/mikegira.git
git branch -M main
git push -u origin main
```

---

## Step 3 — Deploy on Vercel (5 min)

1. Go to **https://vercel.com** → Sign up free with GitHub
2. Click **Add New Project**
3. Import your `mikegira` GitHub repository
4. On the configuration screen:
   - **Framework Preset:** Other
   - **Root Directory:** `.` (leave as default)
   - Leave everything else as-is
5. Click **Deploy**

Your site will be live at: `https://mikegira.vercel.app`

---

## Step 4 — Add Your API Key Securely (2 min)

**This is the critical step that makes the AI work.**

1. In your Vercel project dashboard, go to **Settings → Environment Variables**
2. Click **Add New**:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-api03-...` (your actual key)
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development
3. Click **Save**
4. Go to **Deployments** → click the three dots on your latest deploy → **Redeploy**

✅ Phoenix AI assistant will now work for all visitors — without them seeing your key.

---

## Step 5 — Custom Domain (Optional, ~10 min)

To use **mikegira.dev** or any domain you own:

1. In Vercel: **Settings → Domains → Add Domain**
2. Type your domain (e.g., `mikegira.dev`)
3. Vercel shows you DNS records to add
4. In your domain registrar (GoDaddy, Namecheap, etc.), add those records
5. Wait 5-10 min → HTTPS is automatic ✅

---

## How the Secure Proxy Works

```
Visitor's browser
       │
       │  POST /api/chat  (no API key exposed)
       ▼
Vercel Serverless Function (api/chat.js)
       │
       │  Adds ANTHROPIC_API_KEY from secure env
       │  POST https://api.anthropic.com/v1/messages
       ▼
Anthropic Claude AI
       │
       ▼
Response back to visitor ✅
```

Your key is **only on Vercel's servers** — never in any file a visitor can read.

---

## Updating Your Site

Any time you push to GitHub, Vercel auto-deploys:

```bash
git add .
git commit -m "Updated experience section"
git push
```

That's it. Live in ~30 seconds.

---

## Estimated Monthly Cost

| Usage | Cost |
|-------|------|
| Vercel hosting | **Free** (Hobby tier) |
| Custom domain | $10-15/year (optional) |
| Anthropic API | ~$0.003 per conversation |
| 1,000 conversations/month | ~$3 |

For a professional portfolio, expect **less than $1/month** in API costs.

---

## Troubleshooting

**Phoenix AI says "Connection error"**
→ Check Vercel Environment Variables — make sure `ANTHROPIC_API_KEY` is set and you redeployed after adding it.

**Site shows but AI doesn't work**
→ Go to Vercel dashboard → Functions tab → check for error logs on `/api/chat`

**CORS error in browser console**
→ Update the `allowedOrigins` array in `api/chat.js` to include your actual Vercel URL.

---

*Built with purpose. Powered by passion. Secured by design.*

---

## Step 5 — Set Up Supabase Database (15 min, Free)

This is what makes this a **full stack app** — a real PostgreSQL database storing contact form submissions, newsletter subscribers, page analytics, and blog post view counts.

### Create the Database

1. Go to **https://supabase.com** → Sign up free
2. Click **New Project** → give it a name (e.g., `mikegira`) → choose a region → **Create Project**
3. Wait ~2 minutes for the project to spin up

### Run the Schema

1. In your Supabase dashboard → **SQL Editor** → **New Query**
2. Open `database/schema.sql` from this repo
3. Copy the entire contents → paste into the SQL editor → click **Run**
4. You should see 4 tables created: `contact_submissions`, `newsletter_subscribers`, `page_views`, `blog_post_views`

### Get Your Credentials

1. Supabase dashboard → **Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
   - **service_role** key under "Project API Keys" (the long one — not `anon`)

### Add to Vercel Environment Variables

Back in Vercel → **Settings** → **Environment Variables**, add two more:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIs...` (the service_role key) |

→ **Save** → **Redeploy**

### Verify It's Working

After redeploying, visit your site and:
- Submit the contact form → check Supabase **Table Editor** → `contact_submissions`
- Subscribe to the newsletter on the blog → check `newsletter_subscribers`
- Navigate between pages → check `page_views`
- Open a blog article → check `blog_post_views`

You now have a **real relational database** storing real user data. Full stack. ✅

### View Your Data

Supabase dashboard → **Table Editor** — you can see every form submission, subscriber, and page view in a clean spreadsheet-style UI. You can also export to CSV anytime.
