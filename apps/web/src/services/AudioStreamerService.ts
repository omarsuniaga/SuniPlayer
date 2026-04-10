/**
 * AudioStreamerService — Gestión optimizada de descargas.
 * Eliminada dependencia de Cache API para evitar errores de entorno.
 */

export interface DownloadProgress {
    percentage: number;
    speedKbps: number;
    loadedBytes: number;
    totalBytes: number;
}

export class AudioStreamerService {
    /**
     * Descarga un audio con seguimiento de velocidad.
     * Si la URL es un blob muerto, intenta recuperarlo del storage local.
     */
    static async fetchWithProgress(
        url: string,
        onProgress: (p: DownloadProgress) => void,
        trackId?: string // Agregamos trackId para búsqueda en storage
    ): Promise<string> {
        // 🚀 CORTOCIRCUITO 1: Blob URLs vivas no necesitan re-procesarse.
        if (url.startsWith('blob:')) {
            onProgress({ percentage: 100, speedKbps: 0, loadedBytes: 0, totalBytes: 0 });
            return url;
        }

        // 🚀 CORTOCIRCUITO 2: IDs de tracks locales (custom_ o lib-) no son URLs de fetch.
        // Si la URL empieza por estos prefijos y no parece una ruta de archivo (.mp3, .wav, etc),
        // vamos directo a recuperación local.
        const isInternalId = url.startsWith('custom_') || url.startsWith('lib-');
        const isFilePath = url.includes('.') && !url.includes(' '); // Tiene extensión y no espacios

        if (isInternalId && !isFilePath) {
            return this.recoverLocal(trackId || url, onProgress, url);
        }

        try {
            const response = await fetch(url);
            if (response.ok) {
                const contentType = response.headers.get('Content-Type') ?? '';
                if (contentType.startsWith('text/html')) {
                    // Vite/server returned SPA fallback (index.html) — file not found
                    console.warn(`[AudioStreamer] Fetch returned HTML for ${url}, attempting recovery...`);
                    return this.recoverLocal(trackId || url, onProgress, url);
                }
                return await this.processResponse(response, onProgress);
            }
        } catch (e) {
            console.warn("[AudioStreamer] Fetch failed, attempting local recovery for:", trackId || url, e);
        }

        return this.recoverLocal(trackId || url, onProgress, url);
    }

    /**
     * Intenta recuperar el audio del storage local (IndexedDB/OPFS).
     */
    private static async recoverLocal(
        trackId: string, 
        onProgress: (p: DownloadProgress) => void,
        originalUrl: string
    ): Promise<string> {
        if (!trackId) throw new Error(`No se pudo cargar el audio: ${originalUrl}`);

        const { storage } = await import("../platform/index");
        const localBlob = await storage.getAudioFile(trackId);
        
        if (localBlob) {
            console.log("[AudioStreamer] 🛡️ Successfully recovered track from local storage:", trackId);
            onProgress({ percentage: 100, speedKbps: 0, loadedBytes: localBlob.size, totalBytes: localBlob.size });
            return URL.createObjectURL(localBlob);
        }

        throw new Error(`Archivo no encontrado en almacenamiento local: ${trackId}. Es posible que el navegador haya limpiado los archivos temporales.`);
    }

    private static async processResponse(response: Response, onProgress: (p: DownloadProgress) => void): Promise<string> {
        const startTime = Date.now();
        if (!response.body) throw new Error("No response body");
        const reader = response.body.getReader();
        const contentLength = +(response.headers.get('Content-Length') ?? 0);
        
        let receivedLength = 0;
        const chunks: Uint8Array[] = [];

        while(true) {
            const {done, value} = await reader.read();
            if (done) break;
            chunks.push(value);
            receivedLength += value.length;
            const now = Date.now();
            const durationSec = (now - startTime) / 1000;
            const speedKbps = ((receivedLength / (durationSec || 1)) * 8) / 1024;

            onProgress({
                percentage: contentLength ? (receivedLength / contentLength) * 100 : 0,
                speedKbps: Math.round(speedKbps),
                loadedBytes: receivedLength,
                totalBytes: contentLength
            });
        }

        const fullBlob = new Blob(chunks as BlobPart[], { type: response.headers.get('Content-Type') ?? 'audio/mpeg' });
        return URL.createObjectURL(fullBlob);
    }
}
