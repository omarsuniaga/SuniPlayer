/**
 * useLibraryStore — User-imported custom tracks (session-only)
 * NOT persisted — blob_urls are invalidated on page reload
 */
import { create } from "zustand";
import { Track } from "../types.ts";

interface LibraryState {
    customTracks: Track[];
    addCustomTrack: (track: Track) => void;
    removeCustomTrack: (id: string) => void;
    clearCustomTracks: () => void;
}

export const useLibraryStore = create<LibraryState>()((set) => ({
    customTracks: [],
    addCustomTrack: (track) =>
        set((state) => ({ customTracks: [...state.customTracks, track] })),
    removeCustomTrack: (id) =>
        set((state) => ({ customTracks: state.customTracks.filter((t) => t.id !== id) })),
    clearCustomTracks: () => set({ customTracks: [] }),
}));
