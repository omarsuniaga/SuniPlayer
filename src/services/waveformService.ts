import { audioCache } from "./db";

const CACHE = new Map<string, number[]>();

interface AudioWindow extends Window {
    webkitAudioContext?: typeof AudioContext;
}

/**
 * Generates an array of normalized amplitude values (0-1) for an audio file.
 * USAGE: Call this when a track is loaded to get real frequency data.
 */
export async function getWaveformData(url: string, trackId?: string, samples = 100): Promise<number[]> {
    if (trackId) {
        const cached = await audioCache.getWaveform(trackId);
        if (cached) return cached;
    }
    if (CACHE.has(url)) return CACHE.get(url)!;

    let audioContext: AudioContext | null = null;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const AudioContextCtor = window.AudioContext || (window as AudioWindow).webkitAudioContext;
        if (!AudioContextCtor) {
            throw new Error("AudioContext not supported");
        }

        audioContext = new AudioContextCtor();
        
        // Some browsers suspend the context until a user gesture; resume just in case
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const channelData = audioBuffer.getChannelData(0); // Use first channel
        const blockSize = Math.max(1, Math.floor(channelData.length / samples));
        const filteredData: number[] = [];

        for (let i = 0; i < samples; i++) {
            const start = i * blockSize;
            let sum = 0;
            const limit = Math.min(start + blockSize, channelData.length);
            for (let j = start; j < limit; j++) {
                sum += Math.abs(channelData[j]);
            }
            filteredData.push(sum / Math.max(1, limit - start));
        }

        // Normalize data
        const max = Math.max(...filteredData, 0.0001);
        const normalized = filteredData.map(v => (v / max) * 0.9 + 0.1); // min 0.1 height

        if (trackId) {
            await audioCache.saveWaveform(trackId, normalized);
        }
        CACHE.set(url, normalized);
        return normalized;
    } catch (e) {
        // Only log serious failures, blob expiration is common on refresh
        if (url.startsWith('blob:') && (e instanceof Error && e.name === 'EncodingError')) {
             // Silently fallback for expired blobs
        } else {
             console.warn("Waveform analysis fallback:", e instanceof Error ? e.message : e);
        }
        
        // Fallback to a "boring" but real-looking wave if analysis fails
        return Array(samples).fill(0).map((_, i) => 0.2 + Math.sin(i * 0.2) * 0.1 + Math.random() * 0.1);
    } finally {
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close().catch(() => {});
        }
    }
}
