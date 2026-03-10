import { create } from "zustand";

export const useAudioStore = create((set) => ({
    playing: false,
    setPlaying: (playing) => set((state) => ({
        playing: typeof playing === "function" ? playing(state.playing) : playing
    })),
    pos: 0,
    setPos: (pos) => set((state) => ({
        pos: typeof pos === "function" ? pos(state.pos) : pos
    })),
    vol: 0.85,
    setVol: (vol) => set({ vol }),
    elapsed: 0,
    setElapsed: (elapsed) => set((state) => ({
        elapsed: typeof elapsed === "function" ? elapsed(state.elapsed) : elapsed
    })),
    tTarget: 2700,
    setTTarget: (tTarget) => set({ tTarget }),
    mode: "edit",
    setMode: (mode) => set((state) => ({
        mode: typeof mode === "function" ? mode(state.mode) : mode
    })),
}));
