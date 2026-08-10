# Development History

> **Metadata**
>
> - last-updated-by: dev-cycle
> - last-verified-against-code: 2026-08-10
> - staleness-policy: historical entries do not go stale

> **Overview:** Chronological log of completed development work. Each sprint ends with a summary entry. Agents add entries after completing tasks. Useful for understanding what has been built, when decisions were made, and what patterns have emerged.

---

## Entry Format

```
## [Date] — [Sprint or Session Title]

**Summary:**
[2-4 sentence overview of what was accomplished]

**Completed:**
- [task 1]
- [task 2]

**Key Changes:**
- [important architectural or behavioural change]

**Next Sprint Focus:**
[What comes next]
```

---

## History

---

## 2026-06-09 — Project Bootstrap

**Summary:**
Homewolves development begins. The v1 `.ai-system/` documentation structure was fully populated with project-specific content derived from DESIGN.md and ROADMAP.md. Design HTML exports (12 screens) complete. Zero application code.

**Completed:**

- Architecture documented — modular monolith, Turborepo, Next.js + NestJS + PostgreSQL
- Design system documented from DESIGN.md
- Task queue and project plan seeded from ROADMAP §9

**Key Changes:**

- Architectural foundations documented: metadata-driven UI, OOP domain model, audit-by-default, RBAC, Hw* wrapper pattern, global types

**Next Sprint Focus:**
Monorepo scaffolding.

---

## 2026-06-10 — Sprint 1: Core Marketplace MVP

**Summary:**
Complete MVP scaffolding and all core features: Turborepo monorepo, NestJS + Next.js apps, Prisma schema, auth flow, listing CRUD, public feed with infinite scroll, property detail page, recently viewed, and save/favorite system.

**Completed:**

- Turborepo monorepo initialized
- `packages/types/` — global zero-import types
- `apps/web/` — Next.js 14 App Router, design tokens in globals.css
- `packages/api/` — NestJS with PrismaModule, AuditService, PlatformConfigService, RbacGuard
- PlatformConfig metadata-driven system
- Authentication — JWT register/login/verifyOtp/refresh/logout
- Listing CRUD — 5-step form, dashboard, agent listing management
- Public Feed & Search — /properties, filter pills, grid/list/map, infinite scroll
- Property Detail — 11 zones, recently viewed, save toggle

**Key Changes:**

- Global TypeScript zero-import pattern established
- Metadata-driven UI with Redis + fallback chain
- Audit by default on all mutations

**Next Sprint Focus:**
Sprint 2 — Agent CRM, dashboard bento grid, real-time messaging, notifications.

---

## 2026-06-10 — Sprint 2: Agent & Communication

**Summary:**
Built agent CRM backend + frontend, bento grid agent dashboard, real-time messaging with Socket.io, and notification pipeline.

**Completed:**

- CRM module — Client, Note, Rating, Inspection models + CRUD + dashboard stats
- Agent Dashboard — 8-cell bento grid matching agent-dashboard.html
- Real-time Messaging — Socket.io gateway, /messages two-pane layout
- Notification system — NotificationsModule, in-app WebSocket dispatch
- Price Drop & Match Alerts — AlertsModule integrated into ListingService

**Key Changes:**

- Socket.io gateway on /ws namespace shared by messaging and notifications

**Next Sprint Focus:**
Sprint 3 — Transaction deal stepper, payment evidence, activity points, admin moderation, blog.

---

## 2026-06-10 — Sprint 3: Transactions & Client Portal

**Summary:**
Complete client portal and deal lifecycle: transaction stepper, payment evidence with admin review, activity points gamification, admin listing moderation, and CMS-driven blog.

**Completed:**

- Transaction module — 5-step deal lifecycle with role-based transitions
- Payment evidence upload + admin approval workflow
- Activity Points system — 9 rules, tier system, leaderboard
- Admin listing moderation queue
- Blog module — BlogPost model, /blog list + detail magazine layout
- Role-aware dashboard sidebar

**Key Changes:**

- 4 new Prisma models: ActivityRule, AgentActivity, AgentPoints, BlogPost
- 3 new backend modules: TransactionsModule, ActivityModule, BlogModule

**Next Sprint Focus:**
Sprint 3 complete. Proceed to Backlog or Phase 2.

---

## 2026-06-16 — Navigation Audit and Route Repairs

**Summary:**
Audited the web app for dead navigation paths and inert CTAs. Rewired landing interactions to real routes and added missing public routes.

**Completed:**

- Wired landing CTAs and hero search into app routes
- Converted mobile bar to route-based navigation
- Added missing public routes (About, Contact, FAQ, Privacy, Terms)

**Next Sprint Focus:**
Continue audit for placeholder interactions; inline-style cleanup.

---

## 2026-06-16 — Build Repair Pass

