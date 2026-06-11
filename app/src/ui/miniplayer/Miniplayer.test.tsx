import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Miniplayer } from './Miniplayer'
import { usePlayerStore } from '../../application/playerStore'
import { useSessionStore } from '../../application/sessionStore'

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

describe('Miniplayer', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    usePlayerStore.getState().reset()
    useSessionStore.getState().reset()
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

    fireEvent.change(volumeSlider, { target: { value: '0.25' } })

    expect(mockEngine.setVolume).toHaveBeenCalledWith(0.25)
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

    expect(screen.getByRole('button', { name: 'Play' }).disabled).toBe(true)
  })
})
