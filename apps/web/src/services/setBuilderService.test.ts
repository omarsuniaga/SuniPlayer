import { describe, expect, it } from "vitest";

import { TRACKS } from "@suniplayer/core";
import { buildSet } from "./setBuilderService";

describe("buildSet", () => {
    it("keeps total duration within the requested tolerance window", () => {
        const targetSeconds = 30 * 60;
        const toleranceSeconds = 90;

        const result = buildSet(TRACKS, targetSeconds, { tol: toleranceSeconds, curve: "steady" });
        // Note: total library is ~2458s — target must be achievable
        const totalSeconds = result.reduce((sum, track) => sum + track.duration_ms / 1000, 0);

        expect(totalSeconds).toBeGreaterThanOrEqual(targetSeconds - toleranceSeconds);
        expect(totalSeconds).toBeLessThanOrEqual(targetSeconds + toleranceSeconds);
    });

    it("never repeats the same track in a generated set", () => {
        const result = buildSet(TRACKS, 45 * 60, { curve: "ascending" });
        const ids = result.map((track) => track.id);

        expect(new Set(ids).size).toBe(ids.length);
    });
});