**Summary:**
Resolved lint/format issues blocking `npm run build`. Build now completes green.

**Completed:**

- Removed unused footer import
- Replaced empty catch blocks
- Removed console noise from websocket client
- Converted agent listings page off inline styles

**Next Sprint Focus:**
Address SWC lockfile warning or proceed with feature work.

---

## 2026-08-05 — v2 ai-system Migration

**Summary:**
Upgraded the development system from v1 `.ai-system/` to the v2 `ai-system/` framework and bootstrapped it to the current project state.

**Completed:**

- Installed v2 framework (protocols, agents, commands, standards, planning, memory, index, testing, checkpoints, summaries)
- Migrated all project content into the new structure
- Preserved design assets and docs inside `ai-system/designs/` + `ai-system/docs/`
- Updated root `ai-context.md`
- Removed the outdated `.ai-system/` directory

**Key Changes:**

- Vendor-neutral, function-based roles (no tool names)
- Mandatory 9-criterion quality gate
- Interruption-safe checkpoints (`in-progress.md` + `resume-session.md`)
- Freshness metadata on every doc

**Next Sprint Focus:**
Prisma regeneration, security/testing/SEO hardening, and Backlog items (WhatsApp, analytics, Expo parity).

---

## 2026-08-10 — Prisma Client Regeneration

**Summary:**
Regenerated the Prisma Client so the Phase 3 models (Client, Note, Rating, Inspection, ActivityRule, AgentActivity, AgentPoints, BlogPost) are fully typed instead of being accessed through `(this.prisma as any)` casts.

**Completed:**

- Fixed schema: added 7 missing opposite-relation fields (User→agentActivities/agentPoints/blogPosts, Listing→inspections, Transaction→signatureRequests, TransactionDocument→signatureRequests, Subscription↔SubscriptionPlan) that were blocking `prisma validate`
- Regenerated Prisma Client (v5.22.0); new models now typed
- Removed all `(this.prisma as any)` and `db(prisma as any)` casts across 11 services; `db()` helper now returns the typed client
- Fixed type errors surfaced by the typed client (JSON metadata casts, `Notification` type collision in notifications service/gateway, `plan.features` JSON cast)

**Key Changes:**

- `Subscription.plan` relation added to schema — the service already used `include: { plan: true }`, so the relation was intended but missing
- Remaining `as any` casts in services are limited to Prisma `Json` field access (locationJson, preferences, stepsJson) — legitimate JSON payload typing, not stale-client workarounds

**Next Sprint Focus:**
Security pass (REST route guards, rate limiting, input validation), then testing setup.

---

## 2026-08-10 — API Security Pass

**Summary:**
Completed the security pass across all 15 REST controllers: fixed an authentication identity bug, added role-based access control to privileged routes, introduced zod input validation on every DTO, added global rate limiting, and closed unguarded-endpoint gaps.

**Completed:**

- **Identity bug fixed:** `JwtStrategy` returned `{ id, email, role }` but controllers read `req.user.sub` → `sub` was `undefined` on every authenticated request. Strategy now returns `sub` (plus `id` for the notifications controller).
- **RBAC:** New `@Roles(...)` decorator + `RolesGuard` enforced on `listings/admin/pending`, `listings/:id/moderate`, audit (all), config `PUT`, blog mutations, activity `seed`, and transactions `payments/pending`. `platform-config PUT` was previously completely unguarded.
- **Input validation:** New `ZodValidationPipe` + zod schemas for every DTO (auth, listings, transactions, crm, notifications, blog, documents, signatures, subscriptions, messaging, config, recently-viewed) plus inline bodies. Rejects unknown keys (`.strict()`) to prevent mass-assignment. Used the existing `zod` dependency — no new packages.
- **Rate limiting:** Global `RateLimitGuard` (in-memory sliding window, 120 req/min/IP default) registered as `APP_GUARD`; auth endpoints tightened to 10 req/min.
- **Guards added where missing:** `notifications` (was unauthenticated), `platform-config PUT`, `activity seed`, audit role restriction.
- **recently-viewed:** Server now derives `userId` from the JWT (`OptionalJwtGuard`) instead of trusting client-supplied `userId` (was spoofable). Web client updated to send the token.
- **messaging:** `createConversation` now always adds the caller as a participant.
- **GlobalExceptionFilter** wired globally in `main.ts`.
- **Webhook bodies** (subscriptions, signatures) now shape-validated via zod.

**Key Changes:**

- `packages/types/src` generated build artifacts (`.js`/`.d.ts`/`.map`) gitignored + untracked — they regenerate on API builds and reference `@prisma/client`; `global.d.ts` stays tracked.
- `req.user.sub` is now the canonical authenticated-user id across the API.

**Next Sprint Focus:**
Testing setup ([L] task), then SEO, error handling, blog HTML sanitization.
