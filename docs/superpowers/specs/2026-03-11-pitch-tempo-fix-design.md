# Pitch & Tempo Fix — Design Spec

**Date:** 2026-03-11
**Status:** Approved
**Scope:** Fix pitch/tempo not applying in Player + add Preview in TrackProfileModal

---

## Problem Statement

The pitch and tempo controls in TrackProfileModal do not affect audio playback. Users change semitones and tempo, save the track, but hear no difference in the Player. The architecture (SoundTouchJS WSOLA) is correct and capable — the bug is in the integration layer.

---

## Root Cause Analysis

### BUG #1 (CRITICAL) — SoundTouch never re-initialized after pitch change

**File:** `src/services/useAudio.ts`

When a track is first loaded with `transposeSemitones=0` and `playbackTempo=1.0`, the main setup effect correctly skips SoundTouch and uses native `HTMLAudioElement`.

The reactive update effect fires when `ct` changes but only updates an **already-existing** SoundTouch instance:

```typescript
useEffect(() => {
    if (stShifterRef.current) {          // null on first load → skipped silently
        stShifterRef.current.pitchSemitones = semitones;
        stShifterRef.current.tempo = tempo;
    }
}, [ct]);
```

**Result:** After user saves pitch change → `pQueue` is updated → reactive effect fires → `stShifterRef.current` is still `null` → nothing happens. Audio plays unchanged through native element.

### BUG #2 (DEFENSIVE) — playbackTempo not explicitly in save payload

**File:** `src/components/common/TrackProfileModal.tsx`

```typescript
const handleSave = () => {
    onSave({
        ...edit,         // playbackTempo is here via spread — but implicitly
        targetKey,
        transposeSemitones,
        // playbackTempo not listed explicitly
    });
};
```

`playbackTempo` is correctly propagated via the `...edit` spread (the slider calls `setEdit({ ...edit, playbackTempo: value })` which updates `edit` state). This works in the current code. However, the implicit reliance on spread makes it fragile — a future refactor that introduces a separate local state variable would silently lose the value. Fix: make it explicit.

### BUG #3 (LOW) — No preview mechanism in modal

Users cannot audition pitch/tempo changes before saving. This leads to trial-and-error workflows.

---

## Solution Design

### Fix 1: Reactive re-initialization in `useAudio.ts`

Extract a reusable `initSoundTouch(ct, semitones, tempo)` function from the main setup effect. The reactive effect calls it when SoundTouch is needed but not yet created:

```typescript
// Reactive effect — watches pitch/tempo changes specifically
useEffect(() => {
    if (!ct) return;
    const semitones = ct.transposeSemitones ?? 0;
    const tempo     = ct.playbackTempo ?? 1.0;
    const needsST   = semitones !== 0 || tempo !== 1.0;

    if (stShifterRef.current) {
        if (needsST) {
            // Already initialized: update properties in-place
            stShifterRef.current.pitchSemitones = semitones;
            stShifterRef.current.tempo = tempo;
        } else {
            // Reverted to 0 semitones + 1.0 tempo: tear down SoundTouch, resume native
            teardownSoundTouch();
        }
    } else if (needsST) {
        // Not initialized but now needed: create SoundTouch mid-playback
        initSoundTouch(ct, semitones, tempo);
    }
}, [ct?.transposeSemitones, ct?.playbackTempo, ct?.id]);
```

The effect dependency array is `[ct?.transposeSemitones, ct?.playbackTempo, ct?.id]` — specific fields only, not the entire `ct` object, to avoid infinite loops.

#### `teardownSoundTouch()` — steps required

```typescript
function teardownSoundTouch() {
    if (!stShifterRef.current) return;
    stShifterRef.current.off();           // stop sample processing
    stShifterRef.current.disconnect();    // disconnect from AudioContext graph
    stShifterRef.current = null;
    stActiveRef.current = false;
    // Restore native audio volume
    if (audioRef.current) audioRef.current.volume = volRef.current;
    if (stGainRef.current) stGainRef.current.gain.value = 0;
}
```

#### `initSoundTouch()` — must mute native audio when called mid-playback

When `initSoundTouch` fires during live playback (reactive update, not initial track load), the native `HTMLAudioElement` is already playing. The function must mute it before SoundTouch takes over:

