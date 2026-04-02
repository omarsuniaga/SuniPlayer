import { describe, expect, it, vi } from "vitest";
import {
    registerAudioTransportController,
    resolveNextTrackIndex,
    skipToNextGracefully,
} from "./audioTransport";

describe("audioTransport", () => {
    it("uses stackOrder priority when the queued track exists", () => {
        const nextIndex = resolveNextTrackIndex({
            ci: 0,
            pQueue: [
                { id: "a", title: "A" } as any,
                { id: "b", title: "B" } as any,
                { id: "c", title: "C" } as any,
            ],
            stackOrder: ["c"],
        });

        expect(nextIndex).toBe(2);
    });

    it("falls back to queue order when stackOrder is empty or missing", () => {
        expect(resolveNextTrackIndex({
            ci: 0,
            pQueue: [
                { id: "a", title: "A" } as any,
                { id: "b", title: "B" } as any,
            ],
            stackOrder: [],
        })).toBe(1);

        expect(resolveNextTrackIndex({
            ci: 0,
            pQueue: [
                { id: "a", title: "A" } as any,
                { id: "b", title: "B" } as any,
            ],
            stackOrder: ["missing"],
        })).toBe(1);
    });

    it("returns null when there is no next track", () => {
        const nextIndex = resolveNextTrackIndex({
            ci: 1,
            pQueue: [
                { id: "a", title: "A" } as any,
                { id: "b", title: "B" } as any,
            ],
            stackOrder: [],
        });

        expect(nextIndex).toBeNull();
    });

    it("delegates graceful next requests to the registered controller", () => {
        const skipSpy = vi.fn();

        registerAudioTransportController({ skipToNextGracefully: skipSpy });
        skipToNextGracefully();

        expect(skipSpy).toHaveBeenCalledTimes(1);

        registerAudioTransportController(null);
        skipToNextGracefully();

        expect(skipSpy).toHaveBeenCalledTimes(1);
    });
});
