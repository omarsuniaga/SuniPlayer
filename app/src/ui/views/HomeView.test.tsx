import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { HomeView } from './HomeView'
import { useCollectionStore } from '../../application/collectionStore'
import { usePlayerStore } from '../../application/playerStore'
import { useNavigationStore } from '../../application/navigationStore'
import type { PersistedTrack } from '../../infrastructure/dexie'

const { mockEngine } = vi.hoisted(() => ({
  mockEngine: {
    playTrack: vi.fn(),
  },
}))

vi.mock('../hooks/useAudioEngine', () => ({
  useAudioEngine: () => mockEngine,
}))

function makeTrack(overrides: Partial<PersistedTrack> = {}): PersistedTrack {
  const now = new Date('2026-06-10T12:00:00.000Z')
  return {
    id: 'track-1',
    title: 'Salsa Brava',
    artist: 'La Banda',
    durationSeconds: 240, // 4 min
    filePath: '/Music/Importadas/salsa-brava.mp3',
    bpm: 128,
    playCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('HomeView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCollectionStore.getState().reset()
    usePlayerStore.getState().reset()
    useNavigationStore.getState().reset()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders correctly with default sections', () => {
    useCollectionStore.getState().setTracks([makeTrack()])
    
    render(<HomeView />)

    expect(screen.getByText('🎵 SUNIPLAYER')).toBeDefined()
    expect(screen.getByPlaceholderText('Search tracks, playlists...')).toBeDefined()
    expect(screen.getByText('Smart Collections')).toBeDefined()
    expect(screen.getByText('Your Playlists')).toBeDefined()
  })

  it('shows onboarding state when library is empty', () => {
    render(<HomeView />)

    expect(screen.getByText('Welcome to Suniplayer')).toBeDefined()
    expect(screen.getByText('Go to Library')).toBeDefined()
  })

  it('shows "Now Playing" section if a track is active', () => {
    const track = makeTrack()
    useCollectionStore.getState().setTracks([track])
    usePlayerStore.setState({ currentTrackId: track.id })

    render(<HomeView />)

    expect(screen.getByText('Now Playing')).toBeDefined()
    expect(screen.getByText('Salsa Brava')).toBeDefined()
  })

  it('filters results when searching by text', () => {
    useCollectionStore.getState().setTracks([
      makeTrack({ id: '1', title: 'Salsa Brava' }),
      makeTrack({ id: '2', title: 'Bachata Rosa' }),
    ])

    render(<HomeView />)

    const searchInput = screen.getByPlaceholderText('Search tracks, playlists...')
    fireEvent.change(searchInput, { target: { value: 'salsa' } })

    expect(screen.getByText('Search Results (1)')).toBeDefined()
    expect(screen.getByText('Salsa Brava')).toBeDefined()
    expect(screen.queryByText('Bachata Rosa')).toBeNull()
  })

  it('opens filter panel and applies filters', () => {
    useCollectionStore.getState().setTracks([
      makeTrack({ id: '1', title: 'Fast Song', bpm: 150 }), // Muy Alta
      makeTrack({ id: '2', title: 'Slow Song', bpm: 70 }),  // Suave
    ])

    render(<HomeView />)

    // Toggle filters
    fireEvent.click(screen.getByLabelText('Toggle filters'))
    expect(screen.getByText('Energy Level')).toBeDefined()

    // Filter by MUY-ALTA
    fireEvent.click(screen.getByText('MUY-ALTA'))
    
    expect(screen.getByText('Search Results (1)')).toBeDefined()
    expect(screen.getByText('Fast Song')).toBeDefined()
    expect(screen.queryByText('Slow Song')).toBeNull()
  })

  it('shows empty result message when no match', () => {
    useCollectionStore.getState().setTracks([makeTrack()])

    render(<HomeView />)
    fireEvent.change(screen.getByPlaceholderText('Search tracks, playlists...'), { target: { value: 'xyz' } })

    expect(screen.getByText('Ninguna colección coincide con los criterios')).toBeDefined()
  })

  it('clicking a result plays it and navigates to player', () => {
    const track = makeTrack()
    useCollectionStore.getState().setTracks([track])
    const navigateSpy = vi.spyOn(useNavigationStore.getState(), 'navigate')

    render(<HomeView />)
    fireEvent.change(screen.getByPlaceholderText('Search tracks, playlists...'), { target: { value: 'salsa' } })
    
    // Select by text to be more specific and bubble up to the row's onClick
    fireEvent.click(screen.getByText('Salsa Brava'))

    expect(mockEngine.playTrack).toHaveBeenCalledWith(track)
    expect(navigateSpy).toHaveBeenCalledWith('reproductor')
  })

  it('clearing filters restores the initial view', () => {
    useCollectionStore.getState().setTracks([makeTrack()])
    render(<HomeView />)

    const searchInput = screen.getByPlaceholderText('Search tracks, playlists...')
    fireEvent.change(searchInput, { target: { value: 'xyz' } })
    expect(screen.queryByText('Smart Collections')).toBeNull()

    fireEvent.click(screen.getByLabelText('Toggle filters'))
    fireEvent.click(screen.getByText('Clear Filters'))

    expect(searchInput.getAttribute('value')).toBe('')
    expect(screen.getByText('Smart Collections')).toBeDefined()
  })
})
