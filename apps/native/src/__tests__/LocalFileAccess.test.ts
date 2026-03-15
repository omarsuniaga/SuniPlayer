jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///data/app/',
  copyAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  downloadAsync: jest.fn().mockResolvedValue({ uri: 'file:///data/app/audio/test.mp3' }),
}));

import { LocalFileAccess } from '../platform/LocalFileAccess';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

describe('LocalFileAccess', () => {
  const access = new LocalFileAccess();

  beforeEach(() => jest.clearAllMocks());

  it('resolveURL includes audio/ prefix', () => {
    expect(access.resolveURL('song.mp3')).toContain('audio/');
    expect(access.resolveURL('song.mp3')).toContain('song.mp3');
  });

  it('checkExists returns true when file exists', async () => {
    expect(await access.checkExists('song.mp3')).toBe(true);
  });

  it('importFile returns null when user cancels', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({ canceled: true, assets: null });
    expect(await access.importFile({ type: 'picker' })).toBeNull();
  });

  it('rejects non-audio MIME types', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///evil.exe', name: 'evil.exe', mimeType: 'application/octet-stream', size: 100 }],
    });
    expect(await access.importFile({ type: 'picker' })).toBeNull();
  });

  it('rejects files exceeding 200MB', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///big.mp3', name: 'big.mp3', mimeType: 'audio/mpeg', size: 201 * 1024 * 1024 }],
    });
    expect(await access.importFile({ type: 'picker' })).toBeNull();
  });

  it('copies valid audio file to sandbox', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///downloads/song.mp3', name: 'song.mp3', mimeType: 'audio/mpeg', size: 5 * 1024 * 1024 }],
    });
    const result = await access.importFile({ type: 'picker' });
    expect(result).not.toBeNull();
    expect(FileSystem.copyAsync).toHaveBeenCalled();
    expect(result?.name).toBe('song.mp3');
  });

  it('rejects non-HTTPS URL imports', async () => {
    expect(await access.importFile({ type: 'url', url: 'http://insecure.com/track.mp3' })).toBeNull();
  });

  it('sanitizes path traversal characters in filename', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///evil/../secret.mp3', name: '../secret.mp3', mimeType: 'audio/mpeg', size: 1000 }],
    });
    const result = await access.importFile({ type: 'picker' });
    expect(result?.name).not.toContain('..');
  });
});
