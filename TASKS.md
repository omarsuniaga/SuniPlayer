# TASKS.md — SuniPlayer Development Backlog

> Ultima actualizacion: Marzo 2026
> Metodologia: tareas ordenadas por prioridad y fase.
> Estado: TODO | IN_PROGRESS | DONE | BLOCKED

---

## FASE 0 — Infraestructura (Semana actual)

### [DONE] T-001: Prototipo UI del reproductor
- Pantalla principal con controles play/pause/next/prev
- Waveform visual interactivo
- Modo LIVE / EDIT
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

### [IN_PROGRESS] T-004: Infraestructura del repo
- README.md profesional
- TASKS.md (este archivo)
- TESTING.md
- AGENTS.md
- CI pipeline
- Scripts de lint, typecheck, test
- Aceptacion: `npm run validate` pasa sin errores

---

## FASE 1 — MVP Funcional (Semanas 1-4)

### [TODO] T-010: Migrar prototipo JSX a React Native/Expo
- Convertir componentes web a React Native
- Implementar navegacion con Expo Router
- Adaptar estilos a NativeWind
- Prioridad: ALTA
- Estimacion: 5 dias
- Aceptacion: app corre en iOS simulator y Android emulator

### [TODO] T-011: Implementar AudioService real
- Reproduccion de archivos locales con expo-audio
- Play, pause, seek, volume
- Callback de posicion para actualizar UI
- Prioridad: ALTA
- Estimacion: 3 dias
- Aceptacion: reproduce un MP3 local con controles funcionales

### [TODO] T-012: Implementar DatabaseService con SQLite
- Crear schema (tracks, sets, playlists, sessions)
- CRUD completo para tracks
- CRUD para sets
- Migraciones
- Prioridad: ALTA
- Estimacion: 3 dias
- Aceptacion: datos persisten entre sesiones de la app

### [TODO] T-013: Biblioteca musical - importar archivos
- Seleccionar archivos del dispositivo
- Extraer metadata basica (titulo, artista, duracion)
- Guardar en SQLite
- Mostrar en lista con busqueda
- Prioridad: ALTA
- Estimacion: 4 dias
- Aceptacion: puedo importar 20 MP3s y verlos en la biblioteca

### [TODO] T-014: Set Builder con datos reales
- Conectar algoritmo con biblioteca SQLite real
- Guardar sets generados en DB
- Cargar sets guardados
- Prioridad: ALTA
- Estimacion: 2 dias
- Aceptacion: genero un set con mis canciones reales

### [TODO] T-015: Set Timer con alertas
- Cronometro real con notificaciones
- Alertas a 5min y 2min
- Vibracion haptica en alertas
- Funciona en background
- Prioridad: MEDIA
- Estimacion: 2 dias
- Aceptacion: timer vibra mi telefono cuando quedan 5min

### [TODO] T-016: Primera prueba en show real
- Instalar en telefono personal
- Usar durante un show de hotel
- Documentar problemas encontrados
- Prioridad: CRITICA
- Estimacion: 1 dia (el show)
- Aceptacion: sobrevive un set de 45min sin crash

---

## FASE 2 — Performance Tools (Semanas 5-8)

### [TODO] T-020: Crossfade basico entre tracks
- Fade out del track actual + fade in del siguiente
- Duracion configurable (1-5 seg)
- Prioridad: MEDIA
- Estimacion: 3 dias

### [TODO] T-021: Waveform real con datos de audio
- Generar datos de amplitud al importar
- Cachear waveform en SQLite
- Renderizar con react-native-svg
- Prioridad: MEDIA
- Estimacion: 4 dias

### [TODO] T-022: Transposicion basica (pitch shift)
- Control de pitch +-6 semitonos
- Aplicar en tiempo real durante reproduccion
- Prioridad: BAJA
- Estimacion: 3 dias

### [TODO] T-023: Historial de sesiones
- Registrar cada show (fecha, venue, set, duracion)
- Ver historial con estadisticas
- Canciones mas tocadas
- Prioridad: MEDIA
- Estimacion: 2 dias

### [TODO] T-024: Sugerencias por tiempo restante
- Si quedan 5min, mostrar tracks de 2-3min
- Si quedan 12min, sugerir combinaciones de 2-3 tracks
- Prioridad: MEDIA
- Estimacion: 2 dias

---

## FASE 3 — Audience Intelligence (Semanas 9-12)

### [TODO] T-030: Deteccion de aplausos basica
### [TODO] T-031: Score de reaccion por track
### [TODO] T-032: Recomendaciones basadas en reaccion

---

## FASE 4 — IA Local (Semanas 13+)

### [TODO] T-040: Analisis de BPM automatico
### [TODO] T-041: Deteccion de tonalidad
### [TODO] T-042: Clasificacion de mood/energia
### [TODO] T-043: Modelo de recomendacion de siguiente track

---

## Bugs Conocidos

| ID | Descripcion | Severidad | Estado |
|----|------------|-----------|--------|
| — | Ninguno reportado aun | — | — |

---

## Decisiones Tecnicas Pendientes

| Decision | Opciones | Estado |
|----------|---------|--------|
| Libreria de audio nativa | expo-audio vs react-native-track-player | Pendiente evaluacion en T-011 |
| Generacion de waveform | expo-av metering vs modulo nativo | Pendiente en T-021 |
| Storage de archivos audio | expo-file-system vs acceso directo | Pendiente en T-013 |
