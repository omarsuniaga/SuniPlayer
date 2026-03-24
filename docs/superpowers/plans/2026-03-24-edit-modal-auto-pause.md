# Edit Modal Auto-Pause Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pause the main player automatically when `TrackProfileModal` or `TrackTrimmer` opens, and resume only when the user cancels (not saves).

**Architecture:** Each modal reads `usePlayerStore.getState().playing` once on mount (stored in a ref), calls `setPlaying(false)`, then restores on cancel. `getState()` avoids stale closures — consistent with `usePedalBindings` pattern. No changes to callers (Player, Builder, Library).

**Tech Stack:** React 18, Zustand 4, Vitest 4, `@testing-library/react`

---

## Chunk 1: TrackProfileModal

### Task 1: Add auto-pause tests to TrackProfileModal

**Files:**
- Modify: `apps/web/src/components/common/TrackProfileModal.test.tsx`

- [ ] **Step 1: Add `usePlayerStore` mock to the existing test file**

Add after the existing `vi.mock("../../services/pitchEngine", ...)` block:

```typescript
// Mock usePlayerStore for auto-pause tests
const mockSetPlaying = vi.fn();
const mockStore = { playing: false, setPlaying: mockSetPlaying };

vi.mock("../../store/usePlayerStore", () => ({
    usePlayerStore: Object.assign(
        vi.fn((selector: (s: typeof mockStore) => unknown) => selector(mockStore)),
        { getState: () => mockStore }
    ),
}));
```

Also add `mockSetPlaying.mockClear()` and `mockStore.playing = false` inside `beforeEach`.

- [ ] **Step 2: Add three new tests in the existing `describe("TrackProfileModal")` block**

```typescript
it("pauses the main player on mount", () => {
    mockStore.playing = true;
    render(<TrackProfileModal track={sampleTrack} onSave={onSave as unknown as (updates: Partial<Track>) => void} onCancel={onCancel as unknown as () => void} />);
    expect(mockSetPlaying).toHaveBeenCalledWith(false);
});

it("resumes the main player on cancel when it was playing", () => {
    mockStore.playing = true;
    render(<TrackProfileModal track={sampleTrack} onSave={onSave as unknown as (updates: Partial<Track>) => void} onCancel={onCancel as unknown as () => void} />);
    mockSetPlaying.mockClear();
    fireEvent.click(screen.getByText("Cancelar"));
    expect(mockSetPlaying).toHaveBeenCalledWith(true);
});

it("does not resume the main player on save", () => {
    mockStore.playing = true;
    render(<TrackProfileModal track={sampleTrack} onSave={onSave as unknown as (updates: Partial<Track>) => void} onCancel={onCancel as unknown as () => void} />);
    mockSetPlaying.mockClear();
    fireEvent.click(screen.getByText("Guardar Perfil"));
    expect(mockSetPlaying).not.toHaveBeenCalledWith(true);
});
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd apps/web && npx vitest run src/components/common/TrackProfileModal.test.tsx --reporter=verbose
```

Expected: 3 new tests FAIL, existing 6 tests PASS.

### Task 2: Implement auto-pause in TrackProfileModal

**Files:**
- Modify: `apps/web/src/components/common/TrackProfileModal.tsx`

- [ ] **Step 4: Add imports and ref**

The current file only imports `useState` from React. Add `useRef` and `useEffect`, and add the store import:

```typescript
import React, { useState, useRef, useEffect } from "react";
// ... existing imports ...
import { usePlayerStore } from "../../store/usePlayerStore.ts";
```

Inside the component, after the existing `const [isLoadingPreview, setIsLoadingPreview] = useState(false)` line, add:

```typescript
const setPlaying = usePlayerStore(s => s.setPlaying);
const wasPlayingRef = useRef(false);
```

- [ ] **Step 5: Add mount effect**

After the `wasPlayingRef` declaration, add:

```typescript
useEffect(() => {
    wasPlayingRef.current = usePlayerStore.getState().playing;
    setPlaying(false);
}, []);
```

- [ ] **Step 6: Update `handleCancel` to resume on cancel**

Find the existing `handleCancel` function:
```typescript
const handleCancel = () => {
    getPitchEngine().stop();
    setIsPreviewPlaying(false);
    onCancel();
};
```

Replace with:
```typescript
const handleCancel = () => {
    getPitchEngine().stop();
    setIsPreviewPlaying(false);
    if (wasPlayingRef.current) setPlaying(true);
    onCancel();
};
```

- [ ] **Step 7: Run tests to confirm they pass**

```bash
cd apps/web && npx vitest run src/components/common/TrackProfileModal.test.tsx --reporter=verbose
```

Expected: all 9 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/common/TrackProfileModal.tsx apps/web/src/components/common/TrackProfileModal.test.tsx
git commit -m "feat(modal): auto-pause main player when TrackProfileModal opens"
```

---

## Chunk 2: TrackTrimmer

### Task 3: Create TrackTrimmer tests

**Files:**
- Create: `apps/web/src/components/common/TrackTrimmer.test.tsx`

- [ ] **Step 9: Create the test file**

```typescript
// src/components/common/TrackTrimmer.test.tsx
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TrackTrimmer } from "./TrackTrimmer";
import { TRACKS } from "../../data/constants";

