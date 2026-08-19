# Proposal: Upgrade `ai-system` to template v3 (pull-template-update)

> **Metadata**
> - last-updated-by: pull-template-update
> - last-verified-against-code: 2026-08-13
> - staleness-policy: one-time proposal; **SUPERSEDED — APPLIED** (Session 6, 2026-08-13). Kept as the decision record; migration details in `ai-system/checkpoints/session-log.md`.

> **Command run:** `pull-template-update.md` (from template v3) — comparison + diff proposal. **Nothing local has been overwritten.** This document is the proposal; a human decides.

---

## 1. Version Comparison

| | Recorded version | Notes |
|---|---|---|
| **Upstream template** | **3.0.0** (`VERSION`, reachable) | Diff used: v2 commit `44643dc` → v3 commit `e19a4b3`, 71 files, +1620 / -29 |
| **Local project** | **No baseline recorded** | `ai-context.md` has no `installed-ai-system-version:` metadata; file set matches the v2 kit exactly (12 commands, no `skills/` / `tools/` / `design-references/`). Treat as **v2**. |

Result: local is one major version behind → **upgrade path exists**.

---

## 2. Per-file Classification

### 2.1 New files (copy from `ai-system-kit/ai-system/`)

| File / Folder | Source in template | Notes |
|---|---|---|
| `ai-system/skills/` (whole folder) | `skills/` | `README.md` + 9 skills (`SKILL.md` + `references/` + `evals/`); self-invoking expertise units |
| `ai-system/tools/` (whole folder) | `tools/` | `registry.md` (external-resource table) + `tools/integrations/*.md` (adopted-resource docs) |
| `ai-system/design-references/` (whole folder) | `design-references/` | `README.md` + `TEMPLATE/DESIGN.md`; reference-design library (Tier 4) |
| `ai-system/commands/audit-sources.md` | `commands/audit-sources.md` | Append-to-registry evaluation command |
| `ai-system/commands/visual-review.md` | `commands/visual-review.md` | Live preview vs design system (degrades to static) |
| `ai-system/commands/generate-design-md.md` | `commands/generate-design-md.md` | Extracts a reference site's design language into `design-references/` |
| `ai-system/commands/pull-template-update.md` | `commands/pull-template-update.md` | This command; the diff-based update mechanism |
| `VERSION` (repo root) | `VERSION` | `3.0.0` |
| `CHANGELOG.md` (repo root) | `CHANGELOG.md` | v3 release notes (v2 path preserved) |

> The local `ai-system/designs/` folder is **unrelated** to the new `design-references/` — `designs/` holds the project's pixel-precise page exports, `design-references/` holds pulled external design languages. Both coexist; do not merge them.

### 2.2 Merge-clean files (v2 template copy + only the v3 diff applies)

All 24 framework files below are byte-identical to the v2 kit except the `last-verified-against-code:` date. Applying the v3 diff produces no conflicts.

| File | v3 change |
|---|---|
| `agents/tester-qa.md` | `+` Live-Preview / Browsing Capability section with degradation rule |
| `commands/audit-drift.md` | `+` chain-compliance drift check, checkpoint-coupling audit, compliance-violation report section; `Chains to: None` row |
| `commands/bootstrap-project.md` | `+` records `installed-ai-system-version` in `ai-context.md`; `Chains to: None` row |
| `commands/cloud-session.md` | `+` mandatory `Chains to: sync-context.md` + `update-ai-system.md`; completion rewired |
| `commands/dev-cycle.md` | `+` mandatory chain; `last-synced` marker; sprint-boundary deep sync (Step 7) |
| `commands/execute-feature.md` | `+` mandatory chain; `last-synced` marker; deep-sync condition on `[L]`/`[XL]` or architecture impact |
| `commands/fix-build.md` | `+` chain check (multi-file fix or repair-pattern change → `sync-context.md`) |
| `commands/plan-feature.md` | `+` mandatory session-log trace for task-queue mutations |
| `commands/refactor-codebase.md` | `+` mandatory unconditional `update-ai-system.md` deep sync (Step 9) |
| `commands/resume-session.md` | `+` drift check is a `sync-context.md` invocation; major drift runs `update-ai-system.md` first |
| `commands/sync-context.md` | `+` checkpoint-compliance check; `Chains to: in-progress.md` on task-queue mutation |
| `commands/update-ai-system.md` | `+` `Chains to: None` terminal row |
| `commands/verify-work.md` | `+` `Chains to: None` row |
| `protocols/context-tiering.md` | `+` Tier 3 rows (skills SKILL.md, tools registry, integrations) and Tier 4 rows (skill references, design-references, registry history) |
| `protocols/entry-protocol.md` | `+` tool-discovery-first step; closing-turn advisory section; quick-nav rows |
| `protocols/quality-gate.md` | `+` §9 pattern-adherence v3 principle checklist |
| `protocols/verification-rules.md` | `+` v3 principle extensions; Contract Compliance Checks (task-queue/checkpoint coupling, mandatory chain order) |
| `standards/engineering-principles.md` | `+` §11–§24 (14 new principles); enforcement table §10→§25; doc-style addendum on §9 |

