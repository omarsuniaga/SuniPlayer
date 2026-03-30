import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import type { IStorage, AnalysisData } from '@suniplayer/core';

const AUDIO_STORAGE_DIR = `${FileSystem.documentDirectory}audio_storage/`;

export class SQLiteStorage implements IStorage {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('suniplayer.db');
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS analysis (
        id TEXT PRIMARY KEY,
        bpm REAL, key TEXT, energy REAL, gainOffset REAL, timestamp INTEGER,
        affinityScore REAL, playCount INTEGER, completePlays INTEGER, skips INTEGER,
        total_play_time_ms INTEGER, last_played_at TEXT
      );
      CREATE TABLE IF NOT EXISTS waveforms (
        id TEXT PRIMARY KEY, data TEXT
      );
      CREATE TABLE IF NOT EXISTS audio_files (
        trackId TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        size INTEGER,
        created_at TEXT
      );
    `);
  }

  private async ensureAudioStorageDir(): Promise<void> {
    const info = await FileSystem.getInfoAsync(AUDIO_STORAGE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(AUDIO_STORAGE_DIR, { intermediates: true });
    }
  }

  private assertReady(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('SQLiteStorage not initialized. Call init() first.');
    return this.db;
  }

  async getAnalysis(trackId: string): Promise<AnalysisData | null> {
    const db = this.assertReady();
    // Parameterized query — prevents SQL injection
    const row = await db.getFirstAsync<any>('SELECT * FROM analysis WHERE id = ?', [trackId]);
    if (!row) return null;
    
    return {
      ...row,
      totalPlayTimeMs: row.total_play_time_ms,
      lastPlayedAt: row.last_played_at
    };
  }

  async saveAnalysis(trackId: string, data: Partial<AnalysisData>): Promise<void> {
    const db = this.assertReady();
    const existing = await this.getAnalysis(trackId);
    const finalData = { ...existing, ...data };
    
    await db.runAsync(
      'INSERT OR REPLACE INTO analysis (id, bpm, key, energy, gainOffset, timestamp, affinityScore, playCount, completePlays, skips, total_play_time_ms, last_played_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        trackId, 
        finalData.bpm ?? null, 
        finalData.key ?? null, 
        finalData.energy ?? null, 
        finalData.gainOffset ?? null, 
        Date.now(),
        finalData.affinityScore ?? null,
        finalData.playCount ?? null,
        finalData.completePlays ?? null,
        finalData.skips ?? null,
        finalData.totalPlayTimeMs ?? null,
        finalData.lastPlayedAt ?? null
      ]
    );
  }

  async getWaveform(trackId: string): Promise<number[] | null> {
    const db = this.assertReady();
    const row = await db.getFirstAsync<{ data: string }>('SELECT data FROM waveforms WHERE id = ?', [trackId]);
    if (!row) return null;
    try { return JSON.parse(row.data) as number[]; } catch { return null; }
  }

  async saveWaveform(trackId: string, data: number[]): Promise<void> {
    const db = this.assertReady();
    await db.runAsync('INSERT OR REPLACE INTO waveforms (id, data) VALUES (?, ?)', [trackId, JSON.stringify(data)]);
  }

  async saveAudioFile(trackId: string, file: Blob): Promise<void> {
    const db = this.assertReady();
    await this.ensureAudioStorageDir();

    // Blob → ArrayBuffer → Uint8Array → base64
    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    const base64 = btoa(String.fromCharCode(...uint8));

    const filePath = `${AUDIO_STORAGE_DIR}${trackId}.audio`;
    await FileSystem.writeAsStringAsync(filePath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await db.runAsync(
      'INSERT OR REPLACE INTO audio_files (trackId, file_path, size, created_at) VALUES (?, ?, ?, ?)',
      [trackId, filePath, file.size, new Date().toISOString()]
    );
  }

  async getAudioFile(trackId: string): Promise<Blob | null> {
    const db = this.assertReady();
    const row = await db.getFirstAsync<{ file_path: string }>(
      'SELECT file_path FROM audio_files WHERE trackId = ?',
      [trackId]
    );
    if (!row) return null;

    const info = await FileSystem.getInfoAsync(row.file_path);
    if (!info.exists) return null;

    const base64Content = await FileSystem.readAsStringAsync(row.file_path, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // base64 → binary string → Uint8Array → Blob
    const binaryStr = atob(base64Content);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'audio/mpeg' });
  }

  async deleteAudioFile(trackId: string): Promise<void> {
    const db = this.assertReady();
    const row = await db.getFirstAsync<{ file_path: string }>(
      'SELECT file_path FROM audio_files WHERE trackId = ?',
      [trackId]
    );

    if (row) {
      const info = await FileSystem.getInfoAsync(row.file_path);
      if (info.exists) {
        await FileSystem.deleteAsync(row.file_path, { idempotent: true });
      }
    }

    await db.runAsync('DELETE FROM audio_files WHERE trackId = ?', [trackId]);
  }

  async getAllStoredTrackIds(): Promise<string[]> {
    const db = this.assertReady();
    const rows = await db.getAllAsync<{ trackId: string }>('SELECT trackId FROM audio_files');
    return rows.map(r => r.trackId);
  }
}
