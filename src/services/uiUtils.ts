import { THEME } from "../data/theme";

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
