// src/platform/browser/BrowserAudioEngine.ts
import { PitchEngine } from '../../services/pitchEngine';
import type { IAudioEngine, AudioLoadOptions } from '../interfaces/IAudioEngine';

/**
 * BrowserAudioEngine — wraps PitchEngine (SoundTouchJS + Web Audio API)
 * to satisfy the IAudioEngine interface.
 *
 * iOS equivalent: NativeAudioEngine wrapping AVAudioEngine + AVAudioUnitTimePitch
 * Professional iOS: NativeAudioEngine wrapping SoundTouch C++ via Objective-C bridge
 */
export class BrowserAudioEngine implements IAudioEngine {
    private engine: PitchEngine;
    private _onError: ((err: Error) => void) | null = null;

    constructor() {
        this.engine = new PitchEngine();
    }

    async load(url: string, options?: AudioLoadOptions): Promise<void> {
        const success = await this.engine.load(url);
        if (!success) {
            const err = new Error(`PitchEngine failed to load: ${url}`);
            this._onError?.(err);
            throw err;
        }
        if (options?.initialPitch !== undefined) this.setPitch(options.initialPitch);
        if (options?.initialTempo !== undefined) this.setTempo(options.initialTempo);
        if (options?.initialVolume !== undefined) this.setVolume(options.initialVolume);
    }

    async play(): Promise<void> {
        this.engine.play();
    }

    pause(): void {
        this.engine.pause();
    }

    seek(positionMs: number): void {
        this.engine.seekToTime(positionMs / 1000); // PitchEngine uses seconds
    }

    setPitch(semitones: number): void {
        this.engine.pitchSemitones = semitones;
    }

    setTempo(rate: number): void {
        this.engine.tempo = rate;
    }

    setVolume(volume: number): void {
        this.engine.volume = volume;
    }

    onPositionUpdate(cb: (posMs: number) => void): void {
        this.engine.onTimeUpdate((sec: number) => cb(sec * 1000));
    }

    onEnded(cb: () => void): void {
        this.engine.onEnd(cb);
    }

    /**
     * Register an error callback.
     *
     * NOTE (browser limitation): PitchEngine handles playback-phase errors
     * internally via console.error and does not expose a hook for them.
     * This callback is only invoked for load failures detected in `load()`.
     * Playback errors are logged to the console by PitchEngine directly.
     */
    onError(cb: (err: Error) => void): void {
        this._onError = cb;
    }

    dispose(): void {
        this.engine.destroy();
    }
}
