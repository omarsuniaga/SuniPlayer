import type {
    CreateMarkerInput,
    Marker,
    MarkerCategory,
    MarkerTimestamp,
    UpdateMarkerInput,
} from "../../../../types/marker";
import {
    DEFAULT_MARKER_AUTHOR_COLOR,
    DEFAULT_MARKER_AUTHOR_ID,
    DEFAULT_MARKER_AUTHOR_NAME,
    DEFAULT_MARKER_CATEGORY,
    DEFAULT_MARKER_TIMESTAMP,
} from "../markerDefaults";

export interface TimestampLike {
    toDate(): Date;
}

export interface FirestoreMarkerDocument {
    trackId?: unknown;
    timeMs?: unknown;
    label?: unknown;
    note?: unknown;
    category?: unknown;
    shared?: unknown;
    authorId?: unknown;
    authorName?: unknown;
    authorColor?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
    deleted?: unknown;
    deletedAt?: unknown;
    deletedBy?: unknown;
}

export interface FirestoreMarkerCreatePayload {
    trackId: string;
    timeMs: number;
    label: string;
    note: string;
    category: MarkerCategory;
    shared: boolean;
    authorId: string;
    authorName: string;
    authorColor: string;
    createdAt: unknown;
    updatedAt: unknown;
    deleted: false;
    deletedAt: null;
    deletedBy: null;
}

export interface FirestoreMarkerUpdatePayload {
    label?: string;
    note?: string;
    category?: MarkerCategory;
    shared?: boolean;
    updatedAt: unknown;
}

export interface FirestoreMarkerSoftDeletePayload {
    deleted: true;
    deletedAt: unknown;
    deletedBy: string;
    updatedAt: unknown;
}

export interface SerializeMarkerMutationContext {
    timestamp: unknown;
}

export interface SoftDeleteMarkerContext {
    deletedBy: string;
    timestamp: unknown;
}

export function mapFirestoreMarkerDocument(
    id: string,
    raw: FirestoreMarkerDocument
): Marker | null {
    if (typeof raw.trackId !== "string" || raw.trackId.trim().length === 0) {
        return null;
    }

    if (typeof raw.timeMs !== "number" || !Number.isFinite(raw.timeMs)) {
        return null;
    }

    const label = normalizeText(raw.label);
    const note = normalizeText(raw.note, label);
    const createdAt = normalizeTimestamp(raw.createdAt);
    const updatedAt = normalizeTimestamp(raw.updatedAt, createdAt);
    const deleted = typeof raw.deleted === "boolean" ? raw.deleted : false;
    const deletedAt = deleted ? normalizeNullableTimestamp(raw.deletedAt) : null;
    const deletedBy = deleted ? normalizeNullableString(raw.deletedBy) : null;

    return {
        id,
        trackId: raw.trackId,
        timeMs: raw.timeMs,
        label,
        note,
        category: normalizeCategory(raw.category),
        shared: typeof raw.shared === "boolean" ? raw.shared : true,
        authorId: normalizeText(raw.authorId, DEFAULT_MARKER_AUTHOR_ID),
        authorName: normalizeText(raw.authorName, DEFAULT_MARKER_AUTHOR_NAME),
        authorColor: normalizeText(raw.authorColor, DEFAULT_MARKER_AUTHOR_COLOR),
        createdAt,
        updatedAt,
        deleted,
        deletedAt,
        deletedBy,
    };
}

export function serializeCreateMarker(
    input: CreateMarkerInput,
    context: SerializeMarkerMutationContext
): FirestoreMarkerCreatePayload {
    return {
        trackId: input.trackId,
        timeMs: input.timeMs,
        label: input.label,
        note: input.note,
        category: input.category,
        shared: input.shared,
        authorId: input.author.id,
        authorName: input.author.name,
        authorColor: input.author.color,
        createdAt: context.timestamp,
        updatedAt: context.timestamp,
        deleted: false,
        deletedAt: null,
        deletedBy: null,
    };
}

export function serializeUpdateMarker(
    input: UpdateMarkerInput,
    context: SerializeMarkerMutationContext
): FirestoreMarkerUpdatePayload {
    const payload: FirestoreMarkerUpdatePayload = {
        updatedAt: context.timestamp,
    };

    if (typeof input.label === "string") {
        payload.label = input.label;
    }

    if (typeof input.note === "string") {
        payload.note = input.note;
    }

    if (typeof input.category === "string") {
        payload.category = input.category;
    }

    if (typeof input.shared === "boolean") {
        payload.shared = input.shared;
    }

    return payload;
}

export function serializeSoftDeleteMarker(
    context: SoftDeleteMarkerContext
): FirestoreMarkerSoftDeletePayload {
    return {
        deleted: true,
        deletedAt: context.timestamp,
        deletedBy: context.deletedBy,
        updatedAt: context.timestamp,
    };
}

function normalizeText(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : fallback;
}

function normalizeNullableString(value: unknown): string | null {
    return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeCategory(value: unknown): MarkerCategory {
    return isMarkerCategory(value) ? value : DEFAULT_MARKER_CATEGORY;
}

function normalizeTimestamp(value: unknown, fallback = DEFAULT_MARKER_TIMESTAMP): MarkerTimestamp {
    if (typeof value === "string" && value.length > 0) {
        return value;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString();
    }

    if (isTimestampLike(value)) {
        const date = value.toDate();
        if (!Number.isNaN(date.getTime())) {
            return date.toISOString();
        }
    }

    return fallback;
}

function normalizeNullableTimestamp(value: unknown): MarkerTimestamp | null {
    if (value === null || typeof value === "undefined") {
        return null;
    }

    return normalizeTimestamp(value, DEFAULT_MARKER_TIMESTAMP);
}

function isTimestampLike(value: unknown): value is TimestampLike {
    return typeof value === "object"
        && value !== null
        && "toDate" in value
        && typeof (value as TimestampLike).toDate === "function";
}

function isMarkerCategory(value: unknown): value is MarkerCategory {
    return value === "general"
        || value === "cue"
        || value === "note"
        || value === "section"
        || value === "warning";
}
