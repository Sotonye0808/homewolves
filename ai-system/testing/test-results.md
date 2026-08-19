# Test Results

> **Metadata**
> - last-updated-by: execute-feature
> - last-verified-against-code: 2026-08-13
> - staleness-policy: overwritten on every test run — always current

> **Overview:** Latest test run results. Updated by agents after running tests. Gives a quick snapshot of current project health.

---

## Last Run

**Date:** 2026-08-13
**Run by:** execute-feature

**Results:**
| Suite | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| API unit (vitest, @hw/api) | 93 | 0 | 0 |
| Web unit/component (vitest, @hw/web) | 94 | 0 | 0 |
| E2E (Playwright, @hw/web) | 16 | 0 | 1 flaky* |

*The single flaky E2E test (`transaction detail renders the stepper`) intermittently lands on `/auth` under parallel dev-server load before zustand rehydrates the seeded session; it self-heals on retry (`retries: 2` in CI) and passed 10/10 in isolation.

**Overall Status:** Green — `npm test` (187 tests), `npm run typecheck`, `npm run build`, and `npm run lint` all pass. Lint has 3 pre-existing `no-console` warnings in `@hw/api` (dev/stub logging in `main.ts` + `auth.service.ts`) — non-blocking.

**API unit test files (10):** audit, platform-config, notifications, listing, transactions, crm, blog, auth, referrals (pre-existing), activity (pre-existing) service specs.
**Web unit test files (13):** lib/transactions, lib/listings, lib/crm, lib/blog, lib/subscriptions, lib/referrals, lib/activity, lib/notifications; components/ui/hw-badge, hw-button, hw-card, hw-input; components/landing/hero-section.
**E2E spec files (5):** e2e/smoke, e2e/guest, e2e/auth, e2e/agent-dashboard, e2e/transaction-stepper. E2E journeys stub the API via `page.route` since the Playwright webServer only boots the web app.

---

## Active Failures

| Test | Error | Status | Assigned To |
|------|-------|--------|------------|
| — | — | None | — |

---

## History

| Date | Passed | Failed | Notes |
|------|--------|--------|-------|
| 2026-06-10 | 0 | 0 | Initial audit complete. No test suite exists yet |
| 2026-06-10 | 0 | 0 | Session 6: All features implemented. `tsc --noEmit` passes on all packages |
| 2026-06-16 | 0 | 0 | Build repair pass — `npm run build` completes green |
| 2026-08-05 | 0 | 0 | v2 ai-system bootstrap. No test suite configured yet |
| 2026-08-11 | 35 | 0 | Baseline before this session: 16 API + 19 web unit tests, 3 E2E smoke tests |
| 2026-08-13 | 187 | 0 | Testing setup complete: 93 API + 94 web unit, 16 E2E journeys (1 flaky) |
