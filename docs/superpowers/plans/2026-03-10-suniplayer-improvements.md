# SuniPlayer — Plan de Mejoras Completo

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir 3 bugs críticos, limpiar deuda técnica (archivos legacy + store monolítico), y añadir 3 mejoras de UX (indicador de simulación, formulario de metadata al importar, drag & drop en el set).

**Architecture:** Se ejecuta en orden de prioridad: Bugs primero (datos + algoritmo), luego deuda técnica (limpieza + división del store), luego UX (features nuevos). El setBuilderService recibe venue y BPM como parámetros. El store monolítico se divide en 4 stores de dominio. Los nuevos componentes son autocontenidos.

**Tech Stack:** React 18, TypeScript, Vite, Zustand, HTML5 Audio API, CSS custom properties

---

## Chunk 1: Bug Fixes

### Task 1: Fix leading space en file_path del track #1

**Files:**
- Modify: `src/data/constants.ts` (línea 4)

- [ ] **Step 1: Corregir el bug**

En `src/data/constants.ts`, línea 4, el campo `file_path` tiene un espacio inicial que impide que el audio cargue. Cambiar:

```ts
// ANTES (buggy):
file_path: " Sinatra - Fly Me To The Moon.mp3",

// DESPUÉS (correcto):
file_path: "Sinatra - Fly Me To The Moon.mp3",
```

- [ ] **Step 2: Verificar build limpio**

