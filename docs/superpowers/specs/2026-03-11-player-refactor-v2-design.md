# Player Refactor v2 — Design Spec
**Date:** 2026-03-11
**Status:** Approved

## Context

The previous partition plan (2026-03-10) created 8 sub-components in `src/features/player/ui/` but they were never integrated into `Player.tsx` because a subsequent commit (`e206094`) rewrote Player.tsx with major new features: SPL Meter, Crossfade Dashboard, Sheet Music Viewer, Track Profile Modal, and responsive mobile sidebar. As a result:

- `Player.tsx` grew to 378 lines with 30+ individual store selectors
- The 8 sub-components in `src/features/player/ui/` became dead code (not imported)
- There is a **duplicate** `LiveUnlockModal` in both `src/components/player/` and `src/features/player/ui/`
- The waveform uses `Math.random()` even though `waveformService.ts` already exists and works
- No empty state guard when `pQueue` is empty
- No touch support for waveform seek

## Goals

1. **Phase 1 — Bugs**: Fix real waveform, empty state, touch seek, duplicate modal
2. **Phase 2 — Architecture**: Update sub-components to match current Player.tsx, integrate them, consolidate selectors
3. **Phase 3 — Tests**: Cover new features and edge cases

## Phase 1 — Bug Fixes

### 1.1 Real Waveform (`waveformService.ts` already implemented)

**Problem:** `Player.tsx` line 88 uses `Array.from({ length: 100 }, () => 0.1 + Math.random() * 0.8)` — random fake data on every track change.

**Fix:** Replace with `getWaveformData(url)` from `src/services/waveformService.ts`. Add `isLoadingWave: boolean` state to show a placeholder skeleton while analysis runs. The service has a built-in cache so analysis only happens once per URL.

```ts
const [currentWave, setCurrentWave] = useState<number[]>([]);
const [isLoadingWave, setIsLoadingWave] = useState(false);

useEffect(() => {
    if (!ct) return;
    const url = ct.blob_url ?? `/audio/${encodeURIComponent(ct.file_path)}`;
    setIsLoadingWave(true);
    getWaveformData(url)
        .then(setCurrentWave)
        .finally(() => setIsLoadingWave(false));
}, [ct?.id]);
```

`PlayerWaveform` receives `isLoading` prop and renders a pulsing placeholder when true.

### 1.2 Empty State Guard

**Problem:** When `pQueue.length === 0`, `ct` is `undefined`. The UI shows `--` for title/artist but no actual empty state UX. `PlayerEmptyState` already exists in `src/features/player/ui/`.

**Fix:** Add guard at top of component return:
```tsx
if (!pQueue.length) return <PlayerEmptyState onQuickLoad={...} onGoToBuilder={...} />;
```

### 1.3 Touch Support for Seek

**Problem:** `seek` handler uses `e.clientX` (mouse only). Tablets and phones cannot seek.

**Fix:** Add `onTouchEnd` handler alongside `onClick` on the waveform container:
```ts
const seekFromX = (clientX: number, target: HTMLElement) => {
    if (isLive || !ct) return;
    const rect = target.getBoundingClientRect();
    setPos(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * ct.duration_ms);
};
const seek = (e: React.MouseEvent<HTMLDivElement>) => seekFromX(e.clientX, e.currentTarget);
const seekTouch = (e: React.TouchEvent<HTMLDivElement>) => seekFromX(e.changedTouches[0].clientX, e.currentTarget);
```

### 1.4 Consolidate Duplicate LiveUnlockModal

**Problem:** Two files with the same component:
- `src/components/player/LiveUnlockModal.tsx` — used by Player.tsx ✅
- `src/features/player/ui/LiveUnlockModal.tsx` — dead code ❌

**Fix:** Delete `src/features/player/ui/LiveUnlockModal.tsx`. Move `src/components/player/LiveUnlockModal.tsx` to `src/features/player/ui/LiveUnlockModal.tsx`. Update Player.tsx import accordingly.

---

## Phase 2 — Architecture

### 2.1 Directory Consolidation

Final layout — single source of truth at `src/features/player/ui/`:

