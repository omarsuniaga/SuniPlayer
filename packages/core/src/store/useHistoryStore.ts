/**
 * useHistoryStore — Saved show history
 * Persisted to localStorage under "suniplayer-history"
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Show, SetHistoryItem } from "../types";
import { getStorage } from './storage';

interface HistoryState {
    history: Show[];
    saveShow: (show: Show) => void;
    setHistory: (history: Show[] | ((prev: Show[]) => Show[])) => void;
    clearHistory: () => void;
}

const migrateFromLegacy = (stored: unknown): Show[] => {
    if (!Array.isArray(stored)) return [];

    return stored.map((item: any) => {
        // If it's already a Show structure, return as-is
        if (item.sets && Array.isArray(item.sets)) {
            return item as Show;
        }

        // Legacy SetHistoryItem — convert to Show
        return {
            id: item.id,
            name: item.name,
            createdAt: item.createdAt || item.date || new Date().toISOString(),
            sets: item.sets || [],
        } as Show;
    });
};

export const useHistoryStore = create<HistoryState>()(
    persist(
        (set) => ({
            history: [],
            saveShow: (show: Show) =>
                set((state) => ({
                    history: [show, ...state.history],
                })),
            setHistory: (update) =>
                set((state) => ({
                    history: typeof update === "function" ? update(state.history) : update,
                })),
            clearHistory: () => set({ history: [] }),
        }),
        {
            name: "suniplayer-history",
            storage: createJSONStorage(() => getStorage()),
            onRehydrateStorage: () => (state) => {
                if (state?.history) {
                    state.history = migrateFromLegacy(state.history);
                }
            },
        }
    )
);
