// src/components/common/TrackTrimmer.test.tsx
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TrackTrimmer } from "./TrackTrimmer";
import { TRACKS } from "../../data/constants";

// Mock Web Audio (waveformService loads audio)
vi.mock("../../services/waveformService", () => ({
    getWaveformData: vi.fn().mockResolvedValue([]),
}));

// Mock HTMLAudioElement
class MockAudio {
    volume = 1.0;
    playbackRate = 1.0;
    currentTime = 0;
    paused = true;
    play = vi.fn().mockResolvedValue(undefined);
    pause = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
}
vi.stubGlobal("Audio", MockAudio);

// Mock usePlayerStore
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

const sampleTrack = { ...TRACKS[0] };

describe("TrackTrimmer", () => {
    let onSave: ReturnType<typeof vi.fn>;
    let onCancel: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        onSave = vi.fn();
        onCancel = vi.fn();
        mockSetPlaying.mockClear();
        mockStore.playing = false;
    });

    afterEach(() => {
        cleanup();
    });

    it("pauses the main player on mount", () => {
        mockStore.playing = true;
        render(<TrackTrimmer track={sampleTrack} onSave={onSave as any} onCancel={onCancel as any} />);
        expect(mockSetPlaying).toHaveBeenCalledWith(false);
    });

    it("resumes the main player on cancel when it was playing", () => {
        mockStore.playing = true;
        render(<TrackTrimmer track={sampleTrack} onSave={onSave as any} onCancel={onCancel as any} />);
        mockSetPlaying.mockClear();
        fireEvent.click(screen.getByText("Descartar"));
        expect(mockSetPlaying).toHaveBeenCalledWith(true);
    });

    it("does not resume the main player on save", () => {
        mockStore.playing = true;
        render(<TrackTrimmer track={sampleTrack} onSave={onSave as any} onCancel={onCancel as any} />);
        mockSetPlaying.mockClear();
        fireEvent.click(screen.getByText("Aplicar Cambios"));
        expect(mockSetPlaying).not.toHaveBeenCalledWith(true);
    });

    it("double-cancel: Trimmer cancel does not resume when ProfileModal is also open", () => {
        // Simulate: player was playing, ProfileModal paused it, then Trimmer opened inside it
        // At Trimmer mount, player is already paused → wasPlayingRef = false
        mockStore.playing = false; // player already paused by ProfileModal
        render(<TrackTrimmer track={sampleTrack} onSave={onSave as any} onCancel={onCancel as any} />);
        mockSetPlaying.mockClear();
        fireEvent.click(screen.getByText("Descartar"));
        // Trimmer should NOT resume because it saw playing=false at mount
        expect(mockSetPlaying).not.toHaveBeenCalledWith(true);
    });
});
