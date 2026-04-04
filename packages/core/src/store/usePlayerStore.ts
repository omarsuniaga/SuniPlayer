/**
 * usePlayerStore — Audio player runtime state
 * Persists current queue/session context plus volume for lightweight recovery
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Track } from "../types";
import { getStorage } from './storage';
import { AnalyticsService } from "../services/AnalyticsService";
import { TRACKS } from "../data/constants";
import { SyncStatus, ClockOffset } from "../network/types";

export interface ScheduledPlay {
    targetWallMs: number;  // Date.now() at scheduled play time — cross-device comparable
    positionMs: number;    // Audio position to seek to (ms)
    trackId: string;       // Track ID to verify correct track is loaded
}

export interface PlayerState {
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

    /** true when no real audio file loaded — audio engine running in simulation */
    isSimulating: boolean;
    setIsSimulating: (v: boolean) => void;

    /** IDs of tracks to play next in LIVE mode, in priority order */
    stackOrder: string[];
    setStackOrder: (ids: string[] | ((prev: string[]) => string[])) => void;

    /** Metadata about which show/set is currently loaded — used for "Set N / M" indicator */
    currentSetMetadata: { setLabel: string; totalSetsInShow: number } | null;
    setCurrentSetMetadata: (metadata: { setLabel: string; totalSetsInShow: number } | null) => void;

    /** Stage Mirror visibility */
    isMirrorOpen: boolean;
    toggleMirror: () => void;

    /** Stage Mirror configuration */
    mirrorMode: 'docked' | 'floating';
    setMirrorMode: (mode: 'docked' | 'floating') => void;

    mirrorSize: 'sm' | 'md' | 'lg';
    setMirrorSize: (size: 'sm' | 'md' | 'lg') => void;

    /** Amplitude Zoom for waveforms */
    waveScale: number;
    setWaveScale: (s: number) => void;

    /** Time remaining for auto-next gap in ms */
    playbackGapRemainingMs: number;
    setPlaybackGapRemainingMs: (ms: number) => void;

    // ── SyncEnsemble State ──
    syncStatus: SyncStatus;
    setSyncStatus: (status: SyncStatus) => void;
    clockOffset: ClockOffset | null;
    setClockOffset: (offset: ClockOffset | null) => void;
    isLeader: boolean;
    setIsLeader: (v: boolean) => void;
    sessionId: string | null;
    setSessionId: (id: string | null) => void;
    userId: string | null;
    setUserId: (id: string | null) => void;
    countdown: number | null; // null = inactive, 5, 4, 3, 2, 1...
    setCountdown: (v: number | null) => void;

    /** Synchronized play command pending execution — set by Orchestrator, consumed by useAudio */
    scheduledPlay: ScheduledPlay | null;
    clearScheduledPlay: () => void;

    /** Analytics Hooks */
    trackStart: (trackId: string) => void;
    trackEnd: (trackId: string, positionMs: number) => void;
    trackSkip: (trackId: string, positionMs: number) => void;
}

