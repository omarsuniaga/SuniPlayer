# STATUS — Suniplayer V2

> Archivo vivo de estado del proyecto. Lo actualiza el orquestador (OpenCode /
> Gentle AI) cuando hay cambios. CLAUDE lo lee al arrancar para ponerse al día.
> No editar sin coordinación.

---

## Rama activa

```
retrofit-arquitectura-documental
```

Último commit: *pendiente — PR 2 (AudioWorklet + WASM)*
Anterior: `515188a` — fix(spike): mobile-safe audio decoding
Base: `master`

---

## Stack (no negociable)

| Capa | Decisión |
|------|----------|
| Lenguaje | TypeScript estricto (`noUncheckedIndexedAccess: true`) |
| Build | Vite 5 |
| UI | **React 18** |
| Estado | **Zustand 4** |
| Tests | **Vitest + React Testing Library + jsdom** |
| Audio | Web Audio API + AudioWorklet |
| DSP | signalsmith-stretch (WASM) |
| Persistencia | Dexie (IndexedDB) |
| PWA | vite-plugin-pwa |
| Mobile | Capacitor 6 |
| Desktop | PWA instalable |
| Sync/Backup | Supabase (opt-in, Fase 2) |

---

## Arquitectura

```
src/
  domain/          ← TS puro, sin React/Zustand/Dexie/DOM
  application/     ← Stores Zustand, casos de uso
  infrastructure/  ← Dexie, WebAudio, FileSystem, MediaSession
  ui/              ← Componentes React (atomic design)
```

---

## Lo que YA está (PR 1 — Foundation + Stores)

### Dominio (PR anterior, commit `8e527d4`)
- `src/domain/collections/setCompleter.ts` — completador de set (+18 tests)
- `src/domain/playback/resolveNext.ts` — resolución de next track (+15 tests)
- `src/domain/session/interruptionPolicy.ts` — política de interrupciones (+16 tests)
- **49 tests de dominio → verdes**
- `docs/` — 37+ archivos de especificación (fuente de verdad)

### Application — 3 stores Zustand (+29 tests)
- `src/application/playerStore.ts` — track actual, playing, posición, pitch, tempo, volumen
- `src/application/collectionStore.ts` — colecciones, QuouList, queue
- `src/application/sessionStore.ts` — sesión activa, modo show/edit, cronómetro
- **29 tests de stores → verdes**

### Infrastructure — 3 módulos (+12 tests)
- `src/infrastructure/dexie.ts` — schema IndexedDB + repositorios
- `src/infrastructure/audioEngine.ts` — wrapper Web Audio API + WASM (signalsmith-stretch) (+16 tests)
- `src/infrastructure/fileSystem.ts` — importación de archivos de audio (+5 tests)
- **12 tests de infra → verdes**

### Migración Vue→React
- `src/main.tsx` — entry point React con StrictMode
- `src/ui/App.tsx` — placeholder React FC
- `package.json` — React 18 + Zustand + Dexie + RTL
- `vite.config.ts` — `@vitejs/plugin-react` + jsdom
- `tsconfig.json` — `jsx: react-jsx`
- ADR 0001 corregido (React+Zustand, no Vue+Pinia)

### Total: 115 tests, 9 suites, todo verde ✅

---

## Spike P1 — WASM (signalsmith-stretch)

**Estado:** ✅ Validado — cerrado

| Check | Resultado |
|-------|-----------|
| Pitch shift +12 semitonos (440→880Hz) | ✅ <5% error |
| Time stretch rate 0.5 (2s→4s) | ✅ <15% error |
| Sin corrupción (NaN-free) | ✅ |
| Señal audible a la salida | ✅ |
| Estéreo multi-canal (desktop) | ✅ |
| Mobile gesture handling | ✅ fix aplicado, falta test real |
| `app/spike.html` + `src/spike/` | Código descartable, no parte del build |

---

## PR 2 — AudioWorklet + WASM (✅ completado)

**Objetivo:** Reemplazar `AudioBufferSourceNode` por `signalsmith-stretch` en `audioEngine.ts`.

| Cambio | Descripción |
|--------|-------------|
| `load()` | Crea `SignalsmithStretchNode`, llama `addBuffers(channels[])` multi-canal |
| `play()` | `stretch.schedule({ input, rate, semitones, active: true })` |
| `pause()` | `stretch.schedule({ active: false })` |
| `stop()` | Desactiva stretch + reset posición a 0 |
| `seek()` | Re-schedule con nueva posición + rate/semitones actuales |
| `setPitch()` | Re-schedule en vivo si está playing |
| `setTempo()` | Re-schedule en vivo si está playing |
| Posición | Via `setUpdateInterval` callback (inputTime del stretch) |
| `_resumeFromPause()` | Eliminado — stretch maneja nativamente |
| Tests | 7 → 16 tests (mock de signalsmith-stretch + ciclo play/pause/stop/seek/re-schedule) |

### PR 3 — UI (siguiente)
- Button, Slider, ProgressBar, Waveform
- Miniplayer (footer persistente, 3 estados: EMPTY/ACTIVE/LOCKED)
- Reproductor completo
- `MediaSession` API wrapper

---

## Lo que NO debe tocar NADIE sin aprobación

- `src/domain/` — ya implementado, ownership compartido
- `docs/` — lo maneja el orquestador
- `docs/adr/` — solo el orquestador
- Decisiones de stack — solo el usuario y el orquestador
- Ramas, merges, push a master — coordinado

---

## Skills activos del proyecto

- `sdd-init`, `sdd-propose`, `sdd-spec`, `sdd-design`, `sdd-tasks`, `sdd-apply`, `sdd-verify`, `sdd-archive` — pipeline SDD
- `component-creator` — formato de documentación (frontmatter YAML, Función/Entrada/Proceso/Salida/Errores, Interaction Pattern, CSS, Wireframe ASCII)
- `work-unit-commits` — commits como unidades revisables
- `chained-pr` — PRs encadenados si >400 líneas
- `judgment-day` — revisión adversarial post-implementación
- `autofix-loop` — corrección autónoma de bugs

---

## Tests

```bash
cd app && npx vitest run
# → 9 files, 115 tests, 0 failures
```

Sin CI configurado. Tests en `src/**/*.test.ts` y `src/**/*.test.tsx`.
