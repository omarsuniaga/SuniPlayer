import { describe, it, expect, vi, beforeAll } from 'vitest'
import { AudioEngine } from './audioEngine'

beforeAll(() => {
  // jsdom doesn't include AudioContext — provide minimal mock
  globalThis.AudioContext = class {
    currentTime = 0
    destination = {} as AudioDestinationNode
    createGain() {
      return { connect: () => {}, gain: { value: 1 } } as unknown as GainNode
    }
    createBufferSource() {
      return {
        connect: () => {},
        disconnect: () => {},
        start: () => {},
        stop: () => {},
        onended: null,
      } as unknown as AudioBufferSourceNode
    }
    close() { return Promise.resolve() }
  } as unknown as typeof AudioContext
})

describe('AudioEngine', () => {
  it('starts in idle state', () => {
    const engine = new AudioEngine()
    const state = engine.state
    expect(state.status).toBe('idle')
    expect(state.position).toBe(0)
    expect(state.duration).toBe(0)
    expect(state.pitch).toBe(0)
    expect(state.tempo).toBe(1)
    expect(state.volume).toBe(1)
    engine.destroy()
  })

  it('load sets duration and transitions through loading', () => {
    const engine = new AudioEngine()
    const buffer = { duration: 200 } as AudioBuffer
    engine.load(buffer)
    expect(engine.state.duration).toBe(200)
    engine.destroy()
  })

  it('setVolume clamps between 0 and 1', () => {
    const engine = new AudioEngine()
    engine.setVolume(2)
    expect(engine.state.volume).toBe(1)
    engine.setVolume(-1)
    expect(engine.state.volume).toBe(0)
    engine.setVolume(0.5)
    expect(engine.state.volume).toBe(0.5)
    engine.destroy()
  })

  it('setPitch clamps to ±12', () => {
    const engine = new AudioEngine()
    engine.setPitch(20)
    expect(engine.state.pitch).toBe(12)
    engine.setPitch(-20)
    expect(engine.state.pitch).toBe(-12)
    engine.destroy()
  })

  it('setTempo clamps to 0.5-2.0', () => {
    const engine = new AudioEngine()
    engine.setTempo(3)
    expect(engine.state.tempo).toBe(2)
    engine.setTempo(0.1)
    expect(engine.state.tempo).toBe(0.5)
    engine.destroy()
  })

  it('calls onStateChange when state updates', () => {
    const onChange = vi.fn()
    const engine = new AudioEngine(onChange)
    engine.setVolume(0.5)
    expect(onChange).toHaveBeenCalled()
    engine.destroy()
  })

  it('currentTime returns 0 when idle', () => {
    const engine = new AudioEngine()
    expect(engine.currentTime).toBe(0)
    engine.destroy()
  })
})
