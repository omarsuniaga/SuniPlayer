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
        // 🚀 CORTOCIRCUITO: Blob URLs vivas no necesitan re-procesarse.
        // Re-fetchear un blob crea una nueva URL → isNewSrc=true → audio.load() → posición reseteada + sin fade.
        if (url.startsWith('blob:')) {
            onProgress({ percentage: 100, speedKbps: 0, loadedBytes: 0, totalBytes: 0 });
            return url;
        }

        try {
            const response = await fetch(url);
            if (response.ok) {
                // Si el fetch funciona (URL viva), procesamos normalmente
                return await this.processResponse(response, onProgress);
            }
        } catch (e) {
            console.warn("[AudioStreamer] Fetch failed, attempting local recovery for:", trackId);
        }

        // 🛡️ RECUPERACIÓN LOCAL: Si falló el fetch o la URL era un blob muerto
        if (trackId) {
            const { storage } = await import("../platform/index");
            const localBlob = await storage.getAudioFile(trackId);
            if (localBlob) {
                console.log("[AudioStreamer] 🛡️ Successfully recovered track from local storage:", trackId);
                onProgress({ percentage: 100, speedKbps: 0, loadedBytes: localBlob.size, totalBytes: localBlob.size });
                return URL.createObjectURL(localBlob);
            }
        }

        throw new Error(`No se pudo cargar el audio: ${url}`);
    }

    private static async processResponse(response: Response, onProgress: (p: DownloadProgress) => void): Promise<string> {
        const startTime = Date.now();
        if (!response.body) throw new Error("No response body");
        const reader = response.body.getReader();
        const contentLength = +(response.headers.get('Content-Length') ?? 0);
        
        let receivedLength = 0;
        let chunks: Uint8Array[] = [];

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

        const fullBlob = new Blob(chunks, { type: response.headers.get('Content-Type') ?? 'audio/mpeg' });
        return URL.createObjectURL(fullBlob);
    }
}
