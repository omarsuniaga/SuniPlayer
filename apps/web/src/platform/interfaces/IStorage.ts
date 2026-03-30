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

    /** Raw audio persistence (Binary storage) */
    saveAudioFile(trackId: string, file: Blob): Promise<void>;
    getAudioFile(trackId: string): Promise<Blob | null>;
    deleteAudioFile(trackId: string): Promise<void>;
    getAllStoredTrackIds(): Promise<string[]>;
}
