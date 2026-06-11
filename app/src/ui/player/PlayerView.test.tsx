import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PlayerView } from './PlayerView'
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

function loadTrack(overrides: Partial<ReturnType<typeof usePlayerStore.getState>> = {}) {
  usePlayerStore.setState({
    currentTrackId: 'track-1',
    playing: false,
    position: 10,
    duration: 180,
    pitch: 0,
    tempo: 1,
    volume: 0.75,
    repeat: 'none',
    ...overrides,
  })
}

function sliderFor(label: string): HTMLInputElement {
  const labelText = screen.getByText(label)
  const labelElement = labelText.closest('label')
  const input = labelElement?.querySelector('input[type="range"]')
  if (!input) throw new Error(`Missing slider for ${label}`)
  return input as HTMLInputElement
}

describe('PlayerView', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    usePlayerStore.getState().reset()
    useSessionStore.getState().reset()
  })

  it('renders empty state without transport controls when no track is loaded', () => {
    render(<PlayerView />)

    expect(screen.getByText('Select a track to start')).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Play' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull()
  })

  it('calls engine transport controls', () => {
    loadTrack()
    const { rerender } = render(<PlayerView />)

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(mockEngine.play).toHaveBeenCalledTimes(1)

    usePlayerStore.setState({ playing: true })
    rerender(<PlayerView />)
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(mockEngine.pause).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(mockEngine.stop).toHaveBeenCalledTimes(1)
  })

  it('calls engine.seek when the progress bar changes', () => {
    loadTrack()
    render(<PlayerView />)

    fireEvent.change(screen.getByLabelText('Seek'), { target: { value: '90' } })

    expect(mockEngine.seek).toHaveBeenCalledWith(90)
  })

  it.each([
    ['Pitch', '5', mockEngine.setPitch, 5],
    ['Tempo', '1.25', mockEngine.setTempo, 1.25],
    ['Volume', '0.35', mockEngine.setVolume, 0.35],
  ])('calls engine setter when %s slider changes', (label, value, setter, expected) => {
    loadTrack()
    render(<PlayerView />)

    fireEvent.change(sliderFor(label), { target: { value } })

    expect(setter).toHaveBeenCalledWith(expected)
  })

  it('cycles repeat all/playlist to one, then none, then back to all', () => {
    loadTrack({ repeat: 'all' })
    const { rerender } = render(<PlayerView />)

    fireEvent.click(screen.getByRole('button', { name: 'Repeat: all' }))
    expect(usePlayerStore.getState().repeat).toBe('one')

    rerender(<PlayerView />)
    fireEvent.click(screen.getByRole('button', { name: 'Repeat: one' }))
    expect(usePlayerStore.getState().repeat).toBe('none')

    rerender(<PlayerView />)
    fireEvent.click(screen.getByRole('button', { name: 'Repeat: none' }))
    expect(usePlayerStore.getState().repeat).toBe('all')
  })

  it('updates session mode from the mode toggle', () => {
    loadTrack()
    render(<PlayerView />)

    fireEvent.click(screen.getByText('🎤 Show'))
    expect(useSessionStore.getState().mode).toBe('show')

    fireEvent.click(screen.getByText('🎧 Listen'))
    expect(useSessionStore.getState().mode).toBe('listen')
  })

  it('disables transport, seek, pitch, and tempo controls in show mode', () => {
    loadTrack()
    useSessionStore.setState({ mode: 'show' })

    render(<PlayerView />)

    expect(screen.getByRole('button', { name: 'Play' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Stop' }).disabled).toBe(true)
    expect(screen.getByLabelText('Seek').hasAttribute('disabled')).toBe(true)
    expect(sliderFor('Pitch').disabled).toBe(true)
    expect(sliderFor('Tempo').disabled).toBe(true)
  })
})
