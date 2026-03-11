import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { TRACKS } from "../data/constants";
import { Player } from "./Player";
import { useBuilderStore } from "../store/useBuilderStore";
import { usePlayerStore } from "../store/usePlayerStore";

const resetStores = () => {
    localStorage.clear();
    useBuilderStore.setState(useBuilderStore.getInitialState(), true);
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
};

describe("Player", () => {
    beforeEach(() => {
        resetStores();
    });

    afterEach(() => {
        cleanup();
    });

    it("shows the empty state when no set is loaded", () => {
        render(<Player />);

        expect(screen.getByText("restante")).toBeTruthy();
        expect(screen.getByRole("button", { name: "CROSS" })).toBeTruthy();
        expect(screen.getByTitle("Ocultar cola")).toBeTruthy();
    }, 15000);

    it("renders the current track metadata when a queue exists", () => {
        usePlayerStore.setState({
            pQueue: TRACKS.slice(0, 2),
            ci: 0,
            pos: 0,
            elapsed: 0,
            tTarget: 45 * 60,
            mode: "edit",
        });

        render(<Player />);

        expect(screen.getAllByText("Fly Me To The Moon").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Sinatra").length).toBeGreaterThan(0);
        expect(screen.getByTitle("Ocultar cola")).toBeTruthy();
    });
});
