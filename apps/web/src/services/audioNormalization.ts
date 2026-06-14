const TARGET_RMS = 0.15;
const MIN_GAIN_OFFSET = 0.5;
const MAX_GAIN_OFFSET = 1.5;
const MAX_GAIN_MULTIPLIER = 2.0;

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export function calculateGainOffsetFromRms(rawRms: number): number {
    const safeRms = Math.max(0.01, rawRms);
    const normalized = TARGET_RMS / safeRms;
    return clamp(normalized, MIN_GAIN_OFFSET, MAX_GAIN_OFFSET);
}

export function applyTrackGainOffset(baseVolume: number, gainOffset?: number, enabled: boolean = true): number {
    if (!enabled || typeof gainOffset !== "number" || !Number.isFinite(gainOffset)) {
        return clamp(baseVolume, 0, 1);
    }

    return clamp(baseVolume * Math.min(MAX_GAIN_MULTIPLIER, gainOffset), 0, 1);
}

export const normalizationConfig = {
    TARGET_RMS,
    MIN_GAIN_OFFSET,
    MAX_GAIN_OFFSET,
    MAX_GAIN_MULTIPLIER,
};
