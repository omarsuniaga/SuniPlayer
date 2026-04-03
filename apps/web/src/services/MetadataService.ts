import * as mm from 'music-metadata-browser';
import { ExtractedMetadata } from '../types/library';

export class MetadataService {
    /**
     * Extracts rich metadata from an audio file using music-metadata-browser.
     * Prioritizes ID3 tags/internal metadata and falls back to filename if needed.
     */
    static async extract(file: File): Promise<ExtractedMetadata> {
        try {
            const metadata = await mm.parseBlob(file);
            
            const duration = metadata.format.duration || 0;
            const title = metadata.common.title;
            const artist = metadata.common.artist;
            const genre = metadata.common.genre?.[0];
            const bpm = metadata.common.bpm ? Math.round(metadata.common.bpm) : undefined;
            const key = metadata.common.key;
            
            // Extract cover art if available
            let coverArt: Blob | undefined;
            const picture = mm.selectCover(metadata.common.picture);
            if (picture) {
                coverArt = new Blob([picture.data as any], { type: picture.format });
            }

            // Fallback for title/artist from filename if missing in metadata
            // filename example: "Artist - Title.mp3"
            let finalTitle = title;
            let finalArtist = artist;

            if (!finalTitle || !finalArtist) {
                const filename = file.name.replace(/\.[^/.]+$/, ""); // remove extension
                if (filename.includes(" - ")) {
                    const parts = filename.split(" - ");
                    if (!finalArtist) finalArtist = parts[0].trim();
                    if (!finalTitle) finalTitle = parts[1].trim();
                } else if (!finalTitle) {
                    finalTitle = filename;
                }
            }

            return {
                title: finalTitle,
                artist: finalArtist || "Unknown Artist",
                genre,
                bpm,
                key,
                duration,
                coverArt
            };
        } catch (error) {
            console.error("Error extracting metadata:", error);
            // Minimal fallback if parsing fails completely
            return {
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: "Unknown Artist",
                duration: 0
            };
        }
    }
}
