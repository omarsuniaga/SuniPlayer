# Pitch & Tempo Fix Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix pitch/tempo changes not applying to audio playback, and add a live preview section inside TrackProfileModal.

**Architecture:** Two focused changes — (1) fix the reactive effect in `useAudio.ts` to re-initialize SoundTouch when pitch/tempo changes on an already-loaded track; (2) add explicit `playbackTempo` to the TrackProfileModal save payload and add a Preview button using the existing `pitchEngine.ts` singleton.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, SoundTouchJS (WSOLA), Web Audio API.

**Spec:** `docs/superpowers/specs/2026-03-11-pitch-tempo-fix-design.md`

---

## File Map

| Action | File | Change |
|--------|------|--------|
| MODIFY | `src/services/useAudio.ts` | Fix reactive effect (lines 234–244): add `else if (needsST)` branch to initialize SoundTouch mid-playback |
| MODIFY | `src/components/common/TrackProfileModal.tsx` | Make `playbackTempo` explicit in save handler; add Preview section with state + handlers + UI |
| CREATE | `src/components/common/TrackProfileModal.test.tsx` | Tests: save includes playbackTempo, preview calls pitchEngine, stop on close |

---

## Chunk 1: Fix `useAudio.ts` Reactive Effect

### Task 1: Fix Reactive Pitch/Tempo Effect in `useAudio.ts`

**Files:**
- Modify: `src/services/useAudio.ts` (lines 234–244)

The bug: when a track is first loaded with `transposeSemitones=0`, SoundTouch is never created (`stShifterRef.current` stays null). When the user later applies a pitch change, the reactive effect fires but finds `stShifterRef.current === null` and does nothing.

Fix: add an `else if (needsST)` branch that initializes SoundTouch mid-playback when it wasn't previously active.

- [ ] **Step 1: Read the current reactive effect to confirm the exact code**

Read `src/services/useAudio.ts` lines 234–244. Confirm the current code is:
```typescript
// ── Reactive Pitch/Tempo updates ─────────────────────────────────────────
useEffect(() => {
    if (!ct) return;
    const semitones = ct.transposeSemitones ?? 0;
    const tempo = ct.playbackTempo ?? 1.0;

    if (stShifterRef.current) {
        stShifterRef.current.pitchSemitones = semitones;
        stShifterRef.current.tempo = tempo;
    }
}, [ct]);
```

- [ ] **Step 2: Replace the reactive effect with the fixed version**

Replace lines 234–244 with:
```typescript
// ── Reactive Pitch/Tempo updates ─────────────────────────────────────────
useEffect(() => {
    if (!ct) return;
    const semitones = ct.transposeSemitones ?? 0;
    const tempo     = ct.playbackTempo ?? 1.0;
    const needsST   = semitones !== 0 || tempo !== 1.0;

    if (stShifterRef.current) {
        if (needsST) {
            // SoundTouch exists: update properties in-place
            stShifterRef.current.pitchSemitones = semitones;
            stShifterRef.current.tempo = tempo;
        } else {
            // Reverted to 0 semitones + 1.0 tempo: tear down SoundTouch, resume native audio
            stShifterRef.current.off();
            try { stShifterRef.current.disconnect(); } catch { /* noop */ }
            stShifterRef.current = null;
            stActiveRef.current = false;
            if (audioRef.current) audioRef.current.volume = volRef.current;
            if (stGainRef.current) stGainRef.current.gain.value = 0;
        }
    } else if (needsST) {
        // SoundTouch not yet created but now needed — initialize mid-playback
        const audioUrl = ct.blob_url ?? (AUDIO_BASE + encodeURIComponent(ct.file_path));

        // Mute native audio immediately to prevent double-playback
        if (audioRef.current) audioRef.current.volume = 0;

        (async () => {
            try {
                if (!stCtxRef.current) {
                    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                    stCtxRef.current = new AudioCtxClass();
                    stGainRef.current = stCtxRef.current.createGain();
                    stGainRef.current.connect(stCtxRef.current.destination);
                }
                const ctx = stCtxRef.current!;
                const r = await fetch(audioUrl);
                const ab = await r.arrayBuffer();
                const buffer = await ctx.decodeAudioData(ab);

                const shifter = new PitchShifter(ctx, buffer, ST_BUFFER_SIZE);
                shifter.pitchSemitones = semitones;
                shifter.tempo = tempo;
                stShifterRef.current = shifter;
                stActiveRef.current = true;

                // Seek to current playback position
                if (audioRef.current && buffer.duration > 0) {
                    shifter.percentagePlayed = audioRef.current.currentTime / buffer.duration;
                }

                // If currently playing, connect SoundTouch to the audio graph
                if (audioRef.current && !audioRef.current.paused && stGainRef.current) {
                    stGainRef.current.gain.value = volRef.current;
                    shifter.connect(stGainRef.current);
                }

                console.log(`[useAudio] SoundTouch re-initialized (reactive): ${semitones}st, ${tempo}x`);
            } catch (err) {
                console.warn("[useAudio] Reactive SoundTouch init failed, restoring native audio:", err);
                if (audioRef.current) audioRef.current.volume = volRef.current;
                stActiveRef.current = false;
            }
        })();
    }
}, [ct?.transposeSemitones, ct?.playbackTempo, ct?.id]);
```

