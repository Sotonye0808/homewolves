# Design Exports — Homewolves

> **Overview:** This directory contains HTML exports from Open Design for all Homewolves screens. Each file is a pixel-precise reference for implementing the corresponding route. See DESIGN.md §11 for the full handoff protocol.

---

## Index

| File | Route | Theme | Viewport | Status |
|------|-------|-------|----------|--------|
| 01-landing-light.html | / | Light | 375px + 1280px | ⬜ Planned |
| 02-landing-dark.html | / | Dark | 375px | ⬜ Planned |
| 03-properties-feed.html | /properties | Light | 375px + 1280px | ⬜ Planned |
| 04-property-detail-light.html | /properties/:id | Light | 375px + 1280px | ⬜ Planned |
| 05-property-detail-dark.html | /properties/:id | Dark | 375px | ⬜ Planned |
| 06-agent-dashboard-light.html | /dashboard/agent | Light | 375px + 1280px | ⬜ Planned |
| 07-agent-dashboard-dark.html | /dashboard/agent | Dark | 1280px | ⬜ Planned |
| 08-client-dashboard.html | /dashboard/client | Light | 375px + 1280px | ⬜ Planned |
| 09-transaction-workflow.html | /transactions/:id | Light | 375px + 1280px | ⬜ Planned |
| 10-auth-flow.html | /auth | Light | 375px + 1280px | ⬜ Planned |
| 11-messaging.html | /messages | Light | 375px + 1280px | ⬜ Planned |
| 12-admin-panel.html | /admin | Light | 1280px | ⬜ Planned |

---

## Notes
- All files use CSS variables matching DESIGN.md §2 token names exactly
- Annotated with `<!-- §section -->` comments for Open Code reference
- Interactive states use `data-state` attributes (hover, active, loading, disabled, skeleton)
- Each file includes `<meta name="hw-route">` and `<meta name="hw-component">` tags
