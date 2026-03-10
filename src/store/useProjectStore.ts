import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Track, SetHistoryItem } from "../types";
import { TRACKS, VENUES } from "../data/constants";
import { buildSet } from "../services/setBuilderService.ts";

interface ProjectState {
    // Navigation
    view: "builder" | "player" | "history";
    setView: (view: "builder" | "player" | "history") => void;

    // Builder State
    targetMin: number;
    setTargetMin: (min: number) => void;
    venue: string;
    setVenue: (venue: string) => void;
    curve: string;
    setCurve: (curve: string) => void;
    genSet: Track[];
    setGenSet: (set: Track[] | ((prev: Track[]) => Track[])) => void;
    search: string;
    setSearch: (search: string) => void;
    fMood: string | null;
    setFMood: (mood: string | null) => void;

    // Player State (not persisted across sessions)
    pQueue: Track[];
    setPQueue: (queue: Track[]) => void;
    ci: number;
    setCi: (index: number) => void;
    playing: boolean;
    setPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;
    pos: number;
    setPos: (pos: number | ((prev: number) => number)) => void;
    vol: number;
    setVol: (vol: number) => void;
    elapsed: number;
    setElapsed: (elapsed: number | ((prev: number) => number)) => void;
    tTarget: number;
    setTTarget: (target: number) => void;
    mode: "edit" | "live";
    setMode: (mode: "edit" | "live" | ((prev: "edit" | "live") => "edit" | "live")) => void;

    // Persisted History
    history: SetHistoryItem[];
    setHistory: (history: SetHistoryItem[] | ((prev: SetHistoryItem[]) => SetHistoryItem[])) => void;
    clearHistory: () => void;

    // User-Imported Custom Tracks (session-only — blob_url cannot be persisted)
    customTracks: Track[];
    addCustomTrack: (track: Track) => void;
    removeCustomTrack: (id: string) => void;
    clearCustomTracks: () => void;

    // Per-track notes (performance reminders)
    setTrackNotes: (trackId: string, notes: string) => void;

    // Settings
    autoNext: boolean;
    setAutoNext: (v: boolean) => void;
    crossfade: boolean;
    setCrossfade: (v: boolean) => void;
    showSettings: boolean;
    setShowSettings: (v: boolean) => void;
    bpmMin: number;
    setBpmMin: (v: number) => void;
    bpmMax: number;
    setBpmMax: (v: number) => void;
    defaultVol: number;
    setDefaultVol: (v: number) => void;

    // Derived Actions
    doGen: () => void;
    toPlayer: () => void;
    appendToQueue: (tracks: Track[]) => void;
    saveSet: () => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            view: "builder",
            setView: (view) => set({ view }),

            targetMin: 45,
            setTargetMin: (targetMin) => set({ targetMin }),
            venue: "lobby",
            setVenue: (venue) => set({ venue }),
            curve: "steady",
            setCurve: (curve) => set({ curve }),
            genSet: [],
            setGenSet: (update) => set((state) => ({
                genSet: typeof update === "function" ? update(state.genSet) : update,
            })),
            search: "",
            setSearch: (search) => set({ search }),
            fMood: null,
            setFMood: (fMood) => set({ fMood }),

            pQueue: [],
            setPQueue: (pQueue) => set({ pQueue }),
            ci: 0,
            setCi: (ci) => set({ ci }),
            playing: false,
            setPlaying: (update) => set((state) => ({
                playing: typeof update === "function" ? update(state.playing) : update,
            })),
            pos: 0,
            setPos: (update) => set((state) => ({
                pos: typeof update === "function" ? update(state.pos) : update,
            })),
            vol: 0.85,
            setVol: (vol) => set({ vol }),
            elapsed: 0,
            setElapsed: (update) => set((state) => ({
                elapsed: typeof update === "function" ? update(state.elapsed) : update,
            })),
            tTarget: 2700,
            setTTarget: (tTarget) => set({ tTarget }),
            mode: "edit",
            setMode: (update) => set((state) => ({
                mode: typeof update === "function" ? update(state.mode) : update,
            })),

