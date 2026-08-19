# In-Progress Work

> **Metadata**
>
> - last-updated-by: execute-feature
> - last-verified-against-code: 2026-08-19
> - staleness-policy: this file is overwritten every session — always current

> **Overview:** Tracks work that is currently in progress but not yet complete. Written _before_ starting risky multi-step work, cleared on clean completion.

---

## Current State

**Status:** CLEARED — Session 9 (`execute-feature`) completed cleanly on 2026-08-19. QA gate fully green (API 135 tests, web 100 tests, 22 E2E journeys, both builds pass), DB migration `0000`+`0001` applied to live Supabase Postgres, docs reconciled. See `checkpoints/session-log.md` → Session 9 for the full record.

**Outstanding user-fill items (not blockers to code):**
- `SUPABASE_JWT_SECRET` — real Google OAuth exchange (provider creds live in the Supabase dashboard).
- `RESEND_API_KEY` — real transactional email delivery (unset = simulated log-only, by design).
- `NEXT_IGNORE_INCORRECT_LOCKFILE=1` — set on build hosts for `next build` (Next 14.2.35 SWC lockfile-patch registry quirk).
- `DATABASE_URL` must be exported for `npm run db:migrate`/`db:seed` (`drizzle-kit` does not auto-load root `.env`).

**Next feature:** pick the next incomplete `planning/task-queue.md` backlog item.

---

_This file is overwritten on every new in-progress operation. Clear on clean completion._