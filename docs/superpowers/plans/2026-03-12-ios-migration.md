# SuniPlayer iOS Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use `superpowers:subagent-driven-development` (if subagents available) or `superpowers:executing-plans` to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a Platform Abstraction Layer in the web codebase + produce a complete `docs/iOS/` reference folder that lets any iOS/React Native developer implement SuniPlayer natively with zero guesswork.

**Architecture:** Three TypeScript interfaces (`IAudioEngine`, `IStorage`, `IFileAccess`) isolate all browser-specific code. Current code is wrapped in `BrowserAudioEngine`, `IDBStorage`, `BlobFileAccess` adapters. Business logic (Zustand stores, setBuilder, types) is already portable and unchanged. The `docs/iOS/` folder contains 10 detailed markdown documents covering every module, data model, and UI screen.

**Tech Stack:** React 18, TypeScript, Zustand, SoundTouchJS, idb, Vitest. iOS targets: Swift/SwiftUI + AVAudioEngine, with SoundTouch C++ as the professional audio path. React Native path also documented.

**Spec:** `docs/superpowers/specs/2026-03-12-ios-migration-design.md`

---

## Chunk 1: Platform Abstraction Layer (Code)

### File Map

| Action | Path | Responsibility |
|---|---|---|
| CREATE | `src/platform/interfaces/IAudioEngine.ts` | Audio engine contract |
| CREATE | `src/platform/interfaces/IStorage.ts` | Persistence contract |
| CREATE | `src/platform/interfaces/IFileAccess.ts` | File access contract |
| CREATE | `src/platform/browser/BrowserAudioEngine.ts` | Wraps PitchEngine + HTMLAudioElement |
| CREATE | `src/platform/browser/IDBStorage.ts` | Wraps idb / IndexedDB |
| CREATE | `src/platform/browser/BlobFileAccess.ts` | Wraps fetch HEAD + blob_url |
| CREATE | `src/platform/index.ts` | Exports active platform instances |
| MODIFY | `src/services/db.ts` | Export `AnalysisData`, `WaveformData` types only |
| MODIFY | `src/services/audioProbe.ts` | Use `fileAccess` from platform |
| MODIFY | `src/services/useAudio.ts` | Import `audioEngine` from platform |
| MODIFY | `src/pages/Library.tsx` | Import `storage` from platform |

---

### Task 1: Define `IAudioEngine` interface

**Files:**
- Create: `src/platform/interfaces/IAudioEngine.ts`

- [ ] **Step 1: Create the interface file**

```typescript
// src/platform/interfaces/IAudioEngine.ts

export interface AudioLoadOptions {
    startMs?: number;
    endMs?: number;
    initialPitch?: number;   // semitones, -12 to +12
    initialTempo?: number;   // factor, 0.8 to 1.2
    initialVolume?: number;  // 0.0 to 1.0
}

/**
 * IAudioEngine — Contract for audio playback with pitch/tempo control.
 *
 * Semitone convention: -12 = one octave down, +12 = one octave up.
 * Tempo convention: 1.0 = normal speed, 0.8 = 20% slower, 1.2 = 20% faster.
 *
 * iOS note: AVAudioUnitTimePitch.pitch uses CENTS (1 semitone = 100 cents).
 * Multiply semitones × 100 when setting pitch in AVAudioEngine adapters.
 */
export interface IAudioEngine {
    /** Load a track URL and prepare for playback. Resolves when ready. */
    load(url: string, options?: AudioLoadOptions): Promise<void>;

    play(): Promise<void>;
    pause(): void;
    seek(positionMs: number): void;

    /** Set pitch in semitones. Applies immediately even while playing. */
    setPitch(semitones: number): void;

    /** Set tempo factor (0.8–1.2). Applies immediately even while playing. */
    setTempo(rate: number): void;

    setVolume(volume: number): void;

    /** Register a callback called every ~250ms with current position in ms. */
    onPositionUpdate(cb: (posMs: number) => void): void;

    /** Fires when the track reaches its end. */
    onEnded(cb: () => void): void;

    /** Fires on unrecoverable audio error. */
    onError(cb: (err: Error) => void): void;

    /** Release all resources. Must be called on component unmount. */
    dispose(): void;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /c/Users/omare/.claude/projects/SuniPlayer
npx tsc --noEmit
```
Expected: No errors related to new file.

- [ ] **Step 3: Commit**

```bash
git add src/platform/interfaces/IAudioEngine.ts
git commit -m "feat(platform): add IAudioEngine interface"
```

---

### Task 2: Define `IStorage` and `IFileAccess` interfaces

**Files:**
- Create: `src/platform/interfaces/IStorage.ts`
- Create: `src/platform/interfaces/IFileAccess.ts`

- [ ] **Step 1: Create IStorage**

```typescript
// src/platform/interfaces/IStorage.ts

export interface AnalysisData {
    id: string;
    bpm: number;
    key: string;
    energy: number;
    gainOffset: number;
    timestamp: number;
}

/**
 * IStorage — Contract for caching audio analysis results and waveforms.
 *
 * Web: IndexedDB (via idb library)
 * iOS: Core Data or SQLite (recommended: SQLite with GRDB.swift)
 * React Native: @op-engineering/op-sqlite or AsyncStorage
 */
export interface IStorage {
    getAnalysis(trackId: string): Promise<AnalysisData | null>;
    saveAnalysis(trackId: string, data: Partial<AnalysisData>): Promise<void>;
    getWaveform(trackId: string): Promise<number[] | null>;
    saveWaveform(trackId: string, data: number[]): Promise<void>;
}
```

- [ ] **Step 2: Create IFileAccess**

