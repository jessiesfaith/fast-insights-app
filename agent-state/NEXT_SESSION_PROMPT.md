Continue the AR Tool-Beta repo (fast-insights-app) from durable state, not the old chat transcript.

First read only:
- CLAUDE.md
- agent-state/HANDOFF.md
- agent-state/CURRENT_STATE.md
- agent-state/ACTIVE_REQUEST.md
- agent-state/DEPLOYMENT_STATUS.md
- agent-state/VERIFICATION_STATUS.md
- agent-state/OBSIDIAN_SYNC.md
- git status / git diff --name-only HEAD / git log -1 --oneline

Do not scan the whole repo unless needed. Do not rely on the prior chat.
Use rg/search before opening files. Open only files relevant to the next request.
Run from inside: 01 Projects/Fast Insights/10 Code Repos/AR Tool-Beta

Current objective:
LIKELY NEXT: Jessica is working through the new **Financial Model Lab** (`/financial-model`, kit in `financial-model/`) as a learner and will ask questions / request refinements "while going through the motions". Support her tab by tab; the module's conventions are documented in CLAUDE.md and agent-state/CHANGE_LOG.md (2026-08-28 entries). If content changes are requested, remember the red-review mechanism: `HIGHLIGHT_NEW` in `src/pages/FinancialModelLab.tsx` renders new sections red until she approves.

QUEUED IDEA (2026-08-28, from a ChatGPT suggestion Jessica shared): a **"Macro Monitor" level-2 module** — Treasury curve + Fed funds + credit spreads + CPI/unemployment with REAL data (FRED API), time-series features, walk-forward backtesting, recession/credit-tightening probabilities, and multi-agent orchestration (macro agent → credit agent → alert) on top of the same governance patterns. Positioning: it is the natural NEXT step after the Financial Model Lab, not a replacement — the Lab already is the "one deterministic pipeline first" that plan calls for, and CFL tabs 11/18 already carry the rates + regime-backtest teaching content to reuse. Build only after Jessica has worked through the Lab.

STILL QUEUED (older): email notifications for users (see ACTIVE_REQUEST.md) — blocked on Jessica picking the notification type and defining who the "users" are.

Active request status:
Last session (2026-08-28, remote) shipped the Financial Model Lab end to end — complete, deployed from `main` (`b9ddd35`). No app code change in progress.

Heads-up (current):
- Working tree is CLEAN. Only untracked items are agent-state/ + CLAUDE.md (durable local memory, not gitignored). The old Landing.tsx/vercel.json WIP edits are long committed.
- Stale prunable worktrees (old Documents\FAST\ path) were pruned 2026-06-24.

Local commands:
- dev: npm run dev  -> Vite (default http://localhost:5173)
- build: npm run build  (tsc -b && vite build) | single-file: npm run build:single
- test: npm run test  (vitest, 9 files) | typecheck: tsc -b | lint: none
- deploy: git push origin main (Vercel auto-deploy) | manual: npx vercel --prod

Verification status:
- build/test/typecheck/localhost: not run (no app code changed)
- deployment: NOT re-verified this session. Presumed READY at af3bea4 via auto-deploy (origin/main == HEAD). Re-confirm via Vercel MCP or curl -I https://app.fastinsights.io/ar.

Deployment:
Vercel project fast-insights-app (prj_iuzFgsyyAuGSMYHNiqtgVYxmQM42, team team_nctazuLdYORXTnrDm0PWCIJg). Verified READY, in sync with HEAD. Auto-deploys on push to main.

Env:
Supabase optional - VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (.env.local, gitignored; also Vercel env). App runs without them via upload/sample data.

Obsidian:
Vault = C:\Users\dough\OneDrive\_Jessica\Builder_OS. Target folder "01 Projects/Fast Insights/00 Command Center/Agent State/AR Tool-Beta/" (per-repo subfolder). Notes created lazily on first /cleanup-handoff. Update only for requirements/architecture/deployment/decisions/user-facing/setup/handoff/known-issue changes.

OneDrive caveat:
Files may be cloud placeholders; first read can be slow or error ("cloud file provider exited unexpectedly"). vercel.json / .env.local / .vercel/project.json were unreadable during setup. Retry / re-hydrate (open in Explorer or attrib -U).

Next action:
Confirm the email-notification path with Jessica, then /delta-update <change>. agent-state/ + CLAUDE.md may be committed as housekeeping (pushing main redeploys prod; they don't change the app).

Return: what you read | current repo state | active request status | deployment status | any blockers | the first small action you will take.
