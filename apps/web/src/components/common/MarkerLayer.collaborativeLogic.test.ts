import type { TrackMarker } from "@suniplayer/core";
import { describe, expect, it } from "vitest";

import type { Marker } from "../../types/marker";
import { resolveRenderMarkers } from "./MarkerLayer";

const legacyMarkers: TrackMarker[] = [
    {
        id: "legacy-1",
        posMs: 5000,
        comment: "Legacy comment",
    },
];

const collaborativeMarkers: Marker[] = [
    {
        id: "collab-1",
        trackId: "track-1",
        timeMs: 10000,
        label: "Entrada",
        note: "Abrir con batería",
        category: "cue",
        shared: true,
        authorId: "user-1",
        authorName: "Ana",
        authorColor: "#06b6d4",
        createdAt: "2026-04-04T00:00:00.000Z",
        updatedAt: "2026-04-04T00:00:00.000Z",
        deleted: false,
        deletedAt: null,
        deletedBy: null,
    },
];

describe("MarkerLayer collaborative data resolution", () => {
    it("keeps legacy markers when collaboration is disabled", () => {
        expect(resolveRenderMarkers({
            legacyMarkers,
            collaborativeMarkers,
            collaborativeEnabled: false,
        })).toEqual(legacyMarkers);
    });

    it("converts collaborative markers into the legacy render shape when collaboration is enabled", () => {
        expect(resolveRenderMarkers({
            legacyMarkers,
            collaborativeMarkers,
            collaborativeEnabled: true,
        })).toEqual([
            {
                id: "collab-1",
                posMs: 10000,
                comment: "Abrir con batería",
            },
        ]);
    });
});
