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

---
*Fin del registro inicial.*
