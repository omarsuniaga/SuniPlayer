# Player.tsx Partition — Design Spec
**Date:** 2026-03-10
**Status:** Approved

## Problem

`src/pages/Player.tsx` is 1034 lines. It contains 8 distinct visual sections, a large volume of JSX, all derived values, all handlers, and local state — mixed together in one file. This makes the file hard to navigate, difficult to modify safely, and impossible to reason about in isolation.

## Goal

Split `Player.tsx` into 8 focused sub-components with zero behavior change. Each component has one visual responsibility and a clear, typed interface.

## Approach: Pure JSX Extraction (Option B)

All logic — store selectors, local state, refs, derived values, handlers — stays in `Player.tsx`. Eight visual sections are extracted into presentational components that receive everything they need as props. No logic moves out. TypeScript compilation catches any broken prop threading.

This is the safest possible refactor: the parent remains the single source of truth, and the visual output is guaranteed to be identical.

## Architecture

### New directory

```
src/features/player/
└── ui/
    ├── LiveUnlockModal.tsx
    ├── PlayerEmptyState.tsx
    ├── PlayerBanners.tsx
    ├── PlayerTrackHeader.tsx
    ├── PlayerWaveform.tsx
    ├── PlayerControls.tsx
    ├── PlayerSetFooter.tsx
    └── PlayerQueueSidebar.tsx
```

Follows the established `src/features/set-builder/ui/` pattern.

### Components

Each component imports shared utilities (`THEME`, `fmt`, `fmtM`, `mc`, `Wave`, `Track`) directly — no utility props needed.

#### `LiveUnlockModal`
Confirmation dialog shown when transitioning from Live → Edit mode.
```ts
{ onConfirm: () => void; onCancel: () => void }
```
Source: lines 12–119 of current `Player.tsx`.

#### `PlayerEmptyState`
Full-screen empty state when `pQueue` is empty. Shows quick-generate and go-to-builder buttons.
```ts
{ onQuickLoad: () => void; onGoToBuilder: () => void }
```
Source: lines 353–413.

#### `PlayerBanners`
Two status banners rendered conditionally at the top of the main column: Live Lock banner and Simulation Mode indicator.
```ts
{ isLive: boolean; isSimulating: boolean; playing: boolean }
```
Source: lines 428–481.

#### `PlayerTrackHeader`
Track title, artist, BPM/Key/Mood badges, and the session timer circle (SVG).
```ts
{ ct: Track | undefined; rem: number; tCol: string; tPct: number }
```
Source: lines 483–527.

#### `PlayerWaveform`
Waveform visualization, seek click handler, playhead position indicator, and time stamps (elapsed / remaining).
```ts
{
  waveData: number[];
  prog: number;
  mCol: string;
  isLive: boolean;
  pos: number;
  durationMs: number;
  onSeek: (e: React.MouseEvent) => void;
}
```
Source: lines 530–577.

#### `PlayerControls`
Prev / Play / Pause / Next transport buttons and volume slider.
```ts
{
  playing: boolean;
  isLive: boolean;
  ci: number;
  queueLen: number;
  vol: number;
  mCol: string;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onVolumeChange: (v: number) => void;
}
```
Source: lines 579–654.

#### `PlayerSetFooter`
Set progress bar, Export button (Edit mode only), and Live/Edit mode toggle button.
```ts
{
  pQueue: Track[];
  ci: number;
  pos: number;
  qTot: number;
  isLive: boolean;
  mCol: string;
  onExport: () => void;
  onModeToggle: () => void;
}
```
Source: lines 656–739.

