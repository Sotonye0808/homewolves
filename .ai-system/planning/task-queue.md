# Development Task Queue

> **Overview:** Sprint-level task queue for Homewolves Phase 1 (Marketplace MVP). Agents execute tasks top to bottom within the current sprint.

---

## Sprint 1 — Core Marketplace MVP ✅

> **Section summary:** All scaffolding, core UI, auth, listing CRUD, public feed, property detail, and interaction features are complete.

- [x] Initialize Turborepo monorepo — root config, turbo.json, tsconfig.base.json, eslint config
- [x] Scaffold apps/web/ — Next.js 14 App Router, TypeScript strict, Tailwind
- [x] Scaffold packages/api/ — NestJS with PrismaModule, AuditService, PlatformConfigService
- [x] Scaffold packages/types/ — global types + global.d.ts (zero-import pattern)
- [x] Scaffold packages/config/ — fallbacks.ts with all FALLBACK_* constants
- [x] Prisma schema — 12 models, 6 enums, bidirectional relations, indexes
- [x] NestJS infrastructure — PrismaModule, AuditService, PlatformConfigService, RbacGuard, GlobalExceptionFilter
- [x] globals.css — all DESIGN.md §2 tokens + shadcn theme mapping + dark/high-contrast + utilities
- [x] ThemeProvider — light/dark/high-contrast, data-theme attribute, useTheme() hook
- [x] shadcn/ui — initialized with cssVariables, HwButton/HwBadge/HwInput/HwCard wrappers (CVA)
- [x] Landing page — all 9 zones (TopNav, HeroSection, StatsStrip, CategoryBento, PropertyCard, FeaturedListings, HowItWorks, AgentCta, BlogCard, BlogSection, Footer) + MobileBar with FAB
- [x] Design HTMLs read & annotated — landing, properties-listing, property-detail, auth-flow, agent-dashboard, messaging
- [x] FEATURE 1 — PlatformConfig System: GET/PUT endpoints, seed script, usePlatformConfig/useAmenities/useFilterPills hooks, QueryProvider, API client
- [x] FEATURE 2 — Authentication: register/login/verifyOtp/completeProfile/refreshToken/logout, JwtStrategy, JwtGuard, useAuth() zustand persist, /auth 4-state flow (email → otp → profile → agent-id)
- [x] FEATURE 3 — Listing CRUD: findAll/findById/create/update/updateStatus/delete/getFeatured/uploadMediaUrl/attachMedia/incrementView, use-listings.ts (TanStack Query), ListingForm 5-step (Details → Location → Media → Amenities → Review), dashboard layout with auth guard + sidebar, agent listing management
- [x] FEATURE 4 — Public Feed & Search: /properties page — debounced search, filter pills from PlatformConfig, grid/list/map toggles, sort dropdown, infinite scroll (IntersectionObserver), skeleton cards, PropertyCard with glass metadata strip, PropertyCardHorizontal, empty state, MobileBar
- [x] FEATURE 5 — Property Detail: /properties/[id] — 11 zones (Gallery, StickyActionBar, PropertyMeta, VerificationBanner, Description ReadMore, AmenityGrid, LocationMap, AgentGlassCard, SimilarProperties, RecentlyViewed, TransactionStepper), responsive 2-column layout, recordView on mount, save toggle
- [x] FEATURES 6-7 — Recently Viewed & Save: backend modules (recently-viewed/ with userId/sessionId, saved/ with toggle), use-interactions.ts hooks, wired into property detail
- [x] tsc --noEmit passes across all packages (web + api + types) — zero errors

---

## Sprint 2 — Agent & Communication (Current)

> **Section summary:** Agent CRM, dashboard bento grid, inspection scheduling, and real-time messaging.

- [x] CRM backend module — Client, Note, Rating, Inspection models + service + controller + DTOs + AuditEvent + dashboard stats endpoint
- [x] CRM frontend — data table with search/filter/sort, client detail view with notes timeline, rating stars, inspection scheduling
- [x] Agent Dashboard — bento grid with 8 cell types (Active Clients, Inspections, Messages, Performance Chart, Activity Feed, Commission Tracker, Lead Funnel, Quick Actions), sidebar nav with Clients link, matching agent-dashboard.html
- [x] Inspection scheduling — datetime picker, listing selection, status management, integrated into client detail page
- [x] Real-time messaging — Socket.io gateway (messaging.gateway.ts), MessagingService, MessagingController, /messages page two-pane layout matching messaging.html with glass chat bubbles, date dividers, input toolbar, unread badges
- [x] Notification system — NotificationsModule (service + controller + gateway), in-app dispatch via WebSocket, notification bell + dropdown in dashboard layout, notifications inbox page, preference management

---

## Sprint 3 — Transactions & Client Portal ✅

> **Section summary:** All tasks completed — deal workflow stepper, payment evidence + admin review, activity points, admin moderation, blog module.

- [x] Price Drop & Match Alerts — AlertsModule with price drop detection on listing update + new listing match alerts from saved search preferences; integrates with NotificationsService/NotificationsGateway
- [x] Notification system — NotificationsModule (service + controller + gateway), in-app dispatch via WebSocket, notification bell + dropdown in dashboard layout, notifications inbox page, preference management
- [x] Client Dashboard — `/dashboard/client` with 5 tabs (Transactions, Wishlist, Recently Viewed, Documents, Notifications), integrates with existing SavedService + RecentlyViewedService + NotificationsService
- [x] Transaction module — full deal lifecycle stepper with role-based transitions (backend CRUD + payments + step advance/reject/cancel; frontend agent list + detail stepper UI + payment modals; client dashboard live transactions tab)
- [x] Payment evidence upload + admin approval workflow — `attachEvidence` + `getPendingPayments` + `payments/upload-url` endpoints; admin review page at `/dashboard/admin/payments` with confirm/reject; evidence attach UI per payment in transaction detail
- [x] Activity Points system for agent gamification — ActivityService with 9 default rules, cooldown enforcement, tier system (bronze→diamond), leaderboard endpoint, agent stats with category breakdown; frontend API client, hooks, points display in agent dashboard bento cell
- [x] Admin listing moderation queue — `getPendingModeration` + `moderateListing` (approve→ACTIVE, reject→DRAFT) endpoints; admin queue page at `/dashboard/admin/moderation` with approve/reject per listing
- [x] Blog module — CMS-driven with magazine layout — `BlogPost` Prisma model; backend CRUD with slug-based lookup, categories, tags, featured; public `/blog` list page with category filter, pagination, grid layout; `/blog/[slug]` detail page with cover image, metadata, content

---

## Backlog

> **Section summary:** Known work from later phases that hasn't been scheduled yet.

- [ ] WhatsApp integration
- [ ] Analytics engine (agent/listing performance, funnel tracking)
- [ ] PWA offline support (IndexedDB/AsyncStorage fallback)
- [ ] AI chatbot / recommendations
- [ ] E-signature integration
- [ ] Meilisearch migration (Phase 5)
- [ ] Multi-region deployment config
