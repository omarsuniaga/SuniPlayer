# Multi-Set Shows Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow musicians to build multiple sets for the same event (Show) with automatic deduplication of songs across sets, and reorder navigation tabs to Player → History → Builder → Library.

**Architecture:** Introduce `Show` and `SetEntry` types. `useBuilderStore` gains Show context (persisted). `useHistoryStore` migrates from flat `SetHistoryItem[]` to `Show[]` via `onRehydrateStorage`. Builder UI gets a Show header, pool exclusion count, and "+ Add Set" button. History UI groups entries by Show. Player gets a `Set N / M` indicator for multi-set Shows.

**Tech Stack:** React 18, Zustand 4 (persist + partialize), Vitest 4, TypeScript 5

---

## Chunk 1: Types + Tab Reorder

### Task 1: Add Show / SetEntry types

**Files:**
- Modify: `apps/web/src/types.ts`

- [ ] **Step 1: Append new types after `SetHistoryItem`**

Add after the existing `SetHistoryItem` interface (line 58):

```typescript
export interface SetEntry {
    id: string;
    label: string;           // "Set 1", "Set 2", etc.
    tracks: Track[];
    durationMs: number;
    builtAt: string;         // ISO date string
}

export interface Show {
    id: string;
    name: string;            // editable, auto-generated e.g. "Show 24 Mar"
    createdAt: string;       // ISO date string
    sets: SetEntry[];
}
```

`SetHistoryItem` remains — it is used for legacy migration (do NOT remove it).

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/types.ts
git commit -m "feat(types): add Show and SetEntry types for multi-set shows"
```

### Task 2: Reorder navigation tabs

**Files:**
- Modify: `apps/web/src/components/layout/BottomNav.tsx`

- [ ] **Step 4: Reorder the `TABS` array**

In `BottomNav.tsx`, the `TABS` array (lines 11–51) currently has: Player, Builder, History, Library.

Reorder to: **Player, History, Builder, Library** — move the `history` entry to index 1:

```typescript
const TABS: TabItem[] = [
    {
        id: "player",
        label: "Player",
        icon: (active) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? THEME.colors.brand.cyan : "currentColor"}>
                <path d="M8 5v14l11-7z" />
            </svg>
        ),
    },
    {
        id: "history",
        label: "History",
        icon: (active) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? THEME.colors.brand.cyan : "currentColor"} strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        ),
    },
    {
        id: "builder",
        label: "Builder",
        icon: (active) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? THEME.colors.brand.cyan : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
        ),
    },
    {
        id: "library",
        label: "Library",
        icon: (active) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? THEME.colors.brand.cyan : "currentColor"} strokeWidth="2" strokeLinecap="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
            </svg>
        ),
    },
];
```

- [ ] **Step 5: Run full test suite to confirm no regressions**

```bash
cd apps/web && npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/layout/BottomNav.tsx
git commit -m "feat(nav): reorder tabs to Player → History → Builder → Library"
```

---

## Chunk 2: useBuilderStore — Show Context

### Task 3: Write failing store tests

**Files:**
- Modify: `apps/web/src/store/useBuilderStore.test.ts` (create if not present)

- [ ] **Step 7: Write tests for Show context actions**

Create/append `apps/web/src/store/useBuilderStore.test.ts`:

```typescript
// apps/web/src/store/useBuilderStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useBuilderStore } from "./useBuilderStore";
import { TRACKS } from "../data/constants";

beforeEach(() => {
    localStorage.clear();
    useBuilderStore.setState(useBuilderStore.getInitialState(), true);
});

