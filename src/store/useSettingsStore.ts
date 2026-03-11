/**
 * useSettingsStore — Playback & builder configuration settings
 * Persisted to localStorage under "suniplayer-settings"
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SettingsState {
    // Playback settings
    autoNext: boolean;
    setAutoNext: (v: boolean) => void;
    crossfade: boolean;
    setCrossfade: (v: boolean) => void;

    // Volume
    defaultVol: number;
    setDefaultVol: (v: number) => void;

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

    // SPL Meter
    splMeterEnabled: boolean;
    setSplMeterEnabled: (v: boolean) => void;
    splMeterTarget: "studio" | "small" | "hall" | "open";
    setSplMeterTarget: (v: "studio" | "small" | "hall" | "open") => void;
    splMeterExpanded: boolean;
    setSplMeterExpanded: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            autoNext: true,
            setAutoNext: (autoNext) => set({ autoNext }),

            crossfade: true,
            setCrossfade: (crossfade) => set({ crossfade }),

            defaultVol: 0.85,
            setDefaultVol: (defaultVol) => set({ defaultVol }),

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

            splMeterEnabled: false,
            setSplMeterEnabled: (splMeterEnabled) => set({ splMeterEnabled }),

            splMeterTarget: "small",
            setSplMeterTarget: (splMeterTarget) => set({ splMeterTarget }),

            splMeterExpanded: true,
            setSplMeterExpanded: (splMeterExpanded) => set({ splMeterExpanded }),

            // Not persisted — panel always closes on reload
            showSettings: false,
            setShowSettings: (showSettings) => set({ showSettings }),
        }),
        {
            name: "suniplayer-settings",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                autoNext: state.autoNext,
                crossfade: state.crossfade,
                defaultVol: state.defaultVol,
                bpmMin: state.bpmMin,
                bpmMax: state.bpmMax,
                fadeEnabled: state.fadeEnabled,
                fadeInMs: state.fadeInMs,
                fadeOutMs: state.fadeOutMs,
                splMeterEnabled: state.splMeterEnabled,
                splMeterTarget: state.splMeterTarget,
                splMeterExpanded: state.splMeterExpanded,
            }),
        }
    )
);
