import { describe, expect, it } from "vitest";

import type { Marker } from "../../../../types/marker";
import { compareMarkersByTime, sortMarkersByTime } from "./markerSorting";

function createMarker(overrides: Partial<Marker> = {}): Marker {
    return {
        id: "marker-1",
        trackId: "track-1",
        timeMs: 1000,
        label: "Marker",
        note: "Marker note",
        category: "general",
        shared: true,
        authorId: "user-1",
        authorName: "User One",
        authorColor: "#38bdf8",
        createdAt: "2026-04-04T15:00:00.000Z",
        updatedAt: "2026-04-04T15:00:00.000Z",
        deleted: false,
        deletedAt: null,
        deletedBy: null,
        ...overrides,
    };
}

describe("markerSorting", () => {
    it("sorts markers by time and keeps the original array untouched", () => {
        const markers = [
            createMarker({ id: "later", timeMs: 5000 }),
            createMarker({ id: "earlier", timeMs: 1000 }),
            createMarker({ id: "middle", timeMs: 3000 }),
        ];

        expect(sortMarkersByTime(markers).map((marker) => marker.id)).toEqual([
            "earlier",
            "middle",
            "later",
        ]);
        expect(markers.map((marker) => marker.id)).toEqual([
            "later",
            "earlier",
            "middle",
        ]);
    });

    it("breaks ties by createdAt and then id for deterministic ordering", () => {
        const firstCreated = createMarker({
            id: "first",
            timeMs: 2000,
            createdAt: "2026-04-04T14:59:00.000Z",
        });
        const secondCreated = createMarker({
            id: "second",
            timeMs: 2000,
            createdAt: "2026-04-04T15:01:00.000Z",
        });
        const sameCreatedHigherId = createMarker({
            id: "zeta",
            timeMs: 2000,
            createdAt: "2026-04-04T15:01:00.000Z",
        });

        expect(sortMarkersByTime([sameCreatedHigherId, secondCreated, firstCreated]).map((marker) => marker.id)).toEqual([
            "first",
            "second",
            "zeta",
        ]);
        expect(compareMarkersByTime(secondCreated, sameCreatedHigherId)).toBeLessThan(0);
    });
});
