import { beforeEach, describe, expect, it } from "vitest";

import { doGen, toPlayer } from "../store/useProjectStore";
import { useBuilderStore } from "../store/useBuilderStore";
import { usePlayerStore } from "../store/usePlayerStore";
import { useSettingsStore } from "../store/useSettingsStore";

const resetStores = () => {
    localStorage.clear();
    useBuilderStore.setState(useBuilderStore.getInitialState(), true);
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
};

describe("Builder flow", () => {
    beforeEach(() => {
        resetStores();
    });

    it("generates a set from the active builder configuration", () => {
        useBuilderStore.setState({
            targetMin: 45,
            venue: "lobby",
            curve: "steady",
        });
        useSettingsStore.setState({
            bpmMin: 55,
            bpmMax: 140,
        });

        doGen();

        const state = useBuilderStore.getState();
        expect(state.genSet.length).toBeGreaterThan(0);
        expect(state.genSet.every((track) => track.duration_ms > 0)).toBe(true);
    });

    it("moves the generated builder set into the player queue", () => {
        doGen();
        toPlayer();

        const builder = useBuilderStore.getState();
        const player = usePlayerStore.getState();

        expect(builder.view).toBe("player");
        expect(player.pQueue.length).toBeGreaterThan(0);
        expect(player.ci).toBe(0);
        expect(player.pos).toBe(0);
        expect(player.playing).toBe(false);
    });
});
