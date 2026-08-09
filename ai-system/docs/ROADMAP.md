# ROADMAP.md ÔÇö Homewolves Architectural Document & AI-Consumable PRD
> **AI Instruction:** This is the single source of truth for all architectural, technical, and product decisions on the Homewolves platform. Read this file before any planning, scaffolding, feature implementation, or refactoring task. Cross-reference with `DESIGN.md` for UI/UX decisions and `ai-system/agents/system-architecture.md` for the live architecture state. Do not introduce patterns, libraries, or structures not defined here without explicit instruction. Where ambiguity exists, prefer the most metadata-driven, OOP-consistent, and admin-configurable interpretation.

---

## 0. Project Identity

| Field | Value |
|---|---|
| **Product Name** | Homewolves |
| **Type** | Multi-sided PropTech Marketplace + Agent CRM + Transaction Management Platform |
| **Market** | Nigeria / Africa (pan-African expansion roadmap) |
| **Version** | 1.0.0 (MVP) |
| **Architecture Style** | Modular monolith ÔåÆ microservices-ready, metadata-driven, OOP |
| **AI System** | `ai-system/` directory is the project brain. Always read before acting. |

---

## 1. Architecture Overview

### 1.1 High-Level Stack

```
ÔöîÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÉ
Ôöé                        CLIENTS                              Ôöé
Ôöé  Web (Next.js 14)  Ôöé  Mobile (React Native / Expo)          Ôöé
Ôöé  PWA (offline-first capability)                             Ôöé
ÔööÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔö¼ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÿ
                         Ôöé HTTPS / WebSocket
ÔöîÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔû╝ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÉ
Ôöé                     API GATEWAY                             Ôöé
Ôöé         (Next.js API Routes / tRPC / REST fallback)         Ôöé
Ôöé         Rate limiting ┬À Auth middleware ┬À RBAC              Ôöé
ÔööÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔö¼ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔö¼ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔö¼ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔö¼ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÿ
       Ôöé           Ôöé           Ôöé              Ôöé
   ÔöîÔöÇÔöÇÔöÇÔû╝ÔöÇÔöÇÔöÇÔöÉ  ÔöîÔöÇÔöÇÔöÇÔû╝ÔöÇÔöÇÔöÇÔöÉ  ÔöîÔöÇÔöÇÔöÇÔû╝ÔöÇÔöÇÔöÇÔöÉ     ÔöîÔöÇÔöÇÔöÇÔöÇÔû╝ÔöÇÔöÇÔöÇÔöÇÔöÉ
   Ôöé Auth  Ôöé  ÔöéListingÔöé  Ôöé  CRM  Ôöé     Ôöé  Trans- Ôöé
   ÔöéServiceÔöé  ÔöéServiceÔöé  ÔöéServiceÔöé     Ôöé  action Ôöé
   ÔööÔöÇÔöÇÔöÇÔö¼ÔöÇÔöÇÔöÇÔöÿ  ÔööÔöÇÔöÇÔöÇÔö¼ÔöÇÔöÇÔöÇÔöÿ  ÔööÔöÇÔöÇÔöÇÔö¼ÔöÇÔöÇÔöÇÔöÿ     Ôöé  ServiceÔöé
       Ôöé           Ôöé           Ôöé         ÔööÔöÇÔöÇÔöÇÔöÇÔö¼ÔöÇÔöÇÔöÇÔöÇÔöÿ
       ÔööÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔö┤ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔö┤ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÿ
                         Ôöé
              ÔöîÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔû╝ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÉ
              Ôöé     Data Layer      Ôöé
              Ôöé  PostgreSQL (main)  Ôöé
              Ôöé  Redis (cache/ws)   Ôöé
              Ôöé  S3-compat (files)  Ôöé
              ÔööÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÿ
```

### 1.2 Architectural Principles

1. **Metadata-driven UI** ÔÇö All configurable UI elements (nav items, filter pills, amenity icons, subscription plan features, notification templates) are stored in the database and served via API. Hardcoded fallbacks exist in `/config/fallbacks.ts` and activate only when the API is unreachable.

2. **Object-Oriented Domain Model** ÔÇö Core entities (User, Listing, Client, Transaction, AuditEvent) are modelled as classes with clear inheritance and interface contracts. Behaviour lives with data.

3. **Admin-Configurable Everything** ÔÇö Feature flags, subscription plan gates, filter options, badge labels, notification copy ÔÇö all editable by admin without code deploy.

4. **Role-Based Access Control (RBAC)** ÔÇö Permissions are not hardcoded in components. Every protected action checks `user.hasPermission(action)` against a permissions matrix stored in config.

5. **Audit by Default** ÔÇö Every mutating database operation emits an `AuditEvent`. This is enforced at the service layer, not the controller layer.

6. **Offline-Resilient** ÔÇö Critical read paths (recently viewed, wishlist, draft listings) have IndexedDB/AsyncStorage fallback. Write operations queue offline and sync on reconnect.

---

## 2. Tech Stack Decisions

### 2.1 Frontend ÔÇö Web

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR/SSG for listings SEO, RSC for performance |
| Language | TypeScript (strict mode) | Type safety across full stack |
| Component library | shadcn/ui (Radix UI + Tailwind) | Unstyled Radix primitives + our design tokens; wrapped in Hw* components ÔÇö never imported directly in feature code |
| Styling | Tailwind CSS + CSS Variables | Design token consumption, utility-first |
| State (server) | TanStack Query v5 | Cache, background refresh, optimistic updates |
| State (client) | Zustand | Lightweight, no boilerplate |
| Forms | React Hook Form + Zod | Schema-validated, no controlled-component bloat |
| Maps | Mapbox GL JS | Cluster support, custom pins, offline tiles |
| Real-time | Socket.io client | Chat, notifications, transaction status |
| Animation | Framer Motion | `prefers-reduced-motion` respected |
| Icons | Lucide React + Phosphor | See DESIGN.md ┬º8 |
| File upload | Uppy | Resumable uploads, S3 direct |
| Testing | Vitest + Testing Library + Playwright | Unit, integration, E2E |

### 2.2 Frontend ÔÇö Mobile

