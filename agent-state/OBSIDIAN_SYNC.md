# OBSIDIAN_SYNC

_Last updated: 2026-06-06_

## Vault
- **Found:** yes - this repo sits inside the Obsidian vault.
- **Vault path:** `C:\Users\dough\OneDrive\_Jessica\Builder_OS`
- **Target note folder (this repo):** `01 Projects\Fast Insights\00 Command Center\Agent State\AR Tool-Beta\`
  - A dedicated, agent-owned **per-repo subfolder** (because several repos share the Fast Insights product folder), so automated updates never overwrite hand-curated PARA notes or collide with sibling repos' state.
  - Deployment-specific detail may also be cross-linked into `01 Projects\Fast Insights\11 Deployment and Environment\` if useful.
- **Created lazily:** the folder and notes do NOT exist yet. They are created on the **first `/cleanup-handoff`** - do not create them now.

## Notes maintained here
`Current State.md` | `Active Request.md` | `Deployment Status.md` | `Verification Status.md` | `Session Handoff.md` | `Development Log.md` | `Architecture Decisions.md` | `Requirements.md`

## Update Obsidian when a change affects
requirements | architecture | deployment | product decisions | user-facing behavior | setup instructions | handoff state | known issues.

## Do NOT update Obsidian for
trivial mechanical edits (typos, variable renames, formatting) unless they matter later.

## No outbox needed
The real vault is directly accessible (this repo is inside it), so notes are written straight into the target folder. An `obsidian-outbox/` fallback mirror was **not** created. If you ever run these skills where the vault is unreachable, create `obsidian-outbox/` in the repo and note here that the files must be moved into the vault manually.

## Last Obsidian update summary
2026-06-06 - Sync target chosen and recorded. No notes written yet (lazy creation on first `/cleanup-handoff`).
