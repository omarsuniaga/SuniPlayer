# Roadmap — SuniPlayer

**Version:** 0.3 (Alpha tecnica)  
**Agente Responsable:** Agent 01 — Product Architect

---

## Principio del roadmap

El roadmap describe una evolucion realista desde el monorepo actual hacia un MVP confiable para shows en web y mobile. Ya existe una base nativa en Expo, pero todavia no debe asumirse feature parity ni readiness completa en iOS/Android.

---

## Fase 0 — Consolidacion del monorepo actual (Actual)

**Enfoque:** alinear codigo, datos, arquitectura y documentacion del nuevo workspace `apps/ + packages/`.

- [x] Configuracion inicial del proyecto web con `Vite + React + TypeScript`
- [x] Configuracion inicial del proyecto nativo con `Expo + React Native`
- [x] Creacion de `packages/core` como base compartida
- [x] Sistema base de agentes definido en `AGENTS.md`
- [x] Store global con Zustand
- [x] Prototipo funcional de Builder, Player e Historial
- [x] Algoritmo base de generacion de sets
- [x] Unificar contratos de datos (`duration_ms`, tipos y naming)
- [x] Identificar y aislar codigo legacy vs codigo actual
- [ ] Terminar de converger la arquitectura del monorepo y reducir duplicacion residual
- [ ] Alinear toda la documentacion principal con la realidad `web + native + core`

## Fase 1 — Base validable del MVP

**Enfoque:** convertir web y core en una base tecnica confiable, y endurecer el baseline nativo.

- [x] Agregar `lint`
- [x] Agregar `typecheck` como script dedicado
- [x] Agregar test runner y primeros tests automatizados
- [x] Agregar comando `validate`
- [x] Estabilizar el build web
- [x] Definir estrategia minima de persistencia local
- [ ] Alinear scripts de validacion del workspace completo
- [ ] Implementar audio real inicial en web y cerrar el gap hacia nativo

## Fase 2 — MVP funcional de escenario

**Enfoque:** hacer usable el producto en una sesion real de performance, con foco especial en iPad/iPhone y Android.

- [ ] Implementacion de modo LIVE endurecido en web y native
- [ ] Timer de set con alertas claras
- [ ] Cola mas robusta y segura para uso en vivo
- [ ] Mejoras de legibilidad y reduccion de friccion UI en tablet y telefono
- [ ] Guardado y recuperacion local de sets con recovery confiable
- [ ] Primera prueba controlada de flujo completo tipo show

## Fase 3 — Consolidacion multiplataforma

**Enfoque:** decidir con evidencia cual superficie lidera el uso real en escenario y como se reparte el trabajo entre PWA y native.

- [ ] Evaluar limitaciones reales del audio web en shows
- [ ] Evaluar confiabilidad real de iPad/iPhone y Android con Expo
- [ ] Definir feature parity minima entre `apps/web` y `apps/native`
- [ ] Registrar en `DECISIONS.md` si la superficie principal de escenario pasa a ser native

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
- [ ] Evolucion del audio nativo segun necesidades reales de escenario
- [ ] Analisis inteligente y recomendaciones futuras

---

## Criterios de avance entre fases

- no avanzar por entusiasmo tecnico
- no abrir una migracion de plataforma antes de estabilizar la base actual
- documentar toda decision importante en `DECISIONS.md`
- mantener alineacion con `MVP_SCOPE.md`

## Notas importantes

- El repositorio ya es multiplataforma.
- La implementacion web sigue siendo la mas madura hoy.
- La implementacion native ya existe y debe tratarse como parte real de la arquitectura.
- Las prioridades inmediatas son coherencia de monorepo, parity y confiabilidad de escenario.
