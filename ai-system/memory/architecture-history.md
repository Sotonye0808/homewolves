# Architecture History

> **Metadata**
> - last-updated-by: bootstrap-project
> - last-verified-against-code: 2026-08-05
> - staleness-policy: historical entries do not go stale — only the current architecture (in system-architecture.md) needs re-verification

> **Overview:** Chronological record of how the system architecture has evolved. Useful for understanding why things are structured the way they are, and for identifying patterns in how the codebase has grown.

---

## History

### 2026-06-09 — Initial Architecture

**State:**
Greenfield project. Architecture defined from ROADMAP.md §1-4 — modular monolith, Turborepo monorepo, Next.js 14 + NestJS + PostgreSQL. All docs in `.ai-system/` (v1) populated from design assets. Zero application code.

**Rationale:**
Design phase (DESIGN.md, ROADMAP.md) completed before code. The architecture was documented first so scaffolding could follow the intended structure without rework.

---

### 2026-06-10 — MVP Foundation & Feature Sprints 1-3

**State:**
Turborepo monorepo scaffolded. `packages/types` (global zero-import types), `packages/config` (fallbacks), `packages/api` (NestJS with PrismaModule, AuditService, PlatformConfigService, RbacGuard, GlobalExceptionFilter), `apps/web` (Next.js 14 App Router). Prisma schema with 16+ models.

Sprints delivered: PlatformConfig system, auth (OTP + JWT), listing CRUD, public feed + search, property detail, recently-viewed + save, CRM, agent dashboard bento grid, real-time messaging, notifications, price-drop/match alerts, client dashboard, transaction stepper, payment evidence + admin review, activity points, admin moderation, blog.

**Rationale:**
Feature-first delivery within the documented architecture. The audit-by-default and metadata-driven patterns were enforced from Sprint 1.

---

### 2026-06-16 — Navigation Audit & Build Repair

**State:**
All landing CTAs and mobile bar tabs wired to real routes. Missing public routes added (about, contact, faq, privacy, terms). Lint/format blockers fixed so `npm run build` completes green.

**Rationale:**
Post-MVP usability pass — removing dead ends before hardening.

---

### 2026-08-05 — v2 ai-system Migration

**State:**
Replaced v1 `.ai-system/` with v2 `ai-system/` framework (vendor-neutral, function-based roles, explicit protocols, mandatory quality gate, freshness metadata). Migrated all project content. Design assets moved into `ai-system/designs/`.

**Rationale:**
Upgrade to the v2 system contract: tool-agnostic, interruption-safe, quality-gated development workflow.

---

[New entries added here as architecture evolves]
