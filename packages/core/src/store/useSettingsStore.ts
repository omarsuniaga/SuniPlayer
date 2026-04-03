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

interface SettingsState {
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

    // Immersion / Ring Mode
    immersionMode: boolean;
    setImmersionMode: (v: boolean) => void;

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

    // Learn mode (non-persisted UI state — which action is currently listening)
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
            crossfadeMs: 2000,
            setCrossfadeMs: (crossfadeMs) => set({ crossfadeMs }),
            crossExpanded: true,
            setCrossExpanded: (crossExpanded) => set({ crossExpanded }),
            performanceMode: false,
            setPerformanceMode: (performanceMode) => set({ performanceMode }),

            immersionMode: false,
            setImmersionMode: (immersionMode) => set({ immersionMode }),

            defaultVol: 0.85,
            setDefaultVol: (defaultVol) => set({ defaultVol }),

            autoGain: true,
            setAutoGain: (autoGain) => set({ autoGain }),

            bpmMin: 55,
            setBpmMin: (bpmMin) => set({ bpmMin }),

            bpmMax: 140,
            setBpmMax: (bpmMax) => set({ bpmMax }),

            fadeEnabled: true,
            setFadeEnabled: (fadeEnabled) => set({ fadeEnabled }),

            fadeInMs: 2000,
            setFadeInMs: (fadeInMs) => set({ fadeInMs }),

            fadeOutMs: 3000,
            setFadeOutMs: (fadeOutMs) => set({ fadeOutMs }),
            fadeExpanded: true,
            setFadeExpanded: (fadeExpanded) => set({ fadeExpanded }),

            splMeterEnabled: false,
            setSplMeterEnabled: (splMeterEnabled) => set({ splMeterEnabled }),

            splMeterTarget: "small",
            setSplMeterTarget: (splMeterTarget) => set({ splMeterTarget }),

            splMeterExpanded: true,
            setSplMeterExpanded: (splMeterExpanded) => set({ splMeterExpanded }),

            curveVisible: true,
            setCurveVisible: (curveVisible) => set({ curveVisible }),
            curveExpanded: true,
            setCurveExpanded: (curveExpanded) => set({ curveExpanded }),

            durationPresets: [30, 45, 60, 90, 120],
            addDurationPreset: (min) =>
                set((state) => ({
                    durationPresets: [...new Set([...state.durationPresets, min])].sort((a, b) => a - b),
                })),
            removeDurationPreset: (min) =>
                set((state) => ({
                    durationPresets: state.durationPresets.filter((preset) => preset !== min),
                })),

            pedalBindings: {},
            setPedalBinding: (action, binding) =>
                set((state) => ({
                    pedalBindings: { ...state.pedalBindings, [action]: binding },
                })),
            clearPedalBindings: () => set({ pedalBindings: {} }),
            clearPedalBinding: (action) =>
                set((state) => {
                    const next = { ...state.pedalBindings };
                    delete next[action];
                    return { pedalBindings: next };
                }),

            gestureBindings: {
                up: "vol_up",
                down: "vol_down",
                left: "prev",
                right: "next",
                click: "play_pause",
                dblclick: "none",
            },
            setGestureBinding: (direction, action) =>
                set((state) => ({
                    gestureBindings: { ...state.gestureBindings, [direction]: action },
                })),

            learningAction: null,
            setLearningAction: (learningAction) => set({ learningAction }),

            // Not persisted — panel always closes on reload
            showSettings: false,
            setShowSettings: (showSettings) => set({ showSettings }),
        }),
        {
            name: "suniplayer-settings",
            storage: createJSONStorage(() => getStorage()),
            partialize: (state) => ({
                autoNext: state.autoNext,
                playbackGapMs: state.playbackGapMs,
                crossfade: state.crossfade,
                crossExpanded: state.crossExpanded,
                crossfadeMs: state.crossfadeMs,
                performanceMode: state.performanceMode,
                immersionMode: state.immersionMode,
                defaultVol: state.defaultVol,
                fadeEnabled: state.fadeEnabled,
                fadeExpanded: state.fadeExpanded,
                fadeInMs: state.fadeInMs,
                fadeOutMs: state.fadeOutMs,
                autoGain: state.autoGain,
                splMeterEnabled: state.splMeterEnabled,
                splMeterTarget: state.splMeterTarget,
                splMeterExpanded: state.splMeterExpanded,
                curveVisible: state.curveVisible,
                curveExpanded: state.curveExpanded,
                bpmMin: state.bpmMin,
                bpmMax: state.bpmMax,
                durationPresets: state.durationPresets,
                pedalBindings: state.pedalBindings,
                gestureBindings: state.gestureBindings,
            }),
        }
    )
);
