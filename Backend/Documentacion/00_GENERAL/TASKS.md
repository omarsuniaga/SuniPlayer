# TASKS.md — SuniPlayer Development Backlog

> Última actualización: Abril 2026
> Metodología: tareas ordenadas por fase, prioridad y dependencia.
> Estado: TODO | IN_PROGRESS | DONE | BLOCKED

---

## FASE 0 — Consolidación técnica del prototipo

### [DONE] T-001: Prototipo UI del reproductor
- Pantalla principal con controles play/pause/next/prev
- Waveform visual interactiva
- Modo LIVE / EDIT en prototipo
- Aceptación: se puede simular un set completo en el prototipo web

### [DONE] T-002: Smart Set Builder
- Algoritmo de generación de sets por duración objetivo
- Selección de venue, curva de energía
- Panel de repertorio con filtros
- Aceptación: genera sets de 45 min con tolerancia razonable

### [DONE] T-003: Conexión Builder-Player
- Botón "Enviar al Player" transfiere set generado
- Timer configurado automáticamente
- Cola del player refleja el set
- Aceptación: flujo completo builder > player funciona sin errores

### [DONE] T-004: Infraestructura documental y operativa
- README.md coherente con el estado real del repo
- TASKS.md y TESTING.md alineados con el MVP actual
- AGENTS.md conectado a la documentación oficial
- Definición de fuente de verdad documental
- Aceptación: un humano o agente puede entender con claridad qué existe hoy y qué es futuro

### [DONE] T-005: Unificar contratos de datos
- Normalizar `Track` y entidades relacionadas
- Estandarizar `duration_ms` como unidad oficial
- Alinear `types`, `constants`, `services`, `store` y componentes
- Prioridad: ALTA
- Estimación: 2 días
- Aceptación: no existen modelos duplicados de duración o naming en conflicto

### [DONE] T-006: Separar código actual de código legacy
- Identificar entrypoint oficial actual
- Aislar archivos `jsx/js` que ya no son fuente activa
- Preparar carpeta o estrategia de retiro gradual de legacy
- Prioridad: ALTA
- Estimación: 2 días
- Aceptación: queda claro qué archivos son oficiales y cuáles son legacy

### [TODO] T-007: Limpiar arquitectura de carpetas
- Definir estructura destino más escalable
- Partir el mega `App.tsx`
- Reubicar responsabilidades por dominio
- Prioridad: ALTA
- Estimación: 4 días
- Aceptación: la app queda entendible y lista para crecer sin aumentar el caos

### [DONE] T-008: Scripts de validación base
- Agregar `lint`
- Agregar `typecheck` dedicado
- Agregar test runner inicial
- Agregar `validate`
- Prioridad: ALTA
- Estimación: 2 días
- Aceptación: existe una validación mínima automatizada del proyecto

### [DONE] T-009: Consolidar estrategia web + native sobre el estado actual
- Reconocer que `apps/native` ya existe y es una superficie activa
- Mantener shared core como base de contratos y lógica
- Evitar seguir presentando native como una migración futura bloqueada
- Prioridad: ALTA
- Estimación: 1 día
- Aceptación: el backlog deja de describir native como algo inexistente o bloqueado por definición

---

## FASE 1 — Base funcional del MVP

### [TODO] T-010: Implementar AudioService real inicial
- Reproducción real de archivos o simulación robusta según plataforma elegida
- Play, pause, seek, volume
- Callback de posición para actualizar UI
- Prioridad: ALTA
- Estimación: 3 días
- Aceptación: el player deja de ser solo prototipo visual

### [DONE] T-011: Implementar persistencia local mínima
- Estrategia inicial decidida para etapa web: persistencia ligera por plataforma
- Guardar sets generados
- Recuperar historial y configuración básica
- Recuperar contexto ligero del player al reiniciar
- Prioridad: ALTA
- Estimación: 3 días
- Aceptación: los datos clave sobreviven al reinicio de la app

### [DONE] T-016: Perfil tonal por canción
- Guardar tono base, tono objetivo y semitonos de transposición en el perfil del track
- Mostrar el tono objetivo en vistas relevantes
- Aplicar transposición en reproducción web mediante `playbackRate`
- Prioridad: MEDIA
- Estimación: 2 días
- Aceptación: puedo configurar una canción para tocarla en otro tono y el ajuste queda guardado

### [DONE] T-017: Recovery de sesión para shows en PWA
- Guardar snapshots de show en `IndexedDB`
- Restaurar cola, contexto y configuración tras recarga inesperada
- Advertir cuando el audio local requiera reconexión en iPad
- Prioridad: ALTA
- Estimación: 2 días
- Aceptación: una recarga inesperada no borra silenciosamente la lista ni el contexto de show

### [TODO] T-012: Biblioteca musical con datos reales
- Reemplazar dependencia excesiva de mocks
- Cargar metadata mínima real o semirreal
- Mejorar búsqueda y filtrado
- Prioridad: ALTA
- Estimación: 4 días
- Aceptación: puedo trabajar con repertorio realista y no solo demo data

### [TODO] T-013: Set Builder con datos reales
- Conectar algoritmo con la fuente de datos oficial
- Guardar sets generados en persistencia local
- Recuperar sets guardados
- Prioridad: ALTA
- Estimación: 2 días
- Aceptación: genero y reutilizo sets reales desde la app

