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
import { Track, SetHistoryItem, Show } from "@suniplayer/core";
import { TRACKS, VENUES } from "@suniplayer/core";
import { buildSet, findSmartReplacement } from "@suniplayer/core";
import { sumTrackDurationMs, sumTrackDurationSeconds } from "@suniplayer/core";
import { getEffectiveDuration } from "@suniplayer/core";

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

type View = "builder" | "player" | "history" | "library";

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

    /** IDs of tracks to play next in LIVE mode, in priority order */
    stackOrder: string[];
    setStackOrder: (ids: string[] | ((prev: string[]) => string[])) => void;

    isSimulating: boolean;
    setIsSimulating: (v: boolean) => void;

    // Settings
    autoNext: boolean;
    setAutoNext: (v: boolean) => void;
    playbackGapMs: number;
    setPlaybackGapMs: (v: number) => void;
    autoGain: boolean;
    setAutoGain: (v: boolean) => void;
    performanceMode: boolean;
    setPerformanceMode: (v: boolean) => void;
    crossfade: boolean;
    setCrossfade: (v: boolean) => void;
    crossfadeMs: number;
    setCrossfadeMs: (v: number) => void;
    crossExpanded: boolean;
    setCrossExpanded: (v: boolean) => void;
    showSettings: boolean;
    setShowSettings: (v: boolean) => void;
    bpmMin: number;
    setBpmMin: (v: number) => void;
    bpmMax: number;
    setBpmMax: (v: number) => void;
    defaultVol: number;
    setDefaultVol: (v: number) => void;
    fadeEnabled: boolean;
    setFadeEnabled: (v: boolean) => void;
    fadeInMs: number;
    setFadeInMs: (v: number) => void;
    fadeOutMs: number;
    setFadeOutMs: (v: number) => void;
    fadeExpanded: boolean;
    setFadeExpanded: (v: boolean) => void;
    splMeterEnabled: boolean;
    setSplMeterEnabled: (v: boolean) => void;
    splMeterTarget: "studio" | "small" | "hall" | "open";
    setSplMeterTarget: (v: "studio" | "small" | "hall" | "open") => void;
    splMeterExpanded: boolean;
    setSplMeterExpanded: (v: boolean) => void;

    // History
    history: Show[];
    setHistory: (history: SetHistoryItem[] | ((prev: SetHistoryItem[]) => SetHistoryItem[])) => void;
    clearHistory: () => void;

    // Library
    customTracks: Track[];
    addCustomTrack: (track: Track) => void;
    removeCustomTrack: (id: string) => void;
    clearCustomTracks: () => void;
    availableTags: string[];
    addTag: (tag: string) => void;
    repertoire: Track[];
    addToRepertoire: (track: Track) => void;
    removeFromRepertoire: (trackId: string) => void;
    selectedTrackIds: string[];
    toggleSelection: (id: string) => void;
    clearSelection: () => void;
    addMultipleToRepertoire: (tracks: Track[]) => void;

    // Cross-domain actions
    setTrackNotes: (trackId: string, notes: string) => void;
    setTrackTrim: (trackId: string, start: number, end: number) => void;
    updateTrackMetadata: (trackId: string, updates: Partial<Track>) => void;
    doGen: (anchors?: Record<number, Track>) => void;
    smartReplace: (index: number) => void;
    toPlayer: () => void;
    quickPlay: (track: Track) => void;
    appendToQueue: (tracks: Track[]) => void;
    saveSet: () => void;
    resetApp: () => void;
}

// ── Cross-domain actions (module-level, use .getState() — no hooks needed) ─

/** Reset all stores to defaults and clear local storage */
export function resetApp() {
    if (!confirm("¿Estás seguro de que deseas reiniciar la aplicación? Se borrarán todos los sets generados, el historial y las canciones importadas.")) return;
    
    // Clear persistences manually if needed, but setState handles the runtime
    useBuilderStore.setState({ genSet: [], targetMin: 45, curve: "steady", venue: "lobby" });
    usePlayerStore.setState({ pQueue: [], ci: 0, playing: false, elapsed: 0, stackOrder: [] });
    useLibraryStore.setState({ customTracks: [], repertoire: [], trackOverrides: {} });
    useHistoryStore.setState({ history: [] });
    
    localStorage.clear();
    // Force reload to ensure everything is fresh
    window.location.reload();
}

/** Update notes on a track in both pQueue and genSet */
export function setTrackNotes(trackId: string, notes: string) {
    usePlayerStore.setState((s) => ({
        pQueue: s.pQueue.map((t) => (t.id === trackId ? { ...t, notes } : t)),
    }));
    useBuilderStore.setState((s) => ({
        genSet: s.genSet.map((t) => (t.id === trackId ? { ...t, notes } : t)),
    }));
}

