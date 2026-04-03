import { beforeEach, describe, expect, it } from "vitest";

import { TRACKS } from "@suniplayer/core";
import { usePlayerStore } from "./usePlayerStore";

const resetStore = () => {
    localStorage.clear();
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
};

describe("usePlayerStore persistence", () => {
    beforeEach(() => {
        resetStore();
    });

    it("persists queue context needed for lightweight session recovery", () => {
        usePlayerStore.setState({
            pQueue: TRACKS.slice(0, 2),
            ci: 1,
            pos: 12345,
            vol: 0.65,
            tTarget: 2700,
            mode: "live",
            playing: true,
            elapsed: 42,
            isSimulating: true,
        });

        const stored = localStorage.getItem("suniplayer-player");
        expect(stored).toBeTruthy();

        const parsed = JSON.parse(stored ?? "{}");
        expect(parsed.state.pQueue).toHaveLength(2);
        expect(parsed.state.ci).toBe(1);
        expect(parsed.state.pos).toBe(12345);
        expect(parsed.state.vol).toBe(0.65);
        expect(parsed.state.tTarget).toBe(2700);
        expect(parsed.state.mode).toBe("live");
        expect(parsed.state.playing).toBeUndefined();
        expect(parsed.state.elapsed).toBeUndefined();
        expect(parsed.state.isSimulating).toBeUndefined();
    });
});
