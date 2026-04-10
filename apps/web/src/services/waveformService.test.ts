import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
    audioCache: {
        getWaveform: vi.fn().mockResolvedValue(null),
        saveWaveform: vi.fn().mockResolvedValue(undefined),
    },
}));

import { getWaveformData } from "./waveformService";

class MockAudioContext {
    state = "suspended" as const;

    async resume() {
        return undefined;
    }

    async close() {
        return undefined;
    }

    async decodeAudioData() {
        return {
            getChannelData: () => new Float32Array([0, 0.25, -0.5, 1]),
        };
    }
}

describe("waveformService", () => {
    it("analyzes audio without resuming the AudioContext", async () => {
        const resumeSpy = vi.spyOn(MockAudioContext.prototype, "resume");
        const decodeSpy = vi.spyOn(MockAudioContext.prototype, "decodeAudioData");

        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            arrayBuffer: async () => new ArrayBuffer(8),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.stubGlobal("AudioContext", MockAudioContext as any);

        const waveform = await getWaveformData("/audio/test.mp3", "track-1", 4);

        expect(resumeSpy).not.toHaveBeenCalled();
        expect(decodeSpy).toHaveBeenCalled();
        expect(waveform).toHaveLength(4);
    });
});
