export interface TrackMarker {
    id: string;
    posMs: number;
    comment: string;
}

export interface Track {
    id: string;
    title: string;
    artist: string;
    composer?: string;
    tags?: string[];
    duration_ms: number;
    bpm: number;
    key: string;
    energy: number;
    mood: string;
    file_path: string;
    analysis_cached: boolean;
    blob_url?: string;
    notes?: string;
    markers?: TrackMarker[];
    isCustom?: boolean;
    targetKey?: string;
    transposeSemitones?: number;
    playbackTempo?: number;
    startTime?: number;
    endTime?: number;
    sheetMusic?: { id: string; type: "pdf" | "image"; name: string; localUri?: string }[];
    playCount?: number;
    totalPlayTimeMs?: number;
    lastPlayedAt?: string;
    waveform?: number[];
    gainOffset?: number;
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

export interface SetHistoryItem {
    id: string;
    name: string;
    tracks: Track[];
    total: number;
    target: number;
    venue: string;
    curve: string;
    date: string;
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
}
