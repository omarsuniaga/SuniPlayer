# Audio File Detection Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect audio file availability proactively via HEAD probes so `isSimulating` is accurate from app mount — no waiting for `play()` to fail.

**Architecture:** New pure-function module `audioProbe.ts` issues `fetch HEAD` requests against `public/audio/`. `useAudio.ts` gains two effects: a mount-time global probe (representative track) and a per-track probe on each `ci` change. `blob_url` tracks bypass the probe. Existing `.catch → setIsSimulating(true)` safety net is preserved unchanged.

**Tech Stack:** Vitest (test runner), `vi.stubGlobal` (fetch mock), React `useEffect`, Zustand `usePlayerStore`

---

## Chunk 1: audioProbe.ts

### Task 1: Create `audioProbe.ts` with tests (TDD)

**Files:**
- Create: `src/services/audioProbe.ts`
- Create: `src/services/audioProbe.test.ts`

- [ ] **Step 1: Write the failing test file**

Create `src/services/audioProbe.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { probeOne, probeFiles } from "./audioProbe";

describe("audioProbe", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe("probeOne", () => {
        it("returns true when server responds 200 OK", async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                new Response(null, { status: 200 })
            );
            const result = await probeOne("Sinatra - My Way.mp3");
            expect(result).toBe(true);
        });

        it("returns false when server responds 404", async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                new Response(null, { status: 404 })
            );
            const result = await probeOne("missing.mp3");
            expect(result).toBe(false);
        });

        it("returns false on network error", async () => {
            vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));
            const result = await probeOne("any.mp3");
            expect(result).toBe(false);
        });

        it("calls fetch with HEAD method and correct URL", async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                new Response(null, { status: 200 })
            );
            await probeOne("Sinatra - My Way.mp3");
            expect(fetch).toHaveBeenCalledWith(
                "/audio/Sinatra - My Way.mp3",
                { method: "HEAD" }
            );
        });
    });

    describe("probeFiles", () => {
        it("returns Set of available file paths", async () => {
            vi.mocked(fetch)
                .mockResolvedValueOnce(new Response(null, { status: 200 }))  // file1 ok
                .mockResolvedValueOnce(new Response(null, { status: 404 }))  // file2 missing
                .mockResolvedValueOnce(new Response(null, { status: 200 })); // file3 ok

            const result = await probeFiles([
                "track1.mp3",
                "track2.mp3",
                "track3.mp3",
            ]);

            expect(result).toEqual(new Set(["track1.mp3", "track3.mp3"]));
        });

        it("returns empty Set when all files are missing", async () => {
            vi.mocked(fetch).mockResolvedValue(
                new Response(null, { status: 404 })
            );
            const result = await probeFiles(["a.mp3", "b.mp3"]);
            expect(result.size).toBe(0);
        });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd C:/Users/omare/.claude/projects/SuniPlayer
npm test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|audioProbe|Cannot find"
```

Expected: `Cannot find module './audioProbe'` or equivalent import error.

- [ ] **Step 3: Implement `src/services/audioProbe.ts`**

```typescript
/**
 * audioProbe — Utilities for detecting audio file availability.
 *
 * Uses HEAD requests so no audio data is downloaded — only HTTP status codes.
 * Returns false on any error (network failure, CORS, etc.) — safe default = simulation mode.
 */

const AUDIO_BASE = "/audio/";

/**
 * Probe a single audio file path.
 * @returns true if the file exists and is accessible (HTTP 2xx), false otherwise.
 */
export async function probeOne(filePath: string): Promise<boolean> {
    try {
        const res = await fetch(AUDIO_BASE + filePath, { method: "HEAD" });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Probe multiple audio file paths in parallel.
 * @returns Set of file_path strings that are available.
 */
export async function probeFiles(filePaths: string[]): Promise<Set<string>> {
    const results = await Promise.allSettled(filePaths.map(fp => probeOne(fp)));
    const available = new Set<string>();
    results.forEach((result, i) => {
        if (result.status === "fulfilled" && result.value) {
            available.add(filePaths[i]);
        }
    });
    return available;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|audioProbe"
```

Expected output includes:
```
✓ src/services/audioProbe.test.ts (7)
```

All 7 tests should be green.

- [ ] **Step 5: Run full suite to confirm no regressions**

```bash
npm test
```

Expected: all tests pass (was 7/7 before this change, now 14/14 or similar).

- [ ] **Step 6: Commit**

```bash
git add src/services/audioProbe.ts src/services/audioProbe.test.ts
git commit -m "feat: add audioProbe utilities (probeOne, probeFiles)"
```

---

## Chunk 2: useAudio.ts integration

### Task 2: Add proactive detection to `useAudio.ts`

