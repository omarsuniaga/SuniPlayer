// src/platform/interfaces/IAudioEngine.ts

export interface AudioLoadOptions {
    id?: string;
    startMs?: number;
    endMs?: number;
    initialPitch?: number;   // semitones, -12 to +12
    initialTempo?: number;   // factor, 0.8 to 1.2
    initialVolume?: number;  // 0.0 to 1.0
    title?: string;
    artist?: string;
    artwork?: string;
    duration?: number;
}

/**
 * IAudioEngine — Contract for audio playback with pitch/tempo control.
 *
 * Semitone convention: -12 = one octave down, +12 = one octave up.
 * Tempo convention: 1.0 = normal speed, 0.8 = 20% slower, 1.2 = 20% faster.
 *
 * iOS note: AVAudioUnitTimePitch.pitch uses CENTS (1 semitone = 100 cents).
 * Multiply semitones × 100 when setting pitch in AVAudioEngine adapters.
 */
export interface IAudioEngine {
    readonly isPlaying: boolean;
    readonly durationMs: number;
    readonly currentUrl: string | null;

    /** Load a track URL and prepare for playback. Resolves when ready. */
    load(url: string, options?: AudioLoadOptions): Promise<void>;

    play(): Promise<void>;

    /** 
     * Schedules playback to start at a specific absolute monotonic time.
     * @param targetTimeMs The performance.now() timestamp when playback should start.
     * @param positionMs The position in the audio file to start from.
     */
    playAt(targetTimeMs: number, positionMs: number): Promise<void>;

    /**
     * Pause playback.
     * @param atPositionMs Optional: If provided, the engine should record this as the current position.
     * Useful for synchronizing pause state after a volume fade-out.
     */
    pause(atPositionMs?: number): void;
    seek(positionMs: number): void;

    /** Get current playback position in milliseconds. */
    getPosition(): Promise<number>;

    /** Smoothly change volume to target over duration. */
    fadeVolume(target: number, durationMs: number): Promise<void>;

    /** Set pitch in semitones. Applies immediately even while playing. */
    setPitch(semitones: number): void;

    /** Set tempo factor (0.8–1.2). Applies immediately even while playing. */
    setTempo(rate: number): void;

    /** 
     * Set internal playback rate adjustment (e.g. 1.001 or 0.999) 
     * for synchronization correction. This is independent of the user-facing tempo.
     */
    setPlaybackRate(rate: number): void;

    setVolume(volume: number): void;

    /** Register a callback called every ~250ms with current position in ms. */
    onPositionUpdate(cb: (posMs: number) => void): void;

    /** Fires every ~250ms with buffered position in ms. Only meaningful for streaming tracks. */
    onBufferUpdate(cb: (bufferedMs: number) => void): void;

    /** Fires when the network buffering state changes. True = buffering/loading, false = ready. */
    onBufferingChange(cb: (isBuffering: boolean) => void): void;

    /** Fires when the track reaches its end. */
    onEnded(cb: () => void): void;

    /** Fires on unrecoverable audio error. */
    onError(cb: (err: Error) => void): void;

    /** Release all resources. Must be called on component unmount. */
    dispose(): void;
}
