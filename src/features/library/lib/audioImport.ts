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
