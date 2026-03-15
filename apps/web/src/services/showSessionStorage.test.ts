import { describe, expect, it } from "vitest";

import { buildTargetKey, getTransposeSemitones } from "../features/library/lib/transpose";
import type { Track } from "../types";
import { applyShowSessionSnapshot, buildShowSessionSnapshot, hasRecoverableShowSession } from "./showSessionStorage";
import { useBuilderStore } from "../store/useBuilderStore";
import { useHistoryStore } from "../store/useHistoryStore";
import { useLibraryStore } from "../store/useLibraryStore";
import { usePlayerStore } from "../store/usePlayerStore";
import { useSettingsStore } from "../store/useSettingsStore";

const baseTrack: Track = {
    id: "custom-1",
    title: "Song",
    artist: "Artist",
    duration_ms: 180000,
    bpm: 120,
    key: "C# Major",
    energy: 0.6,
    mood: "happy",
    file_path: "Folder/Song.mp3",
    blob_url: "blob:temporary",
    analysis_cached: true,
    isCustom: true,
    targetKey: buildTargetKey("C# Major", 1) ?? undefined,
    transposeSemitones: getTransposeSemitones("C# Major", "D Major"),
};

const resetStores = () => {
    useBuilderStore.setState(useBuilderStore.getInitialState(), true);
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
    useHistoryStore.setState(useHistoryStore.getInitialState(), true);
    useLibraryStore.setState(useLibraryStore.getInitialState(), true);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
};

describe("showSessionStorage", () => {
    it("sanitizes custom blob URLs and marks reconnect warnings in snapshots", () => {
        resetStores();
        usePlayerStore.setState({ pQueue: [baseTrack] });
        useBuilderStore.setState({ genSet: [baseTrack] });
        useLibraryStore.setState({ customTracks: [baseTrack] });

        const snapshot = buildShowSessionSnapshot();

        expect(snapshot.player.pQueue[0].blob_url).toBeUndefined();
        expect(snapshot.player.pQueue[0].sourceMissing).toBe(true);
        expect(snapshot.warnings.requiresAudioReconnect).toBe(true);
        expect(hasRecoverableShowSession(snapshot)).toBe(true);
    });

    it("restores stores from a snapshot without auto-resuming playback", () => {
        resetStores();
        const snapshot = buildShowSessionSnapshot();
        snapshot.player.pQueue = [{ ...baseTrack, blob_url: undefined, sourceMissing: true }];
        snapshot.player.ci = 0;
        snapshot.player.pos = 54321;
        snapshot.player.mode = "live";
        snapshot.builder.view = "player";
        snapshot.builder.genSet = [{ ...baseTrack, blob_url: undefined, sourceMissing: true }];

        applyShowSessionSnapshot(snapshot);

        expect(usePlayerStore.getState().pQueue).toHaveLength(1);
        expect(usePlayerStore.getState().playing).toBe(false);
        expect(usePlayerStore.getState().mode).toBe("live");
        expect(usePlayerStore.getState().pos).toBe(54321);
        expect(useBuilderStore.getState().view).toBe("player");
    });
});
