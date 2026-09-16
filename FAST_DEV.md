# FAST_DEV — running this repo without cooking your laptop

Practical notes on the fastest way to work in `fast-insights-app`: what you need
running, what you can skip, what is actually slow, and what to push off your
machine. Every timing below was measured in this repo, not estimated.

---

## Fastest way to start

```bash
npm install          # once
npm run dev:fast     # http://localhost:5173
```

`dev:fast` is `dev` without the browser auto-open. That is the whole difference —
Vite's dev server is genuinely fast here (**ready in ~230 ms**), so there is no
slower "full" mode to escape. Use `npm run dev` if you *want* the tab opened.

You do **not** need to build, typecheck, or run tests to see your change in the
browser. Vite serves TypeScript without typechecking it; the editor gives you the
red squiggles. Save the typecheck for before you commit.

---

## The scripts

| Script | What it does | When you need it |
|---|---|---|
| `dev` | Vite dev server, opens a browser tab | Normal loop |
| `dev:fast` | Same, no browser tab | Normal loop, or when a tab is already open |
| `typecheck` | `tsc -b` — incremental, cached | Before committing |
| `test` | `vitest run`, all 34 suites (~6.5 s) | Before committing |
| `test:changed` | Only suites affected by your uncommitted changes | Inner loop |
| `test:watch` | Vitest in watch mode | See the CPU warning below |
| `build` | `tsc -b && vite build` | Rarely — Vercel does this for you |
| `build:single` | One self-contained `dist/ar-tool-beta.html` | Shipping the standalone file |
| `preview` | Serves the last `build` output | Checking a production bundle |
| `clean` | Deletes `dist`, both `.tsbuildinfo`, `node_modules/.vite` | When caches look stale |

### Required vs. skippable locally

**Required:** the Vite dev server. That is it. One process.

**Skippable:**

- **`npm run build`.** Pushing to `main` makes Vercel build. Building locally to
  "check it works" duplicates ~19 s of CPU that a server is about to spend anyway.
  Run it locally only when you are debugging something build-specific (chunking,
  the single-file output, an `import.meta.env` problem).
- **`npm run test:watch`.** Watch mode holds a Node process that re-runs suites on
  every save, and this repo has 34 suites / 406 tests. On battery, prefer
  `npm run test:changed` on demand — it runs only what your edits touched.
- **Supabase.** Entirely optional. Without `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` in `.env.local`, only the cloud-load path is disabled;
  upload and the built-in sample data work normally. There is no local database,
  no Docker, no backend process to run. (There is no Dockerfile in this repo at
  all — if you were looking for one, that is why.)
- **A second terminal for typechecking.** `tsc -b --watch` is redundant with your
  editor's TS server. Two full TypeScript programs for the same files is the most
  common accidental CPU sink in a repo this size.

---

## What is actually slow here (measured)

**1. The typecheck was re-running from scratch every single time.** This was a real
bug, now fixed. `tsconfig.json` sets `noEmit: true` but had no `incremental`, so
`tsc -b` looked for an emitted `src/App.js`, never found it, and declared the
project out of date on *every* invocation:

```
Project 'tsconfig.json' is out of date because output file 'src/App.js' does not exist
```

Adding `"incremental": true` fixed it. Measured, same machine:

| | before | after |
|---|---|---|
| `npm run typecheck`, nothing changed | 12.0 s | **0.3 s** |
| after editing one `src/lib` file | 12.0 s | **2.5 s** |
| after editing `CorporateFinanceLab.tsx` (8,013 lines) | 12.0 s | **7.1 s** |
| `npm run build`, nothing changed | 18.7 s | **6.4 s** |

`.tsbuildinfo` is already gitignored, so nothing new lands in git.

**2. The dev server was watching directories that are not source.** `server.watch.ignored`
now skips `.claude/**`, `agent-state/**`, `financial-model/**`, `dist/**` and
`*.tsbuildinfo`. The one that matters is `.claude/worktrees/` — it holds **full
copies of this repo**, so chokidar was holding file handles on every file in every
worktree, for nothing. (Vitest already excluded it for the same reason.) Vite merges
this list with its own defaults, so `node_modules` and `.git` are still ignored.

**3. Every route loads every page.** `src/App.tsx` imports all six pages eagerly, so
opening *any* route pulls in *all* of them:

```
first load of /arr-and-churn: 2925 ms, 129 module requests
page modules the browser fetched: ARTool, ArrAndChurn, CorporateFinanceLab,
                                  FinancialModelLab, MarketScenarios
```

That is 8,013 lines of Corporate Finance Lab and 3,017 of Financial Model Lab
transformed to look at a page that needs neither. It is also why the production
bundle is one 2.66 MB chunk and Vite prints a size warning on every build. **Not
fixed here** — see the recommendation below, it is your call.

