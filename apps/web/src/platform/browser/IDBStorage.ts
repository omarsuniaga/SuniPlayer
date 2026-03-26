// src/platform/browser/IDBStorage.ts
import { openDB, IDBPDatabase } from 'idb';
import type { IStorage, AnalysisData } from '../interfaces/IStorage';

const DB_NAME = 'SuniPlayerDB';
const DB_VERSION = 2; 
const STORE_WAVEFORMS = 'waveforms';
const STORE_METRICS = 'analysis';
const STORE_AUDIO = 'audio_files';

export class IDBStorage implements IStorage {
    private db: IDBPDatabase | null = null;
    private _opening: Promise<IDBPDatabase> | null = null;
    private _lock = Promise.resolve(); // Queue for atomic operations to prevent race conditions

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
                    if (!db.objectStoreNames.contains(STORE_AUDIO)) {
                        db.createObjectStore(STORE_AUDIO, { keyPath: 'id' });
                    }
                },
            }).then(db => {
                this.db = db;
                return db;
            });
        }
        return this._opening;
    }

    /** Helper to queue operations and ensure data integrity */
    private async atomic<T>(op: (db: IDBPDatabase) => Promise<T>): Promise<T> {
        const next = this._lock.then(async () => {
            const db = await this.getDB();
            return op(db);
        });
        this._lock = next.then(() => {}, () => {}); // Carry on even if one op fails
        return next;
    }

    async getAnalysis(trackId: string): Promise<AnalysisData | null> {
        return this.atomic(async (db) => {
            return (await db.get(STORE_METRICS, trackId)) ?? null;
        });
    }

    async saveAnalysis(trackId: string, data: Partial<AnalysisData>): Promise<void> {
        return this.atomic(async (db) => {
            const existing = (await db.get(STORE_METRICS, trackId)) || { id: trackId, timestamp: Date.now() };
            await db.put(STORE_METRICS, { ...existing, ...data, timestamp: Date.now() });
        });
    }

    async getWaveform(trackId: string): Promise<number[] | null> {
        return this.atomic(async (db) => {
            const entry = await db.get(STORE_WAVEFORMS, trackId);
            return entry ? entry.data : null;
        });
    }

    async saveWaveform(trackId: string, data: number[]): Promise<void> {
        return this.atomic(async (db) => {
            await db.put(STORE_WAVEFORMS, { id: trackId, data, timestamp: Date.now() });
        });
    }

    async saveAudioFile(trackId: string, file: Blob): Promise<void> {
        return this.atomic(async (db) => {
            await db.put(STORE_AUDIO, { id: trackId, data: file, timestamp: Date.now() });
        });
    }

    async getAudioFile(trackId: string): Promise<Blob | null> {
        return this.atomic(async (db) => {
            const entry = await db.get(STORE_AUDIO, trackId);
            return entry ? entry.data : null;
        });
    }

    async deleteAudioFile(trackId: string): Promise<void> {
        return this.atomic(async (db) => {
            await db.delete(STORE_AUDIO, trackId);
            await db.delete(STORE_METRICS, trackId);
            await db.delete(STORE_WAVEFORMS, trackId);
        });
    }

    async getAllStoredTrackIds(): Promise<string[]> {
        return this.atomic(async (db) => {
            return await db.getAllKeys(STORE_METRICS) as string[];
        });
    }
}

export const dbStorage = new IDBStorage();
