import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LibraryView } from './LibraryView'
import { useCollectionStore } from '../../application/collectionStore'
import { usePlayerStore } from '../../application/playerStore'
import type { PersistedTrack } from '../../infrastructure/dexie'

const { mockEngine, mockImportAudioFiles, mockGetAll } = vi.hoisted(() => ({
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
  mockGetAll: vi.fn(),
}))

vi.mock('../hooks/useAudioEngine', () => ({
  useAudioEngine: () => mockEngine,
}))

vi.mock('../../application/importActions', () => ({
  importAudioFiles: mockImportAudioFiles,
}))

vi.mock('../../infrastructure/dexie', () => ({
  trackRepo: { getAll: mockGetAll },
  playlistRepo: {
    getAll: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(undefined),
    upsert: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  setRepo: {
    getAll: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(undefined),
    upsert: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
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

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('LibraryView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAll.mockResolvedValue([])
    mockImportAudioFiles.mockResolvedValue({ success: [], errors: [] })
    useCollectionStore.getState().reset()
    usePlayerStore.getState().reset()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders tracks from the store with visible title, duration, bpm, path, cache state, and added date', () => {
    useCollectionStore.getState().setTracks([makeTrack()])

    render(<LibraryView />)

    expect(screen.getByRole('heading', { name: /LIBRARY/i })).toBeDefined()
    expect(screen.getByText('Salsa Brava')).toBeDefined()
    expect(screen.getByText('3:45')).toBeDefined()
    expect(screen.getByText(/128 BPM/)).toBeDefined()
    expect(screen.getByText('/Music/Importadas/')).toBeDefined()
    expect(screen.getByLabelText('Cached')).toBeDefined()
    expect(screen.getByText(/Added:/)).toBeDefined()
  })

  it('renders the empty state with an import CTA when no tracks exist', () => {
    render(<LibraryView />)

    expect(screen.getByText('No tracks in your library yet')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Drop audio files here or click to browse' })).toBeDefined()
  })

  it('falls back to filename or id and shows No BPM when metadata is missing', () => {
    useCollectionStore.getState().setTracks([
      makeTrack({ id: 'fallback-track', title: '', filePath: '/Music/Importadas/fallback.mp3', bpm: undefined }),
      makeTrack({ id: 'id-fallback', title: '', filePath: '', bpm: undefined }),
    ])

    render(<LibraryView />)

    expect(screen.getByText('fallback.mp3')).toBeDefined()
    expect(screen.getByText('id-fallback')).toBeDefined()
    expect(screen.getAllByText('No BPM')).toHaveLength(2)
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

  it('opens a context menu and shows the spec actions with future items disabled', () => {
    useCollectionStore.getState().setTracks([makeTrack()])

    render(<LibraryView />)
    fireEvent.click(screen.getByRole('button', { name: 'More actions for Salsa Brava' }))

    expect(screen.getByRole('menu', { name: 'Actions for Salsa Brava' })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: 'Play' })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: /Add to playlist/ }).getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByRole('menuitem', { name: 'Add to queue' })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: /Link score/ }).getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByRole('menuitem', { name: /Adjust pitch\/tempo/ }).getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByRole('menuitem', { name: /Save in app/ }).getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByRole('menuitem', { name: /Remove from library/ }).getAttribute('aria-disabled')).toBe('true')
  })

  it('closes the context menu after an enabled action', () => {
    useCollectionStore.getState().setTracks([makeTrack()])

    render(<LibraryView />)
    fireEvent.click(screen.getByRole('button', { name: 'More actions for Salsa Brava' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Add to queue' }))

    expect(useCollectionStore.getState().queue).toEqual([{ id: 'track-1' }])
    expect(screen.queryByRole('menu', { name: 'Actions for Salsa Brava' })).toBeNull()
  })

  it('keeps disabled context menu actions visible and inert', () => {
    useCollectionStore.getState().setTracks([makeTrack()])

    render(<LibraryView />)
    fireEvent.click(screen.getByRole('button', { name: 'More actions for Salsa Brava' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Add to playlist/ }))

    expect(mockEngine.playTrack).not.toHaveBeenCalled()
    expect(screen.getByRole('menu', { name: 'Actions for Salsa Brava' })).toBeDefined()
  })

  it('imports files from the library and shows the new track after the application action updates the store', async () => {
    const importedTrack = makeTrack({ id: 'new-track', title: 'Merengon', filePath: '/Music/Importadas/merengon.wav' })
    mockImportAudioFiles.mockImplementation(async () => {
      mockGetAll.mockResolvedValue([importedTrack])
      useCollectionStore.getState().setTracks([importedTrack])
      return { success: [importedTrack], errors: [] }
    })

    render(<LibraryView />)
    await screen.findByText('No tracks in your library yet')

    const file = new File(['audio'], 'merengon.wav', { type: 'audio/wav' })
    fireEvent.drop(screen.getByRole('button', { name: 'Drop audio files here or click to browse' }), {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => expect(mockImportAudioFiles).toHaveBeenCalledWith([file]))
    expect(await screen.findByText('Merengon')).toBeDefined()
  })


  it('shows importing state and disables the dropzone while import is pending', async () => {
    const pending = deferred<{ success: PersistedTrack[]; errors: { fileName: string; reason: string }[] }>()
    mockImportAudioFiles.mockReturnValue(pending.promise)

    render(<LibraryView />)
    await screen.findByText('No tracks in your library yet')

    const dropzone = screen.getByRole('button', { name: 'Drop audio files here or click to browse' })
    fireEvent.drop(dropzone, { dataTransfer: { files: [new File(['audio'], 'song.mp3', { type: 'audio/mpeg' })] } })

    expect(await screen.findByText('Importing audio files...')).toBeDefined()
    expect(dropzone.getAttribute('aria-disabled')).toBe('true')

    pending.resolve({ success: [], errors: [] })
    await waitFor(() => expect(screen.queryByText('Importing audio files...')).toBeNull())
  })


  it('renders import errors returned by the application action', async () => {
    mockImportAudioFiles.mockResolvedValue({
      success: [],
      errors: [{ fileName: 'bad.mp3', reason: 'Formato no soportado o archivo corrupto' }],
    })

    render(<LibraryView />)
    await screen.findByText('No tracks in your library yet')

    fireEvent.drop(screen.getByRole('button', { name: 'Drop audio files here or click to browse' }), {
      dataTransfer: { files: [new File(['bad'], 'bad.mp3', { type: 'audio/mpeg' })] },
    })

    expect((await screen.findByRole('alert')).textContent).toContain('bad.mp3: Formato no soportado o archivo corrupto')
  })
})
