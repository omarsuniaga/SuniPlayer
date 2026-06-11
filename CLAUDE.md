# CLAUDE — Alineación para Suniplayer

Este documento existe porque **cometiste un error grave** que necesita corrección explícita antes de que sigas trabajando. Léelo COMPLETO antes de tocar cualquier archivo.

---

## 1. Lo que hiciste mal

En la sesión anterior generaste `docs/adr/0001-stack-tecnologico.md` con estado **"Aceptado"** decidiendo:

- ❌ Vue 3 + Composition API + Pinia
- ❌ Vue Test Utils
- ❌ "Ecosistema dominado por el equipo SOI"
- ❌ Ruta `app/src/`

**Nada de eso fue discutido ni aprobado por el usuario.** Lo marcaste como "Aceptado" por tu cuenta, como si fuera una decisión real. No lo era. El usuario lo descubrió solo y lo rechazó.

### Por qué está mal

1. **Nunca preguntaste.** No propusiste el stack, no discutiste alternativas, no esperaste confirmación. Lo inventaste.
2. **Inventaste evidencia falsa.** "Ecosistema dominado por el equipo SOI" — el usuario CONOCE Vue por el proyecto SOI, pero deliberadamente eligió React como estándar de la industria para poder contratar devs en el futuro.
3. **Pusiste "Aceptado" sin aceptación.** El estado del ADR implica que hubo una discusión y una decisión. No la hubo.
4. **Scaffoldcaste código con Vue.** Creaste `app/` con Vue 3 + Pinia + `@vitejs/plugin-vue`. Ese scaffold ya fue migrado a React.

### La lección

No asumas decisiones de stack. No marques ADRs como "Aceptado" sin que el usuario los haya visto y aprobado. Si no hay decisión explícita del usuario, el estado correcto es **"Propuesto"** o simplemente no crees el ADR.

---

## 2. La decisión REAL del stack

Esto es lo que el usuario decidió. Esto es LEY. No lo contradigas, no lo cuestiones, no sugieras alternativas.

| Capa | Elección | Por qué |
|------|----------|---------|
| Lenguaje | TypeScript (estricto) | Tipado fuerte, `noUncheckedIndexedAccess: true` |
| Build | Vite 5 | Estándar, HMR instantáneo |
| UI | **React 18** | El usuario eligió el estándar de la industria para poder contratar |
| Estado global | **Zustand 4** | Simple, tipado, sin boilerplate |
| Tests | **Vitest + React Testing Library + jsdom** | TDD estricto |
| Audio API | Web Audio API + AudioWorklet | Procesamiento por sample en el navegador |
| DSP | WASM (signalsmith-stretch) | Pitch + time-stretch, usado por Moises.ai, BandLab, Soundtrap |
| Persistencia | IndexedDB (vía Dexie) | Offline-first, mapea directo al modelo de datos |
| PWA | vite-plugin-pwa (Workbox) | Offline-first |
| Mobile | **Capacitor 6** | Mismo código web, plugins nativos |
| Desktop | PWA instalable | Tauri como opción futura |
| Backup/Señalización | Supabase (opt-in, opcional) | Fase 2 |
| Tests de dominio | Vitest (pure TS, sin DOM) | Ya implementados, 49 tests pasando |

### Arquitectura

```
src/
  domain/          ← lógica pura (sin React, sin Zustand, sin Dexie, sin DOM)
  application/     ← casos de uso que orquestan dominio + puertos
  infrastructure/  ← adaptadores: Dexie, WebAudio, FileSystem, MediaSession
  ui/              ← componentes React: atomic design, containers vs presentational
```

**Regla de oro:** `domain/` NO importa NADA de las otras capas. Es TypeScript puro. Cero dependencias de framework, cero DOM, cero Dexie.

---

## 3. Estado actual del proyecto

### Branch
`retrofit-arquitectura-documental`

### Lo que YA está hecho (NO tocar sin preguntar)
- ✅ ADR 0001 corregido (ahora dice React + Zustand, no Vue + Pinia)
- ✅ Scaffold migrado a React 18 + Zustand + React Testing Library
- ✅ `app/package.json` con React, Zustand, Vitest, Testing Library
- ✅ `app/vite.config.ts` con `@vitejs/plugin-react`, environment `jsdom`
- ✅ `app/src/main.tsx` — entry point React con StrictMode
- ✅ `app/src/ui/App.tsx` — placeholder (reemplaza al viejo App.vue)
- ✅ 3 slices de dominio con TDD:
  - `domain/collections/setCompleter.ts` — completador de set (+18 tests)
  - `domain/playback/resolveNext.ts` — resolución de next track (+15 tests)
  - `domain/session/interruptionPolicy.ts` — política de interrupciones (+16 tests)
