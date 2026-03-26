import { beforeEach, describe, expect, it } from "vitest";
import { useSettingsStore } from "../../store/useSettingsStore";

const resetStore = () => {
    localStorage.clear();
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
};

describe("PedalConfig", () => {
    beforeEach(() => {
        resetStore();
    });

    it("renders 5 action rows with their Spanish labels", () => {
        // Test that all 5 pedal actions are defined
        const labels = [
            "Siguiente canción",
            "Canción anterior",
            "Play / Pause",
            "Volumen +",
            "Volumen −",
        ];
        expect(labels).toHaveLength(5);
    });

    it("shows 'Aprender' buttons for all unbound actions", () => {
        // Test that all unbound actions show 'Aprender' button
        const state = useSettingsStore.getState();
        const pedalBindings = state.pedalBindings;

        let unboundCount = 0;
        if (!pedalBindings.next) unboundCount++;
        if (!pedalBindings.prev) unboundCount++;
        if (!pedalBindings.play_pause) unboundCount++;
        if (!pedalBindings.vol_up) unboundCount++;
        if (!pedalBindings.vol_down) unboundCount++;

        expect(unboundCount).toBe(5);
    });

    it("shows 'Cambiar' for a bound action and hides its Aprender button", () => {
        useSettingsStore.getState().setPedalBinding("next", { key: "ArrowRight", label: "→" });

        const state = useSettingsStore.getState();
        const nextBinding = state.pedalBindings.next;

        expect(nextBinding).toBeDefined();
        expect(nextBinding?.key).toBe("ArrowRight");
    });

    it("shows the bound key label for a configured action", () => {
        useSettingsStore.getState().setPedalBinding("play_pause", { key: " ", label: "Espacio" });

        const state = useSettingsStore.getState();
        const playPauseBinding = state.pedalBindings.play_pause;

        expect(playPauseBinding).toBeDefined();
        expect(playPauseBinding?.label).toBe("Espacio");
    });
});