**4. `build:single` was broken.** It called `cross-env`, which is not in
`devDependencies`, so the script failed outright. Rewritten to use Vite's
`--mode single`, which needs no shell syntax and so behaves the same on Windows
and Unix — no new dependency. `SINGLE_FILE=1` still works if you have it exported.
Verified: `dist/ar-tool-beta.html`, 2.9 MB, self-contained. The default `build`
output is byte-identical to before (same bundle hash).

---

## Recommended next — not done, because it is your call

### Lazy-load the routes

The single biggest remaining win, for both dev and users. In `src/App.tsx`:

```tsx
const CorporateFinanceLab = lazy(() => import('./pages/CorporateFinanceLab'));
// ...and the rest, wrapped in one <Suspense fallback={...}>
```

**Gains:** a cold dev page load stops transforming four unrelated pages; HMR after
editing one page stops competing with the others; the 2.66 MB bundle splits per
route, so a visitor to `/ar` no longer downloads the Corporate Finance Lab; the
chunk-size warning goes away.

**Tradeoffs, honestly:**

- Route changes get a brief loading state. You need a `<Suspense>` fallback that
  does not flash — on this glass design, an empty div is noticeable.
- The production artifact changes shape: one chunk becomes ~7. Vercel handles this
  fine, and `build:single` still works (`inlineDynamicImports: true` is already
  configured for that mode), but it is a real change to what gets deployed.
- With eager imports, Vite's dependency scan finds every npm package up front.
  With lazy routes it will not, so you may hit a mid-session *"new dependencies
  optimized, reloading"* page reload the first time you visit a route. Fix by
  listing the heavy ones in `optimizeDeps.include`: `recharts`, `xlsx-js-style`,
  `@supabase/supabase-js`, `lucide-react`, `papaparse`. (Adding that list *today*
  would be a no-op, which is why it is not in the config.)

This is ~10 lines. Say the word and it is a five-minute change.

### Split `CorporateFinanceLab.tsx` (8,013 lines)

Every save re-transforms the whole file, and every typecheck after touching it
costs 7 s instead of 2.5 s. Extracting its tabs into `src/components/corpfinance/`
would cut both. This is a genuinely large refactor with real regression risk on a
page with no component tests — worth doing deliberately, not opportunistically.

### Not recommended here

- **Turborepo / Nx.** These cache tasks *across packages*. This is a single package;
  there is nothing to orchestrate. The caching that pays off here is `.tsbuildinfo`,
  which now works.
- **Switching to pnpm.** Real disk savings from the content-addressed store, but it
  changes the lockfile, and Vercel's build would need to pick up the new package
  manager. Not worth it for one repo unless you are standardising across all the
  sibling tool projects.
- **Docker.** There is nothing to containerise — this is a static SPA with an
  optional hosted Supabase.

---

## Caching, in one place

| Cache | Where | Clear it with |
|---|---|---|
| TypeScript incremental state | `tsconfig.tsbuildinfo`, `tsconfig.node.tsbuildinfo` | `npm run clean` |
| Vite dependency pre-bundle | `node_modules/.vite` | `npm run clean` |
| Vitest module transforms | `node_modules/.vite` | `npm run clean` |
| npm package cache | `~/.npm` (global) | `npm cache clean --force` |
| Vercel build cache | Vercel-side, automatic | Redeploy without cache in the dashboard |

`npm run clean` is safe to run any time; it only deletes regenerable artifacts.
Reach for it when the dev server serves something stale or the typecheck disagrees
with your editor.

---

## Running heavy things somewhere else

**Production builds → Vercel.** `git push origin main` triggers a deploy through
the GitHub integration. You do not need to build locally first. `npx vercel --prod`
also builds remotely, not on your machine.

**The Financial Model Lab pipeline → anywhere but your laptop, ideally.**
`financial-model/run_pipeline.py` installs pandas + scikit-learn and trains a model.
It is the heaviest task in this repo by a wide margin, and it only needs re-running
when the kit itself changes (then refresh the constants in `src/lib/financialModel.ts`
and re-zip `public/financial-model/financial-model-kit.zip`). Run it in a cloud
session or a spare machine, not while you are on battery.

**Long test runs and refactors → a Claude Code web session.** Sessions at
[claude.ai/code](https://claude.ai/code) run in a cloud container against a fresh
clone, so the full suite, a `--force` typecheck, or a wide refactor costs you no
local CPU. Anything worth keeping has to be committed and pushed before the
container is reclaimed.

**One thing that must stay local:** the OneDrive-synced vault this repo lives in.
Files can be cloud placeholders, and the first read of one can be slow or fail with
*"The cloud file provider exited unexpectedly"*. If a tool reports a file it cannot
read, re-hydrate it (open it in Explorer, or `attrib -U <file>`) and retry — it is
not a build problem.
