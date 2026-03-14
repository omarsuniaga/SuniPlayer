// src/platform/browser/IDBStorage.ts
import { openDB, IDBPDatabase } from 'idb';
import type { IStorage, AnalysisData } from '../interfaces/IStorage';

const DB_NAME = 'SuniPlayerDB';
const DB_VERSION = 1;
const STORE_WAVEFORMS = 'waveforms';
const STORE_METRICS = 'analysis';

export class IDBStorage implements IStorage {
    private db: IDBPDatabase | null = null;
    private _opening: Promise<IDBPDatabase> | null = null;

    private async getDB(): Promise<IDBPDatabase> {
        if (this.db) return this.db;
        if (!this._opening) {
            this._opening = openDB(DB_NAME, DB_VERSION, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains(STORE_WAVEFORMS)) {
                        db.createObjectStore(STORE_WAVEFORMS, { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains(STORE_METRICS)) {
                        db.createObjectStore(STORE_METRICS, { keyPath: 'id' });
                    }
                },
            }).then(db => {
                this.db = db;
                return db;
            });
        }
        return this._opening;
    }

    async getAnalysis(trackId: string): Promise<AnalysisData | null> {
        const db = await this.getDB();
        return await db.get(STORE_METRICS, trackId) ?? null;
    }

    async saveAnalysis(trackId: string, data: Partial<AnalysisData>): Promise<void> {
        const db = await this.getDB();
        const existing = (await db.get(STORE_METRICS, trackId)) || { id: trackId, timestamp: Date.now() };
        await db.put(STORE_METRICS, { ...existing, ...data, timestamp: Date.now() });
    }

    async getWaveform(trackId: string): Promise<number[] | null> {
        const db = await this.getDB();
        const entry = await db.get(STORE_WAVEFORMS, trackId);
        return entry ? entry.data : null;
    }

    async saveWaveform(trackId: string, data: number[]): Promise<void> {
        const db = await this.getDB();
        await db.put(STORE_WAVEFORMS, { id: trackId, data, timestamp: Date.now() });
    }
}
