# Development Checkpoints — Session Log

> **Metadata**
>
> - last-updated-by: bootstrap-project
> - last-verified-against-code: 2026-08-05
> - staleness-policy: append-only — never modify past entries

> **Overview:** Append-only running log of development sessions. Each entry records what was completed, what comes next, and which files were modified. Agents write here at the end of every session so work can be resumed without re-reading the entire codebase. This file is the **append-only historical record** — use `checkpoints/in-progress.md` for current in-progress work.

---

## Log Format

```
## Session [number] — [date]

**Completed:**
[What was finished this session]

**Files Modified:**
- [file path] — [what changed]

**Next Task:**
[Exact next step — be specific]

**Assumptions Made:**
[Any assumptions logged per the quality gate]

**Notes / Blockers:**
[Anything the next agent needs to know]
```

---

## Sessions

---

## Session 1 — 2026-08-05

**Completed:**
Installed v2 ai-system framework (from `Sotonye0808/ai-system-template`) and bootstrapped it to the current project state. Replaced the outdated v1 `.ai-system/` directory.

- Copied `ai-system/` kit (protocols, agents, commands, standards, planning, memory, index, testing, checkpoints, summaries)
- Migrated v1 content: system-architecture, project-context, design-system, repair-system, project-plan, task-queue (complexity-tagged), repo-map, dependency-graph, project-decisions, lessons-learned, architecture-history, session-log
- Moved design HTML exports and docs (DESIGN.md, ROADMAP.md, PROMPTS.md, PRD PDF) from `.ai-system/` into `ai-system/designs/` and `ai-system/docs/`
- Updated root `ai-context.md` to the new structure and paths
- Removed the outdated `.ai-system/` directory

**Files Modified:**

- `ai-system/` (entire new v2 framework + migrated content)
- `ai-context.md` (paths and references updated)
- deleted `.ai-system/` (v1, 45 tracked files)

**Next Task:**
Regenerate the Prisma client so new models are typed; then run `npm run lint` + `npm run typecheck` to confirm the repo is green.

**Assumptions Made:**
- Design assets and docs are worth keeping inside the new `ai-system/` structure even though the v2 kit does not define those directories (confirmed with user).
- `start-ai-dev.bat` is tool-specific and retained as-is.

**Notes / Blockers:**
- Prisma client stale relative to `schema.prisma` — new models accessed via `(this.prisma as any)`.
- Next.js SWC lockfile patch warning is environmental and non-blocking.

---

## Session 2 — 2026-08-10

**Completed:**
Executed `dev-cycle.md`. Completed the [M] task "Regenerate Prisma client so new models are typed".

- Fixed `packages/api/prisma/schema.prisma` — added 7 missing opposite-relation fields that blocked `prisma validate`/`generate`:
  - `User.agentActivities`, `User.agentPoints`, `User.blogPosts` (back-relations for AgentActivity, AgentPoints, BlogPost)
  - `Listing.inspections` (back-relation for Inspection)
  - `Transaction.signatureRequests`, `TransactionDocument.signatureRequests` (back-relations for SignatureRequest)
  - `Subscription.plan` + `SubscriptionPlan.subscriptions` (relation was absent despite `include: { plan: true }` usage)
- Regenerated Prisma Client (v5.22.0) — new models (Client, Note, Rating, Inspection, ActivityRule, AgentActivity, AgentPoints, BlogPost) now typed.
- Removed all `(this.prisma as any)` / `db(prisma as any)` casts from services (audit, crm, activity, documents, transactions, notifications, subscriptions, blog, signatures, messaging, alerts). The `db()` helper now returns the typed client.
- Fixed type errors the typed client exposed: JSON fields cast to `Prisma.InputJsonValue`; `Notification` type collisions resolved by importing the Prisma model as `PrismaNotification` in notifications service + gateway; `Subscription.plan.features` cast to `string[]`.

**Files Modified:**

- `packages/api/prisma/schema.prisma` — added missing opposite relations
- `packages/api/src/modules/audit/audit.service.ts` — removed `(this.prisma as any)` casts, typed JSON inputs
- `packages/api/src/modules/{crm,activity,documents,transactions,notifications,subscriptions,blog,signatures,messaging,alerts}/*.service.ts` — `db()` returns typed client
- `packages/api/src/modules/notifications/notifications.gateway.ts` — `Notification` → `PrismaNotification`
- `package-lock.json` — SWC platform binary swap from `npm install` (environmental)

**Next Task:**
Security pass — audit all REST routes for guards, rate limiting, input validation (next incomplete task in queue).

