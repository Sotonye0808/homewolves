# Test Plan

> **Metadata**
> - last-updated-by: bootstrap-project
> - last-verified-against-code: 2026-08-05
> - staleness-policy: re-verify if new features are added

> **Overview:** Defines what needs to be tested and at what level. Referenced by `verify-work.md` during the quality gate. Updated as new features are added. No automated test suite exists yet — the current verification bar is `tsc --noEmit` across all packages plus `npm run build`.

---

## Unit Tests

- [ ] Service layer functions — auth, listings, transactions, crm, notifications
- [ ] Activity points rules and cooldown enforcement
- [ ] PlatformConfig resolution (Redis cache → DB → fallback chain)
- [ ] Utility functions and data transformation logic

---

## Integration Tests

- [ ] API route responses (happy path)
- [ ] API route error handling (validation, auth guards, 404s)
- [ ] Database CRUD operations via Prisma
- [ ] Authentication flow — register → verifyOtp → JWT → refresh
- [ ] Transaction stepper role-based transitions
- [ ] Messaging Socket.io events (send, mark-read, typing)

---

## End-to-End Tests

- [ ] Guest journey — browse, filter, view, save a property without login
- [ ] Agent journey — register, list a property, manage clients, receive alerts
- [ ] Admin journey — approve/reject a listing, review payment evidence
- [ ] Transaction journey — create deal, attach evidence, confirm payment

---

## Performance Tests

- [ ] API response time under normal load
- [ ] Database query performance (listing feed, transaction queries)
- [ ] Page load times (frontend) — Core Web Vitals (LCP < 2.5s, CLS < 0.1)
