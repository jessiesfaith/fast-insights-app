# HANDOFF

_Last updated: 2026-06-24_

## Active request status
**COMPLETE** - investigation/Q&A session only (Supabase + email-notifications). No app code change.

## Completed this session
- Answered "is Fast Insights on Supabase?" -> **Yes.** Main app already uses the **"ar-recon"** Supabase project via `@supabase/supabase-js` (read-only AR data load in `src/lib/supabase.ts`). Cashflow Tool has its own Supabase backend (migrations).
- Established the gap for **email notifications**: there is **no Supabase Auth, no user accounts, no stored user emails** anywhere in the app. Supabase does not send notification email (auth-flow email only). Real notifications need an email provider (Resend/Postmark/SendGrid) called from a Supabase Edge Function or cron/trigger. Three paths scoped: (1) auth emails ~1hr, (2) transactional alerts ~half day, (3) announcements/newsletter via a dedicated service ~30min no-code. Jessica dismissed the "which kind?" question - decision still open.
- Cleaned up this repo's durable state (these docs were 18 days stale).

## In progress
- Nothing initiated by this session.

## Incomplete / blocked
- **Email-notifications decision is open.** Awaiting Jessica's choice of notification type + who the "users" are (see NEXT_SESSION_PROMPT.md).

## Broken / risky
- Nothing broken. The 2 formerly-WIP files (`src/pages/Landing.tsx`, `vercel.json`) noted in the old handoff are now **committed** - working tree is clean.

## Changed files (working tree)
- **Untracked, ready to commit:** `agent-state/` (refreshed this session) + `CLAUDE.md`. These don't affect the served app; committing + pushing them still triggers a Vercel prod redeploy.
- No tracked app code modified.

## Localhost status
- **Not running.** Start: `npm run dev` -> Vite (default http://localhost:5173).

## Deployment state
- **origin/main == local HEAD == `af3bea4`** (2026-06-19, "Add Corporate Tax Study (cpa-dashboard) tile + proxy"). Production auto-deploys from `main`, so prod tracks `af3bea4`. **Not independently re-verified via Vercel this session** - last MCP-verified deploy was `14e14aa` on 2026-06-06.

## Obsidian sync state
- Vault = the Builder_OS folder. Target `01 Projects/Fast Insights/00 Command Center/Agent State/AR Tool-Beta/`. Notes still not created (lazy).

## Next recommended action
- Pick the email-notification path (ask Jessica which of the 3) before building anything.
- Optional housekeeping: `git add agent-state CLAUDE.md && git commit -m "Refresh agent-state + CLAUDE.md"` (pushing `main` redeploys prod; these files don't change the app).

## Exact commands to run next
```
git status --short
npm install        # if node_modules is absent
npm run dev        # preview locally
npm run test       # vitest
```

## Files most likely relevant next (if building notifications)
- New: a Supabase Edge Function + email-provider integration. Existing `src/lib/supabase.ts` shows the client pattern. Customer AP emails live in the `customers` data (`ap_email`).

## Safe to start a new session?
- **Yes.** Working tree clean (only untracked agent-state/CLAUDE.md), nothing mid-flight. Use `agent-state/NEXT_SESSION_PROMPT.md`.
