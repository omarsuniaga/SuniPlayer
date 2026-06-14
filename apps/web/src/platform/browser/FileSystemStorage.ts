// apps/web/src/platform/browser/FileSystemStorage.ts

/**
 * FileSystemStorage — Maneja el almacenamiento de archivos binarios grandes (Audio)
 * usando la API de Origin Private File System (OPFS).
 * Es mucho más rápido y estable que IndexedDB para archivos de +5MB.
 */
export class FileSystemStorage {
    private root: FileSystemDirectoryHandle | null = null;

    private async getRoot() {
        if (!this.root) {
            this.root = await navigator.storage.getDirectory();
        }
        return this.root;
    }

    async saveFile(fileName: string, data: Blob): Promise<void> {
        try {
            const root = await this.getRoot();
            const fileHandle = await root.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(data);
            await writable.close();
            console.log(`[OPFS] Archivo guardado: ${fileName}`);
        } catch (err) {
            console.error(`[OPFS] Error guardando ${fileName}:`, err);
            throw err;
        }
    }

    async getFile(fileName: string): Promise<File | null> {
        try {
            const root = await this.getRoot();
            const fileHandle = await root.getFileHandle(fileName);
            return await fileHandle.getFile();
        } catch (err) {
            return null;
        }
    }

    async removeFile(fileName: string): Promise<void> {
        try {
            const root = await this.getRoot();
            await root.removeEntry(fileName);
        } catch (err) {
            console.debug(`[FileSystemStorage] Could not remove file ${fileName} (maybe already deleted):`, err);
        }
    }
}

export const fileSystemStorage = new FileSystemStorage();