**Why this is correct:**
- Dependency array `[ct?.transposeSemitones, ct?.playbackTempo, ct?.id]` — fires only when these specific values change, not on every render
- Three branches: (1) update existing SoundTouch, (2) tear down when reverted to original, (3) create SoundTouch mid-playback when newly needed
- Mutes native audio before SoundTouch takes over — prevents double-playback
- Restores native audio volume on error — graceful fallback
- Seeks SoundTouch to current position — no jump in playback

- [ ] **Step 3: Run TypeScript check**
```bash
cd C:\Users\omare\.claude\projects\SuniPlayer && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 4: Run existing tests**
```bash
cd C:\Users\omare\.claude\projects\SuniPlayer && npm test -- --run
```
Expected: same pass/fail count as before (note: 2 pre-existing failures in Player.test.tsx are known).

- [ ] **Step 5: Commit**
```bash
cd C:\Users\omare\.claude\projects\SuniPlayer && git add src/services/useAudio.ts && git commit -m "fix: re-initialize SoundTouch reactively when pitch/tempo changes on loaded track"
```

---

## Chunk 2: Fix TrackProfileModal + Add Preview

### Task 2: Fix Save Handler + Add Preview Section

**Files:**
- Modify: `src/components/common/TrackProfileModal.tsx`
- Create: `src/components/common/TrackProfileModal.test.tsx`

#### Step A — Write the failing tests first (TDD)

- [ ] **Step 1: Read `src/services/pitchEngine.ts` to confirm the API**

Look for: the `getPitchEngine()` function, `loadFromPath(filePath, blobUrl?)`, `pitchSemitones` setter, `tempo` setter, `play()`, `stop()`, `onTimeUpdate` callback.

- [ ] **Step 2: Create the test file**

Create `src/components/common/TrackProfileModal.test.tsx`:

```tsx
// src/components/common/TrackProfileModal.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TrackProfileModal } from "./TrackProfileModal";
import { TRACKS } from "../../data/constants";

// Mock pitchEngine so tests don't touch Web Audio API
vi.mock("../../services/pitchEngine", () => ({
    getPitchEngine: vi.fn(() => ({
        loadFromPath: vi.fn().mockResolvedValue(true),
        play: vi.fn(),
        stop: vi.fn(),
        pitchSemitones: 0,
        tempo: 1.0,
        onTimeUpdate: vi.fn(),
    })),
}));

