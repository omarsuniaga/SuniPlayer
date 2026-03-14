# 09 — React Native Path (iOS + Android Simultaneously)

## When to choose React Native over Swift

| Choose Swift/SwiftUI when... | Choose React Native when... |
|---|---|
| iOS only, no Android plans | You need iOS + Android |
| Maximum native performance | Your team knows React/TypeScript |
| Deepest iOS integration (Siri, etc.) | You want to reuse web Zustand stores directly |
| You have an iOS developer | You want faster parallel development |

## Key Libraries

| Concern | Library | Notes |
|---|---|---|
| Audio playback | `react-native-track-player` | Background audio, pitch via AVAudioEngine |
| Pitch/tempo | `react-native-track-player` `rate` + pitch plugin | Or bridge to SoundTouch C++ |
| File picker | `react-native-document-picker` | Replaces `<input type="file">` |
| File system | `react-native-fs` | Replaces `fetch` + blob URLs |
| SQLite | `@op-engineering/op-sqlite` | Replaces IndexedDB |
| State | `zustand` | **Same library, same stores** |
| Navigation | `react-navigation` | Replaces React Router |

## Architecture in React Native

```
src/
  platform/
    index.ts              ← swap to RN adapters here
    interfaces/           ← unchanged (same TypeScript contracts)
    browser/              ← kept for web builds
    native/               ← NEW: RN implementations
      RNAudioEngine.ts
      SQLiteStorage.ts
      RNFileAccess.ts
  store/                  ← UNCHANGED: same Zustand stores
  services/               ← UNCHANGED: setBuilderService, etc.
  screens/                ← NEW: replaces src/pages/ with RN screens
    Player.tsx
    Library.tsx
    Builder.tsx
    History.tsx
  components/             ← NEW: RN equivalents of web components
```

## react-native-track-player Pitch Example

```typescript
import TrackPlayer, { Capability } from 'react-native-track-player';

await TrackPlayer.setupPlayer();
await TrackPlayer.updateOptions({
    capabilities: [Capability.Play, Capability.Pause, Capability.SeekTo],
});

await TrackPlayer.add({
    id: track.id,
    url: fileAccess.resolveURL(track.file_path),
    title: track.title,
    artist: track.artist,
});

await TrackPlayer.play();

// Pitch (via AVAudioEngine on iOS — semitones to rate conversion needed)
// Note: react-native-track-player v4 supports pitch via pitchAlgorithm
```

## Estimated Timeline (React Native)

```
Week 1:  Platform adapters (RNAudioEngine, SQLiteStorage, RNFileAccess)
Week 2:  Navigation setup + Player screen
Week 3:  Library screen + import flow
Week 4:  Builder screen + History screen
Week 5:  Track Profile Modal + pitch/tempo controls
Week 6:  Polish, testing, TestFlight
─────────────────────────────────────────────
Total:   ~6 weeks for iOS + Android
```
