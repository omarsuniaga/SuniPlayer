/**
 * useHistoryStore — Saved show history
 * Persisted to localStorage under "suniplayer-history"
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Show, SetHistoryItem } from "../types";
import { getStorage } from './storage';

interface HistoryState {
    history: SetHistoryItem[];
    saveShow: (show: SetHistoryItem) => void;
    setHistory: (history: SetHistoryItem[] | ((prev: SetHistoryItem[]) => SetHistoryItem[])) => void;
    clearHistory: () => void;
}

const migrateFromLegacy = (stored: unknown): SetHistoryItem[] => {
    if (!Array.isArray(stored)) return [];

    return stored.map((item: any) => {
        // If it's already a Show/SetHistoryItem structure, return with track safety
        return {
            ...item,
            id: item.id || Date.now() + "",
            name: item.name || "Untitled Set",
            createdAt: item.createdAt || item.date || new Date().toISOString(),
            sets: item.sets || [],
            tracks: item.tracks || [],
        } as SetHistoryItem;
    });
};

export const useHistoryStore = create<HistoryState>()(
    persist(
        (set) => ({
            history: [],
            saveShow: (show: SetHistoryItem) =>
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
