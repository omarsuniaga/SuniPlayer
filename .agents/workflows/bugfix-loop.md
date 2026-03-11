---
description: Closed-loop workflow for bug reproduction, root-cause analysis, and verification in the current SuniPlayer repo.
---

# Bugfix Loop

## Purpose

Use this workflow for broken behavior, failing tests, build regressions, integration issues, and stage-critical reliability problems.

## Required participants

- `orchestrator`
- `debugger`
- `builder`
- `tester`

## Recommended participants

- `reviewer`
- `documenter`

## Required skills by stage

- triage: `knowledge-base`
- debugging: `systematic-debugging`
- implementation: `developer`
- validation: `tester`, `effective-testing`

## Sequence

1. `orchestrator` captures the bug, failing check, or reproduction steps.
2. `debugger` reproduces the issue and gathers evidence before proposing any fix.
3. `debugger` traces the root cause and defines the smallest credible fix.
4. `builder` applies only that fix.
5. `tester` runs the relevant checks, and by default uses the full repo validation suite.
6. If validation still fails, return to `debugger` and repeat from root-cause analysis.
7. If multiple failed fix attempts suggest architectural weakness, escalate to `architect` or the human.
8. `reviewer` confirms the bug is truly resolved and no adjacent regressions were introduced.
9. `documenter` updates docs or `DECISIONS.md` if the bug exposed a new rule, contract, or operational constraint.

## Default validation set

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Output

- root cause identified
- fix applied
- validation result
- follow-up notes if the issue points to deeper architectural work
