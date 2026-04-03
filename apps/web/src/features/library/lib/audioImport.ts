import { MetadataService } from "../../../services/MetadataService";
import { analyzeAudio, AnalysisResults } from "../../../services/analysisService";
import { ExtractedMetadata } from "../../../types/library";

export const SUPPORTED_AUDIO_FILE_PATTERN = /\.(mp3|wav|ogg|oga|aac|m4a|flac)$/i;
export const SUPPORTED_AUDIO_FILE_ACCEPT = [
    "audio/*",
    ".mp3",
    ".wav",
    ".m4a",
    ".aac",
    ".flac",
    ".ogg",
    ".oga",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
    "audio/x-aac",
    "audio/flac",
    "audio/ogg",
].join(",");

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

/**
 * Parses a filename to extract potential artist and title.
 * Expected format: "Artist - Title.mp3"
 */
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
 * 1. Extract ID3/Metadata (Prioritizing real tags over filenames)
 * 2. Perform Waveform/BPM/Key Analysis
 */
export async function processAudioFile(file: File): Promise<ProcessedAudioFile> {
    // 1. Extract Metadata (ID3) - This now has the correct priority
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

        // If analysis found BPM and metadata didn't, use analysis
        if (!metadata.bpm && analysis.bpm) {
            metadata.bpm = Math.round(analysis.bpm);
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
