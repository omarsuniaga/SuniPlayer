/**
 * usePlayerStore — Audio player runtime state
 * Persists current queue/session context plus volume for lightweight recovery
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Track } from "../types.ts";

interface PlayerState {
    pQueue: Track[];
    setPQueue: (queue: Track[]) => void;

    ci: number;
    setCi: (index: number) => void;

    playing: boolean;
    setPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;

    pos: number;
    setPos: (pos: number | ((prev: number) => number)) => void;

    vol: number;
    setVol: (vol: number) => void;

    elapsed: number;
    setElapsed: (elapsed: number | ((prev: number) => number)) => void;

    tTarget: number;
    setTTarget: (target: number) => void;

    mode: "edit" | "live";
    setMode: (mode: "edit" | "live" | ((prev: "edit" | "live") => "edit" | "live")) => void;

    /** true when no real audio file loaded — audio engine running in simulation */
    isSimulating: boolean;
    setIsSimulating: (v: boolean) => void;
}

export const usePlayerStore = create<PlayerState>()(
    persist(
        (set) => ({
            pQueue: [],
            setPQueue: (pQueue) => set({ pQueue }),

            ci: 0,
            setCi: (ci) => set({ ci }),

            playing: false,
            setPlaying: (update) =>
                set((state) => ({
                    playing: typeof update === "function" ? update(state.playing) : update,
                })),

            pos: 0,
            setPos: (update) =>
                set((state) => ({
                    pos: typeof update === "function" ? update(state.pos) : update,
                })),

            vol: 0.85,
            setVol: (vol) => set({ vol }),

            elapsed: 0,
            setElapsed: (update) =>
                set((state) => ({
                    elapsed: typeof update === "function" ? update(state.elapsed) : update,
                })),

            tTarget: 2700,
            setTTarget: (tTarget) => set({ tTarget }),

            mode: "edit",
            setMode: (update) =>
                set((state) => ({
                    mode: typeof update === "function" ? update(state.mode) : update,
                })),

            isSimulating: false,
            setIsSimulating: (isSimulating) => set({ isSimulating }),
        }),
        {
            name: "suniplayer-player",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                pQueue: state.pQueue,
                ci: state.ci,
                pos: state.pos,
                vol: state.vol,
                tTarget: state.tTarget,
                mode: state.mode,
            }),
            merge: (persistedState, currentState) => {
                const persisted = persistedState as Partial<PlayerState>;

                return {
                    ...currentState,
                    ...persisted,
                    playing: false,
                    elapsed: 0,
                    isSimulating: false,
                };
            },
        }
    )
);
