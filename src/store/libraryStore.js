import { create } from "zustand";
import { buildSet } from "../services/setBuilderService";
import { TRACKS } from "../data/mockTracks";

export const useLibraryStore = create((set, get) => ({
    // Navigation / View state
    view: "builder",
    setView: (view) => set({ view }),

    // Search & Filter
    search: "",
    setSearch: (search) => set({ search }),
    fMood: null,
    setFMood: (fMood) => set({ fMood }),

    // Set Builder Configuration
    targetMin: 45,
    setTargetMin: (targetMin) => set({ targetMin }),
    venue: "lobby",
    setVenue: (venue) => set({ venue }),
    curve: "steady",
    setCurve: (curve) => set({ curve }),

    // Results
    genSet: [],
    setGenSet: (genSet) => set((state) => ({
        genSet: typeof genSet === "function" ? genSet(state.genSet) : genSet
    })),

    history: [],
    setHistory: (history) => set((state) => ({
        history: typeof history === "function" ? history(state.history) : history
    })),

    // Derived Actions
    doGen: () => {
        const { targetMin, curve } = get();
        const tMs = targetMin * 60 * 1000;
        set({ genSet: buildSet(TRACKS, tMs, { curve, tol: 90000 }) });
    },
}));
