# ACTIVE_REQUEST

_Last updated: 2026-06-24_

## Current active request
**COMPLETE (2026-06-24):** Investigated Supabase status + scoped email notifications, then cleaned & refreshed agent-state. No app code change. See the queued next request at the bottom.

## Prior request (2026-06-06, complete)
**Initialize the token-saving agent-state workflow** for this repo (seed `agent-state/` files + `CLAUDE.md`, detect stack + deploy, record Obsidian sync target). Global `/delta-update` and `/cleanup-handoff` skills already live in `~/.claude/`.

## Acceptance criteria
- [x] `agent-state/` seeded with verified repo + deployment state (8 files, ASCII-only).
- [x] `CLAUDE.md` created with repo-specific facts + pointer to `~/.claude/CLAUDE.md`.
- [x] Stack detected from `package.json` (npm + React/Vite/TS; dev/build/test commands).
- [x] Deployment checked against the real provider (Vercel MCP) - verified READY.
- [x] Obsidian sync target recorded in `OBSIDIAN_SYNC.md` (folder created lazily later).
- [x] No commit, no deploy, no pre-existing files modified.

## Files likely involved
`CLAUDE.md`, `agent-state/*` (this repo). Vault notes created lazily on first `/cleanup-handoff`.

## Status
- Implementation: **complete**
- Verification: **complete** (deploy verified READY via Vercel MCP; no app code changed)
- Deployment: **unchanged** (production already at HEAD `14e14aa`, READY)
- Obsidian: **target recorded** (notes not yet created - lazy)
- **Overall: COMPLETE**

---

## Next request (queued 2026-06-24)
**Request:** Set up **email notifications for users** for Fast Insights.
**Open decision (blocks start):** which notification type, and who the "users" are. Supabase is set up ("ar-recon"), but there are NO user accounts / stored emails and no email sender yet. Three paths:
  1. **Auth emails** (signup confirm / magic-link / reset) - requires adding Supabase Auth + an SMTP/Resend sender. ~1hr.
  2. **Transactional alerts** ("report ready", "invoice overdue") - Resend + a Supabase Edge Function + trigger/cron. ~half day.
  3. **Announcements / newsletter** - use a dedicated service (Resend Broadcasts / Beehiiv / ConvertKit), little/no code. ~30min.
**Files likely involved:** new Supabase Edge Function + email-provider config; `src/lib/supabase.ts` (client pattern); customer `ap_email` field for AR reminders.
**Status:** not started (awaiting Jessica's choice)
