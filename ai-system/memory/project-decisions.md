# Project Decisions

> **Metadata**
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-08-10
> - staleness-policy: each entry has its own staleness — check supersedes links

> **Overview:** Log of significant architectural, technical, and product decisions. Agents consult this before proposing changes to avoid contradicting prior reasoning. Uses supersedes/superseded-by links so contradictory entries are explicitly resolved rather than both appearing equally valid.

---

## Decision Format

```
## [Decision Title]

**Decision:** [What was decided]
**Date:** [YYYY-MM-DD]
**Made by:** [Role / Agent / Developer]
**Supersedes:** [link to any prior decision this replaces, or None]
**Superseded by:** [link to any newer decision that replaces this, or None]

**Reason:**
[Why this choice was made]

**Alternatives Considered:**
[What else was evaluated and why it was rejected]

**Implications:**
[What this decision affects going forward]
```

---

## Decisions

## NestJS over Express/Fastify

**Decision:** Use NestJS as the backend framework.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in ROADMAP.md)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The domain model is deeply object-oriented (User hierarchy, Transaction state machine, AuditEvent append-only). NestJS provides native OOP support via classes, decorators, and dependency injection that maps directly to the domain model. Express is too unstructured for a system with mandatory cross-cutting concerns (audit logging, RBAC, feature flags) — NestJS guards, interceptors, and decorators handle these declaratively.

**Alternatives Considered:**
- **Express/Fastify:** Would require manual implementation of DI, middleware ordering, and module separation. Prone to inconsistent patterns.
- **AdonisJS:** Full-featured but smaller ecosystem and community. Less support for tRPC integration.
- **tRPC standalone server:** Possible but would lack the module/DI ecosystem needed for 16 modules with complex cross-cutting concerns.

**Implications:**
- All backend code follows NestJS conventions (modules, services, controllers, guards, interceptors)
- DI enables easy testing (mock services via providers)

---

## REST as Primary API Protocol

**Decision:** Use REST as the primary API protocol for public and internal endpoints.
**Date:** 2026-08-05
**Made by:** Implementation (v2 bootstrap)
**Supersedes:** tRPC-for-internal-API decision (original architecture planned tRPC routers)
**Superseded by:** None

**Reason:**
The implemented codebase uses NestJS REST controllers exclusively (no tRPC routers exist in `packages/api/src`). Clients (web + mobile) consume the REST API directly. Documenting REST as canonical matches the actual codebase and avoids drift between docs and reality.

**Alternatives Considered:**
- **tRPC:** Not implemented in the codebase; would require a retrofit.
- **GraphQL:** Adds complexity without sufficient benefit for a mostly-CRUD application.

**Implications:**
- All API contracts are REST controllers with DTOs validated via zod schemas + `ZodValidationPipe` (as of 2026-08-10 security pass; previously there was no runtime validation).

---

## Zod Schemas + ZodValidationPipe for Input Validation

**Decision:** Validate all REST request bodies with zod schemas through a shared `ZodValidationPipe`, using `.strict()` to reject unknown keys.
**Date:** 2026-08-10
**Made by:** Implementer (dev-cycle, security pass)
**Supersedes:** The (previously aspirational) "DTOs validated via class-validator" note in the REST-as-primary decision — class-validator was never installed; validation is implemented with zod.
**Superseded by:** None

**Reason:**
The API had no runtime input validation; DTO classes were unvalidated and several controllers accepted `@Body() dto: any`. `zod` was already a dependency, avoiding new packages. `.strict()` blocks mass-assignment (unknown keys never reach Prisma `data`). The pipe is applied per-route so existing non-decorated DTO classes needed no structural change.

**Alternatives Considered:**
- **class-validator + global ValidationPipe:** NestJS-idiomatic but requires adding dependencies and decorating every DTO class.
- **Manual guards/checks in each controller:** Duplicated, easy to skip.

**Implications:**
- New DTOs must export a zod schema (`*.schema`) + `z.infer` type, applied via `@Body(new ZodValidationPipe(schema))`.
- Mutation schemas use `.strict()`; numeric fields use `z.coerce.number()` to tolerate numeric-string input.
- Validation failures return `400` with `code: VALIDATION_ERROR` (handled by the now-global `GlobalExceptionFilter`).

---

## Role-Based Guards for Admin/Moderation Routes

