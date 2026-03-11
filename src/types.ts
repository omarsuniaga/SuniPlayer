export interface Track {
    id: string;
    title: string;
    artist: string;
    composer?: string;    // Composer name
    tags?: string[];     // Categories/Tags (e.g. "classic", "jazz", "ballad")
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
    targetKey?: string;  // desired performance key after transposition
    transposeSemitones?: number; // saved semitone shift relative to key
    playbackTempo?: number;      // saved tempo factor (1.0 = normal)
    startTime?: number;  // ms - custom start offset
    endTime?: number;    // ms - custom end offset
    sheetMusic?: { id: string; type: "pdf" | "image"; name: string }[];
    playCount?: number;
    totalPlayTimeMs?: number;
    lastPlayedAt?: string;
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
