# PROMPTS.md — Homewolves AI Tool Prompts
> Feed these prompts in sequence. Each section is labelled by tool and stage.
> Always attach the files listed under "Attach" before submitting the prompt.

---

## ─── OPEN DESIGN ─────────────────────────────────────────────────────────────

### PROMPT OD-1 — Design System Bootstrap
**Attach:** `DESIGN.md`
**Purpose:** Establish the full design system before generating any screens.

```
You are a senior UI/UX designer working on Homewolves — an African real estate PropTech platform.

Read the attached DESIGN.md in full before doing anything. This is the single source of truth for all visual and interaction design decisions.

Your task: Generate a complete design system including:

1. COLOUR STYLES — all tokens from DESIGN.md §2.1 as named styles: Light, Dark, High Contrast themes.
   Name convention: {theme}/{category}/{name} — e.g. light/brand/primary, dark/text/muted

2. TEXT STYLES — all type styles from DESIGN.md §2.2.
   Two font families: "DM Serif Display" (headings/display) and "Inter" (UI/body).
   Name convention: {size}/{weight} — e.g. hero/bold, base/regular, xs/semibold

3. EFFECT STYLES — all shadow tokens from DESIGN.md §2.4. Glassmorphism recipe as reusable background.

4. SPACING & GRID — spacing scale from DESIGN.md §2.3.
   Grids: 4-column (375px), 8-column (768px), 12-column (1280px).

5. COMPONENT LIBRARY (Base — these map to shadcn/ui primitives that will be wrapped as Hw* components in code):
   - Button: all 5 variants (Primary, Secondary, Ghost, Danger, Icon-only) × all states (default, hover, active, disabled, loading)
   - Badge/Pill: all category variants from DESIGN.md §3.8
   - Input: floating label, default/focus/error/disabled states
   - Property Card: all 5 variants × skeleton state
   - Navigation: TopNav, BottomTabBar, SideNav
   - Glass Modal and Glass Drawer
   - Bento Grid cells: all size variants
   - Filter Pill bar
   - Avatar (with online indicator, verified badge variant)

All components must use the colour and text styles above — no raw hex values.
Annotate every component with token references.
Organise into pages: 🎨 Tokens | 🧱 Components | 📐 Patterns

EXPORT REQUIREMENT:
Export each page as a self-contained HTML file with these requirements:
- Fully self-contained (inline CSS, no external dependencies)
- CSS variables must use the exact names from DESIGN.md §2 (e.g. --color-brand-primary, not --primary)
- Annotate major sections with comments: <!-- §3.1 Property Card — default variant -->
- Interactive states implemented as CSS classes toggled by data-state attributes
- Include in each file's <head>:
  <meta name="hw-route" content="design-system">
  <meta name="hw-component" content="[comma-separated component names featured]">
Save files to: .ai-system/designs/ with the naming convention from DESIGN.md §11.1
Also create .ai-system/designs/README.md with the index table from DESIGN.md §11.4
```

---

### PROMPT OD-2 — Landing Page (Light + Dark + Mobile)
**Attach:** `DESIGN.md`
**Purpose:** Generate the homepage across themes and viewports.

```
Using the Homewolves design system established in OD-1 and the directives in the attached DESIGN.md, design the Landing Page (/).

Context: Homewolves is an African real estate platform. The aesthetic is modern minimalist glassmorphism with bento layout. Inspiration: JamesEdition.com — luxury real estate presentation, large hero imagery, editorial whitespace, minimal chrome. The property is always the hero.

Design all three of:
1. Mobile Portrait (375px) — Light Theme
2. Mobile Portrait (375px) — Dark Theme
3. Desktop (1280px) — Light Theme

Each design must include these zones in order (see DESIGN.md §4.1):
1. Top Navigation (glass, transparent over hero, opaque on scroll)
2. Hero — Full-bleed property image, centred search bar with location placeholder text, headline + subheadline overlay (text on glass strip)
3. Stats Strip — glass surface: "X Listings · Y Verified Agents · Z Deals Closed"
4. Category Bento — 6 property type tiles (3×2 desktop, 2×3 mobile): Sale, Rent, Shortlet, Land, New Development, Direct Brief
5. Featured Listings — Section heading + 3-column card grid (desktop), horizontal scroll (mobile)
6. How It Works — 3-step illustrated flow (icon + step heading + description)
7. Agent CTA — split section with value prop and "List Your Property" amber button
8. Blog Highlights — 3 article cards
9. Footer — logo, links, social icons, subscription plan teaser

Design rules (enforce strictly):
- No hardcoded text — all labels shown as placeholder variables e.g. {{hero_headline}}, {{cta_label}}
- Prices always in DM Serif Display, amber colour
- All floating panels (nav, filter, overlays) use the glass-surface recipe from DESIGN.md §2.4
- Property images use 16:9 aspect ratio with bottom-pinned glass metadata strip
- Mobile: bottom tab bar visible, FAB for "Post Property"
- Dark theme: navy/dark surfaces, same amber accents, property images unchanged
- Annotate every spacing value, colour token, and component variant used
```

---

### PROMPT OD-3 — Property Listing Feed + Detail Page
**Attach:** `DESIGN.md`