```typescript
// src/platform/interfaces/IFileAccess.ts

export interface ImportedFile {
    /** Playable URL (blob URL on web, file:// URI on iOS/Android) */
    url: string;
    /** Original filename */
    name: string;
    /** MIME type if available */
    mimeType?: string;
    /** File size in bytes */
    sizeBytes?: number;
}

export type FileSource =
    | { type: "picker" }         // user picks a file via OS dialog
    | { type: "url"; url: string }; // from a known URL

/**
 * IFileAccess — Contract for audio file access and import.
 *
 * Web: fetch HEAD for existence, blob URL for imports
 * iOS: NSFileManager + UIDocumentPickerViewController
 * React Native: react-native-document-picker + react-native-fs
 */
export interface IFileAccess {
    /**
     * Check if an audio file exists.
     * filePath is bare (e.g. "Song.mp3") — implementation resolves to full URL.
     */
    checkExists(filePath: string): Promise<boolean>;

    /**
     * Resolve a bare file_path to a playable URL.
     * Web: "/audio/Song.mp3"
     * iOS bundle: "bundle://Song.mp3"
     * iOS imported: file:// URI from Documents directory
     */
    resolveURL(filePath: string): string;

    /** Let the user pick a file from the device. Returns null if cancelled. */
    importFile(source: FileSource): Promise<ImportedFile | null>;
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/platform/interfaces/IStorage.ts src/platform/interfaces/IFileAccess.ts
git commit -m "feat(platform): add IStorage and IFileAccess interfaces"
```

---

### Task 3: Browser adapter — `IDBStorage`

**Files:**
- Create: `src/platform/browser/IDBStorage.ts`

- [ ] **Step 1: Create adapter (wraps existing db.ts logic)**

```typescript
// src/platform/browser/IDBStorage.ts
import { openDB, IDBPDatabase } from 'idb';
import type { IStorage, AnalysisData } from '../interfaces/IStorage';

const DB_NAME = 'SuniPlayerDB';
const DB_VERSION = 1;
const STORE_WAVEFORMS = 'waveforms';
const STORE_METRICS = 'analysis';

export class IDBStorage implements IStorage {
    private db: IDBPDatabase | null = null;

    private async getDB(): Promise<IDBPDatabase> {
        if (this.db) return this.db;
        this.db = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_WAVEFORMS)) {
                    db.createObjectStore(STORE_WAVEFORMS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORE_METRICS)) {
                    db.createObjectStore(STORE_METRICS, { keyPath: 'id' });
                }
            },
        });
        return this.db;
    }

    async getAnalysis(trackId: string): Promise<AnalysisData | null> {
        const db = await this.getDB();
        return await db.get(STORE_METRICS, trackId) ?? null;
    }

    async saveAnalysis(trackId: string, data: Partial<AnalysisData>): Promise<void> {
        const db = await this.getDB();
        const existing = (await db.get(STORE_METRICS, trackId)) || { id: trackId, timestamp: Date.now() };
        await db.put(STORE_METRICS, { ...existing, ...data, timestamp: Date.now() });
    }

    async getWaveform(trackId: string): Promise<number[] | null> {
        const db = await this.getDB();
        const entry = await db.get(STORE_WAVEFORMS, trackId);
        return entry ? entry.data : null;
    }

    async saveWaveform(trackId: string, data: number[]): Promise<void> {
        const db = await this.getDB();
        await db.put(STORE_WAVEFORMS, { id: trackId, data, timestamp: Date.now() });
    }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/platform/browser/IDBStorage.ts
git commit -m "feat(platform): add IDBStorage browser adapter"
```

---

### Task 4: Browser adapter — `BlobFileAccess`

**Files:**
- Create: `src/platform/browser/BlobFileAccess.ts`

- [ ] **Step 1: Create adapter**

```typescript
// src/platform/browser/BlobFileAccess.ts
import type { IFileAccess, ImportedFile, FileSource } from '../interfaces/IFileAccess';

const AUDIO_PREFIX = '/audio/';

export class BlobFileAccess implements IFileAccess {
    async checkExists(filePath: string): Promise<boolean> {
        const url = this.resolveURL(filePath);
        try {
            const res = await fetch(url, { method: 'HEAD' });
            return res.ok;
        } catch {
            return false;
        }
    }

    resolveURL(filePath: string): string {
        if (filePath.startsWith('/') || filePath.startsWith('blob:')) return filePath;
        return `${AUDIO_PREFIX}${encodeURIComponent(filePath)}`;
    }

    async importFile(source: FileSource): Promise<ImportedFile | null> {
        if (source.type === 'url') {
            return { url: source.url, name: source.url.split('/').pop() ?? 'audio' };
        }
        // Browser file picker via hidden input
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'audio/*';
            input.onchange = () => {
                const file = input.files?.[0];
                if (!file) { resolve(null); return; }
                resolve({
                    url: URL.createObjectURL(file),
                    name: file.name,
                    mimeType: file.type,
                    sizeBytes: file.size,
                });
            };
            input.oncancel = () => resolve(null);
            input.click();
        });
    }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/platform/browser/BlobFileAccess.ts
git commit -m "feat(platform): add BlobFileAccess browser adapter"
```

---

### Task 5: Browser adapter — `BrowserAudioEngine`

**Files:**
- Create: `src/platform/browser/BrowserAudioEngine.ts`

Note: `useAudio.ts` (the React hook) manages state sync with Zustand and stays as-is. `BrowserAudioEngine` wraps `PitchEngine` (the class-based engine) to satisfy `IAudioEngine`.

- [ ] **Step 1: Create adapter**

```typescript
// src/platform/browser/BrowserAudioEngine.ts
import { PitchEngine } from '../../services/pitchEngine';
import type { IAudioEngine, AudioLoadOptions } from '../interfaces/IAudioEngine';

/**
 * BrowserAudioEngine — wraps PitchEngine (SoundTouchJS + Web Audio API)
 * to satisfy the IAudioEngine interface.
 *
 * iOS equivalent: NativeAudioEngine wrapping AVAudioEngine + AVAudioUnitTimePitch
 * Professional iOS: NativeAudioEngine wrapping SoundTouch C++ via Objective-C bridge
 */
export class BrowserAudioEngine implements IAudioEngine {
    private engine: PitchEngine;

    constructor() {
        this.engine = new PitchEngine();
    }

    async load(url: string, options?: AudioLoadOptions): Promise<void> {
        await this.engine.load(url);
        if (options?.initialPitch !== undefined) this.setPitch(options.initialPitch);
        if (options?.initialTempo !== undefined) this.setTempo(options.initialTempo);
        if (options?.initialVolume !== undefined) this.setVolume(options.initialVolume);
    }

    async play(): Promise<void> {
        this.engine.play();
    }

    pause(): void {
        this.engine.pause();
    }

    seek(positionMs: number): void {
        this.engine.seek(positionMs / 1000); // PitchEngine uses seconds
    }

    setPitch(semitones: number): void {
        this.engine.setPitch(semitones);
    }

    setTempo(rate: number): void {
        this.engine.setTempo(rate);
    }

    setVolume(volume: number): void {
        this.engine.setVolume(volume);
    }

    onPositionUpdate(cb: (posMs: number) => void): void {
        this.engine.onTimeUpdate((sec) => cb(sec * 1000));
    }

    onEnded(cb: () => void): void {
        this.engine.onEnd(cb);
    }

    onError(cb: (err: Error) => void): void {
        // PitchEngine logs errors internally; surface via a custom event if needed
        (this.engine as any)._onError = cb;
    }

    dispose(): void {
        this.engine.dispose?.();
    }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/platform/browser/BrowserAudioEngine.ts
git commit -m "feat(platform): add BrowserAudioEngine adapter wrapping PitchEngine"
```

