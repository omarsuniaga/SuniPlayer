# STATUS — Suniplayer V2

> Archivo vivo de estado del proyecto. Lo actualiza el orquestador (Gentle AI /
> OpenCode) cuando hay cambios. CLAUDE lo lee al arrancar para ponerse al día.
> No editar sin coordinación.

---

## Branch activa

```
main
```

| Referencia | Valor |
|-----------|-------|
| Branch activa | `main` (deployada a Netlify, estable) |
| Source branch | `retrofit-arquitectura-documental` (código fuente con mejoras de Claude) |
| Último commit | `664fb1f` — chore: ignore tools/dispatch.log |
| Deploy estable | `5712d9f` — fix: restore stable player version |
| Netlify | https://suniplayer.netlify.app — ✅ ready |

---

## Stack (no negociable)

| Capa | Decisión |
|------|----------|
| Lenguaje | TypeScript estricto |
| Build | Vite 5 |
| UI | **React 18** |
| Estado | **Zustand 4** |
| Tests | **Vitest + React Testing Library + jsdom** |
| Audio | Web Audio API + AudioWorklet |
| DSP | signalsmith-stretch (WASM) |
| Persistencia | Dexie (IndexedDB) |
| PWA | vite-plugin-pwa |
| Mobile | Capacitor 6 (futuro) |
| Desktop | PWA instalable |

---

## Arquitectura actual

```
app/
├── src/
│   ├── domain/           ← TS puro, sin React/Zustand/Dexie/DOM (3 módulos)
│   ├── application/      ← Stores Zustand + acciones (player, session, collection, filters, navigation, waveform)
│   ├── infrastructure/   ← Dexie, AudioEngine (WASM), BPM analyzer, FileSystem
│   ├── ui/               ← Componentes React (atomic design)
│   │   ├── atoms/        ← Button, Slider, ProgressBar, FileDropzone, HoldButton, ErrorBoundary
│   │   ├── hooks/        ← useAudioEngine, useMediaSession, useWakeLock, useShowTimer
│   │   ├── miniplayer/   ← Miniplayer component
│   │   ├── player/       ← PlayerView + Waveform
│   │   ├── show/         ← ShowView + TimerShow
│   │   ├── views/        ← HomeView, LibraryView, FileImportView, SetDetailView
│   │   └── waveform/     ← WaveformCanvas
│   ├── spike/            ← WASM validation (descartable)
│   └── main.tsx          ← Entry point React
├── docs/                 ← Documentación (fuente de verdad del diseño)
└── package.json
```

---

## Estado de tests

```bash
cd app && npx vitest run
# → 35 files, 317 tests, 0 failures ✅
```

Sin CI configurado. Tests en `src/**/*.test.ts` y `src/**/*.test.tsx`.

---

## Lo que YA está implementado

### Dominio + Application (49 + 62 tests)
- `domain/collections/setCompleter.ts` — completador de set (+18 tests)
- `domain/playback/resolveNext.ts` — resolución de next track (+15 tests)
- `domain/session/interruptionPolicy.ts` — política de interrupciones (+16 tests)
- `application/playerStore.ts` — estado de reproducción (track, playing, position, pitch, tempo, volume)
- `application/sessionStore.ts` — sesión, modo show, timer, interruptionStack
- `application/collectionStore.ts` — tracks, playlists, sets, queue, source, filters
- `application/navigationStore.ts` — navegación entre vistas
- `application/filters.ts` — sistema de filtros con facetas (mood, text, source)
- `application/moodAlgorithm.ts` — algoritmo de mood basado en BPM/energía

### Infrastructure (26 tests)
- `infrastructure/audioEngine.ts` — wrapper signalsmith-stretch WASM (+22 tests)
- `infrastructure/dexie.ts` — DB IndexedDB: tracks, playlists, sets, settings
- `infrastructure/fileSystem.ts` — importación de archivos de audio
- `infrastructure/bpmAnalyzer.ts` — análisis de BPM (+3 tests)

### UI (180 tests)
- **Atoms**: Button, Slider, ProgressBar, FileDropzone, HoldButton, ErrorBoundary
- **Hooks**: useAudioEngine (+16 tests), useMediaSession (+4 tests), useWakeLock, useShowTimer
- **Views**: HomeView (8 tests), LibraryView (10 tests), FileImportView (8 tests), SetDetailView (8 tests)
- **Player**: PlayerView (21 tests), Waveform (5 tests), WaveformCanvas (4 tests)
- **Miniplayer**: Miniplayer (9 tests)
- **Show**: ShowView (7 tests), TimerShow (10 tests), useShowTimer (10 tests)
- **App shell**: App.test.tsx (9 tests)

---

## Mejoras de CLAUDE (committed ejecutando en main)

Claude implementó estos features sobre `retrofit-arquitectura-documental`, están en `5712d9f`:

| Feature | Archivos |
|---------|----------|
| ErrorBoundary | `ui/atoms/ErrorBoundary.tsx` |
| InstallButton (PWA) | `ui/atoms/InstallButton.tsx` |
| TrackProfileModal | `ui/atoms/TrackProfileModal.tsx` |
| TrackProfile form | `ui/hooks/useTrackProfileModal.ts` |
| stopAll global kill | `ui/hooks/useAudioEngine.ts` (stopAll) |
| updateTrack en DB | `infrastructure/dexie.ts` |
| Pitch/tempo chip | component UI con indicadores |
| Varios test fixes | archivos de test actualizados |

---

## Features investigadas (pendientes de SDD)

### Multi-device audio sync (INVESTIGADO)
Ver Engram `handoff/claude` para el análisis completo. Recomendación:
1. Server Bun liviano + WebSocket
2. NTP-inspired clock sync
3. Master/slave: DJ controla, slaves siguen
4. No requiere transmitir audio (cada dispositivo tiene los tracks en IndexedDB)

### Otras direcciones posibles
- Mejoras de UX/performance
- Playlists avanzadas, ecualizador
- Deploy nativo con Capacitor

---

## Skills activos del proyecto

- `sdd-init`, `sdd-propose`, `sdd-spec`, `sdd-design`, `sdd-tasks`, `sdd-apply`, `sdd-verify`, `sdd-archive` — pipeline SDD
- `component-creator` — formato de documentación Suniplayer
- `work-unit-commits` — commits como unidades revisables
- `chained-pr` — PRs encadenados si >400 líneas
- `judgment-day` — revisión adversarial
- `autofix-loop` — corrección autónoma de bugs

---

## Lo que NO debe tocar NADIE sin aprobación

- `src/domain/` — ownership compartido
- `docs/` — lo maneja el orquestador
- `docs/adr/` — solo el orquestador
- Decisiones de stack — solo el usuario y el orquestador
- Ramas, merges, push forzado — coordinado
