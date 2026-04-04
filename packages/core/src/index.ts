// Types
export type { Track, Venue, Curve, SetHistoryItem, SetEntry, Show, TrackMarker, Mood } from './types';

// Stores & State Management
export { useBuilderStore } from './store/useBuilderStore';
export { usePlayerStore } from './store/usePlayerStore';
export type { ScheduledPlay } from './store/usePlayerStore';
export { useSettingsStore } from './store/useSettingsStore';
export type { PedalAction, PedalBinding, PedalBindings } from './store/useSettingsStore';
export { useHistoryStore } from './store/useHistoryStore';
export { useLibraryStore } from './store/useLibraryStore';
export { useProjectStore } from './store/useProjectStore';
export { getStorage, configureStorage } from './store/storage';

// Network & SyncEnsemble
export * from './network/types';
export type { IP2PTransport } from './network/P2PTransport';
export { ClockSyncService, clockSyncService } from './network/clockSyncService';
export { SessionManager } from './network/SessionManager';
export type { SessionMember } from './network/SessionManager';
export { SyncEnsembleOrchestrator } from './network/SyncEnsembleOrchestrator';
export { YjsStore } from './network/crdt/YjsStore';

// Services
export { buildSet, genWave, findSmartReplacement, getCamelotDistance } from './services/setBuilderService';
export { 
    getEffectiveDuration, 
    fmt, 
    fmtM, 
    fmtFull, 
    mc, 
    ec 
} from './services/uiUtils';

// Utils
export { sumTrackDurationMs, sumTrackDurationSeconds } from './utils/trackMetrics';
export { getTrackUrl } from './utils/trackUtils';

// Platform Interfaces
export type { IAudioEngine, AudioLoadOptions } from './platform/interfaces/IAudioEngine';
export type { IStorage, AnalysisData } from './platform/interfaces/IStorage';
export type { IFileAccess, ImportedFile, FileSource } from './platform/interfaces/IFileAccess';

// Constants & Catalog
export { default as catalog } from './data/tracks.json';
export { TRACKS, VENUES, CURVES, MOODS } from './data/constants';
