import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ShowView } from './ShowView'
import { useSessionStore } from '../../application/sessionStore'
import { usePlayerStore } from '../../application/playerStore'
import { useCollectionStore } from '../../application/collectionStore'

const { mockEngine } = vi.hoisted(() => ({
  mockEngine: {
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    setPitch: vi.fn(),
    setTempo: vi.fn(),
    setVolume: vi.fn(),
    playTrack: vi.fn(),
    toggleMute: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    mute: vi.fn(),
    unmute: vi.fn(),
    isMuted: false,
    loading: 'idle' as const,
    error: null,
  },
}))

vi.mock('../hooks/useAudioEngine', () => ({
  useAudioEngine: () => mockEngine,
}))

beforeEach(() => {
  useSessionStore.getState().reset()
  usePlayerStore.getState().reset()
  useCollectionStore.getState().reset()
})

afterEach(() => { cleanup() })

describe('ShowView', () => {
  it('shows empty state when show is not active', () => {
    render(<ShowView onClose={vi.fn()} />)
    expect(screen.getByText('Show inactivo.')).toBeTruthy()
  })

  it('renders full show layout when active', () => {
    useSessionStore.getState().startShow(3600, 'Live Set 2025')

    render(<ShowView onClose={vi.fn()} />)

    expect(screen.getByText(/EN VIVO/)).toBeTruthy()
    expect(screen.getByText(/Live Set 2025/)).toBeTruthy()
    expect(screen.getByText(/NOW PLAYING/)).toBeTruthy()
    expect(screen.getByText(/SIGUIENTES EN SET Y COLA/)).toBeTruthy()
    expect(screen.getByText(/Completar Set/)).toBeTruthy()
  })

  it('shows playback controls', () => {
    useSessionStore.getState().startShow()
    usePlayerStore.getState().loadTrack('track-1', 300)

    render(<ShowView onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '⏹' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '⏮️' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '⏭️' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mute' })).toBeTruthy()
  })

  it('shows pause button when playing', () => {
    useSessionStore.getState().startShow()
    usePlayerStore.getState().loadTrack('track-1', 300)
    usePlayerStore.getState().play()

    render(<ShowView onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy()
  })

  it('calls onClose when stop button double-tapped', () => {
    useSessionStore.getState().startShow()

    const onClose = vi.fn()
    render(<ShowView onClose={onClose} />)

    const stopBtn = screen.getByRole('button', { name: '⏹' })
    fireEvent.mouseDown(stopBtn)
    fireEvent.mouseUp(stopBtn)
    fireEvent.mouseDown(stopBtn)
    fireEvent.mouseUp(stopBtn)

    expect(useSessionStore.getState().showActive).toBe(false)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('displays queue items', () => {
    useSessionStore.getState().startShow()
    useCollectionStore.getState().addToQueue({ id: 'track-a' })
    useCollectionStore.getState().setTracks([
      { id: 'track-a', title: 'Track A', filePath: '/path/a.mp3', durationSeconds: 180, bpm: 120, key: 'C', energy: 5, importDate: Date.now(), fileBlob: new Blob() },
    ])

    render(<ShowView onClose={vi.fn()} />)

    expect(screen.getByText('Track A')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Quitar de cola' })).toBeTruthy()
  })

  it('shows empty queue message when no items', () => {
    useSessionStore.getState().startShow()
    render(<ShowView onClose={vi.fn()} />)
    expect(screen.getByText('La cola está vacía.')).toBeTruthy()
  })
})
