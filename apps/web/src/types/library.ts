import { Track } from "@suniplayer/core/types";

export interface ExtractedMetadata {
    title?: string;
    artist?: string;
    bpm?: number;
    key?: string;
    genre?: string;
    duration: number; // in seconds
    coverArt?: Blob;
}
