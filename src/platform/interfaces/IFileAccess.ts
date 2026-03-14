// src/platform/interfaces/IFileAccess.ts

export interface ImportedFile {
    /** Playable URL (blob URL on web, file:// URI on iOS/Android) */
    url: string;
    /** Original filename */
    name: string;
    /** MIME type if available */
    mimeType?: string;
    /** File size in bytes */
    sizeBytes?: number;
}

export type FileSource =
    | { type: "picker" }         // user picks a file via OS dialog
    | { type: "url"; url: string }; // from a known URL

/**
 * IFileAccess — Contract for audio file access and import.
 *
 * Web: fetch HEAD for existence, blob URL for imports
 * iOS: NSFileManager + UIDocumentPickerViewController
 * React Native: react-native-document-picker + react-native-fs
 */
export interface IFileAccess {
    /**
     * Check if an audio file exists.
     * filePath is bare (e.g. "Song.mp3") — implementation resolves to full URL.
     */
    checkExists(filePath: string): Promise<boolean>;

    /**
     * Resolve a bare file_path to a playable URL.
     * Web: "/audio/Song.mp3"
     * iOS bundle: "bundle://Song.mp3"
     * iOS imported: file:// URI from Documents directory
     */
    resolveURL(filePath: string): string;

    /** Let the user pick a file from the device. Returns null if cancelled. */
    importFile(source: FileSource): Promise<ImportedFile | null>;
}
