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
 *
 * Instances are created lazily (on first access) so that importing this
 * module at the top level does not trigger AudioContext construction during
 * test environment setup, where window.AudioContext may not yet exist.
 */

import { BrowserAudioEngine } from './browser/BrowserAudioEngine';
import { IDBStorage } from './browser/IDBStorage';
import { BlobFileAccess } from './browser/BlobFileAccess';

export type { IAudioEngine, AudioLoadOptions } from './interfaces/IAudioEngine';
export type { IStorage, AnalysisData } from './interfaces/IStorage';
export type { IFileAccess, ImportedFile, FileSource } from './interfaces/IFileAccess';

let _audioEngine: InstanceType<typeof BrowserAudioEngine> | null = null;
let _storage: InstanceType<typeof IDBStorage> | null = null;
let _fileAccess: InstanceType<typeof BlobFileAccess> | null = null;

export function getAudioEngine(): InstanceType<typeof BrowserAudioEngine> {
    if (!_audioEngine) _audioEngine = new BrowserAudioEngine();
    return _audioEngine;
}

export function getStorage(): InstanceType<typeof IDBStorage> {
    if (!_storage) _storage = new IDBStorage();
    return _storage;
}

export function getFileAccess(): InstanceType<typeof BlobFileAccess> {
    if (!_fileAccess) _fileAccess = new BlobFileAccess();
    return _fileAccess;
}

// Convenience singleton references — accessed via getter to stay lazy.
export const audioEngine = new Proxy({} as InstanceType<typeof BrowserAudioEngine>, {
    get(_target, prop) {
        return (getAudioEngine() as any)[prop];
    },
});

export const storage = new Proxy({} as InstanceType<typeof IDBStorage>, {
    get(_target, prop) {
        return (getStorage() as any)[prop];
    },
});

export const fileAccess = new Proxy({} as InstanceType<typeof BlobFileAccess>, {
    get(_target, prop) {
        return (getFileAccess() as any)[prop];
    },
});