```
Using the Homewolves design system and DESIGN.md directives, design two pages:

PAGE A: Property Listing Feed (/properties)
Design 3 viewports: Mobile Portrait (375px), Tablet Landscape (1024px), Desktop (1280px) — Light theme only.

Required elements (DESIGN.md §4.2):
- Filter bar: search input + horizontally scrollable pill filters + view toggle (grid/list/map)
- Map Split View (desktop/tablet): map 50% viewport, scrollable card panel 50%, amber cluster pins, selected pin glass popup
- Grid View: 3-col desktop, 2-col tablet, 1-col mobile — PropertyCard default variant
- List View toggle: PropertyCard horizontal variant
- Infinite scroll skeleton cards (show 3 skeleton cards at bottom)
- Active filter pills shown below filter bar with × to remove
- Sort dropdown (top right)

PAGE B: Property Detail Page (/properties/:id)
Design: Mobile Portrait (375px) + Desktop (1280px) — Light + Dark.

Required elements (DESIGN.md §4.3):
1. Full-bleed image gallery (swipe mobile, thumbnail strip desktop)
2. Sticky action bar: price (DM Serif, amber) + [Chat Agent] [Schedule Inspection] [Share ↗] [♡ Save] buttons
3. Property meta row: bed/bath/size icons
4. Verification banner (amber, top of content area): "✓ Verified by Homewolves Team"
5. Description with "Read more" collapse at 4 lines
6. Amenities icon grid (show 8 icons, +N overflow)
7. Location map embed (neighbourhood level, not pin-precise)
8. Agent glass card: avatar, name, rating stars, response time badge, [Chat] [Call]
9. Similar Properties horizontal scroll
10. Recently Viewed horizontal scroll
11. Transaction Status Bar (visible to buyer in transaction — glass progress stepper, 8 steps)

Annotate all spacing, token, and component variant references.

EXPORT: Save as 03-properties-feed.html, 04-property-detail-light.html, 05-property-detail-dark.html to .ai-system/designs/. Use exact CSS variable names from DESIGN.md §2. Annotate sections with <!-- §4.x Zone --> comments. Update README.md index.
``` 

---

### Prompt OD-4 — Agent Dashboard (Bento Grid)
**Attach:** `DESIGN.md`

```
Design the Agent Dashboard (/dashboard/agent) for Homewolves using the design system from OD-1 and DESIGN.md directives (see §4.4).

Design 2 viewports: Mobile Portrait (375px) + Desktop (1280px) — Light and Dark.

The dashboard uses a Bento Grid layout (DESIGN.md §3.4). Each cell is a glass-surface card.

Desktop bento layout (4-column grid):
Row 1: [Active Clients — 2×1] [Today's Inspections — 1×1] [Unread Messages — 1×1]
Row 2: [Listing Performance Chart — 2×2] [Recent Activity Feed — 2×2]
Row 3: [Commission Tracker — 2×1] [Lead Funnel Chart — 2×1]
Row 4: [Quick Actions — 4×1 full width]

Mobile: single column, stack in priority order above.

Quick Actions Row: [+ New Listing] [+ Schedule Inspection] [Share Referral Link] [View Analytics]

Each bento cell must show:
- Glass surface (frosted, with border)
- Cell title in Inter xs ALL-CAPS tracking-widest
- Relevant data/chart/list — use realistic placeholder data
- Subtle hover lift animation annotation

Also design the CRM Tab (separate sub-view): data table of clients with columns: Avatar+Name | Status badge | Last Activity | Next Action | Assigned Property thumbnail | ⋮ menu.

Side navigation (desktop): expanded (240px) showing all nav items from DESIGN.md §3.2 with active state on "Dashboard".

EXPORT: Save as 06-agent-dashboard-light.html and 07-agent-dashboard-dark.html to .ai-system/designs/. Annotate bento cells with <!-- §3.4 BentoCell 2x1 --> etc. Update README.md index.
```

---

### PROMPT OD-5 — Transaction Workflow + Auth Flow
**Attach:** `DESIGN.md`

```
Design two flows for Homewolves:

FLOW A: Transaction Workflow Page (/transactions/:id)
Viewports: Mobile (375px) + Desktop (1280px) — Light theme.
Reference: DESIGN.md §4.6

Desktop layout: Left panel (280px) = vertical progress stepper. Right area = step content.
Mobile: Horizontal scrollable stepper at top, full-width content below.

8-step stepper: Inspection Scheduled → Inspection Completed → Documents Received → Due Diligence → Contract Signed → Payment Submitted → Admin Approval → Completed.

Show the design in 3 states:
a) Step 3 active (Documents Received) — file upload zone visible in content area
b) Step 6 active (Payment Submitted) — payment evidence upload + approval pending badge
c) Step 8 (Completed) — all steps green, celebration micro-state

Collapsible Audit Trail Panel (bottom): glass card, table of events — timestamp | actor | action | device.

FLOW B: Authentication Flow (/auth)
Viewports: Mobile (375px) + Desktop (1280px) — Light + Dark.
Reference: DESIGN.md §4.8

Desktop: split screen — left 55% full-bleed property hero image, right 45% glass auth card.
Mobile: full screen, logo top, glass form card.

Show 4 states:
1. Email entry + referral code field (highlighted if pre-filled from URL)
2. OTP entry — 6 large digit input boxes, countdown timer
3. Profile completion (basic: name, phone)
4. Agent-specific: ID document upload step (additional step after basic profile)

Social auth: Google + Apple buttons below email form (outlined, not filled).

EXPORT: Save as 09-transaction-workflow.html and 10-auth-flow.html to .ai-system/designs/. Include all 3 transaction states and all 4 auth states as data-state sections within the same file. Annotate with <!-- §4.6 Step 3 Active --> etc. Update README.md index.
```

