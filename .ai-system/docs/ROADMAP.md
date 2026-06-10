# ROADMAP.md — Homewolves Architectural Document & AI-Consumable PRD
> **AI Instruction:** This is the single source of truth for all architectural, technical, and product decisions on the Homewolves platform. Read this file before any planning, scaffolding, feature implementation, or refactoring task. Cross-reference with `DESIGN.md` for UI/UX decisions and `.ai-system/agents/system-architecture.md` for the live architecture state. Do not introduce patterns, libraries, or structures not defined here without explicit instruction. Where ambiguity exists, prefer the most metadata-driven, OOP-consistent, and admin-configurable interpretation.

---

## 0. Project Identity

| Field | Value |
|---|---|
| **Product Name** | Homewolves |
| **Type** | Multi-sided PropTech Marketplace + Agent CRM + Transaction Management Platform |
| **Market** | Nigeria / Africa (pan-African expansion roadmap) |
| **Version** | 1.0.0 (MVP) |
| **Architecture Style** | Modular monolith → microservices-ready, metadata-driven, OOP |
| **AI System** | `.ai-system/` directory is the project brain. Always read before acting. |

---

## 1. Architecture Overview

### 1.1 High-Level Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│  Web (Next.js 14)  │  Mobile (React Native / Expo)          │
│  PWA (offline-first capability)                             │
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

### 1.2 Architectural Principles

1. **Metadata-driven UI** — All configurable UI elements (nav items, filter pills, amenity icons, subscription plan features, notification templates) are stored in the database and served via API. Hardcoded fallbacks exist in `/config/fallbacks.ts` and activate only when the API is unreachable.

2. **Object-Oriented Domain Model** — Core entities (User, Listing, Client, Transaction, AuditEvent) are modelled as classes with clear inheritance and interface contracts. Behaviour lives with data.

3. **Admin-Configurable Everything** — Feature flags, subscription plan gates, filter options, badge labels, notification copy — all editable by admin without code deploy.

4. **Role-Based Access Control (RBAC)** — Permissions are not hardcoded in components. Every protected action checks `user.hasPermission(action)` against a permissions matrix stored in config.

5. **Audit by Default** — Every mutating database operation emits an `AuditEvent`. This is enforced at the service layer, not the controller layer.

6. **Offline-Resilient** — Critical read paths (recently viewed, wishlist, draft listings) have IndexedDB/AsyncStorage fallback. Write operations queue offline and sync on reconnect.

---

## 2. Tech Stack Decisions

### 2.1 Frontend — Web

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR/SSG for listings SEO, RSC for performance |
| Language | TypeScript (strict mode) | Type safety across full stack |
| Component library | shadcn/ui (Radix UI + Tailwind) | Unstyled Radix primitives + our design tokens; wrapped in Hw* components — never imported directly in feature code |
| Styling | Tailwind CSS + CSS Variables | Design token consumption, utility-first |
| State (server) | TanStack Query v5 | Cache, background refresh, optimistic updates |
| State (client) | Zustand | Lightweight, no boilerplate |
| Forms | React Hook Form + Zod | Schema-validated, no controlled-component bloat |
| Maps | Mapbox GL JS | Cluster support, custom pins, offline tiles |
| Real-time | Socket.io client | Chat, notifications, transaction status |
| Animation | Framer Motion | `prefers-reduced-motion` respected |
| Icons | Lucide React + Phosphor | See DESIGN.md §8 |
| File upload | Uppy | Resumable uploads, S3 direct |
| Testing | Vitest + Testing Library + Playwright | Unit, integration, E2E |

### 2.2 Frontend — Mobile

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
| Search | PostgreSQL FTS (Phase 1) → Meilisearch (Phase 3) | Progressive enhancement |
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
// ─── USER HIERARCHY ───────────────────────────────────────────

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

// ─── LISTING ──────────────────────────────────────────────────

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

// ─── TRANSACTION ──────────────────────────────────────────────

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

