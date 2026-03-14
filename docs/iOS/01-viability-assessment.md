# 01 — Viability Assessment

## Verdict: FULLY VIABLE ✅

SuniPlayer can be implemented as a native iOS app.
~60% of the codebase is already portable. The 3 platform blockers each have well-known iOS solutions.

---

## Module-by-Module Verdict

### ✅ Portable — Zero Changes Needed (works in React Native as-is)

| Module | What it does | Why it's portable |
|---|---|---|
| `usePlayerStore` | Queue, current index, position, playing state | Pure Zustand — no browser APIs |
| `useBuilderStore` | Set generation inputs (venue, curve, BPM range) | Pure state |
| `useHistoryStore` | Past sets storage | Pure state |
| `useLibraryStore` | Track overrides, custom tracks list | Pure state |
| `setBuilderService` | Algorithm that picks tracks to fill target duration | Pure math, no DOM |
| `types.ts` / `Track` | All data types | TypeScript interfaces |
| `showSessionStorage` | Active session (current show) | Trivial: `localStorage` → `AsyncStorage` |

**These modules represent ~60% of the codebase logic. They travel to iOS for free.**

---

### 🟡 Needs Adapter — Platform-Specific Implementation Required

#### BLOCKER 1: Audio Engine

| Item | Detail |
|---|---|
| **Web implementation** | SoundTouchJS (WSOLA) + Web Audio API (`AudioContext`) |
| **Interface** | `IAudioEngine` in `src/platform/interfaces/IAudioEngine.ts` |
| **iOS Option A** | `AVAudioEngine + AVAudioUnitTimePitch` (native, built-in) |
| **iOS Option B** | SoundTouch C++ via Objective-C bridge (same WSOLA algorithm) |
| **iOS Option C** | AudioKit + PitchShifter node (community framework) |
| **Quality ranking** | SoundTouch C++ ≈ AudioKit > AVAudioUnitTimePitch |
| **Effort (Option A)** | ~1 week |
| **Effort (Option B)** | ~2–3 weeks |
| **Pitch unit conversion** | Web uses semitones. AVAudioUnitTimePitch uses **cents** (1 semitone = 100 cents) |
| **Tempo** | Both web and iOS use a rate factor (1.0 = normal) |

> **Recommendation:** Start with Option A (AVAudioEngine). If musicians detect quality loss during testing, upgrade to Option B (SoundTouch C++).

#### BLOCKER 2: Persistence

| Item | Detail |
|---|---|
| **Web implementation** | IndexedDB via `idb` library |
| **Interface** | `IStorage` in `src/platform/interfaces/IStorage.ts` |
| **iOS Swift** | SQLite with GRDB.swift, or Core Data |
| **React Native** | `@op-engineering/op-sqlite` (recommended) or `AsyncStorage` |
| **Data stored** | BPM, key, energy, gainOffset per track — small dataset |
| **Effort** | ~3–4 days |

#### BLOCKER 3: File Access

| Item | Detail |
|---|---|
| **Web implementation** | `fetch HEAD` for existence, `blob_url` for imports |
| **Interface** | `IFileAccess` in `src/platform/interfaces/IFileAccess.ts` |
| **iOS Swift** | `NSFileManager` + `UIDocumentPickerViewController` |
| **React Native** | `react-native-document-picker` + `react-native-fs` |
| **Catalog files** | Ship inside the app bundle (`.app/Resources/audio/`) |
| **User-imported files** | Copy to `Documents/` directory, persist path in user defaults |
| **Effort** | ~3–4 days |

---

## Effort Summary

```
Platform Abstraction Layer (web, no regression):    1 week
iOS — AVAudioEngine adapter:                        1 week
iOS — IStorage (SQLite/GRDB):                       3–4 days
iOS — IFileAccess (NSFileManager):                  3–4 days
iOS — SwiftUI UI (all screens):                     4–8 weeks
────────────────────────────────────────────────
Total without UI:                                   ~3–4 weeks
Total with SwiftUI UI:                              ~2–3 months
Total with React Native UI (iOS + Android):         ~2–3 months
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AVAudioEngine pitch quality not good enough | Medium | High | Prototype early, test with musicians, escalate to SoundTouch C++ |
| SoundTouch C++ bridge complexity | Low | Medium | Well-documented; used in production apps |
| iOS file sandbox model different from web | Low | Low | NSFileManager is more capable, not less |
| AudioContext latency on mobile | Medium | Medium | Use low-latency mode in AVAudioSession |
