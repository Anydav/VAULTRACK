# VAULTRACK

Portfolio tracker (crypto + NGX, 10 currencies, AI analysis). Repo: github.com/Anydav/VAULTRACK

## Versions

- The existing docs describe **v1** (the built MVP).
- We are now building **v2**. Don't assume the v1 docs describe how v2 should work.
- v2 scope (committed features, optional features, out of scope, open decisions) lives in `docs/V2_PLAN.md`. Keep v2 docs in this repo's `docs/` folder, not in Claude Docs/artifacts.
- v2 committed features: native mobile app (not a PWA), CSV import, automatic exchange sync, cash and savings.
- **No new AI features in v2** — AI work is fixes only.

## Working rules

- **Don't change application code without David understanding it first.** Before writing code, explain what will change, why, and how it works in plain terms, and wait for his go-ahead. Explain designs (e.g. schemas) with concrete examples, not just tables.
- Open decisions (listed in `docs/V2_PLAN.md`) are discussed only when we reach the task that needs them. Raise the relevant one at that point; don't push to settle them early.

## Notion
- All VAULTRACK tasks live in the main **Tasks** database: collection://c25c8a3d-a187-41b1-8aea-f0bb54ead068 (David Life → Tasks).
- Every VAULTRACK row must have Project = VAULTRACK (relation to https://app.notion.com/p/3eb56a99e0188155bd36d34e9e0ee2f3).
- The old "VAULTRACK v2 Tasks" database is retired. Never read or write it.
- Only touch rows where Project = VAULTRACK. Don't edit other projects' tasks, Daily Schedule, Projects or memory.
- Notion is for tracking tasks only. Plans and docs go in docs/. Notes are one line.

Fields:
- Task: title
- Status: Backlog · To do · In progress · Blocked · Done (Blocked = waiting on someone else; say who/what in Notes)
- Priority: High · Medium · Low
- Tags (multi-select): type + area, e.g. ["Bug","Backend"]. Types: Bug · Feature · Chore. Areas: Frontend · Backend · AI
- Type: always "Task" (or "Milestone" for a release/deadline)
- Due date: only set or change it when David asks. It drives his daily list; if a task looks overdue, mention it and leave the date alone.
- Notes: one line, optional
- Don't touch: When (formula), Last done, Carried over

When to update:
- "Later" = a new task (Status To do or Backlog).
- When work starts, set In progress. When it's finished/merged/tested, set Done right away and put the PR number in Notes.
- If a decision changes a task, update its Notes (Due date only if David asks).