// ─── AUDIT EVENT ──────────────────────────────────────────────

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
  // No update or delete methods — append-only
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
├── app.module.ts
├── config/
│   ├── fallbacks.ts          ← hardcoded fallback configs
│   ├── database.config.ts
│   └── app.config.ts
├── common/
│   ├── decorators/           ← @Roles(), @AuditLog(), @FeatureFlag()
│   ├── guards/               ← RbacGuard, JwtGuard, FeatureFlagGuard
│   ├── interceptors/         ← AuditInterceptor, ResponseTransform
│   ├── filters/              ← GlobalExceptionFilter
│   └── pipes/                ← ZodValidationPipe
├── modules/
│   ├── auth/
│   ├── users/
│   ├── listings/
│   ├── search/
│   ├── crm/                  ← Agent CRM (clients, notes, ratings)
│   ├── transactions/
│   ├── messaging/
│   ├── notifications/
│   ├── analytics/
│   ├── subscriptions/
│   ├── admin/
│   ├── platform-config/      ← All admin-configurable metadata
│   ├── audit/                ← Audit trail service + repository
│   ├── blog/
│   └── ai/                   ← Phase 5: AI assistant module
├── jobs/                     ← BullMQ job processors
│   ├── email.job.ts
│   ├── sms.job.ts
│   ├── notification.job.ts
│   └── analytics.job.ts
└── prisma/
    └── schema.prisma
```

---

## 5. Database Schema (Prisma — key models)

```prisma
// Key models only — see full schema.prisma for complete definition

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
  stepsJson     Json              // TransactionStep[] — from template + overrides
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
  // NO updatedAt — append-only by design
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
├── auth
│   ├── register         // POST — email/phone + OTP send
│   ├── verifyOtp        // POST — validate OTP, return session
│   ├── login            // POST
│   ├── logout           // POST
│   └── refreshToken     // POST
├── listings
│   ├── list             // GET — paginated, filtered
│   ├── byId             // GET — single listing detail
│   ├── featured         // GET — featured listings (homepage)
│   ├── create           // POST — auth: agent/developer/homeowner
│   ├── update           // PUT — auth: owner
│   ├── delete           // DELETE — auth: owner/admin
│   ├── trackView        // POST — records view, returns recently viewed
│   └── search           // GET — FTS with filters
├── savedCollections
│   ├── list             // GET — user's collections
│   ├── create           // POST
│   ├── addListing       // POST
│   ├── removeListing    // POST
│   └── delete           // DELETE
├── recentlyViewed
│   ├── list             // GET — last 20, user or session
│   └── clear            // DELETE
├── crm
│   ├── clients.list     // GET — agent's clients
│   ├── clients.byId     // GET
│   ├── clients.addNote  // POST
│   ├── clients.rate     // POST
│   ├── inspections.schedule  // POST
│   ├── inspections.list      // GET
│   └── inspections.update    // PUT
├── transactions
│   ├── list             // GET — by role
│   ├── byId             // GET
│   ├── create           // POST
│   ├── advance          // POST — move to next step
│   ├── uploadDocument   // POST — presigned URL flow
│   └── approve          // POST — admin only
├── messaging
│   ├── conversations.list    // GET
│   ├── conversations.byId    // GET + messages
│   ├── messages.send         // POST
│   └── messages.markRead     // POST
├── notifications
│   ├── list             // GET
│   ├── markRead         // POST
│   └── preferences      // GET/PUT
├── admin
│   ├── listings.queue   // GET — pending moderation
│   ├── listings.approve // POST
│   ├── listings.reject  // POST
│   ├── users.list       // GET
│   ├── users.verify     // POST
│   ├── users.suspend    // POST
│   ├── auditLog.list    // GET — filterable
│   ├── auditLog.export  // POST — CSV/PDF
│   └── config.update    // PUT — PlatformConfig update
└── platformConfig
    └── get              // GET — public config (amenities, filters, etc.)
```

### 6.2 REST Endpoints (public/external)

```
GET  /api/v1/listings         — public property feed (no auth)
GET  /api/v1/listings/:id     — public listing detail
GET  /api/v1/search           — public search
POST /api/v1/webhooks/payment — payment provider callback
POST /api/v1/webhooks/sms     — SMS delivery callback
```

### 6.3 WebSocket Events

```typescript
// Client → Server
'message:send'         { conversationId, content, type }
'message:typing'       { conversationId }
'notification:ack'     { notificationId }