```
src/features/player/
├── ui/
│   ├── LiveUnlockModal.tsx        (moved from src/components/player/)
│   ├── PlayerEmptyState.tsx       (minor update)
│   ├── PlayerBanners.tsx          (minor update)
│   ├── PlayerTrackHeader.tsx      (update: timer formula rem/durMs)
│   ├── PlayerWaveform.tsx         (update: touch, loading, fade props)
│   ├── PlayerControls.tsx         (update: combine transport + volume)
│   ├── PlayerSetFooter.tsx        (update: SET ELAPSED + TOTAL REMAINING layout)
│   ├── PlayerQueueSidebar.tsx     (rewrite: stackOrder, profile button, mobile)
│   └── PlayerSuperpowerButtons.tsx (NEW: CROSS/FADE/METER/PARTITURA/QUEUE)
└── usePlayerState.ts              (NEW: grouped store selector hooks)
```

`src/components/player/` directory is removed after migration (Dashboard also moves).

### 2.2 Sub-component Updates

#### `PlayerBanners` — minor
Add `isLive` banner (currently only has simulation banner). Props:
```ts
{ isLive: boolean; isSimulating: boolean; playing: boolean }
```

#### `PlayerTrackHeader` — update
Timer now uses track remaining time, not set elapsed:
```ts
{ ct: Track | undefined; rem: number; durMs: number; tCol: string; tPct: number; mCol: string }
```

#### `PlayerWaveform` — update
New props: `isLoading`, touch handler, fade visualization props:
```ts
{
    waveData: number[]; isLoading: boolean;
    prog: number; pos: number; durationMs: number;
    mCol: string; isLive: boolean; playing: boolean;
    fadeEnabled: boolean; fadeInMs: number; fadeOutMs: number;
    onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
    onSeekTouch: (e: React.TouchEvent<HTMLDivElement>) => void;
}
```

#### `PlayerControls` — update
Keep transport + volume together (matches current Player layout):
```ts
{
    playing: boolean; isLive: boolean; ci: number; queueLen: number;
    vol: number; mCol: string;
    onPlayPause: () => void; onPrev: () => void; onNext: () => void;
    onVolumeChange: (v: number) => void;
}
```

#### `PlayerSetFooter` — update
New layout: SET ELAPSED (cyan) + TOTAL REMAINING (mCol) + progress bar + mode toggle:
```ts
{
    elapsed: number; qTot: number; pQueue: Track[]; ci: number; pos: number;
    isLive: boolean; mCol: string;
    onModeToggle: () => void;
}
```

#### `PlayerQueueSidebar` — rewrite
Matches current implementation with all new features:
```ts
{
    pQueue: Track[]; ci: number; isLive: boolean; mCol: string;
    stackOrder: string[]; playing: boolean; isMobile: boolean;
    onQueueClick: (track: Track) => void;
    onDrop: (dragIdx: number, targetIdx: number) => void;
    onProfileTrack: (track: Track) => void;
    onClose: () => void;
}
```

#### `PlayerSuperpowerButtons` — NEW
Extracts the 5 toggle buttons from Player.tsx lines 191–199:
```ts
{
    crossfade: boolean; fadeEnabled: boolean; splMeterEnabled: boolean;
    hasSheetMusic: boolean; showQueue: boolean;
    onToggleCross: () => void; onToggleFade: () => void;
    onToggleMeter: () => void; onShowSheet: () => void;
    onToggleQueue: () => void;
}
```

### 2.3 Grouped Store Selector Hooks

**Problem:** 30+ individual `useProjectStore(s => s.XXX)` calls cause unnecessary re-renders and verbose code.

**Solution:** `src/features/player/usePlayerState.ts` — uses `useShallow` from Zustand for batched shallow comparison:

```ts
import { useShallow } from 'zustand/react/shallow';

// Core playback — re-renders only when these values change
export const usePlaybackState = () => useProjectStore(useShallow(s => ({
    pQueue: s.pQueue, ci: s.ci, pos: s.pos, playing: s.playing,
    vol: s.vol, mode: s.mode, elapsed: s.elapsed, stackOrder: s.stackOrder,
    setPos: s.setPos, setCi: s.setCi, setPlaying: s.setPlaying,
    setVol: s.setVol, setMode: s.setMode, setPQueue: s.setPQueue,
    setStackOrder: s.setStackOrder,
})));

// Dashboard controls — only re-renders when fade/crossfade/spl changes
export const useDashboardState = () => useProjectStore(useShallow(s => ({
    fadeEnabled: s.fadeEnabled, setFadeEnabled: s.setFadeEnabled,
    fadeInMs: s.fadeInMs, setFadeInMs: s.setFadeInMs,
    fadeOutMs: s.fadeOutMs, setFadeOutMs: s.setFadeOutMs,
    fadeExpanded: s.fadeExpanded, setFadeExpanded: s.setFadeExpanded,
    crossfade: s.crossfade, setCrossfade: s.setCrossfade,
    crossfadeMs: s.crossfadeMs, setCrossfadeMs: s.setCrossfadeMs,
    crossExpanded: s.crossExpanded, setCrossExpanded: s.setCrossExpanded,
    splMeterEnabled: s.splMeterEnabled, setSplMeterEnabled: s.setSplMeterEnabled,
    splMeterTarget: s.splMeterTarget,
    splMeterExpanded: s.splMeterExpanded, setSplMeterExpanded: s.setSplMeterExpanded,
})));

// Misc flags
export const usePlayerFlags = () => useProjectStore(useShallow(s => ({
    isSimulating: s.isSimulating,
})));
```

