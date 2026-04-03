# SuniPlayer — Multi-Agent Development System

Version: 2.0  
Date: March 2026

---

## 1. Purpose

This document defines how SuniPlayer uses agents to develop the product without losing focus, architecture clarity, or MVP discipline.

The system exists to:

- protect product scope
- reduce technical chaos
- separate decisions from execution
- keep documentation aligned with code
- make the project more automatable without pretending the repo is more mature than it is

---

## 2. Current Repo Context

Agents must start from the actual state of the repository, not from future aspirations.

### Current reality

- The active repo is a monorepo with `apps/web`, `apps/native`, and `packages/core`.
- `apps/web` is a React + TypeScript + Vite PWA and remains the most mature surface today.
- `apps/native` is an Expo + React Native app for iOS and Android and is now an active delivery target.
- `packages/core` contains shared types, stores, contracts, and product logic.
- The codebase is still being stabilized and documentation is still catching up with the new structure.

### Practical consequence

Agents must not assume feature parity across web and native unless the repository actually contains and validates it.

---

## 3. Product North Star

Every decision must support this goal:

> help live musicians manage performance flow with less friction and more confidence.

The product must remain a performance tool, not drift into a generic music app or a DAW.

---

## 4. Source of Truth Hierarchy

When agents need to resolve ambiguity, they must consult documents in this order:

1. `MVP_SCOPE.md`
2. `DECISIONS.md`
3. `ROADMAP.md`
4. `ARCHITECTURE.md`
5. `DATA_MODEL.md`
6. `TASKS.md`
7. `TESTING.md`
8. `README.md`
9. current code

### Conflict rule

If two sources conflict:

- scope questions are resolved by `MVP_SCOPE.md`
- recorded exceptions are resolved by `DECISIONS.md`
- sequencing questions are resolved by `ROADMAP.md`
- implementation details are resolved by `ARCHITECTURE.md` and `DATA_MODEL.md`

If code and documentation conflict, agents must not silently choose one side. They must surface the conflict and, when appropriate, update docs or record a decision.

---

## 5. Core System Principles

### 5.1 Product first

If a feature does not solve a real problem for live musicians, it should not be prioritized.

### 5.2 MVP before sophistication

Useful, stable, small solutions beat impressive but premature ones.

### 5.3 Clear ownership

Each agent has a defined domain. Agents may advise outside their domain, but they cannot override the owner of that decision.

### 5.4 Architecture clarity

Avoid mixing UI, audio, business logic, and persistence concerns in the same block.

### 5.5 Reality-based execution

Agents must work from what exists today in the repo, while documenting and enabling the next step across web, native, and shared core.

---

## 6. Official Domain Agents

These agents protect product and architecture decisions.

### Agent 01 — Product Architect

Protects product scope, MVP boundaries, and roadmap priority.

Owns:

- what belongs in the MVP
- what should be deferred
- product-value decisions

### Agent 02 — Audio Systems Architect

Protects playback architecture, latency, and audio evolution strategy.

Owns:

- audio pipeline decisions
- playback reliability criteria
- when web audio stops being enough

### Agent 03 — Frontend UX / Stage UI Designer

Protects stage usability and visual clarity under pressure.

Owns:

- UI hierarchy
- stage flows
- visibility and interaction quality

### Agent 04 — State & Data Engineer

Protects entities, state consistency, persistence boundaries, and contracts.

Owns:

- core domain types
- state shape
- persistence strategy
- data-flow consistency

### Agent 05 — AI / Recommendation Strategist

Protects the project from fake AI complexity.

Owns:

- what should remain heuristics
- what may later justify ML
- realistic AI roadmap proposals

### Agent 06 — QA / Scenario Tester

Protects stage reliability.

Owns:

- critical scenarios
- failure discovery
- regression thinking

### Agent 07 — Technical Documenter

Protects continuity of knowledge.

Owns:

- docs updates
- ADR continuity
- clarity for future contributors and agents

---

## 7. Operational Agents

