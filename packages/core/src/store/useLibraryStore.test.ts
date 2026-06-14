import { beforeEach, describe, expect, it } from "vitest";

import type { AnalysisData } from "../platform/interfaces/IStorage";
import { configureStorage } from "./storage";
import { useLibraryStore } from "./useLibraryStore";

const memoryState = new Map<string, string>();

const fakeStorage = {
    getItem: async (name: string) => memoryState.get(name) ?? null,
    setItem: async (name: string, value: string) => {
        memoryState.set(name, value);
    },
    removeItem: async (name: string) => {
        memoryState.delete(name);
    },
    getAnalysis: async (_id: string): Promise<AnalysisData | null> => ({
        id: "custom-1",
        bpm: 123,
        key: "C#m",
        energy: 0.72,
        gainOffset: 0,
        timestamp: Date.now(),
    }),
    saveAnalysis: async () => {},
    getWaveform: async () => null,
    saveWaveform: async () => {},
    saveAudioFile: async () => {},
    getAudioFile: async () => new Blob(["audio"]),
    deleteAudioFile: async () => {},
    getAllStoredTrackIds: async () => ["custom-1"],
};

describe("useLibraryStore hydration", () => {
    beforeEach(() => {
        memoryState.clear();
        configureStorage(fakeStorage);
        useLibraryStore.setState(useLibraryStore.getInitialState(), true);
    });

    it("preserves original metadata when rehydrating local tracks", async () => {
        useLibraryStore.setState({
            customTracks: [
                {
                    id: "custom-1",
                    title: "Mi Audio Original",
                    artist: "Artista Original",
                    duration_ms: 185000,
                    file_path: "Folder/Mi Audio Original.mp3",
                    isCustom: true,
                    metadata: { sourceType: "local" },
                },
            ],
        });

        await useLibraryStore.getState().hydrateFromStorage();

        const track = useLibraryStore.getState().customTracks[0];
        expect(track.title).toBe("Mi Audio Original");
        expect(track.artist).toBe("Artista Original");
        expect(track.duration_ms).toBe(185000);
        expect(track.file_path).toBe("Folder/Mi Audio Original.mp3");
        expect(track.blob_url).toContain("blob:");
        expect(track.analysis_cached).toBe(true);
    });
});
