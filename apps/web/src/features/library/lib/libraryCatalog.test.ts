import { describe, expect, it, vi } from "vitest";

import { TRACKS, type Track } from "@suniplayer/core";
import {
    appendTrackToQueueTail,
    buildLibraryCatalog,
    buildPlayerLaunchQueue,
    checkCloudTrackAvailability,
    getLibraryTrackOrigin,
} from "./libraryCatalog";

describe("libraryCatalog helpers", () => {
    it("merges catalog and custom tracks into a single sorted list", () => {
        const customTrack: Track = {
            id: "custom-1",
            title: "Alpha Song",
            artist: "Artist",
            duration_ms: 123000,
            isCustom: true,
        };

        const catalog = buildLibraryCatalog([TRACKS[1]], [customTrack]);

        expect(catalog.map((track) => track.id)).toEqual(["custom-1", TRACKS[1].id]);
        expect(catalog[0].isCustom).toBe(true);
        expect(catalog[1].isCustom).toBe(false);
    });

    it("appends tapped tracks to the tail of the queue", () => {
        const baseQueue = [TRACKS[0], TRACKS[1]];

        const result = appendTrackToQueueTail(baseQueue, TRACKS[2]);

        expect(result.queue).toHaveLength(3);
        expect(result.queue[2].id).toBe(TRACKS[2].id);
        expect(result.queue[2].instanceId).toBeDefined();
        expect(result.targetSeconds).toBeGreaterThan(0);
    });

    it("builds a single-track player launch queue", () => {
        const result = buildPlayerLaunchQueue(TRACKS[0]);

        expect(result.queue).toHaveLength(1);
        expect(result.queue[0].id).toBe(TRACKS[0].id);
        expect(result.queue[0].instanceId).toBeDefined();
    });

    it("classifies custom tracks as local and catalog tracks as cloud", () => {
        expect(getLibraryTrackOrigin({ ...TRACKS[0], isCustom: true })).toBe("local");
        expect(getLibraryTrackOrigin(TRACKS[0])).toBe("cloud");
    });

    it("returns an honest fallback message when cloud availability cannot be verified", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

        await expect(checkCloudTrackAvailability(TRACKS[0])).resolves.toMatch(/No se pudo verificar/i);

        vi.unstubAllGlobals();
    });
});
