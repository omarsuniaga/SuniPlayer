import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { FileImportView } from './FileImportView'
import { useCollectionStore } from '../../application/collectionStore'
import { usePlayerStore } from '../../application/playerStore'
import type { PersistedTrack } from '../../infrastructure/dexie'

// Mock importActions so we don't need real AudioContext / Dexie
vi.mock('../../application/importActions', () => ({
  importAudioFiles: vi.fn(),
}))

// Mock useAudioEngine so we don't need real AudioEngine / Dexie
const mockPlayTrack = vi.fn((track: { id: string; durationSeconds: number }) => {
  // Mirror the store side effects that the real playTrack does
  usePlayerStore.getState().loadTrack(track.id, track.durationSeconds)
  usePlayerStore.getState().play()
})
vi.mock('../hooks/useAudioEngine', () => ({
  useAudioEngine: () => ({
    playTrack: mockPlayTrack,
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    setPitch: vi.fn(),
    setTempo: vi.fn(),
    setVolume: vi.fn(),
    loading: 'idle',
    error: null,
  }),
}))

import { importAudioFiles } from '../../application/importActions'
const mockImport = importAudioFiles as ReturnType<typeof vi.fn>

function makeTrack(overrides: Partial<PersistedTrack> = {}): PersistedTrack {
  const now = new Date()
  return {
    id: 't-' + Math.random().toString(36).slice(2),
    title: 'Test Song',
    artist: 'Test Artist',
    durationSeconds: 240,
    filePath: 'test.mp3',
    playCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('FileImportView', () => {
  beforeEach(() => {
    useCollectionStore.getState().reset()
    usePlayerStore.getState().reset()
    vi.clearAllMocks()
  })

  it('shows dropzone when no tracks exist', () => {
    const { container } = render(<FileImportView />)
    expect(container.textContent).toContain('Drop audio files here or click to browse')
    expect(container.textContent).toContain('0 tracks imported')
  })

  it('shows track count when tracks exist', () => {
    useCollectionStore.getState().setTracks([makeTrack()])
    const { container } = render(<FileImportView />)
    expect(container.textContent).toContain('1 track imported')
  })

  it('shows plural track count', () => {
    useCollectionStore.getState().setTracks([makeTrack(), makeTrack()])
    const { container } = render(<FileImportView />)
    expect(container.textContent).toContain('2 tracks imported')
  })

  it('renders track list from collectionStore', () => {
    useCollectionStore.getState().setTracks([
      makeTrack({ title: 'Bohemian Rhapsody', artist: 'Queen', durationSeconds: 354 }),
    ])
    const { container } = render(<FileImportView />)
    expect(container.textContent).toContain('Bohemian Rhapsody')
    expect(container.textContent).toContain('Queen')
    expect(container.textContent).toContain('5:54')
  })

  it('calls playTrack on track click', () => {
    const track = makeTrack({ id: 'abc-123', durationSeconds: 200 })
    useCollectionStore.getState().setTracks([track])
    const { container } = render(<FileImportView />)

    const trackEl = container.querySelector('[role="listitem"]') as HTMLElement
    fireEvent.click(trackEl)

    expect(mockPlayTrack).toHaveBeenCalledWith(track)
    const state = usePlayerStore.getState()
    expect(state.currentTrackId).toBe('abc-123')
    expect(state.duration).toBe(200)
    expect(state.playing).toBe(true)
  })

  it('imports files via importAudioFiles on drop', async () => {
    const track = makeTrack({ id: 'new-1' })
    mockImport.mockResolvedValue({ success: [track], errors: [] })

    const { container } = render(<FileImportView />)
    const dz = container.firstChild?.firstChild as HTMLElement // inside page div

    // Find the dropzone by looking for the role="button" div
    const dropzone = container.querySelector('[role="button"]') as HTMLElement
    const file = new File([''], 'song.mp3', { type: 'audio/mpeg' })
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } })

    // Wait for async import
    await vi.waitFor(() => {
      expect(mockImport).toHaveBeenCalledWith([file])
    })
  })

  it('shows error message when import fails', async () => {
    mockImport.mockResolvedValue({
      success: [],
      errors: [{ fileName: 'bad.mp3', reason: 'Unsupported file type' }],
    })

    const { container } = render(<FileImportView />)
    const dropzone = container.querySelector('[role="button"]') as HTMLElement
    const file = new File([''], 'bad.mp3', { type: 'audio/mpeg' })
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('bad.mp3')
      expect(container.textContent).toContain('Unsupported file type')
    })
  })

  it('shows import more button and toggles dropzone', () => {
    useCollectionStore.getState().setTracks([makeTrack()])
    const { container } = render(<FileImportView />)

    const btn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent && b.textContent.includes('Import more')
    )
    expect(btn).toBeTruthy()

    fireEvent.click(btn!)
    // Dropzone should appear again
    expect(container.textContent).toContain('Drop audio files here or click to browse')
  })
})
