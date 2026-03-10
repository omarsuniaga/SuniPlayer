/**
 * useHistoryStore — Saved set history
 * Persisted to localStorage under "suniplayer-history"
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SetHistoryItem } from "../types.ts";

interface HistoryState {
    history: SetHistoryItem[];
    setHistory: (history: SetHistoryItem[] | ((prev: SetHistoryItem[]) => SetHistoryItem[])) => void;
    clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
    persist(
        (set) => ({
            history: [],
            setHistory: (update) =>
                set((state) => ({
                    history: typeof update === "function" ? update(state.history) : update,
                })),
            clearHistory: () => set({ history: [] }),
        }),
        {
            name: "suniplayer-history",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
