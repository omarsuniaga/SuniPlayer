import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'SuniPlayerDB';
const DB_VERSION = 2; // Incremented for new store
const STORE_WAVEFORMS = 'waveforms';
const STORE_METRICS = 'analysis';
const STORE_AUDIO = 'audio_files';

export interface AudioFileEntry {
    id: string;
    blob: Blob;
    fileName: string;
    timestamp: number;
}

export interface AnalysisData {
    id: string;
    bpm: number;
    key: string;
    energy: number;
    gainOffset: number;
    timestamp: number;
    waveform?: number[];
}

let db: IDBPDatabase | null = null;

async function getDB() {
    if (db) return db;
    db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, _oldVersion) {
            if (!db.objectStoreNames.contains(STORE_WAVEFORMS)) {
                db.createObjectStore(STORE_WAVEFORMS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_METRICS)) {
                db.createObjectStore(STORE_METRICS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_AUDIO)) {
                db.createObjectStore(STORE_AUDIO, { keyPath: 'id' });
            }
        },
    });
    return db;
}

export const audioCache = {
    // ... existing methods ...
    async getWaveform(id: string): Promise<number[] | null> {
        const db = await getDB();
        const entry = await db.get(STORE_WAVEFORMS, id);
        return entry ? entry.data : null;
    },

    async saveWaveform(id: string, data: number[]) {
        const db = await getDB();
        await db.put(STORE_WAVEFORMS, { id, data, timestamp: Date.now() });
    },

    async getAnalysis(id: string): Promise<AnalysisData | null> {
        const db = await getDB();
        return await db.get(STORE_METRICS, id);
    },

    async saveAnalysis(id: string, analysis: Partial<AnalysisData>) {
        const db = await getDB();
        const existing = (await db.get(STORE_METRICS, id)) || { id, timestamp: Date.now() };
        await db.put(STORE_METRICS, { ...existing, ...analysis, timestamp: Date.now() });
    },

    // NEW: Audio file persistence
    async getAudioFile(id: string): Promise<Blob | null> {
        const db = await getDB();
        const entry = await db.get(STORE_AUDIO, id);
        return entry ? entry.blob : null;
    },

    async saveAudioFile(id: string, blob: Blob, fileName: string) {
        const db = await getDB();
        await db.put(STORE_AUDIO, { id, blob, fileName, timestamp: Date.now() });
    },

    async deleteAudioFile(id: string) {
        const db = await getDB();
        await db.delete(STORE_AUDIO, id);
    },

    async countAudioFiles(): Promise<number> {
        const db = await getDB();
        return await db.count(STORE_AUDIO);
    }
};