const sampleTrack = {
    ...TRACKS[0],
    key: "C Major",
    targetKey: "C Major",
    transposeSemitones: 0,
    playbackTempo: 1.0,
};

describe("TrackProfileModal", () => {
    let onSave: ReturnType<typeof vi.fn>;
    let onCancel: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        onSave = vi.fn();
        onCancel = vi.fn();
    });

    it("includes playbackTempo explicitly in save payload", () => {
        render(<TrackProfileModal track={sampleTrack} onSave={onSave} onCancel={onCancel} />);
        fireEvent.click(screen.getByText("Guardar Perfil"));
        expect(onSave).toHaveBeenCalledOnce();
        const payload = onSave.mock.calls[0][0];
        expect(payload).toHaveProperty("playbackTempo");
        expect(typeof payload.playbackTempo).toBe("number");
    });

    it("save payload includes updated playbackTempo after slider change", async () => {
        render(<TrackProfileModal track={sampleTrack} onSave={onSave} onCancel={onCancel} />);
        // Change the tempo slider to 1.1
        const slider = screen.getByRole("slider", { name: /velocidad/i });
        fireEvent.change(slider, { target: { value: "1.1" } });
        fireEvent.click(screen.getByText("Guardar Perfil"));
        const payload = onSave.mock.calls[0][0];
        expect(payload.playbackTempo).toBeCloseTo(1.1);
    });

    it("renders the Preview button in the Detalles tab", () => {
        render(<TrackProfileModal track={sampleTrack} onSave={onSave} onCancel={onCancel} />);
        expect(screen.getByText(/Escuchar Preview/i)).toBeTruthy();
    });

    it("clicking Preview calls pitchEngine.loadFromPath and play", async () => {
        const { getPitchEngine } = await import("../../services/pitchEngine");
        const mockEngine = getPitchEngine();
        render(<TrackProfileModal track={sampleTrack} onSave={onSave} onCancel={onCancel} />);
        fireEvent.click(screen.getByText(/Escuchar Preview/i));
        await waitFor(() => {
            expect(mockEngine.loadFromPath).toHaveBeenCalled();
        });
    });

    it("clicking Stop Preview calls pitchEngine.stop", async () => {
        const { getPitchEngine } = await import("../../services/pitchEngine");
        const mockEngine = getPitchEngine();
        render(<TrackProfileModal track={{ ...sampleTrack, playbackTempo: 1.1 }} onSave={onSave} onCancel={onCancel} />);
        fireEvent.click(screen.getByText(/Escuchar Preview/i));
        await waitFor(() => screen.findByText(/Detener/i));
        const stopBtn = screen.getByText(/Detener/i);
        fireEvent.click(stopBtn);
        expect(mockEngine.stop).toHaveBeenCalled();
    });

    it("closing modal calls pitchEngine.stop to clean up preview", async () => {
        const { getPitchEngine } = await import("../../services/pitchEngine");
        const mockEngine = getPitchEngine();
        render(<TrackProfileModal track={sampleTrack} onSave={onSave} onCancel={onCancel} />);
        // Close via Cancelar button
        fireEvent.click(screen.getByText("Cancelar"));
        expect(mockEngine.stop).toHaveBeenCalled();
        expect(onCancel).toHaveBeenCalled();
    });
});
```

- [ ] **Step 3: Run tests to confirm they fail**
```bash
cd C:\Users\omare\.claude\projects\SuniPlayer && npm test -- --run src/components/common/TrackProfileModal.test.tsx
```
Expected: tests FAIL because pitchEngine import and Preview button don't exist yet.

#### Step B — Implement the changes

- [ ] **Step 4: Add pitchEngine import to TrackProfileModal.tsx**

Add to the imports at the top of `src/components/common/TrackProfileModal.tsx`:
```tsx
import { getPitchEngine } from "../../services/pitchEngine";
```

- [ ] **Step 5: Add preview state variables**

Add these state declarations after the existing `useState` declarations (after line 24, after `const [isUploadingSheet, setIsUploadingSheet]`):
```tsx
const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
const [isLoadingPreview, setIsLoadingPreview] = useState(false);
```

- [ ] **Step 5b: Add aria-label to the existing tempo slider**

Find the tempo range input in `src/components/common/TrackProfileModal.tsx` (around line 307). It looks like:
```tsx
<input type="range" min="0.8" max="1.2" step="0.01"
    value={edit.playbackTempo ?? 1.0}
    onChange={...}
