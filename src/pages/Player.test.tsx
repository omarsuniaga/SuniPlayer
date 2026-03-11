import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("../services/waveformService", () => ({
    getWaveformData: vi.fn().mockResolvedValue(Array.from({ length: 32 }, () => 0.4)),
}));

vi.mock("../components/player/Dashboard", () => ({
    Dashboard: () => <div>Dashboard</div>,
}));

vi.mock("../components/common/Wave.tsx", () => ({
    Wave: () => <div>Wave</div>,
}));

vi.mock("../components/common/TrackTrimmer", () => ({
    TrackTrimmer: () => <div>TrackTrimmer</div>,
}));

vi.mock("../components/common/TrackProfileModal", () => ({
    TrackProfileModal: () => <div>TrackProfileModal</div>,
}));

vi.mock("../components/common/SheetMusicViewer", () => ({
    SheetMusicViewer: () => <div>SheetMusicViewer</div>,
}));

vi.mock("../components/player/LiveUnlockModal", () => ({
    LiveUnlockModal: () => <div>LiveUnlockModal</div>,
}));

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
        const { container } = render(<Player />);

        expect(container).toBeTruthy();
        expect(screen.getByText("restante")).toBeTruthy();
        expect(screen.getByText("CROSS")).toBeTruthy();
    }, 5000);

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
        expect(screen.getAllByRole("button").length).toBeGreaterThan(3);
    }, 30000);
});
