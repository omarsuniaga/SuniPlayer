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

describe("useSettingsStore — curve panel visibility", () => {
    beforeEach(() => {
        resetStore();
    });

    it("curveVisible defaults to true", () => {
        const { curveVisible } = useSettingsStore.getState();
        expect(curveVisible).toBe(true);
    });

    it("setCurveVisible toggles visibility", () => {
        const { setCurveVisible } = useSettingsStore.getState();
        setCurveVisible(false);
        expect(useSettingsStore.getState().curveVisible).toBe(false);
        setCurveVisible(true);
        expect(useSettingsStore.getState().curveVisible).toBe(true);
    });

    it("curveExpanded defaults to true", () => {
        const { curveExpanded } = useSettingsStore.getState();
        expect(curveExpanded).toBe(true);
    });

    it("setCurveExpanded toggles expansion", () => {
        const { setCurveExpanded } = useSettingsStore.getState();
        setCurveExpanded(false);
        expect(useSettingsStore.getState().curveExpanded).toBe(false);
    });

    it("curveVisible and curveExpanded are persisted in localStorage", () => {
        const { setCurveVisible, setCurveExpanded } = useSettingsStore.getState();
        setCurveVisible(false);
        setCurveExpanded(false);
        const stored = localStorage.getItem("suniplayer-settings");
        const parsed = JSON.parse(stored ?? "{}");
        expect(parsed.state.curveVisible).toBe(false);
        expect(parsed.state.curveExpanded).toBe(false);
    });
});
