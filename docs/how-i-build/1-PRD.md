# PRD — Product Requirements Document
# Project: /how-i-build — Workflow Showcase Page (Bio Portfolio)
# Date: 2026-07-12
# Status: APPROVED (Mike, 2026-07-12)

---

## Problem Statement

Mike's portfolio proves *what* he built (live projects, stats page, Phoenix AI) but not *how* he builds — the workflow, the stack decisions, and the judgment behind them. In 2026 hiring, that "how" is the strongest differentiator: hiring managers explicitly evaluate whether a candidate who uses AI reviewed, tested, and understood the output rather than shipping it unread, and original case-study content in the builder's own voice consistently outranks project lists as a portfolio signal. Meanwhile AI-generated portfolio copy has become a recognized *negative* signal ("polished but generic"). There is currently no page where a recruiter or engineering manager can see Mike's actual methodology demonstrated with real, verifiable evidence.

## Target Users

- Primary: Hiring managers and technical recruiters evaluating Mike for IT support / AI solutions roles, arriving from his resume, LinkedIn, or GitHub profile. They skim; they might deep-read one section.
- Secondary: Engineers and builders curious about solo AI-assisted development workflows (the audience howborisusesclaudecode.com serves); potential collaborators or clients.

## Goals

- Ship a `/how-i-build` page on the existing Bio site that a hiring manager can skim in 90 seconds and come away able to name Mike's workflow, stack, and one concrete engineering decision he made.
- Every claim on the page is specific and verifiable: real commits, real PR numbers, real bugs, real trade-offs — no "leveraging cutting-edge technologies" filler.
- 100% of the prose originates from Mike (interview-sourced); Claude's role is editing for structure and typos only. The page should read like Mike explaining his work to a colleague.
- The page itself demonstrates the methodology it describes: zero npm dependencies, security headers, dark mode, fast load, Phoenix live on the page.

## Non-Goals

- NOT a standalone domain/site (howmikebuilds.com) — v1 lives on Bio where the infrastructure and traffic already exist. Revisit only if the page proves out.
- NOT a CMS or database-backed content system — content is hand-written HTML, updated by editing the page.
- NOT live GitHub stats / dynamic data in v1 (post-MVP candidate).
- NOT generic Claude Code product tips ("use /plan mode", "try worktrees") — that content already exists at howborisusesclaudecode.com and the docs, and says nothing about Mike. The page DOES copy Boris's proven format (scannable sections, self-contained units, every claim linked to its source — his tweets, our PRs/commits); the subject is Mike's workflow and decisions, not the tool's features. Visually it follows Bio's design system, not Boris's site, because it must read as part of Bio.
- NOT AI-generated marketing copy. If a section can't be sourced from Mike's own words, it doesn't ship.

## Core Features (MVP)

| Priority | Feature | User Story |
|----------|---------|------------|
| P0 | Workflow principles in scannable sections (5–7 sections: e.g. research-first, pre-build docs, security as constraint, CI gates, memory/session patterns, verify-before-done). The stack section covers a real trade-off from Mike's own history: zero-dependency vanilla JS for Bio vs. Next.js/TypeScript for TaskPilot (github.com/MikeGira/taskpilot, live at taskpilot-umber.vercel.app), and why each fits its problem | As a hiring manager, I want to skim named sections so that I can grasp Mike's methodology in under two minutes |
| P0 | One deep case study: the 2026-07-12 blog-rework session (AI-generated posts → curated RSS feed, the security-header regression catch, the SITE_URL origin-check bug), structured Problem → Constraints → Decisions & trade-offs → Outcome → Retrospective, with links to the real PRs (#27–#31) | As an engineering evaluator, I want one worked example with real evidence so that I can judge Mike's actual engineering judgment |
| P0 | Copy sourced by structured interview with Mike; Claude edits structure/typos only | As Mike, I want the page in my authentic voice so that it reads as a genuine signal, not AI sameness |
| P0 | Design/infra parity with the rest of Bio: same nav + footer, same visual language, dark mode, security headers via vercel.json, `/how-i-build` rewrite, zero dependencies | As a visitor, I want the page to feel like part of the same product so that the portfolio reads as one coherent system |
| P1 | Phoenix AI widget on the page via the new shared `phoenix.js`, with the system prompt updated so Phoenix can discuss the page | As a visitor reading about how Mike builds with AI, I want to talk to the AI he built so that the page proves its own claim |
| P1 | Sticky table of contents / anchor navigation for skimmability | As a skimming recruiter, I want to jump straight to the section I care about |
| P2 | Page-view tracking through the existing analytics pipeline (no schema change) | As Mike, I want to know whether recruiters actually visit the page |

## Pre-work (separate PR, ships first)

Extract the Phoenix widget (CSS + markup + JS, currently copy-pasted between `index.html` and `blog.html`) into a shared `phoenix.js`. Migrate both existing pages, verify zero behavior/visual change, then build `/how-i-build` as the third consumer. This removes the drift risk instead of tripling it.

## Post-MVP Features

- Live GitHub activity element (commit counts via cached serverless function).
- Additional dated case studies over time (dev-journal growth path — the hybrid format supports appending).
- Cross-links from resume PDF and LinkedIn featured section.
- OG image tailored to the page for link sharing.

## Success Metrics

- Page live at `/how-i-build` with CI green (Gitleaks + CodeQL) and all security headers present.
- Mike signs off that every sentence sounds like him ("would I say this out loud to a colleague?").
- Every technical claim on the page links to verifiable evidence (commit, PR, or live URL).
- Phoenix answers questions about the page accurately after the system-prompt update.
- Analytics shows page views arriving within the first month of adding the link to resume/LinkedIn.

## Content Sourcing Plan (the interview)

After doc approval, Claude interviews Mike in-session. Question areas (Mike answers rough and unpolished; editing preserves his phrasing):

1. Origin: why do you work this way? What broke before you adopted research-first / pre-build docs?
2. Stack: why Vercel + Supabase + zero npm dependencies for Bio, but Next.js + TypeScript for TaskPilot? In your own words, when does each approach win? What did Replit/Firebase teach you?
3. Security: why is it a constraint on every line rather than a final step? A concrete moment that convinced you.
4. Working with Claude: what does a real session look like? What do you never let the AI decide alone?
5. The 2026-07-12 session, step by step: what was wrong with the AI-generated blog, how the curated-feed decision was made, how the security-header regression and the SITE_URL bug were found, what you'd do differently.
6. Lessons: the mistake that taught you the most; what you'd tell someone starting solo with AI today.

## Open Questions

- Section list final wording — settled during the interview, not before.
- Whether the page title is "How I Build" or something in Mike's phrasing — Mike decides at interview time.
