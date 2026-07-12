# App Flow — User Journey Map
# Project: /how-i-build — Workflow Showcase Page (Bio Portfolio)
# Date: 2026-07-12

---

## User Types

- Guest visitor (everyone — the page is public and static; no auth exists or is needed)
  - Recruiter / hiring manager (skimmer, usually mobile or quick desktop pass)
  - Engineer / builder (deep reader, arrives from GitHub or a shared link)

## Core Journeys

### Journey 1: Recruiter skim (the 90-second pass)
**Actor**: Hiring manager arriving from Mike's resume or LinkedIn
**Goal**: Decide in under two minutes whether Mike's methodology is credible
**Steps**:
1. Lands on `/how-i-build` (rewrite serves `how-i-build.html`)
2. Hero states in one or two sentences, in Mike's voice, what the page is and why it exists
3. Sticky TOC / anchor nav shows the section list at a glance
4. Skims section headings and the bolded first line of each principle
5. Stops at the case study; reads the Problem and Outcome blocks (the two skimmable anchors)
6. Sees real PR links (#27–#31) as evidence; optionally clicks one out to GitHub

**Success state**: Can name Mike's workflow, stack, and one concrete decision; clicks through to Contact on index or a PR on GitHub
**Failure state**: Page reads generic / AI-flavored → bounces. Mitigation is editorial (voice rule), not technical

---

### Journey 2: Engineer deep-read
**Actor**: Engineer or builder curious about solo AI-assisted workflow
**Goal**: Understand the actual method well enough to evaluate (or borrow) it
**Steps**:
1. Lands from GitHub profile README or a shared link
2. Reads principle sections top to bottom; each has a concrete example, not abstractions
3. Reads the full case study including Decisions & trade-offs and Retrospective (what Mike would do differently)
4. Opens Phoenix and asks a question about the workflow (e.g. "what CI gates does Mike run?")
5. Phoenix answers from the updated system prompt

**Success state**: Leaves with a specific takeaway; possibly stars/follows on GitHub
**Failure state**: Claims without evidence → skepticism. Every claim links to a commit, PR, or live URL

---

### Journey 3: Phoenix interaction on the page
**Actor**: Any visitor
**Goal**: Ask questions about Mike's workflow conversationally
**Steps**:
1. Clicks the Phoenix FAB (rendered by shared `phoenix.js`, identical to index/blog)
2. Types a question; frontend calls `/api/chat` (existing serverless proxy, key hidden, model forced)
3. Phoenix answers, aware of the /how-i-build content via its updated system prompt

**Success state**: Accurate answer about the page's content
**Failure state**: API error → existing widget error message (names the problem, no internal details); page content remains fully readable regardless

---

## Edge Cases & Error States

| Scenario | What happens |
|----------|-------------|
| JavaScript disabled / Phoenix blocked | All content is static HTML — fully readable. Phoenix FAB simply doesn't function; no broken layout |
| `/api/chat` failure or rate limit | Existing widget error handling (shared `phoenix.js` — identical on all three pages) |
| Direct visit to `/how-i-build.html` instead of `/how-i-build` | Both serve the page (rewrite + static file); canonical tag points to `/how-i-build` |
| PR/commit link target changes on GitHub | Links are permalinks to PR numbers in the public repo — stable |
| Mobile viewport | Same responsive breakpoints as index.html; TOC collapses; nav uses existing mobile menu |
| `prefers-reduced-motion` | Any scroll/entrance animation honors it (site convention) |
| Empty state | Not applicable — content is authored, never empty at deploy time |
| Stale content risk (page claims drift from reality) | Content updates are normal commits; case-study facts are dated, so aging is explicit, not misleading |

## Navigation Map

```
/ (index.html — nav gains "How I Build" link)
├── /blog          (nav gains link)
├── /stats         (nav gains link; Ko-fi context)
├── /privacy       (footer link; no Phoenix — unchanged)
├── /analytics     (private admin — unchanged, noindex)
└── /how-i-build   (NEW — rewrite → how-i-build.html)
    ├── #principles (anchor sections, 5–7)
    ├── #case-study (2026-07-12 blog rework)
    └── Phoenix FAB (shared phoenix.js) → /api/chat
```

Cross-links in: index nav + footer, blog nav, GitHub profile README (post-launch), resume/LinkedIn (post-launch).
Cross-links out: GitHub PRs #27–#31, live pages referenced in the case study, /blog, TaskPilot (github.com/MikeGira/taskpilot + taskpilot-umber.vercel.app) as the second production evidence point.
