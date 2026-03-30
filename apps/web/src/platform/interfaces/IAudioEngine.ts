// src/platform/interfaces/IAudioEngine.ts

export interface AudioLoadOptions {
    startMs?: number;
    endMs?: number;
    initialPitch?: number;   // semitones, -12 to +12
    initialTempo?: number;   // factor, 0.8 to 1.2
    initialVolume?: number;  // 0.0 to 1.0
}

/**
 * IAudioEngine â€” Contract for audio playback with pitch/tempo control.
 *
 * Semitone convention: -12 = one octave down, +12 = one octave up.
 * Tempo convention: 1.0 = normal speed, 0.8 = 20% slower, 1.2 = 20% faster.
 *
 * iOS note: AVAudioUnitTimePitch.pitch uses CENTS (1 semitone = 100 cents).
 * Multiply semitones Ã— 100 when setting pitch in AVAudioEngine adapters.
 */
export interface IAudioEngine {
    /** Load a track URL and prepare for playback. Resolves when ready. */
    load(url: string, options?: AudioLoadOptions): Promise<void>;

    play(): Promise<void>;
    pause(): void;
    seek(positionMs: number): void;

    /** Set pitch in semitones. Applies immediately even while playing. */
    setPitch(semitones: number): void;

    /** Set tempo factor (0.8â€“1.2). Applies immediately even while playing. */
    setTempo(rate: number): void;

    setVolume(volume: number): void;

    /** Register a callback called every ~250ms with current position in ms. */
    onPositionUpdate(cb: (posMs: number) => void): void;

    /** Fires when the track reaches its end. */
    onEnded(cb: () => void): void;

    /** Fires on unrecoverable audio error. */
    onError(cb: (err: Error) => void): void;

    /** Release all resources. Must be called on component unmount. */
    dispose(): void;
}
