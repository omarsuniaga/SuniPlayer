import { describe, expect, it } from "vitest";

import { TRACKS } from "../data/constants";
import type { Track } from "../types";
import { buildSet } from "./setBuilderService";

function makeTrack(id: string, seconds: number, bpm: number, energy: number): Track {
    return {
        id,
        title: `Track ${id}`,
        artist: "Test Artist",
        duration_ms: seconds * 1000,
        bpm,
        energy,
        mood: "calm",
    };
}

describe("buildSet", () => {
    it("keeps total duration within the requested tolerance window", () => {
        const targetSeconds = 30 * 60;
        const toleranceSeconds = 90;

        const result = buildSet(TRACKS, targetSeconds, { tol: toleranceSeconds, curve: "steady" });
        const totalSeconds = result.reduce((sum, track) => sum + track.duration_ms / 1000, 0);

        expect(totalSeconds).toBeGreaterThanOrEqual(targetSeconds - toleranceSeconds);
        expect(totalSeconds).toBeLessThanOrEqual(targetSeconds + toleranceSeconds);
    });

    it("never repeats the same track in a generated set", () => {
        const result = buildSet(TRACKS, 45 * 60, { curve: "ascending" });
        const ids = result.map((track) => track.id);

        expect(new Set(ids).size).toBe(ids.length);
    });

    it("uses the BPM filter when at least three tracks remain", () => {
        const repo = [
            makeTrack("a", 60, 100, 0.2),
            makeTrack("b", 60, 105, 0.4),
            makeTrack("c", 60, 110, 0.6),
            makeTrack("d", 60, 140, 0.8),
        ];

        const result = buildSet(repo, 180, {
            tol: 0,
            curve: "steady",
            bpmMin: 95,
            bpmMax: 115,
        });

        expect(result).toHaveLength(3);
        expect(result.every((track) => (track.bpm ?? 0) >= 95 && (track.bpm ?? 0) <= 115)).toBe(true);
    });

    it("applies the requested ascending energy curve", () => {
        const repo = [
            makeTrack("a", 60, 100, 0.9),
            makeTrack("b", 60, 105, 0.3),
            makeTrack("c", 60, 110, 0.7),
            makeTrack("d", 60, 115, 0.1),
        ];

        const result = buildSet(repo, 240, { tol: 0, curve: "ascending" });
        const energies = result.map((track) => track.energy ?? 0);

        expect(energies).toEqual([0.1, 0.3, 0.7, 0.9]);
    });
});
