/**
 * analysis.worker.ts
 * 
 * Web Worker for heavy audio analysis (BPM, Key, Waveform).
 * Runs on a separate thread to keep the UI smooth during file imports.
 */

export interface AnalysisWorkerResults {
    bpm: number;
    key: string;
    energy: number;
    waveform: number[];
    gainOffset: number;
}

// ── Analysis Logic (Migrated from analysisService.ts) ────────────────────────

function calculateRawRMS(data: Float32Array): number {
    let sumSq = 0;
    const step = 8;
    for (let i = 0; i < data.length; i += step) {
        sumSq += data[i] * data[i];
    }
    return Math.sqrt(sumSq / (data.length / step));
}

function generateWaveform(data: Float32Array, points: number): number[] {
    const step = Math.floor(data.length / points);
    const result: number[] = [];
    for (let i = 0; i < points; i++) {
        let max = 0;
        const start = i * step;
        const end = start + step;
        for (let j = start; j < end; j++) {
            const val = Math.abs(data[j]);
            if (val > max) max = val;
        }
        result.push(Math.min(1, max * 1.2));
    }
    return result;
}

function detectBPM(data: Float32Array, sampleRate: number): number {
    const downsampleFactor = Math.floor(sampleRate / 1000);
    const envelopeSize = Math.floor(data.length / downsampleFactor);
    const envelope = new Float32Array(envelopeSize);
    
    for (let i = 0; i < envelopeSize; i++) {
        let max = 0;
        for (let j = 0; j < downsampleFactor; j++) {
            const val = Math.abs(data[i * downsampleFactor + j]);
            if (val > max) max = val;
        }
        envelope[i] = max;
    }

    const minLag = 333; 
    const maxLag = 1000;
    let bestLag = 0;
    let maxCorrelation = -1;
    const midIdx = Math.floor(envelopeSize / 2);
    const evalSize = Math.min(3000, envelopeSize - midIdx - maxLag);

    for (let lag = minLag; lag < maxLag; lag++) {
        let correlation = 0;
        for (let i = 0; i < evalSize; i++) {
            correlation += envelope[midIdx + i] * envelope[midIdx + i + lag];
        }
        if (correlation > maxCorrelation) {
            maxCorrelation = correlation;
            bestLag = lag;
        }
    }

    if (!bestLag) return 120;
    let bpm = 60000 / bestLag;
    if (bpm > 150) bpm /= 2;
    if (bpm < 75) bpm *= 2;
    return Math.round(bpm);
}

function detectKey(data: Float32Array, sampleRate: number): string {
    const chroma = new Float32Array(12).fill(0.1);
    const startIdx = Math.floor(data.length * 0.3);
    const step = Math.floor(sampleRate * 0.1);
    const iterations = 50;

    for (let it = 0; it < iterations; it++) {
        const offset = startIdx + (it * step);
        if (offset + 1024 >= data.length) break;
        let cycles = 0;
        for(let i=0; i<1024; i++) {
            if (data[offset+i] > 0 && data[offset+i-1] <= 0) cycles++;
        }
        const freq = (cycles * sampleRate) / 1024;
        if (freq > 20 && freq < 2000) {
            const midi = Math.round(69 + 12 * Math.log2(freq / 440));
            chroma[midi % 12] += 1.0;
        }
    }

    const majProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    const minProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
    const keys = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"];

    let bestKey = "C";
    let maxCorr = -1;

    for (let shift = 0; shift < 12; shift++) {
        let corrMaj = 0;
        let corrMin = 0;
        for (let i = 0; i < 12; i++) {
            const val = chroma[(i + shift) % 12];
            corrMaj += val * majProfile[i];
            corrMin += val * minProfile[i];
        }
        if (corrMaj > maxCorr) { maxCorr = corrMaj; bestKey = keys[shift]; }
        if (corrMin > maxCorr) { maxCorr = corrMin; bestKey = keys[shift] + "m"; }
    }
    return bestKey;
}

// ── Worker Message Handler ───────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<{ audioData: Float32Array, sampleRate: number }>) => {
    const { audioData, sampleRate } = event.data;

    const rawRms = calculateRawRMS(audioData);
    const gainOffset = calculateGainOffsetFromRms(rawRms);
    const energy = Math.min(1, Math.max(0.1, (rawRms - 0.05) / 0.2));
    
    const bpm = detectBPM(audioData, sampleRate);
    const key = detectKey(audioData, sampleRate);
    const waveform = generateWaveform(audioData, 100);

    const results: AnalysisWorkerResults = {
        bpm,
        key,
        energy,
        waveform,
        gainOffset
    };

    self.postMessage(results);
};
import { calculateGainOffsetFromRms } from "./audioNormalization";
