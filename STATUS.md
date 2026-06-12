# STATUS — Suniplayer V2

> Archivo vivo de estado del proyecto. Lo actualiza el orquestador (OpenCode /
> Gentle AI) cuando hay cambios. CLAUDE lo lee al arrancar para ponerse al día.
> No editar sin coordinación.

---

## Rama activa

```
retrofit-arquitectura-documental
```

Último commit: `ff787da` — feat(analysis): bpm analyzer and mood-based smart collections
Anterior: `3479c2d` — feat: library view with track list, context menu and bulk import
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

### Click-to-play — useAudioEngine hook (commit `b8f6c0d`) ✅
- `src/ui/hooks/useAudioEngine.ts` — singleton engine + playTrack (reconstruye AudioBuffer desde blob de Dexie)
- `src/ui/hooks/useAudioEngine.test.ts` — 10 tests (play, pause, stop, seek, pitch, tempo, volume, playTrack, errores)
- `src/infrastructure/audioEngine.ts` — agregó `setStateChangeHandler`, `context` getter, `hasBuffer` getter
- `src/ui/views/FileImportView.tsx` — click en track llama a playTrack con indicador ▶ verde
- `src/ui/miniplayer/Miniplayer.tsx` — play/pause/seek/volume via engine (no store-only)
- `src/ui/player/PlayerView.tsx` — play/pause/stop/seek/pitch/tempo/volume via engine
- `vitest.setup.ts` — polyfill Blob.arrayBuffer para jsdom

### Total: 262 tests, 30 suites, todo verde ✅

---

## Spike P1 — WASM (✅ cerrado)

---

## PR 2 — AudioWorklet + WASM (✅ completado)

---

## PR 3 — UI (✅ completado)

| Componente | Archivos | Tests |
|------------|----------|-------|
| **Button** | `atoms/Button.tsx` | 4 (render, click, disabled, variant) |
| **Slider** | `atoms/Slider.tsx` | 3 (label, format, render) |
| **ProgressBar** | `atoms/ProgressBar.tsx` | 3 (time format, zero, render) |
| **Miniplayer** | `miniplayer/Miniplayer.tsx` | Footer fijo, 3 estados: empty/active/locked, conecta a playerStore |
| **PlayerView** | `player/PlayerView.tsx` | Full player: seek, transport, pitch/tempo/volume sliders, repeat, mode toggle |
| **useMediaSession** | `hooks/useMediaSession.ts` | Wires navigator.mediaSession a playerStore |
| **App.tsx** | `ui/App.tsx` | Renderiza PlayerView + Miniplayer + hook |

### Árbol final de capas
```
src/
  domain/          ← TS puro, 3 módulos, 49 tests
  application/     ← Zustand stores + importActions, 29 + 13 tests
  infrastructure/  ← Dexie, AudioEngine (WASM), FileSystem, 33 tests
  ui/              ← React, atomic design, 13 tests
  spike/           ← WASM validation (descartable)
```

### File Import UI (commit `0bb1d17`) ✅
| Archivo | Descripción | Tests |
|---------|-------------|-------|
| `application/importActions.ts` | Orchestación: decode → persist → store update | — |
| `ui/atoms/FileDropzone.tsx` | Drag & drop + click-to-browse atom | 5 |
| `ui/views/FileImportView.tsx` | Import page: dropzone, track list, errors | 8 |
| `ui/App.tsx` | Show import view when no track loaded | — |

### Pendiente para futuro
- Waveform visualization (canvas + FFT)
- Collection/playlist management UI
- Capacitor mobile build

---

---

## Cola de despacho aut?nomo (formato m?quina ? tools/dispatch.ps1)

