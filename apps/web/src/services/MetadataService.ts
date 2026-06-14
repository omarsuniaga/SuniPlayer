import * as mm from 'music-metadata-browser';
import { ExtractedMetadata } from '../types/library';

export class MetadataService {
    /**
     * Extracts rich metadata from an audio file using music-metadata-browser.
     * Prioritizes ID3 tags/internal metadata and falls back to filename if needed.
     */
    static async extract(file: File): Promise<ExtractedMetadata> {
        try {
            const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000));
            const result = await Promise.race([mm.parseBlob(file), timeout]);
            if (!result) throw new Error("metadata timeout");
            const metadata = result;
            
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
                coverArt = new Blob([picture.data as BlobPart], { type: picture.format });
            }

            // Sanitización básica: limitamos a 256 caracteres y limpiamos HTML básico.
            const sanitize = (s: string | undefined): string | undefined => {
                if (!s) return undefined;
                // Eliminamos cualquier cosa que parezca una etiqueta HTML para prevenir XSS.
                return s.replace(/<[^>]*>?/gm, '').substring(0, 256).trim();
            };

            // Priority: Real metadata tags -> filename parsing
            let finalTitle = sanitize(title);
            let finalArtist = sanitize(artist);
            const finalGenre = sanitize(genre);

            // If metadata is missing or explicitly placeholder-like, try filename
            if (!finalTitle || finalTitle.trim() === "") {
                const filename = file.name.replace(/\.[^/.]+$/, ""); // remove extension
                if (filename.includes(" - ")) {
                    const parts = filename.split(" - ");
                    finalArtist = sanitize(parts[0]);
                    finalTitle = sanitize(parts[1]);
                } else {
                    finalTitle = sanitize(filename);
                }
            }

            // Standardize artist fallback
            if (!finalArtist || finalArtist.trim() === "") {
                finalArtist = "Unknown Artist";
            }

            return {
                title: finalTitle || "Untitled",
                artist: finalArtist,
                genre: finalGenre,
                bpm,
                key,
                duration,
                coverArt
            };
        } catch (error) {
            console.error("Error extracting metadata:", error);
            // Minimal fallback if parsing fails completely
            return {
                title: file.name.replace(/<[^>]*>?/gm, '').substring(0, 256).replace(/\.[^/.]+$/, "") || "Unknown",
                artist: "Unknown Artist",
                duration: 0
            };
        }
    }
}
