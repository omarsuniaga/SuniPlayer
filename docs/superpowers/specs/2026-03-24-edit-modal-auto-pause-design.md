# Design: Edit Modal Auto-Pause

**Date:** 2026-03-24
**Status:** Approved

## Problem

When a song is playing and the user opens `TrackProfileModal` (to change pitch/tempo) or `TrackTrimmer` (to trim the track), the preview audio plays on top of the main player audio. Two audio streams overlap, making it impossible to hear the preview clearly.

## Solution

Auto-pause the main player when any edit modal mounts. Resume only on cancel (if the player was playing before). Stay paused on save (changes were applied — the artist decides when to resume).

## Behavior

| Event | Action |
|---|---|
| Modal mounts (`useEffect`) | Read `usePlayerStore.getState().playing` → save in `wasPlayingRef` → call `setPlaying(false)` |
| User cancels | If `wasPlayingRef.current === true` → call `setPlaying(true)` before closing |
| User saves | Do not resume — player stays paused |
| Trimmer opened from inside ProfileModal | Player already paused. Trimmer's own `wasPlayingRef` will be `false` at mount, so Trimmer cancel does NOT resume. ProfileModal's `wasPlayingRef` was captured when the player was still playing, so ProfileModal cancel DOES resume. Double-cancel path (cancel Trimmer, then cancel ProfileModal) correctly resumes — this is intentional. |

## Scope

Web app only (`apps/web`). The native app (`apps/native`) is out of scope for this change.

## Implementation

### `TrackProfileModal`

- Add `import { usePlayerStore } from "../../store/usePlayerStore"`
- Add `const setPlaying = usePlayerStore(s => s.setPlaying)` selector
- Add `const wasPlayingRef = useRef(false)`
- Add:
  ```typescript
  useEffect(() => {
      wasPlayingRef.current = usePlayerStore.getState().playing;
      setPlaying(false);
  }, []);
  ```
- In `handleCancel` (already exists): add `if (wasPlayingRef.current) setPlaying(true)` before `onCancel()`
- In `handleSave` (already exists): no change — `getPitchEngine().stop()` already present, player stays paused

### `TrackTrimmer`

- Add `import { usePlayerStore } from "../../store/usePlayerStore"`
- Add `const setPlaying = usePlayerStore(s => s.setPlaying)` selector
- Add `const wasPlayingRef = useRef(false)`
- Extend existing `useEffect` (the one that creates `previewAudioRef`) to capture `wasPlayingRef` at mount:
  ```typescript
  useEffect(() => {
      wasPlayingRef.current = usePlayerStore.getState().playing;
      setPlaying(false);
      // ... existing audio setup ...
      return () => {
          // ... existing cleanup ...
      };
  }, [track]);
  ```
- Add `handleCancel` wrapper (currently `onCancel` is called directly in JSX):
  ```typescript
  const handleCancel = () => {
      if (wasPlayingRef.current) setPlaying(true);
      onCancel();
  };
  ```
- Replace all direct `onCancel()` calls in JSX with `handleCancel()`
- `onSave` path: call `onSave(start, end)` without resuming

### Why `usePlayerStore.getState()` not a reactive selector

Modals don't need to re-render on `playing` changes. They read once on mount and write at two points. `.getState()` avoids stale closures — consistent with `usePedalBindings` pattern in this codebase.

## Files Changed

1. `apps/web/src/components/common/TrackProfileModal.tsx`
2. `apps/web/src/components/common/TrackTrimmer.tsx`

## Tests

- `apps/web/src/components/common/TrackProfileModal.test.tsx`:
  - `setPlaying(false)` called on mount
  - `setPlaying(true)` called on cancel when player was playing
  - No resume on save
- `apps/web/src/components/common/TrackTrimmer.test.tsx` (new file):
  - Same three cases as above
  - Double-cancel path: Trimmer cancel does not resume; ProfileModal cancel does resume
