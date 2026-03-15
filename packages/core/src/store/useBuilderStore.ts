/**
 * useBuilderStore — Set builder configuration and generated set
 * Persisted: targetMin, venue, curve, genSet
 * Ephemeral: view, search, fMood
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Track } from "../types.ts";
import { getStorage } from './storage';

type View = "builder" | "player" | "history" | "library";

interface BuilderState {
    // Navigation
    view: View;
    setView: (view: View) => void;

    // Builder config
    targetMin: number;
    setTargetMin: (min: number) => void;

    venue: string;
    setVenue: (venue: string) => void;

    curve: string;
    setCurve: (curve: string) => void;

    // Generated set
    genSet: Track[];
    setGenSet: (set: Track[] | ((prev: Track[]) => Track[])) => void;

    // Ephemeral filters (not persisted)
    search: string;
    setSearch: (search: string) => void;

    fMood: string | null;
    setFMood: (mood: string | null) => void;
}

export const useBuilderStore = create<BuilderState>()(
    persist(
        (set) => ({
            view: "builder",
            setView: (view) => set({ view }),

            targetMin: 45,
            setTargetMin: (targetMin) => set({ targetMin }),

            venue: "lobby",
            setVenue: (venue) => set({ venue }),

            curve: "steady",
            setCurve: (curve) => set({ curve }),

            genSet: [],
            setGenSet: (update) =>
                set((state) => ({
                    genSet: typeof update === "function" ? update(state.genSet) : update,
                })),

            search: "",
            setSearch: (search) => set({ search }),

            fMood: null,
            setFMood: (fMood) => set({ fMood }),
        }),
        {
            name: "suniplayer-builder",
            storage: createJSONStorage(() => getStorage()),
            partialize: (state) => ({
                targetMin: state.targetMin,
                venue: state.venue,
                curve: state.curve,
                genSet: state.genSet,
            }),
        }
    )
);