### 2.4 Target Player.tsx After Refactor

~90 lines: imports, 3 hook calls, local state, handlers, and JSX composition only.

```tsx
export const Player: React.FC = () => {
    const { pQueue, ci, pos, ... } = usePlaybackState();
    const dashState = useDashboardState();
    const { isSimulating } = usePlayerFlags();
    // 5 local state items, 4 handlers
    // if (!pQueue.length) return <PlayerEmptyState />
    return (
        <>
            {showUnlockModal && <LiveUnlockModal ... />}
            <div ...>
                <main ...>
                    <PlayerBanners ... />
                    <PlayerTrackHeader ... />
                    <PlayerSuperpowerButtons ... />
                    <Dashboard ... />
                    <PlayerWaveform ... />
                    <PlayerControls ... />
                    <PlayerSetFooter ... />
                </main>
                {showQueue && isMobile && <div onClick backdrop />}
                <PlayerQueueSidebar ... />
            </div>
            {trimmingTrack && <TrackTrimmer ... />}
            {profileTrack && <TrackProfileModal ... />}
            {showSheetViewer && <SheetMusicViewer ... />}
        </>
    );
};
```

---

## Phase 3 — Tests

**File:** `src/pages/Player.test.tsx` (expand existing 2 tests to ~10)

| Test | What it verifies |
|------|-----------------|
| Empty state renders | When pQueue=[], PlayerEmptyState is shown |
| Track metadata displays | Title, artist, BPM, key, mood badges visible |
| Waveform loading state | Shows skeleton while getWaveformData resolves |
| Waveform loaded | Shows Wave component after resolution |
| Play/pause toggle | Spacebar and button both toggle playing |
| Mode toggle → Live | Click "ENTER LIVE" sets mode to live |
| Mode toggle → shows modal | Click "EXIT LIVE" shows LiveUnlockModal |
| Queue click in Edit mode | Jumps to track |
| Queue click in Live mode | Adds to stackOrder |
| Dashboard shows when enabled | Toggle CROSS shows Dashboard |

**Test utilities to add:** `renderWithQueue(tracks)` helper that pre-populates store.

---

## File Change Summary

| Action | File |
|--------|------|
| MODIFY | `src/pages/Player.tsx` |
| MODIFY | `src/features/player/ui/PlayerBanners.tsx` |
| MODIFY | `src/features/player/ui/PlayerEmptyState.tsx` |
| MODIFY | `src/features/player/ui/PlayerTrackHeader.tsx` |
| MODIFY | `src/features/player/ui/PlayerWaveform.tsx` |
| MODIFY | `src/features/player/ui/PlayerControls.tsx` |
| MODIFY | `src/features/player/ui/PlayerSetFooter.tsx` |
| REWRITE | `src/features/player/ui/PlayerQueueSidebar.tsx` |
| CREATE | `src/features/player/ui/PlayerSuperpowerButtons.tsx` |
| CREATE | `src/features/player/usePlayerState.ts` |
| MOVE | `src/components/player/LiveUnlockModal.tsx` → `src/features/player/ui/LiveUnlockModal.tsx` |
| MOVE | `src/components/player/Dashboard.tsx` → `src/features/player/ui/Dashboard.tsx` |
| DELETE | `src/features/player/ui/LiveUnlockModal.tsx` (old dead-code version) |
| DELETE | `src/components/player/` (directory removed after migration) |
| MODIFY | `src/pages/Player.test.tsx` |

## Constraints

- Zero behavior changes to existing features
- All 21 existing tests must continue passing
- TypeScript strict mode must pass (`npx tsc --noEmit`)
- No new dependencies
