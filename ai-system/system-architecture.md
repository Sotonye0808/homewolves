# System Architecture

> **Metadata**
> - last-updated-by: bootstrap-project
> - last-verified-against-code: 2026-08-05
> - staleness-policy: re-verify before trusting if any architecture-affecting commits have been made since last-verified-against-code

> **Overview:** Homewolves is a multi-sided PropTech marketplace + Agent CRM + Transaction Management Platform targeting the Nigerian/African market. It uses a modular monolith architecture (Next.js 14 frontend + NestJS backend + PostgreSQL) designed to decompose into microservices as the platform scales. The system is metadata-driven — all configurable UI elements and business rules are stored in the database via `PlatformConfig`, with hardcoded fallbacks in `packages/config/src/fallbacks.ts`.

---

## Architecture Diagram

> **Section summary:** The system has five logical layers: Client (Web/Mobile), API Gateway (Next.js API Routes / REST), Service Layer (NestJS modules), Data Layer (PostgreSQL + Redis + S3), and External Integrations (SMS, Email, WhatsApp, Payment).

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│  Web (Next.js 14 App Router)  │  Mobile (React Native/Expo) │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / WebSocket (Socket.io /ws)
┌────────────────────────▼────────────────────────────────────┐
│                     API LAYER                               │
│         (NestJS REST controllers + Socket.io gateways)      │
│         Rate limiting · Auth guards (JWT) · RBAC            │
└──────┬───────────┬───────────┬──────────────┬───────────────┘
       │           │           │              │
   ┌───▼───┐  ┌───▼───┐  ┌───▼───┐     ┌────▼────┐
   │ Auth  │  │Listing│  │  CRM  │     │  Trans- │
   │Service│  │Service│  │Service│     │  action │
   └───┬───┘  └───┬───┘  └───┬───┘     │  Service│
       │           │           │         └────┬────┘
       └───────────┴───────────┴──────────────┘
                         │
              ┌──────────▼──────────┐
              │     Data Layer      │
              │  PostgreSQL (main)  │
              │  Redis (cache/ws)   │
              │  S3-compat (files)  │
              └─────────────────────┘
```

---

## Module Breakdown

> **Section summary:** Each NestJS module has a single responsibility. Services contain all business logic. Controllers are thin — they validate input, call services, return responses. Every mutation passes through AuditService.

| Module | Responsibility | Key Files | Dependencies |
|--------|----------------|-----------|--------------|
| `auth` | Email/phone OTP, JWT, session management | auth.service.ts, auth.controller.ts | users, notifications, Prisma |
| `listings` | Property CRUD, search, media upload, featured/verified flags, moderation | listing.service.ts, listing.controller.ts | users, notifications, audit, alerts, Prisma |
| `recently-viewed` | Session/user-based listing view tracking | recently-viewed.service.ts | listings, Prisma |
| `saved` | Save-for-later wishlist toggle | saved.service.ts | listings, Prisma |
| `crm` | Client assignment, notes, ratings, inspection scheduling | crm.service.ts, inspections.service.ts | users, listings, notifications, Prisma |
| `transactions` | Full deal lifecycle stepper, payment evidence, document vault | transactions.service.ts | listings, users, audit, notifications, Prisma |
| `documents` | Document vault for transactions | documents.service.ts | Prisma |
| `signatures` | E-signature workflow | signatures.service.ts | Prisma |
| `messaging` | Real-time chat via Socket.io, conversation management | messaging.gateway.ts, messaging.service.ts | users, listings, Prisma |
| `notifications` | Multi-channel dispatch (WebSocket, email, SMS, WhatsApp) | notifications.service.ts, notifications.gateway.ts | BullMQ, Resend, Termii |
| `alerts` | Price drop + new listing match alerts | alerts.service.ts | listings, notifications, Prisma |
| `activity` | Agent gamification — points, tiers, leaderboard | activity.service.ts | users, Prisma |
| `subscriptions` | Paystack billing, plan feature gating | subscriptions.service.ts | users, Prisma |
| `blog` | CMS-driven blog with magazine layout | blog.service.ts | Prisma |
| `platform-config` | All admin-configurable metadata (amenities, filters, nav, feature flags) | platform-config.service.ts | Prisma, Redis |
| `audit` | Immutable event log — write-once, append-only | audit.service.ts | Prisma |

---

## Data Flow

> **Section summary:** Requests flow from client → NestJS REST controller → service → Prisma → PostgreSQL. Mutations always emit AuditEvents. Config is fetched at startup and cached in Redis.

### Standard Request Flow
```
Browser/Mobile App
  → Next.js (SSR/CSR) / React Native
    → REST endpoint (Next.js API Route proxy → NestJS controller)
      → Validation (DTO / class-validator)
        → Service method (business logic)
          → Prisma query → PostgreSQL
          → AuditService.log() (if mutation)
          → Return response
