/**
 * PitchEngine â€” Professional Pitch & Tempo Engine
 * 
 * Uses SoundTouchJS (WSOLA algorithm) for independent pitch and tempo control.
 * This replaces the old `playbackRate` hack that changed both pitch & speed together.
 * 
 * Architecture:
 *   AudioBuffer â†’ SoundTouch WSOLA â†’ ScriptProcessorNode â†’ GainNode â†’ Destination
 *   
 * Controls:
 *   - pitchSemitones: chromatic shift (independent of tempo)
 *   - tempo: speed factor 0.5-2.0 (independent of pitch)
 *   - volume: 0-1
 */
import { PitchShifter } from "soundtouchjs";

const BUFFER_SIZE = 4096;
const AUDIO_BASE = "/audio/";

export class PitchEngine {
    private audioCtx: AudioContext;
    private gainNode: GainNode;
    private shifter: PitchShifter | null = null;
    private audioBuffer: AudioBuffer | null = null;
    private _isPlaying = false;
    private _isReady = false;
    private _pitchSemitones = 0;
    private _tempo = 1.0;
    private _volume = 0.85;
    private _currentUrl = "";

    // Callbacks
    private _onTimeUpdate: ((currentTimeSec: number, percent: number) => void) | null = null;
    private _onEnd: (() => void) | null = null;
    private _onReady: (() => void) | null = null;

    constructor() {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioCtxClass();
        this.gainNode = this.audioCtx.createGain();
        this.gainNode.connect(this.audioCtx.destination);
    }

    /** Load audio from a URL (blob_url or file path) and prepare for playback */
    async load(url: string): Promise<boolean> {
        try {
            // Stop any existing playback
            this.stop();
            this._isReady = false;
            this._currentUrl = url;

            // Ensure context is running
            if (this.audioCtx.state === "suspended") {
                await this.audioCtx.resume();
            }

            const response = await fetch(url);
            if (!response.ok) return false;

            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

            // Create the PitchShifter with the decoded buffer
            this._createShifter();

            this._isReady = true;
            if (this._onReady) this._onReady();
            return true;
        } catch (err) {
            console.error("[PitchEngine] Failed to load:", err);
            this._isReady = false;
            return false;
        }
    }

    /** Load from file_path (resolves relative to AUDIO_BASE) */
    async loadFromPath(filePath: string, blobUrl?: string): Promise<boolean> {
        const url = blobUrl || (AUDIO_BASE + encodeURIComponent(filePath));
        return this.load(url);
    }

    /** Internal: create / recreate the PitchShifter */
    private _createShifter() {
        // Clean up old shifter
        if (this.shifter) {
            this.shifter.off();
            try { this.shifter.disconnect(); } catch { /* noop */ }
        }

        if (!this.audioBuffer) return;

        this.shifter = new PitchShifter(this.audioCtx, this.audioBuffer, BUFFER_SIZE, () => {
            // onEnd callback from SoundTouch
            this._isPlaying = false;
            if (this._onEnd) this._onEnd();
        });

        // Apply current settings
        this.shifter.pitchSemitones = this._pitchSemitones;
        this.shifter.tempo = this._tempo;

        // Listen for position updates
        this.shifter.on("play", (detail: { timePlayed: number; percentagePlayed: number }) => {
            if (this._onTimeUpdate) {
                this._onTimeUpdate(detail.timePlayed, detail.percentagePlayed / 100);
            }
        });
    }

    /** Start or resume playback */
    play() {
        if (!this.shifter || !this._isReady) return;

        if (this.audioCtx.state === "suspended") {
            this.audioCtx.resume();
        }

        this.shifter.connect(this.gainNode);
        this.gainNode.gain.value = this._volume;
        this._isPlaying = true;
    }

    /** Pause playback (keeps position) */
    pause() {
        if (!this.shifter) return;
        try {
            this.shifter.disconnect();
        } catch {
            // already disconnected
        }
        this._isPlaying = false;
    }

    /** Stop and reset to beginning */
    stop() {
        this.pause();
        if (this.shifter) {
            try {
                this.shifter.off();
                this.shifter.disconnect();
            } catch { /* noop */ }
            this.shifter = null;
        }
        this._isPlaying = false;
    }

    /** Seek to a position (0-1 range as percentage) */
    seek(percent: number) {
        if (!this.shifter) return;
        const clamped = Math.max(0, Math.min(1, percent));
        // PitchShifter.percentagePlayed setter expects 0-100
        this.shifter.percentagePlayed = clamped;
    }

    /** Seek to a position in seconds */
    seekToTime(seconds: number) {
        if (!this.audioBuffer) return;
        const percent = seconds / this.audioBuffer.duration;
        this.seek(percent);
    }

    // â”€â”€ Property accessors â”€â”€

    set pitchSemitones(value: number) {
        this._pitchSemitones = value;
        if (this.shifter) {
            this.shifter.pitchSemitones = value;
        }
    }
    get pitchSemitones() { return this._pitchSemitones; }

    set tempo(value: number) {
        this._tempo = Math.max(0.5, Math.min(2.0, value));
        if (this.shifter) {
            this.shifter.tempo = this._tempo;
        }
    }
    get tempo() { return this._tempo; }

    set volume(value: number) {
        this._volume = Math.max(0, Math.min(1, value));
        if (this.gainNode) {
            this.gainNode.gain.value = this._volume;
        }
    }
    get volume() { return this._volume; }

    get isPlaying() { return this._isPlaying; }
    get isReady() { return this._isReady; }
    get duration() { return this.audioBuffer?.duration ?? 0; } // seconds
    get durationMs() { return (this.audioBuffer?.duration ?? 0) * 1000; }
    get currentUrl() { return this._currentUrl; }

    // â”€â”€ Fade support (for crossfade / fade-out) â”€â”€

    fadeVolumeTo(target: number, durationMs: number): Promise<void> {
        return new Promise((resolve) => {
            const steps = 20;
            const interval = durationMs / steps;
            let step = 0;
            const startVol = this._volume;
            const delta = target - startVol;

            const timer = setInterval(() => {
                step++;
                const t = step / steps;
                this.volume = startVol + delta * t;

                if (step >= steps) {
                    clearInterval(timer);
                    this.volume = target;
                    resolve();
                }
            }, interval);
        });
    }

    // â”€â”€ Event handlers â”€â”€

    onTimeUpdate(cb: (currentTimeSec: number, percent: number) => void) {
        this._onTimeUpdate = cb;
    }

    onEnd(cb: () => void) {
        this._onEnd = cb;
    }

    onReady(cb: () => void) {
        this._onReady = cb;
    }

    /** Clean up all resources */
    destroy() {
        this.stop();
        if (this.audioCtx.state !== "closed") {
            this.audioCtx.close().catch(() => { });
        }
    }
}

/** Singleton instance for the main player */
let _instance: PitchEngine | null = null;

export function getPitchEngine(): PitchEngine {
    if (!_instance) {
        _instance = new PitchEngine();
    }
    return _instance;
}
