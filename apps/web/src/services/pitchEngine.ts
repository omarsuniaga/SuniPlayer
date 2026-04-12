/**
 * PitchEngine — SoundTouchJS AudioWorklet Edition
 * 
 * Correct Web Audio graph:
 *   AudioBufferSourceNode(playbackRate=tempo) → SoundTouchNode → GainNode → destination
 * 
 * Key pattern: tempo is driven by sourceNode.playbackRate, and we tell
 * SoundTouchNode the matching playbackRate so it auto-compensates pitch.
 */
import { SoundTouchNode } from "@soundtouchjs/audio-worklet";

const PROCESSOR_URL = "/soundtouch-processor.js";

let sharedAudioCtx: AudioContext | null = null;
function getSharedContext(): AudioContext {
    if (!sharedAudioCtx) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        sharedAudioCtx = new AudioCtxClass();
    }
    return sharedAudioCtx;
}

export class PitchEngine {
// ... (properties)
    private audioCtx: AudioContext;
    private gainNode: GainNode;
    private limiterNode: DynamicsCompressorNode;
    private soundtouchNode: SoundTouchNode | null = null;
    private sourceNode: AudioBufferSourceNode | null = null;
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
    private _startCtxTime = 0; // audioContext.currentTime when playback started
    
    private static _workletPromise: Promise<void> | null = null;

    private _onTimeUpdate: ((t: number, p: number) => void) | null = null;
    private _onEnd: (() => void) | null = null;
    private _updateInterval: ReturnType<typeof setInterval> | null = null;
    private _endedByUs = false; // flag to distinguish natural end from stop()
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
        this.limiterNode.threshold.setValueAtTime(-1.0, this.audioCtx.currentTime); // Ataja antes de 0dB
        this.limiterNode.knee.setValueAtTime(40, this.audioCtx.currentTime);
        this.limiterNode.ratio.setValueAtTime(12, this.audioCtx.currentTime);
        this.limiterNode.attack.setValueAtTime(0, this.audioCtx.currentTime);
        this.limiterNode.release.setValueAtTime(0.25, this.audioCtx.currentTime);