---

### PROMPT OD-6 — Messaging + Admin Panel
**Attach:** `DESIGN.md`

```
Design two pages for Homewolves:

PAGE A: Messaging (/messages)
Reference DESIGN.md §4.9.
Viewports: Mobile (375px) — full screen single pane. Desktop (1280px) — two-pane split.

Desktop: Left pane 360px = conversation list. Right pane = active chat.
Conversation list item: property thumbnail (40px) + agent/client name + last message snippet + unread badge + timestamp.
Chat header: mini property card (glass, pinned top) showing which property this chat is about.
Messages: glass bubbles, right-aligned (self), left-aligned (other). WhatsApp-inspired tail.
Input row: text field + paperclip (file) + image + send button.
Show one conversation with: 6 messages, 1 image shared, 1 document (PDF icon) shared.

PAGE B: Admin Panel (/admin) — Overview + Audit Log views
Reference DESIGN.md §4.7.
Viewport: Desktop (1280px) only — Light theme.

Overview tab (bento):
[Pending Approvals — 1×1] [Flagged Listings — 1×1] [Active Transactions — 1×1] [Revenue MTD — 1×1]
[Listings by Status (pie chart) — 2×2] [Transaction Volume (line chart) — 2×2]
[Recent Activity — 4×1 full width]

Audit Log tab:
- Filter bar: date range picker + entity type dropdown + actor search + export button (CSV/PDF)
- Data table: Timestamp | Actor (avatar+name+role badge) | Action | Entity (type+id link) | Device | IP
- Row hover: subtle highlight
- Export button: amber, top right

EXPORT: Save as 11-messaging.html and 12-admin-panel.html to .ai-system/designs/. Include both desktop and mobile states within the messaging file using data-viewport attributes. Update README.md index. At this point all 12 design files should be present — verify README.md is complete before finishing.
```

---

## ─── OPEN CODE ────────────────────────────────────────────────────────────────

### PROMPT OC-1 — Project Scaffolding & .ai-system Bootstrap
**Attach:** `ROADMAP.md`, `DESIGN.md`, `.ai-context.md`
**Purpose:** Set up the entire monorepo structure before writing any feature code.

