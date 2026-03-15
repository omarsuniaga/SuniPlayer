# SuniPlayer Native App — Design Spec
**Date:** 2026-03-14
**Status:** Approved
**Target:** iPad (primary) + Android (secondary)

---

## 1. Decision Summary

The web app (Vite + React) was the prototype. The production tool for on-stage use is a **native app built with Expo + React Native**, targeting iPad first, Android second. A cloud-sync feature (audio files hosted in the cloud, downloaded on demand per device) is deliberately deferred to a future version.

---

## 2. Architecture

### 2.1 Repository Structure — Monorepo (pnpm workspaces)

```
suniplayer/                          ← root (pnpm workspaces)
├── packages/
│   └── core/                        ← shared TypeScript business logic
│       ├── src/store/               (5 Zustand stores — zero changes)
│       ├── src/services/            (setBuilderService, audioProbe, etc.)
│       ├── src/platform/interfaces/ (IAudioEngine, IStorage, IFileAccess)
│       ├── src/data/                (tracks.json, built-in catalog)
│       └── src/types.ts
│
├── apps/
│   ├── web/                         ← existing Vite app (unchanged)
│   └── native/                      ← ONE Expo project → iOS + Android
│       ├── src/
│       │   ├── platform/            (native adapters)
│       │   ├── screens/             (React Native screens)
│       │   ├── components/          (RN UI components)
│       │   └── navigation/          (Expo Router config)
│       ├── apple/                   ← iOS/iPad-specific artifacts
│       │   ├── docs/                (iPad-specific notes, entitlements)
│       │   └── assets/              (App Store icons, splash)
│       └── android/                 ← Android-specific artifacts
│           ├── docs/
│           └── assets/              (Play Store icons, adaptive icons)
│
└── package.json                     (workspace root)
```

### 2.2 Shared Code (ports directly — zero changes)
| Module | Description |
|--------|-------------|
| `useBuilderStore` | Set builder state |
| `usePlayerStore` | Player state (queue, current index) |
| `useSettingsStore` | Settings + PedalBindings types |
| `useHistoryStore` | Saved sets history |
| `useLibraryStore` | User audio library |
| `setBuilderService` | BPM/energy/key filter algorithm |
| `IAudioEngine` | Audio platform interface |
| `IStorage` | Storage platform interface |
| `IFileAccess` | File access platform interface |
| `src/types.ts` | All domain types (Track, Set, etc.) |

### 2.3 Native Adapters (new implementations)
| Adapter | Interface | Library |
|---------|-----------|---------|
| `ExpoAudioEngine` | `IAudioEngine` | `react-native-track-player` |
| `SQLiteStorage` | `IStorage` | `expo-sqlite` |
| `LocalFileAccess` | `IFileAccess` | `expo-file-system` + `expo-document-picker` |

---

## 3. Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Expo SDK 52 | Managed workflow, single codebase for iOS+Android |
| Navigation | Expo Router v3 | File-based routing, tab + stack |
| Audio | react-native-track-player | Background playback, lock screen controls, AirPlay — critical for live use |
| Storage | expo-sqlite | Persistent relational storage, available offline |
| File access | expo-document-picker + expo-file-system | iOS Files app integration, copies to app sandbox |
| Secure storage | expo-secure-store | For any future credentials/tokens |
| State | Zustand 4 (from `packages/core`) | Same stores as web |
| Language | TypeScript 5 | Strict mode |

**Why `react-native-track-player` over `expo-av`:**
Musicians need the audio to continue playing when the iPad screen locks or they switch apps (e.g., reading sheet music). `expo-av` pauses in background. `react-native-track-player` runs in a native service that persists through screen lock and shows lock screen controls.

---

## 4. File Management & Persistence

### Flow
1. User taps "Importar" → `expo-document-picker` opens iPad Files app
2. Selected audio files are **copied** to app's private document directory (`FileSystem.documentDirectory`)
3. Copy path + metadata stored in SQLite via `SQLiteStorage`
4. On next launch: metadata loaded from SQLite, file paths resolved via `LocalFileAccess.resolveURL()`
5. Files survive app restart, OS restart, and app updates

### Why copy to app sandbox (not just store the path)
- iOS security model: apps cannot hold persistent references to arbitrary file paths outside their sandbox
- Copying ensures the file is always accessible without re-asking the user
- Files stored in `documentDirectory` are included in iCloud Backup automatically (good for musicians)

### File validation on import
- MIME type check: only `audio/*` accepted
- Extension whitelist: `.mp3`, `.m4a`, `.wav`, `.aiff`, `.flac`, `.ogg`
- Max file size: 200 MB (prevents accidental import of video files)
- Filename sanitization: strip path traversal characters before storing

---

## 5. iPad-First UI Design

### Layout
- **Primary navigation**: bottom tab bar with 4 tabs: Player, Builder, Library, Settings
- **iPad split view**: on iPad landscape, Player screen shows sidebar (queue) + main controls simultaneously using React Native's responsive layout
- **Touch targets**: minimum 44×44 pt (Apple HIG), enlarged to 56×56 pt for primary transport controls (play/pause/next) — used in low-light on stage
- **Theme**: dark-first (#0a0a0a background) — reduces eye strain in dark venues

### Screens
| Screen | Purpose |
|--------|---------|
| `PlayerScreen` | Transport controls, current track, queue |
| `BuilderScreen` | BPM/energy/key filters → auto-generate set |
| `LibraryScreen` | All imported tracks, edit metadata |
| `SettingsScreen` | Pedal bindings, audio preferences |

### Pedal Bindings (Bluetooth)
- Existing `PedalBindings` types from `packages/core` reused
- Native keydown equivalent: `react-native-volume-buttons` or Bluetooth HID keyboard events via React Native's `KeyboardEvent`
- Bluetooth MIDI pedals send keyboard events that React Native intercepts

---

## 6. Security

| Concern | Mitigation |
|---------|-----------|
| Sensitive data at rest | `expo-secure-store` for any credentials (future cloud sync) |
| File path traversal | Sanitize filenames on import; files stored under controlled path |
| Arbitrary file execution | Only audio MIME types accepted; no code execution from imported files |
| Network (future) | All HTTP via HTTPS; certificate pinning for cloud sync endpoints |
| App transport | iOS ATS enforced (no HTTP allowed by default in Expo) |
| Backup | `documentDirectory` is backed up to iCloud (intentional for user's audio library) |
| No eval() / dynamic imports | TypeScript strict mode + ESLint `no-eval` rule |
| Dependency audit | `pnpm audit` run in CI before every build |

---

## 7. Future Feature: Cloud Sync (deferred)

When implemented, this will add:
- Supabase (or similar) bucket for audio file storage
- On app launch: compare local library against cloud manifest
- Missing files downloaded in background (with progress UI)
- Metadata always syncs first (lightweight), audio files sync lazily
- Web app becomes the "desktop manager" — upload songs, build sets, synced to device

This is explicitly **out of scope** for v1. No code stubs for it will be written now.

---

## 8. Success Criteria for v1

- [ ] App installs and runs on iPad via Expo Go / TestFlight
- [ ] User can import audio files from iPad Files app
- [ ] Files persist across app restarts
- [ ] Audio plays in background (screen locked)
- [ ] Set builder generates sets using same algorithm as web app
- [ ] Bluetooth pedal events trigger next/previous track
- [ ] All `packages/core` unit tests pass
