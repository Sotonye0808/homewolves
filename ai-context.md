# .ai-context.md — Homewolves Project Context
> AI Instruction: Read this file at the start of every session. It is the entry point to understanding this project. After reading this, read ROADMAP.md and DESIGN.md. Then read the specific .ai-system agent files relevant to your current task.

---

## Project Identity

**Name:** Homewolves
**Type:** Multi-sided PropTech Marketplace + Agent CRM + Transaction Management Platform
**Market:** Nigeria-first, pan-African roadmap
**Stage:** Active development — Phase 1 (MVP)

---

## The Problem We Solve

African real estate is broken by fragmentation, mistrust, and manual workflows. Agents lose deals on WhatsApp. Buyers can't verify listings. Transactions have no paper trail. Developers can't reach qualified buyers efficiently.

Homewolves fixes this with a single operating system for the entire transaction lifecycle — from discovery to deal close.

---

## Tech Stack (quick reference)

| Layer | Technology |
|---|---|
| Web frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query, Zustand |
| Mobile frontend | React Native (Expo SDK 51+), Expo Router, NativeWind |
| Backend | NestJS, TypeScript, tRPC (internal), REST (public) |
| Database | PostgreSQL 16 (via Prisma ORM) |
| Cache | Redis 7 |
| File storage | AWS S3 / Cloudflare R2 |
| Real-time | Socket.io |
| Auth | NextAuth.js (web), JWT (mobile) |
| Email | Resend |
| SMS/WhatsApp | Termii (primary), Twilio (fallback) |
| Queue | BullMQ + Redis |
| Hosting | Vercel (web), Railway (API), Supabase/Neon (DB) |

---

## Key Architectural Patterns

**This project has six non-negotiable patterns. Every AI agent must enforce all of them:**

### 1. Metadata-Driven UI
All configurable UI elements (navigation items, filter pills, amenity icons, subscription plan features, notification templates, property types) are stored in the `PlatformConfig` database table and served via `PlatformConfigService`. Hardcoded fallbacks exist in `/config/fallbacks.ts` and activate only when the API is unreachable. **Never hardcode labels, icons, or options directly in components.**

### 2. OOP Domain Model
Core entities (`User`, `Listing`, `Transaction`, `AuditEvent`) are modelled as classes. Behaviour lives with data. Services follow single responsibility. Controllers are thin — all logic in services.

### 3. Audit by Default
Every state-changing database operation emits an `AuditEvent` via `AuditService`. This is injected into every service module. Mutations without audit coverage are considered incomplete. Audit logs are immutable — no updates or deletes.

### 4. Config-First Feature Gating
Features are gated by `FeatureFlag` entries in `PlatformConfig`, not by hardcoded role checks or `if (env === 'production')` conditions. The `FeatureFlagGuard` and `useFeatureFlag()` hook consume config, enabling admin-controlled rollout without code deploys.

### 5. shadcn/ui Wrapper Pattern
All shadcn/ui primitives are wrapped once in `components/ui/Hw*.tsx`. Feature code **only** imports from `@/components/ui` (the index.ts barrel). Never import raw shadcn primitives in pages, feature components, or route handlers. Each `Hw*` wrapper accepts `config?: ComponentConfig` and falls back to `FALLBACK_*` constants. See DESIGN.md §3.0.

### 6. Global TypeScript Types
All types, interfaces, and enums are defined in `packages/types/src/` and made globally available via `global.d.ts` triple-slash references. **No import statements are needed or allowed for types in `packages/types`.** Defining types locally in component or service files is forbidden — they belong in `packages/types`. See ROADMAP.md §16.

---

## User Roles

`GUEST` → `BUYER` → `AGENT` → `DEVELOPER` / `HOMEOWNER` → `ADMIN` → `SUPER_ADMIN`

Permissions are resolved from a role matrix stored in `PlatformConfig`. See ROADMAP.md §7.

---

## Key Modules (summary)

| Module | Purpose |
|---|---|
| `platform-config` | All admin-configurable metadata. The backbone of the system. |
| `auth` | Email/phone OTP, JWT, social OAuth |
| `listings` | Property CRUD, search, media upload |
| `crm` | Agent client management, inspections, notes, ratings |
| `transactions` | Full deal lifecycle — purchase, rental, shortlet workflows |
| `audit` | Immutable event log across all platform actions |
| `messaging` | Real-time chat between agents and clients |
| `notifications` | Multi-channel (push, email, SMS, WhatsApp) via BullMQ |
| `analytics` | Performance metrics, funnel tracking |
| `subscriptions` | Paystack billing, plan feature gating |
| `admin` | Moderation, approvals, config management |

---

## Design System Summary

Full design system in `DESIGN.md`. Key points:
- **Aesthetic:** Modern minimalist glassmorphism + bento grid. Inspired by JamesEdition.com.
- **Themes:** Light (default), Dark, High Contrast. Token-driven via CSS variables.
- **Typography:** DM Serif Display (headings/prices) + Inter (UI/body).
- **Accent colour:** Warm amber `#C8813A` for prices, CTAs, and highlights.
- **Glass surfaces:** `backdrop-filter: blur(16px)` + semi-transparent background on all floating panels.
- **No raw hex values in components** — always CSS variables.

---

## Phase Status

| Phase | Status |
|---|---|
| Phase 1 — Marketplace MVP | 🟡 In Progress |
| Phase 2 — Agent CRM & Collaboration | ⬜ Planned |
| Phase 3 — Transaction Workflow | ⬜ Planned |
| Phase 4 — Client Dashboard & Polish | ⬜ Planned |
| Phase 5 — Intelligence & Automation | ⬜ Planned |

---

## Reference Files

| File | When to Read |
|---|---|
| `ROADMAP.md` | Before any architectural, backend, or structural work |
| `DESIGN.md` | Before any UI, component, or styling work |
| `.ai-system/designs/README.md` | Before implementing any page — maps HTML files to routes |
| `.ai-system/designs/*.html` | The pixel-precise reference for the specific page being built |
| `.ai-system/agents/general-instructions.md` | Every session — coding standards including all 6 patterns |
| `.ai-system/agents/system-architecture.md` | Before structural changes |
| `.ai-system/planning/task-queue.md` | At session start — current tasks |
| `.ai-system/checkpoints/session-log.md` | At session start — what was last done, any design deltas |
| `.ai-system/agents/repair-system.md` | When encountering errors |

---

*Maintained by: Homewolves dev team. Update after every major architectural decision.*