---

### Task 6: Platform `index.ts` — wire everything together

**Files:**
- Create: `src/platform/index.ts`

- [ ] **Step 1: Create platform entry point**

```typescript
// src/platform/index.ts

/**
 * Platform entry point — swap these implementations to target iOS or React Native.
 *
 * To add an iOS target:
 *   1. Create src/platform/ios/NativeAudioEngine.ts implementing IAudioEngine
 *   2. Create src/platform/ios/SQLiteStorage.ts implementing IStorage
 *   3. Create src/platform/ios/NativeFileAccess.ts implementing IFileAccess
 *   4. Replace the three imports below with the iOS versions
 *
 * All business logic (Zustand stores, setBuilderService, types.ts) imports
 * NOTHING from this file — it is only used by services and React hooks.
 */

import { BrowserAudioEngine } from './browser/BrowserAudioEngine';
import { IDBStorage } from './browser/IDBStorage';
import { BlobFileAccess } from './browser/BlobFileAccess';

export type { IAudioEngine, AudioLoadOptions } from './interfaces/IAudioEngine';
export type { IStorage, AnalysisData } from './interfaces/IStorage';
export type { IFileAccess, ImportedFile, FileSource } from './interfaces/IFileAccess';

export const audioEngine: InstanceType<typeof BrowserAudioEngine> = new BrowserAudioEngine();
export const storage: InstanceType<typeof IDBStorage> = new IDBStorage();
export const fileAccess: InstanceType<typeof BlobFileAccess> = new BlobFileAccess();
```

- [ ] **Step 2: Update `src/services/audioProbe.ts` to use platform**

Replace the fetch/HEAD logic in `probeOne` to delegate to `fileAccess`:

```typescript
// src/services/audioProbe.ts  (updated probeOne)
import { fileAccess, storage } from '../platform/index';
import { analyzeAudio, AnalysisResults } from './analysisService';

export async function probeOne(filePath: string): Promise<boolean> {
    return fileAccess.checkExists(filePath);
}

export async function analyzeTrack(url: string): Promise<AnalysisResults | null> {
    try {
        const cached = await storage.getAnalysis(url);
        if (cached) {
            return {
                bpm: cached.bpm,
                key: cached.key,
                energy: cached.energy,
                gainOffset: cached.gainOffset,
                waveform: await storage.getWaveform(url) || [],
            };
        }
    } catch (e) {
        console.error('Cache read failed', e);
    }
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtxClass();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        const analysis = await analyzeAudio(audioBuffer);
        await ctx.close();
        await storage.saveAnalysis(url, { id: url, bpm: analysis.bpm, key: analysis.key, energy: analysis.energy, gainOffset: analysis.gainOffset });
        await storage.saveWaveform(url, analysis.waveform);
        return analysis;
    } catch (e) {
        console.error('Probe/Analysis failed for', url, e);
        return null;
    }
}

export async function checkFileExists(url: string): Promise<boolean> {
    return fileAccess.checkExists(url);
}
```

- [ ] **Step 3: Run all tests — must be 31/31 green**

```bash
npm test -- --run
```

Expected output:
```
Test Files  11 passed (11)
Tests       31 passed (31)
```

If any test fails, investigate before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/platform/index.ts src/services/audioProbe.ts
git commit -m "feat(platform): wire platform index and update audioProbe to use IFileAccess + IStorage"
```

---

### Task 7: Final verification — Chunk 1

- [ ] **Step 1: TypeScript clean**

```bash
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 2: Full test run**

```bash
npm test -- --run
```
Expected: 31/31 passed.

- [ ] **Step 3: Verify folder structure**

```bash
ls src/platform/interfaces/ src/platform/browser/ src/platform/index.ts
```
Expected:
```
src/platform/interfaces/: IAudioEngine.ts  IFileAccess.ts  IStorage.ts
src/platform/browser/:    BlobFileAccess.ts  BrowserAudioEngine.ts  IDBStorage.ts
src/platform/index.ts
```

- [ ] **Step 4: Commit summary**

```bash
git log --oneline -8
```

---

## Chunk 2: `docs/iOS/` — Complete iOS Reference Documentation

### File Map

| File | Contents |
|---|---|
| `docs/iOS/README.md` | Navigation guide + quick-start for iOS devs |
| `docs/iOS/01-viability-assessment.md` | Verdict per module + effort estimates |
| `docs/iOS/02-architecture.md` | PAL diagram + how to swap adapters |
| `docs/iOS/03-audio-engine.md` | IAudioEngine → AVAudioEngine + SoundTouch C++ guide |
| `docs/iOS/04-storage.md` | IStorage → SQLite/Core Data guide |
| `docs/iOS/05-file-access.md` | IFileAccess → NSFileManager + DocPicker guide |
| `docs/iOS/06-ui-ux-reference.md` | Screen-by-screen layout + color/typography tokens → SwiftUI |
| `docs/iOS/07-data-models.md` | TypeScript types → Swift structs dictionary |
| `docs/iOS/08-business-logic-portable.md` | What travels for free + how to use it |
| `docs/iOS/09-react-native-path.md` | React Native alternative route |
| `docs/iOS/10-implementation-checklist.md` | Master checklist to build SuniPlayer iOS |

---

### Task 8: `README.md` + `01-viability-assessment.md`

**Files:**
- Create: `docs/iOS/README.md`
- Create: `docs/iOS/01-viability-assessment.md`

- [ ] **Step 1: Write README.md**

```markdown
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
```

