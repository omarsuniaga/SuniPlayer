import * as SQLite from 'expo-sqlite';
import type { IStorage, AnalysisData } from '@suniplayer/core';

export class SQLiteStorage implements IStorage {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('suniplayer.db');
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS analysis (
        id TEXT PRIMARY KEY,
        bpm REAL, key TEXT, energy REAL, gainOffset REAL, timestamp INTEGER
      );
      CREATE TABLE IF NOT EXISTS waveforms (
        id TEXT PRIMARY KEY, data TEXT
      );
    `);
  }

  private assertReady(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('SQLiteStorage not initialized. Call init() first.');
    return this.db;
  }

  async getAnalysis(trackId: string): Promise<AnalysisData | null> {
    const db = this.assertReady();
    // Parameterized query — prevents SQL injection
    const row = await db.getFirstAsync<AnalysisData>('SELECT * FROM analysis WHERE id = ?', [trackId]);
    return row ?? null;
  }

  async saveAnalysis(trackId: string, data: Partial<AnalysisData>): Promise<void> {
    const db = this.assertReady();
    await db.runAsync(
      'INSERT OR REPLACE INTO analysis (id, bpm, key, energy, gainOffset, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [trackId, data.bpm ?? null, data.key ?? null, data.energy ?? null, data.gainOffset ?? null, Date.now()]
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
}