```
Read the attached ROADMAP.md, DESIGN.md, and .ai-context.md in full before taking any action.

You are building Homewolves — an African real estate PropTech platform. Architecture: Next.js 14 (App Router) + NestJS + Prisma + PostgreSQL monorepo managed with Turborepo.

Task: Scaffold the full project structure exactly as specified in ROADMAP.md §10.

Steps in order:

1. MONOREPO SETUP
   - Initialise Turborepo monorepo with apps/web, apps/mobile, packages/api, packages/types, packages/config
   - Root package.json with workspaces, turbo.json pipeline
   - tsconfig.base.json at root with strict mode, paths aliases:
     "@hw/types" → "./packages/types/src"
     "@/components/ui" → "./apps/web/components/ui/index.ts"
   - Shared ESLint config

2. GLOBAL TYPES PACKAGE (packages/types) — do this before any other package
   Set up as described in ROADMAP.md §16. This is foundational — everything else depends on it.
   - Create the full folder structure: src/entities/, src/config/, src/api/, src/ui/
   - Implement all type files:
     - entities/user.types.ts: BaseUser (abstract class), Agent, Developer, Homeowner, BuyerClient, Admin, SuperAdmin, UserRole enum, Permission enum, UserPreferences interface, PublicProfile interface
     - entities/listing.types.ts: Listing class, ListingCategory enum, ListingStatus enum, PropertyType enum, Money interface, PropertyLocation interface, Media interface, CommissionConfig interface, AmenityRef interface
     - entities/transaction.types.ts: Transaction class, TransactionStep interface, TransactionStatus enum, TransactionType enum, TransactionDocument interface, PaymentRecord interface, Evidence interface
     - entities/audit.types.ts: AuditEvent class, AuditEntityType enum, ActorRef interface, AuditSummary interface
     - entities/notification.types.ts: NotificationTemplate interface, NotificationEvent enum, NotificationChannel enum, RecipientRule interface
     - config/platform-config.types.ts: PlatformConfig class, FeatureFlag interface, AmenityConfig interface, FilterPillConfig interface, NavItemConfig interface, PropertyTypeConfig interface, TransactionStepTemplate interface
     - config/subscription.types.ts: SubscriptionPlan interface, PlanFeature interface
     - api/trpc.types.ts: CreateListingDto, UpdateListingDto, RegisterDto, LoginDto, ScheduleInspectionDto, CreateTransactionDto, AdvanceTransactionDto — all as interfaces
     - api/rest.types.ts: PaginatedResponse<T>, ApiError, SearchParams interfaces
     - ui/component-config.types.ts: ComponentConfig (base), PropertyCardConfig, BentoCellConfig, NavItemDisplayConfig, FilterBarConfig
     - ui/hw-props.types.ts: HwButtonProps, HwInputProps, HwDialogProps, HwSelectProps, HwTabsProps, HwSheetProps, HwBadgeProps, HwCardProps, HwTableProps, HwAvatarProps, HwSkeletonProps — each extending the corresponding shadcn prop type plus a config?: ComponentConfig field
   - Create src/global.d.ts with triple-slash references to ALL type files above
   - tsconfig.json: set "declaration": true, "declarationMap": true
   - Each app's tsconfig.json must include "../../packages/types/src/global.d.ts" in its "include" array and set typeRoots to include "../../packages/types/src" — exactly as shown in ROADMAP.md §16.3

3. WEB APP (apps/web)
   - Next.js 14 with App Router, TypeScript strict, Tailwind CSS
   - Install shadcn/ui: `npx shadcn-ui@latest init` — choose CSS variables mode (NOT hardcoded colours)
   - Install remaining deps: @tanstack/react-query, zustand, react-hook-form, zod, framer-motion, lucide-react, @phosphor-icons/react
   - Configure Tailwind: extend theme using CSS variable references from DESIGN.md §2 — do NOT hardcode any colour, radius, or shadow value
   - In globals.css: define all Homewolves design tokens from DESIGN.md §2.1–2.6 as CSS custom properties, then map shadcn variable names to Homewolves tokens as shown in DESIGN.md §3.0
   - App Router folder structure per ROADMAP.md §10: (public), (dashboard), (admin) route groups
   - ThemeProvider component: reads prefers-color-scheme, stores in localStorage, applies data-theme attribute to <html>
   - config/fallbacks.ts: implement ALL fallback configs (amenities, filterPills, navItems, propertyTypes, transactionStepTemplates) — fully populated, never empty
   - Create .ai-system/designs/ directory with a stub README.md — this is where Open Design HTML exports will live

4. API (packages/api)
   - NestJS project with TypeScript
   - Install: @nestjs/*, prisma, @prisma/client, ioredis, bullmq, socket.io, zod, passport-jwt
   - Module structure per ROADMAP.md §4
   - AuditService as a global injectable (@Global() module)
   - PlatformConfigService: DB fetch → Redis cache (5min TTL) → fallback to packages/config/fallbacks.ts
   - Global exception filter, AuditInterceptor skeleton, RbacGuard skeleton

5. DATABASE (packages/api/prisma)
   - Full schema.prisma from ROADMAP.md §5
   - All models, enums, and indexes

6. .ai-system DIRECTORY
   - Full structure per the template
   - .ai-context.md: Homewolves project identity (copy from attached .ai-context.md)
   - agents/general-instructions.md: metadata-driven + OOP + audit-by-default + shadcn wrapper + global types patterns
   - planning/task-queue.md: Phase 1 tasks from ROADMAP.md §9
   - designs/README.md: stub with table headers from DESIGN.md §11.4 — ready for Open Design exports

After scaffolding, run tsc --noEmit across all packages and fix any TypeScript errors before finishing. The global types must resolve without any import statements in test files.
```

---

### PROMPT OC-2 — Design System Implementation (Web)
**Attach:** `DESIGN.md`, `ROADMAP.md`, `.ai-system/designs/README.md`, `01-landing-light.html` (from .ai-system/designs/ once exported)
**Purpose:** Build the entire Hw* component library, faithfully replicating Open Design outputs.

