import SignalsmithStretch from 'signalsmith-stretch'
import type { SignalsmithStretchNode } from 'signalsmith-stretch'

export type EngineStatus = 'idle' | 'loading' | 'playing' | 'paused'

export type EngineState = {
  status: EngineStatus
  position: number
  duration: number
  pitch: number // semitones, 0 = original
  tempo: number // 1.0 = original, 0.5-2.0
  volume: number // 0-1
}

export type EngineCommand =
  | { type: 'load'; buffer: AudioBuffer }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'stop' }
  | { type: 'seek'; position: number }
  | { type: 'set-pitch'; semitones: number }
  | { type: 'set-tempo'; ratio: number }
  | { type: 'set-volume'; volume: number }

export class AudioEngine {
  private ctx: AudioContext
  private stretch: SignalsmithStretchNode | null = null
  private _position = 0
  private _duration = 0
  private _status: EngineStatus = 'idle'
  private _pitch = 0
  private _tempo = 1
  private _volume = 1
  private gain: GainNode
  private onStateChange?: (state: EngineState) => void
  private _hasBuffer = false

  constructor(onStateChange?: (state: EngineState) => void) {
    this.ctx = new AudioContext()
    this.gain = this.ctx.createGain()
    this.gain.connect(this.ctx.destination)
    this.onStateChange = onStateChange
  }

  get state(): EngineState {
    return {
      status: this._status,
      position: this._position,
      duration: this._duration,
      pitch: this._pitch,
      tempo: this._tempo,
      volume: this._volume,
    }
  }

  private emit() {
    this.onStateChange?.(this.state)
  }

  async load(buffer: AudioBuffer): Promise<void> {
    // Clean up previous stretch node
    if (this.stretch) {
      this.stretch.disconnect()
      this.stretch = null
    }

    this._duration = buffer.duration
    this._position = 0
    this._hasBuffer = false
    this._status = 'loading'
    this.emit()

    // Extract per-channel audio data (supports stereo+)
    const channels: Float32Array[] = []
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      channels.push(buffer.getChannelData(c))
    }

    // Create signalsmith-stretch AudioWorklet node
    this.stretch = await SignalsmithStretch(this.ctx, {
      outputChannelCount: [buffer.numberOfChannels],
    })
    await this.stretch.addBuffers(channels)
    this.stretch.connect(this.gain)

    // Track playback progress via stretch's input position
    this.stretch.setUpdateInterval(0.05, (inputTime: number) => {
      if (this._status === 'playing') {
        this._position = inputTime
        if (inputTime >= this._duration - 0.01) {
          this._status = 'idle'
          this.emit()
        }
      }
    })

    this._hasBuffer = true
    this._status = 'idle'
    this.emit()
  }

  play(): void {
    if (!this.stretch || !this._hasBuffer) return
    if (this._status === 'playing') return

    this.stretch.schedule({
      input: this._position,
      rate: this._tempo,
      semitones: this._pitch,
      active: true,
    })
    this._status = 'playing'
    this.emit()
  }

  pause(): void {
    if (this._status !== 'playing') return
    this.stretch?.schedule({ active: false })
    this._status = 'paused'
    this.emit()
  }

  stop(): void {
    if (this._status === 'idle') return
    this.stretch?.schedule({ active: false })
    this._position = 0
    this._status = 'idle'
    this.emit()
  }

  seek(position: number): void {
    if (!this._hasBuffer) return
    this._position = Math.min(position, this._duration)
    if (this._status === 'playing') {
      this.stretch?.schedule({
        input: this._position,
        rate: this._tempo,
        semitones: this._pitch,
        active: true,
      })
    }
    this.emit()
  }

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v))
    this.gain.gain.value = this._volume
    this.emit()
  }

  setPitch(semitones: number): void {
    this._pitch = Math.max(-12, Math.min(12, semitones))
    if (this._status === 'playing') {
      this.stretch?.schedule({
        input: this._position,
        rate: this._tempo,
        semitones: this._pitch,
        active: true,
      })
    }
    this.emit()
  }

  setTempo(ratio: number): void {
    this._tempo = Math.max(0.5, Math.min(2, ratio))
    if (this._status === 'playing') {
      this.stretch?.schedule({
        input: this._position,
        rate: this._tempo,
        semitones: this._pitch,
        active: true,
      })
    }
    this.emit()
  }

  /** Current playback position in seconds. Updated by stretch callback during playback. */
  get currentTime(): number {
    return this._position
  }

  /** The engine's AudioContext — shared for decoding and playback. */
  get context(): AudioContext {
    return this.ctx
  }

  /** Whether a buffer is loaded and ready to play. */
  get hasBuffer(): boolean {
    return this._hasBuffer
  }

  /** Update the state change callback (e.g., after hook re-mount). */
  setStateChangeHandler(handler: ((state: EngineState) => void) | undefined): void {
    this.onStateChange = handler
  }

  destroy(): void {
    this.stretch?.stop()
    this.stretch?.disconnect()
    this.stretch = null
    this._hasBuffer = false
    this.ctx.close()
  }
}