```

### Authentication Flow
```
User enters email/phone
  → AuthService.register()
    → OTP generated, stored in Redis (5min TTL)
    → SMS via Termii + Email via Resend
  → User submits OTP
    → AuthService.verifyOtp()
      → JWT access token + refresh token
      → Session stored in Redis
```

### Config Resolution Flow
```
Component requests config (e.g. filter pills)
  → PlatformConfigService.get('filter_pills')
    → Redis cache check (5min TTL)
      → MISS → Prisma query → PlatformConfig table
      → HIT → return cached
    → Fallback: FALLBACK_FILTER_PILLS from packages/config/src/fallbacks.ts
    → Return to component
```

---

## Configuration Points

> **Section summary:** All configurable values are managed via PlatformConfig in the database or environment variables. Nothing is hardcoded in source files. All values follow the fallback discipline from `standards/engineering-principles.md` §1 and §3 — every config-driven value has a documented fallback in `packages/config/src/fallbacks.ts`.

| Config Key | Purpose | Location | Default |
|------------|---------|----------|---------|
| `amenities` | Property amenity icons and labels | PlatformConfig table | FALLBACK_AMENITIES |
| `filter_pills` | Search filter options | PlatformConfig table | FALLBACK_FILTER_PILLS |
| `nav_items` | Navigation menu structure | PlatformConfig table | FALLBACK_NAV_ITEMS |
| `subscription_plans` | Agent subscription tiers and pricing | PlatformConfig table | FALLBACK_PLANS |
| `feature_flags` | Feature toggles with role/rollout gates | PlatformConfig table | FALLBACK_FLAGS |
| `notification_templates` | Multi-channel notification content | PlatformConfig table | FALLBACK_TEMPLATES |
| `transaction_step_templates` | Workflow step definitions | PlatformConfig table | FALLBACK_STEPS |
| `property_types` | Property type categories and icons | PlatformConfig table | FALLBACK_TYPES |
| `DATABASE_URL` | PostgreSQL connection string | .env | — |
| `REDIS_URL` | Redis connection string | .env | — |
| `JWT_SECRET` | Token signing secret | .env | — |
| `TERMII_API_KEY` | SMS provider key | .env | — |
| `RESEND_API_KEY` | Email provider key | .env | — |

---

## Tech Stack

> **Section summary:** Core technologies powering Homewolves. New dependencies must be justified and added here.

| Layer | Technology | Version |
|-------|------------|---------|
| Web Frontend | Next.js (App Router) | 14.x |
| Mobile Frontend | React Native (Expo) | SDK 51+ |
| Backend Framework | NestJS | Latest |
| API Layer | REST (public) | — |
| Database | PostgreSQL | 16 |
| ORM | Prisma | Latest |
| Cache | Redis | 7 |
| UI Components | shadcn/ui (Radix + Tailwind) — Hw* wrappers | Latest |
| Styling | Tailwind CSS + CSS Variables | Latest |
| Real-time | Socket.io | Latest |
| State | TanStack Query (server) + Zustand (client) | Latest |
| Auth | JWT (NextAuth optional) | Latest |
| Email | Resend | Latest |
| SMS | Termii + Twilio fallback | Latest |

---

## Known Constraints & Technical Debt

> **Section summary:** Limitations and known issues that affect architecture decisions. Agents should be aware of these before proposing changes.

- **Mobile-first** — all layouts must work at 375px before expanding to desktop.
- **Nigeria-first** — SMS (Termii) and local payment gateways (Paystack) are primary; international is fallback.
- **No Meilisearch yet** — Phase 1 uses PostgreSQL FTS; migration planned for Phase 5.
- **Prisma client not regenerated after new models** — new models (Client, Note, Rating, Inspection, ActivityRule, AgentActivity, AgentPoints, BlogPost) accessed via `(this.prisma as any)` pattern; a `prisma generate` is required.
- **Notifications dispatch synchronously** — BullMQ async queue with retries is planned for production.
- **Blog content uses `dangerouslySetInnerHTML`** — must be paired with sanitization in production.
- **Activity points awarded on-demand via API endpoint** — should be wired into service-layer hooks for automatic awarding.

---

## Architecture History

See `memory/architecture-history.md` for full chronology.