```
Read DESIGN.md and ROADMAP.md in full before starting. Then read .ai-system/designs/README.md to understand the design export index.

Task: Implement the complete Homewolves Hw* component library for apps/web/components/ui/.

CRITICAL RULES — enforce every single one:
1. shadcn wrapper pattern (DESIGN.md §3.0 + ROADMAP.md §11.1):
   - Every shadcn primitive is wrapped in an Hw* component in components/ui/
   - Feature code ONLY imports from the components/ui/index.ts barrel
   - Hw* wrappers accept config?: ComponentConfig and fall back to FALLBACK_* constants
2. Never hardcode colours — CSS variables only (DESIGN.md §2.1)
3. Never hardcode labels, icons, or copy — always from config prop or FALLBACK_*
4. All Hw*Props interfaces are already globally available from packages/types — do NOT import or redefine them
5. Design replication: where an HTML file from .ai-system/designs/ is attached, treat it as pixel-precise reference — extract exact spacing, colours (CSS variable names), border-radii, and font sizes from it

IMPLEMENT IN ORDER:

STEP 1 — TOKENS & THEME
- ThemeProvider: wraps app, provides useTheme() hook (returns { theme, setTheme, systemTheme })
- DesignTokens: SSR-safe component that injects all CSS custom properties from DESIGN.md §2 into :root and [data-theme="dark"], [data-theme="high-contrast"]. Renders as null — side effect only.
- cn() utility: clsx + tailwind-merge helper at lib/cn.ts

STEP 2 — SHADCN PRIMITIVE WRAPPERS (components/ui/)
Install required shadcn components first: button, input, dialog, select, tabs, sheet, badge, card, dropdown-menu, tooltip, popover, form, table, avatar, skeleton, separator, scroll-area, command, calendar, date-picker.

Then create Hw* wrappers:

HwButton — wraps shadcn Button
- variants: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon' (maps to shadcn variants via cva)
- sizes: 'sm' | 'md' | 'lg'
- leftIcon?, rightIcon?: React.ReactNode slots
- loading?: boolean — shows spinner, disables interaction
- config?: HwButtonConfig (sourced from PlatformConfig, e.g. border-radius override)
- Amber primary: bg-[var(--color-brand-accent)], hover: bg-[var(--color-brand-accent-alt)]
- Full-pill shape: rounded-[var(--radius-full)]

HwInput — wraps shadcn Input
- Floating label pattern: label animates above on focus/fill via CSS :focus-within + :not(:placeholder-shown)
- error?: string — shows below input in error colour
- All states from DESIGN.md §3.6

HwDialog — wraps shadcn Dialog
- size: 'sm' | 'md' | 'lg' (560px / 720px / 960px max-width)
- Entry animation: Framer Motion scale(0.96)+fade → scale(1), --duration-normal --ease-spring
- Backdrop: color-bg-overlay + blur
- Respects prefers-reduced-motion

HwSheet — wraps shadcn Sheet
- Mobile: bottom drawer with drag-to-dismiss
- Desktop: side drawer (right by default)

HwBadge — wraps shadcn Badge
- variant: 'sale' | 'rent' | 'shortlet' | 'land' | 'verified' | 'pending' | 'complete' | 'rejected'
- All colours from DESIGN.md §3.8 — CSS variable values only

HwCard — wraps shadcn Card
- variant: 'default' | 'glass'
- Glass variant applies glass-surface recipe: backdrop-filter + semi-transparent bg + border

HwSelect, HwTabs, HwDropdown, HwTooltip, HwPopover, HwTable, HwAvatar, HwSkeleton, HwForm
- Each wraps the corresponding shadcn primitive
- Applies Homewolves design tokens
- Accepts config?: ComponentConfig prop

Export ALL wrappers from components/ui/index.ts — this is the only file imported by feature code.

STEP 3 — COMPOSITE COMPONENTS (built from Hw* wrappers only — never raw shadcn)

PropertyCard (components/listings/PropertyCard.tsx)
- If design HTML is attached: open it, find the <!-- §3.1 Property Card --> annotated section, extract exact measurements and CSS variable usage, replicate pixel-precisely
- variants: 'default' | 'compact' | 'featured' | 'map-popup' | 'horizontal'
- PropertyCardSkeleton: matching HwSkeleton composition for each variant
- Image: next/image with blurDataURL, lazy loading, 16:9 aspect ratio
- Hover: Framer Motion translateY(-4px) + shadow transition, prefers-reduced-motion fallback
- config?: PropertyCardConfig (from PlatformConfig — controls commission visibility, agent row, etc.)

BentoGrid + BentoCell (components/dashboard/)
- BentoGrid: CSS Grid wrapper, column count from props (4/2/1 desktop/tablet/mobile)
- BentoCell: HwCard glass variant, size variants: '1x1' | '2x1' | '1x2' | '2x2' | '3x1' | 'full'
- Cell header: Inter xs ALL-CAPS --tracking-widest
- Responsive reorder via CSS order property sourced from config mobile_order field

TopNav, BottomTabBar, SideNav (components/shared/)
- Replicate exactly from design HTML if attached
- Nav items sourced from usePlatformConfig().navItems filtered by user role — never hardcoded
- TopNav: glass surface, transparent over hero → opaque on scroll (IntersectionObserver)
- SideNav: 64px collapsed / 240px expanded, state in localStorage

FilterBar (components/listings/)
- Search input (HwInput) + horizontally scrollable pill row (HwBadge variants) + view toggle
- Filter state synced to URL query params via useSearchParams + router.push
- Filter pills sourced from usePlatformConfig().filterPills

GlassSurface, Container, FAB (components/shared/)
- GlassSurface: div with glass-surface CSS recipe applied
- Container: max-width centred, responsive padding
- FAB: amber HwButton icon variant, fixed positioning, portal-rendered, --shadow-xl

STEP 4 — WRITE TESTS
Vitest + Testing Library for: PropertyCard (all variants render, skeleton renders, config prop overrides work), HwButton (all variants, loading state, disabled state), FilterBar (URL sync, pill selection), BentoCell (size class applied correctly).

After all components are built, run tsc --noEmit and fix all TypeScript errors. Remember: Hw*Props are global — do not import them.
```

---

### PROMPT OC-3 — Phase 1 Core Features
**Attach:** `ROADMAP.md`, `DESIGN.md`, plus from `.ai-system/designs/`: `03-properties-feed.html`, `04-property-detail-light.html`, `05-property-detail-dark.html`, `10-auth-flow.html`

