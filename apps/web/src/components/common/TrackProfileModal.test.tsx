// src/components/common/TrackProfileModal.test.tsx
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import { TrackProfileModal } from "./TrackProfileModal";
import { TRACKS } from "../../data/constants";
import type { Track } from "../../types";

// Mock pitchEngine so tests don't touch Web Audio API
const mockEngine = {
    loadFromPath: vi.fn().mockResolvedValue(true),
    play: vi.fn(),
    stop: vi.fn(),
    pitchSemitones: 0,
    tempo: 1.0,
    onTimeUpdate: vi.fn(),
};

vi.mock("../../services/pitchEngine", () => ({
    getPitchEngine: vi.fn(() => mockEngine),
}));

// Mock usePlayerStore for auto-pause tests
const { mockSetPlaying, mockStore } = vi.hoisted(() => {
    const mockSetPlaying = vi.fn();
    const mockStore = { playing: false, setPlaying: mockSetPlaying };
    return { mockSetPlaying, mockStore };
});

vi.mock("../../store/usePlayerStore", () => ({
    usePlayerStore: Object.assign(
        vi.fn((selector: (s: typeof mockStore) => unknown) => selector(mockStore)),
        { getState: () => mockStore }
    ),
}));

// Mock useLibraryStore to avoid zustand/react version conflicts in test environment
vi.mock("../../store/useLibraryStore", () => ({
    useLibraryStore: vi.fn(() => ({
        availableTags: ["Jazz", "Pop", "Bolero"],
        addTag: vi.fn(),
    })),
}));

const sampleTrack = {
    ...TRACKS[0],
    key: "C Major",
    targetKey: "C Major",
    transposeSemitones: 0,
    playbackTempo: 1.0,
};

describe("TrackProfileModal", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let onSave: MockInstance<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let onCancel: MockInstance<any>;

    beforeEach(() => {
        onSave = vi.fn();
        onCancel = vi.fn();
        mockEngine.loadFromPath.mockClear();
        mockEngine.play.mockClear();
        mockEngine.stop.mockClear();
        mockEngine.onTimeUpdate.mockClear();
        mockSetPlaying.mockClear();
        mockStore.playing = false;
    });

    afterEach(() => {
        cleanup();
    });

    it("includes playbackTempo explicitly in save payload", () => {
        render(<TrackProfileModal track={sampleTrack} onSave={onSave as unknown as (updates: Partial<Track>) => void} onCancel={onCancel as unknown as () => void} />);
        fireEvent.click(screen.getByText("Guardar Perfil"));
        expect(onSave).toHaveBeenCalledOnce();
        const payload = onSave.mock.calls[0][0] as Partial<Track>;
        expect(payload).toHaveProperty("playbackTempo");
        expect(typeof payload.playbackTempo).toBe("number");
    });

    it("save payload includes updated playbackTempo after slider change", async () => {
        render(<TrackProfileModal track={sampleTrack} onSave={onSave as unknown as (updates: Partial<Track>) => void} onCancel={onCancel as unknown as () => void} />);
        // Change the tempo slider to 1.1
        const slider = screen.getByRole("slider", { name: /velocidad/i });
        fireEvent.change(slider, { target: { value: "1.1" } });
        fireEvent.click(screen.getByText("Guardar Perfil"));
        const payload = onSave.mock.calls[0][0] as Partial<Track>;
        expect(payload.playbackTempo).toBeCloseTo(1.1);
    });

    it("renders the Preview button in the Detalles tab", () => {
        render(<TrackProfileModal track={sampleTrack} onSave={onSave as unknown as (updates: Partial<Track>) => void} onCancel={onCancel as unknown as () => void} />);
        expect(screen.getByText(/Escuchar Preview/i)).toBeTruthy();
    });

    it("clicking Preview calls pitchEngine.loadFromPath and play", async () => {
        mockEngine.loadFromPath.mockClear();
        render(<TrackProfileModal track={sampleTrack} onSave={onSave as unknown as (updates: Partial<Track>) => void} onCancel={onCancel as unknown as () => void} />);
        fireEvent.click(screen.getByText(/Escuchar Preview/i));
        await waitFor(() => {
            expect(mockEngine.loadFromPath).toHaveBeenCalled();
            expect(mockEngine.play).toHaveBeenCalled();
        });
    });

    it("clicking Stop Preview calls pitchEngine.stop", async () => {
        mockEngine.stop.mockClear();
        render(<TrackProfileModal track={{ ...sampleTrack, playbackTempo: 1.1 }} onSave={onSave as unknown as (updates: Partial<Track>) => void} onCancel={onCancel as unknown as () => void} />);
        fireEvent.click(screen.getByText(/Escuchar Preview/i));
        const stopBtn = await screen.findByText(/Detener/i);
        fireEvent.click(stopBtn);
        expect(mockEngine.stop).toHaveBeenCalled();
    });

    it("closing modal calls pitchEngine.stop to clean up preview", async () => {
        mockEngine.stop.mockClear();
        render(<TrackProfileModal track={sampleTrack} onSave={onSave as unknown as (updates: Partial<Track>) => void} onCancel={onCancel as unknown as () => void} />);
        // Close via Cancelar button
        fireEvent.click(screen.getByText("Cancelar"));
        expect(mockEngine.stop).toHaveBeenCalled();
        expect(onCancel).toHaveBeenCalled();
    });

    it("pauses the main player on mount", () => {
        mockStore.playing = true;
        render(<TrackProfileModal track={sampleTrack} onSave={onSave as unknown as (updates: Partial<Track>) => void} onCancel={onCancel as unknown as () => void} />);
        expect(mockSetPlaying).toHaveBeenCalledWith(false);
    });

    it("resumes the main player on cancel when it was playing", () => {
        mockStore.playing = true;
        render(<TrackProfileModal track={sampleTrack} onSave={onSave as unknown as (updates: Partial<Track>) => void} onCancel={onCancel as unknown as () => void} />);
        mockSetPlaying.mockClear();
        fireEvent.click(screen.getByText("Cancelar"));
        expect(mockSetPlaying).toHaveBeenCalledWith(true);
    });

    it("does not resume the main player on save", () => {
        mockStore.playing = true;
        render(<TrackProfileModal track={sampleTrack} onSave={onSave as unknown as (updates: Partial<Track>) => void} onCancel={onCancel as unknown as () => void} />);
        mockSetPlaying.mockClear();
        fireEvent.click(screen.getByText("Guardar Perfil"));
        expect(mockSetPlaying).not.toHaveBeenCalledWith(true);
    });
});