- [ ] **Step 2: Write 01-viability-assessment.md**

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
git add docs/iOS/README.md docs/iOS/01-viability-assessment.md
git commit -m "docs(ios): add README and viability assessment"
```

---

### Task 9: `02-architecture.md` + `03-audio-engine.md`

**Files:**
- Create: `docs/iOS/02-architecture.md`
- Create: `docs/iOS/03-audio-engine.md`

- [ ] **Step 1: Write 02-architecture.md**

```markdown
# 02 — Architecture: Platform Abstraction Layer

## Overview

The Platform Abstraction Layer (PAL) separates business logic from platform APIs.
Business logic never imports from browser-specific libraries.
Only adapters import platform-specific code.

## Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│  (portable — same TypeScript code on Web, iOS, Android)     │
│                                                             │
│  usePlayerStore  useBuilderStore  useLibraryStore           │
│  setBuilderService  types.ts  Track  SetHistoryItem         │
└─────────────────────┬───────────────────────────────────────┘
                      │ imports from
┌─────────────────────▼───────────────────────────────────────┐
│                  src/platform/index.ts                       │
│                                                             │
│  export const audioEngine: IAudioEngine = new ...()         │
│  export const storage: IStorage = new ...()                 │
│  export const fileAccess: IFileAccess = new ...()           │
└──────┬──────────────────┬────────────────────┬─────────────┘
       │                  │                    │
┌──────▼──────┐  ┌────────▼──────┐  ┌─────────▼──────┐
│ IAudioEngine│  │   IStorage    │  │  IFileAccess   │
│  interface  │  │   interface   │  │   interface    │
└──────┬──────┘  └────────┬──────┘  └─────────┬──────┘
       │                  │                    │
┌──────▼──────────────────▼────────────────────▼──────┐
│              PLATFORM ADAPTERS                       │
│                                                     │
│  WEB:   BrowserAudioEngine  IDBStorage  BlobFileAccess│
│  iOS:   NativeAudioEngine   SQLiteStorage NativeFileAccess│
│  RN:    RNAudioEngine       SQLiteStorage RNFileAccess│
└─────────────────────────────────────────────────────┘
```

## How to Add an iOS Adapter

### Step 1 — Implement the three interfaces

```swift
// Swift pseudocode — actual implementation in NativeAudioEngine.swift
// Must satisfy all methods defined in IAudioEngine.ts
```

In TypeScript (React Native path):
```typescript
// src/platform/ios/NativeAudioEngine.ts
import TrackPlayer from 'react-native-track-player';
import type { IAudioEngine, AudioLoadOptions } from '../interfaces/IAudioEngine';

export class RNAudioEngine implements IAudioEngine {
    async load(url: string, options?: AudioLoadOptions): Promise<void> { ... }
    async play(): Promise<void> { await TrackPlayer.play(); }
    pause(): void { TrackPlayer.pause(); }
    // ... etc
}
```

### Step 2 — Swap in `src/platform/index.ts`

```typescript
// Replace these three lines:
import { BrowserAudioEngine } from './browser/BrowserAudioEngine';
import { IDBStorage } from './browser/IDBStorage';
import { BlobFileAccess } from './browser/BlobFileAccess';

// With:
import { RNAudioEngine } from './ios/NativeAudioEngine';
import { SQLiteStorage } from './ios/SQLiteStorage';
import { RNFileAccess } from './ios/NativeFileAccess';
```

That's the entire platform swap. No other file changes.

## Interface Locations

| Interface | File |
|---|---|
| `IAudioEngine` | `src/platform/interfaces/IAudioEngine.ts` |
| `IStorage` | `src/platform/interfaces/IStorage.ts` |
| `IFileAccess` | `src/platform/interfaces/IFileAccess.ts` |
| Platform entry | `src/platform/index.ts` |
```

- [ ] **Step 2: Write 03-audio-engine.md**

```markdown
# 03 — Audio Engine: Pitch + Tempo on iOS

## What SuniPlayer requires

- Play MP3/AAC audio files
- Change pitch in real-time (semitones: -12 to +12) WITHOUT changing tempo
- Change tempo in real-time (rate: 0.8 to 1.2) WITHOUT changing pitch
- Position tracking every ~250ms
- Fade in / fade out (volume ramp)
- Crossfade between tracks
- Works in background (iOS background audio mode)

## Interface Contract

```typescript
// src/platform/interfaces/IAudioEngine.ts
interface IAudioEngine {
    load(url: string, options?: AudioLoadOptions): Promise<void>;
    play(): Promise<void>;
    pause(): void;
    seek(positionMs: number): void;
    setPitch(semitones: number): void;   // semitones: -12 to +12
    setTempo(rate: number): void;        // rate: 0.8 to 1.2
    setVolume(volume: number): void;     // 0.0 to 1.0
    onPositionUpdate(cb: (posMs: number) => void): void;
    onEnded(cb: () => void): void;
    onError(cb: (err: Error) => void): void;
    dispose(): void;
}
```

---

## Option A: AVAudioEngine + AVAudioUnitTimePitch (Recommended Start)

### Key Conversion: Semitones → Cents

```
AVAudioUnitTimePitch.pitch uses CENTS, not semitones.
1 semitone = 100 cents

To raise by 2 semitones:  pitchNode.pitch = 200
To lower by 3 semitones:  pitchNode.pitch = -300
To raise 1 tone (2 semitones): pitchNode.pitch = 200
```

### Swift Implementation Skeleton

```swift
import AVFoundation

class NativeAudioEngine {
    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private let pitchNode = AVAudioUnitTimePitch()
    private var audioFile: AVAudioFile?

    init() {
        engine.attach(player)
        engine.attach(pitchNode)
        engine.connect(player, to: pitchNode, format: nil)
        engine.connect(pitchNode, to: engine.mainMixerNode, format: nil)

        // Enable background audio
        try? AVAudioSession.sharedInstance().setCategory(
            .playback, mode: .default
        )
        try? AVAudioSession.sharedInstance().setActive(true)
    }

    func load(url: URL) throws {
        audioFile = try AVAudioFile(forReading: url)
        try engine.start()
    }

    func play() {
        guard let file = audioFile else { return }
        player.scheduleFile(file, at: nil)
        player.play()
    }

    func pause() { player.pause() }