export const usePlayerStore = create<PlayerState>()(
    persist(
        (set, get) => ({
            pQueue: [],
            setPQueue: (pQueue) => set({ pQueue }),

            ci: 0,
            setCi: (ci) => set({ ci }),

            playing: false,
            setPlaying: (update) =>
                set((state) => ({
                    playing: typeof update === "function" ? update(state.playing) : update,
                })),

            pos: 0,
            setPos: (update) =>
                set((state) => ({
                    pos: typeof update === "function" ? update(state.pos) : update,
                })),

            vol: 0.85,
            setVol: (vol) => set({ vol }),

            elapsed: 0,
            setElapsed: (update) =>
                set((state) => ({
                    elapsed: typeof update === "function" ? update(state.elapsed) : update,
                })),

            tTarget: 2700,
            setTTarget: (tTarget) => set({ tTarget }),

            mode: "edit",
            setMode: (update) =>
                set((state) => ({
                    mode: typeof update === "function" ? update(state.mode) : update,
                })),

            isSimulating: false,
            setIsSimulating: (isSimulating) => set({ isSimulating }),

            stackOrder: [],
            setStackOrder: (update) =>
                set((state) => ({
                    stackOrder: typeof update === "function" ? update(state.stackOrder) : update,
                })),

            currentSetMetadata: null,
            setCurrentSetMetadata: (currentSetMetadata) => set({ currentSetMetadata }),

            isMirrorOpen: false,
            toggleMirror: () => set((state) => ({ isMirrorOpen: !state.isMirrorOpen })),

            mirrorMode: 'docked',
            setMirrorMode: (mirrorMode) => set({ mirrorMode }),

            mirrorSize: 'sm',
            setMirrorSize: (mirrorSize) => set({ mirrorSize }),

            waveScale: 1.0,
            setWaveScale: (waveScale) => set({ waveScale }),

            playbackGapRemainingMs: 0,
            setPlaybackGapRemainingMs: (playbackGapRemainingMs) => set({ playbackGapRemainingMs }),

            // SyncEnsemble Initial State
            syncStatus: 'UNCALIBRATED',
            setSyncStatus: (syncStatus) => set({ syncStatus }),
            clockOffset: null,
            setClockOffset: (clockOffset) => set({ clockOffset }),
            isLeader: true, // Por defecto solo, eres líder
            setIsLeader: (isLeader) => set({ isLeader }),
            sessionId: null,
            setSessionId: (sessionId) => set({ sessionId }),
            userId: null,
            setUserId: (userId) => set({ userId }),
            countdown: null,
            setCountdown: (countdown) => set({ countdown }),

            scheduledPlay: null,
            clearScheduledPlay: () => set({ scheduledPlay: null }),

            trackStart: (trackId) => AnalyticsService.trackStart(trackId),
            trackEnd: (trackId, positionMs) => AnalyticsService.trackEnd(trackId, positionMs),
            trackSkip: (trackId, positionMs) => AnalyticsService.trackSkip(trackId, positionMs),
        }),
        {
            name: "suniplayer-player",
            storage: createJSONStorage(() => getStorage()),
            partialize: (state) => ({
                pQueue: state.pQueue.map(t => ({ ...t, blob_url: undefined })),
                ci: state.ci,
                pos: state.pos,
                vol: state.vol,
                tTarget: state.tTarget,
                mode: state.mode,
                stackOrder: state.stackOrder,
                isMirrorOpen: state.isMirrorOpen,
                mirrorMode: state.mirrorMode,
                mirrorSize: state.mirrorSize,
                waveScale: state.waveScale,
                // No persistimos syncStatus ni offset porque deben recalibrarse en cada sesión
                isLeader: state.isLeader,
                sessionId: state.sessionId,
            }),
            merge: (persistedState, currentState) => {
                const persisted = persistedState as Partial<PlayerState>;
                const catalogById = new Map(TRACKS.map(t => [t.id, t]));
                // Also index by title for migrating old track-N IDs to lib-XXXXXXXX schema
                const catalogByTitle = new Map(TRACKS.map(t => [t.title?.toLowerCase().trim(), t]));
                const sanitizedQueue = (persisted.pQueue ?? []).map((t) => {
                    if (t.isCustom) return { ...t, blob_url: undefined };
                    // Match by ID first, then by title (handles old track-N schema migration)
                    const catalogEntry = catalogById.get(t.id) ?? catalogByTitle.get(t.title?.toLowerCase().trim());
                    if (catalogEntry) {
                        // Use catalog's id and file_path; preserve user-specific overrides
                        return { ...t, id: catalogEntry.id, file_path: catalogEntry.file_path, blob_url: undefined };
                    }
                    return { ...t, blob_url: undefined };
                });

                return {
                    ...currentState,
                    ...persisted,
                    pQueue: sanitizedQueue,
                    playing: false,
                    elapsed: 0,
                    isSimulating: false,
                    syncStatus: 'UNCALIBRATED',
                    clockOffset: null,
                };
            },
        }
    )
);