```typescript
async function initSoundTouch(ct: Track, semitones: number, tempo: number) {
    // Mute native audio immediately to prevent double-playback
    if (audioRef.current) audioRef.current.volume = 0;
    // ... fetch → decodeAudioData → new PitchShifter → connect → play
    stActiveRef.current = true;
}
```

### Fix 2: Explicit playbackTempo in save handler

```typescript
const handleSave = () => {
    onSave({
        ...edit,
        targetKey,
        transposeSemitones,
        playbackTempo,      // explicit — not relying on spread
    });
};
```

### Fix 3: Preview section in TrackProfileModal

A self-contained preview player within the modal using the existing `pitchEngine.ts` singleton.

**UI layout** (added below the semitone/tempo controls in the Info tab):

```
┌─────────────────────────────────────────────────┐
│  PREVIEW                                        │
│  ─────────────────────────────────────────────  │
│  [▶ Escuchar]  [■ Detener]                      │
│  "E Major · +3 semitonos · 1.05x"               │
│  Primeros 30 segundos                           │
└─────────────────────────────────────────────────┘
```

**Behavior:**
- `▶ Escuchar` → calls `getPitchEngine().loadFromPath(track.file_path, track.blob_url ?? undefined)` → sets `pitchSemitones` + `tempo` → `play()`
- Auto-stops after 30 seconds (`onTimeUpdate` callback)
- `■ Detener` → `getPitchEngine().stop()`
- Modal `onCancel`/`onSave` → `getPitchEngine().stop()` (cleanup)
- Disabled if track has no audio source (no `blob_url` and no `file_path`)
- Shows `isLoadingPreview` spinner while audio decodes

**State in TrackProfileModal:**
```typescript
const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
const [isLoadingPreview, setIsLoadingPreview] = useState(false);
```

---

## File Map

| File | Change | Reason |
|------|--------|--------|
| `src/services/useAudio.ts` | Fix reactive effect + extract `initSoundTouch` | BUG #1 root cause fix |
| `src/components/common/TrackProfileModal.tsx` | Fix save handler + add Preview section | BUG #2 fix + Preview feature |

**No new dependencies.** Both `pitchEngine.ts` (singleton) and `useAudio.ts` (playback hook) already exist.

---

## Data Flow After Fix

```
User changes semitones in TrackProfileModal
    ↓
handleSave() — includes { transposeSemitones, playbackTempo } explicitly
    ↓
updateTrackMetadata(id, updates) → pQueue updated
    ↓
useAudio reactive effect fires on [ct?.transposeSemitones, ct?.playbackTempo, ct?.id]
    ↓
stShifterRef.current is null AND needsST?
    → initSoundTouch(ct, semitones, tempo)
    → Mute native HTMLAudioElement (audio.volume = 0)   ← prevents double audio
    → Fetch audio URL → decodeAudioData → new PitchShifter
    → shifter.pitchSemitones = semitones; shifter.tempo = tempo
    → Connect PitchShifter → GainNode → AudioContext.destination
    → stActiveRef.current = true
    ↓
Audio plays with correct pitch and tempo ✓
```

---

## Testing Checklist

- [ ] Load a track with no pitch set → plays normally
- [ ] Set +3 semitones → save → Player audio is 3 semitones higher
- [ ] Set -2 semitones → save → Player audio is 2 semitones lower
- [ ] Set tempo 1.1x → save → track plays 10% faster (pitch unchanged)
- [ ] Set semitones back to 0 and tempo to 1.0 → native audio resumes
- [ ] Preview in modal: click Escuchar → hear pitch-shifted preview
- [ ] Preview auto-stops at 30 seconds
- [ ] Modal close while previewing → preview stops
- [ ] Works with blob_url (uploaded files) and file_path (library files)
- [ ] **Mid-playback change:** Set +2 semitones while track is actively playing → pitch shifts immediately without stopping/restarting
- [ ] **Uploaded file:** Track with blob_url (user upload) + pitch change → preview in modal and Player playback both work correctly

---

## Non-Goals

- FFT-based key detection improvement (separate task)
- Blob URL persistence across sessions (separate task)
- Real-time pitch slider in Player (future feature)
- Pitch bend / glissando (future feature)