**Assumptions Made:**
- `Subscription.plan` relation was intended (service used `include: { plan: true }` and `plan.features`/`plan.slug`); added it to schema rather than removing the usage.
- The 6 remaining `as any` casts in service files are for Prisma `Json` fields (locationJson, preferences, stepsJson) and are legitimate JSON payload typing, not stale-client workarounds.

**Notes / Blockers:**
- `npm run lint` in `@hw/api` has 94 pre-existing `@typescript-eslint/no-explicit-any` errors (110 before this session). All pre-existing; not introduced by this work. Out of scope — belongs to the upcoming security/testing tasks.
- `packages/types/src/entities/*.d.ts` committed build artifacts regenerate during API builds (they reference `@prisma/client`); reverted as out of scope — flag for `update-ai-system`/gitignore cleanup.
- Prisma schema requires `DATABASE_URL` env for `prisma generate` in CI (e.g. a placeholder connection string works).

---

## Session 3 — 2026-08-10

**Completed:**
Executed `dev-cycle.md`. Completed the [M] task "Security pass — audit all REST routes for guards, rate limiting, input validation", plus the flagged gitignore cleanup. Then ran `update-ai-system.md`.

- **JWT identity bug fixed** — `JwtStrategy.validate()` now returns `{ sub, id, email, role }`. Previously it returned `{ id, ... }` while every controller read `req.user.sub`, so `sub` was `undefined` on all authenticated requests (ownerId writes, actor ids, etc. were silently `undefined`). `req: any` hid it from TS.
- **RBAC** — new `common/decorators/roles.decorator.ts` (`@Roles(...)`), `common/guards/roles.guard.ts` (`RolesGuard`, string role compare). Applied as `@UseGuards(JwtGuard, RolesGuard)` to: listings `admin/pending` + `:id/moderate`, all audit routes, `config` PUT, blog create/update/delete, activity `seed`, transactions `payments/pending`. The old `RbacGuard` (`user.hasPermission()`) was unusable — the JWT user is a plain object, not a `BaseUser`; left in place but superseded by `RolesGuard`.
- **Input validation** — new `common/pipes/zod-validation.pipe.ts` (`ZodValidationPipe`) + zod schemas (`.strict()`, unknown-key rejection) for every DTO across auth, listings, transactions, crm, notifications, blog, documents, signatures, subscriptions, messaging, config, recently-viewed, plus inline bodies (upload-url, media, evidence, webhooks). No new dependencies — used the existing `zod`.
- **Rate limiting** — new `common/rate-limit/` (`RateLimitGuard` in-memory sliding window, `@Throttle` decorator, `RateLimitModule` as global `APP_GUARD`). Default 120 req/min/IP; auth endpoints `@Throttle(AUTH_THROTTLE)` 10 req/min.
- **Unguarded endpoints closed** — `notifications` (added `@UseGuards(JwtGuard)`, removed silent anonymous fallbacks), `platform-config` PUT (JwtGuard + admin), `activity` seed (admin), audit (admin-only), blog mutations (admin-only), transactions `payments/pending` (admin).
- **recently-viewed** — new `OptionalJwtGuard`; server derives `userId` from JWT and ignores client-supplied `userId` (was spoofable). `apps/web/lib/interactions.ts` updated to send the auth token and stop trusting a client `userId`.
- **messaging** — `createConversation` always adds the caller as a participant (deduped).
- **GlobalExceptionFilter** wired globally in `main.ts`.
- **Webhook bodies** (subscriptions `event/data.reference`, signatures `external_id/status`) zod-validated; still unauthenticated by design — HMAC verification flagged as residual risk.
- **gitignore cleanup** — added `packages/types/src/**/*.{js,js.map,d.ts.map,d.ts}` (with `!global.d.ts`) to `.gitignore`; `git rm --cached` 76 generated build artifacts. They regenerate on API builds and reference `@prisma/client`; verified the API build regenerates them and git ignores them, while `global.d.ts` stays tracked.

**Files Modified:**
- `packages/api/src/modules/auth/jwt.strategy.ts` — return `sub` + `id`
- `packages/api/src/common/{decorators/roles.decorator.ts,guards/roles.guard.ts,guards/optional-jwt.guard.ts,pipes/zod-validation.pipe.ts,rate-limit/{throttle.decorator.ts,rate-limit.guard.ts,rate-limit.module.ts}}` — new
- `packages/api/src/app.module.ts` — import `RateLimitModule`
- `packages/api/src/main.ts` — wire `GlobalExceptionFilter`
- All 15 controllers + their DTO files (zod schemas + pipes + guards)
- `packages/api/src/modules/blog/dto/blog-post.dto.ts` — new schemas
- `apps/web/lib/interactions.ts` — auth token for recently-viewed
- `.gitignore` — packages/types generated artifacts
- `ai-system/` docs (task-queue, session-log, dev-history, lessons-learned, project-decisions, repo-map, dependency-graph, system-architecture, in-progress)

