/**
 * useProjectStore — Backward-compatible composite hook
 *
 * Combines all domain stores into a single API so existing components
 * continue to work without changes.  Performance-critical code (useAudio)
 * should import domain stores directly to minimise re-renders.
 *
 * Domain stores:
 *   useBuilderStore  — view, targetMin, venue, curve, genSet, search, fMood
 *   usePlayerStore   — pQueue, ci, playing, pos, vol, elapsed, tTarget, mode
 *   useSettingsStore — autoNext, crossfade, showSettings, bpmMin, bpmMax, defaultVol
 *   useHistoryStore  — history
 *   useLibraryStore  — customTracks
 */
import { Track, SetHistoryItem } from "../types.ts";
import { TRACKS, VENUES } from "../data/constants.ts";
import { buildSet } from "../services/setBuilderService.ts";
import { sumTrackDurationMs, sumTrackDurationSeconds } from "../utils/trackMetrics.ts";

import { useBuilderStore } from "./useBuilderStore.ts";
import { usePlayerStore } from "./usePlayerStore.ts";
import { useSettingsStore } from "./useSettingsStore.ts";
import { useHistoryStore } from "./useHistoryStore.ts";
import { useLibraryStore } from "./useLibraryStore.ts";

// Re-export domain stores for direct use where performance matters
export {
    useBuilderStore,
    usePlayerStore,
    useSettingsStore,
    useHistoryStore,
    useLibraryStore,
};

// ── Combined state type ────────────────────────────────────────────────────

type View = "builder" | "player" | "history";

export interface ProjectState {
    // Builder
    view: View;
    setView: (view: View) => void;
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

    // Player
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

    isSimulating: boolean;
    setIsSimulating: (v: boolean) => void;

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

    // History
    history: SetHistoryItem[];
    setHistory: (history: SetHistoryItem[] | ((prev: SetHistoryItem[]) => SetHistoryItem[])) => void;
    clearHistory: () => void;

    // Library
    customTracks: Track[];
    addCustomTrack: (track: Track) => void;
    removeCustomTrack: (id: string) => void;
    clearCustomTracks: () => void;

    // Cross-domain actions
    setTrackNotes: (trackId: string, notes: string) => void;
    doGen: () => void;
    toPlayer: () => void;
    appendToQueue: (tracks: Track[]) => void;
    saveSet: () => void;
}

// ── Cross-domain actions (module-level, use .getState() — no hooks needed) ─

/** Update notes on a track in both pQueue and genSet */
export function setTrackNotes(trackId: string, notes: string) {
    usePlayerStore.setState((s) => ({
        pQueue: s.pQueue.map((t) => (t.id === trackId ? { ...t, notes } : t)),
    }));
    useBuilderStore.setState((s) => ({
        genSet: s.genSet.map((t) => (t.id === trackId ? { ...t, notes } : t)),
    }));
}

/** Generate a set using current builder config + settings filters */
export function doGen() {
    const { targetMin, curve, venue } = useBuilderStore.getState();
    const { bpmMin, bpmMax } = useSettingsStore.getState();
    const tSec = targetMin * 60;
    useBuilderStore.setState({
        genSet: buildSet(TRACKS, tSec, { curve, venue, bpmMin, bpmMax }),
    });
}

/** Send generated set to the player (or just switch view if already playing) */
export function toPlayer() {
    const { genSet, targetMin } = useBuilderStore.getState();
    const { playing } = usePlayerStore.getState();
    if (!genSet.length) return;
    const tSec = targetMin * 60;
    if (playing) {
        useBuilderStore.setState({ view: "player" });
    } else {
        usePlayerStore.setState({
            pQueue: [...genSet],
            ci: 0, pos: 0, playing: false, elapsed: 0,
            tTarget: tSec, mode: "edit",
        });
        useBuilderStore.setState({ view: "player" });
    }
}

