/**
 * useHistoryStore — Saved show history
 * Persisted to localStorage under "suniplayer-history"
 *
 * Storage format: Show[] (migrated from legacy SetHistoryItem[] on rehydrate)
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SetHistoryItem, Show } from "../types.ts";

interface HistoryState {
    history: Show[];
    saveShow: (show: Show) => void;
    /** @deprecated Use saveShow instead. Kept for backward compatibility. */
    setHistory: (history: SetHistoryItem[] | ((prev: SetHistoryItem[]) => SetHistoryItem[])) => void;
    clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
    persist(
        (set) => ({
            history: [],
            saveShow: (show: Show) =>
                set((state) => ({
                    history: [show, ...state.history],
                })),
            setHistory: (update) =>
                set((state) => {
                    // Legacy shim: convert SetHistoryItem[] to Show[]
                    const prevAsLegacy = state.history as unknown as SetHistoryItem[];
                    const updated =
                        typeof update === "function" ? update(prevAsLegacy) : update;
                    // Convert each legacy item into a Show
                    const shows: Show[] = updated.map((item: SetHistoryItem) => ({
                        id: item.id,
                        name: item.name,
                        createdAt: item.date,
                        sets: [
                            {
                                id: crypto.randomUUID(),
                                label: "Set 1",
                                tracks: item.tracks,
                                durationMs: item.total,
                                builtAt: item.date,
                            },
                        ],
                    }));
                    return { history: shows };
                }),
            clearHistory: () => set({ history: [] }),
        }),
        {
            name: "suniplayer-history",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                history: state.history,
            }),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.warn("useHistoryStore rehydration error:", error);
                    return;
                }

                if (!state || !state.history) return;

                // Migration: Convert legacy SetHistoryItem[] to Show[]
                // Legacy structure has 'date'/'total' fields; new has 'sets' array
                if (Array.isArray(state.history) && state.history.length > 0) {
                    const first = state.history[0] as unknown as Record<string, unknown>;

                    // Legacy structure has 'date' + 'total' fields, new Show has 'sets' array
                    if ((first.date || first.timestamp) && !first.sets) {
                        const migrated: Show[] = (state.history as unknown as SetHistoryItem[]).map(
                            (item: SetHistoryItem) => {
                                const ts = item.date ?? (item as unknown as { timestamp: string }).timestamp;
                                return {
                                    id: item.id,
                                    name: item.name ?? new Date(ts).toLocaleDateString("es-ES", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    }),
                                    createdAt: ts,
                                    sets: [
                                        {
                                            id: crypto.randomUUID(),
                                            label: "Set 1",
                                            tracks: item.tracks,
                                            durationMs: item.total ?? (item as unknown as { durationMs: number }).durationMs ?? 0,
                                            builtAt: ts,
                                        },
                                    ],
                                };
                            }
                        );
                        state.history = migrated;
                    }
                }
            },
        }
    )
);
