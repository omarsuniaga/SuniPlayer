# Data Model — SuniPlayer

**Agente Responsable:** Agent 04 — State & Data Engineer

---

## 📋 Entidades Core

### 1. `Track`
Representa una obra musical en la biblioteca con sus metadatos de interpretación.
- `id`: string (UUID)
- `title`: string
- `artist`: string
- `duration_ms`: number
- `bpm`: number
- `key`: string (ej. "C# Major")
- `targetKey`: string (tono objetivo deseado)
- `transposeSemitones`: number (desplazamiento calculado)
- `playbackTempo`: number (factor de velocidad independiente 0.8 - 1.2)
- `startTime`: number (ms - punto de inicio personalizado)
- `endTime`: number (ms - punto de fin personalizado)
- `energy`: number (0.0 - 1.0)
- `mood`: string (happy, calm, etc.)
- `file_path`: string (referencia local)
- `blob_url`: string (sesión temporal para archivos importados)
- `sheetMusic`: Array<{id, type, name}> (partituras vinculadas)
- `notes`: string (notas de performance para el show)
- `playCount`, `totalPlayTimeMs`, `lastPlayedAt`: métricas de uso

### 2. `SetPlan` (Generated Set)
El resultado del algoritmo de construcción.
- `id`: string
- `tracks`: Track[]
- `target_duration`: number (segundos)
- `actual_duration`: number (segundos)
- `venue_id`: string
- `curve_id`: string

### 3. `SetHistoryItem`
Persistencia de una sesión realizada o planeada.
- `id`: string
- `name`: string
- `tracks`: Track[]
- `date`: string (ISO)
- `total_time`: number

---

## 💾 Persistencia
En el MVP, se utiliza `localStorage` mediante el middleware de persistencia de Zustand.

### Estrategia Futura
Migración a **IndexedDB** a través de `Dexie.js` para manejar bibliotecas de >500 tracks sin degradar la performance de la UI.
