# Agent-Ready Operational Backlog

This backlog is intentionally short and executable with the current workflows.

## How to use

- Use `workflows/feature-delivery.md` for feature and refactor items.
- Use `workflows/bugfix-loop.md` for defects and regressions.
- Keep items small enough to validate in one loop when possible.

## Ready now

### A-001 — Split `src/App.tsx` into clearer page composition

- Workflow: `feature-delivery.md`
- Goal: reduce coordination load in the app shell and prepare cleaner folder structure
- Scope:
  - confirm current responsibilities in `src/App.tsx`
  - extract page-level composition where reasonable
  - keep behavior unchanged
- Acceptance:
  - build and tests pass
  - behavior remains the same
  - docs updated only if architecture meaningfully changes

### A-002 — Add tests for Builder core flow

- Workflow: `feature-delivery.md`
- Goal: cover generation, adding tracks, and builder-to-player handoff risk areas
- Scope:
  - add tests around `Builder`
  - verify the main generation and send-to-player flow
- Acceptance:
  - tests added and passing
  - no UI behavior regression introduced

### A-003 — Add tests for audio hook behavior that can be validated safely

- Workflow: `feature-delivery.md`
- Goal: improve confidence in playback state transitions without overfitting to browser internals
- Scope:
  - focus on queue/position/play-state coordination
  - avoid brittle media API over-mocking
- Acceptance:
  - targeted tests pass
  - test scope and limits are documented if needed

### A-004 — Decide initial persistence strategy with evidence

- Workflow: `feature-delivery.md`
- Goal: resolve T-011 prerequisites in a documented way
- Scope:
  - compare localStorage vs IndexedDB for current web stage
  - record recommendation in `DECISIONS.md`
- Acceptance:
  - recommendation documented
  - no platform assumption beyond current repo reality

## Bugfix-ready

### B-001 — Any failing validation command

- Workflow: `bugfix-loop.md`
- Trigger: `lint`, `typecheck`, `test`, or `build` fails
- Output:
  - root cause
  - smallest fix
  - revalidated repo

### B-002 — Set duration mismatch or queue inconsistency

- Workflow: `bugfix-loop.md`
- Trigger: generated set duration, queue order, or timer totals drift from expected behavior
- Output:
  - root-cause trace
  - fix at source contract/store/service boundary

## Not ready for autonomous execution yet

- full platform migration to Expo / React Native
- native audio migration
- advanced AI recommendation pipeline
- major persistence migration beyond current web evidence
