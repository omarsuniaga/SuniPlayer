import { analyzeAudio, AnalysisResults } from "./analysisService.ts";
import { audioCache } from "./db.ts";

const AUDIO_PREFIX = "/audio/";

/**
 * Simple HEAD check for file existence.
 * Accepts a bare file_path (e.g. "Song.mp3") or full URL.
 * Returns true if the server responds 200 OK.
 */
export async function probeOne(filePath: string): Promise<boolean> {
    const url = filePath.startsWith("/") ? filePath : `${AUDIO_PREFIX}${encodeURIComponent(filePath)}`;
    try {
        const res = await fetch(url, { method: "HEAD" });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Full audio analysis: probes, decodes, and caches BPM/key/energy/waveform.
 * @param url The full URL to the audio file (e.g. /audio/Song.mp3)
 */
export async function analyzeTrack(url: string): Promise<AnalysisResults | null> {
    // 1. Check Cache
    try {
        const cached = await audioCache.getAnalysis(url);
        if (cached) {
            return {
                bpm: cached.bpm,
                key: cached.key,
                energy: cached.energy,
                gainOffset: cached.gainOffset,
                waveform: await audioCache.getWaveform(url) || []
            };
        }
    } catch (e) {
        console.error("Cache read failed", e);
    }

    // 2. Fetch & Analyze
    try {
        const response = await fetch(url);
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        const analysis = await analyzeAudio(audioBuffer);
        await audioCtx.close();

        // 3. Save to Cache
        await audioCache.saveAnalysis(url, {
            id: url,
            bpm: analysis.bpm,
            key: analysis.key,
            energy: analysis.energy,
            gainOffset: analysis.gainOffset
        });
        await audioCache.saveWaveform(url, analysis.waveform);

        return analysis;
    } catch (e) {
        console.error("Probe/Analysis failed for", url, e);
        return null;
    }
}

/**
 * Simple HEAD check for file existence (alias kept for backward compatibility)
 */
export async function checkFileExists(url: string): Promise<boolean> {
    try {
        const res = await fetch(url, { method: "HEAD" });
        return res.ok;
    } catch {
        return false;
    }
}
