/**
 * SuniPlayer Canonical Types
 * All domain models must live here to ensure cross-platform consistency.
 */

export interface TrackMarker {
    id: string;       // UUID
    posMs: number;    // Position in milliseconds
    comment: string;  // Max 140 chars
}

export type Mood = "calm" | "happy" | "melancholic" | "energetic";

export interface Track {
    id: string;
    title: string;
    artist: string;
    duration_ms: number;
    file_path: string;
    
    // Metadata & Analysis
    blob_url?: string;
    bpm?: number;
    key?: string;
    energy?: number;
    mood?: Mood;
    genre?: string;
    tags?: string[];
    notes?: string;
    
    // Engine & UI State
    isCustom?: boolean;
    analysis_cached?: boolean;
    waveform?: number[];
    gainOffset?: number;
    startTime?: number; // In MS, for auto-trim
    endTime?: number;   // In MS, for auto-trim
    instanceId?: string; // For unique keys in React lists
    
    // Visual Assets
    sheetMusic?: string[]; // URLs or local paths
    markers?: TrackMarker[];

    // Stats & History
    totalPlayTimeMs?: number;
    playCount?: number;
    lastPlayedAt?: string;
    completePlays?: number;
    skips?: number;
    affinityScore?: number; // 0-100
    metadata?: Record<string, any>;
}

export interface SetEntry {
    id: string;
    label: string;
    tracks: Track[];
    durationMs: number;
    builtAt: string;
}

export interface Show {
    id: string;
    name: string;
    createdAt: string;
    sets: SetEntry[];
    tracks?: Track[];
}

/** Legacy support for older session data */
export interface SetHistoryItem extends Show {
    date?: string;
    total?: number;
    target?: number;
    tracks: Track[];
    venue?: string;
    curve?: string;
}

export interface Venue {
    id: string;
    label: string;
    color: string;
}

export interface Curve {
    id: string;
    label: string;
    desc: string;
}
