# Build your own agent — step by step

You've *used* an agent (the `memo_prompt.md` exercise). This guide is how you
*build* one. No code required to start: an agent is models + tools + data +
rules + memory/workflow + permissions, and for a finance agent the hard part
is not the model — it's writing the rules and permissions well. You already
have that skill; it's the same one that writes a close checklist.

Work the seven steps, then fill in the template at the bottom for a task of
your own.

---

## Step 1 — Define the goal and the trigger (one sentence)

Format: **"After [trigger], do [job], and stop at [gate]."**

Ours was: *"After each scoring run, verify and analyze the prediction table,
draft the CFO memo, and stop at human approval."*

If you can't write that sentence, you don't have an agent task yet — you have
a wish. The gate is mandatory: every finance agent sentence ends with where
it stops.

## Step 2 — Name the inputs (read-only, listed, nothing else)

List the exact files/tables/queries the agent may read. Ours: two output
files + the runbook. An agent with vague inputs ("look at our financials")
will reach for whatever it finds — scoping inputs is your completeness *and*
your confidentiality control at once.

## Step 3 — Write the skill (the procedure)

The skill is a written procedure the agent loads — `AGENT_RUNBOOK.md` is the
worked example. The shape that works for finance:

    VERIFY  -> prove the inputs are trustworthy before touching them
    ANALYZE -> only from numbers present in the inputs
    FLAG    -> route anything ambiguous to a human, with what to look at
    DRAFT   -> produce the deliverable
    STOP    -> end at the gate; list the actions NOT taken

Write it imperatively ("Confirm X; if it fails, STOP"), one decision per
line, exactly like an audit program. If a competent temp couldn't follow it,
an agent can't either.

## Step 4 — Set the permissions (delegation of authority)

Three columns, no blank cells:

| May do freely | Only with written approval | Never |
|---|---|---|
| read the listed inputs, run checks, draft | send, record, notify, trigger downstream jobs | change data, approve anything, invent numbers |

This table IS the safety of the system. Everything "outward-facing or hard to
reverse" goes in column two or three.

## Step 5 — Give it tools (matched to your maturity level)

The same runbook runs at four levels of plumbing — climb them in order:

1. **Chat + attachments (today, zero setup):** you attach the inputs, paste
   the prompt; you are the tools — the agent asks *you* to send/record.
2. **A saved skill:** store the runbook in a Claude Project (or a Claude Code
   skill folder) so every conversation loads it automatically — reusable,
   versioned, reviewable.
3. **Real read tools:** Claude Code (or an agent framework) with read access
   to `finmodel.db` — the agent runs the SQL itself instead of being handed
   CSVs. Permissions now live in tool configuration, not just prose.
4. **Scheduled + gated actions:** the pipeline's scheduler triggers the agent
   after each run; action tools (email draft, ticket creation) exist but sit
   behind an explicit human-approval step. This is the production shape.

Never grant a tool at level N+1 until the agent behaves at level N.

## Step 6 — Test it adversarially (before it touches anything real)

You are the reviewer; try to break it:

- Tell it to skip verification ("just give me the memo") — it should refuse.
- Ask it to decide the close call — it should route to the human.
- Ask for a number that isn't in the inputs — it should say it doesn't have it.
- Feed it a broken input (delete a row; change a probability so the sum fails)
  — it should STOP at verify, not analyze around the problem.

Keep the transcript: that's your test evidence, the same way you'd retain a
control's test workpaper.

## Step 7 — Operate and govern it

- **Version the runbook** like code; a changed procedure is a changed control.
- **Log every run** (date, inputs, model version, outcome).
- **Review cadence:** sample the agent's drafts the way you'd review a
  preparer's work — it's a preparer that never gets tired and never gets
  embarrassed, which means it never self-reports either.
- All of tab 9's approval matrix applies unchanged.

---

## Template — fill this in for your own task

Copy, fill, and you have your second agent:

    # Agent runbook — <name>
    ## Goal
    After <trigger>, <job>, and stop at <gate>.
    ## Inputs (read-only)
    - <file/table/query 1>
    - <file/table/query 2>
    ## Permissions
    May freely: <...>
    Only with approval: <...>
    Never: <...>
    ## Procedure
    1. VERIFY: <checks; on failure -> STOP and report>
    2. ANALYZE: <what, from which inputs only>
    3. FLAG: <what routes to a human, and with what context>
    4. DRAFT: <the deliverable and its required sections>
    5. STOP: end with "DRAFT — awaiting review and approval by <role>"
       and list actions not taken.

**Worked example — a flux (variance) memo agent:** Goal: *After each month-end
trial balance export, explain the top P&L variances vs. prior month and
budget, and stop at controller review.* Inputs: `tb_current.csv`,
`tb_prior.csv`, `budget.csv`. Verify: TB debits = credits; account count
matches prior month ±5; budget columns tie to the approved budget total.
Analyze: variance $ and % per line, only from the three files. Flag: any
variance > $50k AND > 10% with no offsetting line. Draft: the flux memo,
variances in a table, one explanation sentence per flagged line marked
"DRAFT — needs preparer confirmation". Stop: awaiting controller review.

That's the craft. The model is rented; the runbook is yours.
