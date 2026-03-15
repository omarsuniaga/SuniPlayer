// Types
export type { Track, Venue, Curve, SetHistoryItem } from './types';

// Stores
export { useBuilderStore } from './store/useBuilderStore';
export { usePlayerStore } from './store/usePlayerStore';
export { useSettingsStore } from './store/useSettingsStore';
export type { PedalAction, PedalBinding, PedalBindings } from './store/useSettingsStore';
export { useHistoryStore } from './store/useHistoryStore';
export { useLibraryStore } from './store/useLibraryStore';
export { useProjectStore } from './store/useProjectStore';
export type { ProjectState } from './store/useProjectStore';

// Storage config
export { configureStorage } from './store/storage';

// Services
export { buildSet } from './services/setBuilderService';
// NOTE: setBuilderService uses an internal BuildOpts interface (not exported).
// If a public BuildSetOptions type is needed, add it to setBuilderService.ts first.

// Platform interfaces
export type { IAudioEngine, AudioLoadOptions } from './platform/interfaces/IAudioEngine';
export type { IStorage, AnalysisData } from './platform/interfaces/IStorage';
export type { IFileAccess, ImportedFile, FileSource } from './platform/interfaces/IFileAccess';

// Catalog
export { default as catalog } from './data/tracks.json';