    /// semitones: -12 to +12
    func setPitch(_ semitones: Float) {
        pitchNode.pitch = semitones * 100  // Convert to cents
    }

    /// rate: 0.8 to 1.2
    func setTempo(_ rate: Float) {
        pitchNode.rate = rate
    }

    func setVolume(_ volume: Float) {
        engine.mainMixerNode.outputVolume = volume
    }
}
```

### Quality Profile

| Characteristic | Rating |
|---|---|
| Pitch accuracy | Good (Apple algorithm) |
| Tempo accuracy | Good |
| Latency | Low (native DSP) |
| CPU usage | Low |
| Dependencies | None (built-in iOS) |
| Min iOS version | iOS 8+ |

---

## Option B: SoundTouch C++ (Professional Quality — Same as Web)

SoundTouch is the **exact same library** used in SuniPlayer's web version (via SoundTouchJS).
The C++ core produces identical WSOLA output on iOS.

### Integration Steps

1. Add SoundTouch via Swift Package Manager or CocoaPods:
```
// Package.swift
.package(url: "https://github.com/breakfastquay/rubberband", ...)
// OR use SoundTouch directly:
// https://www.surina.net/soundtouch/
```

2. Create an Objective-C++ wrapper (`SoundTouchBridge.mm`):
```objc
#import "SoundTouchBridge.h"
#import "SoundTouch.h"

@implementation SoundTouchBridge {
    soundtouch::SoundTouch _st;
}

- (void)setPitch:(float)semitones {
    _st.setPitchSemiTones(semitones);
}

- (void)setTempo:(float)rate {
    _st.setTempo(rate);
}

- (void)processBuffer:(float*)input output:(float*)output samples:(int)n {
    _st.putSamples(input, n);
    _st.receiveSamples(output, n);
}
@end
```

3. Feed audio samples through the SoundTouch processor before sending to AVAudioEngine output node.

### Quality Profile

| Characteristic | Rating |
|---|---|
| Pitch accuracy | Excellent (WSOLA — identical to web) |
| Tempo accuracy | Excellent |
| Latency | Low |
| CPU usage | Medium |
| Dependencies | SoundTouch C++ library (~200KB) |
| Min iOS version | iOS 12+ recommended |

---

## Option C: AudioKit (High-Level Framework)

```swift
import AudioKit

let player = AudioPlayer(file: audioFile)
let shifter = TimePitch(player)
shifter.pitch = semitones * 100  // cents
shifter.rate = tempoRate
AudioManager.output = shifter
try AudioManager.start()
```

GitHub: https://github.com/AudioKit/AudioKit
Quality: Very good. Easier than AVAudioEngine. Large community.

---

## Background Audio (Required for Stage Use)

Add to `Info.plist`:
```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

Configure `AVAudioSession`:
```swift
try AVAudioSession.sharedInstance().setCategory(
    .playback,
    mode: .default,
    options: [.mixWithOthers]  // remove if exclusive audio needed
)
```

---

## Unit Conversion Reference

| Web (SoundTouchJS) | iOS AVAudioEngine | iOS SoundTouch C++ |
|---|---|---|
| `semitones = 2` | `pitchNode.pitch = 200` | `_st.setPitchSemiTones(2)` |
| `tempo = 1.1` | `pitchNode.rate = 1.1` | `_st.setTempo(1.1)` |
| `volume = 0.85` | `mixerNode.outputVolume = 0.85` | N/A (handle in AVAudioEngine) |
```

- [ ] **Step 3: Commit**

```bash
git add docs/iOS/02-architecture.md docs/iOS/03-audio-engine.md
git commit -m "docs(ios): add architecture and audio engine guides"
```

---

### Task 10: `04-storage.md` + `05-file-access.md`

**Files:**
- Create: `docs/iOS/04-storage.md`
- Create: `docs/iOS/05-file-access.md`

- [ ] **Step 1: Write 04-storage.md**

```markdown
# 04 — Storage: Audio Analysis Cache

## What SuniPlayer stores

| Data | Purpose | Size estimate |
|---|---|---|
| BPM | Set builder algorithm needs this | Float, per track |
| Key (musical) | Display + transpose logic | String, e.g. "C Major" |
| Energy | Curve-based set building | Float 0–1 |
| Gain offset | Auto-normalize playback volume | Float, per track |
| Waveform | Visual waveform display in player | Array of ~200 floats |

## Interface Contract

```typescript
// src/platform/interfaces/IStorage.ts
interface IStorage {
    getAnalysis(trackId: string): Promise<AnalysisData | null>;
    saveAnalysis(trackId: string, data: Partial<AnalysisData>): Promise<void>;
    getWaveform(trackId: string): Promise<number[] | null>;
    saveWaveform(trackId: string, data: number[]): Promise<void>;
}

interface AnalysisData {
    id: string;       // track file_path used as key
    bpm: number;
    key: string;      // e.g. "C Major", "F# Minor"
    energy: number;   // 0.0 to 1.0
    gainOffset: number;  // normalization multiplier
    timestamp: number;   // Unix ms, for cache invalidation
}
```

## iOS Swift — SQLite with GRDB.swift (Recommended)

```swift
import GRDB

struct AnalysisRecord: Codable, FetchableRecord, PersistableRecord {
    var id: String
    var bpm: Double
    var key: String
    var energy: Double
    var gainOffset: Double
    var timestamp: Int64
    var waveformJSON: String  // JSON-encoded [Double] array

    static let databaseTableName = "analysis"
}

class SQLiteStorage: IStorageProtocol {
    private var dbQueue: DatabaseQueue

    init() throws {
        let dbPath = FileManager.default
            .urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("suniplayer.db").path
        dbQueue = try DatabaseQueue(path: dbPath)
        try migrate()
    }

    func getAnalysis(_ trackId: String) async throws -> AnalysisRecord? {
        try await dbQueue.read { db in
            try AnalysisRecord.fetchOne(db, key: trackId)
        }
    }

    func saveAnalysis(_ trackId: String, data: AnalysisRecord) async throws {
        try await dbQueue.write { db in
            try data.save(db)
        }
    }
}
```

## React Native — op-sqlite (Recommended)

