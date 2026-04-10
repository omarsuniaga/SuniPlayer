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
    private _lastPositionMs = 0;
    private _bufferListener: ((bufferedMs: number) => void) | null = null;
    private _bufferingListener: ((isBuffering: boolean) => void) | null = null;

    constructor() {
        this.engine = new PitchEngine();
    }

    get isPlaying(): boolean {
        return this.engine.isPlaying;
    }

    get durationMs(): number {
        return this.engine.durationMs;
    }

    get currentUrl(): string | null {
        return this.engine.currentUrl;
    }

    async load(url: string, options?: AudioLoadOptions): Promise<void> {
        this._bufferingListener?.(true);
        const success = await this.engine.load(url);
        if (!success) {
            const err = new Error(`PitchEngine failed to load: ${url}`);
            this._bufferingListener?.(false);
            this._onError?.(err);
            throw err;
        }
        if (options?.initialPitch !== undefined) this.setPitch(options.initialPitch);
        if (options?.initialTempo !== undefined) this.setTempo(options.initialTempo);
        if (options?.initialVolume !== undefined) this.setVolume(options.initialVolume);
        this._bufferListener?.(this.engine.durationMs);
        this._bufferingListener?.(false);
    }

    private _isScheduled: boolean = false;

    async play(): Promise<void> {
        // Si ya hay un arranque programado a futuro, no hacemos nada
        if (this._isScheduled) return;
        this.engine.play();
    }

    async playAt(targetTimeMs: number, positionMs: number): Promise<void> {
        this._isScheduled = true;
        
        // formula: targetCtxTime = audioCtx.currentTime + (targetPerfNow - now) / 1000
        const audioCtx = this.engine.audioContext; 
        const now = performance.now();
        const deltaSec = (targetTimeMs - now) / 1000;
        const targetCtxTime = audioCtx.currentTime + deltaSec;

        this.seek(positionMs);
        this.engine.play(targetCtxTime);

        // Limpiamos el flag cuando el tiempo del contexto alcance el objetivo
        const checkInterval = setInterval(() => {
            if (audioCtx.currentTime >= targetCtxTime) {
                this._isScheduled = false;
                clearInterval(checkInterval);
            }
        }, 100);
    }

    pause(): void {
        this.engine.pause();
    }

    seek(positionMs: number): void {
        this._lastPositionMs = Math.max(0, positionMs);
        this.engine.seekToTime(positionMs / 1000); // PitchEngine uses seconds
    }

    async getPosition(): Promise<number> {
        return this._lastPositionMs;
    }

    fadeVolume(target: number, durationMs: number): Promise<void> {
        return this.engine.fadeVolumeTo(target, durationMs);
    }

    setPitch(semitones: number): void {
        this.engine.pitchSemitones = semitones;
    }

    setTempo(rate: number): void {
        this.engine.tempo = rate;
    }

    setPlaybackRate(rate: number): void {
        this.engine.syncRateAdjustment = rate;
    }

    setVolume(volume: number): void {
        this.engine.volume = volume;
    }

    onPositionUpdate(cb: (posMs: number) => void): void {
        this.engine.onTimeUpdate((sec: number) => {
            this._lastPositionMs = sec * 1000;
            cb(this._lastPositionMs);
        });
    }

    onBufferUpdate(cb: (bufferedMs: number) => void): void {
        this._bufferListener = cb;
        if (this.engine.isReady) {
            cb(this.engine.durationMs);
        }
    }

    onBufferingChange(cb: (isBuffering: boolean) => void): void {
        this._bufferingListener = cb;
    }

    onEnded(cb: () => void): void {
        this.engine.onEnd(cb);
    }

    /**
     * Register an error callback. Calling this again replaces the previously registered callback.
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
