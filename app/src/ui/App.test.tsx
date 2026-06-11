import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { useCollectionStore } from '../application/collectionStore'
import { usePlayerStore } from '../application/playerStore'
import { useSessionStore } from '../application/sessionStore'
import type { PersistedTrack } from '../infrastructure/dexie'

const { mockEngine } = vi.hoisted(() => ({
  mockEngine: {
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    setPitch: vi.fn(),
    setTempo: vi.fn(),
    setVolume: vi.fn(),
    playTrack: vi.fn((track: { id: string; durationSeconds: number }) => {
      usePlayerStore.getState().loadTrack(track.id, track.durationSeconds)
      usePlayerStore.getState().play()
    }),
    loading: 'idle',
    error: null,
  },
}))

vi.mock('./hooks/useMediaSession', () => ({
  useMediaSession: vi.fn(),
}))

vi.mock('./hooks/useAudioEngine', () => ({
  useAudioEngine: () => mockEngine,
}))

function makeTrack(overrides: Partial<PersistedTrack> = {}): PersistedTrack {
  const now = new Date()
  return {
    id: 'track-1',
    title: 'Visible Song',
    artist: 'Test Artist',
    durationSeconds: 180,
    filePath: 'visible-song.mp3',
    playCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('App player navigation', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    useCollectionStore.getState().reset()
    usePlayerStore.getState().reset()
    useSessionStore.getState().reset()
  })

  it('returns to library without unloading the current track and keeps Miniplayer active', () => {
    useCollectionStore.getState().setTracks([makeTrack()])

    const { container } = render(<App />)

    fireEvent.click(screen.getByLabelText('Play Visible Song by Test Artist'))
    expect(screen.getAllByText('Visible Song').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Volver/ })).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: /Volver/ }))

    expect(container.textContent).toContain('Your Music')
    expect(usePlayerStore.getState().currentTrackId).toBe('track-1')
    expect(screen.getByRole('button', { name: 'Pause' })).toBeDefined()
  })

  it('can re-enter PlayerView after returning to the library', () => {
    useCollectionStore.getState().setTracks([makeTrack()])

    render(<App />)

    fireEvent.click(screen.getByLabelText('Play Visible Song by Test Artist'))
    fireEvent.click(screen.getByRole('button', { name: /Volver/ }))
    fireEvent.click(screen.getByLabelText('Play Visible Song by Test Artist'))

    expect(screen.getByRole('button', { name: /Volver/ })).toBeDefined()
    expect(screen.getAllByText('Visible Song').length).toBeGreaterThan(0)
  })
})
