---
description: Closed-loop workflow for implementing a feature in the current SuniPlayer repo.
---

# Feature Delivery Workflow

## Purpose

Use this workflow for new features, feature expansions, and non-trivial refactors that affect behavior.

## Required participants

- `orchestrator`
- `architect`
- `builder`
- `tester`
- `reviewer`
- `documenter`

## Conditional participant

- `debugger` when validation fails

## Required skills by stage

- planning: `knowledge-base`, `architect`
- implementation: `developer` and optional UI skills
- validation: `tester`, `effective-testing`
- failures: `systematic-debugging`
- closure: `reviewer`, `documenter`

## Sequence

1. `orchestrator` reads the source-of-truth hierarchy from `AGENTS.md`.
2. `architect` confirms the request belongs to the current MVP or marks it as future work.
3. `architect` produces a technical plan based on the active web repo, current contracts, and available validation scripts.
4. `builder` implements the smallest correct change.
5. `tester` runs `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
6. If any check fails, `debugger` performs root-cause analysis before any follow-up fix.
7. `tester` re-runs the relevant validations after the fix.
8. `reviewer` checks alignment with requirements, MVP scope, and documentation.
9. `documenter` updates `DECISIONS.md`, `README.md`, `TASKS.md`, `TESTING.md`, or other source-of-truth docs when behavior, architecture, or validation expectations changed.
10. `orchestrator` closes the workflow only if the Definition of Done in `AGENTS.md` is satisfied.

## Stop conditions

- feature conflicts with `MVP_SCOPE.md`
- platform migration is required but not approved in `DECISIONS.md`
- debugger reaches repeated failed fixes and signals architectural issues

## Output

- implemented feature
- validation status
- updated docs when required
- explicit risk notes if something remains partial
