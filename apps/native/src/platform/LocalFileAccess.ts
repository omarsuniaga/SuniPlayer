import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import type { IFileAccess, ImportedFile, FileSource } from '@suniplayer/core';

// Security: only audio MIME types accepted
const ALLOWED_AUDIO_MIMES = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a',
  'audio/wav', 'audio/wave', 'audio/x-wav',
  'audio/aiff', 'audio/x-aiff',
  'audio/flac', 'audio/x-flac',
  'audio/ogg', 'audio/vorbis',
]);

// Security: extension whitelist (second layer of validation)
const ALLOWED_EXTENSIONS = new Set(['mp3', 'm4a', 'wav', 'aiff', 'aif', 'flac', 'ogg']);

// Security: max file size 200 MB (prevents accidental video import)
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;

const AUDIO_DIR = `${FileSystem.documentDirectory}audio/`;

function sanitizeFilename(name: string): string {
  // Remove path traversal characters and control characters
  return name.replace(/[/\\:*?"<>|]/g, '_').replace(/\.\./g, '_').trim();
}

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function isAllowedFile(name: string, mimeType?: string): boolean {
  const extOk = ALLOWED_EXTENSIONS.has(getExtension(name));
  const mimeOk = mimeType ? ALLOWED_AUDIO_MIMES.has(mimeType) : true;
  return extOk && mimeOk;
}

export class LocalFileAccess implements IFileAccess {
  private async ensureAudioDir(): Promise<void> {
    const info = await FileSystem.getInfoAsync(AUDIO_DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
  }

  async checkExists(filePath: string): Promise<boolean> {
    const info = await FileSystem.getInfoAsync(this.resolveURL(filePath));
    return info.exists;
  }

  resolveURL(filePath: string): string {
    if (filePath.startsWith('file://')) return filePath;
    return `${AUDIO_DIR}${encodeURIComponent(filePath)}`;
  }

  async importFile(source: FileSource): Promise<ImportedFile | null> {
    if (source.type === 'url') {
      // Security: only HTTPS URLs accepted
      if (!source.url.startsWith('https://')) {
        console.warn('[LocalFileAccess] Only HTTPS URLs accepted');
        return null;
      }
      await this.ensureAudioDir();
      const filename = sanitizeFilename(source.url.split('/').pop() ?? 'audio.mp3');
      const dest = `${AUDIO_DIR}${filename}`;
      const result = await FileSystem.downloadAsync(source.url, dest);
      return { url: result.uri, name: filename };
    }

    const pickerResult = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: false,
      multiple: false,
    });

    if (pickerResult.canceled || !pickerResult.assets?.length) return null;
    const asset = pickerResult.assets[0];

    // Security validations
    if (!isAllowedFile(asset.name, asset.mimeType ?? undefined)) {
      console.warn(`[LocalFileAccess] Rejected: ${asset.name} (type: ${asset.mimeType})`);
      return null;
    }
    if (asset.size && asset.size > MAX_FILE_SIZE_BYTES) {
      console.warn(`[LocalFileAccess] Rejected: ${asset.name} exceeds 200MB`);
      return null;
    }

    await this.ensureAudioDir();
    const safeName = sanitizeFilename(asset.name);
    const dest = `${AUDIO_DIR}${safeName}`;
    // Copy to app sandbox — ensures persistent access without re-import
    await FileSystem.copyAsync({ from: asset.uri, to: dest });
    return { url: dest, name: safeName, mimeType: asset.mimeType ?? undefined, sizeBytes: asset.size ?? undefined };
  }
}
