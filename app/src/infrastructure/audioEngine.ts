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
  private source: AudioBufferSourceNode | null = null
  private _position = 0
  private _duration = 0
  private _startedAt = 0
  private _pausedAt = 0
  private _status: EngineStatus = 'idle'
  private _pitch = 0
  private _tempo = 1
  private _volume = 1
  private gain: GainNode
  private onStateChange?: (state: EngineState) => void

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
    this._duration = buffer.duration
    this._position = 0
    this._pausedAt = 0
    this._status = 'loading'
    this.emit()

    // store buffer for later playback
    this.source = this.ctx.createBufferSource()
    this.source.buffer = buffer
    this.source.connect(this.gain)
    this.source.onended = () => {
      if (this._status === 'playing') {
        this._status = 'idle'
        this._position = this._duration
        this.emit()
      }
    }

    this._status = 'idle'
    this.emit()
  }

  play(): void {
    if (!this.source) return
    if (this._status === 'playing') return

    if (this._pausedAt > 0) {
      // resume from pause — needs a new source
      this._resumeFromPause()
      return
    }

    this._startedAt = this.ctx.currentTime
    this.source!.start(0, this._position)
    this._status = 'playing'
    this.emit()
  }

  private _resumeFromPause(): void {
    const buffer = this.source!.buffer
    if (!buffer) return

    const newSource = this.ctx.createBufferSource()
    newSource.buffer = buffer
    newSource.connect(this.gain)
    newSource.onended = this.source!.onended
    newSource.start(0, this._pausedAt)

    this.source = newSource
    this._startedAt = this.ctx.currentTime
    this._status = 'playing'
    this.emit()
  }

  pause(): void {
    if (this._status !== 'playing') return
    this._pausedAt = this._position + (this.ctx.currentTime - this._startedAt)
    this.source?.stop()
    this._status = 'paused'
    this.emit()
  }

  stop(): void {
    this.source?.stop()
    this.source?.disconnect()
    this.source = null
    this._position = 0
    this._pausedAt = 0
    this._status = 'idle'
    this.emit()
  }

  seek(position: number): void {
    if (!this.source?.buffer) return
    const wasPlaying = this._status === 'playing'
    if (wasPlaying) {
      this.source.stop()
    }
    this._position = Math.min(position, this._duration)
    this._pausedAt = this._position
    if (wasPlaying) {
      this._resumeFromPause()
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
    // TODO: PR 2 — wire to AudioWorklet + WASM
    this.emit()
  }

  setTempo(ratio: number): void {
    this._tempo = Math.max(0.5, Math.min(2, ratio))
    // TODO: PR 2 — wire to AudioWorklet + WASM
    this.emit()
  }

  get currentTime(): number {
    if (this._status === 'playing') {
      return this._position + (this.ctx.currentTime - this._startedAt)
    }
    return this._pausedAt
  }

  destroy(): void {
    this.stop()
    this.ctx.close()
  }
}
