/**
 * PitchEngine — Signalsmith Stretch Edition
 *
 * Web Audio graph:
 *   SignalsmithStretchNode → GainNode → DynamicsCompressor (limiter) → destination
 *
 * signalsmith-stretch (WASM AudioWorklet) performs true time-stretch and
 * pitch-shift in one node: `rate` drives tempo without touching pitch and
 * `semitones` shifts pitch without touching tempo. This replaces the
 * SoundTouchJS source+worklet pair with a single scheduled processor and
 * noticeably better audio quality at extreme settings.
 *
 * The public API is identical to the previous SoundTouchJS edition, so
 * BrowserAudioEngine and SyncEnsemble consumers need no changes.
 */
import SignalsmithStretch from "signalsmith-stretch";
import type { SignalsmithStretchNode } from "signalsmith-stretch";

let sharedAudioCtx: AudioContext | null = null;
function getSharedContext(): AudioContext {
    if (!sharedAudioCtx) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        sharedAudioCtx = new AudioCtxClass();
    }
    return sharedAudioCtx;
}

export class PitchEngine {
    private audioCtx: AudioContext;
    private gainNode: GainNode;
    private limiterNode: DynamicsCompressorNode;
    private stretchNode: SignalsmithStretchNode | null = null;
    private audioBuffer: AudioBuffer | null = null;

    private _isPlaying = false;
    private _isReady = false;
    private _pitchSemitones = 0;
    private _tempo = 1.0;
    private _syncRateAdjustment = 1.0;
    private _volume = 0.85;
    private _currentUrl = "";
    private _startTime = 0; // ms — position within the track
    private _endTime = 0;   // ms — stop playback at this point (0 = no limit)
    private _positionSec = 0; // live position reported by the stretch node

    private _onTimeUpdate: ((t: number, p: number) => void) | null = null;
    private _onEnd: (() => void) | null = null;
    private _scheduledStart: ReturnType<typeof setTimeout> | null = null;
    private _loadAbortController: AbortController | null = null;
    private _lastLoadId = 0;

    constructor() {
        this.audioCtx = getSharedContext();

        // 1. Gain Node for volume control
        this.gainNode = this.audioCtx.createGain();
        const safeVol = Math.max(0, Math.min(this._volume, 1.0));
        this.gainNode.gain.value = safeVol;

        // 2. Safety Limiter to prevent clipping and protect hearing
        this.limiterNode = this.audioCtx.createDynamicsCompressor();
        this.limiterNode.threshold.setValueAtTime(-1.0, this.audioCtx.currentTime);
        this.limiterNode.knee.setValueAtTime(40, this.audioCtx.currentTime);
        this.limiterNode.ratio.setValueAtTime(12, this.audioCtx.currentTime);
        this.limiterNode.attack.setValueAtTime(0, this.audioCtx.currentTime);
        this.limiterNode.release.setValueAtTime(0.25, this.audioCtx.currentTime);

        // Chain: Gain -> Limiter -> Destination
        this.gainNode.connect(this.limiterNode);
        this.limiterNode.connect(this.audioCtx.destination);
    }

    private _effectiveRate(): number {
        return this._tempo * this._syncRateAdjustment;
    }

    private _cleanup() {
        if (this._loadAbortController) {
            this._loadAbortController.abort();
            this._loadAbortController = null;
        }
        if (this._scheduledStart) {
            clearTimeout(this._scheduledStart);
            this._scheduledStart = null;
        }
        if (this.stretchNode) {
            try { this.stretchNode.schedule({ active: false }); } catch { /* already stopped */ }
            try { this.stretchNode.stop(); } catch { /* not started */ }
            this.stretchNode.disconnect();
            this.stretchNode = null;
        }
    }

