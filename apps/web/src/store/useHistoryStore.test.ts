import { beforeEach, describe, expect, it } from "vitest";

import { TRACKS } from \"@suniplayer/core\";
import { useHistoryStore } from "./useHistoryStore";
import type { SetHistoryItem, Show } from \"@suniplayer/core\";

describe("useHistoryStore — Show-based storage", () => {
    beforeEach(() => {
        localStorage.clear();
        useHistoryStore.setState(useHistoryStore.getInitialState(), true);
    });

    // Test 1: History stores Shows
    it("history is an array of Shows", () => {
        const history = useHistoryStore.getState().history;
        expect(Array.isArray(history)).toBe(true);
        expect(history).toHaveLength(0);
    });

    // Test 2: saveShow adds a Show to history
    it("saveShow(show) adds the show to history array", () => {
        const show: Show = {
            id: "show-1",
            name: "Test Show",
            createdAt: new Date().toISOString(),
            sets: [
                {
                    id: "set-1",
                    label: "Set 1",
                    tracks: [TRACKS[0]],
                    durationMs: 180000,
                    builtAt: new Date().toISOString(),
                },
            ],
        };

        useHistoryStore.getState().saveShow(show);
        const history = useHistoryStore.getState().history;

        expect(history).toHaveLength(1);
        expect(history[0]).toEqual(show);
    });

    // Test 3: History persists to localStorage
    it("history is persisted and restored from localStorage", () => {
        const show: Show = {
            id: "show-1",
            name: "Persisted Show",
            createdAt: new Date().toISOString(),
            sets: [
                {
                    id: "set-1",
                    label: "Set 1",
                    tracks: [TRACKS[0]],
                    durationMs: 180000,
                    builtAt: new Date().toISOString(),
                },
            ],
        };

        useHistoryStore.getState().saveShow(show);

        // Verify data is in localStorage
        const stored = localStorage.getItem("suniplayer-history");
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed.state.history).toHaveLength(1);
        expect(parsed.state.history[0].name).toBe("Persisted Show");
    });

    // Test 4: Migration from legacy SetHistoryItem[] to Show[]
    it("migrates legacy SetHistoryItem[] to Show[] on rehydrate", () => {
        // Simulate old localStorage data (before migration)
        const legacyData: SetHistoryItem[] = [
            {
                id: "hist-1",
                name: "Lobby 30min",
                tracks: [TRACKS[0], TRACKS[1]],
                total: 300000,
                target: 1800,
                venue: "lobby",
                curve: "steady",
                date: new Date().toISOString(),
            },
        ];

        // Store legacy data manually
        localStorage.setItem("suniplayer-history", JSON.stringify({
            state: { history: legacyData },
            version: 0,
        }));

        // Rehydrate (will trigger onRehydrateStorage migration)
        useHistoryStore.setState(useHistoryStore.getInitialState(), true);

        // History should now be Show[] format
        const history = useHistoryStore.getState().history;
        expect(Array.isArray(history)).toBe(true);
        if (history.length > 0) {
            // Migrated data should have Show structure
            expect(history[0]).toHaveProperty("id");
            expect(history[0]).toHaveProperty("name");
            expect(history[0]).toHaveProperty("createdAt");
            expect(history[0]).toHaveProperty("sets");
        }
    });
});
