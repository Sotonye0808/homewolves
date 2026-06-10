# Dependency Graph

> **Overview:** Maps how modules depend on each other in the Homewolves NestJS backend. Agents consult this before modifying a module to understand the impact radius. Updated when new dependencies are introduced or modules are refactored. Currently reflects the target architecture from ROADMAP.md — actual code is yet to be written.

---

## Module Dependency Map

> **Section summary:** A text diagram showing dependency direction. Arrows point from consumer → dependency.

```
AuthModule
  → UsersModule (lookup users)
  → PrismaModule (database access)

UsersModule
  → PrismaModule

ListingsModule
  → UsersModule (owner/agent references)
  → AuditModule (log mutations)
  → NotificationsModule (wishlist alerts)
  → PlatformConfigModule (amenities, property types)
  → PrismaModule

SearchModule
  → ListingsModule (query listings)
  → PlatformConfigModule (filter config)
  → PrismaModule

CrmModule
  → UsersModule (client/agent references)
  → ListingsModule (property assignment)
  → AuditModule (log mutations)
  → NotificationsModule (inspection reminders)
  → PrismaModule

TransactionsModule
  → ListingsModule (property reference)
  → UsersModule (buyer/agent references)
  → AuditModule (log every step)
  → NotificationsModule (step change alerts)
  → PlatformConfigModule (step templates)
  → PrismaModule

MessagingModule
  → UsersModule (participant resolution)
  → ListingsModule (property context)
  → PrismaModule

NotificationsModule
  → UsersModule (preferences, devices)
  → PlatformConfigModule (templates)
  → BullMQ (job queue)
  → Resend (email), Termii (SMS), FCM/APNs (push)

AnalyticsModule
  → ListingsModule (views, enquiries)
  → TransactionsModule (closed deals)
  → PrismaModule
  → Redis (aggregations)

SubscriptionsModule
  → UsersModule (plan assignment)
  → PrismaModule
  → Paystack (billing)

AdminModule
  → ListingsModule (moderation)
  → UsersModule (user management)
  → TransactionsModule (approval queue)
  → AuditModule (log viewer)
  → PlatformConfigModule (config updates)
  → PrismaModule

PlatformConfigModule
  → PrismaModule (read/write)
  → Redis (cache, 5min TTL)

AuditModule
  → PrismaModule (append-only writes)

BlogModule
  → PrismaModule
```

---

## Client Dependencies

> **Section summary:** Frontend apps and packages dependencies.

```
apps/web (Next.js 14)
  → packages/types (global types — zero-import)
  → packages/config (fallbacks — compiled/bundled)
  → packages/api (tRPC client — type-safe RPC)
  → shadcn/ui (Radix primitives — through Hw* wrappers only)
  → TanStack Query (server state)
  → Zustand (client state)
  → React Hook Form + Zod (forms)
  → Mapbox GL JS (maps)
  → Socket.io client (real-time)
  → Framer Motion (animation)
  → Lucide + Phosphor (icons)
  → Uppy (file upload)

apps/mobile (React Native / Expo)
  → packages/types (global types)
  → packages/config (fallbacks)
  → packages/api (tRPC client)
  → NativeWind (styling)
  → react-native-maps + Mapbox RN
  → Socket.io client
  → WatermelonDB (offline)
  → Expo Notifications + FCM/APNs
```

---

## External Dependencies

> **Section summary:** Third-party services and what they provide.

| Service | Purpose | Used In |
|---------|---------|---------|
| PostgreSQL 16 | Primary database | All modules via Prisma |
| Redis 7 | Cache, session store, BullMQ queue | PlatformConfig, Auth, Notifications, Analytics |
| Cloudflare R2 / AWS S3 | File/image storage | Listings (media upload) |
| Mapbox GL JS | Map tiles, geocoding, clustering | Listings (property location) |
| Resend | Transactional email | Notifications |
| Termii | SMS delivery (primary) | Auth (OTP), Notifications |
| Twilio | SMS fallback | Notifications |
| WhatsApp Business API | Messaging fallback | Messaging |
| Paystack | Payment processing | Subscriptions |
| Sentry | Error tracking, performance | All backend modules |
| Google OAuth | Social auth | Auth |
| Apple OAuth | Social auth | Auth |

---

## Circular Dependency Warnings

> **Section summary:** Any detected circular dependencies that need to be resolved.

- **None detected in current architecture.** NestJS modules are designed with unidirectional dependency flow. Services that need to call each other (e.g., Listings ↔ Notifications) use NestJS's forward reference (`@Inject(forwardRef(() => Service))`) or event-driven patterns via BullMQ.

---

## Dependency Rules

> **Section summary:** Rules about which modules may depend on which others. Prevents architectural decay.

- **Controllers** → Services (not the other way around)
- **Services** → Repositories/Prisma (not the other way around)
- **Common module** (decorators, guards, interceptors) → No application modules
- **AuditModule** → Prisma only — no circular reference with business modules
- **PlatformConfigModule** → Prisma + Redis only — no business logic dependencies
- **Types package** → Zero dependencies — pure interfaces, types, and enums
- **Config package** → Zero runtime dependencies — plain objects and functions
- **UI components** → `@/components/ui` barrel only — never import shadcn directly