// Server → Client
'message:new'          { message, conversation }
'notification:new'     { notification }
'transaction:updated'  { transactionId, newStatus, step }
'listing:updated'      { listingId, change }
```

---

## 7. Authentication & RBAC

### 7.1 Auth Flow
1. User registers with email/phone → OTP sent via SMS (Termii) + email (Resend)
2. OTP verified → JWT access token (15min) + refresh token (30 days, httpOnly cookie)
3. Social auth (Google): OAuth2 → same JWT issuance
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
Trigger Event → AuditEvent emitted → NotificationJob queued (BullMQ)
→ NotificationService resolves template from PlatformConfig
→ Parallel dispatch: Push (FCM/APNs) + Email (Resend) + SMS (Termii) + WebSocket
→ Delivery status tracked per channel
→ WhatsApp fallback if SMS fails after 2 retries
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

### Phase 1 — Marketplace MVP (Weeks 1–8)
**Goal:** Public can browse, search, save properties. Agents can list. Basic auth.

**Deliverables:**
- [ ] Project scaffolding (Next.js + NestJS + Prisma + PostgreSQL)
- [ ] `.ai-system/` initialised with bootstrap command
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
- [ ] React Native app (Expo) — listings + auth screens

**Acceptance Criteria:**
- Guest can search, filter, view, and save a property without login
- Agent can register, list a property, and receive a wishlist notification
- Admin can approve/reject a listing
- All mutations produce AuditEvent records

---

### Phase 2 — Agent CRM & Collaboration (Weeks 9–16)
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

### Phase 3 — Transaction Workflow System (Weeks 17–24)
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

### Phase 4 — Client Dashboard & Polish (Weeks 25–30)
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

### Phase 5 — Intelligence & Automation (Weeks 31+)
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
├── .ai-system/                    ← AI brain — ALWAYS READ FIRST
│   ├── agents/
│   │   ├── general-instructions.md
│   │   ├── system-architecture.md
│   │   ├── project-context.md
│   │   ├── design-system.md       ← mirrors DESIGN.md summary
│   │   └── repair-system.md
│   ├── designs/                   ← HTML exports from Open Design ← NEW
│   │   ├── README.md              ← index: file → route → theme → status
│   │   ├── 01-landing-light.html
│   │   ├── 02-landing-dark.html
│   │   ├── 03-properties-feed.html
│   │   ├── 04-property-detail-light.html
│   │   ├── 05-property-detail-dark.html
│   │   ├── 06-agent-dashboard-light.html
│   │   ├── 07-agent-dashboard-dark.html
│   │   ├── 08-client-dashboard.html
│   │   ├── 09-transaction-workflow.html
│   │   ├── 10-auth-flow.html
│   │   ├── 11-messaging.html
│   │   └── 12-admin-panel.html
│   ├── planning/
│   │   ├── project-plan.md
│   │   └── task-queue.md
│   ├── commands/
│   │   ├── bootstrap-project.md
│   │   ├── dev-cycle.md
│   │   ├── plan-feature.md
│   │   ├── fix-build.md
│   │   └── update-ai-system.md
│   ├── checkpoints/
│   │   └── session-log.md
│   ├── memory/
│   │   ├── project-decisions.md
│   │   └── lessons-learned.md
│   ├── index/
│   │   ├── repo-map.md
│   │   ├── dependency-graph.md
│   │   └── file-summaries/
│   └── testing/
│       └── test-results.md
│
├── .ai-context.md
├── DESIGN.md
├── ROADMAP.md
│
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── properties/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── blog/
│   │   │   │   └── auth/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── agent/
│   │   │   │   │   └── client/
│   │   │   │   ├── transactions/
│   │   │   │   └── messages/
│   │   │   └── (admin)/
│   │   │       └── admin/
│   │   ├── components/
│   │   │   ├── ui/                ← ALL Hw* wrappers — the only import path for UI primitives
│   │   │   │   ├── HwButton.tsx
│   │   │   │   ├── HwInput.tsx
│   │   │   │   ├── HwDialog.tsx
│   │   │   │   ├── HwSelect.tsx
│   │   │   │   ├── HwTabs.tsx
│   │   │   │   ├── HwSheet.tsx
│   │   │   │   ├── HwBadge.tsx
│   │   │   │   ├── HwCard.tsx
│   │   │   │   ├── HwDropdown.tsx
│   │   │   │   ├── HwTooltip.tsx
│   │   │   │   ├── HwTable.tsx
│   │   │   │   ├── HwAvatar.tsx
│   │   │   │   ├── HwSkeleton.tsx
│   │   │   │   ├── HwForm.tsx
│   │   │   │   └── index.ts       ← barrel — only this is imported by feature code
│   │   │   ├── listings/
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   └── shared/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── trpc.ts
│   │   │   └── socket.ts
│   │   └── config/
│   │       └── fallbacks.ts
│   │
│   └── mobile/
│       ├── app/
│       ├── components/
│       │   └── ui/                ← Same Hw* wrapper pattern for React Native
│       ├── hooks/
│       └── config/
│           └── fallbacks.ts
│
├── packages/
│   ├── api/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   ├── common/
│   │   │   ├── jobs/
│   │   │   └── prisma/
│   │   └── prisma/
│   │       └── schema.prisma
│   ├── types/                     ← Shared global types — consumed everywhere, imported nowhere
│   │   ├── src/
│   │   │   ├── entities/          ← User, Listing, Transaction, AuditEvent, etc.
│   │   │   ├── api/               ← tRPC router types, request/response shapes
│   │   │   ├── config/            ← PlatformConfig, FeatureFlag, all Config interfaces
│   │   │   ├── ui/                ← Hw*Props interfaces, ComponentConfig types
│   │   │   └── global.d.ts        ← Triple-slash refs — makes all types globally available
│   │   └── tsconfig.json
│   └── config/
│       └── src/
│           └── fallbacks.ts
│
└── package.json                   ← Turborepo monorepo root
```

