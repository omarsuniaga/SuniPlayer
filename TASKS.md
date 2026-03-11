# TASKS.md — SuniPlayer Development Backlog

> Ultima actualizacion: Marzo 2026
> Metodologia: tareas ordenadas por fase, prioridad y dependencia.
> Estado: TODO | IN_PROGRESS | DONE | BLOCKED

---

## FASE 0 — Consolidacion tecnica del prototipo (Actual)

### [DONE] T-001: Prototipo UI del reproductor
- Pantalla principal con controles play/pause/next/prev
- Waveform visual interactivo
- Modo LIVE / EDIT en prototipo
- Aceptacion: se puede simular un set completo en el prototipo web

### [DONE] T-002: Smart Set Builder
- Algoritmo de generacion de sets por duracion objetivo
- Seleccion de venue, curva de energia
- Panel de repertorio con filtros
- Aceptacion: genera sets de 45min con +-90seg de tolerancia

### [DONE] T-003: Conexion Builder-Player
- Boton "Enviar al Player" transfiere set generado
- Timer se configura automaticamente
- Cola del player refleja el set
- Aceptacion: flujo completo builder > player funciona sin errores

### [DONE] T-004: Infraestructura documental y operativa
- README.md coherente con el estado real del repo
- TASKS.md y TESTING.md alineados con el MVP actual
- AGENTS.md conectado a la documentacion oficial
- Definicion de fuente de verdad documental
- Aceptacion: un humano o agente puede entender con claridad que existe hoy y que es futuro

### [DONE] T-005: Unificar contratos de datos
- Normalizar `Track` y entidades relacionadas
- Estandarizar `duration_ms` como unidad oficial
- Alinear `types`, `constants`, `services`, `store` y componentes
- Prioridad: ALTA
- Estimacion: 2 dias
- Aceptacion: no existen modelos duplicados de duracion o naming en conflicto

### [DONE] T-006: Separar codigo actual de codigo legacy
- Identificar entrypoint oficial actual
- Aislar archivos `jsx/js` que ya no son fuente activa
- Preparar carpeta o estrategia de retiro gradual de legacy
- Prioridad: ALTA
- Estimacion: 2 dias
- Aceptacion: queda claro que archivos son oficiales y cuales son legacy

### [TODO] T-007: Limpiar arquitectura de carpetas
- Definir estructura destino mas escalable
- Partir el mega `App.tsx`
- Reubicar responsabilidades por dominio
- Prioridad: ALTA
- Estimacion: 4 dias
- Aceptacion: la app queda entendible y lista para crecer sin aumentar el caos

### [DONE] T-008: Scripts de validacion base
- Agregar `lint`
- Agregar `typecheck` dedicado
- Agregar test runner inicial
- Agregar `validate`
- Prioridad: ALTA
- Estimacion: 2 dias
- Aceptacion: existe una validacion minima automatizada del proyecto

### [TODO] T-009: Definir siguiente plataforma con evidencia
- Determinar si el siguiente paso es continuar web o migrar a Expo
- Basar la decision en necesidades reales de audio, persistencia y uso movil
- Registrar decision en `DECISIONS.md`
- Prioridad: ALTA
- Estimacion: 1 dia de analisis
- Aceptacion: la siguiente fase de desarrollo queda decidida formalmente

---

## FASE 1 — Base funcional del MVP

### [TODO] T-010: Implementar AudioService real inicial
- Reproduccion real de archivos o simulacion robusta segun plataforma elegida
- Play, pause, seek, volume
- Callback de posicion para actualizar UI
- Prioridad: ALTA
- Estimacion: 3 dias
- Aceptacion: el player deja de ser solo prototipo visual

### [DONE] T-011: Implementar persistencia local minima
- Estrategia inicial decidida para etapa web: `localStorage`
- Guardar sets generados
- Recuperar historial y configuracion basica
- Recuperar contexto ligero del player al reiniciar
- Prioridad: ALTA
- Estimacion: 3 dias
- Aceptacion: los datos clave sobreviven al reinicio de la app

### [DONE] T-016: Perfil tonal por cancion
- Guardar tono base, tono objetivo y semitonos de transposicion en el perfil del track
- Mostrar el tono objetivo en vistas relevantes
- Aplicar transposicion en reproduccion web mediante `playbackRate`
- Prioridad: MEDIA
- Estimacion: 2 dias
- Aceptacion: puedo configurar una cancion para tocarla en otro tono y el ajuste queda guardado

### [DONE] T-017: Recovery de sesion para shows en PWA
- Guardar snapshots de show en `IndexedDB`
- Restaurar cola, contexto y configuracion tras recarga inesperada
- Advertir cuando el audio local requiera reconexion en iPad
- Prioridad: ALTA
- Estimacion: 2 dias
- Aceptacion: una recarga inesperada no borra silenciosamente la lista ni el contexto de show

