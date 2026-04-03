/**
 * useLibraryStore — User-imported custom tracks
 * Persisted: metadata is saved, but blob_urls must be refreshed on reload
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Track } from "../types";
import { getStorage } from './storage';

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
    hydrateFromStorage: () => Promise<void>;
    topTracks: () => Track[];

    // ── Repertoire Management ────────────────────────────────────────────────
    repertoire: Track[];
    addToRepertoire: (track: Track) => void;
    addMultipleToRepertoire: (tracks: Track[]) => void;
    removeFromRepertoire: (trackId: string) => void;
}

export const useLibraryStore = create<LibraryState>()(
    persist(
        (set, get) => ({
            customTracks: [],
            repertoire: [], // La selección activa del músico
            trackOverrides: {},
            availableTags: ["Clásico", "Jazz", "Bossa", "Bolero", "Pop", "Balada", "Upbeat"],
            selectedFolderName: null,
            directoryHandle: null,

            addToRepertoire: (track) => set((s) => ({ 
                repertoire: [...s.repertoire.filter(t => t.id !== track.id), track] 
            })),

            addMultipleToRepertoire: (tracks) => set((s) => {
                const trackIds = new Set(tracks.map(t => t.id));
                const filteredRepertoire = s.repertoire.filter(t => !trackIds.has(t.id));
                return { repertoire: [...filteredRepertoire, ...tracks] };
            }),

            removeFromRepertoire: (trackId) => set((s) => ({ 
                repertoire: s.repertoire.filter(t => t.id !== trackId) 
            })),

            hydrateFromStorage: async () => {
                const storage = getStorage();
                const ids = await storage.getAllStoredTrackIds();
                const hydratedTracks: Track[] = [];

                for (const id of ids) {
                    const blob = await storage.getAudioFile(id);
                    const analysis = await storage.getAnalysis(id);
                    
                    if (blob && analysis) {
                        const blobUrl = URL.createObjectURL(blob);
                        // Merge metadata with stored analysis
                        const track: Track = {
                            id,
                            title: id.split('/').pop()?.replace(/%20/g, ' ') || id,
                            artist: "Local Storage",
                            duration_ms: 0, // Will be updated by metadata probe
                            file_path: id,
                            blob_url: blobUrl,
                            bpm: analysis.bpm,
                            key: analysis.key,
                            energy: analysis.energy,
                            mood: "calm", // Default
                            genre: "Unknown",
                            affinityScore: analysis.affinityScore,
                            playCount: analysis.playCount,
                            completePlays: analysis.completePlays,
                            skips: analysis.skips,
                            totalPlayTimeMs: analysis.totalPlayTimeMs,
                            lastPlayedAt: analysis.lastPlayedAt,
                            ...get().trackOverrides[id]
                        };
                        hydratedTracks.push(track);
                    }
                }

                if (hydratedTracks.length > 0) {
                    set({ customTracks: hydratedTracks });
                }
            },

            addCustomTrack: (track) =>
                set((state) => ({ customTracks: [...state.customTracks, track] })),
            updateTrack: (id, updates) =>
                set((state) => {
                    const newTracks = state.customTracks.map((t) => (t.id === id ? { ...t, ...updates } : t));
                    const newOverrides = { ...state.trackOverrides, [id]: { ...state.trackOverrides[id], ...updates } };

                    const analyticsFields = ['affinityScore', 'playCount', 'completePlays', 'skips', 'bpm', 'key', 'energy', 'gainOffset', 'totalPlayTimeMs', 'lastPlayedAt'];
                    const hasAnalyticsUpdate = Object.keys(updates).some(k => analyticsFields.includes(k));

                    if (hasAnalyticsUpdate) {
                        const track = newTracks.find(t => t.id === id);
                        if (track) {
                            getStorage().saveAnalysis(id, {
                                bpm: track.bpm,
                                key: track.key,
                                energy: track.energy,
                                gainOffset: track.gainOffset,
                                affinityScore: track.affinityScore,
                                playCount: track.playCount,
                                completePlays: track.completePlays,
                                skips: track.skips,
                                totalPlayTimeMs: track.totalPlayTimeMs,
                                lastPlayedAt: track.lastPlayedAt,
                                timestamp: Date.now()
                            });
                        }
                    }

                    return {
                        customTracks: newTracks,
                        trackOverrides: newOverrides
                    };
                }),
            removeCustomTrack: (id) =>
                set((state) => {
                    const newOverrides = { ...state.trackOverrides };
                    delete newOverrides[id];
                    return {
                        customTracks: state.customTracks.filter((t) => t.id !== id),
                        trackOverrides: newOverrides
                    };
                }),
            clearCustomTracks: async () => {
                const storage = getStorage();
                const ids = await storage.getAllStoredTrackIds();
                for (const id of ids) {
                    await storage.deleteAudioFile(id);
                }
                set({ customTracks: [], trackOverrides: {} });
            },
            addTag: (tag) => set((s) => ({ 
                availableTags: s.availableTags.includes(tag) ? s.availableTags : [...s.availableTags, tag] 
            })),
            setSelectedFolderName: (selectedFolderName) => set({ selectedFolderName }),
            setDirectoryHandle: (directoryHandle) => set({ directoryHandle }),
            topTracks: () => {
                return [...get().customTracks].sort((a, b) => (b.affinityScore || 0) - (a.affinityScore || 0));
            },
        }),
        {
            name: "suniplayer-library",
            storage: createJSONStorage(() => getStorage()),
            partialize: (state) => ({
                // blob_url es efímera — hydrateTracks() la regenera desde IDB al iniciar.
                // Persistirla causaría ERR_FILE_NOT_FOUND en la siguiente sesión.
                customTracks: state.customTracks.map(t => ({ ...t, blob_url: undefined })),
                repertoire: state.repertoire, // Guardar la selección curada
                trackOverrides: state.trackOverrides,
                availableTags: state.availableTags,
                selectedFolderName: state.selectedFolderName,
            }),
        }
    )
);