/** Append tracks to the active queue without interrupting playback */
export function appendToQueue(tracks: Track[]) {
    if (!tracks.length) return;
    const { pQueue, ci, tTarget } = usePlayerStore.getState();
    if (pQueue.length === 0) {
        usePlayerStore.setState({
            pQueue: [...tracks],
            ci: 0, pos: 0, playing: false, elapsed: 0,
            tTarget: sumTrackDurationSeconds(tracks),
        });
        useBuilderStore.setState({ view: "player" });
    } else {
        const newQueue = [
            ...pQueue.slice(0, ci + 1),
            ...tracks,
            ...pQueue.slice(ci + 1),
        ];
        usePlayerStore.setState({
            pQueue: newQueue,
            tTarget: tTarget + sumTrackDurationSeconds(tracks),
        });
    }
}

/** Save the current generated set to history */
export function saveSet() {
    const { genSet, targetMin, venue, curve } = useBuilderStore.getState();
    if (!genSet.length) return;
    const tSec = targetMin * 60;
    const v = VENUES.find((x) => x.id === venue);
    const newItem: SetHistoryItem = {
        id: Date.now() + "",
        name: (v?.label || "Set") + " " + targetMin + "min",
        tracks: [...genSet],
        total: sumTrackDurationMs(genSet),
        target: tSec,
        venue,
        curve,
        date: new Date().toLocaleString(),
    };
    useHistoryStore.setState((s) => ({ history: [newItem, ...s.history] }));
}

/** Change defaultVol in settings AND sync to active player vol */
export function setDefaultVol(v: number) {
    useSettingsStore.getState().setDefaultVol(v);
    usePlayerStore.getState().setVol(v);
}

// ── Composite hook — backward-compatible shim ──────────────────────────────

export function useProjectStore(): ProjectState;
export function useProjectStore<T>(selector: (s: ProjectState) => T): T;
export function useProjectStore<T = ProjectState>(
    selector?: (s: ProjectState) => T
): T | ProjectState {
    const builder = useBuilderStore();
    const player = usePlayerStore();
    const settings = useSettingsStore();
    const hist = useHistoryStore();
    const library = useLibraryStore();

    const combined: ProjectState = {
        // Builder
        view: builder.view,
        setView: builder.setView,
        targetMin: builder.targetMin,
        setTargetMin: builder.setTargetMin,
        venue: builder.venue,
        setVenue: builder.setVenue,
        curve: builder.curve,
        setCurve: builder.setCurve,
        genSet: builder.genSet,
        setGenSet: builder.setGenSet,
        search: builder.search,
        setSearch: builder.setSearch,
        fMood: builder.fMood,
        setFMood: builder.setFMood,

        // Player
        pQueue: player.pQueue,
        setPQueue: player.setPQueue,
        ci: player.ci,
        setCi: player.setCi,
        playing: player.playing,
        setPlaying: player.setPlaying,
        pos: player.pos,
        setPos: player.setPos,
        vol: player.vol,
        setVol: player.setVol,
        elapsed: player.elapsed,
        setElapsed: player.setElapsed,
        tTarget: player.tTarget,
        setTTarget: player.setTTarget,
        mode: player.mode,
        setMode: player.setMode,
        isSimulating: player.isSimulating,
        setIsSimulating: player.setIsSimulating,

        // Settings
        autoNext: settings.autoNext,
        setAutoNext: settings.setAutoNext,
        crossfade: settings.crossfade,
        setCrossfade: settings.setCrossfade,
        showSettings: settings.showSettings,
        setShowSettings: settings.setShowSettings,
        bpmMin: settings.bpmMin,
        setBpmMin: settings.setBpmMin,
        bpmMax: settings.bpmMax,
        setBpmMax: settings.setBpmMax,
        defaultVol: settings.defaultVol,
        // Override: setDefaultVol syncs both stores
        setDefaultVol,

        // History
        history: hist.history,
        setHistory: hist.setHistory,
        clearHistory: hist.clearHistory,

        // Library
        customTracks: library.customTracks,
        addCustomTrack: library.addCustomTrack,
        removeCustomTrack: library.removeCustomTrack,
        clearCustomTracks: library.clearCustomTracks,

        // Cross-domain actions
        setTrackNotes,
        doGen,
        toPlayer,
        appendToQueue,
        saveSet,
    };

    return selector ? selector(combined) : combined;
}
