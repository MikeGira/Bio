# Bio / Portfolio — Compliance Statement

| Field | Value |
|---|---|
| Owner | Michael Twagirayezu (sole proprietor) |
| Product | Bio / Portfolio (`https://bio-two-eta.vercel.app`) |
| Version | 1.0 |
| Effective | 2026-06-09 |
| Next review | 2027-06-09 (or on any change to data flows or subprocessors) |
| Jurisdiction | Ontario, Canada |
| Classification | Internal |

> **Readiness, not certification.** This site is built to the *technical controls* of SOC 2 and ISO 27001, and to GDPR/PIPEDA obligations. A formal certificate/attestation additionally requires written policies, a risk assessment, an evidence window, and an external auditor. We do not claim to be "certified"; we claim to be **built to these controls**.

## 1. Scope of personal data

This is a personal portfolio site. It collects limited personal data through three features:

| Feature | Personal data | Storage |
|---|---|---|
| Contact form | Name, email, message | Supabase `contact_submissions` (+ Formspree fallback); email notification via Resend |
| Newsletter / subscribe | Email | Supabase subscribers; unsubscribe via signed link |
| Phoenix AI assistant | Conversation content the visitor types | Sent to Anthropic via a server-side proxy; not used for any other purpose |
| Analytics | Page/feature events (no raw IP stored client-visible) | Supabase `analytics_events` |

**No payments are taken and no cardholder data is processed** — the site's `Permissions-Policy` explicitly disables `payment=()`. PCI DSS is therefore out of scope.

## 2. Data classification

| Class | Examples | Handling |
|---|---|---|
| **Restricted** | `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `ANALYTICS_PASSWORD` | Vercel env vars only; server-side functions only; never in client code or git. |
| **Confidential (PII)** | Contact name/email/message, subscriber email | Supabase RLS; access via server-side proxy (`api/db.js`) holding the service key; TLS in transit. |
| **Internal** | Analytics events, AI prompt content | No secrets in prompts; analytics carry no directly-identifying PII. |
| **Public** | Site content, this document, `SECURITY.md` | No restrictions. |

## 3. Subprocessors

(ISO A.5.19 · SOC 2 CC9.2 · GDPR Art. 28)

| Vendor | Service | Data processed | Data location | Attestation |
|---|---|---|---|---|
| Vercel | Hosting / CDN / serverless | Request traffic, logs | Global edge (primary US) | SOC 2 Type II |
| Supabase | Postgres / REST / RLS | Contact + subscriber PII, analytics | us-east-1 (AWS, N. Virginia, USA) | SOC 2 Type II |
| Resend | Transactional email | Recipient + notification email, content | US | SOC 2 |
| Anthropic | AI inference (Phoenix assistant) | Visitor conversation content (no secrets/PII by design) | US | SOC 2 Type II |
| Formspree | Contact-form fallback | Name, email, message | US | SOC 2 |
| GitHub | Source control / CI | Code, CI metadata | US | SOC 2, ISO 27001 |

Each is reviewed at least annually and whenever the integration changes.

## 4. Control mapping (selected)

| Area | Control on this site | Framework refs |
|---|---|---|
| MFA | Enabled on **all** production-reaching accounts (GitHub, Vercel, Supabase, Resend, registrar, email) | SOC 2 CC6.1 · ISO A.5.17 |
| Access control | Supabase RLS on all tables; service key server-only; analytics dashboard password-gated and `noindex` | CC6.1–6.3 · A.5.15 |
| AI key isolation | All Claude calls proxied server-side (`api/chat.js`); model forced; key never reaches the client | CC6.1 · A.8.24 |
| Security headers | CSP, HSTS (2y, preload), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy (payment/camera/mic/geo disabled) — set in `vercel.json` | CC6.6 · A.8.23 |
| Encryption | TLS/HSTS in transit; provider-managed encryption at rest | CC6.7 · A.8.24 |
| Secrets | Vercel env vars; gitleaks gate in CI | CC6.1 · A.8.24 |
| Secure SDLC | CI gates (gitleaks + CodeQL) green before Vercel deploy | CC8.1 · A.8.25–8.28 |
| Logging | Server-side function logs; no secrets/PII in logs | CC7.2 · A.8.15 |
| Incident response | See [INCIDENT-RESPONSE.md](./INCIDENT-RESPONSE.md) | CC7.3–7.5 · A.5.24–5.26 |

## 5. Data retention & disposal

| Data | Retention | Basis |
|---|---|---|
| Contact submissions | 24 months, then deleted | Correspondence handling; minimization |
| Subscriber email | Until unsubscribe; then removed | Consent withdrawal |
| Analytics events | 24 months, then deleted | Product insight; minimization |
| AI conversation content | Not retained beyond the request lifecycle by this site | Minimization |
| Server logs | 90 days | Security monitoring vs. minimization balance |

Subjects may request access or erasure via byosekumbuga@gmail.com (GDPR Art. 15/17 · PIPEDA).

## 6. Open items (tracked)

- Publish a short **Privacy notice** (what is collected via the contact form / subscribe / assistant, and the erasure contact) as a linked page — recommended since the site collects email and message content.