```
Read ROADMAP.md and DESIGN.md in full. Then read each attached HTML design file — these are the pixel-precise references for the pages you are building. For each page, locate the <!-- §section --> annotations in the HTML and cross-reference them with DESIGN.md to understand interaction behaviour.

GLOBAL TYPES REMINDER: All types (Listing, Agent, UserRole, CreateListingDto, FilterPillConfig, etc.) are globally available — never import from packages/types. Do not redefine types locally.
COMPONENT REMINDER: Only import from '@/components/ui' (the Hw* barrel). Never use raw shadcn primitives in feature code.

Task: Implement Phase 1 features in sequence. Complete each fully before moving to the next. After each, update .ai-system/planning/task-queue.md and .ai-system/checkpoints/session-log.md.

FEATURE 1 — PlatformConfig System
Backend: PlatformConfigModule with CRUD. PlatformConfigService: DB → Redis (5min TTL) → fallback to packages/config/fallbacks.ts. Seed migration on first run.
Frontend: usePlatformConfig() hook via TanStack Query (staleTime: 5min). All configurable UI (NavItems, FilterPills, AmenityIcons, PropertyTypes) consumes this hook — zero hardcoded options.

FEATURE 2 — Authentication
Backend: auth module per ROADMAP.md §7. Email OTP (Resend) + Phone OTP (Termii). JWT access (15min) + refresh rotation. Google OAuth. AuditEvent on every auth action.
Frontend: /auth page — replicate 10-auth-flow.html pixel-precisely. Find <!-- §4.8 --> sections. 4-state flow: email → OTP → profile → agent ID upload. useAuth() hook: { user, login, logout, register, isLoading }.

FEATURE 3 — Listing CRUD
Backend: listings module. Create/update/delete with ownership. Status: DRAFT → PENDING → ACTIVE. AuditEvent on all mutations. Presigned S3 URL for media.
Frontend: multi-step listing form (details → location → media → amenities → preview). All propertyType and amenity options from usePlatformConfig() — never hardcoded.

FEATURE 4 — Public Feed + Search
Backend: listings.list (cursor paginated) + listings.search (PostgreSQL FTS). Filter params match FilterPillConfig ids.
Frontend: /properties page — replicate 03-properties-feed.html pixel-precisely. FilterBar pill options from usePlatformConfig().filterPills. PropertyCard grid with skeleton. Infinite scroll via IntersectionObserver.

FEATURE 5 — Property Detail
Frontend: /properties/[id] — replicate 04-property-detail-light.html (light) and 05-property-detail-dark.html (dark) pixel-precisely. All zones from DESIGN.md §4.3. Track view on mount. WhatsApp link from listing.agent.phone.

FEATURE 6 — Recently Viewed
Backend: RecentlyViewed tRPC routes (list, track, clear). Guest: cookie sessionId. Auth: userId.
Frontend: RecentlyViewedStrip using PropertyCard compact. Shown on homepage + property detail.

FEATURE 7 — Save for Later
Backend: SavedCollection tRPC routes (list, create, addListing, removeListing, delete).
Frontend: HwButton icon variant (heart) on PropertyCard → HwDialog collection picker. Collections tab in client dashboard.

FEATURE 8 — Wishlist / Interest
Backend: Wishlist record on express interest. NotificationQueue fires to agent + developer.
Frontend: "Express Interest" CTA on detail page (distinct from Save). HwDialog confirmation.

FEATURE 9 — Admin Listing Moderation
Backend: admin.listings.queue + approve/reject. AuditEvent with admin actor.
Frontend: /admin listings queue — HwTable with approve/reject HwDialog. Replicate 12-admin-panel.html for the listings queue tab.

FEATURE 10 — Referral System
Backend: referral code on Agent (nanoid). Track attribution on registration. Commission attribution placeholder.
Frontend: Referral link in agent dashboard. Auto-populate referral field in auth flow from URL param.
```

---

### PROMPT OC-4 — Phase 2: CRM, Messaging & Notifications
**Attach:** `ROADMAP.md`, `DESIGN.md`, plus from `.ai-system/designs/`: `06-agent-dashboard-light.html`, `07-agent-dashboard-dark.html`, `08-client-dashboard.html`, `11-messaging.html`

