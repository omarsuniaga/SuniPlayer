import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LibraryView } from './LibraryView'
import { useCollectionStore } from '../../application/collectionStore'
import { usePlayerStore } from '../../application/playerStore'
import type { PersistedTrack } from '../../infrastructure/dexie'

const { mockEngine, mockImportAudioFiles } = vi.hoisted(() => ({
  mockEngine: {
    playTrack: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    setPitch: vi.fn(),
    setTempo: vi.fn(),
    setVolume: vi.fn(),
    loading: 'idle',
    error: null,
  },
  mockImportAudioFiles: vi.fn(),
}))

vi.mock('../hooks/useAudioEngine', () => ({
  useAudioEngine: () => mockEngine,
}))

vi.mock('../../application/importActions', () => ({
  importAudioFiles: mockImportAudioFiles,
}))

function makeTrack(overrides: Partial<PersistedTrack> = {}): PersistedTrack {
  const now = new Date('2026-06-10T12:00:00.000Z')
  return {
    id: 'track-1',
    title: 'Salsa Brava',
    artist: 'La Banda',
    durationSeconds: 225,
    filePath: '/Music/Importadas/salsa-brava.mp3',
    bpm: 128,
    playCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('LibraryView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCollectionStore.getState().reset()
    usePlayerStore.getState().reset()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders tracks from the store with visible title, duration, bpm, and imported path', () => {
    useCollectionStore.getState().setTracks([makeTrack()])

    render(<LibraryView />)

    expect(screen.getByRole('heading', { name: /LIBRARY/i })).toBeDefined()
    expect(screen.getByText('Salsa Brava')).toBeDefined()
    expect(screen.getByText('3:45')).toBeDefined()
    expect(screen.getByText('128 BPM')).toBeDefined()
    expect(screen.getAllByText('/Music/Importadas/').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the empty state with an import CTA when no tracks exist', () => {
    render(<LibraryView />)

    expect(screen.getByText('No tracks in your library yet')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Drop audio files here or click to browse' })).toBeDefined()
  })

  it('clicking a track calls playTrack with that track and notifies selection', () => {
    const track = makeTrack({ id: 'abc-123' })
    const onTrackSelected = vi.fn()
    useCollectionStore.getState().setTracks([track])

    render(<LibraryView onTrackSelected={onTrackSelected} />)

    fireEvent.click(screen.getByRole('button', { name: 'Play Salsa Brava by La Banda' }))

    expect(mockEngine.playTrack).toHaveBeenCalledWith(track)
    expect(onTrackSelected).toHaveBeenCalledTimes(1)
  })

  it('opens a context menu and shows the spec actions', () => {
    useCollectionStore.getState().setTracks([makeTrack()])

    render(<LibraryView />)
    fireEvent.click(screen.getByRole('button', { name: 'More actions for Salsa Brava' }))

    expect(screen.getByRole('menu', { name: 'Actions for Salsa Brava' })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: 'Play' })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: /Add to playlist/ })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: 'Add to queue' })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: /Link score/ })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: /Adjust pitch\/tempo/ })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: /Save in app/ })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: /Remove from library/ })).toBeDefined()
  })

  it('imports files from the library and shows the new track after the application action updates the store', async () => {
    const importedTrack = makeTrack({ id: 'new-track', title: 'Mereng�n', filePath: '/Music/Importadas/merengon.wav' })
    mockImportAudioFiles.mockImplementation(async () => {
      useCollectionStore.getState().setTracks([importedTrack])
      return { success: [importedTrack], errors: [] }
    })

    render(<LibraryView />)
    const file = new File(['audio'], 'merengon.wav', { type: 'audio/wav' })
    fireEvent.drop(screen.getByRole('button', { name: 'Drop audio files here or click to browse' }), {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => expect(mockImportAudioFiles).toHaveBeenCalledWith([file]))
    expect(await screen.findByText('Mereng�n')).toBeDefined()
  })

  it('keeps disabled context menu actions visible and inert', () => {
    useCollectionStore.getState().setTracks([makeTrack()])

    render(<LibraryView />)
    fireEvent.click(screen.getByRole('button', { name: 'More actions for Salsa Brava' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Add to playlist/ }))

    expect(mockEngine.playTrack).not.toHaveBeenCalled()
    expect(screen.getByRole('menu', { name: 'Actions for Salsa Brava' })).toBeDefined()
  })
})
