# Suniplayer — Agent Skills Index

> Archivo de configuración multi-agente. Lo leen TODOS los agentes al iniciar
> sesión en este proyecto: Claude, Gemini, Codex, Antigravity, OpenCode, etc.
> Define habilidades disponibles, reglas de workflow obligatorias, y referencia
> la documentación del proyecto.

## How to Use

1. Revisá la tabla de skills y la sección de reglas obligatorias abajo
2. Cargá el skill relevante leyendo su `SKILL.md` ANTES de escribir código
3. Pueden aplicarse múltiples skills simultáneamente

---

## Mandatory Workflow Rules

Estas reglas aplican a TODOS los agentes, sin excepción.

### Documentation Sync Rule (OBLIGATORIO)

> **Antes de cada commit que modifique archivos en `src/`, el agente DEBE**
> **verificar si hay observaciones nuevas en Engram desde el último sync**
> **y ejecutar el skill `engram-docs-sync` si es necesario.**

Motivo: Engram acumula decisiones de implementación, bugs, refactors y
descubrimientos que NO están reflejados en `docs/`. Si no se sincronizan,
la documentación se vuelve una foto vieja y los agentes futuros trabajan
con información desactualizada.

Procedimiento:
1. `mem_search(topic_key: "engram-docs-sync/suniplayer_v2")` para obtener el timestamp del último sync
2. `mem_search(project: "suniplayer_v2")` filtrado por `updatedAt > last_sync`
3. Si hay observaciones no sincronizadas → ejecutar `engram-docs-sync`
4. Si no hay → proceder con el commit normalmente

### Engram Save Rule (OBLIGATORIO)

> **Todo cambio significativo (decisión, bugfix, refactor, discovery, pattern,**
> **config) DEBE guardarse en Engram vía `mem_save` antes del commit.**

Engram es el bus de comunicación entre agentes. Si no está en Engram,
los otros agentes no lo saben.

### Autonomy Rule (OBLIGATORIO — todos los agentes, también en sesiones interactivas)

> **En este repo NUNCA presentes menús de opciones ni pidas confirmaciones al**
> **usuario. Elegí la opción más recomendable (la que sugerirías como default),**
> **ejecutala, y registrá la decisión en Engram (`mem_save`).**

- Solo está permitido frenar ante acciones DESTRUCTIVAS (borrar archivos
  fuera de la tarea, push forzado, tocar `docs/` o `src/domain/`): en ese
  caso NO preguntes — abortá esa acción, reportala en Engram y seguí con el
  resto de la tarea.
- Si el usuario escribe "Es tu turno" (o similar): buscá tu primera tarea
  `- [ ] @tu-nombre` con `needs:` cumplido en la "Cola de despacho autónomo"
  de STATUS.md, reclamala (`[ ]`→`[~]`), leé su contrato en Engram
  (topic de la línea), ejecutala, reportá a Engram y marcá `[x]`.
- Las preguntas de producto NO se le hacen al usuario en vivo: se registran
  en Engram y en INBOX.md como "PREGUNTA PARA OMAR" y se continúa.

---

## Skills

| Skill | Trigger | Path |
|-------|---------|------|
| `engram-docs-sync` | Sync Engram memory to project documentation. Trigger: sync engram, sync docs, documentar cambios, memory to docs, documentation sync, actualizar documentación. | `.agents/skills/engram-docs-sync/SKILL.md` |
| `sdd-init` | Initialize SDD workflow context for this project. | `.config/opencode/skills/sdd-init/SKILL.md` |
| `sdd-propose` | Create SDD change proposal with scope and approach. | `.config/opencode/skills/sdd-propose/SKILL.md` |
| `sdd-spec` | Write SDD delta specs from proposals. | `.config/opencode/skills/sdd-spec/SKILL.md` |
| `sdd-design` | Create SDD technical design from specs. | `.config/opencode/skills/sdd-design/SKILL.md` |
| `sdd-tasks` | Break SDD design into implementation tasks. | `.config/opencode/skills/sdd-tasks/SKILL.md` |
| `sdd-apply` | Implement SDD tasks from specs and design. | `.config/opencode/skills/sdd-apply/SKILL.md` |
| `sdd-verify` | Validate implementation against SDD specs. | `.config/opencode/skills/sdd-verify/SKILL.md` |
| `sdd-archive` | Archive completed SDD change. | `.config/opencode/skills/sdd-archive/SKILL.md` |
| `work-unit-commits` | Plan commits as reviewable work units. | `.config/opencode/skills/work-unit-commits/SKILL.md` |
| `branch-pr` | Create pull requests with issue-first checks. | `.config/opencode/skills/branch-pr/SKILL.md` |
| `chained-pr` | Split oversized changes into reviewable PRs. | `.config/opencode/skills/chained-pr/SKILL.md` |
| `judgment-day` | Run adversarial review after implementation. | `.config/opencode/skills/judgment-day/SKILL.md` |
| `autofix-loop` | Autonomous bug/crash/failure repair. | `.claude/skills/autofix-loop/SKILL.md` |
| `suniplayer-native-debugger` | Debug Expo/React Native app issues. | `.claude/skills/suniplayer-native-debugger/SKILL.md` |

---

## Project Context

- **Stack**: React 18 + TypeScript + Vite + Zustand 4 + Vitest + RTL + Dexie + signalsmith-stretch (WASM) + Capacitor 6
- **Architecture**: Hexagonal — `domain/` (pure TS), `application/` (zustand stores), `infrastructure/` (Dexie, WebAudio, FileSystem), `ui/` (React atomic design)
- **Branch activa**: `retrofit-arquitectura-documental`
- **Tests**: `cd app && npx vitest run` — 138 tests, 14 files
- **Documentación**: `docs/` — fuente de verdad del diseño
- **Memoria persistente**: Engram — bus de comunicación entre agentes
- **Handoff agentes**: `STATUS.md` + `CLAUDE.md` en raíz del proyecto

## Referencias

- `.atl/skill-registry.md` — registro completo de skills con reglas compactas
- `CLAUDE.md` — alineación de agentes, stack no negociable, división del trabajo
- `STATUS.md` — estado vivo del proyecto
