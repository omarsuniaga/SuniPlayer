import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { useCollectionStore } from '../application/collectionStore'
import { useNavigationStore } from '../application/navigationStore'
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
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D)
    useCollectionStore.getState().reset()
    useNavigationStore.getState().reset()
    usePlayerStore.getState().reset()
    useSessionStore.getState().reset()
  })

  it('returns to library without unloading the current track and keeps Miniplayer active', () => {
    useCollectionStore.getState().setTracks([makeTrack()])

    render(<App />)

    fireEvent.click(screen.getByLabelText('Play Visible Song by Test Artist'))
    expect(screen.getAllByText('Visible Song').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Volver/ })).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: /Volver/ }))

    expect(screen.getByRole('heading', { name: 'LIBRARY' })).toBeDefined()
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

describe('App navigation shell', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D)
    useCollectionStore.getState().reset()
    useNavigationStore.getState().reset()
    usePlayerStore.getState().reset()
    useSessionStore.getState().reset()
  })

  it('navigates between shell views and changes the rendered content', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Inicio' }))
    expect(screen.getByRole('heading', { name: /SUNIPLAYER/i })).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Perfil' }))
    expect(screen.getByRole('heading', { name: 'Perfil' })).toBeDefined()
  })

  it('keeps Miniplayer visible while moving between views', () => {
    usePlayerStore.setState({ currentTrackId: 'track-1', playing: true, duration: 180 })
    useCollectionStore.getState().setTracks([makeTrack()])

    render(<App />)
    expect(screen.getAllByRole('button', { name: 'Pause' }).length).toBeGreaterThanOrEqual(1)

    fireEvent.click(screen.getByRole('button', { name: 'Perfil' }))
    expect(screen.getByRole('heading', { name: 'Perfil' })).toBeDefined()
    expect(screen.getAllByRole('button', { name: 'Pause' }).length).toBeGreaterThanOrEqual(1)
  })

  it('blocks navigation in show mode and shows the panic confirmation modal', () => {
    useNavigationStore.getState().navigate('show')
    useSessionStore.getState().setMode('show')

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Inicio' }))

    expect(useNavigationStore.getState().currentView).toBe('show')
    expect(screen.getByRole('dialog', { name: 'Confirm show mode exit' })).toBeDefined()
    expect(document.querySelector('.nav-locked')).not.toBeNull()
    expect(document.querySelector('.panic-modal-confirm')).not.toBeNull()
  })

  it('exits show mode and navigates after a quick double tap on the panic modal', () => {
    useNavigationStore.getState().navigate('show')
    useSessionStore.getState().setMode('show')

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Inicio' }))
    const confirmButton = screen.getByRole('button', { name: 'Confirm exit' })

    fireEvent.click(confirmButton)
    expect(useNavigationStore.getState().currentView).toBe('show')

    fireEvent.click(confirmButton)

    expect(useSessionStore.getState().mode).toBe('listen')
    expect(useNavigationStore.getState().currentView).toBe('inicio')
    expect(screen.queryByRole('dialog', { name: 'Confirm show mode exit' })).toBeNull()
  })

  it('keeps navigation state across re-render', () => {
    const { rerender } = render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    rerender(<App />)

    expect(useNavigationStore.getState().currentView).toBe('edit')
    expect(screen.getByRole('heading', { name: 'Edit' })).toBeDefined()
  })

  it('applies theme-dark-forced class when showActive is true', () => {
    useSessionStore.getState().startShow()
    render(<App />)

    const root = document.getElementById('suniplayer-root')
    expect(root?.className).toContain('theme-dark-forced')
  })

  it('removes theme-dark-forced class when showActive is false', () => {
    render(<App />)
    useSessionStore.getState().startShow()
    useSessionStore.getState().stopShow()

    const root = document.getElementById('suniplayer-root')
    expect(root?.className).not.toContain('theme-dark-forced')
  })
})