describe("useBuilderStore — Show context", () => {
    it("starts with no active Show", () => {
        expect(useBuilderStore.getState().currentShow).toBeNull();
        expect(useBuilderStore.getState().currentSetIndex).toBe(0);
    });

    it("startNewShow creates a Show with auto-name and empty sets", () => {
        useBuilderStore.getState().startNewShow();
        const { currentShow, currentSetIndex } = useBuilderStore.getState();
        expect(currentShow).not.toBeNull();
        expect(currentShow!.sets).toHaveLength(0);
        expect(currentShow!.name).toMatch(/Show/);
        expect(currentSetIndex).toBe(0);
    });

    it("saveCurrentSet stores tracks into the current set entry", () => {
        useBuilderStore.getState().startNewShow();
        const tracks = TRACKS.slice(0, 3);
        useBuilderStore.getState().saveCurrentSet(tracks);
        const { currentShow } = useBuilderStore.getState();
        expect(currentShow!.sets).toHaveLength(1);
        expect(currentShow!.sets[0].label).toBe("Set 1");
        expect(currentShow!.sets[0].tracks).toEqual(tracks);
    });

    it("addSetToShow increments currentSetIndex", () => {
        useBuilderStore.getState().startNewShow();
        useBuilderStore.getState().saveCurrentSet(TRACKS.slice(0, 3));
        useBuilderStore.getState().addSetToShow();
        expect(useBuilderStore.getState().currentSetIndex).toBe(1);
    });

    it("getAvailablePool excludes tracks used in previous sets", () => {
        useBuilderStore.getState().startNewShow();
        const set1Tracks = TRACKS.slice(0, 5);
        useBuilderStore.getState().saveCurrentSet(set1Tracks);
        useBuilderStore.getState().addSetToShow();

        const pool = useBuilderStore.getState().getAvailablePool(TRACKS);
        const set1Ids = new Set(set1Tracks.map(t => t.id));
        expect(pool.every(t => !set1Ids.has(t.id))).toBe(true);
    });

    it("getAvailablePool returns full catalog when no Show is active", () => {
        const pool = useBuilderStore.getState().getAvailablePool(TRACKS);
        expect(pool).toHaveLength(TRACKS.length);
    });

    it("currentShow and currentSetIndex persist across rehydration", () => {
        useBuilderStore.getState().startNewShow();
        useBuilderStore.getState().saveCurrentSet(TRACKS.slice(0, 2));
        const showId = useBuilderStore.getState().currentShow!.id;

        // Simulate rehydration by reading from localStorage
        const raw = JSON.parse(localStorage.getItem("suniplayer-builder") || "{}");
        expect(raw.state.currentShow?.id).toBe(showId);
    });
});
```

- [ ] **Step 8: Run to confirm tests fail**

```bash
cd apps/web && npx vitest run src/store/useBuilderStore.test.ts --reporter=verbose
```

Expected: all 7 tests FAIL (actions don't exist yet).

### Task 4: Implement Show context in useBuilderStore

**Files:**
- Modify: `apps/web/src/store/useBuilderStore.ts`

- [ ] **Step 9: Add imports and update the interface**

Add `Show, SetEntry` to the import from `../types.ts`. Then extend `BuilderState`:

```typescript
import { Track, Show, SetEntry } from "../types.ts";

// Add to BuilderState interface:
currentShow: Show | null;
setCurrentShow: (show: Show | null) => void;

currentSetIndex: number;
setCurrentSetIndex: (index: number) => void;

startNewShow: () => void;
addSetToShow: () => void;
saveCurrentSet: (tracks: Track[]) => void;
getAvailablePool: (catalog: Track[]) => Track[];
```

- [ ] **Step 10: Implement the new actions in the store**

Add after `setFMood`:

```typescript
currentShow: null,
setCurrentShow: (currentShow) => set({ currentShow }),

currentSetIndex: 0,
setCurrentSetIndex: (currentSetIndex) => set({ currentSetIndex }),

startNewShow: () => {
    const now = new Date();
    const name = `Show ${now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`;
    set({
        currentShow: {
            id: crypto.randomUUID(),
            name,
            createdAt: now.toISOString(),
            sets: [],
        },
        currentSetIndex: 0,
    });
},

addSetToShow: () =>
    set((state) => ({ currentSetIndex: state.currentSetIndex + 1 })),

saveCurrentSet: (tracks: Track[]) =>
    set((state) => {
        if (!state.currentShow) return {};
        const label = `Set ${state.currentSetIndex + 1}`;
        const entry: SetEntry = {
            id: crypto.randomUUID(),
            label,
            tracks,
            durationMs: tracks.reduce((sum, t) => sum + (t.endTime ?? t.duration_ms) - (t.startTime ?? 0), 0),
            builtAt: new Date().toISOString(),
        };
        const sets = [...state.currentShow.sets];
        sets[state.currentSetIndex] = entry;
        return { currentShow: { ...state.currentShow, sets } };
    }),

