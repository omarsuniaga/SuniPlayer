/**
 * analysisService.ts
 * 
 * Advanced Audio Analysis Engine
 * - BPM Detection: Autocorrelation of energy envelope
 * - Key Detection: Pitch Class Profile Matching (Simplified)
 * - Energy: Weighted RMS calibration
 */

export interface AnalysisResults {
    bpm: number;
    key: string;
    energy: number;
    waveform: number[];
    gainOffset: number; 
    startTime?: number; // New: Suggested start time in MS
    endTime?: number;   // New: Suggested end time in MS
}

/**
 * High-level analysis function
 */
export async function analyzeAudio(buffer: AudioBuffer): Promise<AnalysisResults> {
    const rawRms = calculateRawRMS(buffer);
    
    // Target RMS for normalization is ~0.15 (standardized loudness)
    const targetRms = 0.15;
    const gainOffset = targetRms / Math.max(0.01, rawRms);

    const energy = Math.min(1, Math.max(0.1, (rawRms - 0.05) / 0.2));
    const bpm = detectAdvancedBPM(buffer);
    const key = detectAdvancedKey(buffer);
    const waveform = generateWaveform(buffer, 100);
    
    // Auto-Trim Detection
    const { startTime, endTime } = detectSilenceTrimming(buffer);

    return { bpm, key, energy, waveform, gainOffset, startTime, endTime };
}

/**
 * Detects the first and last non-silent samples to suggest trimming points.
 * Uses a threshold of 0.005 (~ -46dB) to avoid catching background hiss.
 */
function detectSilenceTrimming(buffer: AudioBuffer, threshold = 0.005): { startTime: number, endTime: number } {
    const data = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    
    let first = 0;
    let last = data.length - 1;

    // Find start (look forward)
    for (let i = 0; i < data.length; i += 100) { // Step 100 for speed
        if (Math.abs(data[i]) > threshold) {
            first = i;
            break;
        }
    }

    // Find end (look backward)
    for (let i = data.length - 1; i >= 0; i -= 100) {
        if (Math.abs(data[i]) > threshold) {
            last = i;
            break;
        }
    }

    // Convert sample indices to Milliseconds
    return {
        startTime: Math.max(0, Math.floor((first / sr) * 1000) - 100), // Buffer 100ms before
        endTime: Math.min(Math.floor(buffer.duration * 1000), Math.ceil((last / sr) * 1000) + 100) // Buffer 100ms after
    };
}

/**
 * BPM Detection via Autocorrelation of Energy Envelope
 * More robust than simple peak counting.
 */
function detectAdvancedBPM(buffer: AudioBuffer): number {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    
    // 1. Decimate to ~1000Hz envelope
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

    // 2. Autocorrelation (periodicity check)
    // Range: 60 BPM (1000ms) to 180 BPM (333ms)
    const minLag = 333; 
    const maxLag = 1000;
    
    let bestLag = 0;
    let maxCorrelation = -1;

    // Evaluate middle section of the song (most representative)
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
    
    // Normalize to 75-150 range
    if (bpm > 150) bpm /= 2;
    if (bpm < 75) bpm *= 2;
    
    return Math.round(bpm);
}

/**
 * Key Detection via Simplified Chroma matching
 */
function detectAdvancedKey(buffer: AudioBuffer): string {
    const data = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    
    // We sample the harmony using a very rough estimate of spectral energy 
    // mapped to 12 semi-tone bins.
    const chroma = new Float32Array(12).fill(0.1); // baseline noise

    // Selection of middle frames to avoid intros/outros
    const startIdx = Math.floor(data.length * 0.3);
    const step = Math.floor(sr * 0.1); // 100ms jumps
    const iterations = 50;

    for (let it = 0; it < iterations; it++) {
        const offset = startIdx + (it * step);
        if (offset + 1024 >= data.length) break;

        // Perform a very crude periodicity check (Zero Crossing + Peak) 
        // to identify dominant fundamental frequencies.
        // In a real app, we'd use a real FFT.
        let cycles = 0;
        for(let i=0; i<1024; i++) {
            if (data[offset+i] > 0 && data[offset+i-1] <= 0) cycles++;
        }
        
        const freq = (cycles * sr) / 1024;
        if (freq > 20 && freq < 2000) {
            // Map freq to MIDI Note
            const midi = Math.round(69 + 12 * Math.log2(freq / 440));
            const bin = midi % 12;
            chroma[bin] += 1.0;
        }
    }

    // Classic Krumhansl-Schmuckler Key Profiles
    const majProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    const minProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
    const keys = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"];

    let bestKey = "C";
    let maxCorr = -1;

    // Test each of the 12 major and 12 minor keys
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

/**
 * Calculate RAW RMS for loudness calibration
 */
function calculateRawRMS(buffer: AudioBuffer): number {
    const data = buffer.getChannelData(0);
    let sumSq = 0;
    const step = 8; // Faster sampling for long tracks
    for (let i = 0; i < data.length; i += step) {
        sumSq += data[i] * data[i];
    }
    return Math.sqrt(sumSq / (data.length / step));
}

/**
 * Generate a simplified waveform (envelope)
 * @param buffer The AudioBuffer to analyze
 * @param points Number of points in the output array
 */
function generateWaveform(buffer: AudioBuffer, points: number): number[] {
    const data = buffer.getChannelData(0);
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
        // Normalize slightly and ensure it's not totally flat
        result.push(Math.min(1, max * 1.2));
    }

    return result;
}