    async load(url: string): Promise<boolean> {
        const loadId = ++this._lastLoadId;
        try {
            console.log(`[PitchEngine] load(${loadId}) →`, url);
            this._cleanup();

            this._loadAbortController = new AbortController();
            this._isPlaying = false;
            this._isReady = false;
            this._currentUrl = url;
            this._startTime = 0;
            this._endTime = 0;
            this._positionSec = 0;

            if (this.audioCtx.state === "suspended") {
                await this.audioCtx.resume();
            }

            const response = await fetch(url, { signal: this._loadAbortController.signal });
            if (!response.ok) return false;

            const arrayBuffer = await response.arrayBuffer();

            // Si mientras decodificamos se inició otra carga, abortamos esta.
            if (loadId !== this._lastLoadId) {
                console.log(`[PitchEngine] load(${loadId}) descartado: una carga más nueva (${this._lastLoadId}) está en curso.`);
                return false;
            }

            this.audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

            if (loadId !== this._lastLoadId) {
                return false;
            }

            // One stretch node per loaded buffer: feed all channels to the worklet.
            const channels: Float32Array[] = [];
            for (let c = 0; c < this.audioBuffer.numberOfChannels; c++) {
                channels.push(this.audioBuffer.getChannelData(c));
            }
            this.stretchNode = await SignalsmithStretch(this.audioCtx, {
                outputChannelCount: [this.audioBuffer.numberOfChannels],
            });
            await this.stretchNode.addBuffers(channels);
            this.stretchNode.connect(this.gainNode);

            if (loadId !== this._lastLoadId) {
                this._cleanup();
                return false;
            }

            // Position tracking + end detection driven by the worklet itself.
            this.stretchNode.setUpdateInterval(0.05, (inputTime: number) => {
                if (!this._isPlaying || !this.audioBuffer) return;
                this._positionSec = inputTime;
                const currentMs = inputTime * 1000;

                // Custom end limit (set-builder trims) or natural end of buffer
                const limitMs = this._endTime > 0 ? this._endTime : this.audioBuffer.duration * 1000;
                if (currentMs >= limitMs - 30) {
                    this.stretchNode?.schedule({ active: false });
                    this._isPlaying = false;
                    this._startTime = 0;
                    if (this._onEnd) this._onEnd();
                    return;
                }

                if (this._onTimeUpdate) {
                    const progress = inputTime / this.audioBuffer.duration;
                    this._onTimeUpdate(inputTime, Math.min(progress, 1));
                }
            });

            this._isReady = true;
            console.log(`[PitchEngine] load(${loadId}) completo.`);
            return true;
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                console.log(`[PitchEngine] load(${loadId}) abortado correctamente.`);
            } else {
                console.error(`[PitchEngine] Error cargando audio (${loadId}):`, err);
            }
            return false;
        }
    }

    async play(atCtxTime: number = 0) {
        if (!this.audioBuffer || !this._isReady || !this.stretchNode) {
            console.warn("[PitchEngine] play() ABORTED — missing requirements");
            return;
        }
        if (this.audioCtx.state === "suspended") {
            await this.audioCtx.resume();
        }

        const startPlayback = () => {
            if (!this.stretchNode) return;
            this.stretchNode.schedule({
                input: this._startTime / 1000,
                rate: this._effectiveRate(),
                semitones: this._pitchSemitones,
                active: true,
            });
            this._positionSec = this._startTime / 1000;
            this._isPlaying = true;
        };

        // SyncEnsemble can schedule playback at a future context time.
        if (atCtxTime > this.audioCtx.currentTime) {
            const delayMs = (atCtxTime - this.audioCtx.currentTime) * 1000;
            if (this._scheduledStart) clearTimeout(this._scheduledStart);
            this._scheduledStart = setTimeout(startPlayback, delayMs);
        } else {
            startPlayback();
        }
    }

    pause(atPositionMs?: number) {
        if (this._scheduledStart) {
            clearTimeout(this._scheduledStart);
            this._scheduledStart = null;
        }
        if (!this._isPlaying) {
            if (atPositionMs !== undefined) this._startTime = atPositionMs;
            return;
        }

        this._startTime = atPositionMs !== undefined ? atPositionMs : this._positionSec * 1000;
        this.stretchNode?.schedule({ active: false });
        this._isPlaying = false;
    }

    stop() {
        console.log("[PitchEngine] stop() called");
        this.pause();
        this._startTime = 0;
        this._positionSec = 0;
    }

    seekToTime(seconds: number) {
        this._startTime = seconds * 1000;
        this._positionSec = seconds;

        if (this._isPlaying && this.stretchNode) {
            this.stretchNode.schedule({
                input: seconds,
                rate: this._effectiveRate(),
                semitones: this._pitchSemitones,
                active: true,
            });
        } else if (this._onTimeUpdate && this.audioBuffer) {
            this._onTimeUpdate(seconds, seconds / this.audioBuffer.duration);
        }
    }

    set pitchSemitones(v: number) {
        this._pitchSemitones = v;
        if (this._isPlaying) {
            this.stretchNode?.schedule({ semitones: v });
        }
    }

    set tempo(v: number) {
        this._tempo = v;
        this._updateEffectiveRate();
    }

    set syncRateAdjustment(v: number) {
        this._syncRateAdjustment = v;
        this._updateEffectiveRate();
    }

    private _updateEffectiveRate() {
        if (this._isPlaying) {
            this.stretchNode?.schedule({ rate: this._effectiveRate() });
        }
    }

    set volume(v: number) {
        // Hard Clamping: 0.0 to 1.0 (100%) only.
        const safeVol = Math.max(0, Math.min(v, 1.0));
        this._volume = safeVol;
        if (this.gainNode) {
            this.gainNode.gain.setTargetAtTime(safeVol, this.audioCtx.currentTime, 0.02);
        }
    }

    get audioContext(): AudioContext {
        return this.audioCtx;
    }

    set limitMs(v: number) { this._endTime = v; }
    get isReady() { return this._isReady; }
    get isPlaying() { return this._isPlaying; }
    get durationMs() { return (this.audioBuffer?.duration ?? 0) * 1000; }
    get currentUrl() { return this._currentUrl; }

    async fadeVolumeTo(target: number, durationMs: number): Promise<void> {
        if (!this.gainNode) return;
        const curr = this.audioCtx.currentTime;
        this.gainNode.gain.cancelScheduledValues(curr);
        this.gainNode.gain.linearRampToValueAtTime(target, curr + (durationMs / 1000));
        await new Promise(r => setTimeout(r, durationMs));
        this._volume = target;
    }

    onTimeUpdate(cb: (t: number, p: number) => void) { this._onTimeUpdate = cb; }
    onEnd(cb: () => void) { this._onEnd = cb; }

    destroy() {
        this.stop();
        this._cleanup();
        this.gainNode.disconnect();
        this.audioBuffer = null;
    }
}

let _previewInstance: PitchEngine | null = null;
export function getPitchEngine(): PitchEngine {
    if (!_previewInstance) _previewInstance = new PitchEngine();
    return _previewInstance;
}