            // User-Imported Custom Tracks
            customTracks: [],
            addCustomTrack: (track) => set(state => ({ customTracks: [...state.customTracks, track] })),
            removeCustomTrack: (id) => set(state => ({ customTracks: state.customTracks.filter(t => t.id !== id) })),
            clearCustomTracks: () => set({ customTracks: [] }),

            // Per-track notes — stored in pQueue and genSet
            setTrackNotes: (trackId, notes) => set(state => ({
                pQueue: state.pQueue.map(t => t.id === trackId ? { ...t, notes } : t),
                genSet: state.genSet.map(t => t.id === trackId ? { ...t, notes } : t),
            })),

            // Settings
            autoNext: true,
            setAutoNext: (autoNext) => set({ autoNext }),
            crossfade: true,
            setCrossfade: (crossfade) => set({ crossfade }),
            showSettings: false,
            setShowSettings: (showSettings) => set({ showSettings }),
            bpmMin: 55,
            setBpmMin: (bpmMin) => set({ bpmMin }),
            bpmMax: 140,
            setBpmMax: (bpmMax) => set({ bpmMax }),
            defaultVol: 0.85,
            setDefaultVol: (defaultVol) => set({ defaultVol, vol: defaultVol }),

            history: [],
            setHistory: (update) => set((state) => ({
                history: typeof update === "function" ? update(state.history) : update,
            })),
            clearHistory: () => set({ history: [] }),


            appendToQueue: (tracks: Track[]) => {
                const { pQueue, ci, tTarget } = get();
                if (!tracks.length) return;
                if (pQueue.length === 0) {
                    // Nothing loaded — behave like toPlayer
                    set({
                        pQueue: [...tracks],
                        ci: 0, pos: 0, playing: false, elapsed: 0,
                        tTarget: tracks.reduce((a, t) => a + t.duration_ms, 0) / 1000,
                        view: "player",
                    });
                } else {
                    // Append AFTER the current ci position without changing playback
                    const newQueue = [
                        ...pQueue.slice(0, ci + 1),
                        ...tracks,
                        ...pQueue.slice(ci + 1),
                    ];
                    const addedMs = tracks.reduce((a, t) => a + t.duration_ms, 0) / 1000;
                    set({ pQueue: newQueue, tTarget: tTarget + addedMs });
                }
            },

            doGen: () => {
                const { targetMin, curve } = get();
                const tSec = targetMin * 60;
                // Adaptive tolerance instead of fixed 90s
                set({ genSet: buildSet(TRACKS, tSec, { curve }) });
            },

            toPlayer: () => {
                const { genSet, targetMin, playing } = get();
                if (!genSet.length) return;
                const tSec = targetMin * 60;
                if (playing) {
                    // Don't interrupt — just switch view, leave queue intact
                    set({ view: "player" });
                } else {
                    set({
                        pQueue: [...genSet],
                        ci: 0, pos: 0, playing: false, elapsed: 0,
                        tTarget: tSec, mode: "edit", view: "player",
                    });
                }
            },

            saveSet: () => {
                const { genSet, targetMin, venue, curve } = get();
                if (!genSet.length) return;
                const tSec = targetMin * 60;
                const v = VENUES.find((x) => x.id === venue);
                const newItem: SetHistoryItem = {
                    id: Date.now() + "",
                    name: (v?.label || "Set") + " " + targetMin + "min",
                    tracks: [...genSet],
                    total: genSet.reduce((acc, t) => acc + t.duration_ms, 0),
                    target: tSec,
                    venue,
                    curve,
                    date: new Date().toLocaleString(),
                };
                set((state) => ({ history: [newItem, ...state.history] }));
            },
        }),
        {
            name: "suniplayer-state",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                targetMin: state.targetMin,
                venue: state.venue,
                curve: state.curve,
                vol: state.vol,
                history: state.history,
                genSet: state.genSet,
                autoNext: state.autoNext,
                crossfade: state.crossfade,
                bpmMin: state.bpmMin,
                bpmMax: state.bpmMax,
                defaultVol: state.defaultVol,
            }),
        }
    )
);
