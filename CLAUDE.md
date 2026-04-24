# MikeGira Portfolio (Bio) — Project CLAUDE.md
# File location: /path/to/Bio/CLAUDE.md
# GitHub repo: https://github.com/MikeGira/Bio
# This is Mike's ONLY fully working, deployed, production project.
# Treat it as the gold standard reference for ALL other projects.

## PROJECT OVERVIEW
A full-stack professional portfolio PWA for Michael Twagirayezu.
- **Live URL**: https://bio-two-eta.vercel.app (or custom domain if configured)
- **GitHub**: https://github.com/MikeGira/Bio
- **Hosting**: Vercel (static frontend + serverless functions)
- **AI Assistant**: Phoenix AI — powered by Claude (claude-sonnet-4-6)

## TECH STACK
| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML5, CSS3, JavaScript ES2022+ (zero npm dependencies) |
| Backend | Vercel Serverless Functions (Node.js, /api/ folder) |
| AI Model | Anthropic Claude claude-sonnet-4-6 |
| AI Proxy | api/chat.js — forces model, hides key, controls CORS |
| Database | Supabase (PostgreSQL + REST API + Row Level Security) |
| Email | Resend API (transactional email) |
| Contact Form | Formspree + Supabase fallback |
| Hosting | Vercel Free Hobby plan |
| CI/CD | GitHub Actions (Gitleaks + CodeQL + Vercel smoke test) |
| PWA | Service Worker + Web App Manifest |
| Secrets | Vercel Environment Variables (never in code) |

## FILE STRUCTURE
```
Bio/
├── index.html               # Main PWA — all UI and frontend logic
├── blog.html                # Blog page
├── analytics.html           # Analytics dashboard (password protected)
├── manifest.json            # PWA installability
├── sw.js                    # Service Worker (offline caching)
├── api/
│   ├── chat.js              # Anthropic API proxy — model forced, key hidden
│   ├── db.js                # Supabase proxy + Resend email
│   ├── analytics-auth.js    # Server-side analytics password verification
│   └── send-digest.js       # Email digest sender (cron/manual trigger)
├── schema.sql               # PostgreSQL schema — RLS, indexes
├── .github/workflows/
│   └── deploy.yml           # CI/CD: Gitleaks + CodeQL + Vercel smoke test
├── vercel.json              # Vercel config — routes, security headers
├── DEPLOY.md                # Step-by-step deployment guide
└── README.md
```

## ENVIRONMENT VARIABLES (all in Vercel Dashboard — never commit)
| Variable | Purpose |
|----------|---------|
| ANTHROPIC_API_KEY | Claude API — Phoenix AI assistant |
| SUPABASE_URL | Supabase project URL |
| SUPABASE_SERVICE_KEY | Supabase service role key (server-side only) |
| RESEND_API_KEY | Resend email API (Sending Access only) |
| SITE_URL | Vercel deployment URL (for CORS) |
| ANALYTICS_PASSWORD | Password for analytics dashboard |
| NOTIFY_EMAIL | Where contact/subscribe emails are sent |

After adding/changing any env var: Vercel → Deployments → Redeploy

## WHY THIS IS THE GOLD STANDARD
- Zero npm dependencies — nothing to break, nothing to audit
- Serverless functions = no server to crash or maintain
- Vercel handles HTTPS, CDN, scaling automatically
- Supabase RLS = database-level security (not just app-level)
- Gitleaks in CI/CD blocks secret commits before they reach GitHub
- All secrets in Vercel dashboard — never in code, never in git history
- GitHub import → Vercel auto-deploy: push to main = live in 60 seconds

## PROVEN PATTERNS — USE THESE IN NEW PROJECTS

### Serverless Proxy Pattern (protects API keys)
The `api/chat.js` file is the key pattern. Frontend never has the API key.
All Claude calls go: Frontend → Vercel Function → Anthropic API → back.
The function forces the model (`claude-sonnet-4-6`), validates input, controls CORS, and hides the key.
Copy this pattern for ANY project that needs to call an external API securely.

### Supabase + RLS Pattern
Supabase Row Level Security means even if someone gets the anon key,
they can only see rows they're allowed to see. The schema.sql has the RLS policies.
Copy this for any project using Supabase.

### Vercel CI/CD Pattern
The deploy.yml runs Gitleaks (secret scanning) and CodeQL (code security analysis)
before every deploy. If a secret is accidentally in the code, the deploy is blocked.
Copy this workflow to every new project that deploys to Vercel.

### Zero-Dependency Pattern
The portfolio has zero npm dependencies. Everything is vanilla JS, CSS, HTML.
This means: no supply chain attacks, no broken installs, no node_modules to manage.
For frontend-heavy projects, try to maintain zero dependencies before adding any.

## LOCAL DEVELOPMENT
```bash
git clone https://github.com/MikeGira/Bio.git
cd Bio
# Option A: VS Code Live Server (right-click index.html)
# Option B: python3 -m http.server 5500

# NOTE: Phoenix AI, database, and email require Vercel serverless functions.
# They will NOT work in local preview — deploy to Vercel for full functionality.
# For local API testing, use: vercel dev (requires Vercel CLI)
```

## DEPLOYMENT
```bash
# Auto-deploy: push to main branch → Vercel deploys automatically
git add . && git commit -m "feat: description" && git push

# Manual deploy:
vercel --prod

# Check deployment status:
# Vercel Dashboard → your project → Deployments tab
```

## UPDATING CONTENT
When adding new skills, projects, or experience to the portfolio:
1. Edit the relevant section in index.html
2. Update the Phoenix AI system prompt in api/chat.js so it knows about the new content
3. Commit and push — Vercel auto-deploys
4. Verify the live URL shows the changes (~60 seconds after push)

## SUPABASE SCHEMA (4 tables)
- contact_submissions — contact form entries
- subscribers — newsletter/update subscribers
- analytics_events — page/feature usage tracking
- (check schema.sql for the 4th table and full RLS policies)

## WHY VERCEL + SUPABASE > REPLIT + FIREBASE (for this type of project)
- Vercel: zero config, auto HTTPS, auto CDN, env vars built in, instant deploy from GitHub
- Supabase: PostgreSQL (real SQL, not NoSQL), RLS built in, generous free tier, easy dashboard
- No server process to crash, restart, or babysit
- No exposeLocalhost hacks needed
- Works on iPhone and Android out of the box
- Free tier is genuinely production-capable for personal/small projects
