import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { useCollectionStore } from './collectionStore'

const { mockPlaylistRepo, mockSetRepo } = vi.hoisted(() => ({
  mockPlaylistRepo: {
    getAll: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
  },
  mockSetRepo: {
    getAll: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
  },
}))

vi.mock('../infrastructure/dexie', () => ({
  playlistRepo: mockPlaylistRepo,
  setRepo: mockSetRepo,
  trackRepo: { getAll: vi.fn(), get: vi.fn() },
}))

describe('collectionActions', () => {
  beforeAll(() => {
    vi.stubGlobal('alert', vi.fn())
  })

  beforeEach(() => {
    vi.clearAllMocks()
    useCollectionStore.getState().reset()

    mockPlaylistRepo.getAll.mockResolvedValue([])
    mockSetRepo.getAll.mockResolvedValue([])
    mockPlaylistRepo.upsert.mockResolvedValue(undefined)
    mockSetRepo.upsert.mockResolvedValue(undefined)
    mockPlaylistRepo.delete.mockResolvedValue(undefined)
    mockSetRepo.delete.mockResolvedValue(undefined)
    mockPlaylistRepo.addTrack.mockResolvedValue(undefined)
    mockPlaylistRepo.removeTrack.mockResolvedValue(undefined)
    mockSetRepo.addTrack.mockResolvedValue(undefined)
    mockSetRepo.removeTrack.mockResolvedValue(undefined)
  })

  describe('addTrackToPlaylist', () => {
    it('calls repo.addTrack and refreshes store', async () => {
      mockPlaylistRepo.getAll.mockResolvedValue([
        { id: 'p1', name: 'P1', trackIds: ['t1'], createdAt: new Date(), updatedAt: new Date() },
      ])
      const { addTrackToPlaylist } = await import('./collectionActions')
      await addTrackToPlaylist('p1', 't2')
      expect(mockPlaylistRepo.addTrack).toHaveBeenCalledWith('p1', 't2')
      expect(mockPlaylistRepo.getAll).toHaveBeenCalledTimes(1)
      expect(useCollectionStore.getState().playlists[0]!.trackIds).toContain('t1')
    })
  })

  describe('removeTrackFromPlaylist', () => {
    it('calls repo.removeTrack and refreshes store', async () => {
      mockPlaylistRepo.getAll.mockResolvedValue([
        { id: 'p1', name: 'P1', trackIds: ['t1', 't2'], createdAt: new Date(), updatedAt: new Date() },
      ])
      const { removeTrackFromPlaylist } = await import('./collectionActions')
      await removeTrackFromPlaylist('p1', 't1')
      expect(mockPlaylistRepo.removeTrack).toHaveBeenCalledWith('p1', 't1')
    })
  })

  describe('addTrackToSet', () => {
    it('calls repo.addTrack and refreshes store', async () => {
      mockSetRepo.getAll.mockResolvedValue([
        { id: 's1', name: 'S1', trackIds: ['t1'], targetDurationMinutes: 45, createdAt: new Date(), updatedAt: new Date() },
      ])
      const { addTrackToSet } = await import('./collectionActions')
      await addTrackToSet('s1', 't2')
      expect(mockSetRepo.addTrack).toHaveBeenCalledWith('s1', 't2')
      expect(mockSetRepo.getAll).toHaveBeenCalled()
      expect(useCollectionStore.getState().sets[0]!.trackIds).toContain('t1')
    })
  })

  describe('removeTrackFromSet', () => {
    it('calls repo.removeTrack and refreshes store', async () => {
      const { removeTrackFromSet } = await import('./collectionActions')
      await removeTrackFromSet('s1', 't1')
      expect(mockSetRepo.removeTrack).toHaveBeenCalledWith('s1', 't1')
    })
  })

  describe('renamePlaylist', () => {
    it('upserts with new name and refreshes store', async () => {
      useCollectionStore.getState().setPlaylists([
        { id: 'p1', name: 'Old', trackIds: ['t1'] },
      ])
      mockPlaylistRepo.getAll.mockResolvedValue([
        { id: 'p1', name: 'New', trackIds: ['t1'], createdAt: new Date(), updatedAt: new Date() },
      ])
      const { renamePlaylist } = await import('./collectionActions')
      await renamePlaylist('p1', 'New')
      expect(mockPlaylistRepo.upsert).toHaveBeenCalled()
      const upsertCall = mockPlaylistRepo.upsert.mock.calls[0]![0]
      expect(upsertCall.name).toBe('New')
      expect(useCollectionStore.getState().playlists[0]!.name).toBe('New')
    })
  })

  describe('renameSet', () => {
    it('upserts with new name and refreshes store', async () => {
      useCollectionStore.getState().setSets([
        { id: 's1', name: 'Old', trackIds: ['t1'], targetDurationMinutes: 45 },
      ])
      mockSetRepo.getAll.mockResolvedValue([
        { id: 's1', name: 'Renamed', trackIds: ['t1'], targetDurationMinutes: 45, createdAt: new Date(), updatedAt: new Date() },
      ])
      const { renameSet } = await import('./collectionActions')
      await renameSet('s1', 'Renamed')
      expect(mockSetRepo.upsert).toHaveBeenCalled()
      const upsertCall = mockSetRepo.upsert.mock.calls[0]![0]
      expect(upsertCall.name).toBe('Renamed')
      expect(useCollectionStore.getState().sets[0]!.name).toBe('Renamed')
    })
  })

  describe('playCollection', () => {
    it('disables shuffle when playing a Set', async () => {
      useCollectionStore.getState().setSets([
        { id: 's1', name: 'S1', trackIds: ['t1'], targetDurationMinutes: 45 },
      ])
      useCollectionStore.getState().setTracks([
        { id: 't1', title: 'T1', artist: 'A', durationSeconds: 200, filePath: 't1.mp3', playCount: 0, createdAt: new Date(), updatedAt: new Date() },
      ])
      const { usePlayerStore } = await import('./playerStore')
      usePlayerStore.getState().setShuffle(true)
      const { playCollection } = await import('./collectionActions')
      await playCollection('s1', 'set')
      expect(usePlayerStore.getState().shuffle).toBe(false)
    })
  })

  describe('toggleShuffle', () => {
    it('prevents shuffle when active collection is a Set', async () => {
      useCollectionStore.getState().setActiveCollection('s1', 'set')
      const { usePlayerStore } = await import('./playerStore')
      usePlayerStore.getState().setShuffle(false)
      const { toggleShuffle } = await import('./collectionActions')
      toggleShuffle()
      expect(usePlayerStore.getState().shuffle).toBe(false)
    })

    it('allows shuffle when active collection is a Playlist', async () => {
      useCollectionStore.getState().setActiveCollection('p1', 'playlist')
      const { usePlayerStore } = await import('./playerStore')
      usePlayerStore.getState().setShuffle(false)
      const { toggleShuffle } = await import('./collectionActions')
      toggleShuffle()
      expect(usePlayerStore.getState().shuffle).toBe(true)
    })
  })
})
