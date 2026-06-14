import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioEngine, _resetEngineForTest } from './useAudioEngine'
import { usePlayerStore } from '../../application/playerStore'
import { useWaveformStore } from '../../application/waveformStore'

// Hoisted mocks — defined before vi.mock calls so factories can reference them
const {
  mockDecode, mockPlay, mockPause, mockStop, mockSeek, mockLoad,
  mockSetPitch, mockSetTempo, mockSetVolume, mockDestroy, mockSetOnStateChange,
  mockResume, mockContext,
} = vi.hoisted(() => ({
  mockDecode: vi.fn(),
  mockPlay: vi.fn(),
  mockPause: vi.fn(),
  mockStop: vi.fn(),
  mockSeek: vi.fn(),
  mockLoad: vi.fn(),
  mockSetPitch: vi.fn(),
  mockSetTempo: vi.fn(),
  mockSetVolume: vi.fn(),
  mockDestroy: vi.fn(),
  mockSetOnStateChange: vi.fn(),
  mockResume: vi.fn(),
  mockContext: {
    state: 'running',
    resume: vi.fn(),
    decodeAudioData: vi.fn(),
  },
}))

vi.mock('../../infrastructure/audioEngine', () => {
  function MockAudioEngine() {}
  MockAudioEngine.prototype.play = mockPlay
  MockAudioEngine.prototype.pause = mockPause
  MockAudioEngine.prototype.stop = mockStop
  MockAudioEngine.prototype.seek = mockSeek
  MockAudioEngine.prototype.load = mockLoad
  MockAudioEngine.prototype.setPitch = mockSetPitch
  MockAudioEngine.prototype.setTempo = mockSetTempo
  MockAudioEngine.prototype.setVolume = mockSetVolume
  MockAudioEngine.prototype.destroy = mockDestroy
  MockAudioEngine.prototype.setStateChangeHandler = mockSetOnStateChange
  MockAudioEngine.prototype.context = mockContext
  Object.defineProperty(MockAudioEngine.prototype, 'hasBuffer', {
    get: () => true,
    configurable: true,
  })
  return { AudioEngine: MockAudioEngine }
})

vi.mock('../../infrastructure/dexie', () => ({
  trackRepo: { get: vi.fn() },
}))

function makeTrack(overrides: Partial<{
  id: string; title: string; artist: string; durationSeconds: number;
  filePath: string; fileBlob: Blob | undefined; playCount: number;
  createdAt: Date; updatedAt: Date;
}> = {}) {
  const now = new Date()
  return {
    id: 'track-1', title: 'Test Song', artist: 'Test Artist',
    durationSeconds: 240, filePath: 'test.mp3',
    fileBlob: new Blob([new ArrayBuffer(100)]),
    playCount: 0, createdAt: now, updatedAt: now,
    ...overrides,
  } as any // cast to PersistedTrack for tests
}

function mockRepoGet() {
  // Access the mocked module — vi.mock is hoisted so dynamic import gets mock
  return import('../../infrastructure/dexie').then(({ trackRepo }) =>
    vi.mocked(trackRepo.get)
  )
}

