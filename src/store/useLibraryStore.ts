/**
 * useLibraryStore — User-imported custom tracks (session-only)
 * NOT persisted — blob_urls are invalidated on page reload
 */
import { create } from "zustand";
import { Track } from "../types.ts";

interface LibraryState {
    customTracks: Track[];
    selectedFolderName: string | null;
    addCustomTrack: (track: Track) => void;
    removeCustomTrack: (id: string) => void;
    clearCustomTracks: () => void;
    setSelectedFolderName: (folderName: string | null) => void;
}

export const useLibraryStore = create<LibraryState>()((set) => ({
    customTracks: [],
    selectedFolderName: null,
    addCustomTrack: (track) =>
        set((state) => ({ customTracks: [...state.customTracks, track] })),
    removeCustomTrack: (id) =>
        set((state) => ({ customTracks: state.customTracks.filter((t) => t.id !== id) })),
    clearCustomTracks: () => set({ customTracks: [] }),
    setSelectedFolderName: (selectedFolderName) => set({ selectedFolderName }),
}));
