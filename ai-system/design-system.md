# Design System

> **Metadata**
> - last-updated-by: bootstrap-project
> - last-verified-against-code: 2026-08-05
> - staleness-policy: re-verify if UI components or styling dependencies change

> **Overview:** Homewolves uses a glassmorphism + bento grid aesthetic inspired by JamesEdition. The design communicates trust, luxury, and clarity for the African real estate market. All tokens are defined as CSS custom properties in `apps/web/app/globals.css` (and DESIGN.md in `ai-system/docs/`). This file is a quick-reference summary — agents building UI must read DESIGN.md in full before writing frontend code. The colour, typography, and spacing tables below are the **single source of truth** for design tokens (per `standards/engineering-principles.md` §5) — components must consume these tokens rather than redeclaring values.

---

## Visual Language

### Colour Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-base` | `#F7F6F3` | Warm off-white — primary background |
| `--color-bg-elevated` | `#FFFFFF` | Cards, modals |
| `--color-bg-glass` | `rgba(255,255,255,0.55)` | Glassmorphism surfaces |
| `--color-brand-primary` | `#1A3A5C` | Deep navy — headers, primary actions |
| `--color-brand-accent` | `#C8813A` | Warm amber — CTAs, prices, highlights |
| `--color-brand-accent-alt` | `#E8956A` | Terracotta — hover states, tags |
| `--color-text-primary` | `#0F1117` | Near-black body text |
| `--color-text-muted` | `#8A9BB0` | Labels, captions |
| `--color-error` | `#B91C1C` | Destructive actions |
| `--color-success` | `#1A7A4A` | Confirmations, verified badges |

**Dark theme:** All surface tokens inverted. Ambers stay warm.
**High-contrast theme:** Black/white with `#FFD700` accent.

### Typography

| Style | Font | Size | Weight |
|-------|------|------|--------|
| Hero headline | DM Serif Display | `clamp(2.5rem, 8vw, 5rem)` | 700 |
| Section heading | DM Serif Display | `clamp(1.875rem, 5vw, 2.5rem)` | 700 |
| Property price | DM Serif Display | `clamp(1.25rem, 3vw, 1.5rem)` | 700 (amber) |
| Body copy | Inter | `clamp(0.875rem, 2vw, 1rem)` | 400 |
| UI label (ALL-CAPS) | Inter | `clamp(0.70rem, 1.5vw, 0.75rem)` | 600, tracking-widest |
| Badge/pill text | Inter | `clamp(0.70rem, 1.5vw, 0.75rem)` | 600 |
| Price/monospace | JetBrains Mono | `--text-sm` | 400 |

### Spacing Scale

4px base: `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), `--space-5` (20px), `--space-6` (24px), `--space-8` (32px), `--space-10` (40px), `--space-12` (48px), `--space-16` (64px), `--space-20` (80px), `--space-24` (96px), `--space-32` (128px)

---

## Component Patterns

### shadcn/ui Wrapper Convention (Mandatory)
```
// ✅ CORRECT — import the Homewolves wrapper
import { HwButton } from '@/components/ui/HwButton';

// ❌ WRONG — never import shadcn primitives directly in feature code
import { Button } from '@/components/ui/button';
```
Each wrapper: imports shadcn primitive → applies design tokens via `cn()` → accepts `config?: ComponentConfig` → falls back to `FALLBACK_*` constants → exported from `components/ui/index.ts`.

### Buttons
- **Primary:** Amber bg (`#C8813A`), white text, `--radius-full` pill shape, `--shadow-sm` → `--shadow-md` on hover
- **Secondary:** White/glass bg, navy border, navy text
- **Ghost:** Transparent, navy text, underline on hover
- **Danger:** Red bg (`--color-error`), white text
- **Icon-only:** Circular, 40px min, glass surface
- **FAB:** Amber circle, 56px, `--shadow-xl`, fixed bottom-right mobile

### Forms
- Input fields: White bg, `--radius-md` (12px), `--shadow-xs`, focus ring
- Select: Custom dropdown, no native arrow
- File upload: Dashed border drop zone, glass inner surface
- OTP input: 6 digit boxes, auto-focus progression
- Floating labels: Label animates up on focus/fill
- Error messages: Red text below field, icon

### Navigation
- **Web desktop:** Top bar (glass, blur, 64px) — logo left, search centre, auth right
- **Mobile:** Bottom tab bar (glass, 80px + safe area) — 5 tabs, amber active indicator
- **Dashboard (tablet/desktop):** Side nav (64px collapsed / 240px expanded), glass surface, role-aware nav items
- **Admin:** 240px glass side nav with SVG icons, badges, footer avatar

### Cards / Containers
- **Property Card:** 16:9 image, glass strip pinned to bottom with price + meta, hover lift `translateY(-4px)`
- **Bento Cell:** Glass surface card, variable grid sizes (1×1 to 3×1), configurable order
- **Glass Modal:** `scale(0.96→1.0)` entry, backdrop overlay, mobile = bottom drawer
- **Message Bubble:** Glass with tails, date dividers, unread badges

### Modals / Dialogs
- Entry: Scale from 0.96 + fade, spring easing
- Backdrop: `rgba(0,0,0,0.40)` with `backdrop-filter: blur(4px)`
- Close: `×` top-right + Escape key + backdrop tap
- Mobile: Full-screen drawer from bottom, drag to dismiss

### Status Badges / Pills
- `--radius-full`, `--text-xs`, `--font-semibold`
- Sale: blue, Rent: green, Shortlet: amber, Land: purple
- Verified: green, Pending: amber, Complete: blue, Rejected: red

---

## UX Principles

1. **Performance as UX** — skeleton loaders on every async surface. No layout shift. Images lazy-loaded with dominant colour placeholders.
2. **Luxury restraint** — generous whitespace, minimal chrome, property is always the hero.
3. **Config-first rendering** — every UI element resolves content from config before falling back to hardcoded defaults.
4. **Accessible by default** — WCAG AA contrast (4.5:1 text), 44×44px touch targets, focus rings, ARIA roles.
5. **Reduced motion respected** — all animations collapse to instant opacity when `prefers-reduced-motion` is set.
6. **Error states are designed** — each async surface has loading → empty → error → success states, all explicitly handled.

---

## Responsive Breakpoints

| Breakpoint | Value | Target |
|------------|-------|--------|
| xs | 375px | Small phone |
| sm | 480px | Large phone |
| md | 768px | Tablet portrait |
| lg | 1024px | Tablet landscape / small laptop |
| xl | 1280px | Desktop |
| 2xl | 1536px | Large desktop |
| 3xl | 1920px | Ultrawide |

**Orientation:** Mobile portrait = single column, bottom nav. Mobile landscape = map/card split, mini nav rail. Desktop = side nav, multi-column bento grids.

---

## Accessibility Requirements

- All interactive elements: min 44×44px touch target
- Focus visible: `outline: 2px solid var(--color-brand-secondary)` + `outline-offset: 2px`
- Colour contrast: text on all surfaces ≥ 4.5:1 (AA). Prices on white ≥ 3:1 (AA large)
- Images: descriptive alt text always present (auto-generated from `title + location` if not set)
- Forms: label associated with input (not placeholder-only)
- Status messages: `aria-live="polite"` regions for toast/alert updates
- Modals: focus trap, Escape to close, `aria-modal="true"`
- Navigation: skip-to-content link at top of page
- Keyboard: all interactions reachable and operable via keyboard
