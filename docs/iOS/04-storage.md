# 04 — Storage: Audio Analysis Cache

## What SuniPlayer stores

| Data | Purpose | Size estimate |
|---|---|---|
| BPM | Set builder algorithm needs this | Float, per track |
| Key (musical) | Display + transpose logic | String, e.g. "C Major" |
| Energy | Curve-based set building | Float 0–1 |
| Gain offset | Auto-normalize playback volume | Float, per track |
| Waveform | Visual waveform display in player | Array of ~200 floats |

## Interface Contract

```typescript
// src/platform/interfaces/IStorage.ts
interface IStorage {
    getAnalysis(trackId: string): Promise<AnalysisData | null>;
    saveAnalysis(trackId: string, data: Partial<AnalysisData>): Promise<void>;
    getWaveform(trackId: string): Promise<number[] | null>;
    saveWaveform(trackId: string, data: number[]): Promise<void>;
}

interface AnalysisData {
    id: string;       // track file_path used as key
    bpm: number;
    key: string;      // e.g. "C Major", "F# Minor"
    energy: number;   // 0.0 to 1.0
    gainOffset: number;  // normalization multiplier
    timestamp: number;   // Unix ms, for cache invalidation
}
```

## iOS Swift — SQLite with GRDB.swift (Recommended)

```swift
import GRDB

struct AnalysisRecord: Codable, FetchableRecord, PersistableRecord {
    var id: String
    var bpm: Double
    var key: String
    var energy: Double
    var gainOffset: Double
    var timestamp: Int64
    var waveformJSON: String  // JSON-encoded [Double] array

    static let databaseTableName = "analysis"
}

class SQLiteStorage: IStorageProtocol {
    private var dbQueue: DatabaseQueue

    init() throws {
        let dbPath = FileManager.default
            .urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("suniplayer.db").path
        dbQueue = try DatabaseQueue(path: dbPath)
        try migrate()
    }

    func getAnalysis(_ trackId: String) async throws -> AnalysisRecord? {
        try await dbQueue.read { db in
            try AnalysisRecord.fetchOne(db, key: trackId)
        }
    }

    func saveAnalysis(_ trackId: String, data: AnalysisRecord) async throws {
        try await dbQueue.write { db in
            try data.save(db)
        }
    }
}
```

## React Native — op-sqlite (Recommended)

```typescript
import { open } from '@op-engineering/op-sqlite';

const db = open({ name: 'suniplayer.db' });

db.execute(`CREATE TABLE IF NOT EXISTS analysis (
    id TEXT PRIMARY KEY,
    bpm REAL, key TEXT, energy REAL,
    gainOffset REAL, timestamp INTEGER,
    waveform TEXT
)`);

async function getAnalysis(trackId: string): Promise<AnalysisData | null> {
    const result = db.execute('SELECT * FROM analysis WHERE id = ?', [trackId]);
    return result.rows?.[0] ?? null;
}
```

## Key differences from IndexedDB

| Feature | IndexedDB (Web) | SQLite (iOS/RN) |
|---|---|---|
| Query language | Key-value only | Full SQL |
| Typed columns | No | Yes |
| Performance | Good | Better |
| Schema migration | Manual | GRDB migrations |
| Size limit | Browser-managed | Device storage |