/** Update trimming on a track in pQueue, genSet, and Library */
export function setTrackTrim(trackId: string, startTime: number, endTime: number) {
    usePlayerStore.setState((s) => {
        const newQueue = s.pQueue.map((t) => (t.id === trackId ? { ...t, startTime, endTime } : t));
        return {
            pQueue: newQueue,
            tTarget: newQueue.reduce((acc, t) => acc + getEffectiveDuration(t) / 1000, 0)
        };
    });
    useBuilderStore.setState((s) => ({
        genSet: s.genSet.map((t) => (t.id === trackId ? { ...t, startTime, endTime } : t)),
    }));
    useLibraryStore.getState().updateTrack(trackId, { startTime, endTime });
}

/** Helper to apply persisted metadata overrides (key, bpm, trim, etc) to a list of tracks */
function applyOverrides(tracks: Track[]): Track[] {
    const { trackOverrides } = useLibraryStore.getState();
    return tracks.map((t) => ({
        ...t,
        ...(trackOverrides[t.id] || {}),
    }));
}

/** Update generic metadata on a track in all stores */
export function updateTrackMetadata(trackId: string, updates: Partial<Track>) {
    usePlayerStore.setState((s) => {
        const newQueue = s.pQueue.map((t) => (t.id === trackId ? { ...t, ...updates } : t));
        return {
            pQueue: newQueue,
            tTarget: newQueue.reduce((acc, t) => acc + getEffectiveDuration(t) / 1000, 0)
        };
    });
    useBuilderStore.setState((s) => ({
        genSet: s.genSet.map((t) => (t.id === trackId ? { ...t, ...updates } : t)),
    }));
    useLibraryStore.getState().updateTrack(trackId, updates);
}

/** Generate a set using current builder config + settings filters */
export function doGen(anchors: Record<number, Track> = {}) {
    const builderState = useBuilderStore.getState();
    const { targetMin, curve, venue } = builderState;
    const { 
        bpmMin, bpmMax, 
        harmonicMixing, maxBpmJump, energyContinuity 
    } = useSettingsStore.getState();
    const { repertoire, customTracks } = useLibraryStore.getState();
    const tSec = targetMin * 60;

    // Inteligencia de pool: Usar repertorio si existe, sino usar toda la biblioteca
    const sourcePool = repertoire.length > 0 ? repertoire : [
        ...TRACKS,
        ...customTracks.filter(ct => !TRACKS.some(t => t.id === ct.id))
    ];

    if (sourcePool.length === 0) {
        alert("Tu biblioteca está vacía. Importá algunos audios primero.");
        return;
    }

    const rawSet = buildSet(sourcePool, tSec, { 
        curve, venue, bpmMin, bpmMax,
        harmonicMixing, maxBpmJump, energyContinuity,
        anchors
    });

    useBuilderStore.setState({
        genSet: applyOverrides(rawSet),
    });
}

/** 
 * Reemplaza inteligentemente un track en una posición específica 
 * manteniendo la coherencia armónica y de tempo del hueco.
 */
export function smartReplace(index: number) {
    const builderState = useBuilderStore.getState();
    const settingsState = useSettingsStore.getState();
    const { repertoire } = useLibraryStore.getState();
    
    const currentSet = builderState.genSet;
    if (index < 0 || index >= currentSet.length) return;

    // The findSmartReplacement logic handles exclusions internally
    const replacement = findSmartReplacement(
        index,
        currentSet,
        repertoire,
        {
            harmonicMixing: settingsState.harmonicMixing,
            maxBpmJump: settingsState.maxBpmJump,
            energyContinuity: settingsState.energyContinuity,
            bpmMin: settingsState.bpmMin,
            bpmMax: settingsState.bpmMax
        }
    );

    if (replacement) {
        const newSet = [...currentSet];
        newSet[index] = applyOverrides([replacement])[0];
        useBuilderStore.setState({ genSet: newSet });
    } else {
        alert("No se encontró un reemplazo adecuado que cumpla con las reglas DJ actuales en este hueco.");
    }
}

/** Send generated set to the player (or just switch view if already playing) */
export function toPlayer() {
    const { genSet, targetMin } = useBuilderStore.getState();
    const { playing } = usePlayerStore.getState();
    if (!genSet.length) return;
    
    // Ensure all tracks in the set have latest overrides
    const finalizedSet = applyOverrides(genSet);
    const tSec = targetMin * 60;
    
    if (playing) {
        useBuilderStore.setState({ view: "player", genSet: finalizedSet });
    } else {
        usePlayerStore.setState({
            pQueue: finalizedSet,
            ci: 0, pos: 0, playing: false, elapsed: 0,
            tTarget: tSec, mode: "edit",
        });
        useBuilderStore.setState({ view: "player", genSet: finalizedSet });
    }
}

/** Quick play from Library */
export function quickPlay(track: Track) {
    // Atomic reset and play
    usePlayerStore.setState({
        pQueue: [track],
        ci: 0,
        pos: 0,
        elapsed: 0,
        playing: true,
        tTarget: track.duration_ms / 1000,
    });
    useBuilderStore.setState({ view: "player" });
}

