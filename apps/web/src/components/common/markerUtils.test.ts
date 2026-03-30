import { describe, expect, it } from "vitest";
import {
    findNearbyMarker,
    blinkDurationSec,
    getBubbleState,
} from "./markerUtils";
import type { TrackMarker } from "@suniplayer/core";

const marker = (id: string, posMs: number): TrackMarker => ({
    id,
    posMs,
    comment: "test",
});

// â”€â”€ findNearbyMarker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("findNearbyMarker", () => {
    const markers = [marker("a", 30000), marker("b", 90000)];
    // waveformWidth=800, durationMs=120000
    // posMs=30000 â†’ x = 30000/120000*800 = 200px
    // posMs=90000 â†’ x = 90000/120000*800 = 600px
    // tolerance = 12/800*120000 = 1800ms

    it("returns null when list is empty", () => {
        expect(findNearbyMarker(200, 800, 120000, [])).toBeNull();
    });

    it("returns marker when click is within tolerance", () => {
        // 205px â†’ posMs=30750, delta to marker a = 750ms < 1800ms â†’ hit
        expect(findNearbyMarker(205, 800, 120000, markers)?.id).toBe("a");
    });

    it("returns null when click is outside tolerance", () => {
        // 220px â†’ posMs=33000, delta = 3000ms > 1800ms â†’ miss
        expect(findNearbyMarker(220, 800, 120000, markers)).toBeNull();
    });

    it("returns nearest marker when two are within tolerance", () => {
        const close = [marker("x", 30000), marker("y", 31200)];
        // tolerance = 1800ms
        // click at 202px â†’ posMs=30300; delta x=300ms, delta y=900ms â†’ x wins
        expect(findNearbyMarker(202, 800, 120000, close)?.id).toBe("x");
    });

    it("returns null when waveformWidth is 0", () => {
        expect(findNearbyMarker(0, 0, 120000, markers)).toBeNull();
    });
});

// â”€â”€ blinkDurationSec â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("blinkDurationSec", () => {
    it("returns ~2s at 15s distance", () => {
        expect(blinkDurationSec(15)).toBeCloseTo(2, 1);
    });

    it("returns 0.25s at 0s distance", () => {
        expect(blinkDurationSec(0)).toBeCloseTo(0.25, 2);
    });

    it("clamps to 0.25s for negative distances", () => {
        expect(blinkDurationSec(-5)).toBe(0.25);
    });

    it("clamps max to 2s for distances beyond 15s", () => {
        expect(blinkDurationSec(30)).toBeCloseTo(2, 1);
    });
});

// â”€â”€ getBubbleState â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("getBubbleState", () => {
    it("returns hidden when marker is >15s ahead", () => {
        expect(getBubbleState(30000, 10000)).toBe("hidden");
    });

    it("returns visible when marker is â‰¤15s ahead", () => {
        expect(getBubbleState(30000, 20000)).toBe("visible");
    });

    it("returns visible exactly at playhead", () => {
        expect(getBubbleState(30000, 30000)).toBe("visible");
    });

    it("returns fading when marker passed within 10s", () => {
        expect(getBubbleState(30000, 35000)).toBe("fading");
    });

    it("returns hidden when marker passed >10s ago", () => {
        expect(getBubbleState(30000, 45000)).toBe("hidden");
    });
});