```typescript
import { open } from '@op-engineering/op-sqlite';

const db = open({ name: 'suniplayer.db' });

db.execute(`CREATE TABLE IF NOT EXISTS analysis (
    id TEXT PRIMARY KEY,
    bpm REAL, key TEXT, energy REAL,
    gainOffset REAL, timestamp INTEGER,
    waveform TEXT
)`);

async function getAnalysis(trackId: string): Promise<AnalysisData | null> {
    const result = db.execute('SELECT * FROM analysis WHERE id = ?', [trackId]);
    return result.rows?.[0] ?? null;
}
```

## Key differences from IndexedDB

| Feature | IndexedDB (Web) | SQLite (iOS/RN) |
|---|---|---|
| Query language | Key-value only | Full SQL |
| Typed columns | No | Yes |
| Performance | Good | Better |
| Schema migration | Manual | GRDB migrations |
| Size limit | Browser-managed | Device storage |
```

- [ ] **Step 2: Write 05-file-access.md**

```markdown
# 05 — File Access: Audio Files on iOS

## Two categories of files

| Category | Web | iOS |
|---|---|---|
| Catalog tracks | Served by Vite dev server `/audio/*.mp3` | Bundled in `.app/Resources/audio/` |
| User-imported | `blob:` URL from File API | Copied to `Documents/audio/` directory |

## Interface Contract

```typescript
interface IFileAccess {
    checkExists(filePath: string): Promise<boolean>;
    resolveURL(filePath: string): string;
    importFile(source: FileSource): Promise<ImportedFile | null>;
}
```

## iOS Swift Implementation

```swift
import UIKit

class NativeFileAccess: NSObject, UIDocumentPickerDelegate {
    private let fm = FileManager.default

    var documentsURL: URL {
        fm.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("audio")
    }

    func checkExists(_ filePath: String) async -> Bool {
        // First check app bundle (catalog tracks)
        if Bundle.main.url(forResource: filePath, withExtension: nil) != nil {
            return true
        }
        // Then check Documents/audio/ (user-imported)
        return fm.fileExists(atPath: documentsURL.appendingPathComponent(filePath).path)
    }

    func resolveURL(_ filePath: String) -> URL {
        // Catalog track
        if let bundleURL = Bundle.main.url(forResource: filePath, withExtension: nil) {
            return bundleURL
        }
        // User-imported track
        return documentsURL.appendingPathComponent(filePath)
    }

    func importFile() -> URL? {
        // Present UIDocumentPickerViewController
        // Return file:// URL after copying to Documents/audio/
        // (Implement as async/await with continuation)
    }
}
```

## Catalog Track Packaging

Place MP3 files in the Xcode project under:
```
SuniPlayer.app/
  Resources/
    audio/
      I Just Might in JAZZ style.mp3
      Just The Way You Are.mp3
      ...
```

In Xcode: Add files to target → "Copy Bundle Resources".

## User-Imported File Flow

```
User taps Import
    ↓
UIDocumentPickerViewController (shows Files app)
    ↓
User selects .mp3 file
    ↓
Copy to Documents/audio/<original-filename>
    ↓
Save file_path to useLibraryStore (via AsyncStorage/UserDefaults)
    ↓
resolveURL(file_path) → file:// URI for AVAudioPlayer
```
```

- [ ] **Step 3: Commit**

```bash
git add docs/iOS/04-storage.md docs/iOS/05-file-access.md
git commit -m "docs(ios): add storage and file access guides"
```

---

### Task 11: `06-ui-ux-reference.md`

**Files:**
- Create: `docs/iOS/06-ui-ux-reference.md`

- [ ] **Step 1: Write the UI/UX reference**

```markdown
# 06 — UI/UX Reference: Web → SwiftUI

## Design Tokens

### Colors (from `src/data/theme.ts`)

| Token | Hex | SwiftUI |
|---|---|---|
| Background | `#0A0E14` | `Color(hex: "0A0E14")` |
| Surface | `rgba(255,255,255,0.02)` | `Color.white.opacity(0.02)` |
| Border | `rgba(255,255,255,0.04)` | `Color.white.opacity(0.04)` |
| Text primary | `#F0F4F8` | `Color(hex: "F0F4F8")` |
| Text secondary | `rgba(255,255,255,0.4)` | `Color.white.opacity(0.4)` |
| Text muted | `rgba(255,255,255,0.25)` | `Color.white.opacity(0.25)` |
| Brand cyan | `#06B6D4` | `Color(hex: "06B6D4")` |
| Brand violet | `#8B5CF6` | `Color(hex: "8B5CF6")` |
| Brand pink | `#EC4899` | `Color(hex: "EC4899")` |
| Status success | `#10B981` | `Color(hex: "10B981")` |
| Status warning | `#F59E0B` | `Color(hex: "F59E0B")` |
| Status error | `#EF4444` | `Color(hex: "EF4444")` |

### Typography (from `src/data/theme.ts`)

| Usage | Web | SwiftUI |
|---|---|---|
| Body | `DM Sans` | `.body` with custom font or SF Pro |
| Mono | `JetBrains Mono` | `.system(.body, design: .monospaced)` |
| Track title | 36px, weight 900 | `.largeTitle.bold()` |
| Section header | 32px, weight 700 | `.title.bold()` |
| Track row label | 16px, weight 600 | `.headline` |

### Border Radius

| Token | Value | SwiftUI |
|---|---|---|
| sm | 6px | `.cornerRadius(6)` |
| md | 8px | `.cornerRadius(8)` |
| lg | 10px | `.cornerRadius(10)` |
| xl | 12px | `.cornerRadius(12)` |
| full | 99px | `.clipShape(Capsule())` |

---

## Screen Layouts

### Screen 1: Player

```
┌─────────────────────────────┐
│  ← [back]     SUNI    [⚙️]  │  ← NavigationBar
├─────────────────────────────┤
│                             │
│  ████  Track Title          │  ← HStack: artwork + VStack(title, artist)
│        Artist Name          │    title: largeTitle.bold, cyan accent
│        [KEY] [BPM] [♩ 1.0x] │    badges: capsule, border color
│                             │
│  ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░  │  ← Waveform + scrubber (custom view)
│  1:23              3:45     │    position left, duration right, muted text
│                             │
│  [◀◀]  [⏸]  [▶▶]          │  ← HStack, iconSize 44pt, brand cyan
│  [FADE] [CROSS] [LOOP]     │  ← mode toggles, smaller, secondary text
│                             │
│  ────── QUEUE ──────────── │  ← Section header
│  ○ Song 2    Artist   3:12  │  ← List rows
│  ○ Song 3    Artist   4:05  │
└─────────────────────────────┘
```

