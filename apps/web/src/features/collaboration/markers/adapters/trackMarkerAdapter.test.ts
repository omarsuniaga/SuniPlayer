import { describe, expect, it } from "vitest";
import type { TrackMarker } from "@suniplayer/core";

import { fromTrackMarker, toTrackMarker } from "./trackMarkerAdapter";

const legacyMarker: TrackMarker = {
    id: "marker-1",
    posMs: 42000,
    comment: "Entrada del coro",
};

describe("trackMarkerAdapter", () => {
    it("maps legacy markers into the collaborative marker contract", () => {
        const marker = fromTrackMarker(legacyMarker, {
            trackId: "track-123",
            timestamp: "2026-04-04T15:30:00.000Z",
            authorId: "user-7",
            authorName: "Lucía",
            authorColor: "#22c55e",
            shared: false,
            category: "cue",
        });

        expect(marker).toEqual({
            id: "marker-1",
            trackId: "track-123",
            timeMs: 42000,
            label: "Entrada del coro",
            note: "Entrada del coro",
            category: "cue",
            shared: false,
            authorId: "user-7",
            authorName: "Lucía",
            authorColor: "#22c55e",
            createdAt: "2026-04-04T15:30:00.000Z",
            updatedAt: "2026-04-04T15:30:00.000Z",
            deleted: false,
            deletedAt: null,
            deletedBy: null,
        });
    });

    it("uses stable defaults for missing collaborative metadata", () => {
        const marker = fromTrackMarker(legacyMarker, {
            trackId: "track-legacy",
        });

        expect(marker.trackId).toBe("track-legacy");
        expect(marker.shared).toBe(true);
        expect(marker.category).toBe("general");
        expect(marker.authorId).toBe("legacy");
        expect(marker.createdAt).toBe("1970-01-01T00:00:00.000Z");
    });

    it("maps collaborative markers back to the legacy TrackMarker shape", () => {
        const roundTripMarker = toTrackMarker(fromTrackMarker(legacyMarker, {
            trackId: "track-roundtrip",
            timestamp: "2026-04-04T15:30:00.000Z",
        }));

        expect(roundTripMarker).toEqual(legacyMarker);
    });

    it("prefers label when the collaborative marker note is empty", () => {
        expect(toTrackMarker({
            id: "marker-2",
            trackId: "track-123",
            timeMs: 12000,
            label: "Repetición",
            note: "   ",
            category: "section",
            shared: true,
            authorId: "user-1",
            authorName: "Lola",
            authorColor: "#f97316",
            createdAt: "2026-04-04T16:00:00.000Z",
            updatedAt: "2026-04-04T16:00:00.000Z",
            deleted: false,
            deletedAt: null,
            deletedBy: null,
        })).toEqual({
            id: "marker-2",
            posMs: 12000,
            comment: "Repetición",
        });
    });
});
