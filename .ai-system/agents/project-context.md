# Project Context

> **Overview:** Homewolves is a multi-sided PropTech marketplace, agent CRM, and transaction management platform for the African real estate market. It connects property buyers, renters, agents, developers, and homeowners in a single operating system — from property discovery through to deal close. The platform is Nigeria-first with a pan-African expansion roadmap.

---

## Project Purpose

> **Section summary:** Homewolves fixes the fragmented, low-trust, manual nature of African real estate by providing a unified digital platform for property listings, agent-client management, and auditable transaction workflows.

African real estate suffers from fragmentation, mistrust, and manual workflows. Agents lose deals on WhatsApp. Buyers cannot verify listings. Transactions have no paper trail. Homewolves solves this with a single platform covering the entire lifecycle — discovery, verification, client management, and auditable deal execution.

---

## Target Users

> **Section summary:** Five primary user types interact with the platform. Each has distinct needs, permissions, and UI surfaces.

| User Type | Needs | Key Interactions |
|-----------|-------|-----------------|
| Guest/Buyer | Browse properties, search/filter, save favourites, contact agents | Property feed, detail page, wishlist, enquiry form |
| Agent | List properties, manage clients, schedule inspections, close deals | Agent dashboard, CRM, listing manager, transaction workflow |
| Developer | Portfolio management, bulk listings, analytics | Developer dashboard, listing manager, analytics |
| Homeowner | List individual properties, manage enquiries | Listing creation, enquiry inbox |
| Admin | Moderate listings, manage users, configure platform, view audit logs | Admin panel, config panel, audit log viewer |

---

## Business Constraints

> **Section summary:** Non-negotiable requirements that shape architecture and implementation decisions.

- **Metadata-driven rendering** — all UI labels, icons, options, and feature gates must come from PlatformConfig, not hardcoded sources. Not optional.
- **Audit by default** — every mutation must emit an AuditEvent. No exceptions.
- **Mobile-first** — all layouts must work at 375px width minimum. Desktop is an enhancement.
- **Offline-capable** — critical read paths (recently viewed, wishlist) must work offline via local storage.
- **RBAC everywhere** — every protected action checks user permissions against the role matrix, not hardcoded role strings.
- **Nigeria data compliance (NDPR)** — data must reside in Nigerian region; privacy policy enforced at onboarding.

---

## Current Project Phase

> **Section summary:** The project is in the bootstrap phase — design assets exist but zero code has been written. The immediate focus is project scaffolding.

**Phase:** Active Development — Phase 1 (Marketplace MVP)

**Active sprint focus:** Project scaffolding — monorepo setup, Prisma schema, auth module, listing module, basic UI shell.

**Current state:** Design HTML exports complete in `.ai-system/designs/`. Zero application code written. All `.ai-system/` agent files now populated.

---

## Tech Decisions Already Made

> **Section summary:** Decisions locked in by ROADMAP.md and DESIGN.md. These should not be revisited unless explicitly flagged.

| Decision | Reason |
|----------|--------|
| Next.js 14 App Router for web | SSR/SSG for SEO, RSC for performance |
| NestJS for backend | OOP-native, decorators, modular, DI — aligns with domain model architecture |
| Prisma ORM | Type-safe schema, migrations, powerful relation queries |
| tRPC for internal API | End-to-end type safety between frontend and backend |
| PostgreSQL 16 + JSONB | JSONB for metadata fields without schema migration |
| shadcn/ui wrappers (Hw* pattern) | Single point of change for design tokens; prevents direct Radix imports |
| Global TypeScript types (packages/types) | Zero-import types across entire monorepo via triple-slash refs |
| PlatformConfig for all configuration | Admin-controlled UI without code deploys |
| Redis for cache + session + pub/sub | Multi-purpose; simplifies infrastructure |
| Turborepo monorepo | Shared packages, efficient builds, consistent tooling |
| Monochrome + amber palette | Inspired by JamesEdition; warm accent for African market identity |
| Glassmorphism + bento grid | Modern luxury feel; differentiates from flat-card competitors |
| Lucide + Phosphor icons | Lucide as primary, Phosphor for real-estate-specific icons |

---

## Out of Scope

> **Section summary:** Explicitly excluded from v1.0 to prevent scope creep.

- Native iOS/Android apps outside Expo managed workflow
- AI-powered features (chatbot, recommendations, lead scoring) — Phase 5
- Meilisearch / dedicated search engine — Phase 5
- E-signature integration — Phase 3
- Multi-region deployment (Ghana, Kenya) — Phase 5
- Video calls / virtual tours
- Property management / tenant portal
- Insurance or mortgage products

---

## External Integrations

> **Section summary:** Third-party services the platform connects to. Auth methods and configuration locations noted.

| Service | Purpose | Auth Method |
|---------|---------|------------|
| Termii | SMS delivery (OTP, notifications) | API key (.env) |
| Twilio | SMS fallback | API key (.env) |
| Resend | Transactional email | API key (.env) |
| WhatsApp Business API | Messaging fallback | API token |
| Paystack | Payment processing, subscriptions | Secret key (.env) |
| Mapbox GL JS | Map rendering, geocoding, clustering | Access token (.env) |
| Cloudflare R2 / AWS S3 | File and image storage | Access keys (.env) |
| Sentry | Error tracking, performance monitoring | DSN (.env) |
| Google OAuth | Social authentication | OAuth client ID (.env) |
| Apple OAuth | Social authentication | OAuth client ID (.env) |
