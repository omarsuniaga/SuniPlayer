import { Track } from "../types";

/**
 * Resolves the playback URL for a track based on its properties.
 * Handles Blobs (local), Demo Assets (public), and Remote URLs.
 */
export function getTrackUrl(track: Track): string {
    if (!track) return "";

    // 1. Prioritize Blob URLs (Hydrated local files)
    if (track.blob_url) return track.blob_url;

    // 2. Handle Public/Demo assets
    if (!track.isCustom && track.file_path) {
        // En la web los audios demo viven en /audio/
        return `/audio/${encodeURIComponent(track.file_path)}`;
    }

    // 3. Fallback to file_path (might be a remote URL)
    return track.file_path || "";
}
