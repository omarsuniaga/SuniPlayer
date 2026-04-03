// src/platform/browser/IDBStorage.ts
import { openDB, IDBPDatabase } from 'idb';
import type { IStorage, AnalysisData } from '../interfaces/IStorage';

const DB_NAME = 'SuniPlayerDB';
const DB_VERSION = 3; // Upgraded to v3 for backup support and future-proofing
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
                upgrade(db, oldVersion, newVersion) {
                    console.log(`[IDBStorage] Upgrading DB from ${oldVersion} to ${newVersion}`);
                    
                    if (oldVersion < 1) {
                        db.createObjectStore(STORE_WAVEFORMS, { keyPath: 'id' });
                        db.createObjectStore(STORE_METRICS, { keyPath: 'id' });
                        db.createObjectStore(STORE_AUDIO, { keyPath: 'id' });
                    }
                    
                    // Add migration logic for future versions here
                    if (oldVersion < 3) {
                        // Example: Ensure indexes exist for faster lookups
                        // const metricsStore = db.transaction.objectStore(STORE_METRICS);
                        // metricsStore.createIndex('timestamp', 'timestamp');
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

    /** 
     * EXPORT: Aggregates all IndexedDB data into a single serialized Blob.
     * Caution: This can be memory intensive for large libraries.
     */
    async exportFullBackup(): Promise<Blob> {
        return this.atomic(async (db) => {
            const metrics = await db.getAll(STORE_METRICS);
            const waveforms = await db.getAll(STORE_WAVEFORMS);
            const audioEntries = await db.getAll(STORE_AUDIO);

            // Structure: { metadata: { metrics, waveforms }, files: [ {id, data: Blob} ] }
            // Note: IndexedDB entries for STORE_AUDIO are {id, data: Blob}
            
            const backupObj = {
                version: DB_VERSION,
                timestamp: Date.now(),
                metrics,
                waveforms,
                // Audio files need to be processed specially since they are Blobs
                audios: audioEntries.map(e => ({ id: e.id, type: e.data.type }))
            };

            // We create a multipart-like Blob: [JSON Metadata, ...Audio Blobs]
            // This is more memory-efficient than converting blobs to base64.
            const jsonPart = new Blob([JSON.stringify(backupObj)], { type: 'application/json' });
            
            // To make it easy to parse, we'll actually use a simple object approach for now
            // converting Blobs to ArrayBuffers for a flat serializable object.
            const processedAudios = await Promise.all(audioEntries.map(async (entry) => {
                const buffer = await entry.data.arrayBuffer();
                return { 
                    id: entry.id, 
                    data: Array.from(new Uint8Array(buffer)), // Convert to array for JSON
                    type: entry.data.type 
                };
            }));

            const fullSerializable = {
                ...backupObj,
                audioData: processedAudios
            };

            return new Blob([JSON.stringify(fullSerializable)], { type: 'application/suni-backup' });
        });
    }

    /**
     * IMPORT: Restores all data from a backup Blob.
     */
    async importFullBackup(backup: Blob): Promise<{ success: boolean; count: number }> {
        try {
            const text = await backup.text();
            const data = JSON.parse(text);

            if (!data.metrics || !data.waveforms || !data.audioData) {
                throw new Error("Invalid backup format");
            }

            return this.atomic(async (db) => {
                const tx = db.transaction([STORE_METRICS, STORE_WAVEFORMS, STORE_AUDIO], 'readwrite');
                
                // Clear existing (optional - user might want merge, but clear is safer for 'Full Backup')
                await tx.objectStore(STORE_METRICS).clear();
                await tx.objectStore(STORE_WAVEFORMS).clear();
                await tx.objectStore(STORE_AUDIO).clear();

                for (const m of data.metrics) await tx.objectStore(STORE_METRICS).put(m);
                for (const w of data.waveforms) await tx.objectStore(STORE_WAVEFORMS).put(w);
                
                for (const a of data.audioData) {
                    const blob = new Blob([new Uint8Array(a.data)], { type: a.type });
                    await tx.objectStore(STORE_AUDIO).put({ id: a.id, data: blob, timestamp: Date.now() });
                }

                await tx.done;
                return { success: true, count: data.metrics.length };
            });
        } catch (error) {
            console.error("[IDBStorage] Import failed:", error);
            return { success: false, count: 0 };
        }
    }
}

export const dbStorage = new IDBStorage();
