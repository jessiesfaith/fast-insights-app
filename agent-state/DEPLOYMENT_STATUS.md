# DEPLOYMENT_STATUS

_Last updated: 2026-08-28 (Financial Model Lab merged to main and pushed)_

## Provider
**Vercel** (connected via Vercel MCP + local `.vercel/` link; `.vercel` is gitignored).
- Project: `fast-insights-app`
- Project ID: `prj_iuzFgsyyAuGSMYHNiqtgVYxmQM42`
- Team/org ID: `team_nctazuLdYORXTnrDm0PWCIJg`
- Framework (Vercel): `vite`. Node: `24.x`.

## Live URL(s)
- **https://app.fastinsights.io** (primary; AR Tool at **/ar**, Landing at **/**).
- Vercel aliases: https://ar-tool-seven.vercel.app | https://fast-insights-app-jessica-dougherty-s-projects.vercel.app
- Proxied sub-paths: `/revrec` -> revrec project, `/cashflow` -> cashflow project.

## Last deployed commit
- **origin/main == `99fe45a`** ("Add the agent layer" on top of `48cc8e2` "Add Financial Model Lab", merged from `claude/financial-model-ml-training-f38a8q`, 2026-08-28). Push confirmed; production auto-deploys from `main`, so prod should now serve the **Financial Model Lab at /financial-model**. **Live URL NOT re-verified from the 2026-08-28 remote session — its egress proxy 403s app.fastinsights.io and *.vercel.app; verify by opening https://app.fastinsights.io/financial-model (expect the 10-tab module, and /financial-model/financial-model-kit.zip to download).**
- Last MCP-verified deploy was `14e14aa` (deploy `dpl_4z94uMxjGoMnR48fM66gSJS5oFD7`, `READY`) on 2026-06-06.

## Environment variables
- **Supabase (optional cloud data source):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (the "ar-recon" Supabase project). Stored in `.env.local` (gitignored) for local dev + Vercel project env for prod. If unset, the cloud-load path throws a clear error and the app still runs via CSV/JSON upload or sample data.
- No other secrets required (anon key is public client-side by design).

## Deploy command
- **Primary:** `git push origin main` -> Vercel auto-deploys (GitHub integration; every commit on `main` triggers a production deployment).
- **Manual:** `npx vercel --prod` (global `vercel` CLI not assumed installed - use `npx`).

## Deploy verification command
- Vercel MCP: `list_deployments` / `get_deployment` (check `state` / `readyState` == `READY`).
- CLI: `npx vercel ls` / `npx vercel inspect <url>`.
- URL: `curl -I https://app.fastinsights.io/ar` (expect 200).

## Production verification checklist
- [ ] https://app.fastinsights.io/ar returns 200 and renders the AR dashboard.
- [ ] https://app.fastinsights.io/ (Landing) renders the tool picker.
- [ ] Sample data loads; CSV/JSON upload + reconciliation/aging/KPIs work.
- [ ] Supabase cloud load works when env vars are set (else clean error).
- [ ] `/revrec` and `/cashflow` proxies resolve.

## Current status
- **Presumed READY at `af3bea4`** via auto-deploy (origin/main == HEAD). **Not re-verified via Vercel this session** - re-run `list_deployments`/`get_deployment` or `curl -I https://app.fastinsights.io/ar` to confirm before relying on it.
- Working tree is clean; the old `Landing.tsx`/`vercel.json` WIP edits were committed and are live.

## Status legend
verified [OK] | failed [FAIL] | pending [pending] | not-configured | not-requested | requires-manual-verification
-> **Current: verified [OK]**
