# Development Task Queue

> **Metadata**
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-08-13
> - last-synced: 2026-08-13 (Session 5 — v2→v3 migration; queue unchanged by the migration)
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
| [M] | Regenerate Prisma client so new models (Client, Note, Rating, Inspection, ActivityRule, AgentActivity, AgentPoints, BlogPost) are typed instead of `(this.prisma as any)` | [x] |
| [M] | Security pass — audit all REST routes for guards, rate limiting, input validation | [x] |
| [L] | Testing setup — unit tests for core services, component tests, E2E Playwright journeys | [x] |
| [M] | SEO — `generateMetadata()` on listing pages, sitemap.xml, robots.txt, JSON-LD schema | [ ] |
| [M] | Error handling — verify GlobalExceptionFilter coverage, error boundaries on all pages | [x] |
| [BUG] | Sanitize blog post HTML rendering (`dangerouslySetInnerHTML`) before production | [ ] |
| [M] | Wire activity points into service-layer hooks for automatic awarding | [ ] |
| [M] | API integration tests — supertest route-level tests (validation, auth guards, 404s) | [ ] |
| [M] | E2E admin journey — approve/reject a listing, review payment evidence | [ ] |

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
| Regenerate Prisma client — new models typed, `(this.prisma as any)` casts removed | [x] |
| Security pass — REST route guards, rate limiting, zod input validation | [x] |
| Testing setup — 187 unit tests (93 API + 94 web), 16 E2E journeys, lint/typecheck/build green | [x] |

---

## Notes

- Prisma client is regenerated (2026-08-10) and in sync with `schema.prisma`. Run `prisma generate` (requires a placeholder `DATABASE_URL`) after any schema change.
- API security hardening landed 2026-08-10: global rate limiting (in-memory sliding window, 120 req/min/IP default, 10 req/min on auth), zod-based validation pipes on all REST DTOs, role-based guards (`@Roles`) on admin/moderation/audit/config routes, JWT identity fix (`req.user.sub` now populated), and `GlobalExceptionFilter` wired globally.
- `packages/types/src` generated build artifacts (`.js`/`.d.ts`/`.map`) are now gitignored — they regenerate during API builds and reference `@prisma/client`. `global.d.ts` is intentionally kept tracked.
- Notification dispatch is currently synchronous; BullMQ async queue with retries is planned.
- Next.js SWC lockfile patch warning is environmental/non-blocking.
- Design files in `ai-system/designs/` have names that don't all match the README.md index — see `ai-system/designs/README.md` for the canonical list.
- **Residual security risks (pre-production):** webhook endpoints (`subscriptions`, `signatures`) have no HMAC/signature verification yet — needs provider signing secrets; JWT secret falls back to `homewolves-dev-secret` when `JWT_SECRET` is unset — must be set in production; rate limiter is in-memory (per-instance) — swap for a Redis-backed store for multi-instance deploys.
- **Testing setup (2026-08-13):** API lint clean (0 errors, 3 `no-console` warnings — intentional dev/stub logging); `@hw/api` and `@hw/web` both pass `tsc --noEmit` and `npm run build`. New specs live next to sources (`*.service.spec.ts`, `*.test.ts(x)`). E2E journeys stub the API via `page.route` because the Playwright webServer only boots the web app (no Postgres/API in CI).
- `packages/types/.eslintignore` ignores the generated `.js`/`.d.ts`/`.map` build artifacts that `tsc`/API builds re-emit into `src/` (they reference `@prisma/client`).