```
Add `aria-label="Velocidad (Tempo)"` to that element:
```tsx
<input type="range" min="0.8" max="1.2" step="0.01"
    aria-label="Velocidad (Tempo)"
    value={edit.playbackTempo ?? 1.0}
    onChange={...}
```
This is required for the test `getByRole("slider", { name: /velocidad/i })` to find the element.

- [ ] **Step 6: Add playbackTempo local variable**

After line 29 (after `const transposeSemitones = ...`), add:
```tsx
const playbackTempo = edit.playbackTempo ?? 1.0;
```

- [ ] **Step 7: Fix the handleSave function**

Replace the current `handleSave` (lines 31–37):
```tsx
const handleSave = () => {
    onSave({
        ...edit,
        targetKey,
        transposeSemitones,
    });
};
```

With:
```tsx
const handleSave = () => {
    getPitchEngine().stop();
    onSave({
        ...edit,
        targetKey,
        transposeSemitones,
        playbackTempo,
    });
};
```

- [ ] **Step 8: Add handlePreview and handleStopPreview functions**

Add these functions after `handleSave`:
```tsx
const handlePreview = async () => {
    if (isPreviewPlaying) return;
    const engine = getPitchEngine();
    setIsLoadingPreview(true);
    try {
        const ok = await engine.loadFromPath(track.file_path, track.blob_url ?? undefined);
        if (!ok) throw new Error("Failed to load audio");
        engine.pitchSemitones = transposeSemitones;
        engine.tempo = playbackTempo;
        engine.onTimeUpdate((currentTimeSec: number) => {
            // Auto-stop after 30 seconds of preview
            if (currentTimeSec >= 30) {
                engine.stop();
                setIsPreviewPlaying(false);
            }
        });
        setIsPreviewPlaying(true);
        engine.play();
    } catch (err) {
        console.warn("[TrackProfileModal] Preview failed:", err);
    } finally {
        setIsLoadingPreview(false);
    }
};

const handleStopPreview = () => {
    getPitchEngine().stop();
    setIsPreviewPlaying(false);
};
```

- [ ] **Step 9: Update onCancel to stop preview**

The modal already has `onCancel` on the header close button and the Cancelar button. We need to wrap the onCancel call to also stop preview.

Add this helper function after `handleStopPreview`:
```tsx
const handleCancel = () => {
    getPitchEngine().stop();
    setIsPreviewPlaying(false);
    onCancel();
};
```

Then replace all three occurrences of `onCancel` in the JSX with `handleCancel`:
1. The header X button: `onClick={onCancel}` → `onClick={handleCancel}`
2. The Cancelar button in footer: `onClick={onCancel}` → `onClick={handleCancel}`

- [ ] **Step 10: Add the Preview UI block**

Find this comment in the JSX (line ~320):
```tsx
<div style={{ marginTop: 16, fontSize: 12, color: THEME.colors.text.muted }}>
    {parsedSourceKey
        ? <>Original: <strong style={{ color: "white" }}>{sourceKey}</strong> · Objetivo: <strong style={{ color: "white" }}>{targetKey}</strong></>
        : <>Escribe un tono valido como `C# Major` o `A Minor` para calcular semitonos.</>}
