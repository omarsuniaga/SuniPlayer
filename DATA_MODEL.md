# Data Model — SuniPlayer

**Agente Responsable:** Agent 04 — State & Data Engineer

---

## 📋 Entidades Core

### 1. `Track`
Representa una obra musical en la biblioteca.
- `id`: string (UUID)
- `title`: string
- `artist`: string
- `duration_ms`: number
- `bpm`: number
- `key`: string
- `energy`: number (0.0 - 1.0)
- `mood`: string (happy, calm, etc.)
- `file_path`: string (referencia local)

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
