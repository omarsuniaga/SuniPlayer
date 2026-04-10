import { describe, expect, it } from "vitest";

import type { Marker } from "../../../../types/marker";
import { filterActiveMarkers, filterVisibleMarkers, isMarkerVisibleToUser } from "./markerFilters";

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

describe("markerFilters", () => {
    it("filters deleted markers out of the active collection", () => {
        const activeMarker = createMarker({ id: "active" });
        const deletedMarker = createMarker({
            id: "deleted",
            deleted: true,
            deletedAt: "2026-04-04T15:05:00.000Z",
            deletedBy: "user-2",
        });

        expect(filterActiveMarkers([activeMarker, deletedMarker])).toEqual([activeMarker]);
    });

    it("allows shared markers for any viewer and private markers for the author", () => {
        const sharedMarker = createMarker({ id: "shared", shared: true, authorId: "user-2" });
        const personalMarker = createMarker({ id: "personal", shared: false, authorId: "user-1" });

        expect(isMarkerVisibleToUser(sharedMarker, "user-9")).toBe(true);
        expect(isMarkerVisibleToUser(personalMarker, "user-1")).toBe(true);
        expect(isMarkerVisibleToUser(personalMarker, "user-9")).toBe(false);
    });

    it("filters markers by active visibility for the current user", () => {
        const visibleShared = createMarker({ id: "shared", shared: true, authorId: "user-2" });
        const visibleOwn = createMarker({ id: "own", shared: false, authorId: "user-1" });
        const hiddenOther = createMarker({ id: "hidden", shared: false, authorId: "user-3" });
        const deletedOwn = createMarker({
            id: "deleted-own",
            shared: false,
            authorId: "user-1",
            deleted: true,
        });

        expect(filterVisibleMarkers(
            [visibleShared, visibleOwn, hiddenOther, deletedOwn],
            "user-1"
        )).toEqual([visibleShared, visibleOwn]);
    });
});
