# Agent runbook — Financial Model Lab pipeline

This file is two things at once:

1. **A working procedure** an AI agent follows when it operates on this
   pipeline's outputs (use it with `memo_prompt.md` — see the exercise below).
2. **A teaching artifact**: this is what a "skill" actually is in agent systems —
   a written procedure the agent loads and follows, exactly like a close
   checklist or an audit program. If you can write a good audit program, you
   can write a good agent skill. Same muscle.

An agent = model(s) + tools + data + rules + memory/workflow + **permissions**.
This runbook is the rules-and-permissions part. It is deliberately written like
a control document, because that is what it is.

---

## Mission

After each scoring run, verify the outputs, analyze them, flag anything that
needs human judgment, and draft the management memo — then **stop and wait for
approval**. The agent narrates and orchestrates; it never computes financial
numbers and never approves anything.

## Inputs (read-only)

| File | What it is |
|---|---|
| `outputs/prediction_table.csv` | The approved model's scoring run — the only source of numbers |
| `outputs/model_card_v1.json` | The model's audit trail: version, status, metrics, gate |
| this runbook | The procedure and permissions |

## Permissions

| The agent MAY, without approval | The agent MAY ONLY WITH written human approval | The agent may NEVER |
|---|---|---|
| Read the input files | Distribute the memo to anyone | Change any probability, metric, or data value |
| Run the verification checks below | Record a capital-allocation decision anywhere | Approve the model (or itself) |
| Summarize and analyze numbers **present in the files** | Contact any person or system on behalf of the team | Score companies with an un-APPROVED model |
| Draft the memo and the close-call list | Trigger a retraining request | Invent, estimate, or "fill in" a number not in the files |

## Procedure (every run, in order)

1. **VERIFY before analyzing** — an agent that skips verification is just a
   fast way to distribute errors:
   - Model card `status` must be `APPROVED`; quote the version and test accuracy.
   - Every row's three probabilities must sum to ≈ 1.0 (0.995–1.005 passes —
     3-decimal rounding tolerance).
   - Row count must match the expected population (12), no duplicate company_ids.
   - **Any check fails → STOP.** Report the failure. Do not analyze bad data.
2. **ANALYZE** — recommendation mix, average confidence, and the drivers per
   recommendation, using only values present in the files.
3. **FLAG** — every company with confidence < 0.60 goes on the close-call list
   with a note on what a human should examine before deciding.
4. **DRAFT** — the one-page management memo (audience: CFO). Sections:
   Summary · Recommendations · Close calls requiring review · Model context
   (version, accuracy, gate) · Limitations.
5. **STOP** — end every run with the line
   `DRAFT — awaiting review and approval by <name>` and list the actions NOT
   taken because they require approval. The human sign-off in tab 9's approval
   matrix is the gate; the agent's job is to arrive at that gate with
   everything ready, not to walk through it.

## Evidence

Each run's output is retained with the date, the model version it was based
on, and the verification results — the same retention logic as the model card
itself. "The agent said so" is never evidence; the files it verified are.
