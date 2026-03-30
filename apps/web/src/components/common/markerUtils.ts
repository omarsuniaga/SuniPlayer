import type { TrackMarker } from "@suniplayer/core";

const HIT_TOLERANCE_PX = 12;

/**
 * Returns the marker closest to clickX within pixel tolerance, or null.
 * toleranceMs = (12px / waveformWidth) * durationMs
 */
export function findNearbyMarker(
    clickX: number,
    waveformWidth: number,
    durationMs: number,
    markers: TrackMarker[]
): TrackMarker | null {
    if (markers.length === 0 || waveformWidth === 0 || durationMs === 0) return null;

    const clickPosMs = (clickX / waveformWidth) * durationMs;
    const toleranceMs = (HIT_TOLERANCE_PX / waveformWidth) * durationMs;

    let nearest: TrackMarker | null = null;
    let nearestDelta = Infinity;

    for (const m of markers) {
        const delta = Math.abs(m.posMs - clickPosMs);
        if (delta <= toleranceMs && delta < nearestDelta) {
            nearest = m;
            nearestDelta = delta;
        }
    }
    return nearest;
}

/**
 * Returns CSS animation-duration in seconds for the blinking border.
 * distanceSec=15 â†’ 2s (slow), distanceSec=0 â†’ 0.25s (fast).
 */
export function blinkDurationSec(distanceSec: number): number {
    const clamped = Math.max(0, Math.min(15, distanceSec));
    return Math.max(0.25, 2 - (15 - clamped) * (1.75 / 15));
}

export type BubbleState = "hidden" | "visible" | "fading";

/**
 * Returns bubble visibility state.
 * visible: playhead within 15s before marker
 * fading: playhead passed marker within 10s
 * hidden: everything else
 */
export function getBubbleState(markerPosMs: number, playheadMs: number): BubbleState {
    const distMs = markerPosMs - playheadMs;
    if (distMs > 15000) return "hidden";
    if (distMs >= 0) return "visible";
    if (distMs >= -10000) return "fading";
    return "hidden";
}
