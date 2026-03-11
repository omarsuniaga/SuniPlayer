import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { probeOne, probeFiles } from "./audioProbe";

describe("audioProbe", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe("probeOne", () => {
        it("returns true when server responds 200 OK", async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                new Response(null, { status: 200 })
            );
            const result = await probeOne("Sinatra - My Way.mp3");
            expect(result).toBe(true);
        });

        it("returns false when server responds 404", async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                new Response(null, { status: 404 })
            );
            const result = await probeOne("missing.mp3");
            expect(result).toBe(false);
        });

        it("returns false on network error", async () => {
            vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));
            const result = await probeOne("any.mp3");
            expect(result).toBe(false);
        });

        it("calls fetch with HEAD method and correct URL", async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                new Response(null, { status: 200 })
            );
            await probeOne("Sinatra - My Way.mp3");
            expect(fetch).toHaveBeenCalledWith(
                "/audio/Sinatra - My Way.mp3",
                { method: "HEAD" }
            );
        });
    });

    describe("probeFiles", () => {
        it("returns Set of available file paths", async () => {
            vi.mocked(fetch)
                .mockResolvedValueOnce(new Response(null, { status: 200 }))  // file1 ok
                .mockResolvedValueOnce(new Response(null, { status: 404 }))  // file2 missing
                .mockResolvedValueOnce(new Response(null, { status: 200 })); // file3 ok

            const result = await probeFiles([
                "track1.mp3",
                "track2.mp3",
                "track3.mp3",
            ]);

            expect(result).toEqual(new Set(["track1.mp3", "track3.mp3"]));
        });

        it("returns empty Set when all files are missing", async () => {
            vi.mocked(fetch).mockResolvedValue(
                new Response(null, { status: 404 })
            );
            const result = await probeFiles(["a.mp3", "b.mp3"]);
            expect(result.size).toBe(0);
        });
    });
});