| Concern | Choice |
|---|---|
| Framework | React Native (Expo SDK 51+) |
| Navigation | Expo Router (file-based, mirrors Next.js) |
| Styling | NativeWind (Tailwind for RN) + StyleSheet fallback |
| State | Same as web (TanStack Query + Zustand) |
| Maps | react-native-maps + Mapbox RN |
| Real-time | Socket.io client (same as web) |
| Push notifications | Expo Notifications + FCM/APNs |
| Offline | WatermelonDB for local persistence |
| Camera/gallery | Expo ImagePicker |

### 2.3 Backend

| Concern | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 20 LTS | |
| Framework | NestJS | OOP-native, decorators, modular, DI container |
| API Layer | tRPC (primary) + REST (public/external) | Type-safe client-server, REST for 3rd party |
| ORM | Prisma | Type-safe schema, migrations, relation queries |
| Database | PostgreSQL 16 | JSONB for metadata fields, full-text search |
| Cache | Redis 7 | Session store, rate limit, pub/sub for WS |
| File Storage | AWS S3 / Cloudflare R2 (compatible) | CDN delivery, presigned URLs |
| Auth | NextAuth.js (web) + JWT (mobile) | Session + token hybrid |
| Real-time | Socket.io (NestJS gateway) | Chat, notifications |
| Email | Resend | Transactional email |
| SMS | Termii (Nigeria-first) + Twilio fallback | OTP, notifications |
| WhatsApp | WhatsApp Business API | Transactional fallback |
| Search | PostgreSQL FTS (Phase 1) ÔåÆ Meilisearch (Phase 3) | Progressive enhancement |
| Queue | BullMQ + Redis | Background jobs, email/SMS sending |
| Monitoring | OpenTelemetry + Sentry | Tracing, error tracking |

### 2.4 Infrastructure

| Concern | Choice |
|---|---|
| Hosting (web) | Vercel (Next.js) |
| Hosting (API) | Railway / Render (NestJS containers) |
| Database | Supabase PostgreSQL / Neon (serverless) |
| CDN | Cloudflare |
| CI/CD | GitHub Actions |
| Secrets | Doppler / Vercel env |
| Monitoring | Sentry + Vercel Analytics |

---

## 3. Domain Model (OOP)

### 3.1 Core Entities

```typescript
// ÔöÇÔöÇÔöÇ USER HIERARCHY ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

abstract class BaseUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  verified: boolean;
  preferences: UserPreferences;   // theme, notifications, language
  createdAt: Date;
  updatedAt: Date;

  abstract getPermissions(): Permission[];
  hasPermission(action: Permission): boolean;
  toPublicProfile(): PublicProfile;
}

class GuestUser extends BaseUser { ... }
class Agent extends BaseUser {
  agencyName?: string;
  areasOfOperation: string[];
  subscriptionPlan: SubscriptionPlan;
  referralCode: string;
  commissionRate: number;
  rating: number;
  listings: Listing[];
  clients: Client[];
  getActiveListings(): Listing[];
  getClosedDeals(period: DateRange): Transaction[];
}
class Developer extends BaseUser { portfolio: Project[]; }
class Homeowner extends BaseUser { properties: Listing[]; }
class BuyerClient extends BaseUser {
  wishlist: Listing[];
  savedCollections: SavedCollection[];
  recentlyViewed: RecentlyViewedEntry[];
  transactions: Transaction[];
  assignedAgent?: Agent;
}
class Admin extends BaseUser { ... }
class SuperAdmin extends Admin { ... }

// ÔöÇÔöÇÔöÇ LISTING ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

class Listing {
  id: string;
  title: string;
  description: string;
  price: Money;
  category: ListingCategory;         // SALE | RENT | SHORTLET | LAND
  type: PropertyType;                // APARTMENT | HOUSE | DUPLEX | etc.
  status: ListingStatus;             // DRAFT | PENDING | ACTIVE | SUSPENDED
  verified: boolean;
  featured: boolean;
  location: PropertyLocation;
  media: Media[];
  amenities: AmenityRef[];           // References to AmenityConfig ids
  metadata: Record<string, unknown>; // Extensible without schema migration
  agent?: Agent;
  developer?: Developer;
  homeowner?: Homeowner;
  commission: CommissionConfig;
  viewCount: number;
  enquiryCount: number;
  createdAt: Date;
  updatedAt: Date;

  getShareableLink(): string;
  isAvailable(): boolean;
  getPrimaryImage(): Media;
}

// ÔöÇÔöÇÔöÇ TRANSACTION ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

class Transaction {
  id: string;
  listing: Listing;
  buyer: BuyerClient;
  agent: Agent;
  type: TransactionType;            // PURCHASE | RENTAL | SHORTLET
  status: TransactionStatus;
  steps: TransactionStep[];
  documents: TransactionDocument[];
  payments: PaymentRecord[];
  auditTrail: AuditEvent[];
  createdAt: Date;

  getCurrentStep(): TransactionStep;
  advance(actor: BaseUser, evidence?: Evidence): void;
  reject(actor: Admin, reason: string): void;
  getAuditSummary(): AuditSummary;
}

// ÔöÇÔöÇÔöÇ AUDIT EVENT ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

class AuditEvent {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  actor: ActorRef;                  // { id, role, name }
  timestamp: Date;                  // UTC, immutable
  ipAddress: string;
  deviceFingerprint: string;
  metadata: Record<string, unknown>;
  // No update or delete methods ÔÇö append-only
}
```

### 3.2 Config/Metadata Entities

```typescript
class PlatformConfig {
  amenities: AmenityConfig[];
  filterPills: FilterPillConfig[];
  navItems: NavItemConfig[];
  subscriptionPlans: SubscriptionPlan[];
  featureFlags: FeatureFlag[];
  notificationTemplates: NotificationTemplate[];
  propertyTypes: PropertyTypeConfig[];
  transactionStepTemplates: TransactionStepTemplate[];
  // Fetched at app startup, cached in Redis (5 min TTL)
  // Fallback: /config/fallbacks.ts
}
```

---

## 4. Module Architecture (NestJS)

