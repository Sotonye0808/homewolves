# Test Plan

> **Metadata**
> - last-updated-by: execute-feature
> - last-verified-against-code: 2026-08-13
> - staleness-policy: re-verify if new features are added

> **Overview:** Defines what needs to be tested and at what level. Referenced by `verify-work.md` during the quality gate. Updated as new features are added. A vitest unit/component suite and a Playwright E2E suite now exist — see `testing/test-results.md` for the latest run.

---

## Unit Tests

- [x] Service layer functions — auth, listings, transactions, crm, notifications, platform-config, blog, audit (2026-08-13)
- [x] Activity points rules and cooldown enforcement (pre-existing spec)
- [x] PlatformConfig resolution (Redis cache → DB → fallback chain)
- [x] Web lib API clients — listings, crm, notifications, blog, subscriptions, referrals, activity, transactions
- [x] Web component rendering — HwButton, HwBadge, HwCard, HwInput, HeroSection, StatsStrip
- [ ] Utility functions and data transformation logic (remaining lib files: analytics, audit, documents, featured, interactions, messaging, platform-config, signatures)

---

## Integration Tests

- [ ] API route responses (happy path) — service-layer specs cover logic; supertest route tests not yet added
- [ ] API route error handling (validation, auth guards, 404s)
- [ ] Database CRUD operations via Prisma (uses mocked PrismaService currently)
- [ ] Authentication flow — register → verifyOtp → JWT → refresh (service spec exists; e2e covers UI)
- [ ] Transaction stepper role-based transitions
- [ ] Messaging Socket.io events (send, mark-read, typing)

---

## End-to-End Tests

- [x] Guest journey — browse, search, view a property without login (Playwright)
- [x] Auth journey — register → OTP → profile → agent verification (Playwright, API stubbed)
- [x] Agent journey — dashboard, manage transactions (Playwright, API stubbed)
- [x] Transaction journey — deal stepper, advance step (Playwright, API stubbed)
- [ ] Admin journey — approve/reject a listing, review payment evidence

---

## Performance Tests

- [ ] API response time under normal load
- [ ] Database query performance (listing feed, transaction queries)
- [ ] Page load times (frontend) — Core Web Vitals (LCP < 2.5s, CLS < 0.1)
