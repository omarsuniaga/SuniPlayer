# 08 — Business Logic: What Travels for Free

## These modules are 100% portable to React Native

Copy these TypeScript files into a React Native project unchanged.
They have zero browser API dependencies.

### usePlayerStore

```typescript
// Manages: queue (pQueue), current index (ci), playing state,
//          position (pos), elapsed time, volume, simulation mode
// Location: src/store/usePlayerStore.ts
// RN: works identically — Zustand is platform-agnostic
```

State shape (relevant subset):
```typescript
{
    pQueue: Track[];       // ordered queue
    ci: number;            // current index
    playing: boolean;
    pos: number;           // current position in ms
    elapsed: number;       // total elapsed ms in session
    vol: number;           // 0.0 to 1.0
    isSimulating: boolean; // true when audio files not found
    tTarget: number;       // total set duration in seconds
}
```

### useBuilderStore

```typescript
// Manages: set building inputs and generated set
// Location: src/store/useBuilderStore.ts
// Key actions: setTargetMin(), setVenue(), setCurve(), setBpmRange(), setGenSet()
```

### setBuilderService

```typescript
// Pure function: buildSet(tracks, targetSeconds, options) → Track[]
// Algorithm: picks tracks to fill targetSeconds within tolerance
// Respects: energy curve, BPM range, no repeats
// Location: src/services/setBuilderService.ts
// RN: copy file unchanged — no DOM, no fetch, no audio APIs
```

```typescript
// Usage:
const set = buildSet(
    allTracks,
    45 * 60,          // target: 45 minutes in seconds
    {
        tol: 90,      // tolerance: ±90 seconds
        curve: 'ascending',
        bpmMin: 90,
        bpmMax: 140,
    }
);
```

### useHistoryStore

```typescript
// Manages: array of past sets (SetHistoryItem[])
// Location: src/store/useHistoryStore.ts
// Persistence: web uses localStorage → RN: AsyncStorage (1-line change)
```

### useProjectStore (cross-domain actions)

```typescript
// Location: src/store/useProjectStore.ts
// Key actions:
toPlayer()                  // moves generated set to player queue
saveSet()                   // saves current set to history
appendToQueue(tracks)       // adds tracks after current song
updateTrackMetadata(id, patch)  // updates track across all stores
```

## What to change for React Native

| Web | React Native | Files |
|---|---|---|
| `localStorage` | `AsyncStorage` from `@react-native-async-storage/async-storage` | `useHistoryStore.ts`, `useLibraryStore.ts` |
| `IDBStorage` | `SQLiteStorage` from `@op-engineering/op-sqlite` | `src/platform/index.ts` |
| `BlobFileAccess` | `RNFileAccess` using `react-native-fs` | `src/platform/index.ts` |
| `BrowserAudioEngine` | `RNAudioEngine` using `react-native-track-player` | `src/platform/index.ts` |
| React 18 components | React Native components | All `.tsx` UI files |

**Total changes to business logic: 3 import lines in `src/platform/index.ts`.**
