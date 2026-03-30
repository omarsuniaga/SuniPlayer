import * as mm from 'music-metadata-browser';
import { audioCache } from './db';
import { Track } from '@suniplayer/core';

export class LocalLibraryService {
    /**
     * Procesa un archivo seleccionado por el usuario
     */
    static async importFile(file: File): Promise<Track> {
        // 1. Extraer Metadatos
        const metadata = await mm.parseBlob(file);
        const duration_ms = (metadata.format.duration || 0) * 1000;
        
        // 2. Generar ID único
        const id = crypto.randomUUID();
        
        // 3. Guardar el archivo real en IndexedDB (Persistencia)
        await audioCache.saveAudioFile(id, file, file.name);
        
        // 4. Crear el objeto Track de SuniPlayer
        const track: Track = {
            id,
            title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ""),
            artist: metadata.common.artist || "Artista Local",
            duration_ms,
            bpm: Math.round(metadata.common.bpm || 120),
            key: metadata.common.key || "C",
            energy: 5, // Default
            mood: "calm", // Default
            file_path: file.name,
            analysis_cached: true,
            isCustom: true,
            blob_url: URL.createObjectURL(file) // Para uso inmediato
        };

        return track;
    }

    /**
     * Recupera el Blob de un track guardado para poder reproducirlo
     */
    static async getTrackBlobUrl(track: Track): Promise<string> {
        if (!track.isCustom) return "";
        
        // Intentar sacar de la base de datos local
        const blob = await audioCache.getAudioFile(track.id);
        if (blob) {
            return URL.createObjectURL(blob);
        }
        
        throw new Error("Archivo local no encontrado en la base de datos");
    }
}
