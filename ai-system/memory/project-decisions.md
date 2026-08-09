# Project Decisions

> **Metadata**
> - last-updated-by: bootstrap-project
> - last-verified-against-code: 2026-08-05
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
- All API contracts are REST controllers with DTOs validated via class-validator
- Clients use typed API client helpers in `apps/web/lib/`

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
