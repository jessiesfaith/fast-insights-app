# AR Tool-Beta (fast-insights-app) -- repo notes

Generic workflow rules live in `~/.claude/CLAUDE.md` (they apply to every repo). This file holds
**repo-specific facts only**. Source of truth = this repo + `agent-state/*.md`, not the chat transcript.

## Repo facts (verified 2026-06-06)
- **What:** Modern glassmorphic **accounts-receivable (AR) reconciliation dashboard** for Fast
  Insights. Ingests six AR datasets (invoices, cash receipts, credit memos, GL entries, bank
  statements, customers) via CSV/JSON upload, built-in sample data, or a Supabase cloud project,
  then runs reconciliation, aging, KPIs, bad-debt and scenario analysis with an ICFR-style audit
  trail. This repo is the multi-tool host: AR tool at `/ar`, Landing tool-picker at `/`, plus
  proxies for the finance tools to sibling Vercel projects. Also serves a **bundled static Launch
  Gantt** at `public/gantt/index.html` (route `/gantt`, opened by a top-right button on the Landing;
  login-gated) — edit that file + `git push` to update it.
- **Package manager / framework:** **npm** (`package-lock.json`). **React 18 + TypeScript + Vite 5**
  SPA with `react-router-dom` v7. Key deps: `@supabase/supabase-js`, `papaparse`, `xlsx-js-style`,
  `recharts`, `lucide-react`.
- **Key files:** `src/main.tsx` (entry), `src/App.tsx` (router), `src/pages/ARTool.tsx` (AR
  dashboard), `src/pages/Landing.tsx` (tool picker), `src/lib/*` (domain logic: recon, aging, kpis,
  badDebt, scenario, parse, detect, supabase, lockedPeriod, workflow), `src/types/*`, `src/styles/*`
  (glass/tokens/globals/print CSS), `vercel.json` (SPA rewrites + /revrec + /cashflow proxies),
  `index.html` (applies theme pre-paint, defaults dark).
- **Dev (localhost):** `npm run dev` -> Vite dev server (default http://localhost:5173).
- **Build:** `npm run build` (`tsc -b && vite build`). Single-file build: `npm run build:single`
  (`vite-plugin-singlefile`, `SINGLE_FILE=1`). Preview: `npm run preview`.
- **Test:** `npm run test` (`vitest run`; 32 test files in `src/tests/`, ~374 tests as of
  2026-08-28). Watch: `npm run test:watch`.
- **Financial Model Lab (added 2026-08-28):** teaching module at `/financial-model`
  (`src/pages/FinancialModelLab.tsx` + `src/lib/financialModel.ts`). Its runnable learning kit lives
  in `financial-model/` (Python + SQL, seed 42); the numbers baked into the lib/page are that kit's
  real outputs. If the kit changes: re-run `python run_pipeline.py`, refresh the constants in
  `src/lib/financialModel.ts`, and re-zip `public/financial-model/financial-model-kit.zip`.
- **Typecheck:** `tsc -b` (no standalone script; also the first half of `npm run build`).
- **Lint:** none configured. TS `strict` + `noUnusedLocals`/`noUnusedParameters` are the gate.
- **Deploy:** `git push origin main` -> Vercel auto-deploys (GitHub integration).
  Manual alt: `npx vercel --prod` (global `vercel` CLI not assumed -- use `npx`).
- **Production:** https://app.fastinsights.io (AR Tool at **/ar**, Landing at **/**). Vercel project
  `fast-insights-app` (`prj_iuzFgsyyAuGSMYHNiqtgVYxmQM42`, team `team_nctazuLdYORXTnrDm0PWCIJg`).
  Aliases: ar-tool-seven.vercel.app, fast-insights-app-jessica-dougherty-s-projects.vercel.app.
- **Env:** Supabase is **optional** -- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (the "ar-recon"
  Supabase project), in `.env.local` (gitignored) for dev + Vercel env for prod. Without them the
  cloud-load path throws a clear error; the app still works via upload/sample data.

## agent-state/ files (durable memory)
`CURRENT_STATE.md` | `ACTIVE_REQUEST.md` | `VERIFICATION_STATUS.md` | `DEPLOYMENT_STATUS.md` |
`CHANGE_LOG.md` | `HANDOFF.md` | `NEXT_SESSION_PROMPT.md` | `OBSIDIAN_SYNC.md`.
If any is missing, recreate it with the same headings the others use.

## Environment notes (this machine)
- **OneDrive Files-On-Demand:** this repo is inside a OneDrive-synced Obsidian vault. Files may be
  cloud placeholders; the first read can be slow or error ("The cloud file provider exited
  unexpectedly"). During setup, `vercel.json` / `.env.local` / `.vercel/project.json` were
  unreadable for this reason. Retry once, or re-hydrate (open in Explorer / `attrib -U <file>`).
- **Do NOT touch:** pre-existing working-tree edits (`src/pages/Landing.tsx`, `vercel.json` as of
  2026-06-06) and `.claude/worktrees/` (3 active worktrees). Do not stage, revert, or deploy them.
- Obsidian notes for this repo live in the vault, NOT in this repo -- see
  `agent-state/OBSIDIAN_SYNC.md` (target: `01 Projects/Fast Insights/00 Command Center/Agent State/AR Tool-Beta/`).
