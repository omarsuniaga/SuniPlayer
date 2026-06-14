// Spike P1 — WASM pitch/stretch validation helpers (pure TS, no DOM).
// Used by the spike page to verify signalsmith-stretch output objectively.

/** Equal-temperament pitch ratio: +12 semitones = 2.0 (one octave up). */
export function semitonesToRatio(semitones: number): number {
  return 2 ** (semitones / 12);
}

/** Synthesizes a full-scale sine wave for use as a known test signal. */
export function makeSine(
  frequencyHz: number,
  seconds: number,
  sampleRate: number,
): Float32Array {
  const length = Math.round(seconds * sampleRate);
  const samples = new Float32Array(length);
  const step = (2 * Math.PI * frequencyHz) / sampleRate;
  for (let i = 0; i < length; i++) {
    samples[i] = Math.sin(step * i);
  }
  return samples;
}

export interface BufferStats {
  rms: number;
  peak: number;
  hasNaN: boolean;
  /** Fraction of samples below the silence threshold (|s| < 1e-4). */
  silentRatio: number;
}

const SILENCE_THRESHOLD = 1e-4;

export function bufferStats(samples: Float32Array): BufferStats {
  let sumSquares = 0;
  let peak = 0;
  let hasNaN = false;
  let silentCount = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i] as number;
    if (Number.isNaN(s)) {
      hasNaN = true;
      continue;
    }
    const abs = Math.abs(s);
    if (abs < SILENCE_THRESHOLD) silentCount++;
    if (abs > peak) peak = abs;
    sumSquares += s * s;
  }
  return {
    rms: samples.length > 0 ? Math.sqrt(sumSquares / samples.length) : 0,
    peak,
    hasNaN,
    silentRatio: samples.length > 0 ? silentCount / samples.length : 1,
  };
}

/**
 * Estimates the dominant frequency via normalized autocorrelation with
 * parabolic interpolation. Good enough to distinguish 440Hz from 880Hz,
 * which is all the spike needs. Returns 0 for silence.
 */
export function estimateDominantFrequency(
  samples: Float32Array,
  sampleRate: number,
): number {
  const { rms } = bufferStats(samples);
  if (rms < 1e-3) return 0;

  const minHz = 50;
  const maxHz = 2000;
  const minLag = Math.floor(sampleRate / maxHz);
  const maxLag = Math.min(Math.ceil(sampleRate / minHz), samples.length - 1);
  if (maxLag <= minLag) return 0;

  // Use a window long enough to hold several periods of the lowest pitch.
  const windowSize = Math.min(samples.length - maxLag, 4 * maxLag);
  if (windowSize <= 0) return 0;

  let bestCorrelation = -1;
  const correlations = new Float32Array(maxLag + 1);

  for (let lag = minLag; lag <= maxLag; lag++) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < windowSize; i++) {
      const a = samples[i] as number;
      const b = samples[i + lag] as number;
      dot += a * b;
      normA += a * a;
      normB += b * b;
    }
    const denominator = Math.sqrt(normA * normB);
    const correlation = denominator > 0 ? dot / denominator : 0;
    correlations[lag] = correlation;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
    }
  }

  if (bestCorrelation < 0.5) return 0;

  // A pure tone correlates at EVERY multiple of its period, and float noise
  // makes any of them the global max. Octave-error fix: take the SMALLEST
  // lag that is a local peak within an epsilon of the global max.
  const epsilon = 0.01;
  let bestLag = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const c = correlations[lag] as number;
    if (c < bestCorrelation - epsilon) continue;
    const left = lag > minLag ? (correlations[lag - 1] as number) : -1;
    const right = lag < maxLag ? (correlations[lag + 1] as number) : -1;
    if (c >= left && c >= right) {
      bestLag = lag;
      break;
    }
  }
  if (bestLag === 0) return 0;

  // Parabolic interpolation around the peak for sub-sample lag precision.
  let refinedLag = bestLag;
  if (bestLag > minLag && bestLag < maxLag) {
    const left = correlations[bestLag - 1] as number;
    const center = correlations[bestLag] as number;
    const right = correlations[bestLag + 1] as number;
    const denominator = left - 2 * center + right;
    if (denominator !== 0) {
      refinedLag = bestLag + (0.5 * (left - right)) / denominator;
    }
  }

  return sampleRate / refinedLag;
}

/** A 2s file played at rate 0.5 must take ~4s of output time. */
export function expectedOutputDuration(
  inputSeconds: number,
  rate: number,
): number {
  if (rate <= 0) {
    throw new Error(`rate must be > 0, got ${rate}`);
  }
  return inputSeconds / rate;
}