getAvailablePool: (catalog: Track[]) => {
    const { currentShow, currentSetIndex } = useBuilderStore.getState();
    if (!currentShow) return catalog;
    const usedIds = new Set(
        currentShow.sets
            .filter((_, i) => i !== currentSetIndex)
            .flatMap(s => s.tracks.map(t => t.id))
    );
    return catalog.filter(t => !usedIds.has(t.id));
},
```

- [ ] **Step 11: Add `currentShow` and `currentSetIndex` to `partialize`**

```typescript
partialize: (state) => ({
    targetMin: state.targetMin,
    venue: state.venue,
    curve: state.curve,
    genSet: state.genSet,
    currentShow: state.currentShow,
    currentSetIndex: state.currentSetIndex,
}),
```

- [ ] **Step 12: Run tests to confirm they pass**

```bash
cd apps/web && npx vitest run src/store/useBuilderStore.test.ts --reporter=verbose
```

Expected: all 7 tests PASS.

- [ ] **Step 13: Run full suite for regressions**

```bash
cd apps/web && npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 14: Commit**

```bash
git add apps/web/src/store/useBuilderStore.ts apps/web/src/store/useBuilderStore.test.ts
git commit -m "feat(store): add Show context to useBuilderStore with deduplication"
```

---

## Chunk 3: useHistoryStore — Show-Based Storage

### Task 5: Write failing migration tests

**Files:**
- Modify: `apps/web/src/store/useHistoryStore.test.ts` (create if not present)

- [ ] **Step 15: Write migration and storage tests**

**Important:** `onRehydrateStorage` only runs once at store creation. To test the migration logic, export `migrateToShows` as a pure function and test it directly — do NOT rely on `localStorage` side effects in tests.

```typescript
// apps/web/src/store/useHistoryStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useHistoryStore, migrateToShows } from "./useHistoryStore";
import { TRACKS } from "../data/constants";
import type { SetHistoryItem, Show } from "../types";

beforeEach(() => {
    localStorage.clear();
    useHistoryStore.setState(useHistoryStore.getInitialState(), true);
});

describe("useHistoryStore — Show storage", () => {
    it("starts with empty shows array", () => {
        expect(useHistoryStore.getState().shows).toEqual([]);
    });

    it("addShow prepends a Show to the list", () => {
        const show: Show = {
            id: "s1",
            name: "Show Test",
            createdAt: new Date().toISOString(),
            sets: [{
                id: "e1",
                label: "Set 1",
                tracks: TRACKS.slice(0, 3),
                durationMs: 1000,
                builtAt: new Date().toISOString(),
            }],
        };
        useHistoryStore.getState().addShow(show);
        expect(useHistoryStore.getState().shows).toHaveLength(1);
        expect(useHistoryStore.getState().shows[0].id).toBe("s1");
    });
});

describe("migrateToShows — pure function", () => {
    it("wraps each legacy item in a single-set Show", () => {
        const legacyItem: SetHistoryItem = {
            id: "legacy1",
            name: "Old Set",
            tracks: TRACKS.slice(0, 2),
            total: 120000,
            target: 45,
            venue: "lobby",
            curve: "steady",
            date: "2026-01-15T10:00:00.000Z",
        };
        const shows = migrateToShows([legacyItem]);
        expect(shows).toHaveLength(1);
        expect(shows[0].id).toBe("legacy1");
        expect(shows[0].sets).toHaveLength(1);
        expect(shows[0].sets[0].label).toBe("Set 1");
        expect(shows[0].sets[0].tracks).toEqual(legacyItem.tracks);
        expect(shows[0].sets[0].durationMs).toBe(120000);
        expect(shows[0].createdAt).toBe("2026-01-15T10:00:00.000Z");
    });

    it("uses item.date as createdAt and generates a readable name", () => {
        const legacyItem: SetHistoryItem = {
            id: "l2", name: "x", tracks: [], total: 0, target: 45,
            venue: "lobby", curve: "steady", date: "2026-03-15T10:00:00.000Z",
        };
        const shows = migrateToShows([legacyItem]);
        expect(shows[0].createdAt).toBe("2026-03-15T10:00:00.000Z");
        expect(shows[0].name).toMatch(/15|Mar/i);
    });

    it("returns empty array for empty input", () => {
        expect(migrateToShows([])).toEqual([]);
    });
});
```

