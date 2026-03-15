import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'SuniPlayerDB';
const DB_VERSION = 1;
const STORE_WAVEFORMS = 'waveforms';
const STORE_METRICS = 'analysis';

export interface WaveformData {
    id: string;
    data: number[];
    timestamp: number;
}

export interface AnalysisData {
    id: string;
    bpm: number;
    key: string;
    energy: number;
    gainOffset: number; // For Auto-Gain
    timestamp: number;
}

let db: IDBPDatabase | null = null;

async function getDB() {
    if (db) return db;
    db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_WAVEFORMS)) {
                db.createObjectStore(STORE_WAVEFORMS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_METRICS)) {
                db.createObjectStore(STORE_METRICS, { keyPath: 'id' });
            }
        },
    });
    return db;
}

export const audioCache = {
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
    }
};
