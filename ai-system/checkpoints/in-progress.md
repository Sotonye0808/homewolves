# In-Progress Work

> **Metadata**
>
> - last-updated-by: execute-feature
> - last-verified-against-code: 2026-08-11
> - staleness-policy: this file is overwritten every session — always current

> **Overview:** Tracks work that is currently in progress but not yet complete. Written _before_ starting risky multi-step work, cleared on clean completion. This is the first file `resume-session.md` reads on interruption — it is the single source of truth for "what was half-done."

---

## Current State

**Status:** In Progress

**Command Being Executed:**
execute-feature.md (then update-ai-system.md)

**Directive / Task:**
Next task (logged in the queue): testing setup — unit tests for core services, component tests, E2E Playwright journeys.

Known blockers to see through from the last session's PR comment:
- 94 pre-existing `no-explicit-any` lint errors in `@hw/api` (currently 111)
- 74 pre-existing lint errors in `@hw/types` (currently 61: triple-slash-reference in `global.d.ts` + no-unused-vars on ambient global types)

Plan:
1. Fix `@hw/types` lint blockers — package-level `.eslintrc` reflecting the intentional global-types pattern (triple-slash refs, ambient interfaces)
2. Fix `@hw/api` lint blockers — typed `AuthenticatedRequest` replacing `req: any`, typed `where` clauses, typed JSON casts
3. Unit tests for core services: auth, listings, transactions, crm, notifications, platform-config, blog, audit (activity + referrals already exist)
4. Web component tests: hw-card, hw-input, landing/shared components
5. Web lib tests: listings, crm, notifications, auth, blog, subscriptions, referrals, activity
6. E2E Playwright journeys: guest, auth, agent dashboard, transaction stepper
7. QA gate: `npm run test`, `npm run typecheck`, `npm run build`, `npm run lint`
8. Execute `update-ai-system.md` — update stale docs (test-plan, test-results, task-queue, repo-map, dependency-graph, dev-history, session-log, lessons-learned)

**Steps Completed:**
- Surveyed repo state: test scaffolding exists (vitest+playwright configs, 2 API specs, 2 web lib/component tests, 1 e2e smoke spec) from PR #7, but coverage is thin
- Baseline: `npm install` done; existing tests pass (16 API + 19 web); lint blockers confirmed: 111 in @hw/api, 61 in @hw/types
- Read task-queue, session-log, dev-history, test-plan, quality-gate, execute-feature, update-ai-system

**Current Step:**
Fixing lint blockers (@hw/types first, then @hw/api).

**Files Modified So Far:**
- (pending)

**Checkpoint Context:**
No blockers beyond the known lint counts. typecheck baseline green.

**Last Tool Output / Error:**
None.

---

## Drift Check

**Last verified against repo:** 2026-08-11
**Any known drift between ai-system docs and actual code:** yes — test-plan.md/test-results.md are stale (say no test suite exists); task-queue testing item marked done but docs never updated.

---

_This file is overwritten on every new in-progress operation. Clear on clean completion._
