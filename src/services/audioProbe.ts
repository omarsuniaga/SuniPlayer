/**
 * audioProbe — Utilities for detecting audio file availability.
 *
 * Uses HEAD requests so no audio data is downloaded — only HTTP status codes.
 * Returns false on any error (network failure, CORS, etc.) — safe default = simulation mode.
 */

const AUDIO_BASE = "/audio/";

/**
 * Probe a single audio file path.
 * @returns true if the file exists and is accessible (HTTP 2xx), false otherwise.
 */
export async function probeOne(filePath: string): Promise<boolean> {
    try {
        const res = await fetch(AUDIO_BASE + filePath, { method: "HEAD" });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Probe multiple audio file paths in parallel.
 * @returns Set of file_path strings that are available.
 */
export async function probeFiles(filePaths: string[]): Promise<Set<string>> {
    const results = await Promise.allSettled(filePaths.map(fp => probeOne(fp)));
    const available = new Set<string>();
    results.forEach((result, i) => {
        if (result.status === "fulfilled" && result.value) {
            available.add(filePaths[i]);
        }
    });
    return available;
}
