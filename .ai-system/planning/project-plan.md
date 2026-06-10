# Project Plan

> **Overview:** High-level phase checklist for Homewolves v1.0, derived from ROADMAP.md §9. Agents update checkboxes as work is completed. See task-queue.md for granular, sprint-level tasks.

---

## Phase 1 — Marketplace MVP

> **Section summary:** Public can browse, search, save properties. Agents can list. Basic auth. Audit logging. Admin moderation.

- [ ] Project scaffolding — Turborepo monorepo, Next.js 14, NestJS, Prisma, PostgreSQL
- [ ] `.ai-system/` fully populated (this bootstrap)
- [ ] Auth module — email/phone OTP, JWT, social OAuth
- [ ] PlatformConfig module + fallbacks.ts — all config stored in DB, cached in Redis
- [ ] Listings CRUD — agent/developer/homeowner can create, update, delete
- [ ] Public listing feed + search (PostgreSQL FTS)
- [ ] Property Detail page — gallery, meta, features, agent card, map
- [ ] Recently Viewed — session-based + authenticated tracking
- [ ] Saved Collections (Save for Later) — named groups of listings
- [ ] Wishlist / Interest — formal enquiry that notifies agent
- [ ] Basic Audit logging — every mutation emits AuditEvent
- [ ] Admin listing moderation queue — approve/reject
- [ ] WhatsApp contact integration
- [ ] Referral code system
- [ ] Responsive web (mobile-first, breakpoints from DESIGN.md)
- [ ] React Native app (Expo) — listings + auth screens parity
- [ ] Design HTML exports complete → all 12 screens from `.ai-system/designs/`

**Acceptance Criteria:**
- Guest can search, filter, view, and save a property without login
- Agent can register, list a property, and receive a wishlist notification
- Admin can approve/reject a listing
- All mutations produce AuditEvent records

---

## Phase 2 — Agent CRM & Collaboration

> **Section summary:** Agent dashboard, client management, inspection scheduling, real-time messaging.

- [ ] CRM module — client assignment, notes, ratings
- [ ] Inspection scheduling — calendar sync
- [ ] Agent Dashboard — bento grid layout
- [ ] Client Dashboard — tabs: transactions, wishlist, recently viewed, documents
- [ ] In-app messaging — real-time Socket.io chat
- [ ] Push notifications — FCM/APNs
- [ ] Price drop alerts
- [ ] New listing match alerts (saved search preferences)
- [ ] Activity points system (gamification, configurable)
- [ ] Referral tracking + commission attribution
- [ ] Full audit trail viewer — per-user, per-entity

---

## Phase 3 — Transaction Workflow System

> **Section summary:** End-to-end transaction management with stepper UI, payment evidence, approvals.

- [ ] Transaction module — purchase, rental, shortlet workflows
- [ ] Step-by-step transaction page — glass stepper UI
- [ ] Payment evidence upload + admin approval
- [ ] Due diligence checklist — admin-configurable
- [ ] E-signature integration (DocuSeal or equivalent)
- [ ] Document vault — client dashboard
- [ ] Installment payment tracking
- [ ] Transaction audit trail — per-transaction view + CSV/PDF export
- [ ] Admin transaction approval queue
- [ ] Notification templates for all transaction events

---

## Phase 4 — Client Dashboard & Polish

> **Section summary:** Complete buyer portal, PWA, SEO, subscription billing, featured listings.

- [ ] Full client portal — all dashboard tabs complete
- [ ] Transaction portfolio view
- [ ] Mobile app parity with web
- [ ] PWA — offline recently viewed, wishlist
- [ ] SEO — listing pages, sitemap, meta tags, structured data
- [ ] Blog module — CMS-driven magazine layout
- [ ] Performance audit — Core Web Vitals (LCP < 2.5s, CLS < 0.1)
- [ ] Subscription billing — Paystack integration
- [ ] Featured listing / ad placement system

---

## Phase 5 — Intelligence & Automation

> **Section summary:** Data-driven platform, AI features, Meilisearch, multi-region.

- [ ] Analytics engine — agent performance, listing performance, funnel
- [ ] AI chatbot — property Q&A, agent assistant
- [ ] Smart property recommendations — ML from recently viewed + saved
- [ ] Predictive lead scoring for agents
- [ ] Auto follow-up sequences — CRM automation
- [ ] Meilisearch migration — advanced search with typo tolerance
- [ ] Multi-region deployment config — Ghana, Kenya

---

## Completed

> **Section summary:** Features fully shipped. Archived here for reference.

- [x] Design system defined (DESIGN.md) — tokens, components, page layouts, themes
- [x] Architecture defined (ROADMAP.md) — stack, domain model, modules, API, RBAC, notifications
- [x] Design HTML exports — 12 screens in `.ai-system/designs/`
- [x] `.ai-system/` documentation structure bootstrapped — all agent files populated
