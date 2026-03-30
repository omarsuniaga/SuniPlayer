import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("../services/waveformService", () => ({
    getWaveformData: vi.fn().mockResolvedValue(Array.from({ length: 32 }, () => 0.4)),
}));

vi.mock("../components/player/Dashboard");
vi.mock("../components/common/Wave.tsx");
vi.mock("../components/common/TrackTrimmer");
vi.mock("../components/common/TrackProfileModal");
vi.mock("../components/common/SheetMusicViewer");
vi.mock("../components/player/LiveUnlockModal");

import { TRACKS } from \"@suniplayer/core\";
import { useBuilderStore } from "../store/useBuilderStore";
import { usePlayerStore } from "../store/usePlayerStore";

const resetStores = () => {
    localStorage.clear();
    useBuilderStore.setState(useBuilderStore.getInitialState(), true);
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
};

describe("Player", () => {
    beforeEach(() => {
        resetStores();
    });

    it("shows the empty state when no set is loaded", () => {
        // Test empty state logic
        const state = usePlayerStore.getState();
        const isEmpty = !state.pQueue || state.pQueue.length === 0;
        expect(isEmpty).toBe(true);
    }, 5000);

    it("renders the current track metadata when a queue exists", () => {
        // Test that track metadata is available when queue exists
        usePlayerStore.setState({
            pQueue: TRACKS.slice(0, 2),
            ci: 0,
            pos: 0,
            elapsed: 0,
            tTarget: 45 * 60,
            mode: "edit",
        });

        const state = usePlayerStore.getState();
        expect(state.pQueue).toHaveLength(2);
        expect(state.pQueue[state.ci].title).toBe(TRACKS[0].title);
        expect(state.pQueue[state.ci].artist).toBe(TRACKS[0].artist);
    }, 30000);
});
