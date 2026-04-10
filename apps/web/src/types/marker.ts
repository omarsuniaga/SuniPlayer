export type MarkerCategory = "general" | "cue" | "note" | "section" | "warning";

export type MarkerTimestamp = string;

export interface MarkerAuthor {
    id: string;
    name: string;
    color: string;
}

export interface Marker {
    id: string;
    trackId: string;
    timeMs: number;
    label: string;
    note: string;
    category: MarkerCategory;
    shared: boolean;
    authorId: string;
    authorName: string;
    authorColor: string;
    createdAt: MarkerTimestamp;
    updatedAt: MarkerTimestamp;
    deleted: boolean;
    deletedAt?: MarkerTimestamp | null;
    deletedBy?: string | null;
}

export interface CreateMarkerInput {
    trackId: string;
    timeMs: number;
    label: string;
    note: string;
    category: MarkerCategory;
    shared: boolean;
    author: MarkerAuthor;
}

export interface UpdateMarkerInput {
    label?: string;
    note?: string;
    category?: MarkerCategory;
    shared?: boolean;
    updatedAt?: MarkerTimestamp;
}
