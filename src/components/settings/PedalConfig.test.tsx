import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { PedalConfig } from "./PedalConfig";

const resetStore = () => {
    localStorage.clear();
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
};

describe("PedalConfig", () => {
    beforeEach(() => {
        resetStore();
        cleanup();
    });

    it("renders 5 action rows with their Spanish labels", () => {
        render(<PedalConfig />);

        expect(screen.getByText("Siguiente canción")).toBeTruthy();
        expect(screen.getByText("Canción anterior")).toBeTruthy();
        expect(screen.getByText("Play / Pause")).toBeTruthy();
        expect(screen.getByText("Volumen +")).toBeTruthy();
        expect(screen.getByText("Volumen −")).toBeTruthy();
    });

    it("shows 'Aprender' buttons for all unbound actions", () => {
        render(<PedalConfig />);

        const buttons = screen.getAllByText("Aprender");
        expect(buttons.length).toBe(5);
    });

    it("shows 'Cambiar' for a bound action and hides its Aprender button", () => {
        useSettingsStore.getState().setPedalBinding("next", { key: "ArrowRight", label: "→" });

        render(<PedalConfig />);

        expect(screen.getByText("Cambiar")).toBeTruthy();
        expect(screen.queryAllByText("Aprender").length).toBeGreaterThan(0); // other 4 still show Aprender
        expect(screen.getAllByText("Aprender").length).toBe(4);
    });

    it("shows the bound key label for a configured action", () => {
        useSettingsStore.getState().setPedalBinding("play_pause", { key: " ", label: "Espacio" });

        render(<PedalConfig />);

        expect(screen.getByText("Espacio")).toBeTruthy();
    });
});
