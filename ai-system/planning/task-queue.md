# Development Task Queue

> **Metadata**
> - last-updated-by: bootstrap-project
> - last-verified-against-code: 2026-08-05
> - staleness-policy: re-verify before each session

> **Overview:** Sprint-level task queue with complexity tagging. Agents execute tasks top to bottom within the current sprint. Each task is sized so it can be completed in a single session. Sprint 1–3 are complete; the current focus is hardening, Backlog items, and the next scheduled phase.

---

## Complexity Tags

Tags help agents self-select whether a task needs the full `execute-feature.md` pipeline or a lighter `dev-cycle.md`:

| Tag | Meaning | Recommended Command |
|-----|---------|-------------------|
| `[XS]` | Trivial — single file, known pattern | dev-cycle.md |
| `[S]` | Small — 1-3 files, well-understood | dev-cycle.md |
| `[M]` | Medium — 3-8 files, some planning needed | dev-cycle.md with plan-feature pre-read |
| `[L]` | Large — feature spanning modules | execute-feature.md |
| `[XL]` | Very large — architecture-affecting | execute-feature.md, requires architect role |
| `[BUG]` | Bug fix | fix-build.md |

---

## Current Sprint

> **Section summary:** Post-MVP hardening and completion of remaining Phase 1 backlog items.

| Size | Task | Status |
|------|------|--------|
| [M] | Regenerate Prisma client so new models (Client, Note, Rating, Inspection, ActivityRule, AgentActivity, AgentPoints, BlogPost) are typed instead of `(this.prisma as any)` | [ ] |
| [M] | Security pass — audit all REST routes for guards, rate limiting, input validation | [ ] |
| [L] | Testing setup — unit tests for core services, component tests, E2E Playwright journeys | [ ] |
| [M] | SEO — `generateMetadata()` on listing pages, sitemap.xml, robots.txt, JSON-LD schema | [ ] |
| [M] | Error handling — verify GlobalExceptionFilter coverage, error boundaries on all pages | [ ] |
| [BUG] | Sanitize blog post HTML rendering (`dangerouslySetInnerHTML`) before production | [ ] |
| [M] | Wire activity points into service-layer hooks for automatic awarding | [ ] |

---

## Up Next

| Size | Task |
|------|------|
| [L] | WhatsApp integration |
| [L] | Analytics engine (agent/listing performance, funnel tracking) |
| [L] | React Native app (Expo) parity — listings + auth screens |
| [M] | PWA offline support (IndexedDB/AsyncStorage fallback) |
| [M] | Push notifications — FCM/APNs |

---

## Backlog

| Size | Task |
|------|------|
| [M] | Referral code system |
| [M] | Referral tracking + commission attribution |
| [L] | Subscription billing — Paystack integration |
| [L] | Featured listing / ad placement system |
| [XL] | AI chatbot / recommendations |
| [M] | E-signature integration |
| [L] | Meilisearch migration (Phase 5) |
| [L] | Multi-region deployment config |

---

## Completed This Sprint

| Task | Completed |
|------|-----------|
| Sprint 1 — Core Marketplace MVP (scaffolding, auth, listings, feed, detail, save/recent) | [x] |
| Sprint 2 — Agent & Communication (CRM, dashboard bento, messaging, notifications) | [x] |
| Sprint 3 — Transactions & Client Portal (deal stepper, payments, activity points, moderation, blog) | [x] |
| Navigation audit + route repairs (landing CTAs, mobile bar, legal pages) | [x] |
| Build repair pass (lint/format fixes, `npm run build` green) | [x] |

---

## Notes

- Prisma client is stale relative to `schema.prisma` — regenerate before any backend schema work.
- Notification dispatch is currently synchronous; BullMQ async queue with retries is planned.
- Next.js SWC lockfile patch warning is environmental/non-blocking.
- Design files in `ai-system/designs/` have names that don't all match the README.md index — see `ai-system/designs/README.md` for the canonical list.
