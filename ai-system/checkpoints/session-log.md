# Development Checkpoints — Session Log

> **Metadata**
>
> - last-updated-by: bootstrap-project
> - last-verified-against-code: 2026-08-13
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

---

## Session 6 — 2026-08-13 (v2→v3 migration applied)

**Completed:**
Human approved `ai-system-template-v3-update-proposal.md` (Session 5). Executed the migration from template v3.0.0 (upstream HEAD `1966ff7`, one commit past the proposal's diff baseline `e19a4b3` — only refines the `update-ai-system.md` contract wording + adds a decision entry; picked up as part of the migration).

- **Backed up** pre-migration `ai-system/` + `ai-context.md` to `/tmp/opencode/v2-backup/`; git history (pre-migration commit) also preserves v2.
- **Added new files** verbatim from the template: `ai-system/skills/` (9 skills), `ai-system/tools/` (registry.md + 12 integrations), `ai-system/design-references/`, `ai-system/commands/{audit-sources,visual-review,generate-design-md,pull-template-update}.md`, root `VERSION` (3.0.0) + `CHANGELOG.md`.
- **Applied v3 to 18 merge-clean files** (agents/tester-qa, 13 commands, 4 protocols, engineering-principles) — local was byte-identical to v2 template except metadata dates, so v3 template content applies cleanly; verified post-copy: framework dirs match template v3 except the deliberately-unchanged `agents/{architect,historian,implementer,planner,reviewer}.md` and `protocols/escalation-rules.md` (date-only diffs, preserved as-is).
- **Targeted edits to divergent files** (project content preserved):
  - `ai-context.md` — metadata `installed-ai-system-version: 3.0.0` + skill/tool pointer rows
  - `planning/task-queue.md` — `last-synced` marker (2026-08-13, Session 5)
  - `design-system.md` — Reference Library + Design Asset Viewer sections
  - `system-architecture.md` — Verification CLI, Rollback & Undo, `ENABLE_DESIGN_VIEWER` config row
  - `memory/project-decisions.md` — appended the v3 `update-ai-system.md triggers: conditional` decision (PDF-extraction decision skipped — viewer not built)
  - `testing/test-plan.md` — §19 proportionality note in Overview
- **Freshness metadata** stamped `last-verified-against-code: 2026-08-13` on all changed/new files (only `commands/bootstrap-project.md` retains its intentional `(set on completion)` placeholder).
- **Verification (audit-drift):** all 16 commands declare `Chains to` rows; chain-order/coupling checks pass for this session (in-progress write + this log entry cover the `task-queue.md` `last-synced` mutation); framework files confirm date-only diffs vs template v3.

**Files Modified:**
- New: `ai-system/skills/**`, `ai-system/tools/**`, `ai-system/design-references/**`, `ai-system/commands/{audit-sources,visual-review,generate-design-md,pull-template-update}.md`, `VERSION`, `CHANGELOG.md`
- Merge-clean (18): `agents/tester-qa.md`, `commands/{audit-drift,bootstrap-project,cloud-session,dev-cycle,execute-feature,fix-build,plan-feature,refactor-codebase,resume-session,sync-context,update-ai-system,verify-work}.md`, `protocols/{context-tiering,entry-protocol,quality-gate,verification-rules}.md`, `standards/engineering-principles.md`
- Targeted: `ai-context.md`, `ai-system/planning/task-queue.md`, `ai-system/design-system.md`, `ai-system/system-architecture.md`, `ai-system/memory/project-decisions.md`, `ai-system/testing/test-plan.md`
- `ai-system/checkpoints/session-log.md` — this entry

**Next Task:**
Run the actual QA gate is unaffected (docs-only change). Next dev task: top incomplete item in `planning/task-queue.md` ([M] SEO, [BUG] blog sanitization, [M] activity-points wiring, [M] API integration tests, or [M] E2E admin journey). Optionally run `audit-sources.md` against Homewolves' real stack to re-evaluate the template's generic `tools/registry.md` seed rows.

**Assumptions Made:**
- Migrated from upstream HEAD (`1966ff7`) rather than the proposal's baseline (`e19a4b3`) — both are v3.0.0; HEAD adds only the `update-ai-system.md` trigger clarification + a project-decisions entry, both incorporated.
- `tools/registry.md` seed rows remain the template's generic evaluations — re-audit before trusting `adopt` verdicts (honest note from the proposal, carried forward).
- `ai-system/designs/` (project page exports) and new `ai-system/design-references/` (external design languages) are distinct; both kept per the proposal.

**Notes / Blockers:**
- No code changed — docs-only migration; `npm test`/typecheck/build/lint unaffected.
- The proposal file `ai-system-template-v3-update-proposal.md` is now superseded (applied); kept at repo root as the decision record.

---

## Session 7 — 2026-08-13 (Prisma→Drizzle migration + web audit rectification)

**Completed:**
Migrated `packages/api` from Prisma to Drizzle ORM end-to-end, then ran the `verify-work.md` web audit on `apps/web` and rectified its findings.

- **Drizzle schema** — `packages/api/src/drizzle/schema.ts`: 28 tables, 5 pgEnum types (with `as const` enum maps), relations, and `ListingCategory` re-exported. `drizzle.config.ts` (TS config, `./src/drizzle/schema.ts` out) + `drizzle/seed.ts` moved from Prisma.
- **DrizzleService / module** — `@Global` `DrizzleModule` with `DrizzleService` exposing getter-based `select`/`insert`/`update`/`delete` plus `db`/`query`; services now use `db.select()/insert()/update()/delete().where()/onConflictDoUpdate()` chains and `db.query.<table>.findMany/findFirst` relational queries. `app.module.ts` wired `DrizzleModule`; removed `PrismaModule` imports from `audit/documents/subscriptions/signatures` modules. JWT strategy + notifications gateway ported.
- **Dependency cleanup** — `@prisma/client`/`prisma` removed from `packages/api/package.json`; `packages/api/prisma/` and `packages/api/src/prisma/` deleted.
- **Migration** — generated `drizzle/migrations/0000_faithful_moira_mactaggert.sql` via `npm run db:generate` (offline-safe; CI has no live DB).
- **Specs rewritten (10 files, 93 tests)** — new shared mock `packages/api/src/test/drizzle.mock.ts`: `createChain(value, onMethod?)` returns a thenable Proxy (every chain method returns the same thenable; accepts `PromiseLike` for rejected chains; `onMethod` records args — used to assert `.values()`/`.set()` payloads) and `createDrizzleMock()` returning `{ db, select, insert, update, delete, query, table(name) }`. `table(name)` exposes per-table `findMany/findFirst/findUnique` vi.fn()s. `npx vitest run` → 10 files / 93 tests pass.
- **Web audit rectification (`apps/web`)** — CategoryBento `role="button"` dead cards → real `next/link`s to `/properties?category=…`; properties page now initializes `search` + `activePill` from URL query params (via `window.location.search` in state initializers — no Suspense coupling) and fixed the `categoryMap` keys (were `for_sale`, actual pill id is `sale` — "For Sale" filtering was silently broken); footer nav `<a>` → `next/link`; dashboard notification dropdown rows now clickable (mark single notification read + navigate to notifications); `useNotificationBell` now exposes per-notification `markRead`; added `loading.tsx` to `(public)` and `(dashboard)` route groups; hero + landing `property-card` raw `<img>` → `next/image` (added `images.unsplash.com` to `next.config.js` `remotePatterns`).
- **Verification** — `apps/web`: `tsc --noEmit` clean, `next lint` clean, `vitest run` 13 files / 94 tests pass, `next build` succeeds. `packages/api`: `tsc --noEmit` clean, lint 0 errors (3 pre-existing `no-console` warnings), 93 tests pass, `nest build` succeeds.

**Files Modified:**
- `packages/api/src/drizzle/` (schema, service, module, config) + `packages/api/drizzle/` (migrations, seed) — new
- All `packages/api/src/modules/*/` services + DTOs (2 files) + jwt.strategy + notifications.gateway + app.module — Prisma→Drizzle port
- 10 `*.service.spec.ts` files + `packages/api/src/test/drizzle.mock.ts` — Drizzle mock rewrite
- `packages/api/package.json`, `package.json`, `package-lock.json` — deps
- Deleted `packages/api/prisma/`, `packages/api/src/prisma/`
- `apps/web/app/(public)/properties/page.tsx` — URL param init + categoryMap fix
- `apps/web/components/landing/{category-bento,footer,hero-section,property-card}.tsx` — linkability + next/image
- `apps/web/app/(dashboard)/layout.tsx` + `apps/web/hooks/use-notifications.ts` — notification row click behavior
- `apps/web/app/(public)/loading.tsx`, `apps/web/app/(dashboard)/loading.tsx` — new
- `apps/web/next.config.js` — `images.unsplash.com` remotePattern

**Next Task:**
Top incomplete item in `planning/task-queue.md` ([M] SEO, [BUG] blog sanitization, [M] activity-points wiring, [M] API integration tests, or [M] E2E admin journey). If a live Supabase DB is available, run `npm run db:migrate` + `npm run db:seed` to apply `0000_faithful_moira_mactaggert.sql` and smoke-test.

**Assumptions Made:**
- Drizzle spec mocks accept `result!` non-null assertions where query results may be `undefined` — mirrors the previous Prisma mock style.
- Bentoo `new_dev` pill maps to no category filter (its `queryParam` is `type`, not `category`; the page has no type-filter plumbing yet) and `direct-brief` links to `/properties` (all) — logged in `project-decisions.md`.
- Remaining raw `<img>` tags in dashboard/blog/auth/listings pages are dynamic user/API media and were out of scope for the landing-page audit — flagged for a follow-up `next/image` pass.

**Notes / Blockers:**
- Migration file `0000` generated but not applied — no live DB in CI; `db:push/migrate/seed` require real Supabase credentials.
- Playwright E2E journeys unchanged (stub the API); not re-run this session — web build/tests green.
- Lint across both packages: 0 errors; only the 3 pre-existing `no-console` warnings in `@hw/api`.

---

## Session 8 — 2026-08-19 (Google OAuth via Supabase + Resend email infra + admin GUIs)

**Completed:**
Executed the [XL] feature (Supabase/Drizzle compliance + Google OAuth + Resend email + no-coding admin GUIs) end-to-end. Pipeline: plan-feature -> sign-off -> implementation -> full QA gate green.

- **Google OAuth (API + web):** `users.provider`/`providerId` columns + migration `0001`; `AuthService.exchangeSupabaseToken()` + `POST /api/v1/auth/supabase` (verifies Supabase JWT via `SUPABASE_JWT_SECRET`, find-or-create user, returns HW tokens) + dto + spec; web `@supabase/supabase-js`, `lib/supabase.ts`, auth-page Google button (`actions.ts` `signInWithGoogle`), `/auth/callback` page, `use-auth` `exchangeSupabase` action.
- **Resend email infra (API):** `emailTemplates` + `emailLogs` tables (migration `0001`); `@Global` `EmailModule`/`EmailService` (DB->fallback template resolution, `{{var}}` rendering, Resend send + log row, simulated log-only fallback when `RESEND_API_KEY` unset); `email.controller.ts` admin CRUD (seed/list/preview/PUT guarded `JWT+ADMIN/SUPER_ADMIN`); zod dto; seeded defaults + `FALLBACK_EMAIL_TEMPLATES` (13 keys) in `packages/config/src/fallbacks.ts` and `apps/web/config/fallbacks.ts`; `main.ts` bootstrap seeds if empty. Wired hooks: OTP (register/login), welcome (complete-profile), referral_signup, transaction created/completed/rejected/cancelled, payment_confirmed, subscription_activated, signature_requested, listing approved/rejected, price-drop.
- **Admin GUIs (web):** `/dashboard/admin/email-templates` (list, edit, live iframe preview, seed); `/dashboard/admin/blog` (list/publish/unpublish/delete) + `new` + `[id]/edit`; `components/blog/rich-text-editor.tsx` (contenteditable + HTML source mode) + `post-form.tsx`; hooks `use-email-templates.ts`, `use-blog.ts`; lib `email-templates.ts`, extended `blog.ts`/`use-blog.ts` (`published` param). API `blog.controller.ts` supports `published=all` for admin.
- **Bug fixes during QA:** web vitest forks-worker timeout -> `pool: 'threads'` in vitest.config; jsdom `localStorage` broken under Node v25 -> in-memory Storage polyfill in `vitest.setup.ts`; rich-text-editor never rendered initial HTML (added `dangerouslySetInnerHTML`); post-form slug field stripped typed hyphens per keystroke (store raw, normalize at submit); `createBlogPostSchema` strict-rejected `featured` on create (added to schema + service + web lib type).
- **QA gate:** API typecheck/lint (0 errors, 1 pre-existing console warning)/111 tests/nest build all green; web typecheck/lint clean, 100 tests pass, next build green. `GlobalExceptionFilter` rewritten to map postgres SQLSTATE codes (23505/23503/22P02) instead of Prisma P-codes.

**Files Modified:**
- `packages/api/src/modules/email/` (service, defaults, controller, dto, module, spec) — new; `packages/api/src/app.module.ts`, `main.ts` — EmailModule + seed-on-boot
- `packages/api/src/modules/{auth,transactions,signatures,subscriptions,listings,alerts}/*.service.ts` — email hooks + constructor changes; `auth.controller.ts`, `auth/dto/register.dto.ts`, specs for auth/transactions/listing
- `packages/api/src/drizzle/schema.ts` + `drizzle/migrations/0001_grey_killmonger.sql` — users provider cols + emailTemplates/emailLogs
- `packages/api/src/modules/blog/dto/blog-post.dto.ts`, `blog.service.ts`, `blog.controller.ts` — featured on create, published=all
- `packages/api/src/common/filters/global-exception.filter.ts` — postgres SQLSTATE mapping
- `packages/config/src/fallbacks.ts`, `apps/web/config/fallbacks.ts` — FALLBACK_EMAIL_TEMPLATES
- `apps/web/lib/{supabase.ts,email-templates.ts,blog.ts}`, `apps/web/hooks/{use-auth.ts,use-email-templates.ts,use-blog.ts}` — new/extended
- `apps/web/app/(public)/auth/{page.tsx,actions.ts,callback/page.tsx}` — Google OAuth flow
- `apps/web/app/(dashboard)/dashboard/admin/{email-templates/page.tsx,blog/...}` — admin GUIs
- `apps/web/components/blog/{rich-text-editor.tsx,post-form.tsx}` + `*.test.tsx` — editor + form + component tests
- `apps/web/vitest.config.ts` (threads pool), `apps/web/vitest.setup.ts` (storage polyfill)
- `apps/web/package.json`, `packages/api/package.json`, `package-lock.json` — `@supabase/supabase-js`, `resend`
- `.env.example` + `.env` — Resend section
- `packages/types/src/global.d.ts`, `packages/types/src/entities/email.types.ts` — EmailTemplate global type
- `ai-system/system-architecture.md`, `ai-system/memory/project-decisions.md` — Prisma-era drift reconciled

**Next Task:**
Apply migration `0001_grey_killmonger.sql` on a live Supabase DB (`npm run db:migrate` + `npm run db:seed`). Fill `SUPABASE_JWT_SECRET` in `.env` to enable real Google OAuth exchanges (provider creds live in the Supabase dashboard) and `RESEND_API_KEY` for real email delivery. Then resume the next incomplete `planning/task-queue.md` item ([M] SEO, [M] API integration tests, [M] E2E admin journey, ...).

**Assumptions Made:**
- Email sends are fire-and-forget by design; unset `RESEND_API_KEY` means simulated log-only delivery, never an error.
- The vitest forks pool timeout is environmental (worker startup on Node v25/Windows); `pool: 'threads'` + storage polyfill make the suite deterministic.
- Supabase exchange cannot be exercised until `SUPABASE_JWT_SECRET` is set; web fallback message covers it.

**Notes / Blockers:**
- No live DB in this environment — migrations `0000`/`0001` generated offline and unapplied.
- Supabase OAuth real exchange blocked until `SUPABASE_JWT_SECRET` is filled by the user.
- Playwright E2E journeys unchanged (stub the API); not re-run this session — web build/tests green.

---

## Session 9 — 2026-08-19 (Sprint close-out + security hardening + DB migration)

Executed the remaining `task-queue` sprint items + residual security risks + DB migration (`execute-feature` pipeline, plan signed off). QA gate fully green: API 135 tests + typecheck/lint/build; web 100 tests + typecheck/lint + 22 E2E journeys (Playwright, workers=1) + `next build` (with `NEXT_IGNORE_INCORRECT_LOCKFILE=1`).

**Completed:**
- **SEO (verify-only):** listing detail already has `generateMetadata` + JSON-LD (`properties/[id]/page.tsx`); `app/sitemap.ts` + `robots.ts` already live with valid API params. No code changes needed (blog detail stays a client component — decision).
- **Activity:** `listing_approved` rule (20 pts) added to `activity.service.ts` `DEFAULT_RULES`; `moderateListing` now awards the owner's points on approve (guarded by `updated?.owner?.role`); `listing.service.spec.ts` updated (approve → award, reject → not called).
- **DocuSeal webhook HMAC:** `verifyWebhookSignature(rawBody, signature)` in `docuseal.client.ts` (HMAC-SHA256 over `timestamp.body`, 5-min replay window, timing-safe compare, dev bypass when `DOCUSEAL_WEBHOOK_SECRET` unset); wired into `signatures.controller.ts` `POST webhook` (401 on invalid); 7 unit tests in `docuseal.client.spec.ts`; `DOCUSEAL_WEBHOOK_SECRET` added to `.env`/`.env.example`.
- **JWT secret fail-hard:** new `packages/api/src/common/config/env.ts` — `resolveJwtSecret()` throws when `NODE_ENV=production` and `JWT_SECRET` unset (dev fallback `homewolves-dev-secret` otherwise); used in `jwt.strategy.ts`, `auth.module.ts`, and boot check in `main.ts`.
- **Rate limiter:** pluggable store via `RATE_LIMIT_STORE` token — `RateLimitStore` interface, `MemoryRateLimitStore` (sliding window, 10k cap), `RedisRateLimitStore` (ioredis sorted-set, lazy connect) with Redis→memory fallback factory in `rate-limit.module.ts`; `RateLimitGuard` rewritten async; 5 store unit tests in `rate-limit.store.spec.ts`.
- **API integration tests:** `packages/api/src/test/app.e2e.spec.ts` — supertest + `Test.createTestingModule({ imports: [AppModule] })` with `DrizzleService` overridden (shared mock). 12 tests: 401 (no/invalid token on `/activity/stats`), 403 (non-admin `POST /blog`), 201 (admin create), 400 (invalid register/blog payloads + strict unknown keys), 404 (unknown listing/blog slug), 200 (listings feed, blog categories), 429 (over-limit shape). Discovered + fixed two real type bugs along the way (docuseal `header` possibly undefined; redis `exec()` null/`[error,result]` typing).
- **E2E admin journey:** `apps/web/e2e/admin-journey.spec.ts` — 6 tests covering moderation queue (nav visible, approve empties queue, reject empties queue, non-admin nav hidden) and payment review (confirm/reject empty the list). Fixed a real web bug the suite surfaced: **zustand `persist` hydrates asynchronously** — the dashboard layout's `router.replace('/auth')` could fire before rehydration on slow loads, bouncing logged-in users to `/auth`. Added a `hydrated` flag (`onFinishHydration`) to `use-auth.ts` and gated the redirect + loading state on it.
- **DB migration:** `npm run db:migrate` applied migrations `0000` + `0001` to the live Supabase Postgres. Gotcha: `drizzle-kit migrate` does not auto-load the root `.env` — must export `DATABASE_URL` (or add `packages/api/.env`).
- **Next build env quirk documented:** Next 14.2.35's SWC lockfile auto-patch crashes (its `optionalDependencies` pin `@next/swc-*@14.2.33` but the patcher fetches 14.2.35); workaround `NEXT_IGNORE_INCORRECT_LOCKFILE=1`. Verified the build compiles + static-generates 31 pages fine with it.

**Files Modified:**
- `packages/api/src/common/config/env.ts` — new `resolveJwtSecret()`
- `packages/api/src/common/integrations/docuseal.client.ts` (+`.spec.ts`) — `verifyWebhookSignature`
- `packages/api/src/modules/signatures/signatures.controller.ts` — webhook HMAC check (401)
- `packages/api/src/common/rate-limit/{rate-limit-store.ts,memory-rate-limit.store.ts,redis-rate-limit.store.ts,rate-limit.guard.ts,rate-limit.module.ts,rate-limit.store.spec.ts}` — pluggable store + Redis fallback
- `packages/api/src/modules/activity/activity.service.ts` — `listing_approved` rule
- `packages/api/src/modules/listings/listing.service.ts` (+`.spec.ts`) — award on approve
- `packages/api/src/modules/auth/{jwt.strategy.ts,auth.module.ts}`, `src/main.ts` — `resolveJwtSecret()`
- `packages/api/src/test/app.e2e.spec.ts` — new supertest integration suite
- `apps/web/hooks/use-auth.ts`, `apps/web/app/(dashboard)/layout.tsx` — hydration-gated auth redirect
- `apps/web/e2e/admin-journey.spec.ts` — new (6 tests)
- `.env.example` + `.env` — `DOCUSEAL_WEBHOOK_SECRET`
- Docs: `task-queue.md`, `project-decisions.md`, `system-architecture.md`, `project-context.md` (Prisma drift fixed), `in-progress.md` (cleared)

**Next Task:**
Fill `SUPABASE_JWT_SECRET` + `RESEND_API_KEY` in `.env` to enable real Google OAuth + email delivery, then resume the next incomplete `planning/task-queue.md` backlog item.

**Assumptions Made:**
- `npm run db:seed` still optional (migrations applied; seeding not run this session).
- DocuSeal dev bypass (verify returns true when secret unset) matches the Paystack dev-bypass convention.
- Playwright suite must be run with `--workers=1` locally (parallel workers race the dev server on Windows; 22/22 green serially).

**Notes / Blockers:**
- Supabase OAuth real exchange blocked until `SUPABASE_JWT_SECRET` is filled by the user; real email until `RESEND_API_KEY`.
- `next build` needs `NEXT_IGNORE_INCORRECT_LOCKFILE=1` in this environment (Next 14.2.35 SWC lockfile-patch registry bug; unrelated to code).
- `db:migrate`/`db:seed` need `DATABASE_URL` exported (root `.env` is not auto-loaded by `drizzle-kit`).

---
