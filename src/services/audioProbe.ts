import { analyzeAudio, AnalysisResults } from "./analysisService.ts";
import { audioCache } from "./db.ts";

/**
 * Probes and analyzes an audio file, using IndexedDB cache if available.
 * @param url The full URL to the audio file (e.g. /audio/Song.mp3)
 */
export async function probeOne(url: string): Promise<AnalysisResults | null> {
    // 1. Check Cache
    try {
        const cached = await audioCache.getAnalysis(url);
        if (cached) {
            // Convert AnalysisData back to AnalysisResults format
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
 * Simple HEAD check for file existence
 */
export async function checkFileExists(url: string): Promise<boolean> {
    try {
        const res = await fetch(url, { method: "HEAD" });
        return res.ok;
    } catch {
        return false;
    }
}
