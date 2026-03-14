// src/platform/browser/BlobFileAccess.ts
import type { IFileAccess, ImportedFile, FileSource } from '../interfaces/IFileAccess';

const AUDIO_PREFIX = '/audio/';

export class BlobFileAccess implements IFileAccess {
    async checkExists(filePath: string): Promise<boolean> {
        const url = this.resolveURL(filePath);
        try {
            const res = await fetch(url, { method: 'HEAD' });
            return res.ok;
        } catch {
            return false;
        }
    }

    resolveURL(filePath: string): string {
        if (filePath.startsWith('/') || filePath.startsWith('blob:')) return filePath;
        return `${AUDIO_PREFIX}${encodeURIComponent(filePath)}`;
    }

    async importFile(source: FileSource): Promise<ImportedFile | null> {
        if (source.type === 'url') {
            return { url: source.url, name: source.url.split('/').pop() ?? 'audio' };
        }
        // Browser file picker via hidden input
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'audio/*';
            input.onchange = () => {
                const file = input.files?.[0];
                if (!file) { resolve(null); return; }
                resolve({
                    url: URL.createObjectURL(file),
                    name: file.name,
                    mimeType: file.type,
                    sizeBytes: file.size,
                });
            };
            input.oncancel = () => resolve(null);
            input.click();
        });
    }
}
