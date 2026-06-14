const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
};
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn().mockResolvedValue(mockDb) }));

import { SQLiteStorage } from '../platform/SQLiteStorage';

describe('SQLiteStorage', () => {
  let storage: SQLiteStorage;
  beforeEach(async () => {
    jest.clearAllMocks();
    // Restore mock implementations cleared by clearAllMocks
    const SQLite = require('expo-sqlite');
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);
    mockDb.execAsync.mockResolvedValue(undefined);
    mockDb.getFirstAsync.mockResolvedValue(null);
    mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
    storage = new SQLiteStorage();
    await storage.init();
  });

  it('returns null for missing analysis', async () => {
    expect(await storage.getAnalysis('none')).toBeNull();
  });

  it('saves and retrieves analysis data', async () => {
    const analysisRow = { id: 'track-1', bpm: 128, key: 'C', energy: 0.8, gainOffset: 1.0, timestamp: 123 };
    mockDb.getFirstAsync.mockResolvedValue(analysisRow);
    await storage.saveAnalysis('track-1', { bpm: 128, key: 'C', energy: 0.8 });
    const result = await storage.getAnalysis('track-1');
    expect(result?.bpm).toBe(128);
  });

  it('returns null for missing waveform', async () => {
    expect(await storage.getWaveform('none')).toBeNull();
  });

  it('saves and retrieves waveform data', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ data: '[0.1, 0.5, 0.9]' });
    await storage.saveWaveform('track-1', [0.1, 0.5, 0.9]);
    const result = await storage.getWaveform('track-1');
    expect(result).toEqual([0.1, 0.5, 0.9]);
  });

  it('returns null for corrupt waveform JSON', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ data: 'not-json' });
    expect(await storage.getWaveform('track-1')).toBeNull();
  });
});
