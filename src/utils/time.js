export const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
};

export const fmtM = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r > 0 ? `${m}m ${r}s` : `${m}m`;
};