```bash
npm run build
```
Expected: build exitoso sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/data/constants.ts
git commit -m "fix: remove leading space in track #1 file_path"
```

---

### Task 2: Conectar filtro de BPM range al algoritmo buildSet

**Files:**
- Modify: `src/services/setBuilderService.ts`
- Modify: `src/store/useProjectStore.ts`

**Contexto:** El store ya tiene `bpmMin` (55) y `bpmMax` (140) como settings, pero `buildSet()` no los usa. El algoritmo debe pre-filtrar el catálogo antes de la fase Monte Carlo.

- [ ] **Step 1: Actualizar la interfaz BuildOpts**

En `src/services/setBuilderService.ts`, añadir `bpmMin` y `bpmMax` a la interfaz:

```ts
interface BuildOpts {
    curve?: string;
    /** Tolerance in SECONDS around the target. Default: adaptive */
    tol?: number;
    /** BPM range filter — tracks outside this range are excluded */
    bpmMin?: number;
    bpmMax?: number;
    /** Venue type — biases energy range of selected tracks */
    venue?: string;
}
```

- [ ] **Step 2: Añadir lógica de filtrado al inicio de buildSet()**

Al inicio de la función `buildSet()`, justo después de extraer las opciones, añadir el filtrado de BPM:

```ts
export function buildSet(
    repo: Track[],
    target: number,
    opts: BuildOpts = {}
): Track[] {
    const { curve = "steady", bpmMin, bpmMax } = opts;

    // ── Pre-filter by BPM range ───────────────────────────────────────────────
    const bpmFiltered = repo.filter(t =>
        (bpmMin === undefined || t.bpm >= bpmMin) &&
        (bpmMax === undefined || t.bpm <= bpmMax)
    );
    // Fallback to full repo if BPM filter leaves fewer than 3 tracks
    const workRepo = bpmFiltered.length >= 3 ? bpmFiltered : repo;

    // Adaptive tolerance...
    const adaptiveTol = Math.max(180, Math.min(300, Math.round(target * 0.15)));
    const tol = opts.tol !== undefined ? opts.tol : adaptiveTol;
    // ...
```

Reemplazar todas las referencias a `repo` por `workRepo` en el resto de la función (las fases Monte Carlo, Greedy fallback, y el return final).

- [ ] **Step 3: Actualizar doGen en el store para pasar bpmMin/bpmMax**

En `src/store/useProjectStore.ts`, actualizar la acción `doGen`:

```ts
doGen: () => {
    const { targetMin, curve, venue, bpmMin, bpmMax } = get();
    const tSec = targetMin * 60;
    set({ genSet: buildSet(TRACKS, tSec, { curve, venue, bpmMin, bpmMax }) });
},
```

- [ ] **Step 4: Build y verificar**

```bash
npm run build
```
Expected: build exitoso. Probar manualmente: ajustar BPM range en Settings a 60-80, generar set → solo canciones lentas.

- [ ] **Step 5: Commit**

```bash
git add src/services/setBuilderService.ts src/store/useProjectStore.ts
git commit -m "feat: connect bpmMin/bpmMax settings to set builder algorithm"
```

---

### Task 3: Conectar el Venue al algoritmo buildSet

**Files:**
- Modify: `src/services/setBuilderService.ts`
- Modify: `src/store/useProjectStore.ts`

**Contexto:** El selector de Venue existe en la UI pero `buildSet()` ignora completamente el campo `venue`. Cada tipo de venue debe sesgar el rango de energía de las canciones seleccionadas.

| Venue    | Rango de energía | Razón |
|----------|-----------------|-------|
| lobby    | 0.3 – 0.7       | Ambiente neutro, no demasiado agresivo |
| dinner   | 0.2 – 0.6       | Cena tranquila, música suave |
| cocktail | 0.5 – 0.85      | Animado pero no club |
| event    | 0.65 – 1.0      | Alta energía, celebración |
| cruise   | 0.0 – 1.0       | Sin restricción (variado) |

- [ ] **Step 1: Añadir constante VENUE_ENERGY y aplicar filtro en buildSet()**

En `src/services/setBuilderService.ts`, añadir antes de la función `buildSet`:

```ts
// ── Venue → energy range bias ─────────────────────────────────────────────────
const VENUE_ENERGY: Record<string, [number, number]> = {
    lobby:    [0.3,  0.7],
    dinner:   [0.2,  0.6],
    cocktail: [0.5,  0.85],
    event:    [0.65, 1.0],
    cruise:   [0.0,  1.0],
};
```

En la función `buildSet()`, después del filtro de BPM, añadir el filtro de venue:

```ts
    // ── Pre-filter by venue energy range ─────────────────────────────────────
    let workRepo = bpmFiltered.length >= 3 ? bpmFiltered : repo;

    if (opts.venue && VENUE_ENERGY[opts.venue]) {
        const [eMin, eMax] = VENUE_ENERGY[opts.venue];
        const venueFiltered = workRepo.filter(t => t.energy >= eMin && t.energy <= eMax);
        // Only apply if we have enough tracks; otherwise fall back to unfiltered
        workRepo = venueFiltered.length >= 3 ? venueFiltered : workRepo;
    }
```

- [ ] **Step 2: Confirmar que doGen pasa venue (del Task 2 anterior)**

`doGen` ya pasa `venue` si se completó Task 2. Verificar que la línea en el store sea:
```ts
set({ genSet: buildSet(TRACKS, tSec, { curve, venue, bpmMin, bpmMax }) });
```

- [ ] **Step 3: Build y verificar**

```bash
npm run build
```
Probar: seleccionar "Cena" → generar set → las canciones deben ser mayoritariamente calm/melancholic. Seleccionar "Evento" → canciones energéticas.

- [ ] **Step 4: Commit**

```bash
git add src/services/setBuilderService.ts
git commit -m "feat: venue type now biases energy range in set builder algorithm"
```

---

## Chunk 2: Deuda Técnica

### Task 4: Eliminar archivos duplicados y legacy

**Archivos a ELIMINAR:**

| Archivo | Razón |
|---------|-------|
| `src/App.jsx` | Duplicado — `App.tsx` es el que usa Vite |
| `src/data/theme.js` | Duplicado — `theme.ts` es el usado |
| `src/data/mockTracks.js` | Reemplazado por `constants.ts` |
| `src/store/audioStore.js` | Reemplazado por `useProjectStore.ts` + `useAudio.ts` |
| `src/store/libraryStore.js` | Reemplazado por `useProjectStore.ts` |
| `src/store/queueStore.js` | Reemplazado por `useProjectStore.ts` |
| `src/services/audioService.js` | Reemplazado por `useAudio.ts` |
| `src/services/setBuilderService.js` | Reemplazado por `setBuilderService.ts` |
| `src/utils/durations.js` | Reemplazado por `uiUtils.ts` |
| `src/utils/time.js` | Reemplazado por `uiUtils.ts` |
| `src/components/library/TrackLibrary.jsx` | No importado desde ningún lugar activo |
| `src/components/player/PlayerControls.jsx` | No importado |
| `src/components/player/Wave.jsx` | Reemplazado por `components/common/Wave.tsx` |
| `src/components/queue/QueueList.jsx` | No importado |
| `src/components/set-manager/SetBuilderConfig.jsx` | No importado |
| `src/components/timer/VisualTimer.jsx` | No importado |
| `src/pages/LibraryView.jsx` | No importado |
| `src/pages/SettingsView.jsx` | No importado |
| `src/pages/StageView.jsx` | No importado |

- [ ] **Step 1: Verificar que ningún archivo activo los importa**

```bash
grep -rn "App\.jsx\|theme\.js\|mockTracks\|audioStore\|libraryStore\|queueStore\|audioService\|setBuilderService\.js\|durations\.js\|time\.js\|TrackLibrary\|PlayerControls\|Wave\.jsx\|QueueList\|SetBuilderConfig\|VisualTimer\|LibraryView\|SettingsView\|StageView" src/ --include="*.ts" --include="*.tsx"
```

Expected: Sin resultados (o solo matches dentro de los propios archivos legacy).

- [ ] **Step 2: Eliminar archivos**

```bash
cd /c/Users/omare/.claude/projects/SuniPlayer

rm src/App.jsx
rm src/data/theme.js src/data/mockTracks.js
rm src/store/audioStore.js src/store/libraryStore.js src/store/queueStore.js
rm src/services/audioService.js src/services/setBuilderService.js
rm src/utils/durations.js src/utils/time.js
rm src/components/library/TrackLibrary.jsx
rm src/components/player/PlayerControls.jsx
rm src/components/player/Wave.jsx
rm src/components/queue/QueueList.jsx
rm "src/components/set-manager/SetBuilderConfig.jsx"
rm src/components/timer/VisualTimer.jsx
rm src/pages/LibraryView.jsx src/pages/SettingsView.jsx src/pages/StageView.jsx
```

- [ ] **Step 3: Build para confirmar sin errores**

```bash
npm run build
```
Expected: Build limpio. Si hay errores de import, corregirlos antes de continuar.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove legacy JSX files and duplicates"
```

---

### Task 5: Dividir useProjectStore en stores de dominio

**Files a CREAR:**
- `src/store/useBuilderStore.ts` — lógica del Builder (targetMin, venue, curve, genSet, search, fMood, doGen, saveSet)
- `src/store/usePlayerStore.ts` — lógica del Player (pQueue, ci, playing, pos, vol, elapsed, tTarget, mode, toPlayer, appendToQueue)
- `src/store/useLibraryStore.ts` — tracks importados por el usuario (customTracks, addCustomTrack, removeCustomTrack, clearCustomTracks)
- `src/store/useSettingsStore.ts` — configuración persistida (autoNext, crossfade, showSettings, bpmMin, bpmMax, defaultVol)
- `src/store/useHistoryStore.ts` — historial de sets (history, setHistory, clearHistory)

**Files a MODIFICAR:**
- `src/store/useProjectStore.ts` — reemplazar toda la lógica por re-exports de los stores de dominio (compatibilidad backward)
- Todos los archivos que usan `useProjectStore` — actualizar imports progresivamente

**Estrategia:** Migrar un store a la vez. Después de cada store, actualizar `useProjectStore.ts` para re-exportar ese dominio, y actualizar los componentes que lo usan. Así nunca rompemos la app.

- [ ] **Step 1: Crear useSettingsStore.ts**

```ts
// src/store/useSettingsStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SettingsState {
    autoNext: boolean;
    setAutoNext: (v: boolean) => void;
    crossfade: boolean;
    setCrossfade: (v: boolean) => void;
    showSettings: boolean;
    setShowSettings: (v: boolean) => void;
    bpmMin: number;
    setBpmMin: (v: number) => void;
    bpmMax: number;
    setBpmMax: (v: number) => void;
    defaultVol: number;
    setDefaultVol: (v: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            autoNext: true,
            setAutoNext: (autoNext) => set({ autoNext }),
            crossfade: true,
            setCrossfade: (crossfade) => set({ crossfade }),
            showSettings: false,
            setShowSettings: (showSettings) => set({ showSettings }),
            bpmMin: 55,
            setBpmMin: (bpmMin) => set({ bpmMin }),
            bpmMax: 140,
            setBpmMax: (bpmMax) => set({ bpmMax }),
            defaultVol: 0.85,
            setDefaultVol: (defaultVol) => set({ defaultVol }),
        }),
        {
            name: "suniplayer-settings",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
```

- [ ] **Step 2: Crear useHistoryStore.ts**

```ts
// src/store/useHistoryStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SetHistoryItem } from "../types";

interface HistoryState {
    history: SetHistoryItem[];
    addHistoryItem: (item: SetHistoryItem) => void;
    clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
    persist(
        (set) => ({
            history: [],
            addHistoryItem: (item) =>
                set((state) => ({ history: [item, ...state.history] })),
            clearHistory: () => set({ history: [] }),
        }),
        {
            name: "suniplayer-history",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
```

- [ ] **Step 3: Crear useLibraryStore.ts**

```ts
// src/store/useLibraryStore.ts
import { create } from "zustand";
import { Track } from "../types";

interface LibraryState {
    customTracks: Track[];
    addCustomTrack: (track: Track) => void;
    removeCustomTrack: (id: string) => void;
    clearCustomTracks: () => void;
}

export const useLibraryStore = create<LibraryState>()((set) => ({
    customTracks: [],
    addCustomTrack: (track) =>
        set((state) => ({ customTracks: [...state.customTracks, track] })),
    removeCustomTrack: (id) =>
        set((state) => ({ customTracks: state.customTracks.filter((t) => t.id !== id) })),
    clearCustomTracks: () => set({ customTracks: [] }),
}));
```

- [ ] **Step 4: Crear usePlayerStore.ts**

```ts
// src/store/usePlayerStore.ts
import { create } from "zustand";
import { Track } from "../types";

interface PlayerState {
    pQueue: Track[];
    setPQueue: (queue: Track[]) => void;
    ci: number;
    setCi: (index: number) => void;
    playing: boolean;
    setPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;
    pos: number;
    setPos: (pos: number | ((prev: number) => number)) => void;
    vol: number;
    setVol: (vol: number) => void;
    elapsed: number;
    setElapsed: (elapsed: number | ((prev: number) => number)) => void;
    tTarget: number;
    setTTarget: (target: number) => void;
    mode: "edit" | "live";
    setMode: (mode: "edit" | "live" | ((prev: "edit" | "live") => "edit" | "live")) => void;
    appendToQueue: (tracks: Track[]) => void;
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
    pQueue: [],
    setPQueue: (pQueue) => set({ pQueue }),
    ci: 0,
    setCi: (ci) => set({ ci }),
    playing: false,
    setPlaying: (update) =>
        set((state) => ({
            playing: typeof update === "function" ? update(state.playing) : update,
        })),
    pos: 0,
    setPos: (update) =>
        set((state) => ({
            pos: typeof update === "function" ? update(state.pos) : update,
        })),
    vol: 0.85,
    setVol: (vol) => set({ vol }),
    elapsed: 0,
    setElapsed: (update) =>
        set((state) => ({
            elapsed: typeof update === "function" ? update(state.elapsed) : update,
        })),
    tTarget: 2700,
    setTTarget: (tTarget) => set({ tTarget }),
    mode: "edit",
    setMode: (update) =>
        set((state) => ({
            mode: typeof update === "function" ? update(state.mode) : update,
        })),
    appendToQueue: (tracks) => {
        const { pQueue, ci, tTarget } = get();
        if (!tracks.length) return;
        if (pQueue.length === 0) {
            set({
                pQueue: [...tracks],
                ci: 0, pos: 0, playing: false, elapsed: 0,
                tTarget: tracks.reduce((a, t) => a + t.duration_ms, 0) / 1000,
            });
        } else {
            const newQueue = [
                ...pQueue.slice(0, ci + 1),
                ...tracks,
                ...pQueue.slice(ci + 1),
            ];
            const addedSec = tracks.reduce((a, t) => a + t.duration_ms, 0) / 1000;
            set({ pQueue: newQueue, tTarget: tTarget + addedSec });
        }
    },
}));
```

- [ ] **Step 5: Crear useBuilderStore.ts**

```ts
// src/store/useBuilderStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Track, SetHistoryItem } from "../types";
import { TRACKS, VENUES } from "../data/constants";
import { buildSet } from "../services/setBuilderService";
import { useSettingsStore } from "./useSettingsStore";
import { useHistoryStore } from "./useHistoryStore";
import { usePlayerStore } from "./usePlayerStore";

interface BuilderState {
    view: "builder" | "player" | "history";
    setView: (view: "builder" | "player" | "history") => void;
    targetMin: number;
    setTargetMin: (min: number) => void;
    venue: string;
    setVenue: (venue: string) => void;
    curve: string;
    setCurve: (curve: string) => void;
    genSet: Track[];
    setGenSet: (set: Track[] | ((prev: Track[]) => Track[])) => void;
    search: string;
    setSearch: (search: string) => void;
    fMood: string | null;
    setFMood: (mood: string | null) => void;
    setTrackNotes: (trackId: string, notes: string) => void;
    doGen: () => void;
    toPlayer: () => void;
    saveSet: () => void;
}

export const useBuilderStore = create<BuilderState>()(
    persist(
        (set, get) => ({
            view: "builder",
            setView: (view) => set({ view }),
            targetMin: 45,
            setTargetMin: (targetMin) => set({ targetMin }),
            venue: "lobby",
            setVenue: (venue) => set({ venue }),
            curve: "steady",
            setCurve: (curve) => set({ curve }),
            genSet: [],
            setGenSet: (update) =>
                set((state) => ({
                    genSet: typeof update === "function" ? update(state.genSet) : update,
                })),
            search: "",
            setSearch: (search) => set({ search }),
            fMood: null,
            setFMood: (fMood) => set({ fMood }),

            setTrackNotes: (trackId, notes) => {
                const player = usePlayerStore.getState();
                player.setPQueue(player.pQueue.map(t => t.id === trackId ? { ...t, notes } : t));
                set(state => ({
                    genSet: state.genSet.map(t => t.id === trackId ? { ...t, notes } : t),
                }));
            },

            doGen: () => {
                const { targetMin, curve, venue } = get();
                const { bpmMin, bpmMax } = useSettingsStore.getState();
                const tSec = targetMin * 60;
                set({ genSet: buildSet(TRACKS, tSec, { curve, venue, bpmMin, bpmMax }) });
            },

            toPlayer: () => {
                const { genSet, targetMin } = get();
                if (!genSet.length) return;
                const player = usePlayerStore.getState();
                if (player.playing) {
                    set({ view: "player" });
                } else {
                    player.setPQueue([...genSet]);
                    player.setCi(0);
                    player.setPos(0);
                    player.setPlaying(false);
                    player.setElapsed(0);
                    player.setTTarget(targetMin * 60);
                    player.setMode("edit");
                    set({ view: "player" });
                }
            },

            saveSet: () => {
                const { genSet, targetMin, venue, curve } = get();
                if (!genSet.length) return;
                const v = VENUES.find((x) => x.id === venue);
                const newItem: SetHistoryItem = {
                    id: Date.now() + "",
                    name: (v?.label || "Set") + " " + targetMin + "min",
                    tracks: [...genSet],
                    total: genSet.reduce((acc, t) => acc + t.duration_ms, 0),
                    target: targetMin * 60,
                    venue,
                    curve,
                    date: new Date().toLocaleString(),
                };
                useHistoryStore.getState().addHistoryItem(newItem);
            },
        }),
        {
            name: "suniplayer-builder",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                targetMin: state.targetMin,
                venue: state.venue,
                curve: state.curve,
                genSet: state.genSet,
                view: state.view,
            }),
        }
    )
);
```

- [ ] **Step 6: Actualizar useProjectStore.ts como capa de compatibilidad**

Reemplazar todo el contenido de `src/store/useProjectStore.ts` con re-exports de los nuevos stores:

```ts
/**
 * useProjectStore — Compatibility shim
 *
 * Re-exports all domain stores through a single unified hook for backward
 * compatibility. Components should migrate to using individual stores.
 */
export { useBuilderStore } from "./useBuilderStore";
export { usePlayerStore } from "./usePlayerStore";
export { useLibraryStore } from "./useLibraryStore";
export { useSettingsStore } from "./useSettingsStore";
export { useHistoryStore } from "./useHistoryStore";

// Legacy combined hook for gradual migration
import { useBuilderStore } from "./useBuilderStore";
import { usePlayerStore } from "./usePlayerStore";
import { useLibraryStore } from "./useLibraryStore";
import { useSettingsStore } from "./useSettingsStore";
import { useHistoryStore } from "./useHistoryStore";

export function useProjectStore<T>(selector: (state: any) => T): T {
    const builder = useBuilderStore();
    const player = usePlayerStore();
    const library = useLibraryStore();
    const settings = useSettingsStore();
    const hist = useHistoryStore();
    const combined = { ...builder, ...player, ...library, ...settings, ...hist };
    return selector(combined);
}
```

**Nota:** Este enfoque de shim permite que todos los componentes existentes sigan funcionando sin cambios mientras se migran gradualmente.

- [ ] **Step 7: Actualizar useAudio.ts para usar stores de dominio directamente**

`useAudio.ts` es el componente más crítico. Actualizarlo para usar `usePlayerStore` y `useSettingsStore` directamente:

```ts
// En useAudio.ts — cambiar todos los imports de useProjectStore
import { usePlayerStore } from "../store/usePlayerStore";
import { useSettingsStore } from "../store/useSettingsStore";

export function useAudio() {
    const pQueue = usePlayerStore(s => s.pQueue);
    const ci = usePlayerStore(s => s.ci);
    const playing = usePlayerStore(s => s.playing);
    const vol = usePlayerStore(s => s.vol);
    const autoNext = useSettingsStore(s => s.autoNext);
    const crossfade = useSettingsStore(s => s.crossfade);
    const setCi = usePlayerStore(s => s.setCi);
    const setPos = usePlayerStore(s => s.setPos);
    const setPlaying = usePlayerStore(s => s.setPlaying);
    const setElapsed = usePlayerStore(s => s.setElapsed);
    // ... resto igual
}
```

- [ ] **Step 8: Build y verificar**

```bash
npm run build
```
Expected: Build limpio. Si hay TypeScript errors por el shim, resolver tipado del combined object.

- [ ] **Step 9: Commit**

```bash
git add src/store/
git commit -m "refactor: split monolithic useProjectStore into domain stores"
```

---

## Chunk 3: UX Improvements

### Task 6: Indicador visual de modo simulación en el Player

**Contexto:** Cuando no hay archivos de audio en `/public/audio/`, el motor corre en modo simulación. El usuario no sabe que el audio es simulado. Se necesita un badge/indicador claro.

**Files:**
- Modify: `src/services/useAudio.ts` — exportar `isReal` como estado reactivo
- Modify: `src/pages/Player.tsx` — mostrar indicador si `isReal === false`

- [ ] **Step 1: Hacer isReal reactivo en useAudio**

El problema actual: `isReal` es un `useRef`, por lo que cambiar su valor no re-renderiza el componente. Convertirlo a estado reactivo:

En `src/services/useAudio.ts`:

```ts
// Añadir al inicio de useAudio():
const [isRealState, setIsRealState] = useState(false);
const isReal = useRef(false);

// En el efecto donde se define onCanPlay:
const onCanPlay = () => {
    isReal.current = true;
    setIsRealState(true);
};

// En el efecto de play/pause, cuando detectamos que audio.play() falla:
audio.play().catch(() => {
    isReal.current = false;
    setIsRealState(false);
});

// Retornar el estado reactivo:
return { isReal: isRealState };
```

- [ ] **Step 2: Añadir SimulationBadge al Player**

En `src/pages/Player.tsx`, importar `useAudio` en el componente Player y mostrar el badge cuando `isReal === false`:

```tsx
// En Player.tsx, al inicio del componente:
const { isReal } = useAudio();

// JSX — añadir este badge cerca de la waveform o del título:
{!isReal && (
    <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: THEME.radius.full,
        backgroundColor: `${THEME.colors.status.warning}15`,
        border: `1px solid ${THEME.colors.status.warning}40`,
        color: THEME.colors.status.warning,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
    }}>
        <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" fill={THEME.colors.status.warning} opacity="0.6" />
        </svg>
        SIMULACIÓN — sin archivos de audio
    </div>
)}
```

**Nota:** El badge solo aparece si el archivo no cargó. Si el usuario importa sus propios MP3s, el badge desaparece.

- [ ] **Step 3: Build y verificar**

```bash
npm run build
```
Expected: Badge visible en el player cuando no hay archivos en `/public/audio/`. Invisible cuando se importan MP3s reales.

- [ ] **Step 4: Commit**

```bash
git add src/services/useAudio.ts src/pages/Player.tsx
git commit -m "feat: add simulation mode indicator in player"
```

---

### Task 7: Formulario de metadata al importar tracks

**Contexto:** Al importar un MP3, se asignan valores por defecto (bpm:120, key:C, energy:0.6, mood:calm). El set builder usa estos valores para ordenar y filtrar. Si están mal, el set generado no refleja la realidad del músico.

**Files:**
- Modify: `src/components/common/ImportZone.tsx` — añadir mini-formulario de metadata post-import

- [ ] **Step 1: Añadir estado de edición post-import en ImportZone**

Después de que se procesan los archivos, en lugar de mostrar solo "N pistas importadas", mostrar un formulario de metadata para cada track importado:

```tsx
// Nuevo estado en ImportZone:
const [pendingEdit, setPendingEdit] = useState<Track | null>(null);
const [editedTracks, setEditedTracks] = useState<Track[]>([]);
```

- [ ] **Step 2: Implementar el formulario de metadata**

Crear un componente inline `TrackMetaEditor` dentro de `ImportZone.tsx`:

```tsx
interface MetaEditorProps {
    track: Track;
    onSave: (updated: Track) => void;
    onSkip: () => void;
}

const TrackMetaEditor: React.FC<MetaEditorProps> = ({ track, onSave, onSkip }) => {
    const [bpm, setBpm] = useState(track.bpm);
    const [energy, setEnergy] = useState(track.energy);
    const [mood, setMood] = useState(track.mood);
    const [key, setKey] = useState(track.key);

    return (
        <div style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
        }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
                🎵 {track.title}
                <span style={{ fontSize: 11, color: THEME.colors.text.muted, fontWeight: 400, marginLeft: 6 }}>
                    — ajusta la metadata
                </span>
            </div>

            {/* BPM */}
            <div>
                <label style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                    BPM: {bpm}
                </label>
                <input
                    type="range" min={40} max={220} value={bpm}
                    onChange={e => setBpm(Number(e.target.value))}
                    style={{ width: "100%", marginTop: 6 }}
                />
            </div>

            {/* Energía */}
            <div>
                <label style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                    Energía: {Math.round(energy * 100)}%
                </label>
                <input
                    type="range" min={0} max={100} value={Math.round(energy * 100)}
                    onChange={e => setEnergy(Number(e.target.value) / 100)}
                    style={{ width: "100%", marginTop: 6 }}
                />
            </div>

            {/* Mood */}
            <div>
                <label style={{ fontSize: 10, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Mood</label>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    {(["happy", "calm", "melancholic", "energetic"] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => setMood(m)}
                            style={{
                                padding: "4px 10px",
                                borderRadius: THEME.radius.sm,
                                border: `1px solid ${mood === m ? mc(m) : THEME.colors.border}`,
                                backgroundColor: mood === m ? mc(m) + "20" : "transparent",
                                color: mood === m ? mc(m) : THEME.colors.text.muted,
                                fontSize: 11, fontWeight: 600, cursor: "pointer",
                                textTransform: "capitalize",
                            }}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Acciones */}
            <div style={{ display: "flex", gap: 8 }}>
                <button
                    onClick={onSkip}
                    style={{
                        flex: 1, padding: "8px",
                        borderRadius: THEME.radius.md,
                        border: `1px solid ${THEME.colors.border}`,
                        backgroundColor: "transparent",
                        color: THEME.colors.text.muted,
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                >
                    Omitir
                </button>
                <button
                    onClick={() => onSave({ ...track, bpm, energy, mood, key })}
                    style={{
                        flex: 2, padding: "8px",
                        borderRadius: THEME.radius.md,
                        border: "none",
                        background: THEME.gradients.cyan,
                        color: "white",
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}
                >
                    Guardar metadata
                </button>
            </div>
        </div>
    );
};
```

- [ ] **Step 3: Integrar el flujo de edición en processFiles**

Modificar `processFiles` para que, tras importar, abra el editor para el primer track y permita iterar:

```tsx
// Después de importar todos los tracks, activar flujo de edición:
setResults(newTracks.map(t => ({ title: t.title, ok: true })));
setTracksToEdit([...newTracks]);  // nueva lista de tracks pendientes de edición
setProcessing(false);
```

Y mostrar el editor cuando `tracksToEdit.length > 0`.

- [ ] **Step 4: Build y verificar**

```bash
npm run build
```
Expected: Al importar un MP3, aparece el formulario para ajustar BPM/energía/mood. Al guardar, el track en la cola se actualiza con los nuevos valores.

- [ ] **Step 5: Commit**

```bash
git add src/components/common/ImportZone.tsx
git commit -m "feat: add metadata editor on track import (BPM, energy, mood)"
```

---

### Task 8: Drag & drop para reordenar el set generado

**Contexto:** El set generado muestra la lista de tracks con botón de eliminar, pero no se puede reordenar. El músico puede querer ajustar el orden manualmente antes de ir al player.

**Files:**
- Modify: `src/pages/Builder.tsx` — añadir drag & drop al mapa de `genSet`
- Modify: `src/components/common/TrackRow.tsx` — añadir soporte para drag handle

**Estrategia:** Usar la HTML5 Drag and Drop API nativa (sin librerías externas), con drag handle visual en cada TrackRow.

- [ ] **Step 1: Añadir drag state al Builder**

En `src/pages/Builder.tsx`, añadir estado de drag:

```tsx
const [dragIdx, setDragIdx] = useState<number | null>(null);
const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
```

- [ ] **Step 2: Añadir handlers de drag a cada TrackRow en el set generado**

En el `map` del `genSet`, envolver cada `TrackRow` con un contenedor draggable:

```tsx
{s.genSet.map((t, i) => (
    <div
        key={t.id + i}
        draggable
        onDragStart={() => setDragIdx(i)}
        onDragOver={(e) => {
            e.preventDefault();
            setDragOverIdx(i);
        }}
        onDrop={() => {
            if (dragIdx === null || dragIdx === i) return;
            s.setGenSet(prev => {
                const next = [...prev];
                const [moved] = next.splice(dragIdx, 1);
                next.splice(i, 0, moved);
                return next;
            });
            setDragIdx(null);
            setDragOverIdx(null);
        }}
        onDragEnd={() => {
            setDragIdx(null);
            setDragOverIdx(null);
        }}
        style={{
            opacity: dragIdx === i ? 0.4 : 1,
            borderTop: dragOverIdx === i && dragIdx !== i
                ? `2px solid ${THEME.colors.brand.cyan}`
                : "2px solid transparent",
            cursor: "grab",
            transition: "opacity 0.15s, border 0.1s",
        }}
    >
        <TrackRow
            track={t}
            idx={i}
            showN
            onRm={(j) => s.setGenSet((p) => p.filter((_, k) => k !== j))}
        />
    </div>
))}
```

- [ ] **Step 3: Añadir drag handle visual en TrackRow**

En `src/components/common/TrackRow.tsx`, añadir un ícono de "grip" al inicio cuando el track es parte del set (prop `showN` está activo):

```tsx
// Si showN es true, mostrar grip icon:
{showN && (
    <div style={{
        color: THEME.colors.text.muted,
        cursor: "grab",
        padding: "0 4px",
        flexShrink: 0,
    }}>
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="3" cy="3" r="1.5" /><circle cx="7" cy="3" r="1.5" />
            <circle cx="3" cy="7" r="1.5" /><circle cx="7" cy="7" r="1.5" />
            <circle cx="3" cy="11" r="1.5" /><circle cx="7" cy="11" r="1.5" />
        </svg>
    </div>
)}
```

- [ ] **Step 4: Build y verificar**

```bash
npm run build
```
Expected: En la lista del set generado, se puede arrastrar y soltar canciones para reordenarlas. Visual feedback: track arrastrado se vuelve semitransparente, línea azul indica posición de drop.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Builder.tsx src/components/common/TrackRow.tsx
git commit -m "feat: add drag & drop reordering to generated set"
```

---

## Chunk 4: CSS Architecture

### Task 9: Migrar inline styles a CSS custom properties

**Contexto:** Toda la UI usa inline styles en cada componente. Esto hace difícil el theming, los media queries, y las transiciones avanzadas. La migración debe ser incremental.

**Files a CREAR:**
- `src/index.css` (ya existe — extender con custom properties)

**Files a MODIFICAR (en orden de impacto):**
- `src/index.css` — añadir CSS custom properties (variables del theme)
- `src/components/layout/SuniShell.tsx` — migrar globals y animations
- `src/components/layout/Navbar.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/components/common/TrackRow.tsx`
- `src/pages/Builder.tsx`
- `src/pages/Player.tsx`
- `src/pages/History.tsx`

**Estrategia:** En lugar de eliminar todos los inline styles de golpe (arriesgado), adoptar un enfoque híbrido:
1. Definir CSS custom properties desde el THEME existente
2. Migrar clases de layout/estructura primero (flex containers, grids)
3. Mantener inline styles para los colores dinámicos (que cambian en runtime)

- [ ] **Step 1: Añadir CSS custom properties al index.css**

Extender `src/index.css` con:

```css
:root {
    /* Brand Colors */
    --color-bg: #0A0E14;
    --color-surface: rgba(255, 255, 255, 0.02);
    --color-panel: rgba(0, 0, 0, 0.15);
    --color-border: rgba(255, 255, 255, 0.04);
    --color-border-light: rgba(255, 255, 255, 0.08);

    /* Text */
    --text-primary: #F0F4F8;
    --text-secondary: rgba(255, 255, 255, 0.4);
    --text-muted: rgba(255, 255, 255, 0.25);

    /* Brand */
    --brand-cyan: #06B6D4;
    --brand-violet: #8B5CF6;
    --brand-pink: #EC4899;

    /* Status */
    --status-success: #10B981;
    --status-warning: #F59E0B;
    --status-error: #EF4444;

    /* Gradients */
    --gradient-brand: linear-gradient(135deg, #06B6D4, #8B5CF6, #EC4899);
    --gradient-cyan: linear-gradient(135deg, #06B6D4, #0891B2);

    /* Radius */
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 10px;
    --radius-xl: 12px;
    --radius-full: 99px;

    /* Fonts */
    --font-main: 'DM Sans', -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
}

/* Layout utilities */
.flex-col { display: flex; flex-direction: column; }
.flex-row { display: flex; flex-direction: row; }
.flex-1   { flex: 1; min-width: 0; }
.overflow-hidden { overflow: hidden; }
.overflow-y-auto { overflow-y: auto; }

/* Component classes */
.suni-shell {
    height: 100%;
    background-color: var(--color-bg);
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    font-family: var(--font-main);
    position: relative;
    overflow: hidden;
}

.track-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    transition: background 0.15s, border-color 0.15s;
    cursor: pointer;
}

.track-row:hover {
    background: var(--color-surface);
    border-color: var(--color-border);
}

.btn-primary {
    border: none;
    background: var(--gradient-brand);
    color: white;
    border-radius: var(--radius-md);
    padding: 10px 16px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;
}

.btn-primary:hover { opacity: 0.85; }

.btn-ghost {
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--text-secondary);
    border-radius: var(--radius-md);
    padding: 8px 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-ghost:hover {
    border-color: var(--color-border-light);
    color: var(--text-primary);
}

.card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: 20px;
}

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
    0%   { transform: scale(1); opacity: 0.8; }
    50%  { transform: scale(1.6); opacity: 0; }
    100% { transform: scale(1); opacity: 0.8; }
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.15); }