/** Append tracks to the active queue without interrupting playback */
export function appendToQueue(tracks: Track[]) {
    if (!tracks.length) return;
    const { pQueue, ci, tTarget } = usePlayerStore.getState();
    const tracksWithOverrides = applyOverrides(tracks);
    
    if (pQueue.length === 0) {
        usePlayerStore.setState({
            pQueue: tracksWithOverrides,
            ci: 0,
            pos: 0,
            // Eliminamos 'playing: false' para no interrumpir si ya hay un buffer sonando (ej. preview)
            elapsed: 0,
            tTarget: sumTrackDurationSeconds(tracksWithOverrides),
        });
        useBuilderStore.setState({ view: "player" });
    } else {
        const newQueue = [
            ...pQueue.slice(0, ci + 1),
            ...tracksWithOverrides,
            ...pQueue.slice(ci + 1),
        ];
        usePlayerStore.setState({
            pQueue: newQueue,
            tTarget: tTarget + sumTrackDurationSeconds(tracksWithOverrides),
        });
    }
}

/** Save the current generated set to history */
export function saveSet() {
    const builderState = useBuilderStore.getState();
    const { genSet, targetMin, venue, curve } = builderState;
    if (!genSet.length) return;

    const v = VENUES.find((x) => x.id === venue);
    const now = new Date().toISOString();

    const newShow: SetHistoryItem = {
        id: crypto.randomUUID(),
        name: (v?.label || "Set") + " " + targetMin + "min",
        createdAt: now,
        sets: [{
            id: crypto.randomUUID(),
            label: "Set 1",
            tracks: [...genSet],
            durationMs: sumTrackDurationMs(genSet),
            builtAt: now
        }],
        tracks: [...genSet],
        total: sumTrackDurationMs(genSet),
        target: targetMin * 60,
        venue,
        curve,
        date: new Date().toLocaleString()
    };

    useHistoryStore.getState().saveShow(newShow);
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
        stackOrder: player.stackOrder,
        setStackOrder: player.setStackOrder,
        isSimulating: player.isSimulating,
        setIsSimulating: player.setIsSimulating,

        // Settings
        autoNext: settings.autoNext,
        setAutoNext: settings.setAutoNext,
        playbackGapMs: settings.playbackGapMs,
        setPlaybackGapMs: settings.setPlaybackGapMs,
        autoGain: settings.autoGain,
        setAutoGain: settings.setAutoGain,
        performanceMode: settings.performanceMode,
        setPerformanceMode: settings.setPerformanceMode,
        crossfade: settings.crossfade,
        setCrossfade: settings.setCrossfade,
        crossfadeMs: settings.crossfadeMs,
        setCrossfadeMs: settings.setCrossfadeMs,
        crossExpanded: settings.crossExpanded,
        setCrossExpanded: settings.setCrossExpanded,
        showSettings: settings.showSettings,
        setShowSettings: settings.setShowSettings,
        bpmMin: settings.bpmMin,
        setBpmMin: settings.setBpmMin,
        bpmMax: settings.bpmMax,
        setBpmMax: settings.setBpmMax,
        defaultVol: settings.defaultVol,
        setDefaultVol,
        fadeEnabled: settings.fadeEnabled,
        setFadeEnabled: settings.setFadeEnabled,
        fadeInMs: settings.fadeInMs,
        setFadeInMs: settings.setFadeInMs,
        fadeOutMs: settings.fadeOutMs,
        setFadeOutMs: settings.setFadeOutMs,
        fadeExpanded: settings.fadeExpanded,
        setFadeExpanded: settings.setFadeExpanded,
        splMeterEnabled: settings.splMeterEnabled,
        setSplMeterEnabled: settings.setSplMeterEnabled,
        splMeterTarget: settings.splMeterTarget,
        setSplMeterTarget: settings.setSplMeterTarget,
        splMeterExpanded: settings.splMeterExpanded,
        setSplMeterExpanded: settings.setSplMeterExpanded,

        // History
        history: hist.history,
        setHistory: hist.setHistory,
        clearHistory: hist.clearHistory,

        // Library
        customTracks: library.customTracks,
        addCustomTrack: library.addCustomTrack,
        removeCustomTrack: library.removeCustomTrack,
        clearCustomTracks: library.clearCustomTracks,
        availableTags: library.availableTags,
        addTag: library.addTag,
        repertoire: library.repertoire,
        addToRepertoire: library.addToRepertoire,
        removeFromRepertoire: library.removeFromRepertoire,
        addMultipleToRepertoire: library.addMultipleToRepertoire,
        selectedTrackIds: library.selectedTrackIds,
        toggleSelection: library.toggleSelection,
        clearSelection: library.clearSelection,

        // Cross-domain actions
        setTrackNotes,
        setTrackTrim,
        updateTrackMetadata,
        doGen,
        smartReplace,
        toPlayer,
        quickPlay,
        appendToQueue,

        saveSet,
        resetApp,
    };

    return selector ? selector(combined) : combined;
}