```
src/
Ôö£ÔöÇÔöÇ app.module.ts
Ôö£ÔöÇÔöÇ config/
Ôöé   Ôö£ÔöÇÔöÇ fallbacks.ts          ÔåÉ hardcoded fallback configs
Ôöé   Ôö£ÔöÇÔöÇ database.config.ts
Ôöé   ÔööÔöÇÔöÇ app.config.ts
Ôö£ÔöÇÔöÇ common/
Ôöé   Ôö£ÔöÇÔöÇ decorators/           ÔåÉ @Roles(), @AuditLog(), @FeatureFlag()
Ôöé   Ôö£ÔöÇÔöÇ guards/               ÔåÉ RbacGuard, JwtGuard, FeatureFlagGuard
Ôöé   Ôö£ÔöÇÔöÇ interceptors/         ÔåÉ AuditInterceptor, ResponseTransform
Ôöé   Ôö£ÔöÇÔöÇ filters/              ÔåÉ GlobalExceptionFilter
Ôöé   ÔööÔöÇÔöÇ pipes/                ÔåÉ ZodValidationPipe
Ôö£ÔöÇÔöÇ modules/
Ôöé   Ôö£ÔöÇÔöÇ auth/
Ôöé   Ôö£ÔöÇÔöÇ users/
Ôöé   Ôö£ÔöÇÔöÇ listings/
Ôöé   Ôö£ÔöÇÔöÇ search/
Ôöé   Ôö£ÔöÇÔöÇ crm/                  ÔåÉ Agent CRM (clients, notes, ratings)
Ôöé   Ôö£ÔöÇÔöÇ transactions/
Ôöé   Ôö£ÔöÇÔöÇ messaging/
Ôöé   Ôö£ÔöÇÔöÇ notifications/
Ôöé   Ôö£ÔöÇÔöÇ analytics/
Ôöé   Ôö£ÔöÇÔöÇ subscriptions/
Ôöé   Ôö£ÔöÇÔöÇ admin/
Ôöé   Ôö£ÔöÇÔöÇ platform-config/      ÔåÉ All admin-configurable metadata
Ôöé   Ôö£ÔöÇÔöÇ audit/                ÔåÉ Audit trail service + repository
Ôöé   Ôö£ÔöÇÔöÇ blog/
Ôöé   ÔööÔöÇÔöÇ ai/                   ÔåÉ Phase 5: AI assistant module
Ôö£ÔöÇÔöÇ jobs/                     ÔåÉ BullMQ job processors
Ôöé   Ôö£ÔöÇÔöÇ email.job.ts
Ôöé   Ôö£ÔöÇÔöÇ sms.job.ts
Ôöé   Ôö£ÔöÇÔöÇ notification.job.ts
Ôöé   ÔööÔöÇÔöÇ analytics.job.ts
ÔööÔöÇÔöÇ prisma/
    ÔööÔöÇÔöÇ schema.prisma
```

---

## 5. Database Schema (Prisma ÔÇö key models)

```prisma
// Key models only ÔÇö see full schema.prisma for complete definition

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  phone         String?   @unique
  role          UserRole
  verified      Boolean   @default(false)
  preferences   Json      @default("{}")  // UserPreferences object
  referralCode  String?   @unique
  referredById  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  listings      Listing[]
  transactions  Transaction[]
  auditEvents   AuditEvent[] @relation("actor")
}

model Listing {
  id            String        @id @default(cuid())
  title         String
  description   String        @db.Text
  price         Decimal       @db.Decimal(18,2)
  currency      String        @default("NGN")
  category      ListingCategory
  propertyType  String        // References PropertyTypeConfig.id
  status        ListingStatus @default(DRAFT)
  verified      Boolean       @default(false)
  featured      Boolean       @default(false)
  metadata      Json          @default("{}")  // Extensible fields
  locationJson  Json          // { state, city, area, lat, lng, address }
  amenityIds    String[]      // References AmenityConfig.id array
  ownerId       String
  agentId       String?
  viewCount     Int           @default(0)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  media         Media[]
  transactions  Transaction[]
  auditEvents   AuditEvent[]
}

model Transaction {
  id            String            @id @default(cuid())
  listingId     String
  buyerId       String
  agentId       String
  type          TransactionType
  status        TransactionStatus @default(INITIATED)
  currentStep   Int               @default(0)
  stepsJson     Json              // TransactionStep[] ÔÇö from template + overrides
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  documents     TransactionDocument[]
  payments      PaymentRecord[]
  auditEvents   AuditEvent[]
}

model AuditEvent {
  id              String    @id @default(cuid())
  entityType      String
  entityId        String
  action          String
  actorId         String
  actorRole       String
  actorName       String
  ipAddress       String?
  deviceInfo      Json?
  metadata        Json      @default("{}")
  timestamp       DateTime  @default(now())
  // NO updatedAt ÔÇö append-only by design
  @@index([entityType, entityId])
  @@index([actorId])
  @@index([timestamp])
}

model PlatformConfig {
  id            String    @id @default(cuid())
  key           String    @unique   // e.g. "amenities", "filter_pills"
  value         Json
  updatedById   String
  updatedAt     DateTime  @updatedAt
}

model RecentlyViewed {
  id            String    @id @default(cuid())
  userId        String?   // null for guest sessions
  sessionId     String?
  listingId     String
  viewedAt      DateTime  @default(now())
  @@index([userId])
  @@index([sessionId])
}

model SavedCollection {
  id            String    @id @default(cuid())
  userId        String
  name          String    // e.g. "Shortlisted", "Shared with spouse"
  listingIds    String[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

---

## 6. API Design

### 6.1 tRPC Routers

```typescript
// Route naming convention: router.action (camelCase)
// All routers are namespaced and type-exported to client

