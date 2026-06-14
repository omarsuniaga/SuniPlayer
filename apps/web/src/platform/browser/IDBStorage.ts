// src/platform/browser/IDBStorage.ts
import { openDB, IDBPDatabase } from 'idb';
import type { IStorage, AnalysisData } from '../interfaces/IStorage';
import { fileSystemStorage } from './FileSystemStorage';

const DB_NAME = 'SuniPlayer_v2';
const DB_VERSION = 1; 
const STORE_WAVEFORMS = 'waveforms';
const STORE_METRICS = 'analysis';

export class IDBStorage implements IStorage {
    private db: IDBPDatabase | null = null;
    private _opening: Promise<IDBPDatabase> | null = null;

    private async getDB(): Promise<IDBPDatabase> {
        if (this.db) return this.db;
        
        if (!this._opening) {
            console.log("[IDBStorage] Conectando...");
            this._opening = openDB(DB_NAME, DB_VERSION, {
                upgrade(db, oldVersion) {
                    console.log(`[IDBStorage] Upgrade v${oldVersion} -> v${DB_VERSION}`);
                    if (!db.objectStoreNames.contains(STORE_WAVEFORMS)) db.createObjectStore(STORE_WAVEFORMS, { keyPath: 'id' });
                    if (!db.objectStoreNames.contains(STORE_METRICS)) db.createObjectStore(STORE_METRICS, { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('audio_files')) db.createObjectStore('audio_files', { keyPath: 'id' });
                },
                blocked() { alert("Base de datos bloqueada. Por favor, cierra otras pestañas de SuniPlayer."); }
            });
        }

        // Timeout de seguridad: 3 segundos para conectar
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout conectando a IndexedDB")), 3000));
        
        try {
            this.db = await Promise.race([this._opening, timeout]) as IDBPDatabase;
            return this.db;
        } catch (err) {
            this._opening = null;
            throw err;
        }
    }

    async getAnalysis(trackId: string): Promise<AnalysisData | null> {
        try { const db = await this.getDB(); return (await db.get(STORE_METRICS, trackId)) ?? null; } catch { return null; }
    }

    async saveAnalysis(trackId: string, data: Partial<AnalysisData>): Promise<void> {
        const db = await this.getDB();
        const existing = (await db.get(STORE_METRICS, trackId)) || { id: trackId, timestamp: Date.now() };
        await db.put(STORE_METRICS, { ...existing, ...data, timestamp: Date.now() });
    }

    async getWaveform(trackId: string): Promise<number[] | null> {
        try { const db = await this.getDB(); const entry = await db.get(STORE_WAVEFORMS, trackId); return entry ? entry.data : null; } catch { return null; }
    }

    async saveWaveform(trackId: string, data: number[]): Promise<void> {
        const db = await this.getDB();
        await db.put(STORE_WAVEFORMS, { id: trackId, data, timestamp: Date.now() });
    }

    async saveAudioFile(trackId: string, file: Blob): Promise<void> {
        await fileSystemStorage.saveFile(`${trackId}.audio`, file);
    }

    async saveFullTrack(trackId: string, file: Blob, analysis: AnalysisData, waveform?: number[]): Promise<void> {
        // 1. Audio a OPFS (Fuera de la DB para evitar bloqueos)
        await fileSystemStorage.saveFile(`${trackId}.audio`, file);

        // 2. Metadata a IDB
        const db = await this.getDB();
        console.log(`[IDBStorage] Escribiendo metadata para ${trackId}...`);
        const tx = db.transaction([STORE_METRICS, STORE_WAVEFORMS], 'readwrite');
        await tx.objectStore(STORE_METRICS).put({ ...analysis, id: trackId, timestamp: Date.now() });
        if (waveform) await tx.objectStore(STORE_WAVEFORMS).put({ id: trackId, data: waveform, timestamp: Date.now() });
        await tx.done;
        console.log(`[IDBStorage] Guardado exitoso: ${trackId}`);
    }

    async getAudioFile(trackId: string): Promise<Blob | null> {
        const file = await fileSystemStorage.getFile(`${trackId}.audio`);
        if (file) return file;
        try { const db = await this.getDB(); const entry = await db.get('audio_files', trackId); return entry ? entry.data : null; } catch { return null; }
    }

    async deleteAudioFile(trackId: string): Promise<void> {
        await fileSystemStorage.removeFile(`${trackId}.audio`);
        const db = await this.getDB();
        const tx = db.transaction([STORE_METRICS, STORE_WAVEFORMS], 'readwrite');
        await tx.objectStore(STORE_METRICS).delete(trackId);
        await tx.objectStore(STORE_WAVEFORMS).delete(trackId);
        await tx.done;
    }

    async getAllStoredTrackIds(): Promise<string[]> {
        try { const db = await this.getDB(); return await db.getAllKeys(STORE_METRICS) as string[]; } catch { return []; }
    }

    async exportFullBackup(): Promise<Blob> { return new Blob(["Backup no disponible"], { type: 'text/plain' }); }
    async importFullBackup(backup: Blob): Promise<{ success: boolean; count: number }> { return { success: false, count: 0 }; }
}

export const dbStorage = new IDBStorage();