- ✅ 49 tests de dominio pasando en verde
- ✅ Documentación completa: 37+ archivos en `docs/` con contrato Función/Entrada/Proceso/Salida/Errores

### Lo que está VACÍO (listo para implementar)
- `src/application/` — solo `.gitkeep`
- `src/infrastructure/` — solo `.gitkeep`
- `src/ui/` — solo `App.tsx` placeholder

### Archivos que YA NO EXISTEN (migrados)
- ~~`src/main.ts`~~ → ahora es `src/main.tsx`
- ~~`src/ui/App.vue`~~ → ahora es `src/ui/App.tsx`
- ~~`package-lock.json` viejo~~ → regenerado con React

---

## 4. División del trabajo — QUIÉN HACE QUÉ

Para evitar solapamiento, el trabajo está dividido en dos roles:

### CLAUDE (vos) — Implementador
**Hacés:** Tareas concretas de código con instrucciones precisas.
- Escribir código nuevo (componentes, hooks, stores, infraestructura)
- Implementar features específicas que te asigne el orquestador o el usuario
- Hacer research de APIs o librerías puntuales
- Escribir tests para el código que escribís

**NO hacés:**
- Decisiones de arquitectura o stack (eso lo define el orquestador)
- Modificar archivos de dominio (`src/domain/`) sin coordinación
- Crear/eliminar/modificar documentos en `docs/` (salvo que te lo pidan explícitamente)
- Modificar ADRs
- Crear ramas o hacer merges sin coordinación

### OpenCode / Gentle AI (Orquestador) — Arquitecto
**Hace:**
- Decisiones de arquitectura y stack
- Planificación SDD (Spec → Design → Tasks → Apply → Verify)
- Coordinación entre agentes
- Documentación técnica
- Revisiones de código post-implementación

### Regla de oro
**No trabajes en lo mismo al mismo tiempo.** Si no estás seguro de si algo está siendo trabajado por el otro agente, PREGUNTÁ al usuario primero. Es mejor preguntar que pisar trabajo ajeno.

---

## 5. Tareas disponibles para CLAUDE

Cuando el usuario o el orquestador te asigne una tarea, estas son las áreas prioritarias:

### Prioridad 1 — SPIKE de WASM (validación técnica)
Crear un experimento aislado que:
1. Cargue `signalsmith-stretch.wasm` en un AudioWorklet
2. Tome un archivo de audio local
3. Aplique pitch shift (+12 semitonos) + time stretch (50%)
4. Reproduzca el resultado
5. Mida latencia y calidad

### Prioridad 2 — Stores de Zustand
- `src/application/playerStore.ts` — estado del reproductor (track actual, playing, posición, pitch, tempo)
- `src/application/collectionStore.ts` — colecciones y QuouList
- `src/application/sessionStore.ts` — sesión activa, modo show/edit

### Prioridad 3 — Infraestructura
- `src/infrastructure/dexie.ts` — schema de IndexedDB
- `src/infrastructure/audioEngine.ts` — wrapper de Web Audio API + AudioWorklet
- `src/infrastructure/fileSystem.ts` — importación de archivos

### Prioridad 4 — UI
- Componentes atómicos (Button, Slider, ProgressBar)
- Minireproductor (componente footer persistente)
- Vista de reproductor completo

---

## 6. Reglas para CLAUDE

1. **NUNCA inventes decisiones de stack.** Si no está en este documento o en el ADR, no es decisión. Preguntá.
2. **NUNCA marques ADRs como "Aceptado" sin confirmación del usuario.** Usá "Propuesto" si estás explorando.
3. **NUNca toques `docs/` sin permiso explícito.** Esa es la fuente de verdad del proyecto y la maneja el orquestador.
4. **NUNCA asumas que sabés lo que el usuario quiere.** Verificá primero. Siempre.
5. **Commits en inglés, convencionales.** `feat:`, `fix:`, `chore:`, `docs:`, `test:`.
6. **Testeá todo.** El proyecto usa TDD estricto. Sin test aprobado, no hay código.
7. **No borres archivos sin preguntar.** Si algo parece obsoleto, preguntá antes de eliminar.
8. **Consultá este documento al inicio de cada sesión.** Esto es tu brújula. Si no lo leés, vas a desviarte.