### [TODO] T-012: Biblioteca musical con datos reales
- Reemplazar dependencia excesiva de mocks
- Cargar metadata minima real o semirreal
- Mejorar busqueda y filtrado
- Prioridad: ALTA
- Estimacion: 4 dias
- Aceptacion: puedo trabajar con repertorio realista y no solo demo data

### [TODO] T-013: Set Builder con datos reales
- Conectar algoritmo con la fuente de datos oficial
- Guardar sets generados en persistencia local
- Recuperar sets guardados
- Prioridad: ALTA
- Estimacion: 2 dias
- Aceptacion: genero y reutilizo sets reales desde la app

### [TODO] T-014: Timer de set con alertas
- Cronometro real con alertas visibles
- Señales claras a 5min y 2min
- Prioridad: MEDIA
- Estimacion: 2 dias
- Aceptacion: el timer ayuda realmente a terminar el set a tiempo

### [TODO] T-015: Endurecer UX de escenario
- Mejorar legibilidad
- Reducir clics accidentales
- Reforzar modo LIVE
- Prioridad: ALTA
- Estimacion: 3 dias
- Aceptacion: la UI resiste mejor uso bajo presion

---

## FASE 2 — Validacion en uso real

### [TODO] T-020: Primera prueba controlada de sesion real
- Ejecutar flujo completo en una sesion tipo show
- Documentar bugs y fricciones
- Prioridad: CRITICA
- Estimacion: 1 dia
- Aceptacion: sobrevive un set de 45min sin fallo critico

### [TODO] T-021: Recuperacion de sesion y continuidad
- Restaurar estado relevante tras cierre o reinicio
- Prioridad: ALTA
- Estimacion: 2 dias
- Aceptacion: el musico no pierde el contexto de trabajo facilmente

### [TODO] T-022: Sugerencias por tiempo restante
- Mostrar tracks o combinaciones segun tiempo faltante
- Prioridad: MEDIA
- Estimacion: 2 dias
- Aceptacion: la sugerencia ayuda a cerrar el set con menos improvisacion

### [TODO] T-023: Historial de sesiones
- Registrar shows o sesiones realizadas
- Ver historial con datos utiles
- Prioridad: MEDIA
- Estimacion: 2 dias
- Aceptacion: puedo revisar sets ejecutados y patrones basicos

---

## FASE 3 — Decision de expansion de plataforma

### [BLOCKED] T-030: Migrar prototipo a Expo / React Native
- Convertir componentes y flujos al stack movil
- Implementar navegacion y servicios equivalentes
- Estado: bloqueado hasta completar T-009
- Prioridad: ALTA
- Estimacion: 5 dias
- Aceptacion: corre en entorno movil con feature parity basica

### [BLOCKED] T-031: Implementar audio movil especifico
- Reproduccion movil segun stack elegido
- Estado: bloqueado hasta decision de plataforma
- Prioridad: ALTA

### [BLOCKED] T-032: Persistencia movil especifica
- SQLite u opcion equivalente segun plataforma elegida
- Estado: bloqueado hasta decision de plataforma
- Prioridad: ALTA

---

## FASE 4 — Capacidades avanzadas

### [TODO] T-040: Crossfade basico entre tracks
### [TODO] T-041: Waveform real con datos de audio
### [TODO] T-042: Historial y metricas de performance
### [TODO] T-043: Deteccion de aplausos basica
### [TODO] T-044: Score de reaccion por track
### [TODO] T-045: Recomendaciones basadas en reaccion
### [TODO] T-046: Analisis automatico de BPM / tonalidad / mood

---

## Bugs conocidos

| ID | Descripcion | Severidad | Estado |
|----|------------|-----------|--------|
| B-001 | Cobertura automatizada todavia minima para un flujo tan critico | Media | En seguimiento |
| B-002 | Aun falta una decision formal sobre la siguiente plataforma | Media | Pendiente |

---

## Decisiones tecnicas pendientes

| Decision | Opciones | Estado |
|----------|---------|--------|
| Plataforma siguiente | continuar web vs migrar a Expo | Pendiente en T-009 |
| Audio real inicial | HTML5 Audio / Web Audio vs stack movil | Pendiente en T-010 / T-009 |
| Persistencia local | localStorage ahora, IndexedDB si el volumen crece, SQLite solo con nueva decision de plataforma | Baseline decidida en ADR 004 |
| Arquitectura de carpetas | capas actuales vs enfoque por features | Pendiente en T-007 |
