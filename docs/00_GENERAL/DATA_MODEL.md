# Data Model — SuniPlayer

**Agente Responsable:** Agent 04 — State & Data Engineer

---

## 1. Canonical domain model

El modelo canónico vive en `packages/core/src/types.ts` y es la fuente de verdad para web y native.

### `Track`

Representa una obra musical en la biblioteca con sus metadatos de interpretación y estado operativo.

Campos relevantes:

- `id`, `title`, `artist`
- `duration_ms` como unidad canónica de duración
- metadata opcional: `bpm`, `key`, `energy`, `mood`, `genre`, `tags`
- edición / playback: `startTime`, `endTime`, `transposeSemitones`, `playbackTempo`
- assets y UI: `file_path`, `blob_url`, `sheetMusic`, `waveform`, `markers`
- analítica / historial: `playCount`, `completePlays`, `skips`, `totalPlayTimeMs`, `lastPlayedAt`, `affinityScore`
- flags auxiliares: `isCustom`, `analysis_cached`, `sourceMissing`

`Mood` es un enum acotado y no una cadena libre:

- `calm`
- `happy`
- `melancholic`
- `energetic`

### `TrackMarker`

Marcador vinculado a un track.

- `id`
- `posMs`
- `comment`

### `SetEntry`

Unidad canónica de un set generado o editado.

- `id`
- `label`
- `tracks: Track[]`
- `durationMs`
- `builtAt`

### `Show`

Agrupa uno o más sets bajo una misma sesión o show.

- `id`
- `name`
- `createdAt`
- `sets: SetEntry[]`
- `tracks?` como snapshot auxiliar cuando aplica

### `SetHistoryItem`

Compatibilidad con datos de sesiones antiguas.

Se conserva como soporte legado, pero el modelo vigente de trabajo es `Show` + `SetEntry`.

### `Venue` y `Curve`

Entidades simples de configuración del builder:

- `Venue`: `id`, `label`, `color`
- `Curve`: `id`, `label`, `desc`

---

## 2. Persistencia

La persistencia ya no debe documentarse como `localStorage` único y global.

### Modelo actual

- los stores compartidos viven en `packages/core`
- la persistencia se resuelve mediante un bridge de storage por plataforma
- web y native pueden usar implementaciones diferentes sin cambiar el contrato de dominio

### Implicaciones

- la capa de persistencia no define el modelo de dominio
- el modelo de dominio no debe duplicarse en cada app
- cualquier cambio de entidades compartidas debe actualizar este documento y `packages/core/src/types.ts` en conjunto

---

## 3. Relación entre entidades

- `Track` es la unidad base de biblioteca y reproducción
- `SetEntry` agrupa tracks para un contexto de show
- `Show` agrupa múltiples sets bajo una misma sesión
- `SetHistoryItem` es compatibilidad histórica, no la forma principal de modelado

---

## 4. Reglas de consistencia

- `duration_ms` es el campo canónico para duración de track
- `durationMs` se usa en el contexto de set / show
- el modelo de datos compartido vive en core, no en cada app
- `Mood` no acepta valores arbitrarios fuera del enum documentado
- el contrato de datos debe permanecer estable entre web y native

