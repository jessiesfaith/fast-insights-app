# CURRENT_STATE - AR Tool-Beta (fast-insights-app)

_Last updated: 2026-08-28 (Financial Model Lab merged to `main` at `99fe45a` with Jessica's approval; auto-deploying to app.fastinsights.io/financial-model)_

## Purpose
**AR Tool-Beta** - a modern glassmorphic accounts-receivable reconciliation dashboard for Fast Insights. It ingests six AR datasets (invoices, cash receipts, credit memos, GL entries, bank statements, customers) via CSV/JSON upload, sample data, or a Supabase cloud project, then runs reconciliation, aging, KPIs, bad-debt and scenario analysis with an ICFR-style audit trail. This repo is the multi-tool host at app.fastinsights.io: the AR tool lives at `/ar`, a Landing tool-picker at `/`, and it proxies each finance tool (`/revrec`, `/cashflow`, `/estimated-taxes`, etc.) to sibling Vercel projects. It also serves a **bundled static Launch Gantt** at `public/gantt/` → `app.fastinsights.io/gantt`, opened by a top-right button on the Landing (login-gated, session-only).

## Stack
- **Framework:** React 18 + TypeScript + Vite 5 (SPA, client-side `react-router-dom` v7).
- **Package manager:** npm (`package-lock.json` present).
- **Key deps:** `@supabase/supabase-js`, `papaparse` (CSV), `xlsx-js-style` (Excel export), `recharts` (charts), `lucide-react` (icons).
- **Build modes:** standard (`vite build`) and single-file (`build:single`, via `vite-plugin-singlefile` + `SINGLE_FILE=1`).
- **Test:** vitest (9 test files in `src/tests/`, ~100 tests).

## Key files
- `src/main.tsx` - entry; `src/App.tsx` - router (`/` Landing, `/ar` ARTool).
- `src/pages/ARTool.tsx` - the AR dashboard; `src/pages/Landing.tsx` - tool picker (MODIFIED in working tree).
- `src/lib/` - domain logic: `recon.ts`, `aging.ts`, `kpis.ts`, `badDebt.ts`, `scenario.ts`, `parse.ts`, `detect.ts`, `lockedPeriod.tsx`, `workflow.ts`, `supabase.ts`, `dataStore.tsx`.
- `src/types/` - data/recon/kpi/scenario/audit/workflow types.
- `src/styles/` - `glass.css`, `globals.css`, `tokens.css`, `print.css`.
- `vercel.json` - SPA rewrites + per-tool proxies + a `/gantt → /gantt/` redirect.
- `public/gantt/index.html` - **bundled static Launch Gantt** (self-contained; canonical source for the `/gantt` tool — edit here + push to update).
- `src/pages/FinancialModelLab.tsx` + `src/lib/financialModel.ts` - **Financial Model Lab** teaching module at `/financial-model` (SQL + Python + ML on a capital-allocation decision; 10 tabs incl. mock Power BI, traceable Excel, governance, EY lens). Runnable kit in `financial-model/`; downloads served from `public/financial-model/`.
- `index.html` - sets theme pre-paint (defaults dark); `vite.config.ts` (config) + generated `vite.config.js`/`.d.ts` (gitignored).

## Commands
| Purpose | Command |
|---|---|
| Local dev | `npm run dev` -> Vite dev server (default http://localhost:5173) |
| Build | `npm run build` (`tsc -b && vite build`) |
| Build (single-file) | `npm run build:single` |
| Preview build | `npm run preview` |
| Test | `npm run test` (`vitest run`) | watch: `npm run test:watch` |
| Typecheck | `tsc -b` (no standalone script; runs inside build) |
| Lint | none configured (TS `strict` + `noUnusedLocals`/`noUnusedParameters` enforce hygiene) |
| Deploy (prod) | `git push origin main` (Vercel auto-deploys) | manual: `npx vercel --prod` |

## Routes
- `/` - Landing tool picker. This repo is now the multi-tool host: tiles + proxies for the whole Fast Insights suite, each with a "Copy link" button.
- `/ar` - AR Tool dashboard (the main app).
- Proxied sub-paths to sibling Vercel projects (added incrementally through `af3bea4`): `/revrec`, `/cashflow`, `/trust-strategy-builder`, `/month-end-close`, `/inventory-reconciliation`, `/equity-management`, `/financial-statements`, `/lease-accounting`, `/fixed-assets-reconciliation`, `/cpa-dashboard`. (Verify exact rewrite list in `vercel.json` before editing.)

## Data sources (AR tool)
- Upload CSV/JSON, built-in sample data (`src/sample-data/*.csv`), or Supabase cloud ("ar-recon" project).
- Supabase optional: needs `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`; if unset the cloud-load path throws a clear error and the app still works via upload/sample.

## Latest known-good local state
- Branch `main` @ **af3bea4** ("Add Corporate Tax Study (cpa-dashboard) tile + proxy", 2026-06-19). **local HEAD == origin/main** (0 ahead / 0 behind).
- Working tree: **clean**. The old WIP files (`Landing.tsx`, `vercel.json`) were committed in the tile/proxy work. Only untracked items are `agent-state/` + `CLAUDE.md` (durable local memory; not gitignored, commit when ready).
- Production tracks `main` via auto-deploy -> prod presumed at `af3bea4` (not re-verified via Vercel this session 2026-06-24; last MCP-verified was `14e14aa`).
- `git worktree list` showed 2 **prunable** worktrees pointing at the dead old `Documents\FAST\` backup path - pruned this session.

## Known bugs / risks
- 2 uncommitted modified files (`Landing.tsx`, `vercel.json`) - work in progress; do not stage/revert blindly.
- `vercel.json` proxy rules for `/cashflow` were historically finicky (empty-path match) - verify rewrites after edits.
- Supabase creds live only in `.env.local` (gitignored) + Vercel env; missing creds disable cloud load.
- **OneDrive Files-On-Demand:** repo files may be cloud placeholders; first read can be slow or error ("cloud file provider exited unexpectedly"). `vercel.json` / `.env.local` / `.vercel/project.json` were unreadable this session for that reason. Retry / re-hydrate.

## Repo
- Path: `01 Projects/Fast Insights/10 Code Repos/AR Tool-Beta` (inside the Builder_OS vault)
- Remote: https://github.com/jessiesfaith/fast-insights-app.git (public)
- Branch: `main`
