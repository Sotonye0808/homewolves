# Repository Map

> **Overview:** Target folder structure for the Homewolves monorepo. Currently only `.ai-system/` and design assets exist — application code is yet to be scaffolded. This map reflects the intended structure from ROADMAP.md §10. Updated as code is written.

---

## Folder Structure

```
homewolves/
│
├── .ai-system/                    ← AI brain — read this first on every session
│   ├── agents/                    ← Agent instruction files (general, architecture, context, design, repair)
│   ├── commands/                  ← Executable command prompts (bootstrap, dev-cycle, plan-feature, etc.)
│   ├── checkpoints/               ← Session log — resume where last session stopped
│   ├── designs/                   ← HTML exports from Open Design (12 screen exports)
│   ├── docs/                      ← DESIGN.md, ROADMAP.md, PROMPTS.md
│   ├── index/                     ← repo-map.md, dependency-graph.md
│   ├── memory/                    ← project-decisions.md, lessons-learned.md, architecture-history.md
│   ├── planning/                  ← project-plan.md, task-queue.md
│   ├── summaries/                 ← dev-history.md
│   └── testing/                   ← test-plan.md, test-results.md
│
├── apps/
│   ├── web/                       ← Next.js 14 web application (App Router)
│   │   ├── app/
│   │   │   ├── (public)/          ← Public routes: landing, properties, blog, auth
│   │   │   ├── (dashboard)/       ← Authenticated: agent/client dashboards, transactions, messages
│   │   │   └── (admin)/           ← Admin panel routes
│   │   ├── components/
│   │   │   ├── ui/                ← Hw* wrappers (HwButton, HwInput, etc.) — the only import for UI primitives
│   │   │   ├── listings/          ← Property card, gallery, filter bar, etc.
│   │   │   ├── dashboard/         ← Bento grid cells, KPI widgets, charts
│   │   │   ├── transactions/      ← Stepper, document upload, audit trail
│   │   │   └── shared/            ← Layouts, headers, footers, loaders
│   │   ├── hooks/                 ← Custom React hooks (useFeatureFlag, useRecentlyViewed, etc.)
│   │   ├── lib/                   ← tRPC client, Socket.io client, utility functions
│   │   └── config/                ← Web-specific config (fallbacks.ts re-export)
│   │
│   └── mobile/                    ← React Native (Expo SDK 51+) mobile app
│       ├── app/                   ← Expo Router file-based routes
│       ├── components/ui/         ← Same Hw* wrapper pattern for React Native
│       ├── hooks/                 ← Shared hooks with web parity
│       └── config/                ← Mobile-specific fallbacks
│
├── packages/
│   ├── api/                       ← NestJS backend
│   │   ├── src/
│   │   │   ├── modules/           ← auth, users, listings, crm, transactions, messaging, etc.
│   │   │   ├── common/            ← decorators, guards, interceptors, filters, pipes
│   │   │   ├── jobs/              ← BullMQ job processors (email, sms, notification, analytics)
│   │   │   └── prisma/            ← PrismaService (DI wrapper for PrismaClient)
│   │   └── prisma/
│   │       └── schema.prisma      ← Full database schema
│   ├── types/                     ← Global TypeScript types — no imports needed
│   │   └── src/
│   │       ├── entities/          ← User, Listing, Transaction, AuditEvent, etc.
│   │       ├── api/               ← tRPC router types, request/response shapes
│   │       ├── config/            ← PlatformConfig, FeatureFlag, all Config interfaces
│   │       ├── ui/                ← Hw*Props interfaces, ComponentConfig types
│   │       └── global.d.ts        ← Triple-slash refs — makes all types globally available
│   └── config/
│       └── src/
│           └── fallbacks.ts       ← All FALLBACK_* constants for every config domain
│
├── .ai-context.md                 ← Project identity, stack, key modules — session entry point
├── DESIGN.md                      ← Full design system (tokens, components, page layouts)
├── ROADMAP.md                     ← Architecture, domain model, API, RBAC, phased roadmap
├── start-ai-dev.bat               ← Windows batch file to start an AI dev session
└── package.json                   ← Turborepo monorepo root
```

---

## Directory Descriptions

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `.ai-system/` | AI development system — instructions, planning, memory, checkpoints | All files — read before any action |
| `apps/web/` | Next.js 14 web application — SSR/SSG, mobile-first responsive | `app/`, `components/ui/`, `lib/trpc.ts` |
| `apps/mobile/` | React Native (Expo) mobile app — parity with web | `app/`, `components/ui/` |
| `packages/api/` | NestJS backend — all business logic, Prisma ORM, tRPC routers | `src/modules/`, `prisma/schema.prisma` |
| `packages/types/` | Global TypeScript types — zero-import via triple-slash refs | `src/entities/*.ts`, `src/global.d.ts` |
| `packages/config/` | Shared fallback constants for all config domains | `src/fallbacks.ts` |

---

## Entry Points

| Purpose | File |
|---------|------|
| Web dev server | `apps/web/package.json` — `next dev` |
| API server | `packages/api/src/main.ts` — NestJS bootstrap |
| Database schema | `packages/api/prisma/schema.prisma` |
| Config fallbacks | `packages/config/src/fallbacks.ts` |
| Global types injection | `packages/types/src/global.d.ts` |
| AI session start | `.ai-context.md` — read this first |
