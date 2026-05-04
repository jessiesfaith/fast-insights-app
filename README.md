# AR Tool-Beta

A modern, glassmorphic AR reconciliation dashboard that runs locally in a browser.
Builds to a **single self-contained HTML file** for portable distribution. No backend.

Designed for three audiences with one artifact:

- **AR team** — daily cash application and exception triage
- **CFO** — clean, scenario-aware monthly review
- **External auditors** — month-end PBC support pack with tickmarks, sign-off, and exportable evidence

Detection rules are structural — they ignore the `notes` field, so they work on real
production data, not just seeded test data. See `BUILD.md` for the full spec.

---

## Quick start

```bash
npm install
npm run dev          # local dev server with hot reload (http://localhost:5173)
npm run build        # produces dist/ar-tool-beta.html (one file, openable by double-click)
npm run preview      # serve the built single-file artifact
npm test             # full vitest suite (90+ tests)
```

`dist/ar-tool-beta.html` works fully offline once built — drop it on a USB stick,
email it, host it on a static path; it just opens.

---

## What's in the box

| Tab            | What you get                                                                  |
| -------------- | ----------------------------------------------------------------------------- |
| **Import**     | Drag-drop or click to upload the six CSVs · "Load sample data" demos the app · "Import JSON snapshot" restores a previous close losslessly |
| **Dashboard**  | 8 KPI tiles · three-way recon (Subledger AR / GL 1200 / Bank cleared) with variance walks · AR Bridge roll-forward · aging chart and customer breakdown · scenario filters · "As-is / Cleaned" toggle · what-if sliders |
| **Exceptions** | Two-pane queue: 9 detection categories + aged-unapplied synthetic, severity color-stripe, sortable / filterable, evidence tabs (Subledger / GL / Bank), workflow controls (status, assignee, comment, append-only audit log) |
| **Audit pack** | Cover · three-way recon · AR Bridge · aging schedule · KPI summary · exception summary (with resolve counts) · tickmark legend · sign-off block · PDF / Excel / JSON snapshot exports |

---

## Keyboard shortcuts

Press <kbd>?</kbd> from anywhere for the full list.

| Key                        | Action                                       |
| -------------------------- | -------------------------------------------- |
| <kbd>?</kbd>               | Toggle the keyboard-shortcuts overlay        |
| <kbd>P</kbd>               | Toggle full-screen presentation mode         |
| <kbd>/</kbd>               | Focus the exception search box               |
| <kbd>J</kbd> / <kbd>↓</kbd> | Next exception in the queue                 |
| <kbd>K</kbd> / <kbd>↑</kbd> | Previous exception                          |
| <kbd>R</kbd>               | Toggle the selected exception's Resolved status |
| <kbd>Esc</kbd>             | Dismiss overlays                             |

---

## Sample data

`public/sample-data/` (and `src/sample-data/`, inlined into the single-file build for
the in-app "Load sample data" button) ships six seeded CSVs:

| file                    | rows | period range |
| ----------------------- | ----:| ------------ |
| `invoices.csv`          | ~343 | 2026-01..03  |
| `cash_receipts.csv`     | ~208 | 2026-01..04  |
| `credit_memos.csv`      |  ~40 | 2026-01..03  |
| `gl_entries.csv`        |~1184 | 2026-01..03  |
| `bank_statements.csv`   |  ~94 | 2026-01..04  |
| `customers.csv`         |  ~60 | n/a          |

The seeded `SCENARIO:` tags in the `notes` columns are **assertion targets** for the
test suite — the detection logic itself never reads them. The acceptance suite
verifies detection still produces identical exception_ids after the `notes` columns
are stripped.

---

## Architecture

- **Vite + React 18 + TypeScript** multi-file source tree → `vite-plugin-singlefile` bundle for distribution
- **Domain logic** in `src/lib/` is pure, typed, and tested:
  - `parse.ts` (CSV ingestion · header validation · FK warnings)
  - `recon.ts` (three-way recon · variance walks · AR Bridge)
  - `kpis.ts` (DSO countback · % current · concentration · …)
  - `aging.ts` (bucket math · customer breakdown)
  - `detect.ts` (9 + 1 exception categories, all structural)
  - `workflow.ts` (status / assignee / comment transitions, append-only audit log)
  - `customer.ts` (drill-down summary, AR trend, open invoices)
  - `scenario.ts` (filter graph + what-if transformations + demo states)
  - `export/json.ts`, `export/excel.ts`, `export/pdf.ts`
- **Persistence**: a single `localStorage` entry holds the data, summaries, operator,
  workflows, tickmarks, and sign-off. JSON snapshot export/import is the canonical
  archival artifact; embedded per-dataset FNV-1a hashes flag tampering on re-import.
- **Glass on screen, ink on paper**: the print stylesheet strips every `backdrop-filter`,
  flattens shadows, and dynamically injects `@page` margin boxes with entity / period /
  page numbers / generated-by-and-when on every PDF page.

---

## Acceptance criteria

`BUILD.md` §16 sets out 14 criteria; this build verifies them as follows:

| #  | Criterion                                                            | Verified by                                                                |
| -: | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1  | CSV upload accepts all six files and shows an import summary         | `tests/acceptance.test.ts` + `tests/parse.test.ts`                         |
| 2  | Detection works after the `notes` columns are stripped               | `tests/acceptance.test.ts` (re-runs detection on stripped data, identical IDs) |
| 3  | Each seeded `SCENARIO:` row maps to its expected category            | `tests/acceptance.test.ts` + `tests/detect.test.ts` (RCP-00109, INV-00031, INV-00023, INV-00011/56, INV-00016/96, BNK-00062–66, CM-0001/8/14, DEP-0005 receipts) |
| 4  | Three-way recon ties or surfaces every reconciling item              | `tests/acceptance.test.ts` (every variance line carries source records)    |
| 5  | AR Bridge ties to ending subledger AR                                | `tests/acceptance.test.ts` + `tests/recon.test.ts` (independent recompute)  |
| 6  | Light/dark mode toggle works, persists across reload, WCAG AA        | manual visual check (theme toggle persists to `localStorage`)              |
| 7  | Workflow state persists across browser refresh                       | `tests/acceptance.test.ts` (JSON round-trip of workflow object)            |
| 8  | JSON snapshot export → import round-trips losslessly                 | `tests/acceptance.test.ts` + `tests/snapshot.test.ts`                      |
| 9  | PDF export produces a clean, paginated, non-glassmorphic pack         | manual visual check (`@media print` strips glass; `@page` adds footer)     |
| 10 | Excel export produces the 10-sheet workbook                          | `tests/acceptance.test.ts` (`AUDIT_PACK_SHEET_NAMES` matches §12 exactly)   |
| 11 | Scenario engine recomputes recon + KPIs against the filtered view    | `tests/acceptance.test.ts` + `tests/scenario.test.ts`                      |
| 12 | `npm run build` produces a single `dist/ar-tool-beta.html`           | `tests/acceptance.test.ts` (file exists, > 100 KB, doctype check)          |
| 13 | No console errors on a clean run                                     | manual run                                                                 |
| 14 | Vitest suite passes                                                  | `npm test`                                                                 |

Run the consolidated acceptance sweep with:

```bash
npx vitest run src/tests/acceptance.test.ts
```

---

## Out of scope

Authentication, multi-tenancy, ERP integration, forecasting, dunning, FX. This is
reconciliation, not FP&A.
