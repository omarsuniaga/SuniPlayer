# Design: Multi-Set Shows

**Date:** 2026-03-24
**Status:** Approved

## Problem

Artists who perform two or more sets in the same event (separated by an intermission) need a way to build each set without repeating songs. Currently the Builder generates a single set with no awareness of prior sets in the same event.

## Concept: Show

A **Show** is a named container that groups one or more sets from the same event. Songs cannot repeat across sets within the same Show.

```
Show "Concierto Sala X — 15 Mar"
  ├── Set 1  (45 min · 12 tracks)  ✓ played
  └── Set 2  (44 min · 11 tracks)  ← in builder
```

## Data Model

```typescript
interface Show {
    id: string
    name: string        // auto-generated "Show 15 Mar", editable by user
    createdAt: string
    sets: SetEntry[]
}

interface SetEntry {
    id: string
    label: string       // "Set 1", "Set 2", etc.
    tracks: Track[]
    durationMs: number
    builtAt: string
}
```

**Solo sets** (built without explicit Show context) are treated as Shows with a single set — no breaking migration needed.

## Builder Flow

### Starting a new Show

`startNewShow()` is called automatically the first time the user clicks "Generar Set" with no active Show context. No explicit "Start Show" UI is needed — the Show is created implicitly on first generation. The Builder header shows the auto-generated Show name (editable inline).

### Building Set 1

1. User configures filters → clicks "Generar Set"
2. `startNewShow()` creates a new Show with `id`, `name = "Show <date>"`, `sets = []`
3. Set is generated from the full available pool (no exclusions)
4. `saveCurrentSet(tracks)` is called immediately on successful generation — saves into `currentShow.sets[0]` as Set 1
5. Button **"+ Agregar Set 2 al mismo Show"** appears below the generated set

### Building Set 2+

1. User clicks "+ Agregar Set 2 al mismo Show"
2. `addSetToShow()` increments `currentSetIndex` — Builder header updates to `Show: "15 Mar" — Set 2`
3. Available pool is recalculated: `pool = catalog.filter(t => !usedIds.has(t.id))`
4. Pool size indicator shown: `"38 canciones disponibles (12 excluidas por Set 1)"`
5. User configures filters → clicks "Generar Set"
6. `saveCurrentSet(tracks)` saves into `currentShow.sets[1]` as Set 2
7. Button "+ Agregar Set 3..." appears

### Abandoning Show context

Button **"Nuevo Show"** (or "Limpiar Show") in the Builder header allows the user to discard the current Show context and start fresh. Confirmation required if there are unsaved sets. This calls `startNewShow()` creating a brand new Show.

### Deduplication logic

```typescript
const usedIds = new Set(
    currentShow.sets
        .filter(s => s.id !== currentSetId)
        .flatMap(s => s.tracks.map(t => t.id))
)
const availablePool = catalog.filter(t => !usedIds.has(t.id))
```

### BPM filter + deduplication interaction

The existing graceful fallback (if BPM filter leaves < 3 tracks, use full catalog) operates **on the deduplicated pool**, not the full catalog. The fallback never overrides deduplication — songs used in other sets of the same Show are always excluded, even in fallback mode. If the deduplicated pool has fewer than 3 tracks total, the Builder shows an error: `"No hay suficientes canciones disponibles para este Set"`.

## Store Changes

### `useBuilderStore`

Add:
- `currentShow: Show | null` — the Show being built. **Persisted** via `partialize` — survives app close so the user can resume building Set 2 the next day.
- `currentSetIndex: number` — which set is being built (0-based). **Persisted.**
- `startNewShow()` — creates a new Show, resets `currentSetIndex = 0`
- `addSetToShow()` — increments `currentSetIndex`, user is now building the next set
- `saveCurrentSet(tracks: Track[])` — writes tracks into `currentShow.sets[currentSetIndex]`, calculates `durationMs`

### `useHistoryStore`

Store `Show[]` instead of flat `SetHistoryItem[]`.

**Migration on hydration** (via Zustand `onRehydrateStorage`):

```typescript
// Legacy SetHistoryItem shape assumed: { id, tracks, durationMs, builtAt, name? }
const migrated: Show[] = legacyItems.map(item => ({
    id: item.id,
    name: item.name ?? `Show ${new Date(item.builtAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`,
    createdAt: item.builtAt,
    sets: [{
        id: `${item.id}-s0`,
        label: 'Set 1',
        tracks: item.tracks,
        durationMs: item.durationMs,
        builtAt: item.builtAt,
    }]
}));
```

Migration runs once; after it the store only ever writes `Show[]`.

## Navigation Order

| # | Tab | Description |
|---|-----|-------------|
| 1 | Player | Last used set configuration |
| 2 | History | Past Shows with all their sets |
| 3 | Builder | Set / Show constructor |
| 4 | Library | Device song detector |

## History View

Shows grouped by Show, expandable:

```
▼ Show "15 Mar 2026"       [2 sets · 90 min]
    Set 1  45 min  12 tracks
    Set 2  44 min  11 tracks
▼ Show "08 Mar 2026"       [1 set · 47 min]
    Set 1  47 min  13 tracks
```

## Player

- Loads the last used set (no conceptual change to playback)
- Shows indicator **`Set 1 / 2`** in the track header when the current set belongs to a multi-set Show (hidden for single-set Shows)
- Indicator placement: below the show name / above the track title in `PlayerTrackHeader`
- No automatic concatenation of sets — the artist manually loads Set 2 after intermission

## Files Changed

1. `apps/web/src/types.ts` — add `Show`, `SetEntry` types; keep `SetHistoryItem` as legacy alias
2. `apps/web/src/store/useBuilderStore.ts` — add `currentShow`, `currentSetIndex`, `startNewShow`, `addSetToShow`, `saveCurrentSet`; update `partialize`
3. `apps/web/src/store/useHistoryStore.ts` — migrate storage to `Show[]`; add `onRehydrateStorage` migration
4. `apps/web/src/pages/Builder.tsx` — Show context header, "+ Add Set" button, "Nuevo Show" button, pool exclusion count
5. `apps/web/src/pages/History.tsx` — grouped Show/Set view with expand/collapse
6. `apps/web/src/components/layout/BottomNav.tsx` — reorder: Player → History → Builder → Library
7. `apps/web/src/features/player/ui/PlayerTrackHeader.tsx` — set indicator `Set N / M`
8. `apps/web/src/features/set-builder/ui/BuilderGeneratedSetSection.tsx` — show available pool count with exclusion note

## Tests

- `useBuilderStore.test.ts`: `startNewShow`, `addSetToShow`, `saveCurrentSet`, deduplication pool calculation, BPM-fallback-with-deduplication, persistence of `currentShow`
- `useHistoryStore.test.ts`: `Show[]` storage, legacy `SetHistoryItem` migration correctness
- `Builder.test.tsx`: "+ Add Set" button visibility, "Nuevo Show" confirmation dialog, pool exclusion count display
- `History.test.tsx`: grouped rendering, single-set Show (no expand needed), multi-set Show expand/collapse
- `PlayerTrackHeader.test.tsx`: indicator shown for multi-set, hidden for single-set
