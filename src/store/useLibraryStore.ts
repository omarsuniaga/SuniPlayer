/**
 * useLibraryStore — User-imported custom tracks
 * Persisted: metadata is saved, but blob_urls must be refreshed on reload
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Track } from "../types.ts";

interface LibraryState {
    customTracks: Track[];
    trackOverrides: Record<string, Partial<Track>>;
    availableTags: string[];
    selectedFolderName: string | null;
    directoryHandle: unknown | null; // Session-only handle for folder re-sync
    addCustomTrack: (track: Track) => void;
    updateTrack: (id: string, updates: Partial<Track>) => void;
    removeCustomTrack: (id: string) => void;
    clearCustomTracks: () => void;
    addTag: (tag: string) => void;
    setSelectedFolderName: (folderName: string | null) => void;
    setDirectoryHandle: (handle: unknown | null) => void;
}

export const useLibraryStore = create<LibraryState>()(
    persist(
        (set) => ({
            customTracks: [],
            trackOverrides: {},
            availableTags: ["Clásico", "Jazz", "Bossa", "Bolero", "Pop", "Balada", "Upbeat"],
            selectedFolderName: null,
            directoryHandle: null,
            addCustomTrack: (track) =>
                set((state) => ({ customTracks: [...state.customTracks, track] })),
            updateTrack: (id, updates) =>
                set((state) => ({
                    customTracks: state.customTracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
                    trackOverrides: { ...state.trackOverrides, [id]: { ...state.trackOverrides[id], ...updates } }
                })),
            removeCustomTrack: (id) =>
                set((state) => {
                    const newOverrides = { ...state.trackOverrides };
                    delete newOverrides[id];
                    return {
                        customTracks: state.customTracks.filter((t) => t.id !== id),
                        trackOverrides: newOverrides
                    };
                }),
            clearCustomTracks: () => set({ customTracks: [], trackOverrides: {} }),
            addTag: (tag) => set((s) => ({ 
                availableTags: s.availableTags.includes(tag) ? s.availableTags : [...s.availableTags, tag] 
            })),
            setSelectedFolderName: (selectedFolderName) => set({ selectedFolderName }),
            setDirectoryHandle: (directoryHandle) => set({ directoryHandle }),
        }),
        {
            name: "suniplayer-library",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                customTracks: state.customTracks,
                trackOverrides: state.trackOverrides,
                availableTags: state.availableTags,
                selectedFolderName: state.selectedFolderName,
            }),
        }
    )
);