        // Chain: Gain -> Limiter -> Destination
        this.gainNode.connect(this.limiterNode);
        this.limiterNode.connect(this.audioCtx.destination);
    }

    private async _ensureWorklet() {
        if (PitchEngine._workletPromise) return PitchEngine._workletPromise;
        PitchEngine._workletPromise = (async () => {
            try {
                await SoundTouchNode.register(this.audioCtx, PROCESSOR_URL);
                console.log("[PitchEngine] SoundTouch AudioWorklet activo.");
            } catch (err) {
                PitchEngine._workletPromise = null;
                throw err;
            }
        })();
        return PitchEngine._workletPromise;
    }

    private _cleanup() {
        if (this._loadAbortController) {
            this._loadAbortController.abort();
            this._loadAbortController = null;
        }
        if (this.sourceNode) {
            try { this.sourceNode.stop(); } catch (e) {}
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        if (this.soundtouchNode) {
            this.soundtouchNode.disconnect();
            this.soundtouchNode = null;
        }
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
            this._updateInterval = null;
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

            if (this.audioCtx.state === "suspended") {
                await this.audioCtx.resume();
            }

            await this._ensureWorklet();
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

            this._isReady = true;
            console.log(`[PitchEngine] load(${loadId}) completo.`);
            return true;
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log(`[PitchEngine] load(${loadId}) abortado correctamente.`);
            } else {
                console.error(`[PitchEngine] Error cargando audio (${loadId}):`, err);
            }
            return false;
        }
    }

    async play(atCtxTime: number = 0) {
        console.log("[PitchEngine] play() called", {
            atCtxTime,
            hasBuffer: !!this.audioBuffer,
            isReady: this._isReady,
            ctxState: this.audioCtx.state,
            startTime: this._startTime,
            pitchSemitones: this._pitchSemitones,
            tempo: this._tempo,
            syncRateAdjustment: this._syncRateAdjustment,
            volume: this._volume
        });
        if (!this.audioBuffer || !this._isReady) {
            console.warn("[PitchEngine] play() ABORTED — missing requirements");
            return;
        }
        if (this.audioCtx.state === "suspended") {
            await this.audioCtx.resume();
            console.log("[PitchEngine] AudioContext resumed →", this.audioCtx.state);
        }

        // Clean up previous source/nodes before starting new ones
        this._cleanup();

        const effectiveRate = this._tempo * this._syncRateAdjustment;
        ...
        console.log("[PitchEngine] play() logic", {
            tempo: this._tempo,
            syncAdjustment: this._syncRateAdjustment,
            effectiveRate,
            volume: this._volume,
            gainValue: this.gainNode.gain.value
        const effectiveRate = this._tempo * this._syncRateAdjustment;

        // Fresh SoundTouchNode on every play()
        if (this.soundtouchNode) {
            this.soundtouchNode.disconnect();
        }
        this.soundtouchNode = new SoundTouchNode(this.audioCtx);
        this.soundtouchNode.pitchSemitones.value = this._pitchSemitones;
        this.soundtouchNode.tempo.value = 1.0; 
        this.soundtouchNode.playbackRate.setTargetAtTime(effectiveRate, this.audioCtx.currentTime, 0.02);
        this.soundtouchNode.connect(this.gainNode);

        // Create fresh source node
        this.sourceNode = this.audioCtx.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.playbackRate.setTargetAtTime(effectiveRate, this.audioCtx.currentTime, 0.02);

        // Graph: Source → SoundTouchNode → GainNode → destination
        this.sourceNode.connect(this.soundtouchNode);
        
        const offsetSec = this._startTime / 1000;
        const startAt = atCtxTime > this.audioCtx.currentTime ? atCtxTime : 0;
        
        console.log("[PitchEngine] sourceNode.start(", startAt, ",", offsetSec, ")");
        this.sourceNode.start(startAt, offsetSec);
        
        // If scheduled at 0 (now), use current time, otherwise use the scheduled time
        this._startCtxTime = startAt > 0 ? startAt : this.audioCtx.currentTime;
        this._isPlaying = true;
        this._endedByUs = false;
        console.log("[PitchEngine] Source started, gainNode.gain.value =", this.gainNode.gain.value);

        // Natural end detection
        this.sourceNode.onended = () => {
            console.log("[PitchEngine] sourceNode.onended fired, _isPlaying:", this._isPlaying, "_endedByUs:", this._endedByUs);
            if (this._isPlaying && !this._endedByUs) {
                this._isPlaying = false;
                if (this._updateInterval) {
                    clearInterval(this._updateInterval);
                    this._updateInterval = null;
                }
                if (this._onEnd) this._onEnd();
            }
        };

        // Position tracking via requestAnimationFrame for smooth updates
        this._startTracking();
    }

    private _startTracking() {
        if (this._updateInterval) clearInterval(this._updateInterval);
        
        this._updateInterval = setInterval(() => {
            if (!this._isPlaying || !this.audioBuffer || !this.sourceNode) return;
            
            // Calculate actual audio position:
            // elapsed in context time * effective playbackRate = elapsed in audio time
            const effectiveRate = this._tempo * this._syncRateAdjustment;
            const elapsedCtx = this.audioCtx.currentTime - this._startCtxTime;
            const elapsedAudioSec = elapsedCtx * effectiveRate;
            const startSec = this._startTime / 1000;
            const currentSec = startSec + elapsedAudioSec;
            const currentMs = currentSec * 1000;
            
            // Check end limit
            if (this._endTime > 0 && currentMs >= this._endTime) {
                this.stop();
                if (this._onEnd) this._onEnd();
                return;
            }
            
            if (this._onTimeUpdate) {
                const progress = currentSec / this.audioBuffer.duration;
                this._onTimeUpdate(currentSec, Math.min(progress, 1));
            }
        }, 50);
    }

    pause(atPositionMs?: number) {
        if (!this._isPlaying) {
            if (atPositionMs !== undefined) this._startTime = atPositionMs;
            return;
        }
        
        if (atPositionMs !== undefined) {
            this._startTime = atPositionMs;
        } else {
            // Capture current position before stopping
            const effectiveRate = this._tempo * this._syncRateAdjustment;
            const elapsedCtx = this.audioCtx.currentTime - this._startCtxTime;
            const elapsedAudioSec = elapsedCtx * effectiveRate;
            this._startTime += elapsedAudioSec * 1000;
        }

        // Stop and dispose source
        if (this.sourceNode) {
            this._endedByUs = true;
            console.log("[PitchEngine] Setting _endedByUs=true, stopping sourceNode (requested pos:", atPositionMs, ")");
            try { this.sourceNode.stop(); } catch (e) {
                console.debug("[PitchEngine] sourceNode stop error during pause():", e);
            }
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        
        this._isPlaying = false;
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
            this._updateInterval = null;
        }
    }

    stop() {
        console.log("[PitchEngine] stop() called");
        this.pause();
        this._startTime = 0;
    }

    seekToTime(seconds: number) {
        const wasPlaying = this._isPlaying;
        if (wasPlaying) this.pause();
        
        this._startTime = seconds * 1000;
        
        if (wasPlaying) {
            void this.play();
        } else if (this._onTimeUpdate && this.audioBuffer) {
            this._onTimeUpdate(seconds, seconds / this.audioBuffer.duration);
        }
    }

    set pitchSemitones(v: number) {
        console.log("[PitchEngine] pitchSemitones setter:", v, "hasNode:", !!this.soundtouchNode, "node.pitchSemitones:", !!this.soundtouchNode?.pitchSemitones);
        this._pitchSemitones = v;
        if (this.soundtouchNode?.pitchSemitones) {
            this.soundtouchNode.pitchSemitones.value = v;
            console.log("[PitchEngine] pitchSemitones.value set to:", this.soundtouchNode.pitchSemitones.value);
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
        const effectiveRate = this._tempo * this._syncRateAdjustment;
        const now = this.audioCtx.currentTime;
        
        if (this.soundtouchNode?.playbackRate) {
            this.soundtouchNode.playbackRate.setTargetAtTime(effectiveRate, now, 0.02);
        }
        if (this.sourceNode) {
            this.sourceNode.playbackRate.setTargetAtTime(effectiveRate, now, 0.02);
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
        this.gainNode.disconnect();
        if (this.soundtouchNode) {
            this.soundtouchNode.disconnect();
            this.soundtouchNode = null;
        }
        this.audioBuffer = null;
    }
}

let _previewInstance: PitchEngine | null = null;
export function getPitchEngine(): PitchEngine {
    if (!_previewInstance) _previewInstance = new PitchEngine();
    return _previewInstance;
}
