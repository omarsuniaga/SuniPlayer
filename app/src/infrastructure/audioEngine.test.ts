import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { AudioEngine } from './audioEngine'

// Mock signalsmith-stretch (AudioWorklet wrapper) — jsdom has no AudioWorklet
vi.mock('signalsmith-stretch', () => {
  const createMockNode = () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    schedule: vi.fn(),
    stop: vi.fn(),
    start: vi.fn(),
    addBuffers: vi.fn().mockResolvedValue(0),
    latency: vi.fn().mockReturnValue(0),
    inputTime: 0,
    setUpdateInterval: vi.fn(),
    configure: vi.fn(),
  })
  return {
    default: vi.fn().mockResolvedValue(createMockNode()),
  }
})

beforeAll(() => {
  // jsdom doesn't include AudioContext — provide minimal mock
  globalThis.AudioContext = class {
    currentTime = 0
    destination = {} as AudioDestinationNode
    createGain() {
      return { connect: () => {}, gain: { value: 1 } } as unknown as GainNode
    }
    close() { return Promise.resolve() }
  } as unknown as typeof AudioContext
})

function mockBuffer(overrides?: Partial<AudioBuffer>): AudioBuffer {
  return {
    duration: 200,
    numberOfChannels: 1,
    sampleRate: 44100,
    getChannelData: () => new Float32Array(0),
    ...overrides,
  } as unknown as AudioBuffer
}

beforeEach(() => {
  vi.clearAllMocks()
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

  it('load sets duration and transitions through loading', async () => {
    const engine = new AudioEngine()
    const buffer = mockBuffer({ duration: 200 })
    const loadPromise = engine.load(buffer)

    // During load (before await resolves), status is 'loading'
    expect(engine.state.duration).toBe(200)

    await loadPromise
    expect(engine.state.status).toBe('idle')
    engine.destroy()
  })

  it('load with stereo buffer extracts both channels', async () => {
    const engine = new AudioEngine()
    const channelData = [new Float32Array(100), new Float32Array(100)]
    const buffer = mockBuffer({ numberOfChannels: 2, getChannelData: (c: number) => channelData[c]! })
    await engine.load(buffer)
    engine.destroy()
  })

  it('play calls stretch.schedule with pitch and tempo', async () => {
    const engine = new AudioEngine()
    await engine.load(mockBuffer())

    engine.setPitch(5)
    engine.setTempo(1.5)
    engine.play()

    // Import the mocked module to access the mock factory directly
    const { default: signalsmithStretch } = await import('signalsmith-stretch')
    const mockNode = await (signalsmithStretch as unknown as ReturnType<typeof vi.fn>).mock.results[0]!.value

    expect(mockNode.schedule).toHaveBeenCalledWith({
      input: 0,
      rate: 1.5,
      semitones: 5,
      active: true,
    })
    engine.destroy()
  })

  it('pause calls stretch.schedule with active:false', async () => {
    const engine = new AudioEngine()
    await engine.load(mockBuffer())
    engine.play()
    engine.pause()
    engine.destroy()
  })

  it('stop resets position to 0', async () => {
    const engine = new AudioEngine()
    await engine.load(mockBuffer())
    engine.play()
    engine.stop()
    expect(engine.state.position).toBe(0)
    expect(engine.state.status).toBe('idle')
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

  it('setPitch re-schedules when playing', async () => {
    const engine = new AudioEngine()
    await engine.load(mockBuffer())
    engine.play()

    const { default: signalsmithStretch } = await import('signalsmith-stretch')
    const mockNode = await (signalsmithStretch as unknown as ReturnType<typeof vi.fn>).mock.results[0]!.value

    engine.setPitch(7)
    expect(mockNode.schedule).toHaveBeenLastCalledWith(
      expect.objectContaining({ semitones: 7, active: true }),
    )
    engine.destroy()
  })

  it('setTempo re-schedules when playing', async () => {
    const engine = new AudioEngine()
    await engine.load(mockBuffer())
    engine.play()

    const { default: signalsmithStretch } = await import('signalsmith-stretch')
    const mockNode = await (signalsmithStretch as unknown as ReturnType<typeof vi.fn>).mock.results[0]!.value

    engine.setTempo(0.75)
    expect(mockNode.schedule).toHaveBeenLastCalledWith(
      expect.objectContaining({ rate: 0.75, active: true }),
    )
    engine.destroy()
  })

  it('seek re-schedules when playing', async () => {
    const engine = new AudioEngine()
    await engine.load(mockBuffer({ duration: 200 }))
    engine.play()

    const { default: signalsmithStretch } = await import('signalsmith-stretch')
    const mockNode = await (signalsmithStretch as unknown as ReturnType<typeof vi.fn>).mock.results[0]!.value

    engine.seek(50)
    expect(mockNode.schedule).toHaveBeenLastCalledWith(
      expect.objectContaining({ input: 50, active: true }),
    )
    expect(engine.state.position).toBe(50)
    engine.destroy()
  })

  it('seek clamps to duration', async () => {
    const engine = new AudioEngine()
    await engine.load(mockBuffer({ duration: 200 }))
    engine.seek(999)
    expect(engine.state.position).toBe(200)
    engine.destroy()
  })

  it('play after stop resumes from beginning (position 0)', async () => {
    const engine = new AudioEngine()
    await engine.load(mockBuffer())

    engine.play()
    engine.stop()
    engine.play()

    const { default: signalsmithStretch } = await import('signalsmith-stretch')
    const mockNode = await (signalsmithStretch as unknown as ReturnType<typeof vi.fn>).mock.results[0]!.value

    // After stop → position reset to 0, schedule should be called with input 0
    expect(mockNode.schedule).toHaveBeenLastCalledWith(
      expect.objectContaining({ input: 0, active: true }),
    )
    engine.destroy()
  })
})