describe('useAudioEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePlayerStore.getState().reset()
    useWaveformStore.getState().clear()
    _resetEngineForTest()
    // Default mock returns
    mockContext.state = 'running'
    mockContext.resume = mockResume
    mockContext.decodeAudioData = mockDecode
    mockResume.mockResolvedValue(undefined)
    mockDecode.mockResolvedValue({
      duration: 240,
      numberOfChannels: 2,
      sampleRate: 44100,
      getChannelData: () => new Float32Array(100),
      length: 100,
    })
    mockLoad.mockResolvedValue(undefined)
  })

  afterEach(() => {
    _resetEngineForTest()
  })

  it('provides engine controls', () => {
    const { result } = renderHook(() => useAudioEngine())
    expect(result.current.play).toBeInstanceOf(Function)
    expect(result.current.pause).toBeInstanceOf(Function)
    expect(result.current.stop).toBeInstanceOf(Function)
    expect(result.current.stopAll).toBeInstanceOf(Function)
    expect(result.current.seek).toBeInstanceOf(Function)
    expect(result.current.playTrack).toBeInstanceOf(Function)
    expect(result.current.loading).toBe('idle')
    expect(result.current.error).toBeNull()
  })

  it('play calls engine.play and store.play', async () => {
    const { result } = renderHook(() => useAudioEngine())
    await act(async () => {
      await result.current.play()
    })
    expect(mockPlay).toHaveBeenCalledTimes(1)
    expect(usePlayerStore.getState().playing).toBe(true)
  })


  it('play resumes suspended AudioContext before playing', async () => {
    mockContext.state = 'suspended'
    const { result } = renderHook(() => useAudioEngine())

    await act(async () => {
      await result.current.play()
    })

    expect(mockResume).toHaveBeenCalledTimes(1)
    expect(mockResume.mock.invocationCallOrder[0]!).toBeLessThan(mockPlay.mock.invocationCallOrder[0]!)
  })

  it('play reports resume errors and reverts store state', async () => {
    mockContext.state = 'suspended'
    mockResume.mockRejectedValue(new Error('autoplay blocked'))
    const { result } = renderHook(() => useAudioEngine())

    await act(async () => {
      await result.current.play()
    })

    expect(result.current.error).toContain('autoplay blocked')
    expect(usePlayerStore.getState().playing).toBe(false)
  })

  it('pause calls engine.pause and store.pause', () => {
    usePlayerStore.getState().play()
    const { result } = renderHook(() => useAudioEngine())
    act(() => result.current.pause())
    expect(mockPause).toHaveBeenCalledTimes(1)
    expect(usePlayerStore.getState().playing).toBe(false)
  })

  it('stop calls engine.stop and store.stop', () => {
    usePlayerStore.getState().play()
    const { result } = renderHook(() => useAudioEngine())
    act(() => result.current.stop())
    expect(mockStop).toHaveBeenCalledTimes(1)
    expect(usePlayerStore.getState().playing).toBe(false)
    expect(usePlayerStore.getState().position).toBe(0)
  })

  it('stopAll calls stop and pauses stray DOM audio/video elements', () => {
    const audioEl = document.createElement('audio')
    const pauseSpy = vi.spyOn(audioEl, 'pause')
    document.body.appendChild(audioEl)

    usePlayerStore.getState().play()
    const { result } = renderHook(() => useAudioEngine())
    act(() => result.current.stopAll())
    expect(mockStop).toHaveBeenCalledTimes(1)
    expect(usePlayerStore.getState().playing).toBe(false)
    expect(usePlayerStore.getState().position).toBe(0)
    expect(pauseSpy).toHaveBeenCalledTimes(1)

    document.body.removeChild(audioEl)
  })

  it('seek calls engine.seek and store.seek', () => {
    const { result } = renderHook(() => useAudioEngine())
    act(() => result.current.seek(60))
    expect(mockSeek).toHaveBeenCalledWith(60)
    expect(usePlayerStore.getState().position).toBe(60)
  })

  it('setPitch calls engine and store', () => {
    const { result } = renderHook(() => useAudioEngine())
    act(() => result.current.setPitch(5))
    expect(mockSetPitch).toHaveBeenCalledWith(5)
    expect(usePlayerStore.getState().pitch).toBe(5)
  })

  it('setTempo calls engine and store', () => {
    const { result } = renderHook(() => useAudioEngine())
    act(() => result.current.setTempo(1.5))
    expect(mockSetTempo).toHaveBeenCalledWith(1.5)
    expect(usePlayerStore.getState().tempo).toBe(1.5)
  })

  it('setVolume calls engine and store', () => {
    const { result } = renderHook(() => useAudioEngine())
    act(() => result.current.setVolume(0.5))
    expect(mockSetVolume).toHaveBeenCalledWith(0.5)
    expect(usePlayerStore.getState().volume).toBe(0.5)
  })

  it('playTrack resumes suspended AudioContext before playing', async () => {
    mockContext.state = 'suspended'
    const track = makeTrack({ id: 'track-1', durationSeconds: 200 })
    const repoGet = await mockRepoGet()
    repoGet.mockResolvedValue(track)

    const { result } = renderHook(() => useAudioEngine())

    await act(async () => {
      await result.current.playTrack(track)
    })

    expect(mockResume).toHaveBeenCalledTimes(1)
    expect(mockResume.mock.invocationCallOrder[0]!).toBeLessThan(mockPlay.mock.invocationCallOrder[0]!)
  })

  it('playTrack does not resume a running AudioContext', async () => {
    mockContext.state = 'running'
    const track = makeTrack({ id: 'track-1', durationSeconds: 200 })
    const repoGet = await mockRepoGet()
    repoGet.mockResolvedValue(track)

    const { result } = renderHook(() => useAudioEngine())

    await act(async () => {
      await result.current.playTrack(track)
    })

    expect(mockResume).not.toHaveBeenCalled()
    expect(mockPlay).toHaveBeenCalledTimes(1)
  })

  it('playTrack reports resume errors like other playback errors', async () => {
    mockContext.state = 'suspended'
    mockResume.mockRejectedValue(new Error('resume blocked'))
    const track = makeTrack({ id: 'track-1', durationSeconds: 200 })
    const repoGet = await mockRepoGet()
    repoGet.mockResolvedValue(track)

    const { result } = renderHook(() => useAudioEngine())

    await act(async () => {
      await result.current.playTrack(track)
    })

    expect(result.current.loading).toBe('error')
    expect(result.current.error).toContain('resume blocked')
    expect(mockPlay).not.toHaveBeenCalled()
    expect(usePlayerStore.getState().playing).toBe(false)
  })

  it('playTrack loads from Dexie, decodes, and plays', async () => {
    const track = makeTrack({ id: 'track-1', durationSeconds: 200 })
    const repoGet = await mockRepoGet()
    repoGet.mockResolvedValue(track)

    const { result } = renderHook(() => useAudioEngine())

    await act(async () => {
      await result.current.playTrack(track)
    })

    expect(repoGet).toHaveBeenCalledWith('track-1')
    expect(mockDecode).toHaveBeenCalled()
    expect(mockLoad).toHaveBeenCalled()
    expect(mockPlay).toHaveBeenCalled()

    const state = usePlayerStore.getState()
    expect(state.currentTrackId).toBe('track-1')
    expect(state.duration).toBe(200)
    expect(state.playing).toBe(true)
    expect(useWaveformStore.getState().peaksByTrackId['track-1']).toBeDefined()
  })

  it('playTrack shows error when blob is missing', async () => {
    const track = makeTrack({ id: 'track-2', fileBlob: undefined })
    const repoGet = await mockRepoGet()
    repoGet.mockResolvedValue(track)

    const { result } = renderHook(() => useAudioEngine())

    await act(async () => {
      await result.current.playTrack(track)
    })

    expect(result.current.loading).toBe('error')
    expect(result.current.error).toContain('No audio data')
  })
})
