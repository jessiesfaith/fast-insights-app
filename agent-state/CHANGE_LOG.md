# CHANGE_LOG

Newest first. Keep entries to a few bullets - no long logs.

## 2026-06-24 - Supabase/email Q&A + agent-state refresh (clean & handoff)
- **Files:** `agent-state/*` refreshed to current reality (were 18 days stale: wrong HEAD `14e14aa`, described 2 WIP files + 3 worktrees that no longer exist). No app code touched.
- **Findings:** Fast Insights IS on Supabase ("ar-recon" project, read-only AR data in `src/lib/supabase.ts`; Cashflow has its own Supabase backend). No Supabase Auth / user accounts / stored user emails anywhere -> email notifications require an email provider (Resend/etc.) via a Supabase Edge Function. Decision on which notification type left open (Jessica dismissed the question).
- **Git:** HEAD == origin/main == `af3bea4`, tree clean. Pruned 2 stale `prunable` worktrees pointing at the old `Documents\FAST\` path.
- **Deploy:** Unchanged - prod tracks `main` (presumed `af3bea4`, not re-verified via Vercel this session).

## 2026-06-06 - Initialize agent-state workflow
- **Files:** `CLAUDE.md` (new), `agent-state/*` (8 files, new). No app code touched.
- **Reason:** Durable per-repo state + handoff so future sessions work from repo/git/deploy/Obsidian state instead of re-reading the whole chat. Uses the global `/delta-update` + `/cleanup-handoff` skills in `~/.claude/`.
- **Detected:** npm + React 18 / TypeScript / Vite 5 SPA; tests via vitest (9 files); no lint; typecheck = `tsc -b`.
- **Verification:** Deployment verified READY via Vercel MCP (`fast-insights-app`, deploy `dpl_4z94uMxjGoMnR48fM66gSJS5oFD7`, commit `14e14aa` == local HEAD). No build/test run (no app code changed).
- **Deployment:** Unchanged - production at `14e14aa`, `READY`.
- **Obsidian:** Sync target recorded; notes created lazily on first `/cleanup-handoff`.
- **Notes:** Pre-existing modified files (`src/pages/Landing.tsx`, `vercel.json`) and `.claude/worktrees/` left untouched. `vercel.json` / `.env.local` / `.vercel/project.json` were unreadable (OneDrive Files-On-Demand); IDs sourced from Vercel MCP.
