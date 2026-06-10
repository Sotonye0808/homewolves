# Project Decisions

> **Overview:** Log of significant architectural, technical, and product decisions made during Homewolves development. Agents consult this before proposing changes to avoid contradicting prior reasoning. Each entry records what was decided, why, and what the alternatives were.

---

## Decision Format

```
## [Decision Title]

**Decision:** [What was decided]
**Date:** [YYYY-MM-DD]
**Made by:** [Developer / AI agent / team]

**Reason:**
[Why this choice was made]

**Alternatives Considered:**
[What else was evaluated and why it was rejected]

**Implications:**
[What this decision affects going forward]
```

---

## Decisions

---

## NestJS over Express/Fastify

**Decision:** Use NestJS as the backend framework.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in ROADMAP.md)

**Reason:**
The domain model is deeply object-oriented (User hierarchy, Transaction state machine, AuditEvent append-only). NestJS provides native OOP support via classes, decorators, and dependency injection that maps directly to the domain model. Express is too unstructured for a system with mandatory cross-cutting concerns (audit logging, RBAC, feature flags) — NestJS guards, interceptors, and decorators handle these declaratively.

**Alternatives Considered:**
- **Express/Fastify:** Would require manual implementation of DI, middleware ordering, and module separation. Prone to inconsistent patterns across the codebase.
- **AdonisJS:** Full-featured but smaller ecosystem and community. Less support for tRPC integration.
- **tRPC standalone server:** Possible but would lack the module/DI ecosystem needed for 14 modules with complex cross-cutting concerns.

**Implications:**
- All backend code follows NestJS conventions (modules, services, controllers, guards, interceptors)
- DI enables easy testing (mock services via providers)
- NestJS's opinionated structure enforces consistency across 14+ modules

---

## tRPC for Internal API, REST for Public

**Decision:** Use tRPC as the primary internal API protocol, REST for public/external endpoints.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in ROADMAP.md)

**Reason:**
tRPC provides end-to-end type safety from the NestJS service layer to the React frontend — no manual API client generation, no runtime validation duplication. REST is retained for public-facing endpoints (webhook callbacks, third-party integrations) where tRPC's TypeScript dependency would be a barrier.

**Alternatives Considered:**
- **GraphQL (Apollo):** Adds complexity (schema definition, resolvers, N+1 problem) without sufficient benefit for a mostly-CRUD application. tRPC is simpler for the same type-safety benefit.
- **REST-only:** Manual type generation or openapi-client generation. Adds maintenance overhead and drift risk.
- **Pure WebSocket (Socket.io) for everything:** Not appropriate for CRUD — query operations benefit from HTTP caching and stateless design.

**Implications:**
- All internal routes defined as tRPC routers in `packages/api/src/modules/*/*.router.ts`
- Public REST endpoints in `packages/api/src/modules/*/*.controller.ts` for webhooks only
- Frontend imports tRPC client types from `packages/api` — never writes manual fetch calls

---

## shadcn/ui Wrapper Pattern (Hw* Components)

**Decision:** Every shadcn/ui primitive must be wrapped in a Homewolves-branded `Hw*` component. Feature code never imports shadcn directly.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in DESIGN.md §3.0)

**Reason:**
Design tokens must be applied consistently across the entire application. With direct shadcn imports in 50+ files, changing a border radius or colour would require touching every file. The wrapper pattern centralises token application, config injection, and fallback handling in one place per primitive.

**Alternatives Considered:**
- **Direct shadcn imports:** Decentralised token application — high maintenance cost for design changes.
- **Custom components from scratch:** Duplicates Radix's accessibility work. Unnecessary effort.
- **Wrapping at the page/feature level:** Inconsistent — each team would apply tokens differently.

**Implications:**
- `apps/web/components/ui/` contains all wrappers — HwButton, HwInput, HwDialog, etc.
- `components/ui/index.ts` is the only import path used in feature code
- Each wrapper accepts `config?: ComponentConfig` prop for admin overrides
- Adding a new shadcn primitive requires creating its Hw* wrapper first

---

## Global TypeScript Types (Zero-Import Pattern)

**Decision:** All shared types, interfaces, and enums are globally available via `packages/types/` with triple-slash references. No import statements needed.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in ROADMAP.md §16)

**Reason:**
With 14+ modules across 3 apps and multiple packages, repeating imports for `Listing`, `UserRole`, `Transaction`, `HwButtonProps`, etc. creates noise and drift risk. The global type pattern eliminates import boilerplate entirely — every file in the monorepo has access to every shared type without any import statement.

**Alternatives Considered:**
- **Normal package imports (`@hw/types`):** Requires every file to import. Refactoring type locations breaks imports across the entire codebase.
- **Inlined types in each module:** Duplication — no single source of truth.
- **Prisma-generated types as canonical:** Tied to database schema — not appropriate for API shapes, UI props, or config interfaces.

**Implications:**
- `packages/types/src/global.d.ts` uses `/// <reference path="..." />` for all type files
- Each app's `tsconfig.json` includes `global.d.ts` in its `include` array
- Types must never be imported — lint rule should enforce this
- Prisma types are implementation detail — not re-exported from types package

---

## PlatformConfig for All Admin-Configurable UI

**Decision:** Every configurable UI element (navigation, filters, amenities, feature flags, notification templates, subscription plans) is stored in the `PlatformConfig` database table and served via `PlatformConfigService` with Redis caching.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in ROADMAP.md)

**Reason:**
The product requirement for admin-controlled UI without code deploys is non-negotiable. Storing config in the database with a Redis cache (5min TTL) provides near-instant propagation while keeping DB read overhead low. Hardcoded fallbacks in `packages/config/src/fallbacks.ts` ensure the app works even when the config service is unreachable.

**Alternatives Considered:**
- **Environment variables:** Cannot be changed without redeploy. No granular per-role config.
- **JSON files in repo:** Requires PR/deploy for every change. No audit trail.
- **Feature flag service (LaunchDarkly):** Adds external dependency, cost, and latency. Overkill for this scale.

**Implications:**
- All UI components check `PlatformConfigService.get('key') ?? FALLBACK_KEY`
- Admin panel includes a Config section for each config domain
- Redis TTL of 5 minutes balances freshness with DB load
- Config updates are recorded as AuditEvents

---

## PostgreSQL FTS Phase 1 → Meilisearch Phase 5

**Decision:** Use PostgreSQL full-text search for MVP. Migrate to Meilisearch in Phase 5.
**Date:** 2026-06-09
**Made by:** Architecture team (recorded in ROADMAP.md)

**Reason:**
Avoiding external search infrastructure during MVP accelerates initial delivery. PostgreSQL FTS (tsvector) handles basic keyword search, filtering, and ranking adequately for a Phase 1 marketplace. Meilisearch will be needed when advanced features (typo tolerance, facets, geo-search) become critical.

**Alternatives Considered:**
- **Meilisearch from day one:** Additional infrastructure, deployment complexity, and cost during MVP.
- **Elasticsearch:** Overkill for current scale — high operational overhead.
- **Algolia:** External dependency with usage-based pricing. Cost grows with data.

**Implications:**
- `search` module uses Prisma raw queries with `tsvector` columns for Phase 1
- Schema includes `SearchVector` update trigger on listings table
- Meilisearch migration planned for Phase 5 with zero-downtime strategy
