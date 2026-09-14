# Fast Insights — recommended updates

Consolidated from the Revenue Schedule build spec (sub-rev-sch), the adversarial code review
(24 findings, Sep 2026), the Rocket Money competitor study (`research/rocket-money.md`), and
infrastructure notes. Pulse survey feedback (`pulse_feedback` in Supabase) feeds this list —
review it monthly and re-rank.

## Now (unblock what's already built)

1. **Merge PR #1** — Revenue Schedule tool, Pulse widget, research. Nothing below matters
   until this is on `main`.
2. **Set `ANTHROPIC_API_KEY` in the Vercel project env** — turns on invoice reading
   (Revenue Schedule uploads) and Pulse chat personalization. Everything degrades gracefully
   without it, but these are the headline behaviors.
3. **Create the `pulse_feedback` table in Supabase** — SQL is in the header of
   `src/lib/pulseStore.ts`. Until it exists, Pulse runs in demo mode: survey answers save on
   the user's device and are viewable at `/pulse-inbox` (owner/demo page, not on the Landing
   grid), with JSON export.
4. **Create the `sub-rev-sch` GitHub repo** and push the staged spec/prototype materials
   (Claude has them ready — the integration can't create repos itself).

## Next (Revenue Schedule v2 — from the build spec)

5. **XLSX export with live formulas and a connected chart** — the spec's headline
   deliverable: a workbook that recalculates when the user edits an amount/date/term in
   Excel. Template-with-embedded-chart approach; verify chart survival in Excel, Numbers,
   and Google Sheets.
6. **Three pluggable recognition policies** (`daily` / `midMonth` / `fullFirstMonth`) —
   selectable per line, each unit-tested, each expressible as an Excel formula so the live
   export stays honest.
7. **QuickBooks Online + Xero journal exports** — one entry per month (Dr Deferred Revenue /
   Cr Revenue), user-configurable account names, monthly-summary vs. per-line option,
   posting-date convention (last day of month default).
8. **Renewal & price-increase alerts** — the B2B version of Rocket Money's most-loved
   feature: we already know every term end from invoices, so "INV-2044 renews in 30 days at
   $18,000" is an email/digest away. Needs an email provider (Resend via a Supabase Edge
   Function was the earlier finding — no user emails are stored today).
9. **Recurring-revenue detector** — infer recurring revenue lines from an invoice-history
   export using the same maturity heuristic Plaid uses (≥3 occurrences, consistent
   description/amount/cadence). Turns a data dump into a populated schedule.
10. **`canExport(format)` entitlement gate at the app shell** — on-screen schedule free,
    downloads gated, so the free/paid line can move later without touching the module.

## Security & infrastructure

11. **Replace or isolate `xlsx-js-style`** — it forks SheetJS 0.18.x, which carries known
    CVEs (prototype pollution, ReDoS), and Revenue Schedule now parses *untrusted uploads*
    through it. Prefer official SheetJS ≥0.20.2 for reads; keep the styled writer only for
    trusted export paths.
12. **Rate limiting on `/api/extract` and `/api/assist`** — the origin allowlist blocks
    casual cross-site abuse but not a determined caller with a spoofed Origin; add Vercel
    WAF rules or an auth gate before traffic grows.
13. **Wire Pulse feedback into a review habit** — a monthly look at `pulse_feedback` rows
    (role, pains, wishes, which pains matched no tool) is the whole point of the widget.

## Later / experiments

14. **Cadence digests** — turn a user's Pulse plan into an opt-in weekly/monthly email
    (mirrors Rocket Money's weekly + monthly reports; every alert user-tunable per channel).
15. **Pay-what-you-want pricing experiment** for paid exports — Rocket Money's slider works
    (4.1M payers), but show the feature list at the moment of pricing and never shame the
    low end; their teardown criticism and CFPB complaint map the trust-destroyers to avoid
    with an audience handling client financials.
16. **Period-close controls** for Revenue Schedule (locking, restatement) — explicitly
    descoped from v1; revisit if CPA users ask via Pulse.