#### `PlayerQueueSidebar`
The full right-column sidebar: active queue (with drag-to-reorder in Edit mode, stack-to-prioritize in Live mode, and per-track notes), pool of unscheduled tracks, and "coming up next" card. All state and handlers are passed in from `Player.tsx`.
```ts
{
  pQueue: Track[];
  ci: number;
  isLive: boolean;
  mCol: string;
  masterPool: Track[];
  stackOrder: string[];
  dropTarget: number | null;
  editingNotes: string | null;
  dragIdx: React.MutableRefObject<number | null>;
  onDragStart: (i: number) => void;
  onDragOver: (e: React.DragEvent, i: number) => void;
  onDrop: (e: React.DragEvent, i: number) => void;
  onDragEnd: () => void;
  onQueueClick: (track: Track, idx: number) => void;
  onTogglePool: (track: Track) => void;
  onSetNotes: (id: string, notes: string) => void;
  onEditNotes: (id: string | null) => void;
}
```
Source: lines 742–1030.

### `Player.tsx` after extraction (~210 lines)

```
Player.tsx
├── Imports — stores, utils, all 8 sub-components
├── Store selectors — pQueue, ci, pos, playing, elapsed, tTarget,
│                     vol, mode, setters, isSimulating
├── Local state — showUnlockModal, editingNotes, stackOrder, dropTarget
├── Refs — dragIdx
├── Derived values — isLive, ct, prog, qTot, mCol, waves, masterPool,
│                    poolTracks, rem, tPct, tCol
├── Handlers — exportSet, toggleTrackInQueue, drag handlers,
│              handleQueueClick, handleModeToggle, confirmUnlock,
│              seek, keyboard navigation effect
├── Early return — <PlayerEmptyState onQuickLoad=... onGoToBuilder=... />
└── Main return (~60 lines JSX layout)
    ├── <LiveUnlockModal /> (conditional)
    ├── <main>
    │   ├── <PlayerBanners />
    │   ├── <PlayerTrackHeader />
    │   ├── <PlayerWaveform />
    │   ├── <PlayerControls />
    │   └── <PlayerSetFooter />
    └── <aside>
        └── <PlayerQueueSidebar />
```

## Data Flow

```
Player.tsx (source of truth)
  ├── reads store state
  ├── computes derived values
  ├── defines all handlers
  └── passes props down to:
       ├── PlayerBanners         (read-only)
       ├── PlayerTrackHeader     (read-only)
       ├── PlayerWaveform        (1 callback: onSeek)
       ├── PlayerControls        (4 callbacks: play/pause/prev/next/volume)
       ├── PlayerSetFooter       (2 callbacks: export/modeToggle)
       └── PlayerQueueSidebar    (8 callbacks: drag + queue + notes)
```

## Error Handling

No new error surface — all error handling is inherited from the existing handlers in `Player.tsx`. TypeScript prop types catch broken interfaces at compile time.

## Testing

Existing `src/pages/Player.test.tsx` (2 tests) tests the exported `Player` component end-to-end — these continue to pass unchanged because the external contract does not change. The 8 sub-components are purely presentational with no internal logic, so no new unit tests are needed. The refactor is covered by TypeScript compilation + existing integration tests.

## Files Changed

| File | Change |
|------|--------|
| `src/features/player/ui/LiveUnlockModal.tsx` | **CREATE** |
| `src/features/player/ui/PlayerEmptyState.tsx` | **CREATE** |
| `src/features/player/ui/PlayerBanners.tsx` | **CREATE** |
| `src/features/player/ui/PlayerTrackHeader.tsx` | **CREATE** |
| `src/features/player/ui/PlayerWaveform.tsx` | **CREATE** |
| `src/features/player/ui/PlayerControls.tsx` | **CREATE** |
| `src/features/player/ui/PlayerSetFooter.tsx` | **CREATE** |
| `src/features/player/ui/PlayerQueueSidebar.tsx` | **CREATE** |
| `src/pages/Player.tsx` | **EDIT** — remove extracted JSX, import + compose sub-components |

Total: 8 new files + 1 edit. No files deleted.

## Out of Scope

- Logic extraction or custom hooks (future P-item)
- Any new features or behavior changes
- Styling or visual changes
- Changes to any other page or component
