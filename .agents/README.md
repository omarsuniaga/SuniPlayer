# SuniPlayer Agent Runtime

This directory contains the operational layer that turns `AGENTS.md` into an executable working system.

## Structure

- `agents/` defines operational roles and handoffs.
- `skills/` provides reusable capabilities that agents activate when needed.
- `workflows/` defines closed execution loops.
- `registry.md` maps agents, skills, and workflows together.

## Core workflow entrypoints

- `workflows/feature-delivery.md` for new features and substantial enhancements
- `workflows/bugfix-loop.md` for failures, regressions, and root-cause work
- `workflows/build.md` for build-validation loops
- `workflows/gen-set.md` for the set-generation domain flow

## Execution control files

- `AUTONOMY_CHECKLIST.md` defines what the system may do alone and what must escalate.
- `OPERATIONAL_BACKLOG.md` contains short, workflow-ready tasks for autonomous execution.

## Skill usage policy

- Core delivery work should default to the skills listed as core in `registry.md`.
- Specialized skills should be activated only when the task genuinely needs them.
- Out-of-scope or maintainer-only skills should not be pulled into normal feature work.
- If two skills overlap, prefer the one with the narrower and more directly relevant ownership.

## How the system is intended to work

1. `AGENTS.md` defines product and architecture guardrails.
2. An operational agent starts from the current repo reality.
3. That agent activates the minimum useful skills for the task.
4. Workflows define the order of execution and validation.
5. Documentation and decisions are updated when the source of truth changes.

## Current source of truth for agents

1. `MVP_SCOPE.md`
2. `DECISIONS.md`
3. `ROADMAP.md`
4. `ARCHITECTURE.md`
5. `DATA_MODEL.md`
6. `TASKS.md`
7. `TESTING.md`
8. `README.md`
9. current code

## Important constraint

The active repo is still a web app built with `React + TypeScript + Vite + Zustand`.
Skills and workflows must not assume Expo, SQLite, CI-only checks, or native audio unless those capabilities are actually present.
