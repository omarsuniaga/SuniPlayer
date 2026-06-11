// Spike P1 — WASM pitch/stretch validation helpers (pure TS, no DOM).
// These helpers let the spike verify pitch shift objectively:
// a 440Hz sine shifted +12 semitones must measure ~880Hz at the output.
import { describe, expect, it } from 'vitest';
import {
  bufferStats,
  estimateDominantFrequency,
  expectedOutputDuration,
  makeSine,
  semitonesToRatio,
} from './audioAnalysis';

const SAMPLE_RATE = 48000;

describe('semitonesToRatio', () => {
  it('returns 1 for 0 semitones', () => {
    expect(semitonesToRatio(0)).toBe(1);
  });

  it('returns 2 for +12 semitones (one octave up)', () => {
    expect(semitonesToRatio(12)).toBeCloseTo(2, 10);
  });

  it('returns 0.5 for -12 semitones (one octave down)', () => {
    expect(semitonesToRatio(-12)).toBeCloseTo(0.5, 10);
  });

  it('returns ~1.0595 for +1 semitone (equal temperament)', () => {
    expect(semitonesToRatio(1)).toBeCloseTo(1.059463, 5);
  });
});

describe('makeSine', () => {
  it('produces the requested number of samples', () => {
    const samples = makeSine(440, 2, SAMPLE_RATE);
    expect(samples.length).toBe(2 * SAMPLE_RATE);
  });

  it('stays within [-1, 1] amplitude', () => {
    const samples = makeSine(440, 0.5, SAMPLE_RATE);
    const { peak } = bufferStats(samples);
    expect(peak).toBeLessThanOrEqual(1);
    expect(peak).toBeGreaterThan(0.7);
  });
});

describe('estimateDominantFrequency', () => {
  it('detects 440Hz in a clean sine', () => {
    const samples = makeSine(440, 1, SAMPLE_RATE);
    const hz = estimateDominantFrequency(samples, SAMPLE_RATE);
    expect(hz).toBeGreaterThan(435);
    expect(hz).toBeLessThan(445);
  });

  it('detects 880Hz in a clean sine (the +12 semitone target)', () => {
    const samples = makeSine(880, 1, SAMPLE_RATE);
    const hz = estimateDominantFrequency(samples, SAMPLE_RATE);
    expect(hz).toBeGreaterThan(870);
    expect(hz).toBeLessThan(890);
  });

  it('detects a low 110Hz fundamental', () => {
    const samples = makeSine(110, 1, SAMPLE_RATE);
    const hz = estimateDominantFrequency(samples, SAMPLE_RATE);
    expect(hz).toBeGreaterThan(106);
    expect(hz).toBeLessThan(114);
  });

  it('returns 0 for silence', () => {
    const silence = new Float32Array(SAMPLE_RATE);
    expect(estimateDominantFrequency(silence, SAMPLE_RATE)).toBe(0);
  });
});

describe('bufferStats', () => {
  it('reports rms ~0.707 and peak ~1 for a full-scale sine', () => {
    const samples = makeSine(440, 1, SAMPLE_RATE);
    const stats = bufferStats(samples);
    expect(stats.rms).toBeGreaterThan(0.69);
    expect(stats.rms).toBeLessThan(0.72);
    expect(stats.hasNaN).toBe(false);
  });

  it('flags NaN corruption', () => {
    const samples = makeSine(440, 0.1, SAMPLE_RATE);
    samples[100] = Number.NaN;
    expect(bufferStats(samples).hasNaN).toBe(true);
  });

  it('reports silence ratio for a half-silent buffer', () => {
    const sine = makeSine(440, 1, SAMPLE_RATE);
    const buffer = new Float32Array(2 * SAMPLE_RATE);
    buffer.set(sine, 0);
    const stats = bufferStats(buffer);
    expect(stats.silentRatio).toBeGreaterThan(0.45);
    expect(stats.silentRatio).toBeLessThan(0.55);
  });
});

describe('expectedOutputDuration', () => {
  it('doubles the duration at half rate (stretch 50%)', () => {
    expect(expectedOutputDuration(2, 0.5)).toBe(4);
  });

  it('keeps duration at rate 1', () => {
    expect(expectedOutputDuration(3, 1)).toBe(3);
  });

  it('throws on rate <= 0', () => {
    expect(() => expectedOutputDuration(2, 0)).toThrow();
  });
});
