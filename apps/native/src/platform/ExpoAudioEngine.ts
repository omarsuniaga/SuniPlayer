import TrackPlayer, { Event } from 'react-native-track-player';
import type { IAudioEngine, AudioLoadOptions } from '@suniplayer/core';

export class ExpoAudioEngine implements IAudioEngine {
  private _positionListener: ((posMs: number) => void) | null = null;
  private _endedListener: (() => void) | null = null;
  private _errorListener: ((err: Error) => void) | null = null;
  private _subscriptions: Array<{ remove: () => void }> = [];
  private _initialized = false;

  private async _ensureInitialized(): Promise<void> {
    if (this._initialized) return;
    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 5,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      progressUpdateEventInterval: 0.25, // fire PlaybackProgressUpdated every 250 ms
    } as any);
    this._initialized = true;
    this._attachListeners();
  }

  private _attachListeners(): void {
    this._subscriptions = [
      TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, ({ position }: { position: number }) => {
        this._positionListener?.(position * 1000);
      }),
      TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
        this._endedListener?.();
      }),
      TrackPlayer.addEventListener(Event.PlaybackError, ({ message }: { message: string }) => {
        this._errorListener?.(new Error(message));
      }),
    ];
  }

  async load(url: string, options?: AudioLoadOptions): Promise<void> {
    await this._ensureInitialized();
    // Reset queue before loading a new track so we don't accumulate phantom items.
    await TrackPlayer.reset();
    await TrackPlayer.add({ url, title: '', artist: '' });
    if (options?.initialVolume !== undefined) await TrackPlayer.setVolume(options.initialVolume);
    if (options?.initialTempo !== undefined) await TrackPlayer.setRate(options.initialTempo);
    if (options?.startMs !== undefined) await TrackPlayer.seekTo(options.startMs / 1000);
  }

  /** Call once at app startup to boot the native service early. */
  async init(): Promise<void> {
    await this._ensureInitialized();
  }

  async play(): Promise<void> { await TrackPlayer.play(); }
  pause(): void { TrackPlayer.pause(); }
  seek(positionMs: number): void { TrackPlayer.seekTo(positionMs / 1000); }
  // Note: react-native-track-player does not support pitch shifting natively.
  // setPitch is a no-op in v1. Will be implemented with a DSP library in v2.
  setPitch(_semitones: number): void { /* TODO v2: DSP pitch shift */ }
  setTempo(rate: number): void { TrackPlayer.setRate(rate); }
  setVolume(volume: number): void {
    // Clamp to [0, 1] — security: no amplification beyond system level
    TrackPlayer.setVolume(Math.max(0, Math.min(1, volume)));
  }
  onPositionUpdate(cb: (posMs: number) => void): void { this._positionListener = cb; }
  onEnded(cb: () => void): void { this._endedListener = cb; }
  onError(cb: (err: Error) => void): void { this._errorListener = cb; }
  dispose(): void {
    this._subscriptions.forEach(s => s.remove());
    this._subscriptions = [];
    this._positionListener = null;
    this._endedListener = null;
    this._errorListener = null;
  }
}
