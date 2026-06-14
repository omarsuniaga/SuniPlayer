import type { TrackMarker } from "@suniplayer/core";

import type { Marker, MarkerCategory, MarkerTimestamp } from "../../../../types/marker";
import {
    DEFAULT_MARKER_AUTHOR_COLOR,
    DEFAULT_MARKER_AUTHOR_ID,
    DEFAULT_MARKER_AUTHOR_NAME,
    DEFAULT_MARKER_CATEGORY,
    DEFAULT_MARKER_TIMESTAMP,
} from "../markerDefaults";

export interface TrackMarkerAdapterContext {
    trackId: string;
    timestamp?: MarkerTimestamp;
    category?: MarkerCategory;
    shared?: boolean;
    authorId?: string;
    authorName?: string;
    authorColor?: string;
}

export function fromTrackMarker(legacyMarker: TrackMarker, context: TrackMarkerAdapterContext): Marker {
    const timestamp = context.timestamp ?? DEFAULT_MARKER_TIMESTAMP;
    const label = legacyMarker.comment.trim();

    return {
        id: legacyMarker.id,
        trackId: context.trackId,
        timeMs: legacyMarker.posMs,
        label,
        note: legacyMarker.comment,
        category: context.category ?? DEFAULT_MARKER_CATEGORY,
        shared: context.shared ?? true,
        authorId: context.authorId ?? DEFAULT_MARKER_AUTHOR_ID,
        authorName: context.authorName ?? DEFAULT_MARKER_AUTHOR_NAME,
        authorColor: context.authorColor ?? DEFAULT_MARKER_AUTHOR_COLOR,
        createdAt: timestamp,
        updatedAt: timestamp,
        deleted: false,
        deletedAt: null,
        deletedBy: null,
    };
}

export function toTrackMarker(marker: Marker): TrackMarker {
    const comment = marker.note.trim().length > 0 ? marker.note : marker.label;

    return {
        id: marker.id,
        posMs: marker.timeMs,
        comment,
    };
}