> Detalle completo en Engram: `handoff/claude` (obs #2165). Reparto confirmado:
> Antigravity (ex Gemini) = navegador/exploraci?n ? Codex = l?gica+tests headless ? Zen = review previo ? Claude = pasada final de arquitecto.
> Formato: `- [ ] @agente #id engram:topic/key needs:#otra ? descripci?n`
> Estados: `[ ]` abierta ? `[~]` en curso ? `[x]` hecha. Los agentes editan SOLO su l?nea.

- [x] @codex #ui-player-tests engram:sdd/ui-player-tests/tasks ? tests unitarios Miniplayer + PlayerView (contrato y mocks en el topic)
- [x] @antigravity #click-to-play-e2e engram:sdd/click-to-play-e2e/tasks ? validaci?n e2e en navegador, entrega reporte a validation/click-to-play-e2e, NO arregla nada
- [x] @zen #review-ui-player-tests needs:#ui-player-tests engram:workflow/review-criteria ? review del diff de Codex con el checklist de 7 puntos
- [x] @claude #arch-review-ui-player-tests needs:#review-ui-player-tests engram:handoff/claude ? pasada final de arquitecto: APROBADO (veredicto en Engram review/ui-player-tests-claude; 2 hallazgos folded en #player-state-fixes)
- [x] @codex #ctp-polish needs:#arch-review-ui-player-tests engram:sdd/ctp-polish/tasks ? P1 completo (commit 36bbaec, reportes #2186/#2188)
- [x] @zen #review-ctp-polish needs:#ctp-polish engram:workflow/review-criteria ? review del diff de ctp-polish con el checklist de 7 puntos
- [x] @claude #arch-review-ctp-polish needs:#review-ctp-polish engram:handoff/claude ? pasada final: APROBADO con 2 observaciones a backlog (Engram #2191)
- [x] @codex #player-state-fixes needs:#arch-review-ctp-polish engram:sdd/player-state-fixes/tasks ? fixes A-D completos (commit 670f051, reportes #2195/#2196)
- [x] @zen #review-player-state-fixes needs:#player-state-fixes engram:workflow/review-criteria ? review con el checklist de 7 puntos
- [x] @claude #arch-review-player-state-fixes needs:#review-player-state-fixes engram:handoff/claude ? APROBADO (engram #2205); TS fix (commit a635e48) + 179 tests verde + tsc --noEmit limpio
- [x] @codex #waveform needs:#arch-review-player-state-fixes engram:sdd/waveform/tasks ? gr?fica de ondas con seek seg?n docs/componentes/06-grafica-ondas.md (pedido de Omar v?a INBOX) (rework: ver Engram review/waveform)
- [x] @zen #review-waveform needs:#waveform engram:workflow/review-criteria ? review con el checklist de 7 puntos
- [x] @claude #arch-review-waveform needs:#review-waveform engram:handoff/claude ? pasada final de arquitecto (APROBADO: código sólido, tests verdes, 2 mejoras visuales en backlog)
- [x] @antigravity #waveform-e2e needs:#arch-review-waveform engram:sdd/waveform/tasks ? validaci?n visual en navegador de la waveform (render, seek, bloqueo en show), reporta a validation/waveform-e2e
- [x] @codex #nav-shell needs:#arch-review-waveform engram:sdd/nav-shell/tasks ? FASE 1.1: navegaci?n + barra inferior + shell de vistas + bloqueo show (contrato #2199) (rework: ver Engram review/nav-shell)
- [x] @zen #review-nav-shell needs:#nav-shell engram:workflow/review-criteria ? review con el checklist de 7 puntos
- [x] @claude #arch-review-nav-shell needs:#review-nav-shell engram:handoff/claude ? APROBADO (engram #2227); 204 tests verde + tsc --noEmit limpio + N1-N5 covered
- [x] @antigravity #library-view needs:#arch-review-nav-shell engram:sdd/library-view/tasks ? FASE 1.2: vista librería completa según spec 03 (contrato #2200) (rework: tests failing, ver Engram #2234) (reasignada: codex sin tokens)
- [x] @zen #review-library-view needs:#library-view engram:workflow/review-criteria ? review con el checklist de 7 puntos (reabierta: re-revisar el rework)
- [x] @claude #arch-review-library-view needs:#review-library-view engram:handoff/claude ? pasada final de arquitecto (APROBADO: 10/10 tests, spec cubierto, accesibilidad OK — Engram #2234)
- [x] @antigravity #home-view needs:#arch-review-library-view engram:sdd/home-view/tasks ? FASE 1.3: vista inicio con buscador y filtros seg?n specs 01+11 (contrato #2202) (reasignada: codex sin tokens)
- [x] @zen #review-home-view needs:#home-view engram:workflow/review-criteria ? review con el checklist de 7 puntos
- [x] @claude #arch-review-home-view needs:#review-home-view engram:handoff/claude ? pasada final de arquitecto (APROBADO: Engram #2253)
- [x] @antigravity #fase1-e2e needs:#arch-review-home-view engram:product/roadmap ? FASE 1 CIERRE: validaci?n e2e completa en navegador (nav, librer?a, home, show-lock), reporta a validation/fase1-e2e
- [x] @antigravity #play-async-fix needs:#fase1-e2e engram:sdd/play-async-fix/tasks - FIX backlog: manejar rechazo de play() async, revertir estado a paused (contrato #2259)
- [x] @zen #review-play-async-fix needs:#play-async-fix engram:workflow/review-criteria - review con el checklist de 7 puntos ✅ APROBADO (Engram #2265)
- [x] @claude #arch-review-play-async-fix needs:#review-play-async-fix engram:handoff/claude - pasada final de arquitecto ✅ APROBADO sin observaciones (Engram #2267)
- [x] @antigravity #collections-ui needs:#arch-review-play-async-fix engram:sdd/collections-ui/tasks - FASE 2.1: gestion Playlist/Set/QuouList segun spec 02 (contrato #2260)
- [x] @zen #review-collections-ui needs:#collections-ui engram:workflow/review-criteria - review con el checklist de 7 puntos ✅ APROBADO (Engram #2271)
- [x] @claude #arch-review-collections-ui needs:#review-collections-ui engram:handoff/claude - pasada final de arquitecto ✅ APROBADO sin observaciones bloqueantes (Engram #2274)
- [x] @antigravity #set-completer-ui needs:#arch-review-collections-ui engram:sdd/set-completer-ui/tasks - FASE 2.2: UI del completador de set sobre dominio existente (contrato #2261)
- [x] @zen #review-set-completer-ui needs:#set-completer-ui engram:workflow/review-criteria - review con el checklist de 7 puntos ✅ (veredicto inline en arch review)
- [x] @claude #arch-review-set-completer-ui needs:#review-set-completer-ui engram:handoff/claude - pasada final de arquitecto ✅ APROBADO sin observaciones (Engram #2279)
- [x] @antigravity #bpm-mood needs:#arch-review-set-completer-ui engram:sdd/bpm-mood/tasks - FASE 2.3: BPM analyzer + mood + colecciones inteligentes (contrato #2262) ✅ implementado (sin commitear)
- [x] @zen #review-bpm-mood needs:#bpm-mood engram:workflow/review-criteria - review con el checklist de 7 puntos ✅ APROBADO (Engram #2282)
- [x] @claude #arch-review-bpm-mood needs:#review-bpm-mood engram:handoff/claude - pasada final de arquitecto ✅ APROBADO (Engram #2283)
- [x] @antigravity #fase2-e2e needs:#arch-review-bpm-mood engram:product/roadmap - FASE 2 CIERRE: validacion e2e en navegador (colecciones CRUD, quoulist, set completer, smart collections en Home), reporta a validation/fase2-e2e

---

## Pendiente de revisión por CLAUDE

Claude, antes de empezar a implementar nada nuevo:

1. **Revisá el engram-docs-sync** — los archivos `docs/componentes/*.md` y `docs/especificaciones/04-almacenamiento.md` y `docs/vistas/03-vista-libreria.md` tienen nuevas secciones "Notas de Implementación" sincronizadas desde Engram. Verificá que sean correctas y consistentes.
2. **Revisá AGENTS.md** — nuevo archivo root con reglas cross-agent obligatorias. Leélo completo.
3. **Validá el click-to-play end-to-end** — levantá `npx vite` y probá que importar un archivo y hacer click reproduzca audio de verdad. El hook usa `engine.context.decodeAudioData(arrayBuffer)` que necesita un **user gesture** — el click del track lo provee.
4. **Evaluá huecos** — ¿qué falta para que un usuario pueda importar y escuchar música sin fricción? ¿Mensajes de error claros? ¿Estados vacíos? ¿Transiciones?
5. **Revisá si hay que testear Miniplayer/PlayerView** — no tienen tests unitarios todavía.

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
# → 30 files, 262 tests, 0 failures
```

Sin CI configurado. Tests en `src/**/*.test.ts` y `src/**/*.test.tsx`.
