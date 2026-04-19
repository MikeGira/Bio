# MikeGira.dev — Michael Twagirayezu

> **IT Systems Engineer · Multi-Cloud Architect · AI Solutions Innovator · Toronto, ON**

A production-grade Progressive Web App (PWA) serving as Michael Twagirayezu's professional portfolio, tech blog, and networking hub. Built with vanilla HTML/CSS/JS — no frameworks, no build steps, zero dependencies.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
![Security](https://img.shields.io/badge/Security-AI%20Self--Healing-green)
![PWA](https://img.shields.io/badge/PWA-Installable-blue)

---

## 📋 Table of Contents

- [Live Demo](#-live-demo)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [AI Architecture](#-ai-architecture)
- [Security](#-security)
- [Contact](#-contact)

---

## 🌐 Live Demo

| Page | Description |
|------|-------------|
| `/` | Main portfolio — hero, about, skills, experience, impact, contact |
| `/blog.html` | AI-powered tech blog — auto-generates fresh articles daily |

---

## ✨ Features

### 🎨 Design & UX
- **n8n-inspired design** — floating glassmorphism nav, deeply rounded cards (24–32px radius), dark canvas aesthetic
- **Interactive starfield** — 120 particles with mouse parallax and red accent stars
- **Animated moving blobs** — three slow-drifting radial glow blobs in red, gold, and blue
- **Live workflow node canvas** — animated SVG showing Michael's tech pipeline with pulsing nodes and animated edges
- **Scrolling skill marquee** — continuous horizontal strip of technologies
- **Typed text rotator** — cycles through 6 professional roles in the hero
- **Scroll reveal animations** — elements fade and slide in as you scroll
- **Dark / Light mode toggle** — preference persisted in localStorage
- **Fully responsive** — mobile, tablet, and desktop

### 🔥 Phoenix AI Assistant
- **Named Phoenix** — Michael's personal AI advocate, powered by Claude Sonnet
- **Confident & direct** — answers yes/no questions immediately, no corporate hedging
- **Fully informed** — knows Michael's complete career history, skills, certifications, built projects, and vision
- **Quick-chip shortcuts** — one-tap questions for common visitor queries
- **Secure proxy** — API key never exposed to the browser (see [AI Architecture](#-ai-architecture))

### 📝 AI-Powered Tech Blog
- **Auto-generates 9 articles daily** via Claude AI across 6 categories: AI & ML, Cloud Architecture, Cybersecurity, DevSecOps, Data & Analytics, Tech for Good
- **Daily caching** — regenerates once per day, cached in localStorage
- **Full article on click** — Claude writes a complete 500-word article on demand
- **AI Daily Digest** — 2-sentence "Today in Tech" sidebar, refreshed daily
- **Category filters** — filter posts by topic with live count
- **Fallback posts** — 9 hardcoded seed articles if the AI API is unavailable

### 🛡️ AI Self-Healing Security
- **10 real-time security checks** against live DOM state (CSP, HTTPS, XSS, mixed content, noopener, localStorage, etc.)
- **Auto-scan every 60 seconds** — badge updates silently in the background
- **Auto-Heal with AI** — sends failures to Claude, receives technical analysis and remediation, marks issues as healed
- **Animated heal states** — fail → healing → healed with colour-coded badges and a live log

### 📬 Contact Form
- **Formspree integration** — messages delivered directly to Michael's inbox
- **Mailto fallback** — graceful degradation if Formspree isn't configured
- **Client-side validation** — name, email format, required fields

### 📱 PWA
- **Installable** — add to home screen on any device (Android, iOS, desktop)
- **Service Worker** — offline caching, cache-first for assets, network-first for HTML
- **Web App Manifest** — icons, theme colour, shortcuts
- **Install banner** — native prompt with dismiss option

---

## 🗂 Project Structure

```
mikegira/
│
├── index.html          # Main portfolio — all sections, Phoenix AI, security scanner
├── blog.html           # AI-powered tech blog with daily content generation
├── manifest.json       # PWA web app manifest
├── sw.js               # Service Worker (offline caching)
│
├── api/
│   └── chat.js         # 🔐 Vercel serverless proxy — securely calls Anthropic API
│
├── vercel.json         # Vercel deployment config (routes, headers, builds)
├── DEPLOY.md           # Step-by-step go-live guide
└── README.md           # This file
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES2022+) |
| Fonts | Inter + JetBrains Mono via Google Fonts |
| AI | Anthropic Claude Sonnet (`claude-sonnet-4-20250514`) |
| AI Proxy | Vercel Serverless Function (Node.js) |
| Forms | Formspree |
| Hosting | Vercel (recommended) |
| PWA | Service Worker API + Web App Manifest |
| Animations | Pure CSS keyframes + SVG SMIL |
| Dependencies | **Zero** — no npm, no webpack, no React, no build step |

---

## 🚀 Getting Started

### Local Development

No build tools needed:

```bash
# Clone the repo
git clone https://github.com/MikeGira/mikegira.git
cd mikegira

# Option A: VS Code Live Server
# Install "Live Server" extension → right-click index.html → Open with Live Server

# Option B: Python
python3 -m http.server 5500
# Open http://localhost:5500

# Option C: Node
npx http-server . -p 5500
```

> **Note:** Phoenix AI requires the Vercel proxy. For local testing of AI features, deploy to Vercel first or see DEPLOY.md for a local proxy setup.

---

## ☁️ Deployment

**Recommended: Vercel (Free)**

Vercel provides both static hosting and serverless functions — required to securely proxy the Anthropic API key. GitHub Pages alone cannot do this.

### Quick Deploy (15 min)

#### 1. Get Anthropic API Key
- [console.anthropic.com](https://console.anthropic.com) → **API Keys** → **Create Key**
- Add $5 credits under Billing
- Copy the key (`sk-ant-api03-...`)

#### 2. Push to GitHub
```bash
git init
git add .
git commit -m "Initial deploy — MikeGira.dev"
git remote add origin https://github.com/MikeGira/mikegira.git
git push -u origin main
```

#### 3. Deploy on Vercel
1. [vercel.com](https://vercel.com) → Sign up free with GitHub
2. **Add New Project** → Import `mikegira` repo
3. Framework: **Other** → **Deploy**

#### 4. Add API Key (Makes Phoenix Work)
1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Name: `ANTHROPIC_API_KEY` | Value: `sk-ant-api03-...`
3. Select all environments → **Save**
4. **Deployments** → Redeploy

#### 5. Activate the Contact Form (Optional)
1. [formspree.io](https://formspree.io) → New Form → Copy ID
2. In `index.html` find `const FORMSPREE_ID = 'YOUR_FORM_ID'`
3. Replace with your ID → push → auto-deploys

#### Custom Domain
1. Vercel → **Settings** → **Domains** → Add your domain
2. Add DNS records to your registrar
3. HTTPS is automatic ✅

**Updating your site:**
```bash
git add .
git commit -m "Updated content"
git push
# Vercel auto-deploys in ~30 seconds
```

---

## 🤖 AI Architecture

### How Phoenix Works Securely Outside Claude

```
Visitor's browser
      │
      │  POST /api/chat  (no API key in browser)
      ▼
Vercel Serverless  ←  api/chat.js
      │
      │  Reads ANTHROPIC_API_KEY from Vercel env vars (secret)
      │  POST https://api.anthropic.com/v1/messages
      ▼
Anthropic Claude AI
      │
      ▼
Response → visitor ✅
```

Your API key lives only in Vercel's encrypted environment variables — it is never in any file a visitor can read or download.

### Phoenix Personality Design
Phoenix is built to be Michael's strongest advocate:
- Answers yes/no questions **immediately** — leads with the answer, not qualifiers
- Keeps responses to 2–4 sentences unless detail is requested
- Never uses phrases like "based on the information provided" or "it's worth noting"
- Has full knowledge of Michael's 9-role career history, all certifications, built projects, and founding vision
- Enthusiastically encourages genuine interest toward the contact form

---

## 🔒 Security

| Threat | Mitigation |
|--------|-----------|
| XSS | All user input uses `textContent`, never `innerHTML`. AI responses DOM-sanitised |
| API Key Theft | Key stored only in Vercel env vars, never in frontend code |
| Clickjacking | `frame-ancestors 'none'` in CSP + `X-Frame-Options: DENY` |
| MIME Sniffing | `X-Content-Type-Options: nosniff` header |
| Mixed Content | CSP `default-src 'self'` blocks HTTP resources |
| Tab-napping | All `target="_blank"` use `rel="noopener noreferrer"` |
| Referrer Leaking | `Referrer-Policy: strict-origin-when-cross-origin` |

**AI Self-Healing Security Checks (10 total):**
HTTPS context · CSP present · X-Content-Type-Options · Referrer-Policy · No sensitive localStorage data · No mixed content · External links safe · Form validation active · Service Worker active · frame-ancestors in CSP

---

## 📬 Contact

| Channel | Details |
|---------|---------|
| ✉️ Email | [chrismikeparker1@gmail.com](mailto:chrismikeparker1@gmail.com) |
| 💼 LinkedIn | [linkedin.com/in/michael-twagirayezu](https://www.linkedin.com/in/michael-twagirayezu/) |
| 🐙 GitHub | [github.com/MikeGira](https://github.com/MikeGira/) |
| 𝕏 Twitter | [@mikegira_](https://x.com/mikegira_) |
| 📱 Phone | +1 (647) 763-0148 |
| 📍 Location | Toronto, ON, Canada |

---

## 📄 License

Personal portfolio project. Code patterns are shared for reference. All content, branding, and personal information belong to Michael Twagirayezu and may not be reused without permission.

---

*Built with purpose. Powered by passion. Secured by design.*
