import { beforeEach, describe, expect, it } from "vitest";
import { useSettingsStore } from "./useSettingsStore";

const resetStore = () => {
    localStorage.clear();
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
};

describe("useSettingsStore — pedal bindings", () => {
    beforeEach(() => {
        resetStore();
    });

    it("starts with empty bindings", () => {
        const { pedalBindings } = useSettingsStore.getState();
        expect(pedalBindings).toEqual({});
    });

    it("setPedalBinding saves a binding for an action", () => {
        const { setPedalBinding } = useSettingsStore.getState();
        setPedalBinding("next", { key: "ArrowRight", label: "→" });

        const { pedalBindings } = useSettingsStore.getState();
        expect(pedalBindings.next).toEqual({ key: "ArrowRight", label: "→" });
    });

    it("clearPedalBindings resets all bindings to {}", () => {
        const { setPedalBinding, clearPedalBindings } = useSettingsStore.getState();
        setPedalBinding("next", { key: "ArrowRight", label: "→" });
        setPedalBinding("prev", { key: "ArrowLeft", label: "←" });
        clearPedalBindings();

        expect(useSettingsStore.getState().pedalBindings).toEqual({});
    });

    it("pedalBindings are persisted in localStorage under suniplayer-settings", () => {
        const { setPedalBinding } = useSettingsStore.getState();
        setPedalBinding("play_pause", { key: " ", label: "Espacio" });

        const stored = localStorage.getItem("suniplayer-settings");
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored ?? "{}");
        expect(parsed.state.pedalBindings?.play_pause).toEqual({ key: " ", label: "Espacio" });
    });

    it("learningAction is NOT persisted (ephemeral UI state)", () => {
        const { setLearningAction } = useSettingsStore.getState();
        setLearningAction("vol_up");

        const stored = localStorage.getItem("suniplayer-settings");
        const parsed = JSON.parse(stored ?? "{}");
        expect(parsed.state.learningAction).toBeUndefined();
    });
});
