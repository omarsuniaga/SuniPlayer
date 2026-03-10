export interface Track {
    id: string;
    title: string;
    artist: string;
    duration_ms: number;
    bpm: number;
    key: string;
    energy: number;
    mood: string;
    file_path: string;
    analysis_cached: boolean;
    blob_url?: string;   // Object URL for user-imported files (session-only)
    notes?: string;      // Performance notes (e.g. "intro larga", "pedir aplauso")
    isCustom?: boolean;  // true = imported by user, not from built-in catalog
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