```
Read ROADMAP.md and DESIGN.md. Read each attached HTML design file as pixel-precise references. Start by reading: .ai-context.md, .ai-system/agents/general-instructions.md, .ai-system/planning/task-queue.md.

GLOBAL TYPES REMINDER: All types are globally available — never import or redefine them.
COMPONENT REMINDER: Only import from '@/components/ui'. Never use raw shadcn primitives in feature code.
DESIGN REPLICATION: For each page, find <!-- §section --> annotations in the HTML, extract exact values, replicate faithfully using Hw* components.

FEATURE 1 — Agent CRM Module
Backend: CRM module. Client assignment (buyer expresses interest → assign to listing agent). Client notes (append-only, timestamped). Client ratings (1–5, with comment). Inspection scheduling. AuditEvent on all mutations.
Frontend: Agent Dashboard bento grid — replicate 06-agent-dashboard-light.html and 07-agent-dashboard-dark.html pixel-precisely. Use BentoGrid + BentoCell from components/ui. CRM tab: HwTable with client rows. Inspection calendar. Client detail HwDialog.

FEATURE 2 — Real-time Messaging
Backend: Socket.io gateway. ConversationService (by participants + listing context). MessageService (send, read receipt). Auth middleware on WS.
Frontend: /messages page — replicate 11-messaging.html pixel-precisely for both desktop two-pane and mobile full-screen. Property context HwCard pinned in chat header. Typing indicator. Unread HwBadge on nav.

FEATURE 3 — Notification System
Backend: NotificationService + BullMQ. Template resolution from PlatformConfig.notificationTemplates. Parallel dispatch: WebSocket + Resend + Termii. WhatsApp fallback on 2 SMS failures.
Frontend: Bell icon in TopNav with unread count HwBadge. NotificationsDrawer (HwSheet, glass, grouped by date). Preference settings via HwTabs + HwSelect.

FEATURE 4 — Price Drop & Match Alerts
Backend: Nightly BullMQ job. Price drop → notify users who saved/recently viewed. New listing → notify users with matching saved search prefs.
Frontend: Notification card variants for price drop (old price crossed out) and new match.

FEATURE 5 — Client Dashboard (Full)
Frontend: /dashboard/client — replicate 08-client-dashboard.html pixel-precisely. All HwTabs: Transactions | Wishlist | Recently Viewed | Documents | Notifications. Assigned agent HwCard.

FEATURE 6 — Activity Points (Gamification)
Backend: PointsService. Points config in PlatformConfig (admin-editable values). Award on: listing, deal close, 5-star rating, referral.
Frontend: Points HwBadge on agent profile. Points history in dashboard. Leaderboard BentoCell.
```

---

### PROMPT OC-5 — Phase 3: Transaction Workflow & Audit
**Attach:** `ROADMAP.md`, `DESIGN.md`, plus from `.ai-system/designs/`: `09-transaction-workflow.html`, `12-admin-panel.html`

```
Read ROADMAP.md and DESIGN.md. Read attached HTML design files as pixel-precise references. Read all .ai-system agent files and task-queue.md before starting.

GLOBAL TYPES REMINDER: All types globally available — never import or redefine.
COMPONENT REMINDER: Only import from '@/components/ui'. Never raw shadcn in feature code.
DESIGN REPLICATION: Extract exact values from HTML annotations, replicate with Hw* components.

FEATURE 1 — Transaction Module
Backend: Transaction entity (ROADMAP.md §3.1). TransactionStepTemplate in PlatformConfig (admin-configurable steps, required docs, actor roles). Three workflow templates: PURCHASE, RENTAL, SHORTLET. TransactionService.advance() emits AuditEvent + notifications. TransactionService.reject() admin-only.
Frontend: /transactions/[id] — replicate 09-transaction-workflow.html pixel-precisely. Vertical stepper (desktop) / horizontal (mobile). Step content area dynamic per step type. Show all 3 annotated states (step 3, step 6, step 8 completed). Collapsible audit panel at bottom using HwCard glass.

FEATURE 2 — Document Management
Backend: TransactionDocument model. Presigned S3 upload. Virus scan async job on upload. Visibility: buyer sees own + agent-shared only.
Frontend: HwSheet file upload zone in transaction steps. Document Vault in client dashboard (HwTable: icon + name + date + download). PDF/image preview HwDialog.

FEATURE 3 — E-Signature
Backend: DocuSeal integration. SignatureRequest model. Contract step → generate request → send to parties. Webhook on completion → advance step, AuditEvent.
Frontend: "Sign Document" HwButton CTA. DocuSeal embed HwDialog. Signed HwBadge on vault document.

FEATURE 4 — Audit Trail (Full)
Backend: AuditService fully implemented. Append-only. AuditRepository with filters. CSV + PDF export.
Frontend: Per-transaction audit panel — replicate the collapsible section from 09-transaction-workflow.html. Admin audit log tab — replicate audit log section from 12-admin-panel.html pixel-precisely: HwTable with date range picker (HwCalendar), entity type HwSelect, actor search HwInput, amber export HwButton.

FEATURE 5 — Subscription & Billing
Backend: Paystack integration. SubscriptionPlan from PlatformConfig. Webhook → activate plan, AuditEvent. Plan gates via FeatureFlag.
Frontend: /pricing page — plan comparison HwTable from PlatformConfig.subscriptionPlans. Upgrade HwDialog on limit hit. Subscription status in SideNav footer.
```
---

### PROMPT OC-6 — Performance, SEO & Production Readiness
**Attach:** `ROADMAP.md`, all `.ai-system/designs/*.html` files

