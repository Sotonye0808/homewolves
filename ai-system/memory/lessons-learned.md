# Lessons Learned

> **Metadata**
> - last-updated-by: bootstrap-project
> - last-verified-against-code: 2026-08-05
> - staleness-policy: each entry has its own staleness — check supersedes links

> **Overview:** Practical knowledge accumulated during Homewolves development — things that worked well, things that didn't, and patterns worth repeating. Different from `repair-system.md` (tracks errors); this file tracks development process insights and architectural wisdom. Uses supersedes/superseded-by links for evolving practices.

---

## Entry Format

```
## [Lesson Title]

**Context:**
[What situation this came from]

**What We Learned:**
[The insight or pattern discovered]

**Apply When:**
[When future agents/developers should use this knowledge]

**Supersedes:** [link to any prior lesson this replaces, or None]
**Superseded by:** [link to any newer lesson that replaces this, or None]
```

---

## Lessons

## Bootstrap ai-system Before Writing Any Code

**Context:**
Project start — design exports existed but no code. Running the bootstrap command first forced a complete read of DESIGN.md and ROADMAP.md before scaffolding began.

**What We Learned:**
Understanding the full architecture before writing code prevents rework. The bootstrap process surfaced the non-negotiable patterns (PlatformConfig, audit logging, Hw* wrappers, global types) that would have been painful to retrofit.

**Apply When:**
Starting any new project or major feature. Read all ai-system docs first. Populate agent files before writing a single line of application code.

**Supersedes:** None
**Superseded by:** None

---

## Metadata-Driven UI Requires Planning the Config Schema First

**Context:**
The architectural pattern requires all UI configuration to come from PlatformConfig. This forced us to define the config interfaces (AmenityConfig, FilterPillConfig, NavItemConfig, etc.) before any component could be built.

**What We Learned:**
Defining the config schema and fallback constants upfront is essential — without them, developers fall back to hardcoded values and the pattern breaks. The `packages/config/src/fallbacks.ts` file is the single most important file for maintaining the metadata-driven pattern.

**Apply When:**
Any time a new configurable UI element is added. Define its config interface, fallback constant, and PlatformConfig route before building the component that consumes it.

**Supersedes:** None
**Superseded by:** None

---

## Global Types Simplify Cross-Module Development

**Context:**
The decision to make all types globally available (zero-import) via `packages/types/` from ROADMAP §16.

**What We Learned:**
Eliminating imports for shared types (Listing, UserRole, HwButtonProps) accelerates development significantly. No time wasted on relative path calculations or barrel file updates. The triple-slash reference pattern works reliably across Next.js and NestJS.

**Apply When:**
Any project with 2+ apps and shared types. The zero-import pattern saves substantial development time once the type package is set up correctly.

**Supersedes:** None
**Superseded by:** None

---

## Every Mutation Needs Audit From Day One

**Context:**
The audit-by-default principle from ROADMAP is a non-negotiable architectural constraint.

**What We Learned:**
Building audit into the service layer (via `AuditService`) rather than the controller layer ensures no mutation is missed. Controllers are too easy to forget. Every service method that mutates data calls `this.audit.log(...)`.

**Apply When:**
Any project requiring an audit trail. Enforce at the service layer via dependency injection, not at the route/controller layer.

**Supersedes:** None
**Superseded by:** None

---

## Design Handoff Requires Structured HTML Exports

**Context:**
The Open Design → Open Code handoff protocol defined in DESIGN.md §11.

**What We Learned:**
Having design HTML files with CSS variables matching the token names exactly, annotated section comments (`<!-- §4.1 Hero Zone -->`), and `data-state` attributes for interactive states eliminates ambiguity between design and implementation. The pixel-precise reference prevents "creative interpretation" that drifts from the intended design.

**Apply When:**
Any project with a dedicated design phase. Require designers to export HTML with the structured format defined in DESIGN.md §11.2 before implementation begins.

**Supersedes:** None
**Superseded by:** None

---

## Design Tokens Must Replace Raw Tailwind Colors

**Context:**
Session 6 pixel-perfect audit found components using raw Tailwind color classes (`text-emerald-600`, `bg-emerald-100`) instead of `var(--color-*)` design tokens.

**What We Learned:**
Rapid feature development drifts toward Tailwind shorthand. The audit pass replaced raw colors with CSS variables, but only admin + transaction pages were refactored — other pages (properties, auth, blog) still carry raw hex values. Token discipline must be enforced at review time, not fixed later.

**Apply When:**
Any frontend work — use `var(--color-*)` tokens exclusively. Run `grep` for raw hex/Tailwind color classes in review.

**Supersedes:** None
**Superseded by:** None
