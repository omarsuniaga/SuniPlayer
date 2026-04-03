/**
 * uiUtils (core) — Platform-agnostic utilities needed by stores.
 */

export const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
};

export const fmtM = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r > 0 ? `${m}m ${r}s` : `${m}m`;
};

export const fmtFull = (ms: number) => {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

export const mc = (m: string) => {
    const map: Record<string, string> = {
        happy: "#F59E0B",
        melancholic: "#6366F1", 
        calm: "#06B6D4",
        energetic: "#EF4444",
    };
    return map[m] || "#888";
};

export const ec = (e: number) =>
    e > 0.7 ? "#EF4444" :
        e > 0.4 ? "#F59E0B" :
            "#06B6D4";

/**
 * Returns the "effective" duration of a track in ms,
 * accounting for custom startTime/endTime trimming.
 */
export const getEffectiveDuration = (track: { duration_ms: number; startTime?: number; endTime?: number }) => {
    const start = track.startTime ?? 0;
    const end = track.endTime ?? track.duration_ms;
    return Math.max(0, end - start);
};
