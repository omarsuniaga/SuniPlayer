// src/platform/interfaces/IStorage.ts

export interface AnalysisData {
    id: string;
    bpm: number;
    key: string;
    energy: number;
    gainOffset: number;
    timestamp: number;
    affinityScore?: number;
    playCount?: number;
    completePlays?: number;
    skips?: number;
    totalPlayTimeMs?: number;
    lastPlayedAt?: string;
    startTime?: number;
    endTime?: number;
    targetKey?: string;
    playbackTempo?: number;
    transposeSemitones?: number;
}

/**
 * IStorage — Contract for caching audio analysis results and waveforms.
 */
export interface IStorage {
    getAnalysis(trackId: string): Promise<AnalysisData | null>;
    saveAnalysis(trackId: string, data: Partial<AnalysisData>): Promise<void>;
    getWaveform(trackId: string): Promise<number[] | null>;
    saveWaveform(trackId: string, data: number[]): Promise<void>;

    /** Raw audio persistence (Binary storage) */
    saveAudioFile(trackId: string, file: Blob): Promise<void>;
    saveFullTrack(trackId: string, file: Blob, analysis: AnalysisData, waveform?: number[]): Promise<void>;
    getAudioFile(trackId: string): Promise<Blob | null>;
    deleteAudioFile(trackId: string): Promise<void>;
    getAllStoredTrackIds(): Promise<string[]>;

    /** Full system backup (Blobs + Metadata) */
    exportFullBackup(): Promise<Blob>;
    importFullBackup(backup: Blob): Promise<{ success: boolean; count: number }>;
}
