/**
 * useSettingsStore — Playback & builder configuration settings
 * Persisted to localStorage under "suniplayer-settings"
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getStorage } from "./storage";

// ── Pedal & Gesture Bindings ────────────────────────────────────────────────
export type PedalAction = "next" | "prev" | "play_pause" | "stop" | "vol_up" | "vol_down";
export type GestureDirection = "up" | "down" | "left" | "right" | "click" | "dblclick";

export interface PedalBinding {
    key: string;   // event.key value: "ArrowRight", "Space", " ", "PageDown", etc.
    label: string; // Human-readable: "→", "Espacio", "Pág↓"
}

export type PedalBindings = Partial<Record<PedalAction, PedalBinding>>;
export type GestureBindings = Record<GestureDirection, PedalAction | "none">;

export interface DJProfile {
    id: string;
    name: string;
    bpmMin: number;
    bpmMax: number;
    harmonicMixing: boolean;
    maxBpmJump: number;
    energyContinuity: boolean;
}

export interface SettingsState {
    // Playback settings
    autoNext: boolean;
    setAutoNext: (v: boolean) => void;
    playbackGapMs: number;
    setPlaybackGapMs: (v: number) => void;
    crossfade: boolean;
    setCrossfade: (v: boolean) => void;
    crossfadeMs: number;
    setCrossfadeMs: (v: number) => void;
    crossExpanded: boolean;
    setCrossExpanded: (v: boolean) => void;
    performanceMode: boolean;
    setPerformanceMode: (v: boolean) => void;

    // Ring Control (HID Mouse Drag)
    ringControlEnabled: boolean;
    setRingControlEnabled: (v: boolean) => void;

    // Volume
    defaultVol: number;
    setDefaultVol: (v: number) => void;
    autoGain: boolean;
    setAutoGain: (v: boolean) => void;

    // Set builder filters
    bpmMin: number;
    setBpmMin: (v: number) => void;
    bpmMax: number;
    setBpmMax: (v: number) => void;

    // Advanced DJ Logic
    harmonicMixing: boolean;
    setHarmonicMixing: (v: boolean) => void;
    maxBpmJump: number;
    setMaxBpmJump: (v: number) => void;
    energyContinuity: boolean;
    setEnergyContinuity: (v: boolean) => void;

    // DJ Profiles
    djProfiles: DJProfile[];
    saveDJProfile: (name: string) => void;
    loadDJProfile: (id: string) => void;
    deleteDJProfile: (id: string) => void;

    // UI state (not persisted)
    showSettings: boolean;
    setShowSettings: (v: boolean) => void;

    // Fade effect
    fadeEnabled: boolean;
    setFadeEnabled: (v: boolean) => void;
    fadeInMs: number;
    setFadeInMs: (v: number) => void;
    fadeOutMs: number;
    setFadeOutMs: (v: number) => void;
    fadeExpanded: boolean;
    setFadeExpanded: (v: boolean) => void;

    // SPL Meter
    splMeterEnabled: boolean;
    setSplMeterEnabled: (v: boolean) => void;
    splMeterTarget: "studio" | "small" | "hall" | "open";
    setSplMeterTarget: (v: "studio" | "small" | "hall" | "open") => void;
    splMeterExpanded: boolean;
    setSplMeterExpanded: (v: boolean) => void;

    // Energy Curve panel
    curveVisible: boolean;
    setCurveVisible: (v: boolean) => void;
    curveExpanded: boolean;
    setCurveExpanded: (v: boolean) => void;

    // Markers
    showMarkers: boolean;
    setShowMarkers: (v: boolean) => void;

    // Set duration presets (persisted)
    durationPresets: number[];
    addDurationPreset: (min: number) => void;
    removeDurationPreset: (min: number) => void;

    // Pedal bindings
    pedalBindings: PedalBindings;
    setPedalBinding: (action: PedalAction, binding: PedalBinding) => void;
    clearPedalBindings: () => void;
    clearPedalBinding: (action: PedalAction) => void;

    // Gesture bindings (Ring/Mouse)
    gestureBindings: GestureBindings;
    setGestureBinding: (direction: GestureDirection, action: PedalAction | "none") => void;

    // Learn mode (non-persisted UI state)
    learningAction: PedalAction | null;
    setLearningAction: (action: PedalAction | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            autoNext: true,
            setAutoNext: (autoNext) => set({ autoNext }),
            playbackGapMs: 0,
            setPlaybackGapMs: (playbackGapMs) => set({ playbackGapMs }),
            crossfade: true,
            setCrossfade: (crossfade) => set({ crossfade }),
            crossfadeMs: 3000,
            setCrossfadeMs: (crossfadeMs) => set({ crossfadeMs }),
            crossExpanded: false,
            setCrossExpanded: (crossExpanded) => set({ crossExpanded }),
            performanceMode: false,
            setPerformanceMode: (performanceMode) => set({ performanceMode }),

            ringControlEnabled: true,
            setRingControlEnabled: (ringControlEnabled) => set({ ringControlEnabled }),

            defaultVol: 0.8,
            setDefaultVol: (defaultVol) => set({ defaultVol }),
            autoGain: true,
            setAutoGain: (autoGain) => set({ autoGain }),

            bpmMin: 80,
            setBpmMin: (bpmMin) => set({ bpmMin }),
            bpmMax: 140,
            setBpmMax: (bpmMax) => set({ bpmMax }),

            harmonicMixing: true,
            setHarmonicMixing: (harmonicMixing) => set({ harmonicMixing }),
            maxBpmJump: 10,
            setMaxBpmJump: (maxBpmJump) => set({ maxBpmJump }),
            energyContinuity: true,
            setEnergyContinuity: (energyContinuity) => set({ energyContinuity }),

            djProfiles: [],
            saveDJProfile: (name: string) => set((state) => {
                const newProfile: DJProfile = {
                    id: crypto.randomUUID(),
                    name,
                    bpmMin: state.bpmMin,
                    bpmMax: state.bpmMax,
                    harmonicMixing: state.harmonicMixing,
                    maxBpmJump: state.maxBpmJump,
                    energyContinuity: state.energyContinuity,
                };
                return { djProfiles: [...state.djProfiles, newProfile] };
            }),
            loadDJProfile: (id: string) => set((state) => {
                const p = state.djProfiles.find(p => p.id === id);
                if (!p) return state;
                return {
                    bpmMin: p.bpmMin,
                    bpmMax: p.bpmMax,
                    harmonicMixing: p.harmonicMixing,
                    maxBpmJump: p.maxBpmJump,
                    energyContinuity: p.energyContinuity,
                };
            }),
            deleteDJProfile: (id: string) => set((state) => ({
                djProfiles: state.djProfiles.filter(p => p.id !== id)
            })),

            showSettings: false,
            setShowSettings: (showSettings) => set({ showSettings }),

            fadeEnabled: true,
            setFadeEnabled: (fadeEnabled) => set({ fadeEnabled }),
            fadeInMs: 2000,
            setFadeInMs: (fadeInMs) => set({ fadeInMs }),
            fadeOutMs: 3000,
            setFadeOutMs: (fadeOutMs) => set({ fadeOutMs }),
            fadeExpanded: false,
            setFadeExpanded: (fadeExpanded) => set({ fadeExpanded }),

            splMeterEnabled: true,
            setSplMeterEnabled: (splMeterEnabled) => set({ splMeterEnabled }),
            splMeterTarget: "studio",
            setSplMeterTarget: (splMeterTarget) => set({ splMeterTarget }),
            splMeterExpanded: false,
            setSplMeterExpanded: (splMeterExpanded) => set({ splMeterExpanded }),

            curveVisible: true,
            setCurveVisible: (curveVisible) => set({ curveVisible }),
            curveExpanded: false,
            setCurveExpanded: (curveExpanded) => set({ curveExpanded }),

            showMarkers: true,
            setShowMarkers: (showMarkers) => set({ showMarkers }),

            durationPresets: [15, 30, 45, 60, 90],
            addDurationPreset: (min) => set((s) => ({ durationPresets: Array.from(new Set([...s.durationPresets, min])).sort((a, b) => a - b) })),
            removeDurationPreset: (min) => set((s) => ({ durationPresets: s.durationPresets.filter((p) => p !== min) })),

            pedalBindings: {
                "next": { key: "ArrowRight", label: "→" },
                "prev": { key: "ArrowLeft", label: "←" },
                "play_pause": { key: " ", label: "Espacio" },
            },
            setPedalBinding: (action, binding) => set((s) => ({
                pedalBindings: { ...s.pedalBindings, [action]: binding },
                learningAction: null
            })),
            clearPedalBindings: () => set({ pedalBindings: {} }),
            clearPedalBinding: (action) => set((s) => {
                const next = { ...s.pedalBindings };
                delete next[action];
                return { pedalBindings: next };
            }),

            gestureBindings: {
                up: "vol_up",
                down: "vol_down",
                left: "prev",
                right: "next",
                click: "play_pause",
                dblclick: "none"
            },
            setGestureBinding: (direction, action) => set((s) => ({
                gestureBindings: { ...s.gestureBindings, [direction]: action }
            })),

            learningAction: null,
            setLearningAction: (learningAction) => set({ learningAction }),
        }),
        {
            name: "suniplayer-settings",
            storage: createJSONStorage(() => getStorage()),
            partialize: (state) => ({
                autoNext: state.autoNext,
                playbackGapMs: state.playbackGapMs,
                autoGain: state.autoGain,
                performanceMode: state.performanceMode,
                crossfade: state.crossfade,
                crossfadeMs: state.crossfadeMs,
                defaultVol: state.defaultVol,
                fadeEnabled: state.fadeEnabled,
                fadeInMs: state.fadeInMs,
                fadeOutMs: state.fadeOutMs,
                splMeterEnabled: state.splMeterEnabled,
                splMeterTarget: state.splMeterTarget,
                splMeterExpanded: state.splMeterExpanded,
                curveVisible: state.curveVisible,
                curveExpanded: state.curveExpanded,
                showMarkers: state.showMarkers,
                bpmMin: state.bpmMin,
                bpmMax: state.bpmMax,
                harmonicMixing: state.harmonicMixing,
                maxBpmJump: state.maxBpmJump,
                energyContinuity: state.energyContinuity,
                djProfiles: state.djProfiles,
                durationPresets: state.durationPresets,
                pedalBindings: state.pedalBindings,
                gestureBindings: state.gestureBindings,
            }),
        }
    )
);
