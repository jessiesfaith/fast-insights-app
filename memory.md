# memory.md — Reconciliation Toolkit

Working memory for the reconciliation toolkit. This is the project notebook: status,
decisions, and loose ends specific to this project. Personal/cross-project context
lives in the Cowork OS CLAUDE.md and memory.md. Newest entries at the top of each
section; prune anything stale.

_Last updated: 2026-05-22_

---

## What this project is

A set of tools that automate account reconciliations and connect the full accounting
workflow end-to-end — daily tasks, through month-end close, into reporting. Goal: a
faster, cleaner close with less manual work and fewer errors.

- **Owner:** Chris (CFO and CPA, Fast Insights).
- **Accounting system:** QuickBooks (in use today). Oracle and NetSuite are later
  target systems.
- **Build approach:** AI-assisted with Claude.

## Status

- Stage: early build / prototype.
- Tech stack: not yet chosen. Default working assumption is Python (pandas, openpyxl)
  for accounting data work — confirm before locking it in.
- Deployed: [note the deployed website/URL for this project, if any]
- Folder / repo: [fill in the project folder path or repo]

## Workflow scope (the end-to-end chain)

The toolkit is meant to cover, in order:

1. **Daily tasks** — [list the recurring daily prep steps to automate]
2. **Month-end close** — [list the close-stage reconciliations and tie-outs]
3. **Reporting** — [list the reports the close should feed]

_Fill these in as the scope firms up — the daily output should flow straight into
close, and close into reporting, with no re-keying._

## Reconciliations to automate

Track each reconciliation as its own line so we can prioritize.

| Account / recon | System(s) | Status | Notes |
|---|---|---|---|
| [e.g. Bank — operating] | QuickBooks | not started | [data source, cadence] |

## Architecture / stack notes

- [Key modules and how they fit together — fill in as built.]
- [How source data is exported from QuickBooks and ingested.]
- [Where outputs land and what format they take.]

## Decisions log

- **2026-05-22** — Python (pandas/openpyxl) is the default for accounting data work
  until a stack is formally chosen.

## Open items / follow-ups

- [ ] Choose the tech stack.
- [ ] Decide: start with QuickBooks only, or build system-agnostic from the start.
- [ ] Pick the first reconciliation to automate end-to-end as a proof of concept.
- [ ] Record the project folder path / repo and deployed URL above.

## Recently completed

- **2026-05-22** — Created this project memory file.
