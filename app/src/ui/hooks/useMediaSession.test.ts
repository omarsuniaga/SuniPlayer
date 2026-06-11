// Regression tests for useMediaSession.
// Real-browser crash found during E2E validation: setPositionState throws
// "TypeError: The provided position cannot be greater than the duration"
// inside a React effect, unmounting the whole app (white screen).
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePlayerStore } from '../../application/playerStore'
import { useMediaSession } from './useMediaSession'

const setPositionState = vi.fn()
const setActionHandler = vi.fn()

beforeEach(() => {
  setPositionState.mockReset()
  setActionHandler.mockReset()
  Object.defineProperty(globalThis.navigator, 'mediaSession', {
    configurable: true,
    value: {
      metadata: null,
      playbackState: 'none',
      setPositionState,
      setActionHandler,
    },
  })
  ;(globalThis as Record<string, unknown>).MediaMetadata = class {
    title: string
    artist: string
    constructor(init: { title: string; artist: string }) {
      this.title = init.title
      this.artist = init.artist
    }
  }
})

describe('useMediaSession position state', () => {
  it('clamps position when it exceeds duration (replay-after-stop race)', () => {
    usePlayerStore.setState({ currentTrackId: 't1', playing: true, position: 5, duration: 2 })
    renderHook(() => useMediaSession())
    expect(setPositionState).toHaveBeenCalled()
    const lastCall = setPositionState.mock.calls.at(-1)?.[0] as { position: number; duration: number }
    expect(lastCall.position).toBeLessThanOrEqual(lastCall.duration)
  })

  it('clamps negative positions to zero', () => {
    usePlayerStore.setState({ currentTrackId: 't1', playing: false, position: -3, duration: 10 })
    renderHook(() => useMediaSession())
    const lastCall = setPositionState.mock.calls.at(-1)?.[0] as { position: number }
    expect(lastCall.position).toBeGreaterThanOrEqual(0)
  })

  it('skips position state entirely when duration is not positive', () => {
    usePlayerStore.setState({ currentTrackId: 't1', playing: false, position: 0, duration: 0 })
    renderHook(() => useMediaSession())
    expect(setPositionState).not.toHaveBeenCalled()
  })

  it('survives a setPositionState that throws (media session is best-effort)', () => {
    setPositionState.mockImplementation(() => {
      throw new TypeError('The provided position cannot be greater than the duration.')
    })
    usePlayerStore.setState({ currentTrackId: 't1', playing: true, position: 1, duration: 2 })
    expect(() => renderHook(() => useMediaSession())).not.toThrow()
  })
})