</div>
```

Add the Preview block AFTER that closing `</div>` (and still inside the Transposición section's outer div):

```tsx
{/* ── Preview ────────────────────────────────────────────────────────────── */}
<div style={{
    marginTop: 16,
    padding: "14px 16px",
    borderRadius: THEME.radius.md,
    background: "rgba(255,255,255,0.02)",
    border: `1px solid ${THEME.colors.border}`,
    display: "flex",
    alignItems: "center",
    gap: 14,
}}>
    <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: THEME.colors.text.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
            Preview
        </div>
        <div style={{ fontSize: 12, color: THEME.colors.text.dim }}>
            {transposeSemitones === 0 && playbackTempo === 1.0
                ? "Sin cambios — tono y tempo originales"
                : `${transposeSemitones > 0 ? "+" : ""}${transposeSemitones} st · ${playbackTempo.toFixed(2)}x · 30 seg`}
        </div>
    </div>

    {isPreviewPlaying ? (
        <button
            onClick={handleStopPreview}
            style={{
                padding: "8px 16px",
                borderRadius: THEME.radius.md,
                border: `1px solid ${THEME.colors.status.error}40`,
                background: `${THEME.colors.status.error}10`,
                color: THEME.colors.status.error,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
            }}
        >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
            Detener
        </button>
    ) : (
        <button
            onClick={handlePreview}
            disabled={isLoadingPreview || (!track.blob_url && !track.file_path)}
            style={{
                padding: "8px 16px",
                borderRadius: THEME.radius.md,
                border: `1px solid ${THEME.colors.brand.cyan}40`,
                background: `${THEME.colors.brand.cyan}10`,
                color: isLoadingPreview ? THEME.colors.text.dim : THEME.colors.brand.cyan,
                fontSize: 12,
                fontWeight: 700,
                cursor: isLoadingPreview ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
            }}
        >
            {isLoadingPreview ? (
                "Cargando..."
            ) : (
                <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    Escuchar Preview
                </>
            )}
        </button>
    )}
</div>
```

#### Step C — Verify

- [ ] **Step 11: Run TypeScript check**
```bash
cd C:\Users\omare\.claude\projects\SuniPlayer && npx tsc --noEmit
```
Expected: 0 errors. Common issue: `pitchEngine.ts` might export `onTimeUpdate` differently — read it if TypeScript complains and adjust the type.

- [ ] **Step 12: Run new tests**
```bash
cd C:\Users\omare\.claude\projects\SuniPlayer && npm test -- --run src/components/common/TrackProfileModal.test.tsx
```
Expected: 5/5 tests pass. If any fail, debug and fix before continuing.

Common test failures and fixes:
- `"Escuchar Preview" not found` → check the exact button text in Step 10
- `slider not found` → verify Step 5b was applied (aria-label must be on the existing tempo slider, not the new Preview section)
- `pitchEngine mock not working` → ensure the mock path matches the actual import path in the component

- [ ] **Step 13: Run full test suite**
```bash
cd C:\Users\omare\.claude\projects\SuniPlayer && npm test -- --run
```
Expected: All previous tests still pass + 5 new ones.

- [ ] **Step 14: Commit**
```bash
cd C:\Users\omare\.claude\projects\SuniPlayer && git add src/components/common/TrackProfileModal.tsx src/components/common/TrackProfileModal.test.tsx && git commit -m "feat: fix pitch/tempo save handler + add 30s preview in TrackProfileModal"
```

---

## Verification Checklist

After both tasks complete:

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm test -- --run` → all tests pass (5 new TrackProfileModal tests)
- [ ] Load a track with `transposeSemitones=0` → play → change to +3 in modal → save → audio is 3 semitones higher
- [ ] Change back to 0 semitones → save → native audio resumes (SoundTouch torn down)
- [ ] Click "Escuchar Preview" with +3 semitones → hear pitch-shifted preview in modal
- [ ] Preview auto-stops after 30 seconds
- [ ] Close modal while previewing → preview stops
- [ ] Uploaded track (blob_url) → pitch change → works in both modal preview and Player
