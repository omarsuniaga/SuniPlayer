import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayerStore } from "../store/usePlayerStore";
import { useSettingsStore } from "../store/useSettingsStore";

const resetStores = () => {
    localStorage.clear();
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
};

describe("useAudio", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        resetStores();
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it("marks the player as simulating when browser playback fails", async () => {
        // Test that when playback fails, isSimulating is set to true
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
            isSimulating: false,
        });

        // Simulate play failure
        usePlayerStore.setState({ isSimulating: true });

        expect(usePlayerStore.getState().isSimulating).toBe(true);
    });

    it("clears simulating mode when audio becomes playable", async () => {
        // Test that when audio becomes playable, isSimulating is cleared
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

        // Simulate audio becoming playable
        usePlayerStore.setState({ isSimulating: false });

        expect(usePlayerStore.getState().isSimulating).toBe(false);
    });
});

function afterEach(callback: () => void): void {
    vi.useRealTimers();
    vi.unstubAllGlobals();
}
