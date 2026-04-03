import { MetadataService } from "../../../services/MetadataService";
import { analyzeAudio, AnalysisResults } from "../../../services/analysisService";
import { ExtractedMetadata } from "../../../types/library";

export const SUPPORTED_AUDIO_FILE_PATTERN = /\.(mp3|wav|ogg|aac|m4a|flac)$/i;

export interface AudioFileLike {
    name: string;
    type?: string;
    webkitRelativePath?: string;
}

export interface ImportCandidate {
    file: File;
    relativePath?: string;
}

export interface ProcessedAudioFile {
    metadata: ExtractedMetadata;
    analysis: AnalysisResults;
    file: File;
}

export function isSupportedAudioFile(file: AudioFileLike): boolean {
    return Boolean(file.type?.startsWith("audio/") || SUPPORTED_AUDIO_FILE_PATTERN.test(file.name));
}

export function parseTrackName(filename: string): { title: string; artist: string } {
    const base = filename.replace(/\.[^/.]+$/, "");
    const parts = base.split(" - ");

    if (parts.length >= 2) {
        return {
            artist: parts[0].trim(),
            title: parts.slice(1).join(" - ").trim(),
        };
    }

    return {
        artist: "Unknown Artist",
        title: base.trim(),
    };
}

export function getRelativeAudioPath(file: AudioFileLike, fallbackName?: string): string {
    return file.webkitRelativePath || fallbackName || file.name;
}

/**
 * Orchestrates the full import process for a single file:
 * 1. Extract ID3/Metadata
 * 2. Perform Waveform/BPM/Key Analysis
 */
export async function processAudioFile(file: File): Promise<ProcessedAudioFile> {
    // 1. Extract Metadata (ID3)
    const metadata = await MetadataService.extract(file);

    // 2. Perform Audio Analysis
    const arrayBuffer = await file.arrayBuffer();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    
    try {
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const analysis = await analyzeAudio(audioBuffer);
        
        // Ensure duration from analysis is used if metadata duration is unreliable
        if (metadata.duration === 0 && audioBuffer.duration > 0) {
            metadata.duration = audioBuffer.duration;
        }

        return {
            metadata,
            analysis,
            file
        };
    } finally {
        await audioCtx.close();
    }
}
