import { THEME } from "../data/theme.ts";

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
        happy: THEME.colors.status.warning,
        melancholic: "#6366F1", // Custom blue for melancholic
        calm: THEME.colors.brand.cyan,
        energetic: THEME.colors.status.error,
    };
    return map[m] || "#888";
};

export const ec = (e: number) =>
    e > 0.7 ? THEME.colors.status.error :
        e > 0.4 ? THEME.colors.status.warning :
            THEME.colors.brand.cyan;

/** 
 * Returns the "effective" duration of a track in ms, 
 * accounting for custom startTime/endTime trimming.
 */
export const getEffectiveDuration = (track: { duration_ms: number; startTime?: number; endTime?: number }) => {
    const start = track.startTime ?? 0;
    const end = track.endTime ?? track.duration_ms;
    return Math.max(0, end - start);
};
