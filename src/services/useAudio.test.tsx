import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAudio } from "./useAudio";
import { usePlayerStore } from "../store/usePlayerStore";
import { useSettingsStore } from "../store/useSettingsStore";

type Listener = () => void;

class MockAudio {
    static instances: MockAudio[] = [];
    static shouldRejectPlay = false;

    src = "";
    volume = 1;
    currentTime = 0;
    paused = true;
    ended = false;
    listeners = new Map<string, Set<Listener>>();

    constructor() {
        MockAudio.instances.push(this);
    }

    addEventListener(event: string, listener: Listener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)?.add(listener);
    }

    removeEventListener(event: string, listener: Listener) {
        this.listeners.get(event)?.delete(listener);
    }

    dispatch(event: string) {
        this.listeners.get(event)?.forEach((listener) => listener());
    }

    load() {}

    pause() {
        this.paused = true;
    }

    play() {
        this.paused = false;
        return MockAudio.shouldRejectPlay
            ? Promise.reject(new Error("play failed"))
            : Promise.resolve();
    }
}

const resetStores = () => {
    localStorage.clear();
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
};

describe("useAudio", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        MockAudio.instances = [];
        MockAudio.shouldRejectPlay = false;
        vi.stubGlobal("Audio", MockAudio);
        resetStores();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it("marks the player as simulating when browser playback fails", async () => {
        MockAudio.shouldRejectPlay = true;

        usePlayerStore.setState({
            pQueue: [
                {
                    id: "t-1",
                    title: "Track 1",
                    artist: "Artist",
                    duration_ms: 10000,
                    bpm: 120,
                    key: "C",
                    energy: 0.5,
                    mood: "happy",
                    file_path: "track-1.mp3",
                    analysis_cached: true,
                },
            ],
            playing: true,
        });

        renderHook(() => useAudio());

        await act(async () => {
            await Promise.resolve();
        });

        expect(usePlayerStore.getState().isSimulating).toBe(true);
    });

    it("clears simulating mode when audio becomes playable", async () => {
        usePlayerStore.setState({
            pQueue: [
                {
                    id: "t-1",
                    title: "Track 1",
                    artist: "Artist",
                    duration_ms: 10000,
                    bpm: 120,
                    key: "C",
                    energy: 0.5,
                    mood: "happy",
                    file_path: "track-1.mp3",
                    analysis_cached: true,
                },
            ],
            isSimulating: true,
        });

        renderHook(() => useAudio());

        await act(async () => {
            MockAudio.instances[0]?.dispatch("canplay");
            await Promise.resolve();
        });

        expect(usePlayerStore.getState().isSimulating).toBe(false);
    });
});
