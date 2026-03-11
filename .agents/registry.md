# Agent Registry

## Domain to operational bridge

| Domain owner in `AGENTS.md` | Operational role | Primary skills |
|---|---|---|
| Product Architect | Orchestrator / Architect | `knowledge-base`, `architect` |
| Audio Systems Architect | Architect / Reviewer | `latency-principles`, `systematic-debugging` |
| Frontend UX / Stage UI Designer | Builder / Reviewer | `ui-ux`, `design-system`, `expressive-design` |
| State & Data Engineer | Architect / Builder | `architect`, `developer`, `knowledge-base` |
| AI / Recommendation Strategist | Architect / Reviewer | `knowledge-base` |
| QA / Scenario Tester | Tester / Debugger | `effective-testing`, `systematic-debugging`, `tester` |
| Technical Documenter | Documenter | `documenter`, `knowledge-base` |

## Operational agents

| Agent | Mission | Required skills | Escalates to |
|---|---|---|---|
| `orchestrator` | Coordinate work loops and handoffs | `knowledge-base`, `orchestrator` | human when scope/platform/architecture changes |
| `architect` | Produce technical plan from repo reality | `architect`, `knowledge-base` | reviewer or human on major architecture conflict |
| `builder` | Implement smallest correct change | `developer`, `component-factory` as needed | tester/debugger |
| `tester` | Validate available checks honestly | `tester`, `effective-testing` | debugger |
| `debugger` | Find root cause before fixing | `systematic-debugging` | architect or human after repeated failed fixes |
| `reviewer` | Check quality, risk, and alignment | `reviewer` | documenter or human |
| `documenter` | Update docs and decisions | `documenter`, `knowledge-base` | human if docs and code conflict materially |

## Skill classification

### Core skills

| Skill | Primary owner | Why it matters now |
|---|---|---|
| `orchestrator` | orchestrator | routes work and handoffs |
| `knowledge-base` | orchestrator, architect, documenter | prevents reinvention and enforces source-of-truth lookup |
| `architect` | architect | technical planning for the current repo |
| `developer` | builder | implements code in the active stack |
| `tester` | tester | validation for repo-supported checks |
| `effective-testing` | tester | honest risk-based quality evaluation |
| `systematic-debugging` | debugger | required root-cause discipline |
| `reviewer` | reviewer | quality and requirement alignment |
| `documenter` | documenter | keeps docs aligned with reality |

### Optional specialized skills

| Skill | Best used by | When to activate |
|---|---|---|
| `ui-ux` | builder, reviewer | stage usability, interaction clarity, layout changes |
| `design-system` | builder, reviewer | token consistency and visual language enforcement |
| `component-factory` | builder | component extraction, composition, and UI decomposition |
| `latency-principles` | architect, debugger, reviewer | performance or playback-latency work |
| `generative-thinker` | architect | broad platform strategy or open-ended system design |
| `devops` | orchestrator, reviewer | build pipeline, CI, dependency automation, environment work |
| `find-skills` | orchestrator, human-facing advisor | when searching for new installable skills outside the current local set |

### Present but out of current core runtime

| Skill | Status | Reason |
|---|---|---|
| `expressive-design` | out of scope for core runtime | Flutter/Material-specific and not aligned to this React repo |
| `widget-previewer` | optional tooling only | useful for preview workflows, not required for normal feature delivery |
| `skill-creator` | maintainer-only | meta-skill for authoring new skills, not for day-to-day project delivery |

## Current duplication / overlap guidance

- `ui-ux` owns interaction and stage usability decisions.
- `design-system` owns token, typography, spacing, and theme consistency.
- `component-factory` owns decomposition and reusable component structure.
- `expressive-design` should not be activated for normal SuniPlayer work unless the task explicitly asks to adapt external expressive design references.

## Core workflows

| Workflow | Purpose | Main agents |
|---|---|---|
| `build.md` | Build-validation loop for current repo | builder, tester, debugger |
| `feature-delivery.md` | Closed-loop feature implementation | orchestrator, architect, builder, tester, reviewer, documenter |
| `bugfix-loop.md` | Closed-loop debugging and verification | orchestrator, debugger, builder, tester |
| `gen-set.md` | Domain workflow for set generation | builder, tester, documenter |

## Efficiency rules

- Prefer activating a skill only when it changes the quality of the outcome.
- Do not run debugger loops without `systematic-debugging`.
- Do not report testing confidence without `effective-testing` or explicit manual scope.
- Do not propose new architecture without consulting `knowledge-base` and the source-of-truth docs first.
- Avoid stacking overlapping design skills unless the task clearly needs both interaction guidance and token-level consistency.
- Treat out-of-scope or meta-skills as non-default so the runtime stays focused.

## Autonomy controls

- `.agents/AUTONOMY_CHECKLIST.md` controls whether a task may run without human intervention.
- `.agents/OPERATIONAL_BACKLOG.md` is the preferred queue for autonomous execution trials.
