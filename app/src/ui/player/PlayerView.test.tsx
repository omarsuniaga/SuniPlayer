import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PlayerView } from './PlayerView'
import { usePlayerStore } from '../../application/playerStore'
import { useSessionStore } from '../../application/sessionStore'
import { useCollectionStore } from '../../application/collectionStore'
import { useWaveformStore } from '../../application/waveformStore'
import type { PersistedTrack } from '../../infrastructure/dexie'

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

function makeTrack(overrides: Partial<PersistedTrack> = {}): PersistedTrack {
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
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 200, bottom: 120, width: 200, height: 120, x: 0, y: 0, toJSON: () => ({}),
    })
    usePlayerStore.getState().reset()
    useSessionStore.getState().reset()
    useCollectionStore.getState().reset()
    useWaveformStore.getState().clear()
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

  it('calls engine.seek when the waveform is clicked', () => {
    loadTrack()
    useWaveformStore.getState().setPeaks('track-1', [0.2, 0.8])
    render(<PlayerView />)
    const waveform = screen.getByRole('img', { name: 'Waveform' })
    vi.spyOn(waveform, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 200,
      height: 120,
      top: 0,
      right: 200,
      bottom: 120,
      left: 0,
      toJSON: () => ({}),
    })

    fireEvent.click(waveform, { clientX: 100 })

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

  it('cycles repeat playlist to one, then none, then back to playlist', () => {
    loadTrack({ repeat: 'playlist' })
    const { rerender } = render(<PlayerView />)

    fireEvent.click(screen.getByRole('button', { name: 'Repeat: playlist' }))
    expect(usePlayerStore.getState().repeat).toBe('one')

    rerender(<PlayerView />)
    fireEvent.click(screen.getByRole('button', { name: 'Repeat: one' }))
    expect(usePlayerStore.getState().repeat).toBe('none')

    rerender(<PlayerView />)
    fireEvent.click(screen.getByRole('button', { name: 'Repeat: none' }))
    expect(usePlayerStore.getState().repeat).toBe('playlist')
  })


  it('renders the current track title instead of the id', () => {
    loadTrack({ currentTrackId: 'track-1' })
    useCollectionStore.getState().setTracks([makeTrack({ id: 'track-1', title: 'Visible Song' })])

    render(<PlayerView />)

    expect(screen.getByText('Visible Song')).toBeDefined()
    expect(screen.queryByText('track-1')).toBeNull()
  })

  it('falls back to file name when the current track title is blank', () => {
    loadTrack({ currentTrackId: 'track-1' })
    useCollectionStore.getState().setTracks([
      makeTrack({ id: 'track-1', title: '', filePath: '/music/fallback-name.mp3' }),
    ])

    render(<PlayerView />)

    expect(screen.getByText('fallback-name.mp3')).toBeDefined()
    expect(screen.queryByText('track-1')).toBeNull()
  })

  it('updates session mode from the mode toggle', () => {
    loadTrack()
    render(<PlayerView />)

    fireEvent.click(screen.getByText('🎤 Show'))
    expect(useSessionStore.getState().mode).toBe('show')

    fireEvent.click(screen.getByText('🎧 Listen'))
    expect(useSessionStore.getState().mode).toBe('listen')
  })

  it('keeps transport enabled in show mode', () => {
    loadTrack()
    useSessionStore.setState({ mode: 'show' })

    render(<PlayerView />)

    const playButton = screen.getByRole('button', { name: 'Play' }) as HTMLButtonElement
    const stopButton = screen.getByRole('button', { name: 'Stop' }) as HTMLButtonElement
    expect(playButton.disabled).toBe(false)
    expect(stopButton.disabled).toBe(false)

    fireEvent.click(playButton)
    fireEvent.click(stopButton)
    expect(mockEngine.play).toHaveBeenCalledTimes(1)
    expect(mockEngine.stop).toHaveBeenCalledTimes(1)
  })

  it('keeps seek, pitch, and tempo disabled in show mode', () => {
    loadTrack()
    useSessionStore.setState({ mode: 'show' })

    render(<PlayerView />)

    expect(screen.getByLabelText('Seek').hasAttribute('disabled')).toBe(true)
    expect(sliderFor('Pitch').disabled).toBe(true)
    expect(sliderFor('Tempo').disabled).toBe(true)
  })

  it('renders the waveform when the current track has peaks', () => {
    loadTrack()
    useWaveformStore.getState().setPeaks('track-1', [0.25, 1, 0.5])

    render(<PlayerView />)

    expect(screen.getByLabelText('Waveform')).toBeDefined()
  })

  it('seeks through the waveform in listen mode', () => {
    loadTrack()
    useWaveformStore.getState().setPeaks('track-1', [1])

    render(<PlayerView />)

    fireEvent.mouseDown(screen.getByLabelText('Waveform'), { clientX: 50 })

    expect(mockEngine.seek).toHaveBeenCalledWith(45)
  })

  it('does not seek through the waveform in show mode', () => {
    loadTrack()
    useWaveformStore.getState().setPeaks('track-1', [1])
    useSessionStore.setState({ mode: 'show' })

    render(<PlayerView />)

    fireEvent.mouseDown(screen.getByLabelText('Waveform'), { clientX: 50 })

    expect(mockEngine.seek).not.toHaveBeenCalled()
  })

  it('renders empty queue state when there are no items in QuouList', () => {
    loadTrack()
    render(<PlayerView />)
    expect(screen.getByText('La cola está vacía. Agregá tracks desde la librería.')).toBeDefined()
  })

  it('renders queue tracks and remaining duration when QuouList has items', () => {
    loadTrack()
    useCollectionStore.getState().setTracks([
      makeTrack({ id: 't-1', title: 'First Queue Song', durationSeconds: 120 }),
      makeTrack({ id: 't-2', title: 'Second Queue Song', durationSeconds: 90 })
    ])
    useCollectionStore.getState().addToQueue({ id: 't-1' })
    useCollectionStore.getState().addToQueue({ id: 't-2' })

    render(<PlayerView />)

    expect(screen.getByText('COLA DE REPRODUCCIÓN (QUOULIST)')).toBeDefined()
    expect(screen.getByText('Tiempo restante: 3m 30s')).toBeDefined()
    expect(screen.getByText('First Queue Song')).toBeDefined()
    expect(screen.getByText('Second Queue Song')).toBeDefined()
  })

  it('clears queue when Vaciar button is clicked', () => {
    loadTrack()
    useCollectionStore.getState().setTracks([
      makeTrack({ id: 't-1', title: 'First Queue Song', durationSeconds: 120 })
    ])
    useCollectionStore.getState().addToQueue({ id: 't-1' })

    render(<PlayerView />)
    fireEvent.click(screen.getByRole('button', { name: 'Vaciar' }))

    expect(useCollectionStore.getState().queue).toEqual([])
  })

  it('removes item from queue when quit button is clicked', () => {
    loadTrack()
    useCollectionStore.getState().setTracks([
      makeTrack({ id: 't-1', title: 'First Queue Song', durationSeconds: 120 })
    ])
    useCollectionStore.getState().addToQueue({ id: 't-1' })

    render(<PlayerView />)
    fireEvent.click(screen.getByRole('button', { name: 'Quitar de cola' }))

    expect(useCollectionStore.getState().queue).toEqual([])
  })

  it('reorders queue items when up or down buttons are clicked', () => {
    loadTrack()
    useCollectionStore.getState().setTracks([
      makeTrack({ id: 't-1', title: 'First Queue Song', durationSeconds: 120 }),
      makeTrack({ id: 't-2', title: 'Second Queue Song', durationSeconds: 90 })
    ])
    useCollectionStore.getState().addToQueue({ id: 't-1' })
    useCollectionStore.getState().addToQueue({ id: 't-2' })

    render(<PlayerView />)
    
    // First track cannot be moved up (disabled)
    const upButtons = screen.getAllByRole('button', { name: 'Subir en cola' })
    expect((upButtons[0] as HTMLButtonElement).disabled).toBe(true)

    // Move second track up
    fireEvent.click(upButtons[1]!)
    expect(useCollectionStore.getState().queue).toEqual([{ id: 't-2' }, { id: 't-1' }])
  })
})
