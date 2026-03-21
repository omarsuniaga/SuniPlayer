# Autofix Loop Agent — Design Doc
**Fecha:** 2026-03-20

## Problema
Cuando aparece un bug (crash, error de build, fallo lógico), el flujo actual requiere que el usuario identifique el error, lo describa, espere una propuesta de fix, apruebe, y repita. Esto es lento y rompe el flow de desarrollo.

## Solución
Un sub-agente autónomo que detecta errores, itera con fixes hasta resolverlos, y solo escala al humano en casos extremos — sin pedir permisos en cada paso.

## Arquitectura (Opción B aprobada)
```
~/.claude/
  agents/
    autofix-loop.md       ← Agente autónomo con loop DIAGNOSE→PLAN→FIX→VERIFY
  skills/
    autofix-loop/
      SKILL.md            ← Skill companion: cuándo y cómo invocar el agente
```

## Comportamiento del loop
Cada iteración: DIAGNOSE → PLAN → FIX → VERIFY (build + tests + runtime) → EVALUATE
- ¿Resuelto? → Reporte final
- ¿Nuevo error? → Nueva iteración con contexto acumulado
- ¿Mismo error 3 veces? → Escalar al humano

## Escalación (solo 3 casos)
1. Requiere credenciales/API keys
2. Requiere rediseño arquitectural
3. Loop infinito (mismo error exacto 3 veces)

## Herramientas pre-aprobadas
Bash, Read, Write, Edit, Glob, Grep, TodoWrite

## Guardrails de seguridad
Nunca sin confirmación: rm -rf, git push --force, DROP TABLE, modificar .env, instalar deps con CVEs