/* Range input */
input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    border: 3px solid var(--brand-cyan);
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.25);
}

/* Box sizing */
*, *::before, *::after { box-sizing: border-box; }
```

- [ ] **Step 2: Migrar SuniShell a usar className**

Reemplazar los inline styles de estructura en `SuniShell.tsx` por los nuevos className y eliminar el bloque `<style>` global de SuniShell (ahora está en index.css):

```tsx
<div className="suni-shell">
    {/* Background Atmosphere - mantener inline porque es dinámico */}
    <div style={{ /* ... glow dinámico, mantener inline */ }} />
    <Navbar />
    <div className="flex-1 flex-col overflow-hidden" style={{ position: "relative", zIndex: 1 }}>
        {/* views */}
    </div>
    <BottomNav />
    <SettingsPanel />
    {/* Eliminar el bloque <style> — ahora está en index.css */}
</div>
```

- [ ] **Step 3: Migrar TrackRow a usar className**

En `src/components/common/TrackRow.tsx`, usar `.track-row` para el contenedor:

```tsx
<div
    className="track-row"
    onClick={/* ... */}
    style={/* solo propiedades dinámicas como color de mood */}
>
```

- [ ] **Step 4: Build y verificar que el visual sea idéntico**

```bash
npm run build
```
Expected: App con el mismo visual que antes. Verificar que no hay diferencias en colores, espaciado, o animaciones.

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/components/layout/SuniShell.tsx src/components/common/TrackRow.tsx
git commit -m "refactor: introduce CSS custom properties and migrate structural styles"
```

---

## Resumen de Commits Esperados

```
fix: remove leading space in track #1 file_path
feat: connect bpmMin/bpmMax settings to set builder algorithm
feat: venue type now biases energy range in set builder algorithm
chore: remove legacy JSX files and duplicates
refactor: split monolithic useProjectStore into domain stores
feat: add simulation mode indicator in player
feat: add metadata editor on track import (BPM, energy, mood)
feat: add drag & drop reordering to generated set
refactor: introduce CSS custom properties and migrate structural styles
```

**Total: 9 commits, ~4-6 horas de implementación**