appRouter
Ôö£ÔöÇÔöÇ auth
Ôöé   Ôö£ÔöÇÔöÇ register         // POST ÔÇö email/phone + OTP send
Ôöé   Ôö£ÔöÇÔöÇ verifyOtp        // POST ÔÇö validate OTP, return session
Ôöé   Ôö£ÔöÇÔöÇ login            // POST
Ôöé   Ôö£ÔöÇÔöÇ logout           // POST
Ôöé   ÔööÔöÇÔöÇ refreshToken     // POST
Ôö£ÔöÇÔöÇ listings
Ôöé   Ôö£ÔöÇÔöÇ list             // GET ÔÇö paginated, filtered
Ôöé   Ôö£ÔöÇÔöÇ byId             // GET ÔÇö single listing detail
Ôöé   Ôö£ÔöÇÔöÇ featured         // GET ÔÇö featured listings (homepage)
Ôöé   Ôö£ÔöÇÔöÇ create           // POST ÔÇö auth: agent/developer/homeowner
Ôöé   Ôö£ÔöÇÔöÇ update           // PUT ÔÇö auth: owner
Ôöé   Ôö£ÔöÇÔöÇ delete           // DELETE ÔÇö auth: owner/admin
Ôöé   Ôö£ÔöÇÔöÇ trackView        // POST ÔÇö records view, returns recently viewed
Ôöé   ÔööÔöÇÔöÇ search           // GET ÔÇö FTS with filters
Ôö£ÔöÇÔöÇ savedCollections
Ôöé   Ôö£ÔöÇÔöÇ list             // GET ÔÇö user's collections
Ôöé   Ôö£ÔöÇÔöÇ create           // POST
Ôöé   Ôö£ÔöÇÔöÇ addListing       // POST
Ôöé   Ôö£ÔöÇÔöÇ removeListing    // POST
Ôöé   ÔööÔöÇÔöÇ delete           // DELETE
Ôö£ÔöÇÔöÇ recentlyViewed
Ôöé   Ôö£ÔöÇÔöÇ list             // GET ÔÇö last 20, user or session
Ôöé   ÔööÔöÇÔöÇ clear            // DELETE
Ôö£ÔöÇÔöÇ crm
Ôöé   Ôö£ÔöÇÔöÇ clients.list     // GET ÔÇö agent's clients
Ôöé   Ôö£ÔöÇÔöÇ clients.byId     // GET
Ôöé   Ôö£ÔöÇÔöÇ clients.addNote  // POST
Ôöé   Ôö£ÔöÇÔöÇ clients.rate     // POST
Ôöé   Ôö£ÔöÇÔöÇ inspections.schedule  // POST
Ôöé   Ôö£ÔöÇÔöÇ inspections.list      // GET
Ôöé   ÔööÔöÇÔöÇ inspections.update    // PUT
Ôö£ÔöÇÔöÇ transactions
Ôöé   Ôö£ÔöÇÔöÇ list             // GET ÔÇö by role
Ôöé   Ôö£ÔöÇÔöÇ byId             // GET
Ôöé   Ôö£ÔöÇÔöÇ create           // POST
Ôöé   Ôö£ÔöÇÔöÇ advance          // POST ÔÇö move to next step
Ôöé   Ôö£ÔöÇÔöÇ uploadDocument   // POST ÔÇö presigned URL flow
Ôöé   ÔööÔöÇÔöÇ approve          // POST ÔÇö admin only
Ôö£ÔöÇÔöÇ messaging
Ôöé   Ôö£ÔöÇÔöÇ conversations.list    // GET
Ôöé   Ôö£ÔöÇÔöÇ conversations.byId    // GET + messages
Ôöé   Ôö£ÔöÇÔöÇ messages.send         // POST
Ôöé   ÔööÔöÇÔöÇ messages.markRead     // POST
Ôö£ÔöÇÔöÇ notifications
Ôöé   Ôö£ÔöÇÔöÇ list             // GET
Ôöé   Ôö£ÔöÇÔöÇ markRead         // POST
Ôöé   ÔööÔöÇÔöÇ preferences      // GET/PUT
Ôö£ÔöÇÔöÇ admin
Ôöé   Ôö£ÔöÇÔöÇ listings.queue   // GET ÔÇö pending moderation
Ôöé   Ôö£ÔöÇÔöÇ listings.approve // POST
Ôöé   Ôö£ÔöÇÔöÇ listings.reject  // POST
Ôöé   Ôö£ÔöÇÔöÇ users.list       // GET
Ôöé   Ôö£ÔöÇÔöÇ users.verify     // POST
Ôöé   Ôö£ÔöÇÔöÇ users.suspend    // POST
Ôöé   Ôö£ÔöÇÔöÇ auditLog.list    // GET ÔÇö filterable
Ôöé   Ôö£ÔöÇÔöÇ auditLog.export  // POST ÔÇö CSV/PDF
Ôöé   ÔööÔöÇÔöÇ config.update    // PUT ÔÇö PlatformConfig update
ÔööÔöÇÔöÇ platformConfig
    ÔööÔöÇÔöÇ get              // GET ÔÇö public config (amenities, filters, etc.)
```

### 6.2 REST Endpoints (public/external)

```
GET  /api/v1/listings         ÔÇö public property feed (no auth)
GET  /api/v1/listings/:id     ÔÇö public listing detail
GET  /api/v1/search           ÔÇö public search
POST /api/v1/webhooks/payment ÔÇö payment provider callback
POST /api/v1/webhooks/sms     ÔÇö SMS delivery callback
```

### 6.3 WebSocket Events

```typescript
// Client ÔåÆ Server
'message:send'         { conversationId, content, type }
'message:typing'       { conversationId }
'notification:ack'     { notificationId }

