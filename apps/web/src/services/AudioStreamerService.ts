/**
 * AudioStreamerService — Gestión avanzada de descargas y buffering
 */

export interface DownloadProgress {
    percentage: number;
    speedKbps: number;
    loadedBytes: number;
    totalBytes: number;
}

export class AudioStreamerService {
    private static cacheName = "suniplayer-audio-v1";

    /**
     * Descarga un audio con seguimiento de velocidad y lo guarda en caché
     */
    static async fetchWithProgress(
        url: string, 
        onProgress: (p: DownloadProgress) => void
    ): Promise<string> {
        const cache = await caches.open(this.cacheName);
        const cachedResponse = await cache.match(url);

        if (cachedResponse) {
            onProgress({ percentage: 100, speedKbps: 0, loadedBytes: 0, totalBytes: 0 });
            const blob = await cachedResponse.blob();
            return URL.createObjectURL(blob);
        }

        const startTime = Date.now();
        const response = await fetch(url);
        
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
            const speedBytesPerSec = receivedLength / (durationSec || 1);
            const speedKbps = (speedBytesPerSec * 8) / 1024;

            onProgress({
                percentage: contentLength ? (receivedLength / contentLength) * 100 : 0,
                speedKbps: Math.round(speedKbps),
                loadedBytes: receivedLength,
                totalBytes: contentLength
            });
        }

        const fullBlob = new Blob(chunks as any[], { type: response.headers.get('Content-Type') ?? 'audio/mpeg' });
        
        // Guardar en caché para la próxima vez
        await cache.put(url, new Response(fullBlob));

        return URL.createObjectURL(fullBlob);
    }
}