---

## 11. Development Patterns & Conventions

### 11.1 shadcn/ui Wrapper Convention
Every shadcn/ui primitive is wrapped once in `components/ui/Hw*.tsx`. Feature code only ever imports from `@/components/ui` (the barrel). See DESIGN.md §3.0 for full rationale and pattern. The wrapper accepts a `config?: ComponentConfig` prop and falls back to `FALLBACK_*` constants. All `Hw*Props` interfaces live in `packages/types/src/ui/` and are globally available — no import needed.

### 11.2 Naming
- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- Components: PascalCase, co-located `index.ts` barrel
- API routes (tRPC): `router.action` camelCase
- Database: `snake_case` columns, `PascalCase` models
- CSS classes: Tailwind utilities only — no custom class names except `glass-surface`, `bento-*`

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
    await this.audit.log({                // Every mutation → audit event
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

## 12. .ai-system Integration

### 12.1 Session Start Protocol
Every AI coding session MUST begin with:
```
Read .ai-context.md, DESIGN.md, ROADMAP.md, and .ai-system/agents/general-instructions.md
before any action. Report current task-queue.md status then proceed.
```

### 12.2 Key .ai-system Files for This Project

| File | Content |
|---|---|
| `.ai-context.md` | Project identity, stack summary, key modules overview |
| `agents/general-instructions.md` | Coding standards, OOP rules, metadata-driven pattern enforcement |
| `agents/system-architecture.md` | Live architecture state (updated after each major feature) |
| `agents/design-system.md` | Summary of DESIGN.md tokens and component rules |
| `agents/repair-system.md` | Known gotchas (Prisma relations, tRPC inference, RN navigation) |
| `planning/task-queue.md` | Current sprint tasks in priority order |
| `planning/project-plan.md` | Phase checklist (mirrors §9 of this ROADMAP) |
| `memory/project-decisions.md` | Why NestJS over Express, why tRPC, etc. |

### 12.3 Bootstrap Command for This Project
```
Execute command: .ai-system/commands/bootstrap-project.md
Directive: This is a Next.js 14 + NestJS + Prisma + PostgreSQL monorepo.
The product is Homewolves — an African real estate PropTech platform.
Architecture is metadata-driven and OOP. Key patterns:
- PlatformConfig drives all UI configuration with fallbacks in /config/fallbacks.ts
- Every mutation emits an AuditEvent via AuditService
- RBAC via Permission enum + role matrix in PlatformConfig
- tRPC for internal API, REST for public endpoints
Reference DESIGN.md for all UI decisions. Reference ROADMAP.md for architecture.
Do not hardcode labels, icons, or feature gates — always resolve from config.
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
| RBAC | Role-Based Access Control — permissions resolved from role matrix config |
| NDPR | Nigeria Data Protection Regulation |

---

## 16. Global Types & Interfaces

All TypeScript types, interfaces, and enums for this project are defined once in `packages/types/` and made globally available across the entire monorepo — **no import statement required in any consuming file**.

### 16.1 How It Works

```
packages/types/
├── src/
│   ├── entities/
│   │   ├── user.types.ts           ← BaseUser, Agent, BuyerClient, UserRole, Permission, etc.
│   │   ├── listing.types.ts        ← Listing, ListingCategory, ListingStatus, Money, etc.
│   │   ├── transaction.types.ts    ← Transaction, TransactionStep, TransactionStatus, etc.
│   │   ├── audit.types.ts          ← AuditEvent, AuditEntityType, ActorRef, etc.
│   │   └── notification.types.ts   ← NotificationTemplate, NotificationEvent, etc.
│   ├── config/
│   │   ├── platform-config.types.ts ← PlatformConfig, FeatureFlag, AmenityConfig, etc.
│   │   ├── filter.types.ts          ← FilterPillConfig, NavItemConfig, etc.
│   │   └── subscription.types.ts   ← SubscriptionPlan, PlanFeature, etc.
│   ├── api/
│   │   ├── trpc.types.ts           ← tRPC input/output shapes
│   │   └── rest.types.ts           ← Public REST request/response types
│   ├── ui/
│   │   ├── component-config.types.ts ← ComponentConfig, PropertyCardConfig, BentoCellConfig, etc.
│   │   └── hw-props.types.ts        ← HwButtonProps, HwInputProps, HwDialogProps, etc. (all Hw* prop interfaces)
│   └── global.d.ts                  ← Triple-slash references — pulls everything into global scope
└── tsconfig.json
```

### 16.2 global.d.ts — The Injection Point

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
// ✅ In any file — no import needed
function processListing(listing: Listing): string {
  return listing.title;
}

// ✅ Enums are also globally available
const role: UserRole = UserRole.AGENT;
const status: ListingStatus = ListingStatus.ACTIVE;

// ✅ Component props — no import needed
function PropertyCard({ listing, config }: PropertyCardConfig) { ... }

// ✅ API shapes — no import needed
async function createListing(dto: CreateListingDto): Promise<Listing> { ... }

// ❌ WRONG — never import types that are in packages/types
import { Listing } from '@hw/types';   // unnecessary — already global
import { UserRole } from '../../types'; // unnecessary — already global
```

### 16.5 Conventions for Type Definitions

- **Interfaces** for object shapes: `interface Listing { ... }` — extendable, preferred for entities
- **Type aliases** for unions and computed shapes: `type ListingStatus = 'DRAFT' | 'ACTIVE' | ...`
- **Enums** for fixed sets used in switch statements and DB columns: `enum UserRole { AGENT = 'AGENT', ... }`
- **No `any`** — use `unknown` for truly unknown shapes and narrow with type guards
- **No inline type definitions** in component files — all types belong in `packages/types/`
- Prisma-generated types (`PrismaClient`, model types) are **not** re-exported from `packages/types` — use them only in the API package via direct Prisma import. The shared interfaces in `packages/types` are the canonical contract; Prisma types are an implementation detail.

---

*End of ROADMAP.md — This document is the architectural contract for Homewolves v1.0. AI models must not override decisions documented here without explicit human instruction. All deviations must be logged in `.ai-system/memory/project-decisions.md` with rationale.*
