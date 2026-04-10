import TrackPlayer, {
  Event,
  Capability,
  State,
  IOSCategory,
  IOSCategoryMode,
  IOSCategoryOptions,
  AndroidAudioContentType,
  AppKilledPlaybackBehavior,
} from 'react-native-track-player';
import { usePlayerStore } from '@suniplayer/core';
import type { IAudioEngine, AudioLoadOptions } from '@suniplayer/core';

export class ExpoAudioEngine implements IAudioEngine {
  private _positionListener: ((posMs: number) => void) | null = null;
  private _bufferListener: ((bufferedMs: number) => void) | null = null;
  private _bufferingListener: ((isBuffering: boolean) => void) | null = null;
  private _endedListener: (() => void) | null = null;
  private _errorListener: ((err: Error) => void) | null = null;
  private _subscriptions: Array<{ remove: () => void }> = [];
  private _initialized = false;
  private _initializingPromise: Promise<void> | null = null;
  private _currentRate: number = 1.0;
  private _isPlaying: boolean = false;
  private _currentUrl: string | null = null;

  // Analytics state
  private _lastTrackId: string | null = null;
  private _lastPos: number = 0;
  private _lastDur: number = 0;

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get durationMs(): number {
    return this._lastDur * 1000;
  }

  get currentUrl(): string | null {
    return this._currentUrl;
  }

  private async _ensureInitialized(): Promise<void> {
    if (this._initialized) return;
    if (this._initializingPromise) return this._initializingPromise;

    this._initializingPromise = (async () => {
      try {
        await TrackPlayer.setupPlayer({
          maxCacheSize: 1024 * 50,          // 50 MB cache (era 5 MB)
          progressUpdateEventInterval: 0.25,
          // Buffer config para audio limpio en background (Modo Turbo - Prioridad Latencia)
          minBuffer: 30,                     // 30s mínimo en buffer antes de reproducir
          maxBuffer: 60,                     // 60s máximo en buffer
          playBuffer: 2.5,                   // 2.5s antes de iniciar
          backBuffer: 10,                    // 10s buffer detrás (más ligero en RAM)
          // Interrupciones automáticas (llamadas, alarmas)
          autoHandleInterruptions: true,
          // iOS Audio Session — Playback category para no ser cortado por otros
          iosCategory: IOSCategory.Playback,
          iosCategoryMode: IOSCategoryMode.Default,
          iosCategoryOptions: [IOSCategoryOptions.AllowBluetooth, IOSCategoryOptions.AllowBluetoothA2DP],
          // Android — contenido de tipo música
          androidAudioContentType: AndroidAudioContentType.Music,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.Stop,
          ],
          // iOS: evitar que el sistema pause cuando la app va a background
          stoppingAppPausesPlayback: false,
          // Android: si el usuario cierra la app manualmente, parar el audio
          android: {
            appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
          },
        });

        this._initialized = true;
        this._attachListeners();
      } finally {
        this._initializingPromise = null;
      }
    })();