**Decision:** Protect privileged routes with a `@Roles(...)` decorator + `RolesGuard` (checks `user.role` against allowed roles), composed as `@UseGuards(JwtGuard, RolesGuard)`.
**Date:** 2026-08-10
**Made by:** Implementer (dev-cycle, security pass)
**Supersedes:** The original `RbacGuard` design which called `user.hasPermission()` — the JWT strategy returns a plain `{ sub, id, email, role }` object, not a `BaseUser` instance, so permission-method checks were unimplementable without building a full role→permission matrix service.
**Superseded by:** None (may be layered onto a PlatformConfig permission matrix later)

**Reason:**
`req.user` is a plain object; role-string comparison is simple, correct for the current hierarchy, and the same check the services already perform (`role === 'ADMIN'`). Guard order in the array ensures JWT runs first and populates `req.user` before roles are checked.

**Implications:**
- Privileged routes: listings `admin/pending` + `moderate`, audit (all), config `PUT`, blog mutations, activity `seed`, transactions `payments/pending` → `@Roles('ADMIN', 'SUPER_ADMIN')`.
- Roles are compared as strings (role is a plain string from the DB via the strategy).

---

## Global In-Memory Rate Limiting

**Decision:** Register a `RateLimitGuard` as a global `APP_GUARD` (120 req/min/IP default; auth endpoints 10 req/min via `@Throttle`), using an in-memory sliding-window store.
**Date:** 2026-08-10
**Made by:** Implementer (dev-cycle, security pass)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The API had no rate limiting. No throttler dependency existed; a self-contained guard avoided adding `@nestjs/throttler`. The store is isolated behind the guard interface so a Redis-backed store (ioredis is already a dependency) can replace it for multi-instance production.

**Alternatives Considered:**
- **`@nestjs/throttler`:** Standard, but a new dependency; in-memory store only anyway.
- **Redis-backed from the start:** Better for multi-instance but adds operational coupling before the API is deployed at scale.

**Implications:**
- 429 responses return `{ code: 'RATE_LIMITED', message: ... }`.
- For multi-instance deployments, replace the in-memory store with Redis before relying on the limit in production.

---

## shadcn/ui Wrapper Pattern (Hw* Components)

**Decision:** Every shadcn/ui primitive must be wrapped in a Homewolves-branded `Hw*` component. Feature code never imports shadcn directly.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in DESIGN.md §3.0)
**Supersedes:** None
**Superseded by:** None

**Reason:**
Design tokens must be applied consistently across the entire application. With direct shadcn imports in 50+ files, changing a border radius or colour would require touching every file. The wrapper pattern centralises token application, config injection, and fallback handling in one place per primitive.

**Alternatives Considered:**
- **Direct shadcn imports:** Decentralised token application — high maintenance cost.
- **Custom components from scratch:** Duplicates Radix's accessibility work.
- **Wrapping at the page/feature level:** Inconsistent — each team would apply tokens differently.

**Implications:**
- `apps/web/components/ui/` contains all wrappers — HwButton, HwInput, HwDialog, etc.
- `components/ui/index.ts` is the only import path used in feature code
- Adding a new shadcn primitive requires creating its Hw* wrapper first

---

## Global TypeScript Types (Zero-Import Pattern)

**Decision:** All shared types, interfaces, and enums are globally available via `packages/types/` with triple-slash references. No import statements needed.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in ROADMAP.md §16)
**Supersedes:** None
**Superseded by:** None

**Reason:**
With 16+ modules across multiple apps and packages, repeating imports for `Listing`, `UserRole`, `Transaction`, `HwButtonProps`, etc. creates noise and drift risk. The global type pattern eliminates import boilerplate entirely.

**Alternatives Considered:**
- **Normal package imports (`@hw/types`):** Requires every file to import; refactoring breaks imports.
- **Inlined types in each module:** Duplication — no single source of truth.
- **Prisma-generated types as canonical:** Tied to database schema — not appropriate for API shapes or UI props.

**Implications:**
- `packages/types/src/global.d.ts` uses `/// <reference path="..." />` for all type files
- Types must never be imported — lint rule should enforce this

---

## PlatformConfig for All Admin-Configurable UI

