export const genWave = (seed, n = 100) => {
    const d = [];
    let v = 0.3;
    for (let i = 0; i < n; i++) {
        v += Math.sin(i * 0.15 + seed) * 0.12 + Math.cos(i * 0.08 + seed * 2) * 0.08 + (Math.random() - 0.5) * 0.15;
        v = Math.max(0.05, Math.min(1, v));
        d.push(v);
    }
    return d;
};

// Placeholder for future real audio engine logic
export const audioService = {
    play: () => console.log("Playing..."),
    pause: () => console.log("Paused..."),
    seek: (pos) => console.log("Seeking to", pos),
};
