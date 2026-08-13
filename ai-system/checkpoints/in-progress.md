# In-Progress Work

> **Metadata**
>
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-08-13
> - staleness-policy: this file is overwritten every session — always current

> **Overview:** Tracks work that is currently in progress but not yet complete. Written _before_ starting risky multi-step work, cleared on clean completion. This is the first file `resume-session.md` reads on interruption — it is the single source of truth for "what was half-done."

---

## Current State

**Status:** Clear — audit complete, no work in progress.

**Command Being Executed:**
(None — Session 7 completed the Prisma→Drizzle migration + `verify-work.md` web audit rectification. See `ai-system/checkpoints/session-log.md` Session 7.)

**Directive / Task:**
Prisma→Drizzle ORM migration of `packages/api` and the web audit rectification, both closed out green (typecheck/lint/tests/build across `@hw/api` and `@hw/web`).

**Steps Completed:**
1. Ported schema, `DrizzleModule`/`DrizzleService`, all services/DTOs/gateway from Prisma to Drizzle query chains
2. Removed `@prisma/client`/`prisma` deps; deleted `packages/api/prisma/` and `src/prisma/`
3. Generated initial migration `0000_faithful_moira_mactaggert.sql` (offline)
4. Rewrote 10 API specs against the new shared Drizzle mock (`src/test/drizzle.mock.ts`); 93 tests pass
5. Web audit: bento/cards linkable, properties page reads `search`+`category` URL params, footer `next/link`, notification rows clickable, `loading.tsx` added, hero/landing cards use `next/image`
6. Verification: `@hw/web` typecheck/lint/94 tests/build green; `@hw/api` typecheck/lint/93 tests/build green
7. Updated ai-system docs (task-queue, session-log, project-decisions, architecture-history)

**Current Step:**
None — work closed out.

**Files Modified:**
- `packages/api/src/drizzle/`, `packages/api/drizzle/` (new), `packages/api/src/test/drizzle.mock.ts` (new)
- All `packages/api/src/modules/*/` services + DTOs + jwt.strategy + notifications.gateway + app.module
- 10 `*.service.spec.ts` files
- `apps/web/app/(public)/properties/page.tsx`, `apps/web/components/landing/{category-bento,footer,hero-section,property-card}.tsx`
- `apps/web/app/(dashboard)/layout.tsx`, `apps/web/hooks/use-notifications.ts`
- `apps/web/app/(public)/loading.tsx`, `apps/web/app/(dashboard)/loading.tsx` (new)
- `apps/web/next.config.js`

**Checkpoint Context:**
Next dev tasks are at the top of `planning/task-queue.md`: [M] SEO, [BUG] blog HTML sanitization, [M] activity-points service wiring, [M] API integration tests, [M] E2E admin journey. The generated Drizzle migration is unapplied until a live Supabase DB is available (`npm run db:migrate` + `db:seed`).

**Last Tool Output / Error:**
None.

---

## Drift Check

**Last verified against repo:** 2026-08-13
**Any known drift between ai-system docs and actual code:** none from the migration/web audit. `tools/registry.md` seed rows are the template's generic evaluations — re-audit against Homewolves' actual stack (via `audit-sources.md`) before trusting `adopt` verdicts.

---

_This file is overwritten on every new in-progress operation. Clear on clean completion._