// Server ÔåÆ Client
'message:new'          { message, conversation }
'notification:new'     { notification }
'transaction:updated'  { transactionId, newStatus, step }
'listing:updated'      { listingId, change }
```

---

## 7. Authentication & RBAC

### 7.1 Auth Flow
1. User registers with email/phone ÔåÆ OTP sent via SMS (Termii) + email (Resend)
2. OTP verified ÔåÆ JWT access token (15min) + refresh token (30 days, httpOnly cookie)
3. Social auth (Google): OAuth2 ÔåÆ same JWT issuance
4. Mobile: JWT stored in SecureStore (Expo)
5. Web: access token in memory, refresh token in httpOnly cookie

### 7.2 Permissions Matrix

```typescript
enum Permission {
  // Listings
  LISTING_CREATE, LISTING_UPDATE_OWN, LISTING_DELETE_OWN,
  LISTING_MODERATE, LISTING_FEATURE,
  // CRM
  CRM_VIEW_OWN_CLIENTS, CRM_MANAGE_CLIENTS,
  // Transactions
  TRANSACTION_CREATE, TRANSACTION_ADVANCE, TRANSACTION_APPROVE,
  // Admin
  USER_VERIFY, USER_SUSPEND, AUDIT_LOG_VIEW, AUDIT_LOG_EXPORT,
  CONFIG_UPDATE,
  // Analytics
  ANALYTICS_VIEW_OWN, ANALYTICS_VIEW_ALL,
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  GUEST:       [],
  BUYER:       [TRANSACTION_CREATE, ...],
  AGENT:       [LISTING_CREATE, CRM_VIEW_OWN_CLIENTS, ...],
  DEVELOPER:   [LISTING_CREATE, ANALYTICS_VIEW_OWN, ...],
  HOMEOWNER:   [LISTING_CREATE, ...],
  ADMIN:       [LISTING_MODERATE, USER_VERIFY, TRANSACTION_APPROVE, AUDIT_LOG_VIEW, ...],
  SUPER_ADMIN: [...ALL_PERMISSIONS],
};
// Stored in PlatformConfig, overridable per user for special grants
```

---

## 8. Notification System

### 8.1 Delivery Pipeline

```
Trigger Event ÔåÆ AuditEvent emitted ÔåÆ NotificationJob queued (BullMQ)
ÔåÆ NotificationService resolves template from PlatformConfig
ÔåÆ Parallel dispatch: Push (FCM/APNs) + Email (Resend) + SMS (Termii) + WebSocket
ÔåÆ Delivery status tracked per channel
ÔåÆ WhatsApp fallback if SMS fails after 2 retries
```

### 8.2 Template Structure (admin-configurable)
```typescript
interface NotificationTemplate {
  id: string;
  event: NotificationEvent;       // e.g. "TRANSACTION_APPROVED"
  channels: NotificationChannel[];
  subject: string;                // Handlebars template
  body: string;                   // Handlebars template
  recipients: RecipientRule[];    // e.g. [{role: "BUYER"}, {role: "AGENT"}]
  active: boolean;
}
```

---

## 9. Phased Roadmap

### Phase 1 ÔÇö Marketplace MVP (Weeks 1ÔÇô8)
**Goal:** Public can browse, search, save properties. Agents can list. Basic auth.

**Deliverables:**
- [ ] Project scaffolding (Next.js + NestJS + Prisma + PostgreSQL)
- [ ] `ai-system/` initialised with bootstrap command
- [ ] Auth module (email/phone OTP, JWT, social)
- [ ] PlatformConfig module + fallbacks.ts
- [ ] Listings CRUD (agent/developer/homeowner)
- [ ] Public listing feed + search (FTS)
- [ ] Property Detail page
- [ ] Recently Viewed (session + auth)
- [ ] Save for Later (collections)
- [ ] Wishlist / Interest (agent notified)
- [ ] Basic Audit logging (all mutations)
- [ ] Admin: listing moderation queue
- [ ] WhatsApp contact integration
- [ ] Referral code system
- [ ] Responsive web (mobile-first)
- [ ] React Native app (Expo) ÔÇö listings + auth screens

**Acceptance Criteria:**
- Guest can search, filter, view, and save a property without login
- Agent can register, list a property, and receive a wishlist notification
- Admin can approve/reject a listing
- All mutations produce AuditEvent records

---

### Phase 2 ÔÇö Agent CRM & Collaboration (Weeks 9ÔÇô16)
**Goal:** Agents have a full client management system. Inspections are structured.

**Deliverables:**
- [ ] CRM module: client assignment, notes, ratings, rejection
- [ ] Inspection scheduling (calendar integration)
- [ ] Agent Dashboard (bento grid)
- [ ] Client Dashboard (tabs: transactions, wishlist, recently viewed, documents)
- [ ] In-app messaging (real-time, Socket.io)
- [ ] Push notifications (FCM/APNs)
- [ ] Price drop alerts (saved + recently viewed)
- [ ] New listing match alerts (saved search preferences)
- [ ] Activity points system (gamification config)
- [ ] Referral tracking + commission attribution
- [ ] Full audit trail viewer (per-user, per-entity)

---

### Phase 3 ÔÇö Transaction Workflow System (Weeks 17ÔÇô24)
**Goal:** End-to-end transaction management with payment evidence and approvals.

**Deliverables:**
- [ ] Transaction module (purchase, rental, shortlet workflows)
- [ ] Step-by-step transaction page (stepper UI)
- [ ] Payment evidence upload + admin approval
- [ ] Due diligence checklist (admin-configurable steps)
- [ ] E-signature integration (DocuSeal or equivalent)
- [ ] Document vault (client dashboard)
- [ ] Installment payment tracking
- [ ] Transaction audit trail (per-transaction view + export)
- [ ] Admin transaction approval queue
- [ ] Notification templates for all transaction events

---

### Phase 4 ÔÇö Client Dashboard & Polish (Weeks 25ÔÇô30)
**Goal:** Complete buyer journey. Platform polish. PWA.

**Deliverables:**
- [ ] Full client portal (all dashboard tabs complete)
- [ ] Transaction portfolio view
- [ ] Mobile app parity with web
- [ ] PWA (offline recently viewed, wishlist)
- [ ] SEO optimisation (listing pages, sitemap, meta)
- [ ] Blog module (dynamic CMS)
- [ ] Performance audit (Core Web Vitals targets)
- [ ] Subscription billing integration (Paystack)
- [ ] Featured listing / ad placement system

---

### Phase 5 ÔÇö Intelligence & Automation (Weeks 31+)
**Goal:** Data-driven platform with AI-assisted features.

**Deliverables:**
- [ ] Analytics engine (agent performance, listing performance, funnel)
- [ ] AI chatbot (property Q&A, agent assistant)
- [ ] Smart property recommendations (ML model seeded from recently viewed + saved)
- [ ] Predictive lead scoring for agents
- [ ] Auto follow-up sequences (CRM automation)
- [ ] Meilisearch migration (advanced search)
- [ ] Multi-region deployment (Ghana, Kenya expansion config)

---

## 10. File & Folder Structure

```
homewolves/
Ôö£ÔöÇÔöÇ ai-system/                    ÔåÉ AI brain ÔÇö ALWAYS READ FIRST
Ôöé   Ôö£ÔöÇÔöÇ agents/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ general-instructions.md
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ system-architecture.md
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ project-context.md
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ design-system.md       ÔåÉ mirrors DESIGN.md summary
Ôöé   Ôöé   ÔööÔöÇÔöÇ repair-system.md
Ôöé   Ôö£ÔöÇÔöÇ designs/                   ÔåÉ HTML exports from Open Design ÔåÉ NEW
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ README.md              ÔåÉ index: file ÔåÆ route ÔåÆ theme ÔåÆ status
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ 01-landing-light.html
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ 02-landing-dark.html
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ 03-properties-feed.html
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ 04-property-detail-light.html
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ 05-property-detail-dark.html
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ 06-agent-dashboard-light.html
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ 07-agent-dashboard-dark.html
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ 08-client-dashboard.html
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ 09-transaction-workflow.html
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ 10-auth-flow.html
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ 11-messaging.html
Ôöé   Ôöé   ÔööÔöÇÔöÇ 12-admin-panel.html
Ôöé   Ôö£ÔöÇÔöÇ planning/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ project-plan.md
Ôöé   Ôöé   ÔööÔöÇÔöÇ task-queue.md
Ôöé   Ôö£ÔöÇÔöÇ commands/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ bootstrap-project.md
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ dev-cycle.md
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ plan-feature.md
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ fix-build.md
Ôöé   Ôöé   ÔööÔöÇÔöÇ update-ai-system.md
Ôöé   Ôö£ÔöÇÔöÇ checkpoints/
Ôöé   Ôöé   ÔööÔöÇÔöÇ session-log.md
Ôöé   Ôö£ÔöÇÔöÇ memory/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ project-decisions.md
Ôöé   Ôöé   ÔööÔöÇÔöÇ lessons-learned.md
Ôöé   Ôö£ÔöÇÔöÇ index/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ repo-map.md
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ dependency-graph.md
Ôöé   Ôöé   ÔööÔöÇÔöÇ file-summaries/
Ôöé   ÔööÔöÇÔöÇ testing/
Ôöé       ÔööÔöÇÔöÇ test-results.md
Ôöé
Ôö£ÔöÇÔöÇ .ai-context.md
Ôö£ÔöÇÔöÇ DESIGN.md
Ôö£ÔöÇÔöÇ ROADMAP.md
Ôöé
Ôö£ÔöÇÔöÇ apps/
Ôöé   Ôö£ÔöÇÔöÇ web/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ app/
Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ (public)/
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ page.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ properties/
Ôöé   Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ page.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôöé   ÔööÔöÇÔöÇ [id]/page.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ blog/
Ôöé   Ôöé   Ôöé   Ôöé   ÔööÔöÇÔöÇ auth/
Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ (dashboard)/
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ dashboard/
Ôöé   Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ agent/
Ôöé   Ôöé   Ôöé   Ôöé   Ôöé   ÔööÔöÇÔöÇ client/
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ transactions/
Ôöé   Ôöé   Ôöé   Ôöé   ÔööÔöÇÔöÇ messages/
Ôöé   Ôöé   Ôöé   ÔööÔöÇÔöÇ (admin)/
Ôöé   Ôöé   Ôöé       ÔööÔöÇÔöÇ admin/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ components/
Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ ui/                ÔåÉ ALL Hw* wrappers ÔÇö the only import path for UI primitives
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ HwButton.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ HwInput.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ HwDialog.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ HwSelect.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ HwTabs.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ HwSheet.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ HwBadge.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ HwCard.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ HwDropdown.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ HwTooltip.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ HwTable.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ HwAvatar.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ HwSkeleton.tsx
Ôöé   Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ HwForm.tsx
Ôöé   Ôöé   Ôöé   Ôöé   ÔööÔöÇÔöÇ index.ts       ÔåÉ barrel ÔÇö only this is imported by feature code
Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ listings/
Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ dashboard/
Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ transactions/
Ôöé   Ôöé   Ôöé   ÔööÔöÇÔöÇ shared/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ hooks/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ lib/
Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ trpc.ts
Ôöé   Ôöé   Ôöé   ÔööÔöÇÔöÇ socket.ts
Ôöé   Ôöé   ÔööÔöÇÔöÇ config/
Ôöé   Ôöé       ÔööÔöÇÔöÇ fallbacks.ts
Ôöé   Ôöé
Ôöé   ÔööÔöÇÔöÇ mobile/
Ôöé       Ôö£ÔöÇÔöÇ app/
Ôöé       Ôö£ÔöÇÔöÇ components/
Ôöé       Ôöé   ÔööÔöÇÔöÇ ui/                ÔåÉ Same Hw* wrapper pattern for React Native
Ôöé       Ôö£ÔöÇÔöÇ hooks/
Ôöé       ÔööÔöÇÔöÇ config/
Ôöé           ÔööÔöÇÔöÇ fallbacks.ts
Ôöé
Ôö£ÔöÇÔöÇ packages/
Ôöé   Ôö£ÔöÇÔöÇ api/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ src/
Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ modules/
Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ common/
Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ jobs/
Ôöé   Ôöé   Ôöé   ÔööÔöÇÔöÇ prisma/
Ôöé   Ôöé   ÔööÔöÇÔöÇ prisma/
Ôöé   Ôöé       ÔööÔöÇÔöÇ schema.prisma
Ôöé   Ôö£ÔöÇÔöÇ types/                     ÔåÉ Shared global types ÔÇö consumed everywhere, imported nowhere
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ src/
Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ entities/          ÔåÉ User, Listing, Transaction, AuditEvent, etc.
Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ api/               ÔåÉ tRPC router types, request/response shapes
Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ config/            ÔåÉ PlatformConfig, FeatureFlag, all Config interfaces
Ôöé   Ôöé   Ôöé   Ôö£ÔöÇÔöÇ ui/                ÔåÉ Hw*Props interfaces, ComponentConfig types
Ôöé   Ôöé   Ôöé   ÔööÔöÇÔöÇ global.d.ts        ÔåÉ Triple-slash refs ÔÇö makes all types globally available
Ôöé   Ôöé   ÔööÔöÇÔöÇ tsconfig.json
Ôöé   ÔööÔöÇÔöÇ config/
Ôöé       ÔööÔöÇÔöÇ src/
Ôöé           ÔööÔöÇÔöÇ fallbacks.ts
Ôöé
ÔööÔöÇÔöÇ package.json                   ÔåÉ Turborepo monorepo root
```

---

## 11. Development Patterns & Conventions

### 11.1 shadcn/ui Wrapper Convention
Every shadcn/ui primitive is wrapped once in `components/ui/Hw*.tsx`. Feature code only ever imports from `@/components/ui` (the barrel). See DESIGN.md ┬º3.0 for full rationale and pattern. The wrapper accepts a `config?: ComponentConfig` prop and falls back to `FALLBACK_*` constants. All `Hw*Props` interfaces live in `packages/types/src/ui/` and are globally available ÔÇö no import needed.

### 11.2 Naming
- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- Components: PascalCase, co-located `index.ts` barrel
- API routes (tRPC): `router.action` camelCase
- Database: `snake_case` columns, `PascalCase` models
- CSS classes: Tailwind utilities only ÔÇö no custom class names except `glass-surface`, `bento-*`

### 11.2 Component Pattern
```typescript
// Every component follows this structure:
interface PropertyCardProps {
  listing: Listing;
  variant?: 'default' | 'compact' | 'featured' | 'horizontal';
  onSave?: (id: string) => void;
  config?: PropertyCardConfig;  // Admin-injected display config
}

