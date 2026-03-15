/**
 * uiUtils (core) — Platform-agnostic utilities needed by stores.
 * NOTE: This is a subset of src/services/uiUtils.ts — it contains only
 * the functions that have no DOM/browser dependencies (no THEME imports).
 * The full uiUtils (with fmt, mc, ec helpers) lives in the web app src/.
 */

/**
 * Returns the "effective" duration of a track in ms,
 * accounting for custom startTime/endTime trimming.
 */
export const getEffectiveDuration = (track: { duration_ms: number; startTime?: number; endTime?: number }) => {
    const start = track.startTime ?? 0;
    const end = track.endTime ?? track.duration_ms;
    return Math.max(0, end - start);
};
