import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Miniplayer } from './Miniplayer'
import { usePlayerStore } from '../../application/playerStore'
import { useSessionStore } from '../../application/sessionStore'
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
    loading: 'idle',
    error: null,
  },
}))

vi.mock('../hooks/useAudioEngine', () => ({
  useAudioEngine: () => mockEngine,
}))

function makeTrack(overrides: Partial<{ id: string; title: string; filePath: string }> = {}) {
  return {
    id: 'track-1',
    title: 'Visible Song',
    artist: 'Test Artist',
    durationSeconds: 180,
    filePath: 'visible-song.mp3',
    playCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('Miniplayer', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    usePlayerStore.getState().reset()
    useSessionStore.getState().reset()
    useCollectionStore.getState().reset()
  })

  it('renders empty state without transport controls when no track is loaded', () => {
    const { container } = render(<Miniplayer />)

    expect(container.textContent).toContain('No track loaded')
    expect(screen.queryByRole('button', { name: 'Play' })).toBeNull()
    expect(container.querySelector('input[type="range"]')).toBeNull()
  })

  it('calls engine.play when active play is clicked', () => {
    usePlayerStore.setState({
      currentTrackId: 'track-1',
      playing: false,
      duration: 180,
    })

    render(<Miniplayer />)
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))

    expect(mockEngine.play).toHaveBeenCalledTimes(1)
  })

  it('calls engine.pause when active pause is clicked', () => {
    usePlayerStore.setState({
      currentTrackId: 'track-1',
      playing: true,
      duration: 180,
    })

    render(<Miniplayer />)
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))

    expect(mockEngine.pause).toHaveBeenCalledTimes(1)
  })

  it('calls engine.seek when the progress bar changes', () => {
    usePlayerStore.setState({
      currentTrackId: 'track-1',
      duration: 180,
      position: 30,
    })

    render(<Miniplayer />)
    fireEvent.change(screen.getByLabelText('Seek'), { target: { value: '75' } })

    expect(mockEngine.seek).toHaveBeenCalledWith(75)
  })

  it('calls engine.setVolume when the volume slider changes', () => {
    usePlayerStore.setState({
      currentTrackId: 'track-1',
      duration: 180,
      volume: 0.5,
    })

    const { container } = render(<Miniplayer />)
    const sliders = container.querySelectorAll('input[type="range"]')
    const volumeSlider = sliders[1]
    expect(volumeSlider).toBeDefined()

    fireEvent.change(volumeSlider!, { target: { value: '0.25' } })

    expect(mockEngine.setVolume).toHaveBeenCalledWith(0.25)
  })


  it('renders the current track title instead of the id', () => {
    usePlayerStore.setState({
      currentTrackId: 'track-1',
      duration: 180,
    })
    useCollectionStore.getState().setTracks([makeTrack({ id: 'track-1', title: 'Visible Song' })])

    const { container } = render(<Miniplayer />)

    expect(container.textContent).toContain('Visible Song')
    expect(container.textContent).not.toContain('track-1')
  })

  it('falls back to file name when the current track title is blank', () => {
    usePlayerStore.setState({
      currentTrackId: 'track-1',
      duration: 180,
    })
    useCollectionStore.getState().setTracks([
      makeTrack({ id: 'track-1', title: '   ', filePath: 'C:/music/fallback-name.mp3' }),
    ])

    const { container } = render(<Miniplayer />)

    expect(container.textContent).toContain('fallback-name.mp3')
    expect(container.textContent).not.toContain('track-1')
  })

  it('documents current locked-state bug: transport should be disabled in show mode', () => {
    usePlayerStore.setState({
      currentTrackId: 'track-1',
      playing: false,
      duration: 180,
    })
    useSessionStore.setState({ mode: 'show' })

    const { container } = render(<Miniplayer />)

    expect(container.textContent).toContain('Show mode')
  })

  it.fails('should disable locked transport controls in show mode', () => {
    usePlayerStore.setState({
      currentTrackId: 'track-1',
      playing: false,
      duration: 180,
    })
    useSessionStore.setState({ mode: 'show' })

    render(<Miniplayer />)

    expect((screen.getByRole('button', { name: 'Play' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
