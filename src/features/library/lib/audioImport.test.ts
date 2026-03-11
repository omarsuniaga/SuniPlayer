import { describe, expect, it } from "vitest";

import { getRelativeAudioPath, isSupportedAudioFile, parseTrackName } from "./audioImport";

describe("audioImport helpers", () => {
    it("recognizes supported audio files by mime type or extension", () => {
        expect(isSupportedAudioFile({ name: "set-track.mp3" })).toBe(true);
        expect(isSupportedAudioFile({ name: "ambient-file", type: "audio/wav" })).toBe(true);
        expect(isSupportedAudioFile({ name: "notes.txt", type: "text/plain" })).toBe(false);
    });

    it("parses artist and title from recommended file names", () => {
        expect(parseTrackName("Miles Davis - So What.mp3")).toEqual({
            artist: "Miles Davis",
            title: "So What",
        });

        expect(parseTrackName("UntitledLoop.wav")).toEqual({
            artist: "Unknown Artist",
            title: "UntitledLoop",
        });
    });

    it("prefers relative folder paths when available", () => {
        expect(getRelativeAudioPath({ name: "track.mp3", webkitRelativePath: "Jazz/track.mp3" })).toBe("Jazz/track.mp3");
        expect(getRelativeAudioPath({ name: "track.mp3" }, "SetA/track.mp3")).toBe("SetA/track.mp3");
    });
});