// Config-first: display decisions come from config, not props
// Fallback: if config undefined, use FALLBACK_PROPERTY_CARD_CONFIG
export function PropertyCard({ listing, variant = 'default', config }: PropertyCardProps) {
  const displayConfig = config ?? FALLBACK_PROPERTY_CARD_CONFIG;
  // ...
}
```

### 11.3 Service Pattern (NestJS)
```typescript
@Injectable()
export class ListingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,        // Always injected
    private config: PlatformConfigService,
    private queue: NotificationQueue,
  ) {}

  async create(dto: CreateListingDto, actor: User): Promise<Listing> {
    const listing = await this.prisma.listing.create({ data: dto });
    await this.audit.log({                // Every mutation ÔåÆ audit event
      entityType: 'Listing',
      entityId: listing.id,
      action: 'CREATED',
      actor,
    });
    return listing;
  }
}
```

### 11.4 Feature Flag Usage
```typescript
// In components
const { enabled } = useFeatureFlag('map_view');
if (!enabled) return <ListView />;
return <MapSplitView />;

// In API (NestJS guard)
@UseGuards(FeatureFlagGuard('e_signature'))
@Post('sign')
async signDocument() { ... }
```

### 11.5 Error Handling
- All errors extend `HomewolvesError` base class with `code`, `message`, `statusCode`
- Client errors (4xx): returned as structured JSON `{ code, message, field? }`
- Server errors (5xx): logged to Sentry, generic message to client
- Form errors: Zod schema failures mapped to field-level errors via RHF

---

## 12. ai-system Integration

### 12.1 Session Start Protocol
Every AI coding session MUST begin with:
```
Read .ai-context.md, DESIGN.md, ROADMAP.md, and ai-system/agents/general-instructions.md
before any action. Report current task-queue.md status then proceed.
```

### 12.2 Key ai-system Files for This Project

| File | Content |
|---|---|
| `.ai-context.md` | Project identity, stack summary, key modules overview |
| `agents/general-instructions.md` | Coding standards, OOP rules, metadata-driven pattern enforcement |
| `agents/system-architecture.md` | Live architecture state (updated after each major feature) |
| `agents/design-system.md` | Summary of DESIGN.md tokens and component rules |
| `agents/repair-system.md` | Known gotchas (Prisma relations, tRPC inference, RN navigation) |
| `planning/task-queue.md` | Current sprint tasks in priority order |
| `planning/project-plan.md` | Phase checklist (mirrors ┬º9 of this ROADMAP) |
| `memory/project-decisions.md` | Why NestJS over Express, why tRPC, etc. |

### 12.3 Bootstrap Command for This Project
```
Execute command: ai-system/commands/bootstrap-project.md
Directive: This is a Next.js 14 + NestJS + Prisma + PostgreSQL monorepo.
The product is Homewolves ÔÇö an African real estate PropTech platform.
Architecture is metadata-driven and OOP. Key patterns:
- PlatformConfig drives all UI configuration with fallbacks in /config/fallbacks.ts
- Every mutation emits an AuditEvent via AuditService
- RBAC via Permission enum + role matrix in PlatformConfig
- tRPC for internal API, REST for public endpoints
Reference DESIGN.md for all UI decisions. Reference ROADMAP.md for architecture.
Do not hardcode labels, icons, or feature gates ÔÇö always resolve from config.
```

---

## 13. Performance Targets

| Metric | Target | Measurement |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | Vercel Analytics |
| FID / INP | < 100ms | Chrome UX Report |
| CLS | < 0.1 | Lighthouse |
| API p95 response time | < 300ms | OpenTelemetry |
| App load (mobile, 4G) | < 3s | Expo performance monitor |
| WebSocket reconnect | < 2s | Socket.io ping |
| Image CDN delivery | < 200ms | Cloudflare analytics |

---

## 14. Security Requirements

- All endpoints: HTTPS only, HSTS enabled
- Auth: JWT with short expiry (15min), refresh rotation
- File uploads: virus scan (ClamAV or cloud equivalent) before storage
- RBAC: enforced at service layer, not just route guard
- Audit log: write-once, stored in separate append-only Postgres partition
- PII: encrypted at rest (Postgres column encryption for phone, email)
- NDPR compliance: data residency in Nigeria region, privacy policy enforced in onboarding
- Rate limiting: 100 req/min per IP on public endpoints, 500 req/min authenticated
- Input validation: Zod schemas on all API inputs, no raw SQL

---

## 15. Glossary

| Term | Definition |
|---|---|
| PlatformConfig | Database-stored configuration that drives all admin-configurable UI and behaviour |
| AuditEvent | Immutable record of any state-changing action on the platform |
| BuyerClient | User role representing a property buyer/renter |
| Listing | A property entry (sale, rent, shortlet, or land) |
| SavedCollection | Named group of listings saved by a user (distinct from Wishlist) |
| RecentlyViewed | Auto-tracked list of last 20 listings viewed per user/session |
| Wishlist | Formal interest expression that triggers agent notification |
| Transaction | Full lifecycle record from inspection to deal completion |
| TransactionStep | A single stage in a transaction workflow (admin-configurable template) |
| FeatureFlag | Admin-togglable boolean that gates UI features by role/rollout % |
| Bento Grid | Dashboard layout of variable-size glass-surface cells |
| RBAC | Role-Based Access Control ÔÇö permissions resolved from role matrix config |
| NDPR | Nigeria Data Protection Regulation |

---

## 16. Global Types & Interfaces

All TypeScript types, interfaces, and enums for this project are defined once in `packages/types/` and made globally available across the entire monorepo ÔÇö **no import statement required in any consuming file**.

### 16.1 How It Works

```
packages/types/
Ôö£ÔöÇÔöÇ src/
Ôöé   Ôö£ÔöÇÔöÇ entities/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ user.types.ts           ÔåÉ BaseUser, Agent, BuyerClient, UserRole, Permission, etc.
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ listing.types.ts        ÔåÉ Listing, ListingCategory, ListingStatus, Money, etc.
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ transaction.types.ts    ÔåÉ Transaction, TransactionStep, TransactionStatus, etc.
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ audit.types.ts          ÔåÉ AuditEvent, AuditEntityType, ActorRef, etc.
Ôöé   Ôöé   ÔööÔöÇÔöÇ notification.types.ts   ÔåÉ NotificationTemplate, NotificationEvent, etc.
Ôöé   Ôö£ÔöÇÔöÇ config/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ platform-config.types.ts ÔåÉ PlatformConfig, FeatureFlag, AmenityConfig, etc.
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ filter.types.ts          ÔåÉ FilterPillConfig, NavItemConfig, etc.
Ôöé   Ôöé   ÔööÔöÇÔöÇ subscription.types.ts   ÔåÉ SubscriptionPlan, PlanFeature, etc.
Ôöé   Ôö£ÔöÇÔöÇ api/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ trpc.types.ts           ÔåÉ tRPC input/output shapes
Ôöé   Ôöé   ÔööÔöÇÔöÇ rest.types.ts           ÔåÉ Public REST request/response types
Ôöé   Ôö£ÔöÇÔöÇ ui/
Ôöé   Ôöé   Ôö£ÔöÇÔöÇ component-config.types.ts ÔåÉ ComponentConfig, PropertyCardConfig, BentoCellConfig, etc.
Ôöé   Ôöé   ÔööÔöÇÔöÇ hw-props.types.ts        ÔåÉ HwButtonProps, HwInputProps, HwDialogProps, etc. (all Hw* prop interfaces)
Ôöé   ÔööÔöÇÔöÇ global.d.ts                  ÔåÉ Triple-slash references ÔÇö pulls everything into global scope
ÔööÔöÇÔöÇ tsconfig.json
```

### 16.2 global.d.ts ÔÇö The Injection Point

```typescript
// packages/types/src/global.d.ts
// This file makes all Homewolves types globally available.
// No import needed in any file in the monorepo.

