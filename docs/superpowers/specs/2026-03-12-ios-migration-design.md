# SuniPlayer iOS Migration — Design Spec
**Date:** 2026-03-12
**Status:** Approved
**Author:** Brainstorming session with Omar

---

## Problem

SuniPlayer is a React 18 PWA built on browser-specific APIs (Web Audio API, IndexedDB, Blob URLs, SoundTouchJS). The goal is to evaluate and document a strategy to make the app fully viable as a native iOS application (Swift/SwiftUI first, then React Native for Android), ensuring any iOS developer or AI agent can implement it with precision.

---

## Goals

1. **Platform Abstraction Layer** — introduce `src/platform/` with TypeScript interfaces that isolate all browser-specific code from business logic.
2. **iOS Documentation Folder** — create `docs/iOS/` with complete technical guides, UI/UX references, data dictionaries, and implementation checklists.
3. **Zero regression** — the web app continues working without changes after the refactor.

---

## Approach: Interface-First Platform Abstraction

### Folder Structure

```
src/
  platform/
    interfaces/
      IAudioEngine.ts
      IStorage.ts
      IFileAccess.ts
    browser/
      BrowserAudioEngine.ts   ← wraps SoundTouchJS + Web Audio API
      IDBStorage.ts           ← wraps idb / IndexedDB
      BlobFileAccess.ts       ← wraps fetch HEAD + blob_url
    index.ts                  ← exports active platform instances

docs/
  iOS/
    README.md
    01-viability-assessment.md
    02-architecture.md
    03-audio-engine.md
    04-storage.md
    05-file-access.md
    06-ui-ux-reference.md
    07-data-models.md
    08-business-logic-portable.md
    09-react-native-path.md
    10-implementation-checklist.md
```

---

## Interfaces

### IAudioEngine

```ts
interface IAudioEngine {
  load(url: string, options: AudioLoadOptions): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  seek(positionMs: number): void;
  setPitch(semitones: number): void;   // -12 to +12
  setTempo(rate: number): void;        // 0.8 to 1.2
  setVolume(volume: number): void;     // 0.0 to 1.0
  onPositionUpdate(cb: (posMs: number) => void): void;
  onEnded(cb: () => void): void;
  onError(cb: (err: Error) => void): void;
  dispose(): void;
}
```

**iOS mapping:** `AVAudioEngine + AVAudioUnitTimePitch` (semitones × 100 = cents).
**Professional iOS:** SoundTouch C++ (same WSOLA algorithm as web).

### IStorage

```ts
interface IStorage {
  getAnalysis(trackId: string): Promise<AnalysisData | null>;
  saveAnalysis(trackId: string, data: AnalysisData): Promise<void>;
  getWaveform(trackId: string): Promise<number[] | null>;
  saveWaveform(trackId: string, data: number[]): Promise<void>;
}
```

**iOS mapping:** Core Data or SQLite.
**React Native mapping:** `@op-engineering/op-sqlite` or AsyncStorage.

### IFileAccess

```ts
interface IFileAccess {
  checkExists(filePath: string): Promise<boolean>;
  resolveURL(filePath: string): string;
  importFile(source: FileSource): Promise<ImportedFile>;
}
```

**iOS mapping:** `NSFileManager` + `UIDocumentPickerViewController`.

---

## Viability Verdict

| Component | Portability | Effort | iOS Solution |
|---|---|---|---|
| Zustand stores | ✅ 100% portable | 0 | Use as-is in RN |
| setBuilderService | ✅ 100% portable | 0 | Use as-is |
| types.ts / Track | ✅ 100% portable | 0 | Swift structs |
| showSessionStorage | ✅ trivial | ~1 day | AsyncStorage |
| IAudioEngine | 🟡 needs adapter | 1–3 weeks | AVAudioEngine or SoundTouch C++ |
| IStorage | 🟡 needs adapter | 3–4 days | Core Data / SQLite |
| IFileAccess | 🟡 needs adapter | 3–4 days | NSFileManager |
| UI (SwiftUI) | 🔴 full rewrite | 4–8 weeks | SwiftUI components |
| UI (React Native) | 🟡 adapt | 3–5 weeks | RN + same Zustand stores |

---

## docs/iOS/ Folder Contents

Each document must contain:
- **Purpose** — what this module does in SuniPlayer
- **Web implementation** — how it works today (code references)
- **iOS implementation** — recommended Swift/RN approach
- **Data dictionary** — all types, fields, units
- **Diagrams** — architecture flows in ASCII/Mermaid
- **UI/UX reference** — web screenshots described + SwiftUI equivalent layout
- **Checklist** — step-by-step implementation tasks

---

## Testing Strategy

- Browser implementations keep existing Vitest tests.
- Each interface gets a mock implementation usable in any test environment.
- iOS adapters tested with XCTest (Swift) or Jest (RN).
- Business logic tests (stores, setBuilder) run unchanged on all platforms.

---

## Out of Scope

- App Store submission process
- Push notifications
- Background audio (iOS background mode — future phase)
- Cloud sync / iCloud Drive

---

## Success Criteria

1. `src/platform/interfaces/` contains 3 well-typed interfaces.
2. `src/platform/browser/` contains 3 implementations with zero behavior change.
3. `src/services/useAudio.ts` and `src/services/db.ts` import only from `src/platform/index.ts`.
4. All 31 existing tests still pass.
5. `docs/iOS/` contains 10 documents covering every module an iOS developer needs.