- [ ] **Step 16: Run to confirm tests fail**

```bash
cd apps/web && npx vitest run src/store/useHistoryStore.test.ts --reporter=verbose
```

Expected: all 3 tests FAIL.

### Task 6: Implement Show-based storage in useHistoryStore

**Files:**
- Modify: `apps/web/src/store/useHistoryStore.ts`

- [ ] **Step 17: Rewrite the store**

Replace the entire content of `useHistoryStore.ts` with:

```typescript
/**
 * useHistoryStore — Saved show history
 * Persisted to localStorage under "suniplayer-history"
 *
 * Migration: legacy SetHistoryItem[] → Show[] on rehydration
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Show, SetHistoryItem } from "../types.ts";

export function migrateToShows(legacy: SetHistoryItem[]): Show[] {
    return legacy.map(item => ({
        id: item.id,
        name: item.name ?? `Show ${new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`,
        createdAt: item.date,
        sets: [{
            id: `${item.id}-s0`,
            label: "Set 1",
            tracks: item.tracks,
            durationMs: item.total,
            builtAt: item.date,
        }],
    }));
}

interface HistoryState {
    shows: Show[];
    addShow: (show: Show) => void;
    clearHistory: () => void;
    /** @deprecated use shows instead */
    history: SetHistoryItem[];
    setHistory: (history: SetHistoryItem[] | ((prev: SetHistoryItem[]) => SetHistoryItem[])) => void;
}

export const useHistoryStore = create<HistoryState>()(
    persist(
        (set) => ({
            shows: [],
            addShow: (show) => set((state) => ({ shows: [show, ...state.shows] })),
            clearHistory: () => set({ shows: [], history: [] }),

            // Legacy fields — kept for backward compat during migration
            history: [],
            setHistory: (update) =>
                set((state) => ({
                    history: typeof update === "function" ? update(state.history) : update,
                })),
        }),
        {
            name: "suniplayer-history",
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                if (!state) return;
                // Migrate legacy SetHistoryItem[] to Show[]
                if (state.history?.length > 0 && state.shows.length === 0) {
                    state.shows = migrateToShows(state.history);
                    state.history = [];
                }
            },
        }
    )
);
```

- [ ] **Step 18: Run tests to confirm they pass**

```bash
cd apps/web && npx vitest run src/store/useHistoryStore.test.ts --reporter=verbose
```

Expected: all 3 tests PASS.

- [ ] **Step 19: Run full suite**

```bash
cd apps/web && npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 20: Commit**

```bash
git add apps/web/src/store/useHistoryStore.ts apps/web/src/store/useHistoryStore.test.ts
git commit -m "feat(store): migrate useHistoryStore to Show-based storage with legacy migration"
```

---

## Chunk 4: Builder UI

### Task 7: Update Builder page with Show context

**Files:**
- Modify: `apps/web/src/pages/Builder.tsx`
- Modify: `apps/web/src/features/set-builder/ui/BuilderGeneratedSetSection.tsx`

The Builder page is large. The key changes are:

1. **Show header bar** — shows current Show name (editable inline) + current set label
2. **"Nuevo Show" button** — clears Show context (with confirmation if sets exist)
3. **Pool indicator** — passes exclusion count to `BuilderGeneratedSetSection`
4. **`saveCurrentSet` call** — called when set generation succeeds
5. **"+ Agregar Set N" button** — appears after a set is saved

- [ ] **Step 21: Write failing Builder UI tests**

Create `apps/web/src/pages/Builder.test.tsx` (or add to existing if it exists):

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBuilderStore } from "../store/useBuilderStore";
import { TRACKS } from "../data/constants";

// Minimal mocks for Builder deps
vi.mock("../store/useLibraryStore", () => ({ useLibraryStore: vi.fn(() => ({ tracks: TRACKS })) }));
vi.mock("../store/usePlayerStore", () => ({ usePlayerStore: vi.fn(() => ({})), useProjectStore: vi.fn(() => ({})) }));
vi.mock("../store/useProjectStore", () => ({ useProjectStore: vi.fn((s: (x: object) => unknown) => s({ pQueue: [], playing: false, view: "builder", setView: vi.fn() })) }));

// Import after mocks
const { Builder } = await import("./Builder");

beforeEach(() => {
    localStorage.clear();
    useBuilderStore.setState(useBuilderStore.getInitialState(), true);
});

describe("Builder — Show context UI", () => {
    it("does not show Show header before first set is generated", () => {
        render(<Builder />);
        expect(screen.queryByText(/Set 1/)).toBeNull();
    });

    it("shows '+ Agregar Set 2' button after first set is saved", () => {
        useBuilderStore.getState().startNewShow();
        useBuilderStore.getState().saveCurrentSet(TRACKS.slice(0, 3));
        render(<Builder />);
        expect(screen.getByText(/Agregar Set 2/i)).toBeTruthy();
    });

    it("shows exclusion count when building Set 2", () => {
        useBuilderStore.getState().startNewShow();
        useBuilderStore.getState().saveCurrentSet(TRACKS.slice(0, 3));
        useBuilderStore.getState().addSetToShow();
        render(<Builder />);
        expect(screen.getByText(/excluidas/i)).toBeTruthy();
    });
});
```

- [ ] **Step 22: Run to confirm tests fail**

```bash
cd apps/web && npx vitest run src/pages/Builder.test.tsx --reporter=verbose
```

Expected: tests FAIL (UI elements not yet implemented).

- [ ] **Step 23: Read the current Builder.tsx to understand its structure**

```bash
# In your editor, read:
# apps/web/src/pages/Builder.tsx
# Focus on: where genSet is set, the "Generar" button handler, and where BuilderGeneratedSetSection is rendered
```

- [ ] **Step 22: Add Show context selectors to Builder.tsx**

At the top of `Builder.tsx`, add to the existing `useBuilderStore` destructure:

```typescript
const currentShow = useBuilderStore(s => s.currentShow);
const currentSetIndex = useBuilderStore(s => s.currentSetIndex);
const startNewShow = useBuilderStore(s => s.startNewShow);
const addSetToShow = useBuilderStore(s => s.addSetToShow);
const saveCurrentSet = useBuilderStore(s => s.saveCurrentSet);
const getAvailablePool = useBuilderStore(s => s.getAvailablePool);
```

- [ ] **Step 23: Wrap the set generation logic with Show lifecycle**

Find the button/handler that calls `setGenSet(...)`. After a successful generation:

```typescript
// After setGenSet(generatedTracks):
if (!currentShow) {
    startNewShow();
}
saveCurrentSet(generatedTracks);
```

- [ ] **Step 24: Add Show header above the builder config**

Insert before the config section:

```typescript
{currentShow && (
    <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.04)",
        border: `1px solid rgba(255,255,255,0.08)`,
        marginBottom: 16,
    }}>
        <span style={{ fontSize: 13, color: THEME.colors.text.muted }}>
            <span style={{ color: "white", fontWeight: 700 }}>{currentShow.name}</span>
            {" — "}
            <span style={{ color: THEME.colors.brand.cyan }}>Set {currentSetIndex + 1}</span>
        </span>
        <button
            onClick={() => {
                if (currentShow.sets.length > 0 && !confirm("¿Empezar un Show nuevo? Se perderá el contexto actual.")) return;
                startNewShow();
            }}
            style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 6,
                border: `1px solid ${THEME.colors.border}`,
                background: "none", color: THEME.colors.text.muted, cursor: "pointer",
            }}
        >
            Nuevo Show
        </button>
    </div>
)}
```

- [ ] **Step 25: Add "+ Agregar Set N" button after the generated set section**

After `<BuilderGeneratedSetSection ...>`, add:

```typescript
{currentShow && currentShow.sets.length > 0 && currentShow.sets[currentSetIndex] && (
    <button
        onClick={() => addSetToShow()}
        style={{
            width: "100%", padding: "14px", marginTop: 12,
            borderRadius: 10, border: `1px dashed ${THEME.colors.brand.violet}60`,
            background: "none", color: THEME.colors.brand.violet,
            fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}
    >
        + Agregar Set {currentSetIndex + 2} al mismo Show
    </button>
)}
```

- [ ] **Step 26: Pass exclusion count to BuilderGeneratedSetSection**

Compute before the return:

```typescript
const availablePool = getAvailablePool(allTracks); // allTracks = full catalog used for generation
const excludedCount = allTracks.length - availablePool.length;
```

Pass `excludedCount` as a prop to `BuilderGeneratedSetSection`. Update that component to show:

```typescript
// In BuilderGeneratedSetSection, if excludedCount > 0:
{excludedCount > 0 && (
    <p style={{ fontSize: 12, color: THEME.colors.text.muted, margin: "4px 0 12px" }}>
        {availablePool.length} canciones disponibles ({excludedCount} excluidas por sets anteriores)
    </p>
)}
```

- [ ] **Step 27: Also save to History when set is complete**

When the user clicks "Guardar en Historial" (or equivalent save action), call `useHistoryStore.getState().addShow(currentShow)` instead of the old `setHistory(...)`.

- [ ] **Step 30: Run Builder tests to confirm new UI tests pass**

```bash
cd apps/web && npx vitest run src/pages/Builder.test.tsx --reporter=verbose
```

Expected: all 3 new tests PASS.

- [ ] **Step 31: Run full test suite**

```bash
cd apps/web && npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 32: Commit**

```bash
git add apps/web/src/pages/Builder.tsx apps/web/src/features/set-builder/ui/BuilderGeneratedSetSection.tsx apps/web/src/pages/Builder.test.tsx
git commit -m "feat(builder): add Show context header, deduplication pool, and multi-set flow"
```

---

## Chunk 5: History UI + Player Indicator

### Task 8: Grouped History view

**Files:**
- Modify: `apps/web/src/pages/History.tsx`

- [ ] **Step 30: Read current History.tsx to understand existing render structure**

Focus on how `history` items are currently rendered (list of `SetHistoryItem`).

- [ ] **Step 31: Update History to read `shows` instead of `history`**

Replace `useHistoryStore(s => s.history)` with `useHistoryStore(s => s.shows)`.

- [ ] **Step 32: Add local expand/collapse state and render Shows grouped**

```typescript
const [expanded, setExpanded] = useState<Set<string>>(new Set());

const toggleExpand = (showId: string) => {
    setExpanded(prev => {
        const next = new Set(prev);
        next.has(showId) ? next.delete(showId) : next.add(showId);
        return next;
    });
};
```

Render each Show as:

```typescript
{shows.map(show => {
    const totalMs = show.sets.reduce((s, e) => s + e.durationMs, 0);
    const isExpanded = expanded.has(show.id);
    const isMulti = show.sets.length > 1;

    return (
        <div key={show.id} style={{ marginBottom: 8 }}>
            {/* Show header row */}
            <div
                onClick={() => isMulti && toggleExpand(show.id)}
                style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px", borderRadius: 10,
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: `1px solid rgba(255,255,255,0.08)`,
                    cursor: isMulti ? "pointer" : "default",
                }}
            >
                <div>
                    <span style={{ fontWeight: 700, color: "white" }}>{show.name}</span>
                    <span style={{ fontSize: 12, color: THEME.colors.text.muted, marginLeft: 10 }}>
                        {show.sets.length} {show.sets.length === 1 ? "set" : "sets"} · {fmt(totalMs)}
                    </span>
                </div>
                {isMulti && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke={THEME.colors.text.dim} strokeWidth="2"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                )}
            </div>

            {/* Set entries — shown if expanded or single-set */}
            {(!isMulti || isExpanded) && show.sets.map(entry => (
                <div key={entry.id} style={{
                    marginTop: 2, marginLeft: 16, padding: "8px 16px",
                    borderRadius: 8, backgroundColor: "rgba(255,255,255,0.02)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                    <span style={{ fontSize: 13, color: THEME.colors.text.secondary }}>{entry.label}</span>
                    <span style={{ fontSize: 12, color: THEME.colors.text.muted, fontFamily: THEME.fonts.mono }}>
                        {fmt(entry.durationMs)} · {entry.tracks.length} pistas
                    </span>
                </div>
            ))}
        </div>
    );
})}
```

- [ ] **Step 33: Run full test suite**

```bash
cd apps/web && npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 34: Commit History changes**

