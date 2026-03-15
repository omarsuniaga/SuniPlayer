# 07 — Data Models: TypeScript → Swift Dictionary

## Track (core entity)

```typescript
// TypeScript (src/types.ts)
interface Track {
    id: string;
    title: string;
    artist: string;
    composer?: string;
    tags?: string[];
    duration_ms: number;      // milliseconds
    bpm: number;
    key: string;              // e.g. "C Major", "F# Minor"
    energy: number;           // 0.0 to 1.0
    mood: string;
    file_path: string;        // relative path e.g. "Song.mp3"
    analysis_cached: boolean;
    blob_url?: string;        // iOS equivalent: file:// URI for imported files
    notes?: string;
    isCustom?: boolean;
    targetKey?: string;
    transposeSemitones?: number;  // saved pitch shift
    playbackTempo?: number;       // saved tempo factor
    startTime?: number;       // ms — trim start
    endTime?: number;         // ms — trim end
    waveform?: number[];      // ~200 floats, 0.0–1.0
    gainOffset?: number;      // volume normalization multiplier
    playCount?: number;
    totalPlayTimeMs?: number;
    lastPlayedAt?: string;    // ISO 8601
    sheetMusic?: SheetMusicRef[];
}
```

```swift
// Swift equivalent
struct Track: Codable, Identifiable {
    let id: String
    var title: String
    var artist: String
    var composer: String?
    var tags: [String]?
    var durationMs: Int           // milliseconds
    var bpm: Double
    var key: String               // e.g. "C Major"
    var energy: Double            // 0.0 to 1.0
    var mood: String
    var filePath: String          // relative path
    var analysisCached: Bool
    var fileURL: URL?             // iOS: file:// URI for imported tracks
    var notes: String?
    var isCustom: Bool?
    var targetKey: String?
    var transposeSemitones: Double?  // pitch shift in semitones
    var playbackTempo: Double?       // tempo factor 0.8–1.2
    var startTimeMs: Int?            // trim start in ms
    var endTimeMs: Int?              // trim end in ms
    var waveform: [Double]?
    var gainOffset: Double?
    var playCount: Int?
    var totalPlayTimeMs: Int?
    var lastPlayedAt: Date?
    var sheetMusic: [SheetMusicRef]?
}
```

## SetHistoryItem

```typescript
// TypeScript
interface SetHistoryItem {
    id: string;
    name: string;
    tracks: Track[];
    total: number;    // total duration in ms
    target: number;   // target duration in seconds
    venue: string;
    curve: string;
    date: string;     // ISO 8601
}
```

```swift
struct SetHistoryItem: Codable, Identifiable {
    let id: String
    var name: String
    var tracks: [Track]
    var total: Int      // ms
    var target: Int     // seconds
    var venue: String
    var curve: String
    var date: Date
}
```

## Venue

```typescript
interface Venue { id: string; label: string; color: string; }
```

```swift
struct Venue: Identifiable {
    let id: String
    let label: String
    let color: String  // hex
}

// Catalog (same values as src/data/constants.ts VENUES)
let venues: [Venue] = [
    Venue(id: "lobby",    label: "Lobby",    color: "#06B6D4"),
    Venue(id: "dinner",   label: "Cena",     color: "#8B5CF6"),
    Venue(id: "cocktail", label: "Cocktail", color: "#F59E0B"),
    Venue(id: "event",    label: "Evento",   color: "#EF4444"),
    Venue(id: "cruise",   label: "Crucero",  color: "#10B981"),
]
```

## Energy Curves

```swift
enum Curve: String, CaseIterable {
    case steady     = "steady"
    case ascending  = "ascending"
    case descending = "descending"
    case wave       = "wave"

    var label: String {
        switch self {
        case .steady:     return "Estable"
        case .ascending:  return "Ascendente"
        case .descending: return "Descendente"
        case .wave:       return "Ola"
        }
    }
}
```

## Key Musical Terminology (used in UI strings)

| Key (en) | Display (es) | Notes |
|---|---|---|
| "C Major" | "Do Mayor" | Display in Spanish in UI |
| "F# Minor" | "Fa# Menor" | |
| transposeSemitones | Tono | -12 to +12 semitones |
| playbackTempo | Tempo | 0.8x to 1.2x |
| startTime / endTime | Inicio / Fin | Trim points in ms |
| bpm | BPM | Beats per minute |
| energy | Energía | Float 0–1 |