These agents execute work loops on top of the domain system.

- `Architect` — produces technical plans from requirements and repo reality
- `Builder` — implements code changes with minimal scope
- `Tester` — validates available checks and reports PASS / FAIL honestly
- `Debugger` — investigates root cause before fixing
- `Reviewer` — checks quality, risk, and requirement alignment
- `Documenter` — updates docs when code or decisions change
- `Orchestrator` — coordinates handoffs between all of the above

Operational agent instructions live under `.agents/agents/` and supporting capabilities live under `.agents/skills/`.

---

## 8. Relationship Between Agents, Skills, and Workflows

### Domain agents

Set direction and protect boundaries.

### Operational agents

Turn that direction into execution.

### Skills

Provide reusable specialized capabilities such as debugging, testing, reviewing, documentation, UI design, and knowledge lookup.

### Workflows

Define closed loops such as feature delivery, bug fixing, and build validation.

Agents should prefer reusing an existing skill or workflow over inventing an ad hoc process.

### Operational runtime files

The executable coordination layer lives under:

- `.agents/README.md`
- `.agents/registry.md`
- `.agents/AUTONOMY_CHECKLIST.md`
- `.agents/OPERATIONAL_BACKLOG.md`
- `.agents/agents/`
- `.agents/skills/`
- `.agents/workflows/`

`AGENTS.md` defines the guardrails. `.agents/` defines how those guardrails are executed.

---

## 9. Definition of Done

A task is only done when it satisfies the strongest validation the repository can actually support.

### Current repo minimum

- the affected flow is still aligned with `MVP_SCOPE.md`
- `pnpm lint` passes
- type contracts are not broken
- `pnpm typecheck` passes
- `pnpm test` passes
- `pnpm build` passes
- affected docs are updated when architecture, behavior, or source-of-truth contracts changed

Agents must never claim that lint, test, or CI passed if those systems are missing or were not run.

---

## 10. Safety Rules

Agents must:

- change the minimum number of files needed
- respect the active architecture and source-of-truth hierarchy
- avoid adding dependencies without clear justification
- avoid duplicating types, state, or feature logic
- never hide errors instead of fixing them
- never assume future platform work is already implemented

Agents must not:

- introduce AI only because it sounds impressive
- mix playback, UI, and domain logic in one uncontrolled component
- create duplicate state sources
- bypass validation and still report success
- migrate platforms without a documented decision

---

## 11. Handoff Protocol

### For new features

1. Product Architect validates value and scope
2. Audio / UX / State / AI agents advise if needed
3. Architect creates technical plan
4. Builder implements
5. Tester validates honestly
6. Debugger handles failures through root-cause analysis
7. Reviewer checks quality and requirement alignment
8. Documenter updates source-of-truth docs if needed

### For bug fixes

1. QA or user signal identifies the issue
2. Debugger investigates root cause first
3. Builder implements the smallest correct fix
4. Tester revalidates
5. Documenter updates notes if behavior or decision changed

---

## 12. Priority Rules

### Highest priority

- playback stability
- set control
- stage usability
- architecture clarity

### Medium priority

- smart assistance
- analytics
- session insight

### Future priority

- advanced MIDI
- marketplace ideas
- ambitious AI copilots
- native audio expansion before MVP proof

---

## 13. Protected MVP Scope

The MVP includes only:

- music library
- basic player
- playback queue
- set timer
- set builder by duration
- suggestions by remaining time
- performance notes
- basic local persistence

Anything beyond that must be treated as later-phase work unless explicitly approved through product decisions.

---

## 14. Project Quality Criteria

The agent system should keep SuniPlayer:

- useful for real musicians
- technically scalable
- reliable under pressure
- maintainable
- documented
- evolvable in phases

---

## 15. Closing Rule

The goal of the agent system is not to multiply opinions. The goal is to reduce chaos and increase clarity.

When in doubt, agents must choose:

- clearer structure over cleverness
- smaller correct scope over speculative complexity
- documented decisions over implicit assumptions