```
Read ROADMAP.md. Open .ai-system/designs/README.md and verify all 12 design HTML files are present. Run a final design-to-code delta check: for each HTML file, compare the annotated sections against the implemented pages and note any gaps in .ai-system/checkpoints/session-log.md.

Read .ai-system/agents/repair-system.md and .ai-system/testing/test-results.md before starting.

1. PERFORMANCE (targets from ROADMAP.md §13)
   - Audit all pages with Lighthouse. Fix any LCP > 2.5s issues.
   - Ensure all below-fold images use loading="lazy" and have blurDataURL dominant colour placeholders.
   - Implement route-level code splitting (Next.js dynamic imports for heavy components: Map, PDF viewer, chart library).
   - Verify infinite scroll uses intersection observer, not scroll event listener.
   - Add React.memo() + useMemo/useCallback where re-render profiling shows waste.
   - Redis cache: verify PlatformConfig (5min TTL), listing feed (30s TTL), featured listings (5min TTL).

2. SEO
   - generateMetadata() on all listing pages: title = listing.title, description = first 160 chars of description, og:image = listing primary image CDN URL.
   - Dynamic sitemap.xml: all active listings + blog posts.
   - robots.txt: allow all public routes, disallow /admin, /dashboard.
   - Structured data (JSON-LD): RealEstateListing schema on /properties/[id].
   - Canonical URLs on paginated listing feeds.

3. SECURITY (ROADMAP.md §14)
   - Audit all tRPC routes: confirm every protected route has JwtGuard + RbacGuard.
   - Confirm AuditInterceptor fires on every mutation route.
   - Rate limiting: verify 100 req/min public, 500 req/min authenticated.
   - File upload: confirm virus scan job triggers on every S3 upload completion webhook.
   - Input: confirm Zod validation on all tRPC inputs and REST endpoints.
   - Confirm no raw SQL anywhere — all queries through Prisma.

4. ERROR HANDLING
   - Verify GlobalExceptionFilter catches all unhandled errors and logs to Sentry without leaking stack traces to client.
   - Ensure all loading states have skeleton components (no blank areas during fetch).
   - Ensure all error states have error boundary + retry UI.
   - Offline: verify recently viewed and wishlist work from IndexedDB when API is unreachable.

5. TESTING
   - Unit tests: AuditService, PlatformConfigService, ListingService, TransactionService — 80%+ coverage.
   - Component tests: PropertyCard (all variants), FilterBar, BentoCell, TransactionStepper.
   - E2E (Playwright): full buyer journey (search → view → save → enquire), full agent journey (list → manage client → schedule inspection), admin moderation flow.
   - Run all tests and fix failures. Update .ai-system/testing/test-results.md.

6. DOCUMENTATION
   - Update .ai-system/index/repo-map.md with final folder structure.
   - Update .ai-system/memory/project-decisions.md with any architectural decisions made during implementation.
   - Update .ai-system/agents/system-architecture.md with current live state.
   - Generate API documentation (tRPC + REST) as Markdown in .ai-system/docs/.
```

---

## ─── SESSION CONTINUITY PROMPT (use at the start of every new session) ────────

### PROMPT SC-1 — Resume Session
**Attach:** `ROADMAP.md`, `DESIGN.md`, `.ai-context.md`, plus the specific `.ai-system/designs/*.html` files relevant to your current task

```
Read the following files before anything else, in this order:
1. .ai-context.md — project identity and stack
2. ROADMAP.md — architecture, patterns, conventions
3. DESIGN.md — design system (before any UI work)
4. .ai-system/agents/general-instructions.md — coding standards
5. .ai-system/planning/task-queue.md — current sprint tasks
6. .ai-system/checkpoints/session-log.md — what was last completed
7. .ai-system/designs/README.md — design export index (if doing UI work, open the relevant HTML files)

Report: What is the current task? What was last completed? Are there any design-to-code deltas logged?
Then proceed with the next task from the queue.

Enforce throughout this session:
- Metadata-driven pattern: no hardcoded labels, icons, options, or feature gates anywhere
- OOP service architecture: AuditService always injected, every mutation audited
- Config-first UI: PlatformConfig → fallbacks.ts, never inline defaults
- Design token usage: CSS variables only, never raw hex values
- shadcn wrapper pattern: only Hw* components from '@/components/ui' in feature code, never raw shadcn primitives
- Global types: all Hw*Props, entity types, enums, and config interfaces are globally available — never import or redefine them
- Design replication: if a .ai-system/designs/*.html file exists for the current page, it is the pixel-precise reference — not DESIGN.md prose alone
```

---

*End of PROMPTS.md*

---

## ─── OPEN DESIGN → OPEN CODE HANDOFF NOTE ──────────────────────────────────

### How to Hand Off Designs to Open Code

After completing all Open Design prompts (OD-1 through OD-6):

1. All HTML exports should be in `.ai-system/designs/` with the naming convention from DESIGN.md §11.1
2. `.ai-system/designs/README.md` should be fully populated with the index table
3. When running Open Code prompts OC-2 onward, **always attach the relevant HTML files** from `.ai-system/designs/` alongside DESIGN.md and ROADMAP.md
4. Tell Open Code which HTML file corresponds to the screen being built — it will treat it as pixel-precise reference

**File attachment guide per Open Code prompt:**

| OC Prompt | HTML files to attach |
|---|---|
| OC-2 (Component library) | 01-landing-light.html (for component reference) |
| OC-3 Feature 4 (Feed) | 03-properties-feed.html |
| OC-3 Feature 5 (Detail) | 04-property-detail-light.html, 05-property-detail-dark.html |
| OC-3 Feature 2 (Auth) | 10-auth-flow.html |
| OC-4 Feature 1 (CRM/Dashboard) | 06-agent-dashboard-light.html, 07-agent-dashboard-dark.html |
| OC-4 Feature 5 (Client Dashboard) | 08-client-dashboard.html |
| OC-4 Feature 2 (Messaging) | 11-messaging.html |
| OC-5 Feature 1 (Transactions) | 09-transaction-workflow.html |
| OC-5 Feature 4 (Audit) | 12-admin-panel.html |