**Files:**
- Modify: `src/services/useAudio.ts`

The file currently has these effects in order:
1. `useEffect([], [])` — creates `Audio` elements
2. `useEffect([ci, ct?.id])` — loads track src, registers `canplay` handler
3. `useEffect([nextTrack])` — preloads next track
4. `useEffect([vol])` — volume sync
5. `useEffect([playing, ci, ct?.id, ...])` — main play/pause engine

We add the probe to effects 1 and 2.

- [ ] **Step 1: Add import for `probeOne` and `TRACKS`**

At the top of `src/services/useAudio.ts`, add:

```typescript
import { probeOne } from "./audioProbe";
import { TRACKS } from "../data/constants";
```

These go after the existing imports (after `useSettingsStore`).

- [ ] **Step 2: Add global probe in the mount effect**

Find the existing mount effect (creates `Audio` elements):

```typescript
useEffect(() => {
    audioRef.current = new Audio();
    nextAudioRef.current = new Audio();
    return () => {
        audioRef.current?.pause();
        nextAudioRef.current?.pause();
    };
}, []);
```

Replace it with:

```typescript
useEffect(() => {
    audioRef.current = new Audio();
    nextAudioRef.current = new Audio();

    // Global probe: check first catalog track as representative.
    // Sets initial simulation state before the user presses Play.
    probeOne(TRACKS[0].file_path).then(ok => setIsSimulating(!ok));

    return () => {
        audioRef.current?.pause();
        nextAudioRef.current?.pause();
    };
}, []);
```

- [ ] **Step 3: Add per-track probe in the `ci` change effect**

Find the existing `ci` change effect. It starts with:

```typescript
useEffect(() => {
    if (!ct) return;
    const audio = audioRef.current;
    if (!audio) return;

    // Reset guards for new track
    hasAdvanced.current = false;
    isReal.current = false;
    posRef.current = 0;
    ...
    audio.src = ct.blob_url ?? (AUDIO_BASE + ct.file_path);
```

After the `posRef.current = 0;` line and before `audio.src = ...`, insert the per-track probe block:

```typescript
    // Per-track probe: update simulation state for this specific track.
    // blob_url tracks are always real (user-imported); skip probe.
    if (ct.blob_url) {
        setIsSimulating(false);
    } else {
        probeOne(ct.file_path).then(ok => setIsSimulating(!ok));
    }
```

The full updated effect becomes:

```typescript
useEffect(() => {
    if (!ct) return;
    const audio = audioRef.current;
    if (!audio) return;

    // Reset guards for new track
    hasAdvanced.current = false;
    isReal.current = false;
    posRef.current = 0;

    // Cancel any in-flight crossfade timer
    if (crossTimerRef.current) {
        clearTimeout(crossTimerRef.current);
        crossTimerRef.current = null;
    }

    // Per-track probe: update simulation state for this specific track.
    // blob_url tracks are always real (user-imported); skip probe.
    if (ct.blob_url) {
        setIsSimulating(false);
    } else {
        probeOne(ct.file_path).then(ok => setIsSimulating(!ok));
    }

    // blob_url for user-imported files, file_path for built-in catalog
    audio.src = ct.blob_url ?? (AUDIO_BASE + ct.file_path);
    audio.volume = volRef.current;
    audio.currentTime = 0;
    setPos(0);

    const onCanPlay = () => {
        isReal.current = true;
        setIsSimulating(false);
    };
    audio.addEventListener("canplay", onCanPlay, { once: true });
    return () => audio.removeEventListener("canplay", onCanPlay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [ci, ct?.id]);
```

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: all tests pass. The existing Player tests do not test `useAudio` internals (they stub it), so no new test failures are expected.

- [ ] **Step 5: Commit**

```bash
git add src/services/useAudio.ts
git commit -m "feat: proactive audio file detection via HEAD probes on mount and track change"
```

---

## Verification

After both tasks are committed:

- [ ] Start dev server: `npm run dev`
- [ ] Open app in browser — amber simulation banner should appear **immediately** on load (since `public/audio/` has no matching catalog files)
- [ ] Copy one catalog file into `public/audio/` matching `TRACKS[0].file_path` (`"Sinatra - Fly Me To The Moon.mp3"`) and reload — banner should **not** appear on load
- [ ] Confirm the banner still appears correctly when switching tracks

---

## Summary

| File | Change |
|------|--------|
| `src/services/audioProbe.ts` | **CREATE** — `probeOne`, `probeFiles` |
| `src/services/audioProbe.test.ts` | **CREATE** — 7 unit tests |
| `src/services/useAudio.ts` | **EDIT** — import probe, add 2 probe calls |

Total: 3 files, 2 commits.
