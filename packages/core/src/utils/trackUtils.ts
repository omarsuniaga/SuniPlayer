import { Track } from "../types";

/**
 * Resolves the playback URL for a track based on its properties.
 * Handles Blobs (local), Demo Assets (public), and Remote URLs.
 * 
 * @param track The track to resolve
 * @param demoBaseUrl Base URL for demo assets (defaults to /audio/ for web)
 */
export function getTrackUrl(track: Track, demoBaseUrl = "/audio/"): string {
    if (!track) return "";

    // 1. Prioritize Blob URLs (Hydrated local files)
    if (track.blob_url) return track.blob_url;

    // 2. Handle Public/Demo assets
    if (!track.isCustom && track.file_path) {
        // En la web los audios demo viven en /audio/
        // En nativo se puede pasar una URL de streaming (ej. https://suniplayer.netlify.app/audio/)
        const base = demoBaseUrl.endsWith('/') ? demoBaseUrl : `${demoBaseUrl}/`;
        return `${base}${encodeURIComponent(track.file_path)}`;
    }

    // 3. Fallback to file_path (might be a remote URL)
    return track.file_path || "";
}