### 2.3 Divergent files — needs-decision (project content preserved, targeted edits only)

These carry real project content. **Never overwrite with the template.** Each needs a targeted, human-reviewed edit.

| File | Required v3 edit | Risk |
|---|---|---|
| `ai-context.md` (root) | `+` metadata `installed-ai-system-version: 3.0.0`; `+` pointer lines to `skills/README.md` + `tools/registry.md` | Low — additive; project body untouched |
| `planning/task-queue.md` | `+` metadata `last-synced:` marker (required for §9 coupling checks); optional: seeded v3 backlog items | Low — additive |
| `design-system.md` | `+` Reference Library section; `+` Design Asset Viewer section (dev-only, env-gated) | Medium — the local file is the project's real token source; new sections are additive |
| `system-architecture.md` | `+` Verification CLI section; `+` Rollback & Undo section; `+` `ENABLE_DESIGN_VIEWER` config row | Medium — local file is heavily customized |
| `memory/project-decisions.md` | Optional: seeded PDF-extraction-backend decision (only relevant if the Design Asset Viewer is built) | Low — project already has its own decisions; skip if not building the viewer |
| `testing/test-plan.md` | `+` §19 proportionality note in Overview | Low — cosmetic |

### 2.4 Unchanged in v3 — no action

`agents/{architect,historian,implementer,planner,reviewer}.md`, `protocols/{escalation-rules.md}`, `index/{dependency-graph,repo-map}.md`, `memory/{architecture-history,lessons-learned}.md`, `planning/project-plan.md`, `project-context.md`, `repair-system.md`, `summaries/dev-history.md`, `testing/test-results.md`, `checkpoints/{in-progress.md,session-log.md}` (template content), `designs/`, `docs/`. Local content in these is preserved as-is.

---

## 3. Proposed Next Steps (after human approval)

1. **Back up** current state: copy `ai-system/` aside (e.g. `ai-system-v2-backup/`).
2. **Add new files** (2.1) verbatim from the template.
3. **Apply v3 diffs** to the 24 merge-clean files (2.2) — clean patches.
4. **Make the targeted edits** to the divergent files (2.3); resolve `design-system.md` / `system-architecture.md` additions with the human.
5. **Record the baseline**: set `installed-ai-system-version: 3.0.0` in `ai-context.md`.
6. **Run `sync-context.md`** to refresh freshness metadata; then **`audit-drift.md`** to verify chain/coupling compliance.

---

## 4. Honest notes

- `tools/registry.md` and `tools/integrations/*.md` are seeded with the template's §13 evaluation table (35 rows). These are generic resources (crawl4ai, markitdown, etc.) evaluated against the *kit*, not against this project — the project should run `audit-sources.md` against its own stack before trusting any `adopt` verdicts.
- `skills/` are dormant expertise units; nothing activates unless a trigger matches mid-task.
- v3 requires `git status`-style checks (`verification-rules.md` Contract Compliance) — this project's repo is a git repo, so that works as-is.
