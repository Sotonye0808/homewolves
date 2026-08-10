# Repair System — Error Knowledge Base

> **Metadata**
> - last-updated-by: update-ai-system
> - last-verified-against-code: 2026-08-10
> - staleness-policy: individual entries may be stale if the code has changed around them — verify fix still applies before reusing

> **Overview:** Living knowledge base of errors encountered during development, their root causes, and how they were fixed. Agents must search this before diagnosing new errors and log every fixed bug to prevent recurrence.

---

## How to Use

- **Before debugging:** Search this file for patterns matching the current error
- **After fixing a bug:** Add an entry using the template below
- **If a fix no longer applies:** Mark the entry as `[SUPERSEDED]` and link to the new entry

---

## Error Log

### [TEMPLATE]

```
## [Error Title]

**Symptom:**
[What the developer or user sees]

**Root Cause:**
[The actual technical reason]

**Fix Applied:**
[What change was made]

**Prevention:**
[How to avoid this in future]

**Files Affected:**
[list of files]

**Date:** [YYYY-MM-DD]
**Status:** [Active / Superseded]
```

---

## Resolved Errors Archive

### Turborepo v2 Pipeline Key Renamed

**Symptom:** `turbo run` errors because `pipeline` is not a valid top-level key.
**Root Cause:** Turborepo v2 renamed `pipeline` → `tasks` in `turbo.json`.
**Fix Applied:** Renamed the `pipeline` key to `tasks` in `turbo.json`.
**Prevention:** Use `tasks` for Turborepo v2+; check turbo version before assuming the old key.
**Files Affected:** `turbo.json`
**Date:** 2026-06-10
**Status:** Active

### Build Blocker: Lint/Format Errors in Web App

**Symptom:** `npm run build` fails in `apps/web` on lint errors (unused imports, empty `catch {}` blocks, inline styles).
**Root Cause:** Files committed with lint-level issues — unused `HwButton` import in footer, empty catch blocks, console statements in messaging client, inline styles on agent listings page.
**Fix Applied:** Removed unused import, replaced empty `catch {}` with explicit no-op handling, removed console noise, converted inline styles to tokenized classes.
**Prevention:** Run `npm run lint` + `npm run typecheck` before declaring web changes complete.
**Files Affected:** `apps/web/components/landing/footer.tsx`, `apps/web/app/(public)/auth/page.tsx`, `apps/web/app/(dashboard)/dashboard/agent/listings/page.tsx`, `apps/web/lib/notifications.ts`, `apps/web/lib/messaging.ts`
**Date:** 2026-06-16
**Status:** Active

### Next.js SWC Lockfile Patch Warning (non-blocking)

**Symptom:** `next build` prints a lockfile patch warning (`ENOWORKSPACES` / SWC dependency patching) during dependency checks.
**Root Cause:** Workspace hoisting interacts with Next SWC package patching in npm workspaces.
**Fix Applied:** None required — the build completes successfully; the warning is environmental.
**Prevention:** Reinstalling dependencies in the workspace (`npm install`) may clear it if it ever becomes a blocker.
**Date:** 2026-06-16
**Status:** Active

---

## Known Error Patterns

### React / Next.js

**Hydration Mismatch**
- Symptom: `Hydration failed because the initial UI does not match what was rendered on the server`
- Cause: Browser-only logic (window, localStorage, Date.now()) running during server render
- Fix: Wrap in `useEffect` or use `dynamic(() => import(...), { ssr: false })`
- Prevention: Never access browser APIs outside useEffect in components

**Missing Key Prop**
- Symptom: `Each child in a list should have a unique "key" prop`
- Cause: `.map()` rendering without a stable unique key
- Fix: Add `key={item.id}` — use a stable unique ID, not the array index

### Design Token / CSS Variable Usage

**Hardcoded Tailwind Color Classes Instead of CSS Variables**
- Symptom: Components use raw Tailwind utilities like `text-emerald-600`, `bg-amber-100` etc. instead of `var(--color-*)`
- Cause: Rapid feature development using Tailwind shorthand instead of Homewolves design tokens
- Fix: Replace `className="text-emerald-600"` with `var(--color-*)` references
- Prevention: Always use `var(--color-*)` CSS variables for any color. Never use raw Tailwind color names.

**Missing `@keyframes` for Design Animations**
- Symptom: Design specifies `animation: celebrate-pulse` but component uses generic `animate-pulse`
- Cause: Custom animation keyframes not ported to globals.css
- Fix: Add `@keyframes` block to `globals.css` and reference by name
- Prevention: When implementing a design with custom animations, create a matching `@keyframes` in `globals.css`

### Node.js / NestJS Backend

**Prisma Client Stale for New Models**
- Symptom: TypeScript errors or missing models on new Prisma schema models
- Cause: New models added to `schema.prisma` without regenerating the Prisma client
- Fix: Run `npx prisma generate` (requires a placeholder `DATABASE_URL` — no live DB needed). The client is regenerated as of 2026-08-10; `(this.prisma as any)` casts have been removed from services.
- Prevention: Regenerate the client after every schema change; track in task queue. Do not reintroduce `as any` casts on Prisma access.

**Unhandled Promise Rejection**
- Symptom: Server crashes silently or logs `UnhandledPromiseRejectionWarning`
- Cause: async function missing try/catch or `.catch()` not attached to promise
- Fix: Wrap async route handlers in try/catch; use a global async error wrapper
- Prevention: Always release DB connections in finally, not just success path

**Database Connection Pool Exhausted**
- Symptom: Requests hang indefinitely under load
- Cause: Connection pool limit too low or connections not released
- Fix: Increase pool size; ensure `client.release()` in finally blocks
- Prevention: Always release connections in finally

### Configuration / Environment

**Missing Environment Variable**
- Symptom: `undefined` values in production, features silently broken
- Cause: Variable defined in `.env.local` but not in production environment
- Fix: Add to deployment environment variables
- Prevention: Add a startup validation check that throws if required env vars are missing