**Decision:** Every configurable UI element (navigation, filters, amenities, feature flags, notification templates, subscription plans) is stored in the `PlatformConfig` database table and served via `PlatformConfigService` with Redis caching.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in ROADMAP.md)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The product requirement for admin-controlled UI without code deploys is non-negotiable. Storing config in the database with a Redis cache (5min TTL) provides near-instant propagation while keeping DB read overhead low. Hardcoded fallbacks in `packages/config/src/fallbacks.ts` ensure the app works even when the config service is unreachable.

**Alternatives Considered:**
- **Environment variables:** Cannot be changed without redeploy. No granular per-role config.
- **JSON files in repo:** Requires PR/deploy for every change. No audit trail.
- **Feature flag service (LaunchDarkly):** Adds external dependency, cost, and latency.

**Implications:**
- All UI components check `PlatformConfigService.get('key') ?? FALLBACK_KEY`
- Admin panel includes a Config section for each config domain
- Config updates are recorded as AuditEvents

---

## Subscription ↔ SubscriptionPlan Prisma Relation (added 2026-08-10)

**Decision:** Add the missing `Subscription.plan` relation (`SubscriptionPlan.subscriptions` back-relation) to `packages/api/prisma/schema.prisma`.
**Date:** 2026-08-10
**Made by:** Implementer (dev-cycle, Prisma client regeneration task)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The `Subscription` model had a `planId` column but no relation field. The `SubscriptionsService` already used `include: { plan: true }`, `sub.plan?.features`, and `sub.plan?.slug` — the relation was intended but missing from the schema. It was previously invisible because the stale Prisma client accessed everything through `(this.prisma as any)`. Regenerating the typed client surfaced it as a compile error. The relation was added to match existing code rather than removing the usage.

**Alternatives Considered:**
- **Remove `include: { plan: true }` usage:** Would have lost plan data the frontend expects; the relation is clearly intended.

**Implications:**
- Schema now requires `prisma generate` (needs placeholder `DATABASE_URL` in CI).
- No DB migration exists yet in the repo (`prisma/migrations/` not present) — schema is applied via seed/db push in the current workflow.

---

## PostgreSQL FTS Phase 1 → Meilisearch Phase 5

**Decision:** Use PostgreSQL full-text search for MVP. Migrate to Meilisearch in Phase 5.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in ROADMAP.md)
**Supersedes:** None
**Superseded by:** None

**Reason:**
Avoiding external search infrastructure during MVP accelerates initial delivery. PostgreSQL FTS (tsvector) handles basic keyword search, filtering, and ranking adequately for a Phase 1 marketplace.

**Alternatives Considered:**
- **Meilisearch from day one:** Additional infrastructure and cost during MVP.
- **Elasticsearch:** Overkill for current scale.
- **Algolia:** External dependency with usage-based pricing.

**Implications:**
- Search uses PostgreSQL FTS for Phase 1
- Meilisearch migration planned for Phase 5

---

## update-ai-system.md triggers: conditional, not unconditional

**Decision:** `update-ai-system.md` fires only on the conditional triggers defined in each command's `Chains to` row (architecture-affecting work in `execute-feature.md`, an emptied sprint table in `dev-cycle.md`, always in `refactor-codebase.md`, major drift in `resume-session.md`, and always in `cloud-session.md`) — not after every task unconditionally.
**Date:** 2026-08-13
**Made by:** v3 upgrade (opencode session)
**Supersedes:** None
**Superseded by:** None

**Reason:**
The v3 spec (§10.3) explicitly flagged this as a judgment call. `update-ai-system.md` is the *heavier* sibling of `sync-context.md` by v2's own design; running the full deep sync after every trivial `[XS]`/`[S]` task would burn tokens on work that only `sync-context.md`'s lightweight check needs. The conditional set is the point where skipping the deep sync is actually risky.

**Alternatives Considered:**
- Unconditional invocation on the four named commands — rejected: predicts many trivial-task deep syncs per day, violating the token/context-economy goal (§12). It remains a one-line override per command if the operator prefers it.

**Implications:**
- Five commands now carry mandatory `Chains to` triggers that invoke `update-ai-system.md` automatically under their conditions — its own `Does NOT` contract is worded accordingly (invoked explicitly or via a command's mandated chain trigger, never on a schedule).
- `verification-rules.md` and `audit-drift.md` check chain order mechanically from `session-log.md`, so a skipped trigger is caught, not trusted.
