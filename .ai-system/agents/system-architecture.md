# System Architecture

> **Overview:** Homewolves is a multi-sided PropTech marketplace + Agent CRM + Transaction Management Platform targeting the Nigerian/African market. It uses a modular monolith architecture (Next.js 14 frontend + NestJS backend + PostgreSQL) designed to decompose into microservices as the platform scales. The system is metadata-driven — all configurable UI elements and business rules are stored in the database via `PlatformConfig`, with hardcoded fallbacks in `/config/fallbacks.ts`.

---

## Architecture Diagram

> **Section summary:** The system has five logical layers: Client (Web/Mobile), API Gateway (Next.js API Routes / tRPC), Service Layer (NestJS modules), Data Layer (PostgreSQL + Redis + S3), and External Integrations (SMS, Email, WhatsApp, Payment).

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│  Web (Next.js 14 App Router)  │  Mobile (React Native/Expo) │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / WebSocket
┌────────────────────────▼────────────────────────────────────┐
│                     API GATEWAY                             │
│         (Next.js API Routes / tRPC / REST fallback)         │
│         Rate limiting · Auth middleware · RBAC              │
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

> **Section summary:** Each NestJS module has a single responsibility. Services contain all business logic. Controllers are thin — they validate input, call services, return responses. Every mutation passes through an AuditService interceptor.

| Module | Responsibility | Key Files | Dependencies |
|--------|----------------|-----------|--------------|
| `auth` | Email/phone OTP, JWT, social OAuth, session management | auth.service.ts, auth.controller.ts | users, notifications, Prisma |
| `users` | User CRUD, role assignment, profile management | users.service.ts, users.controller.ts | Prisma |
| `listings` | Property CRUD, search, media upload, featured/verified flags | listings.service.ts, listings.controller.ts | users, notifications, audit, Prisma |
| `search` | Full-text search, filtered queries, geo-clustering | search.service.ts | listings, Prisma |
| `crm` | Client assignment, notes, ratings, inspection scheduling | crm.service.ts, inspections.service.ts | users, listings, notifications, Prisma |
| `transactions` | Full deal lifecycle stepper, payment evidence, document vault | transactions.service.ts | listings, users, audit, notifications, Prisma |
| `messaging` | Real-time chat via Socket.io, conversation management | messaging.gateway.ts, messaging.service.ts | users, listings, Prisma |
| `notifications` | Multi-channel dispatch (push, email, SMS, WhatsApp) via BullMQ | notifications.service.ts, email.job.ts, sms.job.ts | BullMQ, Resend, Termii |
| `analytics` | Agent/listing performance metrics, funnel tracking | analytics.service.ts | Prisma, Redis |
| `subscriptions` | Paystack billing, plan feature gating | subscriptions.service.ts | users, Prisma |
| `admin` | Listing moderation, user management, audit log viewer | admin.controller.ts, admin.service.ts | listings, users, audit, Prisma |
| `platform-config` | All admin-configurable metadata (amenities, filters, nav, feature flags) | platform-config.service.ts | Prisma, Redis |
| `audit` | Immutable event log — write-once, append-only | audit.service.ts | Prisma |
| `blog` | CMS-driven blog with magazine layout | blog.service.ts | Prisma |

---

## Data Flow

> **Section summary:** Requests flow from client → API Gateway → tRPC router → NestJS controller → service → Prisma → PostgreSQL. Mutations always emit AuditEvents. Config is fetched at startup and cached in Redis.

### Standard Request Flow
```
Browser/Mobile App
  → Next.js (SSR/CSR) / React Native
    → tRPC call or REST endpoint
      → Next.js API Route / NestJS controller
        → Validation (Zod schema)
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
      → JWT access token (15min) + refresh token (30d httpOnly cookie)
      → Session stored in Redis
```

### Config Resolution Flow
```
Component requests config (e.g. filter pills)
  → PlatformConfigService.get('filter_pills')
    → Redis cache check (5min TTL)
      → MISS → Prisma query → PlatformConfig table
      → HIT → return cached
    → Fallback: FALLBACK_FILTER_PILLS from /config/fallbacks.ts
    → Return to component
```

---

## Configuration Points

> **Section summary:** All configurable values are managed via PlatformConfig in the database or environment variables. Nothing is hardcoded in source files.

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
| API Layer | tRPC + REST | — |
| Database | PostgreSQL | 16 |
| ORM | Prisma | Latest |
| Cache | Redis | 7 |
| UI Components | shadcn/ui (Radix + Tailwind) | Latest |
| Styling | Tailwind CSS + CSS Variables | Latest |
| Forms | React Hook Form + Zod | Latest |
| Maps | Mapbox GL JS | Latest |
| Real-time | Socket.io | Latest |
| Animation | Framer Motion | Latest |
| Icons | Lucide + Phosphor | Latest |
| Queue | BullMQ | Latest |
| Auth | NextAuth.js (web) + JWT (mobile) | Latest |
| Email | Resend | Latest |
| SMS | Termii + Twilio fallback | Latest |

---

## Known Constraints & Technical Debt

> **Section summary:** Limitations and known issues that affect architecture decisions. Agents should be aware of these before proposing changes.

- **Greenfield project** — no existing codebase beyond design assets. All scaffolding is ahead.
- **Mobile-first** — all layouts must work at 375px before expanding to desktop.
- **Nigeria-first** — SMS (Termii) and local payment gateways (Paystack) are primary; international is fallback.
- **Offline resilience** — critical read paths need AsyncStorage/IndexedDB fallback before Phase 4.
- **No Meilisearch yet** — Phase 1 uses PostgreSQL FTS; migration planned for Phase 5.

---

## Architecture History

> **Section summary:** Log of major architectural changes. See also memory/architecture-history.md for full details.

| Date | Change | Reason |
|------|--------|--------|
| 2026-06-09 | Initial architecture defined | Project bootstrap — architecture from ROADMAP.md §1-4 |
