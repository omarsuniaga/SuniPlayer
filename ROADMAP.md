# Roadmap — SuniPlayer

**Version:** 0.3 (Alpha tecnica)  
**Agente Responsable:** Agent 01 — Product Architect

---

## Principio del roadmap

El roadmap describe una evolucion realista desde el estado actual del repositorio hasta un MVP confiable para shows. No asume todavia una migracion completada a mobile ni una plataforma nativa.

---

## Fase 0 — Consolidacion del prototipo actual (Actual)

**Enfoque:** alinear codigo, datos, arquitectura y documentacion del prototipo web.

- [x] Configuracion inicial del proyecto con `Vite + React + TypeScript`
- [x] Sistema base de agentes definido en `AGENTS.md`
- [x] Store global con Zustand
- [x] Prototipo funcional de Builder, Player e Historial
- [x] Algoritmo base de generacion de sets
- [ ] Unificar contratos de datos (`duration_ms`, tipos y naming)
- [x] Identificar y aislar codigo legacy vs codigo actual
- [ ] Reorganizar la arquitectura para hacerla mas limpia y escalable
- [x] Alinear documentacion con el estado real del repo

## Fase 1 — Base validable del MVP

**Enfoque:** convertir el prototipo en una base tecnica confiable.

- [x] Agregar `lint`
- [x] Agregar `typecheck` como script dedicado
- [x] Agregar test runner y primeros tests automatizados
- [x] Agregar comando `validate`
- [ ] Estabilizar el build
- [ ] Definir estrategia minima de persistencia local
- [ ] Implementar audio real inicial en web

## Fase 2 — MVP funcional de escenario

**Enfoque:** hacer usable la app en una sesion real de performance.

- [ ] Implementacion de modo LIVE
- [ ] Timer de set con alertas claras
- [ ] Cola mas robusta y segura para uso en vivo
- [ ] Mejoras de legibilidad y reduccion de friccion UI
- [ ] Guardado y recuperacion local de sets
- [ ] Primera prueba controlada de flujo completo tipo show

## Fase 3 — Decision de plataforma

**Enfoque:** decidir con evidencia si el producto sigue evolucionando sobre web o si conviene migrar a Expo / React Native.

- [ ] Evaluar limitaciones reales del audio web
- [ ] Evaluar limitaciones de persistencia y uso movil
- [ ] Comparar costo de seguir web vs migrar a Expo
- [ ] Registrar decision formal en `DECISIONS.md`

## Fase 4 — Expansion del MVP

**Enfoque:** sumar valor al musico sin romper la simplicidad del producto.

- [ ] Sugerencias por tiempo restante
- [ ] Historial de sesiones
- [ ] Notas de performance
- [ ] Visualizacion de energia del set
- [ ] Mejoras de estabilidad y recuperacion de sesion

## Fase 5 — Audio y capacidades avanzadas

**Enfoque:** ampliar la calidad tecnica solo cuando el MVP ya este validado.

- [ ] Crossfade basico
- [ ] Waveform real derivada de audio
- [ ] Persistencia mas robusta
- [ ] Evaluacion de audio nativo si el caso lo exige
- [ ] Analisis inteligente y recomendaciones futuras

---

## Criterios de avance entre fases

- no avanzar por entusiasmo tecnico
- no abrir una migracion de plataforma antes de estabilizar la base actual
- documentar toda decision importante en `DECISIONS.md`
- mantener alineacion con `MVP_SCOPE.md`

## Notas importantes

- El repositorio actual sigue siendo web.
- Expo / React Native es una opcion futura, no el estado actual del proyecto.
- Las prioridades inmediatas son coherencia, validacion y arquitectura limpia.
