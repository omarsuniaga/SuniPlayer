/**
 * useLibraryStore — User-imported custom tracks
 * Persisted: metadata is saved, but blob_urls must be refreshed on reload
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Track } from "../types";
import { TRACKS } from "../data/constants";
import { getStorage } from "./storage";
import { usePlayerStore } from "./usePlayerStore";

type TrackOrigin = "local" | "cloud";

function deriveFallbackTitle(id: string): string {
    return id.split("/").pop()?.replace(/%20/g, " ") || id;
}

function mergeTracksById(...groups: Track[][]): Track[] {
    const byId = new Map<string, Track>();

    for (const group of groups) {
        for (const track of group) {
            byId.set(track.id, track);
        }
    }

    return [...byId.values()];
}

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
    getLibraryCatalog: () => Track[];
    getBuilderSourceTracks: () => Track[];
    isTrackInQueue: (trackId: string) => boolean;
    getTrackOrigin: (trackId: string) => TrackOrigin | null;

    // Repertoire Management
    repertoire: Track[];
    addToRepertoire: (track: Track) => void;
    addMultipleToRepertoire: (tracks: Track[]) => void;
    removeFromRepertoire: (trackId: string) => void;
}

export const useLibraryStore = create<LibraryState>()(
    persist(
        (set, get) => ({
            customTracks: [],
            repertoire: [],
            trackOverrides: {},
            availableTags: ["Clásico", "Jazz", "Bossa", "Bolero", "Pop", "Balada", "Upbeat"],
            selectedFolderName: null,
            directoryHandle: null,

            addToRepertoire: (track) => set((s) => ({
                repertoire: [...s.repertoire.filter((t) => t.id !== track.id), track]
            })),

            addMultipleToRepertoire: (tracks) => set((s) => {
                const trackIds = new Set(tracks.map((t) => t.id));
                const filteredRepertoire = s.repertoire.filter((t) => !trackIds.has(t.id));
                return { repertoire: [...filteredRepertoire, ...tracks] };
            }),

            removeFromRepertoire: (trackId) => set((s) => ({
                repertoire: s.repertoire.filter((t) => t.id !== trackId)
            })),

            hydrateFromStorage: async () => {
                const storage = getStorage();
                const persistedTracks = get().customTracks;
                const persistedById = new Map(persistedTracks.map((track) => [track.id, track]));
                const ids = new Set<string>([
                    ...(await storage.getAllStoredTrackIds()),
                    ...persistedById.keys(),
                ]);
                const hydratedTracks: Track[] = [];

                for (const id of ids) {
                    const blob = await storage.getAudioFile(id);
                    const analysis = await storage.getAnalysis(id);
                    const persistedTrack = persistedById.get(id);

                    if (!blob && !persistedTrack) continue;

                    const blobUrl = blob ? URL.createObjectURL(blob) : persistedTrack?.blob_url;
                    const track: Track = {
                        id,
                        title: persistedTrack?.title || deriveFallbackTitle(id),
                        artist: persistedTrack?.artist || "Unknown Artist",
                        duration_ms: persistedTrack?.duration_ms ?? 0,
                        file_path: persistedTrack?.file_path || id,
                        blob_url: blobUrl,
                        bpm: analysis?.bpm ?? persistedTrack?.bpm,
                        key: analysis?.key ?? persistedTrack?.key,
                        energy: analysis?.energy ?? persistedTrack?.energy,
                        mood: persistedTrack?.mood ?? "calm",
                        genre: persistedTrack?.genre ?? "Unknown",
                        tags: persistedTrack?.tags,
                        notes: persistedTrack?.notes,
                        isCustom: persistedTrack?.isCustom ?? true,
                        analysis_cached: persistedTrack?.analysis_cached ?? !!analysis,
                        waveform: persistedTrack?.waveform,
                        gainOffset: analysis?.gainOffset ?? persistedTrack?.gainOffset,
                        startTime: persistedTrack?.startTime,
                        endTime: persistedTrack?.endTime,
                        transposeSemitones: persistedTrack?.transposeSemitones,
                        playbackTempo: persistedTrack?.playbackTempo,
                        sourceMissing: persistedTrack?.sourceMissing ?? !blob,
                        targetKey: persistedTrack?.targetKey,
                        sheetMusic: persistedTrack?.sheetMusic,
                        markers: persistedTrack?.markers,
                        totalPlayTimeMs: analysis?.totalPlayTimeMs ?? persistedTrack?.totalPlayTimeMs,
                        playCount: analysis?.playCount ?? persistedTrack?.playCount,
                        lastPlayedAt: analysis?.lastPlayedAt ?? persistedTrack?.lastPlayedAt,
                        completePlays: analysis?.completePlays ?? persistedTrack?.completePlays,
                        skips: analysis?.skips ?? persistedTrack?.skips,
                        affinityScore: analysis?.affinityScore ?? persistedTrack?.affinityScore,
                        metadata: persistedTrack?.metadata,
                        ...get().trackOverrides[id],
                    };

                    hydratedTracks.push(track);
                }

                set({ customTracks: hydratedTracks });
            },

            addCustomTrack: (track) =>
                set((state) => {
                    const nextTracks = state.customTracks.some((existing) => existing.id === track.id)
                        ? state.customTracks.map((existing) => (existing.id === track.id ? { ...existing, ...track } : existing))
                        : [...state.customTracks, track];
                    return { customTracks: nextTracks };
                }),
            updateTrack: (id, updates) =>
                set((state) => {
                    const newTracks = state.customTracks.map((t) => (t.id === id ? { ...t, ...updates } : t));
                    const newRepertoire = state.repertoire.map((t) => (t.id === id ? { ...t, ...updates } : t));
                    const newOverrides = { ...state.trackOverrides, [id]: { ...state.trackOverrides[id], ...updates } };

                    const analyticsFields = ["affinityScore", "playCount", "completePlays", "skips", "bpm", "key", "energy", "gainOffset", "totalPlayTimeMs", "lastPlayedAt"];
                    const hasAnalyticsUpdate = Object.keys(updates).some((k) => analyticsFields.includes(k));

                    if (hasAnalyticsUpdate) {
                        const track = newTracks.find((t) => t.id === id);
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
                        repertoire: newRepertoire,
                        trackOverrides: newOverrides
                    };
                }),
            removeCustomTrack: (id) =>
                set((state) => {
                    const newOverrides = { ...state.trackOverrides };
                    delete newOverrides[id];
                    return {
                        customTracks: state.customTracks.filter((t) => t.id !== id),
                        repertoire: state.repertoire.filter((t) => t.id !== id),
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
            getLibraryCatalog: () => {
                return mergeTracksById(TRACKS, get().repertoire, get().customTracks)
                    .sort((a, b) => a.title.localeCompare(b.title));
            },
            getBuilderSourceTracks: () => get().getLibraryCatalog(),
            isTrackInQueue: (trackId) => usePlayerStore.getState().pQueue.some((track) => track.id === trackId),
            getTrackOrigin: (trackId) => {
                if (get().customTracks.some((track) => track.id === trackId)) return "local";
                if (TRACKS.some((track) => track.id === trackId)) return "cloud";
                return null;
            },
        }),
        {
            name: "suniplayer-library",
            storage: createJSONStorage(() => getStorage()),
            partialize: (state) => ({
                customTracks: state.customTracks.map((t) => ({ ...t, blob_url: undefined })),
                repertoire: state.repertoire,
                trackOverrides: state.trackOverrides,
                availableTags: state.availableTags,
                selectedFolderName: state.selectedFolderName,
            }),
        }
    )
);