**Key interactions:**
- Tap waveform to seek
- Swipe track row to remove from queue
- Long-press track row to see profile modal
- Pull down for now-playing fullscreen

---

### Screen 2: Library

```
┌─────────────────────────────┐
│  Tu Biblioteca Local        │  ← Large title
│  Sincronizada con: /music   │  ← Subtitle, muted
│              [+ Importar]   │  ← Brand cyan button
├─────────────────────────────┤
│  🔍 Buscar...               │  ← Search bar
├─────────────────────────────┤
│  ● Song Title          ●   │  ← TrackRow
│    Artist  •  3:45  •  C♯  │    key badge in cyan
│    [▶ Preview] [✎] [+Queue]│    action buttons
│  ─────────────────────────  │
│  ● Song Title 2        ●   │
│    Artist  •  4:12  •  G   │
└─────────────────────────────┘
```

**TrackRow actions (swipe or context menu):**
- Add to queue
- Edit profile (pitch, tempo, trim, notes)
- View sheet music

---

### Screen 3: Set Builder

```
┌─────────────────────────────┐
│  Constructor de Sets        │  ← Title
├─────────────────────────────┤
│  Duración objetivo          │
│  [−] ──●──────── [+]  45min │  ← Slider, brand cyan
│                             │
│  Venue    [Lobby ▾]         │  ← Picker
│  Curva    [Estable ▾]       │  ← Picker
│  BPM      [80 – 140]        │  ← Range slider
│                             │
│       [GENERAR SET]         │  ← Large brand button, gradient bg
├─────────────────────────────┤
│  Set Generado (45:12)       │  ← Section header with duration
│  1. Song Title    3:45 C♯  │  ← Ordered list
│  2. Song Title 2  4:12 G   │
│  3. ...                     │
│                             │
│  [REPRODUCIR] [GUARDAR]     │  ← Action buttons
└─────────────────────────────┘
```

---

### Screen 4: Track Profile Modal

```
┌─────────────────────────────┐
│  [✕]  Perfil: Song Title    │  ← Modal header
├─────────────────────────────┤
│  🎵 PREVIEW  [▶ 30s]        │  ← Play 30-second preview
├─────────────────────────────┤
│  Tono          [−] 0 [+]    │  ← Pitch in semitones, stepper
│  Tempo         [−●──] 1.0x  │  ← Tempo slider 0.8–1.2
│  Inicio        00:00        │  ← Trim start, time picker
│  Fin           03:45        │  ← Trim end
│  Notas         [campo texto]│
│  Tonalidad     C Major      │  ← Display only
│  BPM           128          │  ← Display only
├─────────────────────────────┤
│  Partitura                  │
│  [+ Agregar PDF]            │
│  [doc.pdf] [✕]             │
├─────────────────────────────┤
│           [GUARDAR]         │
└─────────────────────────────┘
```

---

### Navigation Structure

```
TabView (bottom tabs)
├── Player (▶️)
├── Library (🎵)
├── Builder (🎚️)
└── History (📋)
```

Web uses `BottomNav.tsx` with 4 items. iOS uses `TabView` with equivalent structure.

---

## SwiftUI Color Extension

```swift
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

// Usage:
Color(hex: "06B6D4")  // brand cyan
Color(hex: "8B5CF6")  // brand violet
Color(hex: "0A0E14")  // background
```
```

- [ ] **Step 2: Commit**

```bash
git add docs/iOS/06-ui-ux-reference.md
git commit -m "docs(ios): add UI/UX reference with SwiftUI equivalents"
```

---

### Task 12: `07-data-models.md` + `08-business-logic-portable.md`

**Files:**
- Create: `docs/iOS/07-data-models.md`
- Create: `docs/iOS/08-business-logic-portable.md`

- [ ] **Step 1: Write 07-data-models.md**

```markdown
# 07 — Data Models: TypeScript → Swift Dictionary

## Track (core entity)

```typescript
// TypeScript (src/types.ts)
interface Track {
    id: string;
    title: string;
    artist: string;
    composer?: string;
    tags?: string[];
    duration_ms: number;      // milliseconds
    bpm: number;
    key: string;              // e.g. "C Major", "F# Minor"
    energy: number;           // 0.0 to 1.0
    mood: string;
    file_path: string;        // relative path e.g. "Song.mp3"
    analysis_cached: boolean;
    blob_url?: string;        // iOS equivalent: file:// URI for imported files
    notes?: string;
    isCustom?: boolean;
    targetKey?: string;
    transposeSemitones?: number;  // saved pitch shift
    playbackTempo?: number;       // saved tempo factor
    startTime?: number;       // ms — trim start
    endTime?: number;         // ms — trim end
    waveform?: number[];      // ~200 floats, 0.0–1.0
    gainOffset?: number;      // volume normalization multiplier
    playCount?: number;
    totalPlayTimeMs?: number;
    lastPlayedAt?: string;    // ISO 8601
    sheetMusic?: SheetMusicRef[];
}
```

```swift
// Swift equivalent
struct Track: Codable, Identifiable {
    let id: String
    var title: String
    var artist: String
    var composer: String?
    var tags: [String]?
    var durationMs: Int           // milliseconds
    var bpm: Double
    var key: String               // e.g. "C Major"
    var energy: Double            // 0.0 to 1.0
    var mood: String
    var filePath: String          // relative path
    var analysisCached: Bool
    var fileURL: URL?             // iOS: file:// URI for imported tracks
    var notes: String?
    var isCustom: Bool?
    var targetKey: String?
    var transposeSemitones: Double?  // pitch shift in semitones
    var playbackTempo: Double?       // tempo factor 0.8–1.2
    var startTimeMs: Int?            // trim start in ms
    var endTimeMs: Int?              // trim end in ms
    var waveform: [Double]?
    var gainOffset: Double?
    var playCount: Int?
    var totalPlayTimeMs: Int?
    var lastPlayedAt: Date?
    var sheetMusic: [SheetMusicRef]?
}
```

## SetHistoryItem

