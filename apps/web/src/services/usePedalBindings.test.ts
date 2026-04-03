import { beforeEach, describe, expect, it, vi } from "vitest";
import { handlePedalEvent } from "./usePedalBindings";
import { useSettingsStore, usePlayerStore } from "@suniplayer/core";
import type { Track } from "@suniplayer/core";

const makeTrack = (id: string): Track => ({
    id,
    title: id,
    artist: "Test Artist",
    duration_ms: 180000,
    bpm: 120,
    key: "C",
    energy: 0.5,
    mood: "happy",
    file_path: `${id}.mp3`,
    analysis_cached: true,
});

const resetStores = () => {
    localStorage.clear();
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
};

const fireKey = (key: string, target?: EventTarget) => {
    const event = new KeyboardEvent("keydown", { key, bubbles: true });
    if (target) {
        Object.defineProperty(event, "target", { value: target, writable: false });
    }
    return event;
};

describe("usePedalBindings", () => {
    beforeEach(() => {
        resetStores();
    });

    it("'next' binding advances ci by 1", () => {
        useSettingsStore.getState().setPedalBinding("next", { key: "ArrowRight", label: "→" });
        usePlayerStore.setState({ pQueue: [makeTrack("t1"), makeTrack("t2")], ci: 0 });

        const event = fireKey("ArrowRight");
        handlePedalEvent(event, vi.fn(), vi.fn());

        expect(usePlayerStore.getState().ci).toBe(1);
    });

    it("'next' at last track does not advance (no wrap)", () => {
        useSettingsStore.getState().setPedalBinding("next", { key: "ArrowRight", label: "→" });
        usePlayerStore.setState({ pQueue: [makeTrack("t1")], ci: 0 });

        const event = fireKey("ArrowRight");
        handlePedalEvent(event, vi.fn(), vi.fn());

        expect(usePlayerStore.getState().ci).toBe(0);
    });

    it("'prev' at ci=0 stays at 0 (no-op)", () => {
        useSettingsStore.getState().setPedalBinding("prev", { key: "ArrowLeft", label: "←" });
        usePlayerStore.setState({ pQueue: [makeTrack("t1"), makeTrack("t2")], ci: 0 });

        const event = fireKey("ArrowLeft");
        handlePedalEvent(event, vi.fn(), vi.fn());

        expect(usePlayerStore.getState().ci).toBe(0);
    });

    it("'play_pause' toggles playing state", () => {
        useSettingsStore.getState().setPedalBinding("play_pause", { key: " ", label: "Espacio" });
        usePlayerStore.setState({ playing: false });

        let event = fireKey(" ");
        handlePedalEvent(event, vi.fn(), vi.fn());
        expect(usePlayerStore.getState().playing).toBe(true);

        event = fireKey(" ");
        handlePedalEvent(event, vi.fn(), vi.fn());
        expect(usePlayerStore.getState().playing).toBe(false);
    });

    it("ignores keypresses when target is an INPUT element", () => {
        useSettingsStore.getState().setPedalBinding("next", { key: "ArrowRight", label: "→" });
        usePlayerStore.setState({ pQueue: [makeTrack("t1"), makeTrack("t2")], ci: 0 });

        const input = document.createElement("input");
        const event = fireKey("ArrowRight", input);
        handlePedalEvent(event, vi.fn(), vi.fn());

        expect(usePlayerStore.getState().ci).toBe(0); // unchanged
    });

    it("learn mode: Escape cancels without saving", () => {
        useSettingsStore.getState().setLearningAction("next");

        const event = fireKey("Escape");
        handlePedalEvent(event, vi.fn(), vi.fn());

        expect(useSettingsStore.getState().learningAction).toBeNull();
        expect(useSettingsStore.getState().pedalBindings.next).toBeUndefined();
    });

    it("learn mode: non-Escape key saves binding and clears learningAction", () => {
        useSettingsStore.getState().setLearningAction("vol_up");

        const event = fireKey("PageUp");
        handlePedalEvent(event, vi.fn(), vi.fn());

        expect(useSettingsStore.getState().learningAction).toBeNull();
        expect(useSettingsStore.getState().pedalBindings.vol_up).toEqual({
            key: "PageUp",
            label: "Pág↑",
        });
    });

    it("conflict: saving a key already assigned to another action still saves, allowing PedalConfig to detect the duplicate", () => {
        // Pre-assign 'next' to ArrowRight
        useSettingsStore.getState().setPedalBinding("next", { key: "ArrowRight", label: "→" });
        // Now learn 'prev' and press ArrowRight (same key)
        useSettingsStore.getState().setLearningAction("prev");

        const event = fireKey("ArrowRight");
        handlePedalEvent(event, vi.fn(), vi.fn());

        // The binding should still be saved — conflict resolution is the UI's job
        expect(useSettingsStore.getState().pedalBindings.prev).toEqual({
            key: "ArrowRight",
            label: "→",
        });
        // And the store should now have two actions sharing the same key
        // PedalConfig's useEffect will detect this and show the conflict UI
        expect(useSettingsStore.getState().pedalBindings.next?.key).toBe("ArrowRight");
    });
});