**Next Task:**
Testing setup — unit tests for core services, component tests, E2E Playwright journeys (next incomplete [L] task in queue).

**Assumptions Made:**
- Role-string RBAC (not a PlatformConfig permission matrix) is the right level for now; `Permission`-level checks can be layered on later. Logged in `project-decisions.md`.
- Blog mutations restricted to ADMIN/SUPER_ADMIN (public UI only reads posts; no client writes them).
- Webhook endpoints intentionally unauthenticated (third-party callers) — shape-validated now, HMAC verification deferred until provider signing secrets exist.

**Notes / Blockers:**
- Residual security risks (logged in task-queue + system-architecture): webhook HMAC verification needs provider secrets; `JWT_SECRET` must be set in production; rate-limit store is in-memory (per-instance) — swap for Redis-backed store for multi-instance.
- `npm run lint` still fails on pre-existing errors: 94 `no-explicit-any` in `@hw/api` + 74 unused-var/type errors in `@hw/types` (`src/ui/*.ts` global type files). None introduced by this session (verified by scanning changed files).

---

## Session 4 — 2026-08-13

**Completed:**
Executed `resume-session.md` → `execute-feature.md` → `update-ai-system.md`. Completed the [L] "Testing setup" task: eliminated all lint blockers, added API unit tests, web component + lib tests, and Playwright E2E journeys. QA gate fully green.

- **`@hw/api` lint blockers eliminated (104 → 0 errors)** — replaced every `req: any` with typed `AuthenticatedRequest` / `MaybeAuthenticatedRequest` from new `packages/api/src/common/types/request.types.ts` (`JwtUser`, `toActor()` helper, `rawBody?: Buffer`). Typed Prisma `where`/`data` clauses and replaced `(x as any[])` JSON casts with `TransactionStep[]` / `Prisma.InputJsonValue`. Controllers now derive actors via `toActor(req)`.
- **`@hw/types` lint blocker fixed** — package `.eslintrc` already allowed the intentional global-types pattern; added `packages/types/.eslintignore` so ESLint skips the generated `.js`/`.d.ts`/`.map` build artifacts that `tsc`/API builds re-emit into `src/`.
- **Prisma client regenerated** (stale client was surfacing false type errors: missing `ListingCategory`, `InputJsonValue`).
- **API unit tests (8 new files, 93 tests total across 10 specs)** — audit, platform-config, notifications, listing, transactions, crm, blog, auth service specs following the existing `MockFn = ReturnType<typeof vi.fn>` + `prisma as unknown as PrismaService` pattern. Fixed two real service behaviors found while writing tests: `updatePreferences` replaces (not merges) the notifications sub-object; `complete()` requires `currentStep >= steps.length`.
- **Web component tests (6 files)** — hw-card, hw-input (new), hw-badge/hw-button (pre-existing), hero-section + stats-strip (landing). Hero-section mocks `next/navigation` `useRouter`.
- **Web lib tests (7 new files, 94 total across 13 specs)** — listings, crm, blog, subscriptions, referrals, activity, notifications API clients. listings/crm read the token from the zustand `useAuth` store (`useAuth.setState`), others from localStorage `hw-auth`.
- **E2E Playwright journeys (4 new specs, 16 tests)** — `guest` (landing/blog/properties search + public pages), `auth` (email→OTP→profile→agent-ID with stubbed auth API), `agent-dashboard` (seeded session, dashboard, transactions list, modal, auth redirect), `transaction-stepper` (deal overview + advance PUT). API stubbed via `page.route` — the Playwright webServer only boots the web app.
- **QA gate green** — `npm test` 187 passing; `npm run typecheck`, `npm run build`, `npm run lint` all pass across every package. Lint has only the 3 pre-existing `no-console` warnings in `@hw/api`.

