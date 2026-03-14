# SuniPlayer — iOS Implementation Guide

SuniPlayer is a live music player for performers.
This folder contains everything needed to build a native iOS version.

## What SuniPlayer does

| Feature | Description |
|---|---|
| Library | Manage a catalog of MP3 karaoke tracks with metadata |
| Set Builder | Build a timed setlist by venue, energy curve, and BPM |
| Player | Play tracks with real-time pitch shift and tempo control |
| Track Profile | Per-track settings: trim, pitch, tempo, notes, sheet music |
| History | Review past sets |

## Folder Guide

| Document | Read this when... |
|---|---|
| [01-viability-assessment](01-viability-assessment.md) | You need to understand what's hard and what's free |
| [02-architecture](02-architecture.md) | You need to understand the abstraction layer |
| [03-audio-engine](03-audio-engine.md) | You are implementing pitch/tempo playback |
| [04-storage](04-storage.md) | You are implementing local caching |
| [05-file-access](05-file-access.md) | You are implementing audio file management |
| [06-ui-ux-reference](06-ui-ux-reference.md) | You are building the UI |
| [07-data-models](07-data-models.md) | You need to define Swift structs |
| [08-business-logic-portable](08-business-logic-portable.md) | You want to reuse web logic in React Native |
| [09-react-native-path](09-react-native-path.md) | You are evaluating React Native instead of Swift |
| [10-implementation-checklist](10-implementation-checklist.md) | You are tracking progress |

## Quick Decision Guide

```
Are you targeting iOS + Android simultaneously?
  YES → Read 09-react-native-path.md first
  NO  → Read 02-architecture.md → 03-audio-engine.md

Is audio quality (pitch accuracy) critical?
  YES (professional) → Use SoundTouch C++ (see 03-audio-engine.md §2)
  GOOD ENOUGH       → Use AVAudioEngine (see 03-audio-engine.md §1)
```

## Technology Stack (Web, for reference)

| Concern | Web Technology |
|---|---|
| UI Framework | React 18 + TypeScript |
| State Management | Zustand 4 |
| Audio Engine | SoundTouchJS (WSOLA) + Web Audio API |
| Pitch/Tempo | `PitchShifter` from soundtouchjs |
| Persistence | IndexedDB via idb |
| File Import | File input + `URL.createObjectURL` |
| Analysis | Custom BPM/key detection on AudioBuffer |
