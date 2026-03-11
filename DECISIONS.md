# Architecture & Product Decisions (ADR)

Este log registra las decisiones críticas tomadas por los agentes para evitar regresiones.

---

## [2026-03-10] ADR 001: Implementación de Generatividad y Diseño Expresivo
**Agente:** Product Architect / UX Designer
**Contexto:** El usuario solicitó una línea visual coherente y técnica.
**Decisión:** 
- Se instalaron las skills `expressive-design` y `generativity`.
- Se refactorizó la app en una estructura modular de "Shell" (`SuniShell`).
- Se definió un objeto de diseño centralizado (`THEME`).

## [2026-03-10] ADR 002: Sincronización de Tiempos a Milisegundos
**Agente:** State & Data Engineer
**Contexto:** Había discrepancias entre la duración en segundos y milisegundos entre el Builder y el Player.
**Decisión:** 
- Se estandarizó el uso de `duration_ms` en las interfaces.
- Los cálculos algorítmicos se realizan en milisegundos para evitar errores de redondeo en sets largos.

## [2026-03-10] ADR 003: Jerarquía documental y validación base del repositorio
**Agente:** Product Architect / Technical Documenter
**Contexto:** La documentación mezclaba estado actual del repo con visión futura de plataforma, y el proyecto todavía no tenía quality gates mínimos explícitos.
**Decisión:**
- `MVP_SCOPE.md` se establece como fuente principal de verdad para alcance.
- `DECISIONS.md` se usa para registrar excepciones y transiciones aprobadas.
- Se alinearon `README.md`, `ROADMAP.md`, `TASKS.md` y `TESTING.md` con el estado real del repo web.
- Se añadieron scripts base de `lint`, `typecheck`, `test` y `validate` para soportar una autonomía operativa más honesta.

## [2026-03-10] ADR 004: Persistencia inicial para la etapa web
**Agente:** State & Data Engineer / Product Architect
**Contexto:** El MVP necesita persistencia local minima, pero el repo actual sigue siendo una app web y aun no existe una decision formal de migracion de plataforma.
**Decisión:**
- La persistencia inicial del MVP web debe apoyarse en `localStorage` para configuracion, historial y estado ligero.
- `IndexedDB` queda como siguiente opcion si la biblioteca musical, metadata o volumen de sets supera lo razonable para almacenamiento simple.
- `SQLite` permanece fuera de la etapa web actual y solo debe reconsiderarse despues de una decision formal de plataforma.
- La implementacion de `T-011` debe comenzar por contratos y limites de persistencia en web antes de cualquier migracion de tecnologia.

---
*Fin del registro inicial.*
