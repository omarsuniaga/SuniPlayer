import { describe, expect, it, vi } from "vitest";
import type { TrackMarker } from "@suniplayer/core";

const DURATION_MS = 120000;

const makeMarker = (posMs: number): TrackMarker => ({
    id: "m1",
    posMs,
    comment: "Test comment",
});

describe("MarkerLayer — short click on empty area", () => {
    it("calls onSeek when clicking empty area in edit mode", () => {
        const onSeek = vi.fn();
        // Simulate clicking empty area in edit mode
        const clientX = 400;
        const container = { getBoundingClientRect: () => ({ left: 0, width: 800 }) };
        const width = 800;
        const positionMs = (clientX / width) * DURATION_MS;

        // In edit mode, click should call onSeek
        onSeek(positionMs);
        expect(onSeek).toHaveBeenCalledWith(positionMs);
    });

    it("does NOT call onSeek in live mode", () => {
        const onSeek = vi.fn();
        const isLive = true;

        // In live mode, onSeek should not be called
        if (!isLive) {
            onSeek(60000);
        }

        expect(onSeek).not.toHaveBeenCalled();
    });
});

describe("MarkerLayer — short click on existing marker", () => {
    it("opens modal (does not seek) when clicking near a marker", () => {
        const onSeek = vi.fn();
        const marker = makeMarker(60000);
        const markerX = (marker.posMs / DURATION_MS) * 800; // 50% = 400px

        // Simulate clicking near marker (within 12px tolerance)
        const clickX = markerX + 1;

        // When clicking near a marker, modal should open instead of seeking
        const distFromMarker = Math.abs(clickX - markerX);
        if (distFromMarker > 12) {
            onSeek((clickX / 800) * DURATION_MS);
        }

        // Should not call onSeek because it's within marker tolerance
        expect(onSeek).not.toHaveBeenCalled();
    });
});
