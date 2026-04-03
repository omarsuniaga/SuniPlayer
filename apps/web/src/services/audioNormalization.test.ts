import { describe, expect, it } from "vitest";

import { applyTrackGainOffset, calculateGainOffsetFromRms, normalizationConfig } from "./audioNormalization";

describe("audioNormalization", () => {
    it("clamps gainOffset derived from RMS to a sane range", () => {
        expect(calculateGainOffsetFromRms(10)).toBe(normalizationConfig.MIN_GAIN_OFFSET);
        expect(calculateGainOffsetFromRms(0.0001)).toBe(normalizationConfig.MAX_GAIN_OFFSET);
    });

    it("keeps typical RMS values near unity gain", () => {
        const gainOffset = calculateGainOffsetFromRms(0.15);
        expect(gainOffset).toBeCloseTo(1, 3);
    });

    it("applies gainOffset only when normalization is enabled", () => {
        expect(applyTrackGainOffset(0.7, 1.2, true)).toBeCloseTo(0.84, 5);
        expect(applyTrackGainOffset(0.7, 1.2, false)).toBeCloseTo(0.7, 5);
    });

    it("clamps resulting volume between 0 and 1", () => {
        expect(applyTrackGainOffset(0.9, 3, true)).toBe(1);
        expect(applyTrackGainOffset(-0.2, 0.5, true)).toBe(0);
    });
});
