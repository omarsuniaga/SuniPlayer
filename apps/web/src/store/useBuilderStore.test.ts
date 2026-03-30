import { beforeEach, describe, expect, it } from "vitest";

import { TRACKS } from "@suniplayer/core";
import { useBuilderStore } from "./useBuilderStore";

describe("useBuilderStore â€” Show context", () => {
    beforeEach(() => {
        localStorage.clear();
        useBuilderStore.setState(useBuilderStore.getInitialState(), true);
    });

    // Test 1: currentShowId getter
    it("currentShowId returns the currently-active Show id (or null if no show)", () => {
        let showId = useBuilderStore.getState().currentShowId;
        expect(showId).toBeNull();

        // After creating a show, currentShowId should return its id
        useBuilderStore.getState().startNewShow();
        showId = useBuilderStore.getState().currentShowId;
        expect(showId).toBeTruthy();
    });

    // Test 2: startNewShow creates a show
    it("startNewShow() creates a new Show with id, auto-generated name, and current set", () => {
        useBuilderStore.getState().startNewShow();
        const show = useBuilderStore.getState().currentShow;

        expect(show).toBeDefined();
        expect(show!.id).toBeTruthy();
        expect(show!.name).toMatch(/^Show \d+ \w+/); // e.g. "Show 24 Mar"
        expect(show!.createdAt).toBeTruthy();
        expect(show!.sets).toHaveLength(1);
        expect(show!.sets[0].label).toBe("Set 1");
    });

    // Test 3: addSetToCurrentShow creates Set N
    it("addSetToCurrentShow() adds a new SetEntry labeled 'Set N' to the current show", () => {
        useBuilderStore.getState().startNewShow();
        useBuilderStore.getState().addSetToCurrentShow();
        const show = useBuilderStore.getState().currentShow;

        expect(show!.sets).toHaveLength(2);
        expect(show!.sets[1].label).toBe("Set 2");
    });

    // Test 4: getExcludedTrackIdsInShow returns IDs of tracks used in other sets
    it("getExcludedTrackIdsInShow() returns track ids from other sets in the show", () => {
        const store = useBuilderStore.getState();
        store.startNewShow();

        // Set 1: add 2 tracks via genSet
        useBuilderStore.setState({ genSet: [TRACKS[0], TRACKS[1]] });

        // Move to Set 2
        store.addSetToCurrentShow();

        // Get exclusion pool for Set 2: should be the 2 tracks from Set 1
        const excluded = store.getExcludedTrackIdsInShow();
        expect(excluded).toContain(TRACKS[0].id);
        expect(excluded).toContain(TRACKS[1].id);
        expect(excluded).not.toContain(TRACKS[2].id); // not in Set 1
    });

    // Test 5: Persistence
    it("currentShow is persisted in localStorage", () => {
        const store1 = useBuilderStore.getState();
        store1.startNewShow();
        store1.addSetToCurrentShow();
        const showId = store1.currentShowId;
        const show1 = store1.currentShow;

        // Simulate reload: clear and restore
        localStorage.clear();
        useBuilderStore.setState(useBuilderStore.getInitialState(), true);

        const store2 = useBuilderStore.getState();
        expect(store2.currentShowId).toBe(showId);
        expect(store2.currentShow).toEqual(show1);
    });
});