// Mock Web Audio (waveformService loads audio)
vi.mock("../../services/waveformService", () => ({
    getWaveformData: vi.fn().mockResolvedValue([]),
}));

// Mock HTMLAudioElement
class MockAudio {
    volume = 1.0;
    playbackRate = 1.0;
    currentTime = 0;
    paused = true;
    play = vi.fn().mockResolvedValue(undefined);
    pause = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
}
vi.stubGlobal("Audio", MockAudio);

// Mock usePlayerStore
const mockSetPlaying = vi.fn();
const mockStore = { playing: false, setPlaying: mockSetPlaying };

vi.mock("../../store/usePlayerStore", () => ({
    usePlayerStore: Object.assign(
        vi.fn((selector: (s: typeof mockStore) => unknown) => selector(mockStore)),
        { getState: () => mockStore }
    ),
}));

const sampleTrack = { ...TRACKS[0] };

describe("TrackTrimmer", () => {
    let onSave: ReturnType<typeof vi.fn>;
    let onCancel: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        onSave = vi.fn();
        onCancel = vi.fn();
        mockSetPlaying.mockClear();
        mockStore.playing = false;
    });

    afterEach(() => {
        cleanup();
    });

    it("pauses the main player on mount", () => {
        mockStore.playing = true;
        render(<TrackTrimmer track={sampleTrack} onSave={onSave} onCancel={onCancel} />);
        expect(mockSetPlaying).toHaveBeenCalledWith(false);
    });

    it("resumes the main player on cancel when it was playing", () => {
        mockStore.playing = true;
        render(<TrackTrimmer track={sampleTrack} onSave={onSave} onCancel={onCancel} />);
        mockSetPlaying.mockClear();
        fireEvent.click(screen.getByText("Descartar"));
        expect(mockSetPlaying).toHaveBeenCalledWith(true);
    });

    it("does not resume the main player on save", () => {
        mockStore.playing = true;
        render(<TrackTrimmer track={sampleTrack} onSave={onSave} onCancel={onCancel} />);
        mockSetPlaying.mockClear();
        fireEvent.click(screen.getByText("Aplicar Cambios"));
        expect(mockSetPlaying).not.toHaveBeenCalledWith(true);
    });

    it("double-cancel: Trimmer cancel does not resume when ProfileModal is also open", () => {
        // Simulate: player was playing, ProfileModal paused it, then Trimmer opened inside it
        // At Trimmer mount, player is already paused → wasPlayingRef = false
        mockStore.playing = false; // player already paused by ProfileModal
        render(<TrackTrimmer track={sampleTrack} onSave={onSave} onCancel={onCancel} />);
        mockSetPlaying.mockClear();
        fireEvent.click(screen.getByText("Descartar"));
        // Trimmer should NOT resume because it saw playing=false at mount
        expect(mockSetPlaying).not.toHaveBeenCalledWith(true);
    });
});
```

- [ ] **Step 10: Run to confirm tests fail**

```bash
cd apps/web && npx vitest run src/components/common/TrackTrimmer.test.tsx --reporter=verbose
```

Expected: all 3 tests FAIL.

### Task 4: Implement auto-pause in TrackTrimmer

**Files:**
- Modify: `apps/web/src/components/common/TrackTrimmer.tsx`

- [ ] **Step 11: Add imports, ref, and store selector**

The file already imports `useState, useEffect, useRef` from React. Add:

```typescript
import { usePlayerStore } from "../../store/usePlayerStore.ts";
```

Inside the component, after `const previewAudioRef = useRef<HTMLAudioElement | null>(null)`, add:

```typescript
const setPlaying = usePlayerStore(s => s.setPlaying);
const wasPlayingRef = useRef(false);
```

- [ ] **Step 12: Extend the existing `useEffect` to capture and pause on mount**

The existing `useEffect` starts at line 24. Replace its first two lines:

```typescript
useEffect(() => {
    const url = track.blob_url ?? `/audio/${encodeURIComponent(track.file_path)}`;
```

With:

```typescript
useEffect(() => {
    wasPlayingRef.current = usePlayerStore.getState().playing;
    setPlaying(false);

    const url = track.blob_url ?? `/audio/${encodeURIComponent(track.file_path)}`;
```

The cleanup function already calls `audio.pause()` — no change needed there.

- [ ] **Step 13: Add `handleCancel` wrapper**

The current JSX calls `onCancel` directly in button `onClick`. Add a wrapper before the `return` statement:

```typescript
const handleCancel = () => {
    if (wasPlayingRef.current) setPlaying(true);
    onCancel();
};
```

Then replace all occurrences of `onClick={onCancel}` in the JSX with `onClick={handleCancel}`. There are two cancel buttons (the X in the header and the "Descartar" footer button).

- [ ] **Step 14: Run tests to confirm they pass**

```bash
cd apps/web && npx vitest run src/components/common/TrackTrimmer.test.tsx --reporter=verbose
```

Expected: all 3 tests PASS.

- [ ] **Step 15: Run full test suite to confirm no regressions**

```bash
cd apps/web && npm test -- --reporter=verbose 2>&1 | tail -20
```

Expected: all tests pass (previously 113+).

- [ ] **Step 16: Commit**

```bash
git add apps/web/src/components/common/TrackTrimmer.tsx apps/web/src/components/common/TrackTrimmer.test.tsx
git commit -m "feat(modal): auto-pause main player when TrackTrimmer opens"
```
