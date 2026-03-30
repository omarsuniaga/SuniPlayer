import { beforeEach, describe, expect, it } from "vitest";

import { TRACKS } from \"@suniplayer/core\";
import { useBuilderStore } from "./useBuilderStore";
import { usePlayerStore } from "./usePlayerStore";
import { useHistoryStore } from "./useHistoryStore";
import { useLibraryStore } from "./useLibraryStore";
import { appendToQueue, saveSet, toPlayer, updateTrackMetadata } from "./useProjectStore";

const resetStores = () => {
    localStorage.clear();
    useBuilderStore.setState(useBuilderStore.getInitialState(), true);
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
    useHistoryStore.setState(useHistoryStore.getInitialState(), true);
    useLibraryStore.setState(useLibraryStore.getInitialState(), true);
};

describe("useProjectStore cross-domain actions", () => {
    beforeEach(() => {
        resetStores();
    });

    it("loads the generated set into the player queue", () => {
        useBuilderStore.setState({
            genSet: TRACKS.slice(0, 3),
            targetMin: 45,
        });
        usePlayerStore.setState({ playing: false });

        toPlayer();

        expect(useBuilderStore.getState().view).toBe("player");
        expect(usePlayerStore.getState().pQueue).toHaveLength(3);
        expect(usePlayerStore.getState().ci).toBe(0);
        expect(usePlayerStore.getState().pos).toBe(0);
        expect(usePlayerStore.getState().elapsed).toBe(0);
        expect(usePlayerStore.getState().tTarget).toBe(45 * 60);
    });

    it("stores generated sets in history with total duration in milliseconds", () => {
        const tracks = TRACKS.slice(0, 2);

        useBuilderStore.setState({
            genSet: tracks,
            targetMin: 30,
            venue: "lobby",
            curve: "steady",
        });

        saveSet();

        const historyItem = useHistoryStore.getState().history[0];
        expect(historyItem).toBeDefined();
        expect(historyItem.sets[0].tracks).toHaveLength(2);
        expect(historyItem.sets[0].durationMs).toBe(tracks[0].duration_ms + tracks[1].duration_ms);
    });

    it("appends tracks after the current song without interrupting playback", () => {
        usePlayerStore.setState({
            pQueue: TRACKS.slice(0, 2),
            ci: 0,
            playing: true,
            tTarget: 500,
        });

        appendToQueue(TRACKS.slice(2, 4));

        const state = usePlayerStore.getState();
        expect(state.pQueue.map((track: typeof TRACKS[0]) => track.id)).toEqual([TRACKS[0].id, TRACKS[2].id, TRACKS[3].id, TRACKS[1].id]);
        expect(state.playing).toBe(true);
        expect(state.ci).toBe(0);
        expect(state.tTarget).toBeGreaterThan(500);
    });

    it("persists target key metadata across queue, builder, and library overrides", () => {
        const track = { ...TRACKS[0], isCustom: true };

        useBuilderStore.setState({ genSet: [track] });
        usePlayerStore.setState({ pQueue: [track], tTarget: 200 });
        useLibraryStore.setState({ customTracks: [track] });

        updateTrackMetadata(track.id, {
            targetKey: "D Major",
            transposeSemitones: 1,
        });

        expect(usePlayerStore.getState().pQueue[0].targetKey).toBe("D Major");
        expect(useBuilderStore.getState().genSet[0].transposeSemitones).toBe(1);
        expect(useLibraryStore.getState().trackOverrides[track.id]?.targetKey).toBe("D Major");
    });
});