    return this._initializingPromise;
  }

  private _attachListeners(): void {
    this._subscriptions = [
      TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, ({ position, duration, buffered }: { position: number; duration: number; buffered: number }) => {
        this._positionListener?.(position * 1000);
        this._bufferListener?.(buffered * 1000);
        this._lastPos = position;
        if (duration > 0) this._lastDur = duration;
      }),
      TrackPlayer.addEventListener(Event.PlaybackState, ({ state }: { state: State }) => {
        this._isPlaying = state === State.Playing;
        const isBuffering = state === State.Buffering || state === State.Loading;
        this._bufferingListener?.(isBuffering);

        // Track Start Hook
        if (state === State.Playing && this._lastTrackId) {
          usePlayerStore.getState().trackStart(this._lastTrackId);
        }
      }),
      TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
        if (this._lastTrackId) {
          usePlayerStore.getState().trackEnd(this._lastTrackId, this._lastPos * 1000);
        }
        this._endedListener?.();
      }),
      TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (evt: any) => {
        // Equivalent to playback-track-changed in RNTP v4
        // Check if previous track was skipped (< 30% duration)
        if (evt.lastTrack && evt.lastTrack.id) {
          const lastId = evt.lastTrack.id;
          const pos = evt.lastPosition || this._lastPos;
          const dur = evt.lastTrack.duration || this._lastDur;
          
          if (dur > 0 && (pos / dur) < 0.3 && pos > 1) {
            console.log(`[ExpoAudioEngine] ⏭️ Track skipped (<30%): ${lastId} at ${pos}s / ${dur}s`);
            usePlayerStore.getState().trackSkip(lastId, pos * 1000);
          }
        }
      }),
      TrackPlayer.addEventListener(Event.PlaybackError, ({ message }: { message: string }) => {
        this._errorListener?.(new Error(message));
      }),
      // NOTE: Event.PlaybackInterruption no existe en RNTP v4.1.2.
      // RemoteDuck es el equivalente: se dispara por llamadas, alarmas, etc.
      // autoHandleInterruptions=true ya maneja pause/resume automáticamente.
      // Este listener solo sincroniza la UI cuando la interrupción es permanente.
      TrackPlayer.addEventListener(Event.RemoteDuck, ({ permanent, paused }: { permanent: boolean; paused: boolean }) => {
        console.log('[ExpoAudioEngine] RemoteDuck — permanent:', permanent, 'paused:', paused);
        if (permanent) {
          // Interrupción permanente (ej: llamada que sigue) — notificamos al listener para que la UI sepa que paró
          this._endedListener?.();
        }
      }),
    ];
  }

  async load(url: string, options?: AudioLoadOptions): Promise<void> {
    await this._ensureInitialized();

    // Reset analytics for new track
    if (this._lastTrackId && this._lastDur > 0 && (this._lastPos / this._lastDur) < 0.3 && this._lastPos > 1) {
       // Manual skip check if queue didn't handle it
       usePlayerStore.getState().trackSkip(this._lastTrackId, this._lastPos * 1000);
    }

    this._lastTrackId = options?.id ?? null;
    this._lastPos = 0;
    this._lastDur = (options?.duration ?? 0) / 1000;
    this._currentUrl = url;

    // Reset queue before loading a new track so we don't accumulate phantom items.
    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: options?.id,
      url,
      title: options?.title ?? '',
      artist: options?.artist ?? '',
      artwork: options?.artwork,
      duration: options?.duration ? options.duration / 1000 : undefined,
    });
    if (options?.initialVolume !== undefined) await TrackPlayer.setVolume(options.initialVolume);
    if (options?.initialTempo !== undefined) await TrackPlayer.setRate(options.initialTempo);
    if (options?.startMs !== undefined) await TrackPlayer.seekTo(options.startMs / 1000);
  }

  /** Call once at app startup to boot the native service early. */
  async init(): Promise<void> {
    await this._ensureInitialized();
  }

  private _fadeInterval: ReturnType<typeof setInterval> | null = null;

  async play(): Promise<void> { await TrackPlayer.play(); }

  async playAt(targetTimeMs: number, positionMs: number): Promise<void> {
    await this.seek(positionMs);
    
    const now = performance.now();
    const delay = targetTimeMs - now;

    console.log(`[ExpoAudioEngine] playAt scheduled in ${delay.toFixed(2)}ms`);

    if (delay <= 0) {
      await TrackPlayer.play();
    } else {
      // Temporary JS fallback. For sub-10ms precision, this should move to 
      // a native module using mach_absolute_time (iOS) or System.nanoTime (Android).
      setTimeout(async () => {
        await TrackPlayer.play();
      }, delay);
    }
  }

  pause(): void { TrackPlayer.pause(); }
  seek(positionMs: number): void { TrackPlayer.seekTo(positionMs / 1000); }

  async getPosition(): Promise<number> {
    const seconds = await TrackPlayer.getPosition();
    return seconds * 1000;
  }

  async fadeVolume(target: number, durationMs: number): Promise<void> {
    if (this._fadeInterval) {
      clearInterval(this._fadeInterval);
      this._fadeInterval = null;
    }
    
    if (durationMs <= 50) {
      await TrackPlayer.setVolume(target);
      return;
    }

    const startVol = await TrackPlayer.getVolume();
    const steps = Math.floor(durationMs / 50);
    const stepDelta = (target - startVol) / steps;
    let currentStep = 0;

    return new Promise((resolve) => {
      this._fadeInterval = setInterval(() => {
        currentStep++;
        const newVol = Math.max(0, Math.min(1, startVol + (stepDelta * currentStep)));
        TrackPlayer.setVolume(newVol); // fire and forget — no await needed

        if (currentStep >= steps) {
          if (this._fadeInterval) clearInterval(this._fadeInterval);
          this._fadeInterval = null;
          resolve();
        }
      }, 50);
    });
  }

  setPitch(_semitones: number): void {
    // react-native-track-player v4 does not support independent pitch shift.
    // Real pitch shift requires an external DSP library (e.g. soundtouchjs).
    // This method is intentionally a no-op. Do NOT simulate via setRate —
    // that changes tempo too, which is musically incorrect.
    console.warn('[ExpoAudioEngine] setPitch: pitch shift not supported natively in RNTP v4. Semitones:', _semitones);
  }

  setTempo(rate: number): void {
    this._currentRate = rate;
    this._updateEffectiveRate();
  }

  /** 
   * Internal rate adjustment for sync. 
   * In RNTP, this must be combined with user tempo.
   */
  private _syncRateAdjustment: number = 1.0;
  setPlaybackRate(rate: number): void {
    this._syncRateAdjustment = rate;
    this._updateEffectiveRate();
  }

  private _updateEffectiveRate(): void {
    const effectiveRate = this._currentRate * this._syncRateAdjustment;
    TrackPlayer.setRate(effectiveRate);
  }

  setVolume(volume: number): void {
    // Clamp to [0, 1] — security: no amplification beyond system level
    TrackPlayer.setVolume(Math.max(0, Math.min(1, volume)));
  }
  onPositionUpdate(cb: (posMs: number) => void): void { this._positionListener = cb; }
  onBufferUpdate(cb: (bufferedMs: number) => void): void { this._bufferListener = cb; }
  onBufferingChange(cb: (isBuffering: boolean) => void): void { this._bufferingListener = cb; }
  onEnded(cb: () => void): void { this._endedListener = cb; }
  onError(cb: (err: Error) => void): void { this._errorListener = cb; }
  dispose(): void {
    if (this._fadeInterval) clearInterval(this._fadeInterval);
    this._fadeInterval = null;
    this._subscriptions.forEach(s => s.remove());
    this._subscriptions = [];
    this._positionListener = null;
    this._bufferListener = null;
    this._bufferingListener = null;
    this._endedListener = null;
    this._errorListener = null;
  }
}