/// <reference path="./entities/user.types.ts" />
/// <reference path="./entities/listing.types.ts" />
/// <reference path="./entities/transaction.types.ts" />
/// <reference path="./entities/audit.types.ts" />
/// <reference path="./entities/notification.types.ts" />
/// <reference path="./config/platform-config.types.ts" />
/// <reference path="./config/filter.types.ts" />
/// <reference path="./config/subscription.types.ts" />
/// <reference path="./api/trpc.types.ts" />
/// <reference path="./api/rest.types.ts" />
/// <reference path="./ui/component-config.types.ts" />
/// <reference path="./ui/hw-props.types.ts" />
```

### 16.3 TypeScript Config Setup

Each app's and package's `tsconfig.json` extends the base and includes the global types package:

```json
// tsconfig.base.json (monorepo root)
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@hw/types": ["./packages/types/src"],
      "@/components/ui": ["./apps/web/components/ui/index.ts"]
    }
  }
}

// apps/web/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "typeRoots": ["../../packages/types/src", "./node_modules/@types"],
    "types": []
  },
  "include": ["**/*.ts", "**/*.tsx", "../../packages/types/src/global.d.ts"]
}

// packages/api/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "typeRoots": ["../../packages/types/src", "./node_modules/@types"]
  },
  "include": ["src/**/*.ts", "../../packages/types/src/global.d.ts"]
}
```

### 16.4 Usage in Practice

```typescript
// Ô£à In any file ÔÇö no import needed
function processListing(listing: Listing): string {
  return listing.title;
}