**Files Modified:**
- `packages/api/src/common/types/request.types.ts` — new `AuthenticatedRequest`/`MaybeAuthenticatedRequest`/`JwtUser`/`toActor()`
- All controllers in `packages/api/src/modules/*/` — `req: any` → typed request types, `toActor(req)`
- `packages/api/src/modules/{listing,activity,alerts,audit,auth,blog,crm,featured-listings,messaging,documents,signatures,transactions}/*.service.ts` — typed `where`/`data` clauses, JSON casts
- `packages/api/src/modules/{audit,platform-config,notifications,listings,transactions,crm,blog,auth}/*.service.spec.ts` — 8 new test files
- `apps/web/components/ui/hw-card.test.tsx`, `apps/web/components/ui/hw-input.test.tsx` — new
- `apps/web/components/landing/hero-section.test.tsx` — new (mocks next/navigation)
- `apps/web/lib/{listings,crm,blog,subscriptions,referrals,activity,notifications}.test.ts` — 7 new test files
- `apps/web/e2e/{guest,auth,agent-dashboard,transaction-stepper}.spec.ts` — 4 new journey specs
- `packages/types/.eslintignore` — new (skip generated build artifacts)
- `ai-system/` docs (test-plan, test-results, task-queue, session-log, dev-history, lessons-learned, repo-map, dependency-graph, project-plan, in-progress)

**Next Task:**
Either the [M] SEO task (listing `generateMetadata`, sitemap, robots, JSON-LD), the [BUG] blog HTML sanitization, the [M] activity-points service wiring, or the newly added [M] API integration tests / [M] E2E admin journey. Any incomplete [ ] item at the top of `planning/task-queue.md`.

**Assumptions Made:**
- The 3 remaining `no-console` warnings in `@hw/api` are intentional dev/stub OTP logging — left as warnings, not errors.
- E2E journeys stub the API because CI has no Postgres/API process; the Playwright webServer only starts the Next.js dev server. Real-db journeys would need the API + DB booted in the webServer command.
- `packages/types` generated artifacts are safe to ignore for lint; they regenerate identically on every build.

**Notes / Blockers:**
- One E2E test (`transaction detail renders the stepper`) is intermittently flaky under parallel dev-server load: the dashboard layout redirects to `/auth` before zustand rehydrates the seeded session. Self-heals on retry (`retries: 2` in CI); passed 10/10 in isolation. If it becomes frequent, seed the store synchronously or bump the test timeout.
- `npm run typecheck` at the turbo root can cache-hit `@hw/api` — run `packages/api && npm run typecheck` directly to see fresh spec-file errors (the api build compiles specs, so `nest build` is the stricter gate).

---

## Session 5 — 2026-08-13 (template update comparison)

**Completed:**
Ran `pull-template-update.md` (from template v3). Compared the installed `ai-system` against upstream `Sotonye0808/ai-system-template` v3.0.0.

- **Baseline:** `ai-context.md` has no `installed-ai-system-version:` metadata — local file set matches the v2 kit (12 commands, no `skills/` / `tools/` / `design-references/`). Treated as v2.
- **Upstream:** `VERSION` = `3.0.0`; diff v2 (`44643dc`) → v3 (`e19a4b3`): 71 files, +1620 / -29.
- **Classification:** 24 framework files are clean v3 merge candidates (byte-identical to v2 template except `last-verified-against-code` dates); 9 new files/folders to add (`skills/`, `tools/`, `design-references/`, `audit-sources.md`, `visual-review.md`, `generate-design-md.md`, `pull-template-update.md`, `VERSION`, `CHANGELOG.md`); 6 divergent files need human-approved targeted edits (`ai-context.md`, `task-queue.md`, `design-system.md`, `system-architecture.md`, `project-decisions.md`, `test-plan.md`).
- **Proposal:** written to `ai-system-template-v3-update-proposal.md` at repo root. **No local files were modified** (only this session-log append + the new proposal file).

**Files Modified:**
- `ai-system-template-v3-update-proposal.md` — new; the diff-based upgrade proposal (proposal only, not applied)
- `ai-system/checkpoints/session-log.md` — this comparison entry

**Next Task:**
Human reviews `ai-system-template-v3-update-proposal.md`. On approval: back up `ai-system/`, add the new files, apply the 24 clean v3 diffs, make the 6 targeted divergent edits, set `installed-ai-system-version: 3.0.0`, then run `sync-context.md` + `audit-drift.md`.

**Assumptions Made:**
- Local `ai-system` was bootstrapped from template v2 (Session 1 of this log says so); no version was recorded at the time, so the baseline is inferred from the file set.
- `tools/registry.md` seed rows are the template's generic evaluations — re-audit against this project's stack before trusting `adopt` verdicts.
- The project's `ai-system/designs/` (page exports) and the new `design-references/` (external design languages) are separate; both kept.

**Notes / Blockers:**
- Blocking on human decision — command contract explicitly never auto-applies.