```bash
git add apps/web/src/pages/History.tsx
git commit -m "feat(history): group entries by Show with expand/collapse for multi-set shows"
```

### Task 9: Player set indicator

**Files:**
- Modify: `apps/web/src/features/player/ui/PlayerTrackHeader.tsx`
- Modify: `apps/web/src/pages/Player.tsx`

- [ ] **Step 35: Write failing PlayerTrackHeader tests**

Create `apps/web/src/features/player/ui/PlayerTrackHeader.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PlayerTrackHeader } from "./PlayerTrackHeader";
import { TRACKS } from "../../../data/constants";

const baseProps = { ct: TRACKS[0], rem: 120, tCol: "#00f0ff", tPct: 0.5 };

describe("PlayerTrackHeader — set indicator", () => {
    it("shows set indicator when setIndicator prop is provided", () => {
        render(<PlayerTrackHeader {...baseProps} setIndicator="Set 1 / 2" />);
        expect(screen.getByText("Set 1 / 2")).toBeTruthy();
    });

    it("hides set indicator when setIndicator is undefined", () => {
        render(<PlayerTrackHeader {...baseProps} />);
        expect(screen.queryByText(/Set \d/)).toBeNull();
    });
});
```

Run to confirm they fail:

```bash
cd apps/web && npx vitest run src/features/player/ui/PlayerTrackHeader.test.tsx --reporter=verbose
```