// Ô£à Enums are also globally available
const role: UserRole = UserRole.AGENT;
const status: ListingStatus = ListingStatus.ACTIVE;

// Ô£à Component props ÔÇö no import needed
function PropertyCard({ listing, config }: PropertyCardConfig) { ... }

// Ô£à API shapes ÔÇö no import needed
async function createListing(dto: CreateListingDto): Promise<Listing> { ... }

// ÔØî WRONG ÔÇö never import types that are in packages/types
import { Listing } from '@hw/types';   // unnecessary ÔÇö already global
import { UserRole } from '../../types'; // unnecessary ÔÇö already global
```

### 16.5 Conventions for Type Definitions

- **Interfaces** for object shapes: `interface Listing { ... }` ÔÇö extendable, preferred for entities
- **Type aliases** for unions and computed shapes: `type ListingStatus = 'DRAFT' | 'ACTIVE' | ...`
- **Enums** for fixed sets used in switch statements and DB columns: `enum UserRole { AGENT = 'AGENT', ... }`
- **No `any`** ÔÇö use `unknown` for truly unknown shapes and narrow with type guards
- **No inline type definitions** in component files ÔÇö all types belong in `packages/types/`
- Prisma-generated types (`PrismaClient`, model types) are **not** re-exported from `packages/types` ÔÇö use them only in the API package via direct Prisma import. The shared interfaces in `packages/types` are the canonical contract; Prisma types are an implementation detail.

---

*End of ROADMAP.md ÔÇö This document is the architectural contract for Homewolves v1.0. AI models must not override decisions documented here without explicit human instruction. All deviations must be logged in `ai-system/memory/project-decisions.md` with rationale.*