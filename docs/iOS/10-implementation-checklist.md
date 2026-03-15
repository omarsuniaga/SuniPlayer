# 10 — Implementation Checklist

Use this to track progress building SuniPlayer iOS.
Check boxes as you complete each item.

## Phase 1: Platform Abstraction Layer (Web codebase)

- [ ] `src/platform/interfaces/IAudioEngine.ts` created
- [ ] `src/platform/interfaces/IStorage.ts` created
- [ ] `src/platform/interfaces/IFileAccess.ts` created
- [ ] `src/platform/browser/BrowserAudioEngine.ts` created
- [ ] `src/platform/browser/IDBStorage.ts` created
- [ ] `src/platform/browser/BlobFileAccess.ts` created
- [ ] `src/platform/index.ts` created
- [ ] `src/services/audioProbe.ts` updated to use `fileAccess`
- [ ] All 31 tests pass after refactor
- [ ] TypeScript compiles clean

## Phase 2: iOS Audio Engine

- [ ] Choose audio strategy: AVAudioEngine (A) or SoundTouch C++ (B) or AudioKit (C)
- [ ] Create `NativeAudioEngine` implementing `IAudioEngine`
- [ ] `load()` — loads MP3 from bundle URL or file:// URI
- [ ] `play()` / `pause()` — works
- [ ] `seek()` — accurate to ±100ms
- [ ] `setPitch()` — semitones applied in real-time (remember: × 100 for cents)
- [ ] `setTempo()` — rate factor applied in real-time
- [ ] `setVolume()` — smooth
- [ ] `onPositionUpdate` — fires every 250ms
- [ ] `onEnded` — fires correctly at track end
- [ ] Background audio — app plays when screen locked
- [ ] Tested with musician on real device (key quality check)

## Phase 3: iOS Storage

- [ ] Choose: SQLite/GRDB (recommended) or Core Data
- [ ] Create `SQLiteStorage` implementing `IStorage`
- [ ] `saveAnalysis` — persists BPM, key, energy, gainOffset
- [ ] `getAnalysis` — retrieves correctly after app restart
- [ ] `saveWaveform` — stores ~200 float array
- [ ] `getWaveform` — retrieves correctly
- [ ] Migration strategy defined (schema version)

## Phase 4: iOS File Access

- [ ] Create `NativeFileAccess` implementing `IFileAccess`
- [ ] Catalog tracks packaged in app bundle
- [ ] `checkExists()` — checks bundle + Documents directory
- [ ] `resolveURL()` — returns correct URL for AVAudioPlayer
- [ ] `importFile()` — UIDocumentPickerViewController works
- [ ] Imported files copied to Documents/audio/
- [ ] File paths persisted in UserDefaults / SQLite

## Phase 5: SwiftUI UI

### Player Screen
- [ ] Now-playing header (title, artist, key, BPM badges)
- [ ] Waveform view + scrubber
- [ ] Play/Pause/Skip controls
- [ ] Queue list (swipe to remove, long-press for profile)
- [ ] Pitch stepper (-12 to +12 semitones)
- [ ] Tempo slider (0.8x to 1.2x)
- [ ] Volume control
- [ ] Crossfade toggle
- [ ] Auto-advance toggle

### Library Screen
- [ ] Track list with search
- [ ] TrackRow: title, artist, duration, key badge
- [ ] Import button (UIDocumentPickerViewController)
- [ ] Swipe actions: add to queue, edit profile

### Builder Screen
- [ ] Duration slider (minutes)
- [ ] Venue picker
- [ ] Energy curve picker
- [ ] BPM range slider
- [ ] Generate button
- [ ] Generated set list
- [ ] Send to Player button
- [ ] Save Set button

### Track Profile Modal
- [ ] 30-second preview player
- [ ] Pitch stepper
- [ ] Tempo slider
- [ ] Trim controls (start/end)
- [ ] Notes text field
- [ ] Sheet music PDF viewer
- [ ] Save button

### History Screen
- [ ] List of past sets
- [ ] Set detail: tracks, venue, duration, date

## Phase 6: Quality

- [ ] Pitch accuracy test: tune to reference pitch with musician
- [ ] Tempo accuracy test: verify click track alignment
- [ ] Battery usage: 2-hour gig simulation
- [ ] Memory: no leaks during long session
- [ ] Background audio: works when app is backgrounded
- [ ] File import: works for .mp3, .m4a, .aac, .wav
- [ ] TestFlight beta with real performers
- [ ] App Store submission