### [TODO] T-014: Timer de set con alertas
- Cronómetro real con alertas visibles
- Señales claras a 5 min y 2 min
- Prioridad: MEDIA
- Estimación: 2 días
- Aceptación: el timer ayuda realmente a terminar el set a tiempo

### [TODO] T-015: Endurecer UX de escenario
- Mejorar legibilidad
- Reducir clics accidentales
- Reforzar modo LIVE
- Prioridad: ALTA
- Estimación: 3 días
- Aceptación: la UI resiste mejor uso bajo presión

### [IN_PROGRESS] T-050: Metrónomo Visual y Tap Tempo (SDD)
- [x] Fase 2: Diseño de Arquitectura (Architect)
- [x] Fase 3: Componente Visual Atmosphere Pulse (Designer)
- [x] Fase 4: Lógica de Tap Tempo y sincronización AudioContext (Developer)
- [x] Fase 5: Validación de criterios de aceptación (Tester)
- [x] Fase 6: Documentación técnica final (Documenter)
- Prioridad: ALTA
- Estimación: 2 días
- Aceptación: Parpadeo sincrónico con BPM y corrección por Tap manual funcional

### [IN_PROGRESS] T-060: Rediseño Integral Library (Command Center UI)
- [ ] Fase 2: Diseño de Arquitectura (Architect) - Multi-selection & Filtering logic
- [ ] Fase 3: Interfaz Visual Premium (Designer) - Glassmorphism Header & Swipe Rows
- [ ] Fase 4: Lógica de Gestión Masiva e Importación (Developer)
- [ ] Fase 5: Validación de Performance y UX (Tester)
- [ ] Fase 6: Documentación técnica final (Documenter)
- Prioridad: CRÍTICA
- Estimación: 3 días
- Aceptación: Búsqueda <100ms, importación masiva editable y estética Premium.

---

## FASE 2 — Validación en uso real

### [TODO] T-020: Primera prueba controlada de sesión real
- Ejecutar flujo completo en una sesión tipo show
- Documentar bugs y fricciones
- Prioridad: CRÍTICA
- Estimación: 1 día
- Aceptación: sobrevive un set de 45 min sin fallo crítico

### [TODO] T-021: Recuperación de sesión y continuidad
- Restaurar estado relevante tras cierre o reinicio
- Prioridad: ALTA
- Estimación: 2 días
- Aceptación: el músico no pierde el contexto de trabajo fácilmente

### [TODO] T-022: Sugerencias por tiempo restante
- Mostrar tracks o combinaciones según tiempo faltante
- Prioridad: MEDIA
- Estimación: 2 días
- Aceptación: la sugerencia ayuda a cerrar el set con menos improvisación

### [TODO] T-023: Historial de sesiones
- Registrar shows o sesiones realizadas
- Ver historial con datos útiles
- Prioridad: MEDIA
- Estimación: 2 días
- Aceptación: puedo revisar sets ejecutados y patrones básicos

---

## FASE 3 — Consolidación y paridad de plataforma

### [TODO] T-030: Endurecer flujo móvil existente
- Consolidar navegación y UX base en Expo native
- Alinear el flujo móvil con el shared core
- Prioridad: ALTA
- Estimación: 5 días
- Aceptación: la app native mantiene paridad funcional básica con la web en el flujo principal

### [TODO] T-031: Consolidar audio móvil específico
- Reproducción móvil según stack elegido
- Integración con el contrato compartido de audio
- Prioridad: ALTA
- Estimación: 3 días
- Aceptación: el audio móvil deja de depender de supuestos web-only

### [TODO] T-032: Consolidar persistencia móvil específica
- SQLite u opción equivalente según plataforma
- Integración con stores compartidos
- Prioridad: ALTA
- Estimación: 3 días
- Aceptación: la persistencia móvil queda definida y no tratada como futuro bloqueado

---

## FASE 4 — Capacidades avanzadas

### [TODO] T-040: Crossfade básico entre tracks
### [TODO] T-041: Waveform real con datos de audio
### [TODO] T-042: Historial y métricas de performance
### [TODO] T-043: Detección de aplausos básica
### [TODO] T-044: Score de reacción por track
### [TODO] T-045: Recomendaciones basadas en reacción
### [TODO] T-046: Análisis automático de BPM / tonalidad / mood

---

## Bugs conocidos

| ID | Descripción | Severidad | Estado |
|----|------------|-----------|--------|
| B-001 | Cobertura automatizada todavía mínima para un flujo tan crítico | Media | En seguimiento |
| B-002 | Falta seguir cerrando paridad y validación específica de native | Media | Pendiente |

---

## Decisiones técnicas pendientes

| Decisión | Opciones | Estado |
|----------|---------|--------|
| Arquitectura de carpetas | capas actuales vs enfoque por features | Pendiente en T-007 |
| Flujo nativo objetivo | hardening Expo native actual vs cambio mayor de stack | En consolidación |
| Persistencia móvil | SQLite u opción equivalente según plataforma | En consolidación |
| Audio real inicial | HTML5 Audio / Web Audio vs stack móvil | Pendiente en T-010 |

