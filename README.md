# MikeGira.dev — Michael Twagirayezu

> **IT Systems Engineer · Multi-Cloud Architect · AI Solutions Innovator · Toronto, ON**

A production-grade Progressive Web App (PWA) serving as Michael Twagirayezu's professional portfolio, tech blog, and networking hub. Built with vanilla HTML/CSS/JS — no frameworks, no build steps, zero npm dependencies — and deployed to production on Vercel with a full serverless backend.

[![Live Site](https://img.shields.io/badge/Live-bio--two--eta.vercel.app-red)](https://bio-two-eta.vercel.app)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
![Security](https://img.shields.io/badge/Security-AI%20Self--Healing-green)
![PWA](https://img.shields.io/badge/PWA-Installable-blue)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-black)

---

## Table of Contents

- [Live Site](#live-site)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [AI Architecture](#ai-architecture)
- [Database Schema](#database-schema)
- [Email Notifications](#email-notifications)
- [Security](#security)
- [Contact](#contact)

---

## Live Site

| URL | Description |
|-----|-------------|
| [bio-two-eta.vercel.app](https://bio-two-eta.vercel.app) | Main portfolio |
| [bio-two-eta.vercel.app/blog.html](https://bio-two-eta.vercel.app/blog.html) | AI-powered tech blog |

---

## Features

### Design and UX

- n8n-inspired design — floating glassmorphism nav pill, deeply rounded cards, dark canvas with ambient glow orbs and a dot grid overlay
- Dual dark and light mode — dark mode uses a deep `#08080f` canvas, light mode is true white with strong card borders. Saved to localStorage. Mobile visitors default to light mode; desktop follows OS preference
- Dual-row opposing marquee — two rows of icon boxes scrolling in opposite directions with edge fade gradients, featuring 25 technologies across cloud, DevOps, security, and identity
- Hero stat cards — four animated metric cards with red radial glow on hover
- Live workflow node canvas — animated SVG showing Michael's tech pipeline with pulsing nodes and animated edges
- Typed text rotator — cycles through 6 professional roles
- Scroll reveal animations with spring easing
- Staggered card animations — grid children animate in sequence
- Back-to-top button — appears on scroll, turns red, present on both pages

### Phoenix AI Assistant

- Named Phoenix — Michael's personal AI advocate powered by Claude Sonnet
- Clean plain-text output — strips markdown bold, italics, em-dashes, and list markers from all responses
- Confident and direct — answers yes/no immediately, 2 to 4 sentence default, no corporate hedging
- Fully informed — knows Michael's complete 9-role career history, skills, certifications, built projects, and long-term vision
- Quick-chip shortcuts — one-tap questions for Skills, Build Apps, Availability, and Vision
- Secure proxy — API key never exposed to the browser
- Mobile optimised — full-width panel on mobile, 55vh max height, 16px font inputs to prevent iOS zoom

### AI-Powered Tech Blog

- Auto-generates 9 articles daily via Claude AI across 6 categories: AI and ML, Cloud, Security, DevSecOps, Data and Analytics, Tech for Good
- Daily caching — regenerates once per day, cached in localStorage
- Full article on click — Claude writes a focused 350-word article on demand (800 token limit, 20-second timeout)
- No markdown in articles — AI instructed to write plain prose without em-dashes or hyphens as connectors
- AI Daily Digest sidebar refreshed daily
- Category filters with live post count
- Fallback posts — 9 hardcoded seed articles if the AI API is unavailable
- Back-to-top button

### Database (Supabase PostgreSQL)

- Contact submissions — name, email, opportunity type, message, timestamp
- Newsletter subscribers — unique email list with subscription timestamps
- Page views — visit counter per page with first and last visited timestamps
- Blog post views — tracks which articles are read most per post ID and title
- Row Level Security — all tables locked; only the server-side service key can read or write

### Contact and Email

- Contact form — Formspree delivery + Supabase storage + client-side validation
- Email notifications via Resend — contact form triggers a notification to Michael; newsletter subscribe sends a welcome email to the subscriber and a notification to Michael
- Mailto fallback if Formspree is not configured

### PWA

- Installable — "Install Mike's bio" bottom-sheet banner on all devices
- Service Worker — offline caching, cache-first for assets, network-first for HTML
- Web App Manifest — icons, theme colour, display mode

### AI Self-Healing Security

- 10 real-time DOM security checks — HTTPS, CSP, XSS, mixed content, noopener links, localStorage hygiene, form validation, Service Worker, Referrer-Policy, frame-ancestors
- Auto-scans every 60 seconds — security badge updates silently
- AI Heal — sends failures to Claude, receives analysis and fix steps, marks issues healed in the UI with a live colour-coded log

---

## Architecture

```
Browser (index.html / blog.html)
        │
        ├── POST /api/chat ──────────────► Vercel Serverless (api/chat.js)
        │                                        │
        │                                  ANTHROPIC_API_KEY (env var)
        │                                  Forces model: claude-sonnet-4-5
        │                                        │
        │                                  Anthropic Claude API
        │
        ├── POST /api/db?action=contact ──► Vercel Serverless (api/db.js)
        ├── POST /api/db?action=subscribe        │
        ├── POST /api/db?action=pageview         ├── Supabase PostgreSQL
        ├── POST /api/db?action=blogview         │     (SUPABASE_URL + SERVICE_KEY)
        └── GET  /api/db?action=analytics        │
                                                 └── Resend Email API
                                                       (RESEND_API_KEY)

        POST /api/analytics-auth ────────► Vercel Serverless (api/analytics-auth.js)
                                                 ANALYTICS_PASSWORD (env var)
```

---

## Project Structure

```
Bio/
│
├── index.html               # Main portfolio — all sections, Phoenix AI, security scanner
├── blog.html                # AI-powered tech blog with daily content generation
├── analytics.html           # Private analytics dashboard (password-protected)
├── manifest.json            # PWA web app manifest
├── sw.js                    # Service Worker (offline caching)
│
├── api/
│   ├── chat.js              # Anthropic API proxy — key hidden, model forced, CORS open
│   ├── db.js                # Supabase proxy + Resend email notifications
│   └── analytics-auth.js   # Server-side analytics password verification
│
├── database/
│   └── schema.sql           # PostgreSQL schema — 4 tables, RLS, indexes
│
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD — Gitleaks + CodeQL + Vercel smoke test
│
├── vercel.json              # Vercel config — routes, security headers, builds
├── DEPLOY.md                # Step-by-step go-live guide
└── README.md                # This file
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML5, CSS3, JavaScript ES2022+ |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| AI Model | Anthropic Claude `claude-sonnet-4-5` |
| AI Proxy | Vercel Serverless Function (Node.js) |
| Database | Supabase (PostgreSQL + REST API + RLS) |
| Email | Resend API |
| Contact Form | Formspree + Supabase |
| Hosting | Vercel |
| CI/CD | GitHub Actions |
| PWA | Service Worker + Web App Manifest |
| Animations | Pure CSS keyframes + SVG |
| npm dependencies | Zero |

---

## Environment Variables

Set all of these in **Vercel → Settings → Environment Variables**. Never commit them to the repo.

| Variable | Where to Get It | Purpose |
|----------|----------------|---------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) API Keys | Phoenix AI and blog |
| `SUPABASE_URL` | Supabase Dashboard → Project Settings → API | Database |
| `SUPABASE_SERVICE_KEY` | Supabase Dashboard → Project Settings → API → service_role | Database writes |
| `RESEND_API_KEY` | [resend.com](https://resend.com) API Keys (Sending Access) | Email notifications |
| `SITE_URL` | Your Vercel URL e.g. `https://bio-two-eta.vercel.app` | CORS reference |
| `ANALYTICS_PASSWORD` | Any strong password you choose | Analytics dashboard |
| `NOTIFY_EMAIL` | Your notification email (defaults to Gmail in db.js) | Contact and subscribe alerts |

After adding or changing any env var, go to Vercel → Deployments → Redeploy to apply.

---

## Getting Started

### Local Preview

```bash
# Clone the repo
git clone https://github.com/MikeGira/Bio.git
cd Bio

# Option A: VS Code Live Server
# Right-click index.html → Open with Live Server

# Option B: Python
python3 -m http.server 5500

# Option C: Node
npx http-server . -p 5500
```

Phoenix AI, the database, and email features require Vercel serverless functions and will not work in local preview. Deploy to Vercel for full functionality.

---

## Deployment

Vercel hosts both the static pages and the serverless API functions. GitHub Pages does not support serverless functions and is not suitable for this project.

**1. Push to GitHub**
```bash
git add .
git commit -m "Deploy MikeGira.dev"
git push origin main
```

**2. Connect to Vercel**
1. [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select the `Bio` repo → Framework: Other → Deploy

**3. Add environment variables**
Vercel Dashboard → Settings → Environment Variables → add each variable from the table above.

**4. Run the Supabase schema**
Supabase Dashboard → SQL Editor → New Query → paste `database/schema.sql` → Run.
Confirms 4 tables created: `blog_post_views`, `contact_submissions`, `newsletter_subscribers`, `page_views`.

**5. Set up Formspree**
[formspree.io](https://formspree.io) → New Form → copy the ID → update `const FORMSPREE_ID` in `index.html` → push.

**6. Verify Resend sending domain**
Resend Dashboard → Domains → Add Domain → add DNS records at your registrar → Verify.
Until verified, use `onboarding@resend.dev` as the `from` address in `api/db.js` for testing.

**Updating the site:**
```bash
git add .
git commit -m "Your update message"
git push
# Vercel auto-deploys in ~30 seconds
```

---

## CI/CD Pipeline

Defined in `.github/workflows/deploy.yml`. Runs on every push to `main`.

```
Push to main
    │
    ├── 1. Gitleaks — scans full git history for hardcoded secrets
    │         Blocks confirmation if secrets found in source code
    │
    ├── 2. CodeQL — static analysis (SAST) on all JavaScript
    │         Detects injection vulnerabilities and insecure patterns
    │
    └── 3. Smoke test — HTTP GET to live Vercel URL
              Confirms site returns 200 OK after auto-deploy
```

Vercel auto-deploys on every push via its GitHub integration. The CI/CD pipeline adds security gates and confirms the deployment succeeded.

---

## AI Architecture

### Secure API Proxy Flow

```
Visitor browser
      │
      │  POST /api/chat  (no API key visible)
      ▼
Vercel Serverless (api/chat.js)
      │
      │  Reads ANTHROPIC_API_KEY from Vercel env vars
      │  Forces model to claude-sonnet-4-5
      │  POST https://api.anthropic.com/v1/messages
      ▼
Anthropic Claude API
      │
      ▼
Response returned to browser
```

The API key exists only in Vercel's encrypted environment. It is never in any file a visitor can inspect, download, or read from the browser console.

### Phoenix Personality Design

- Answers yes/no questions immediately — answer first, brief context second
- 2 to 4 sentences by default, longer only when explicitly requested
- Plain conversational prose — no markdown, no asterisks, no bullet points
- Strips all markdown from responses before display: bold, italics, em-dashes, list markers, backticks
- Full knowledge of Michael's 9-role career, 5 earned certifications, built projects, and vision
- Directs hiring interest enthusiastically toward the contact form

### Blog AI Generation

- 9 article summaries per day: 1,500 token limit, 25-second timeout, cached in localStorage
- Full article per click: 800 token limit, 20-second timeout, 350-word maximum enforced in prompt
- Instructed to write plain prose without markdown, em-dashes, or hyphen connectors

---

## Database Schema

Four tables in Supabase PostgreSQL, all with Row Level Security enabled. Only the server-side service key can read or write.

```sql
contact_submissions
  id, name, email, opportunity, message, created_at, is_read

newsletter_subscribers
  id, email (unique), subscribed_at, is_active

page_views
  id, page (unique), views, first_visited, last_visited

blog_post_views
  id, post_id (unique), title, category, views, first_viewed, last_viewed
```

---

## Email Notifications

Powered by Resend (free tier: 3,000 emails/month).

| Trigger | Recipient | Content |
|---------|-----------|---------|
| Contact form submitted | Michael (NOTIFY_EMAIL) | Sender name, email, opportunity, full message |
| Newsletter subscribed | Subscriber | Welcome email with blog description |
| Newsletter subscribed | Michael (NOTIFY_EMAIL) | New subscriber email and timestamp |

Sent from `hello@mikegira.dev` after domain verification in Resend. Use `onboarding@resend.dev` for testing before verification.

---

## Security

### Response Headers (via vercel.json)

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera, microphone, geolocation, payment, usb all denied |
| `X-XSS-Protection` | `1; mode=block` |

### Application Security

| Threat | Mitigation |
|--------|-----------|
| XSS | All user input uses `textContent`. AI responses stripped of HTML before display |
| API Key Theft | Key in Vercel env vars only — never in frontend code or git history |
| Clickjacking | `frame-ancestors 'none'` in CSP and `X-Frame-Options: DENY` |
| Oversized requests | 32KB limit on `/api/chat`, 8KB on `/api/db` |
| Model override | `api/chat.js` forces `claude-sonnet-4-5` regardless of client payload |
| Secret leakage | Gitleaks scans every push before deployment confirmation |

### AI Self-Healing Checks (10 total)

HTTPS context · CSP present · X-Content-Type-Options · Referrer-Policy · No sensitive localStorage · No mixed content · External links safe with noopener · Form validation active · Service Worker registered · frame-ancestors in CSP

---

## Contact

| Channel | Details |
|---------|---------|
| Email | [chrismikeparker1@gmail.com](mailto:chrismikeparker1@gmail.com) |
| LinkedIn | [linkedin.com/in/michael-twagirayezu](https://www.linkedin.com/in/michael-twagirayezu/) |
| GitHub | [github.com/MikeGira](https://github.com/MikeGira/) |
| Twitter | [@mikegira_](https://x.com/mikegira_) |
| Phone | +1 (647) 763-0148 |
| Location | Toronto, ON, Canada |

---

## License

Personal portfolio project. Code patterns are shared for reference and learning. All content, branding, and personal information belong to Michael Twagirayezu and may not be reused without permission.

---

*Built with purpose. Powered by passion. Secured by design.*