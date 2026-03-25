/**
 * useBuilderStore — Set builder configuration and generated set
 * Persisted: targetMin, venue, curve, genSet, currentShowId, currentShow
 * Ephemeral: view, search, fMood
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Track, Show, SetEntry } from "../types.ts";

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

    // Show context for multi-set builds
    currentShowId: string | null;
    currentShow: Show | null;

    // Show actions
    startNewShow: () => void;
    addSetToCurrentShow: () => void;
    getExcludedTrackIdsInShow: () => string[];
}

export const useBuilderStore = create<BuilderState>()(
    persist(
        (set, get) => ({
            view: "player",
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

            // Show context
            currentShowId: null,
            currentShow: null,

            startNewShow: () => {
                const now = new Date();
                const day = now.getDate();
                const month = now.toLocaleDateString("en-US", { month: "short" });
                const name = `Show ${day} ${month}`;

                const showId = crypto.randomUUID();
                const setId = crypto.randomUUID();

                const newShow: Show = {
                    id: showId,
                    name,
                    createdAt: new Date().toISOString(),
                    sets: [
                        {
                            id: setId,
                            label: "Set 1",
                            tracks: [],
                            durationMs: 0,
                            builtAt: new Date().toISOString(),
                        },
                    ],
                };

                set({
                    currentShowId: showId,
                    currentShow: newShow,
                    genSet: [],
                });
            },

            addSetToCurrentShow: () => {
                set((state) => {
                    if (!state.currentShow) return state;

                    // Snapshot current genSet into the last (active) set entry
                    const currentGenSet = state.genSet;
                    const updatedSets = state.currentShow.sets.map((entry: SetEntry, i: number) => {
                        if (i === state.currentShow!.sets.length - 1) {
                            return {
                                ...entry,
                                tracks: currentGenSet,
                                durationMs: currentGenSet.reduce((sum: number, t: Track) => sum + t.duration_ms, 0),
                                builtAt: new Date().toISOString(),
                            };
                        }
                        return entry;
                    });

                    const setNum = state.currentShow.sets.length + 1;
                    const newSetId = crypto.randomUUID();
                    const newSetEntry: SetEntry = {
                        id: newSetId,
                        label: `Set ${setNum}`,
                        tracks: [],
                        durationMs: 0,
                        builtAt: new Date().toISOString(),
                    };

                    return {
                        currentShow: {
                            ...state.currentShow,
                            sets: [...updatedSets, newSetEntry],
                        },
                        genSet: [],
                    };
                });
            },

            getExcludedTrackIdsInShow: () => {
                const state = get();
                if (!state.currentShow) return [];

                const currentSetIndex = state.currentShow.sets.length - 1; // Last set is "active"
                const excluded = new Set<string>();

                state.currentShow.sets.forEach((entry: SetEntry, i: number) => {
                    if (i !== currentSetIndex) {
                        entry.tracks.forEach((track: Track) => excluded.add(track.id));
                    }
                });

                return Array.from(excluded);
            },
        }),
        {
            name: "suniplayer-builder",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                targetMin: state.targetMin,
                venue: state.venue,
                curve: state.curve,
                genSet: state.genSet,
                currentShowId: state.currentShowId,
                currentShow: state.currentShow,
            }),
        }
    )
);