Expected: both tests FAIL (prop not yet supported).

- [ ] **Step 37: Add optional `setIndicator` prop to `PlayerTrackHeader`**

```typescript
interface Props {
    ct: Track | undefined;
    rem: number;
    tCol: string;
    tPct: number;
    setIndicator?: string;  // e.g. "Set 1 / 2" — undefined means no indicator shown
}
```

Inside the component, add after the artist line (`<p style=...>{ct?.artist}</p>`):

```typescript
{setIndicator && (
    <span style={{
        fontSize: 11, padding: "2px 8px", borderRadius: 4, marginTop: 4, display: "inline-block",
        backgroundColor: THEME.colors.brand.violet + "20",
        color: THEME.colors.brand.violet,
        fontWeight: 700,
    }}>
        {setIndicator}
    </span>
)}
```

- [ ] **Step 38: Pass the indicator from Player.tsx**

In `Player.tsx`, compute and pass the indicator:

```typescript
const currentShow = useBuilderStore(s => s.currentShow);
const currentSetIndex = useBuilderStore(s => s.currentSetIndex);

const setIndicator = currentShow && currentShow.sets.length > 1
    ? `Set ${currentSetIndex + 1} / ${currentShow.sets.length}`
    : undefined;

// Pass to PlayerTrackHeader:
<PlayerTrackHeader ... setIndicator={setIndicator} />
```

- [ ] **Step 39: Run PlayerTrackHeader tests to confirm they pass**

```bash
cd apps/web && npx vitest run src/features/player/ui/PlayerTrackHeader.test.tsx --reporter=verbose
```

Expected: both tests PASS.

- [ ] **Step 40: Run full test suite**

```bash
cd apps/web && npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 41: Commit**

```bash
git add apps/web/src/features/player/ui/PlayerTrackHeader.tsx apps/web/src/features/player/ui/PlayerTrackHeader.test.tsx apps/web/src/pages/Player.tsx
git commit -m "feat(player): show Set N / M indicator for multi-set shows"
```

- [ ] **Step 42: Push branch**

```bash
git push origin claude/stupefied-gauss
```
