import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { probeOne } from "./audioProbe";

// Mock platform singletons so IDBStorage is never opened in the test environment.
// BlobFileAccess.checkExists() delegates to fetch, which we stub globally below.
// vi.mock is hoisted, so the factory must be self-contained (no outer variable refs).
vi.mock("../platform/index", () => ({
    fileAccess: {
        checkExists: vi.fn(),
        resolveURL: vi.fn((p: string) => `/audio/${encodeURIComponent(p)}`),
        importFile: vi.fn(),
        releaseURL: vi.fn(),
    },
    storage: {
        getAnalysis: vi.fn().mockResolvedValue(null),
        saveAnalysis: vi.fn().mockResolvedValue(undefined),
        getWaveform: vi.fn().mockResolvedValue(null),
        saveWaveform: vi.fn().mockResolvedValue(undefined),
    },
}));

// Import the mocked module after vi.mock so we can configure checkExists per-test.
import { fileAccess as mockFileAccessModule } from "../platform/index";
const mockFileAccess = mockFileAccessModule as unknown as {
    checkExists: ReturnType<typeof vi.fn>;
};

describe("audioProbe", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
        // Wire mockFileAccess.checkExists through to the stubbed fetch
        mockFileAccess.checkExists.mockImplementation(async (filePath: string) => {
            const url = filePath.startsWith("/") ? filePath : `/audio/${encodeURIComponent(filePath)}`;
            try {
                const res = await fetch(url, { method: "HEAD" });
                return res.ok;
            } catch {
                return false;
            }
        });
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
                "/audio/Sinatra%20-%20My%20Way.mp3",
                { method: "HEAD" }
            );
        });
    });
});