```typescript
// TypeScript
interface SetHistoryItem {
    id: string;
    name: string;
    tracks: Track[];
    total: number;    // total duration in ms
    target: number;   // target duration in seconds
    venue: string;
    curve: string;
    date: string;     // ISO 8601
}
```

```swift
struct SetHistoryItem: Codable, Identifiable {
    let id: String
    var name: String
    var tracks: [Track]
    var total: Int      // ms
    var target: Int     // seconds
    var venue: String
    var curve: String
    var date: Date
}
```

## Venue

```typescript
interface Venue { id: string; label: string; color: string; }
```

```swift
struct Venue: Identifiable {
    let id: String
    let label: String
    let color: String  // hex
}

// Catalog (same values as src/data/constants.ts VENUES)
let venues: [Venue] = [
    Venue(id: "lobby",    label: "Lobby",    color: "#06B6D4"),
    Venue(id: "dinner",   label: "Cena",     color: "#8B5CF6"),
    Venue(id: "cocktail", label: "Cocktail", color: "#F59E0B"),
    Venue(id: "event",    label: "Evento",   color: "#EF4444"),
    Venue(id: "cruise",   label: "Crucero",  color: "#10B981"),
]
```

## Energy Curves

```swift
enum Curve: String, CaseIterable {
    case steady     = "steady"
    case ascending  = "ascending"
    case descending = "descending"
    case wave       = "wave"

    var label: String {
        switch self {
        case .steady:     return "Estable"
        case .ascending:  return "Ascendente"
        case .descending: return "Descendente"
        case .wave:       return "Ola"
        }
    }
}
```

## Key Musical Terminology (used in UI strings)

| Key (en) | Display (es) | Notes |
|---|---|---|
| "C Major" | "Do Mayor" | Display in Spanish in UI |
| "F# Minor" | "Fa# Menor" | |
| transposeSemitones | Tono | -12 to +12 semitones |
| playbackTempo | Tempo | 0.8x to 1.2x |
| startTime / endTime | Inicio / Fin | Trim points in ms |
| bpm | BPM | Beats per minute |
| energy | Energía | Float 0–1 |
```

- [ ] **Step 2: Write 08-business-logic-portable.md**

```markdown
# 08 — Business Logic: What Travels for Free

## These modules are 100% portable to React Native

Copy these TypeScript files into a React Native project unchanged.
They have zero browser API dependencies.

### usePlayerStore

```typescript
// Manages: queue (pQueue), current index (ci), playing state,
//          position (pos), elapsed time, volume, simulation mode
// Location: src/store/usePlayerStore.ts
// RN: works identically — Zustand is platform-agnostic
```

State shape (relevant subset):
```typescript
{
    pQueue: Track[];       // ordered queue
    ci: number;            // current index
    playing: boolean;
    pos: number;           // current position in ms
    elapsed: number;       // total elapsed ms in session
    vol: number;           // 0.0 to 1.0
    isSimulating: boolean; // true when audio files not found
    tTarget: number;       // total set duration in seconds
}
```

### useBuilderStore

```typescript
// Manages: set building inputs and generated set
// Location: src/store/useBuilderStore.ts
// Key actions: setTargetMin(), setVenue(), setCurve(), setBpmRange(), setGenSet()
```

### setBuilderService

```typescript
// Pure function: buildSet(tracks, targetSeconds, options) → Track[]
// Algorithm: picks tracks to fill targetSeconds within tolerance
// Respects: energy curve, BPM range, no repeats
// Location: src/services/setBuilderService.ts
// RN: copy file unchanged — no DOM, no fetch, no audio APIs
```

```typescript
// Usage:
const set = buildSet(
    allTracks,
    45 * 60,          // target: 45 minutes in seconds
    {
        tol: 90,      // tolerance: ±90 seconds
        curve: 'ascending',
        bpmMin: 90,
        bpmMax: 140,
    }
);
```

### useHistoryStore

```typescript
// Manages: array of past sets (SetHistoryItem[])
// Location: src/store/useHistoryStore.ts
// Persistence: web uses localStorage → RN: AsyncStorage (1-line change)
```

### useProjectStore (cross-domain actions)

```typescript
// Location: src/store/useProjectStore.ts
// Key actions:
toPlayer()                  // moves generated set to player queue
saveSet()                   // saves current set to history
appendToQueue(tracks)       // adds tracks after current song
updateTrackMetadata(id, patch)  // updates track across all stores
```

## What to change for React Native

| Web | React Native | Files |
|---|---|---|
| `localStorage` | `AsyncStorage` from `@react-native-async-storage/async-storage` | `useHistoryStore.ts`, `useLibraryStore.ts` |
| `IDBStorage` | `SQLiteStorage` from `@op-engineering/op-sqlite` | `src/platform/index.ts` |
| `BlobFileAccess` | `RNFileAccess` using `react-native-fs` | `src/platform/index.ts` |
| `BrowserAudioEngine` | `RNAudioEngine` using `react-native-track-player` | `src/platform/index.ts` |
| React 18 components | React Native components | All `.tsx` UI files |

**Total changes to business logic: 3 import lines in `src/platform/index.ts`.**
```

- [ ] **Step 3: Commit**

```bash
git add docs/iOS/07-data-models.md docs/iOS/08-business-logic-portable.md
git commit -m "docs(ios): add data models dictionary and portable business logic guide"
```

---

### Task 13: `09-react-native-path.md` + `10-implementation-checklist.md`

**Files:**
- Create: `docs/iOS/09-react-native-path.md`
- Create: `docs/iOS/10-implementation-checklist.md`

- [ ] **Step 1: Write 09-react-native-path.md**

```markdown
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
| State | `zustand` | **Same library, same stores** ✅ |
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
```

- [ ] **Step 2: Write 10-implementation-checklist.md**

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
git add docs/iOS/09-react-native-path.md docs/iOS/10-implementation-checklist.md
git commit -m "docs(ios): add React Native path and full implementation checklist"
```

---

### Task 14: Final verification — Chunk 2

- [ ] **Step 1: Verify all 10 docs exist**

```bash
ls docs/iOS/
```

Expected:
```
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
README.md
```

- [ ] **Step 2: Run full test suite one final time**

```bash
npm test -- --run
```
Expected: 31/31 passed.

- [ ] **Step 3: Final commit summary**

```bash
git log --oneline -15
```

You should see commits for every interface, adapter, and documentation file.
