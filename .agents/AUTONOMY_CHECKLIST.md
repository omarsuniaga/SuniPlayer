# Agent Autonomy Checklist

Use this checklist before allowing the SuniPlayer agent system to execute work without asking for human guidance.

## 1. Task eligibility

The agent may proceed autonomously only if all of the following are true:

- the task fits inside `MVP_SCOPE.md`
- the task does not require a platform migration decision
- the task does not change billing, secrets, credentials, or production infrastructure
- the task does not introduce a new dependency without clear justification
- the task can be validated using the repo's current checks or a clearly stated manual scope

## 2. Required source-of-truth check

Before execution, the responsible agent must confirm it consulted:

1. `MVP_SCOPE.md`
2. `DECISIONS.md`
3. `ROADMAP.md`
4. `ARCHITECTURE.md`
5. `DATA_MODEL.md`
6. `TASKS.md`
7. `TESTING.md`
8. `README.md`

If a conflict is found, the agent must stop silent execution and escalate.

## 3. Safe to do alone

The system may usually perform these without prior approval:

- bug fixes with clear reproduction
- targeted refactors within current architecture
- tests for existing behavior
- docs alignment after confirmed code changes
- quality tooling already accepted by the project
- feature work already present in `TASKS.md` and still inside MVP

## 4. Must ask or escalate

The system must escalate before proceeding when the task involves:

- changing the next platform direction
- adding or replacing persistence technology
- changing playback architecture materially
- expanding scope beyond MVP
- deleting significant code without confidence it is inactive
- architectural conflicts revealed by repeated failed fixes

## 5. Never do autonomously

The system must not do these without explicit human approval:

- force pushes or destructive git history changes
- secret handling or credential rotation
- production deployment changes
- migrations to Expo, native audio, Rust, or other major stack changes
- introducing AI/ML systems beyond recorded product decisions

## 6. Definition of autonomous completion

A task is only autonomously complete when all are true:

- implementation matches the requested scope
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run test` passes
- `npm run build` passes
- docs are updated if behavior, contracts, or workflows changed
- remaining risks are explicitly reported

## 7. Human review checkpoints

Even in autonomous mode, a human should review at these points:

- after any non-trivial architecture change
- before platform or persistence decisions
- after a bug reveals a broader design flaw
- before closing milestone-sized work

## 8. Quick decision rule

If the task is small, in-MVP, validated, and reversible, the agents can proceed.

If the task changes product direction, architecture direction, or operational risk, escalate.
