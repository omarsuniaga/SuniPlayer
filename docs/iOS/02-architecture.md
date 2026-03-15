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
└─────────────────────────────────────────────────────────────┘
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
