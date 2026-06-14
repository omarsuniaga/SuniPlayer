import { create } from 'zustand'
import type { Track, PlaybackSource } from '../domain/playback/resolveNext'
import { trackRepo, playlistRepo, setRepo } from '../infrastructure/dexie'
import type { PersistedTrack } from '../infrastructure/dexie'

export type Playlist = {
  id: string
  name: string
  trackIds: string[]
}

export type SetCollection = {
  id: string
  name: string
  trackIds: string[]
  targetDurationMinutes: number
  startTrackId?: string
}

export type CollectionState = {
  tracks: PersistedTrack[]
  playlists: Playlist[]
  sets: SetCollection[]
  queue: Track[]
  source: PlaybackSource | null
  activeCollectionId: string | null
  activeCollectionType: 'playlist' | 'set' | null
}

export type CollectionActions = {
  setTracks: (tracks: PersistedTrack[]) => void
  addTrack: (track: PersistedTrack) => void
  removeTrack: (id: string) => void
  updateTrack: (id: string, updates: Partial<PersistedTrack>) => void
  setPlaylists: (playlists: Playlist[]) => void
  addPlaylist: (playlist: Playlist) => void
  removePlaylist: (id: string) => void
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void
  setSets: (sets: SetCollection[]) => void
  addSet: (set: SetCollection) => void
  removeSet: (id: string) => void
  updateSet: (id: string, updates: Partial<SetCollection>) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (index: number) => void
  reorderQueue: (startIndex: number, endIndex: number) => void
  clearQueue: () => void
  consumeQueue: () => Track | undefined
  getQueueTotalDuration: () => number
  setSource: (source: PlaybackSource | null) => void
  setActiveCollection: (id: string | null, type: 'playlist' | 'set' | null) => void
  loadFromDb: () => Promise<void>
  reset: () => void
}

const initialState: CollectionState = {
  tracks: [],
  playlists: [],
  sets: [],
  queue: [],
  source: null,
  activeCollectionId: null,
  activeCollectionType: null,
}

export const useCollectionStore = create<CollectionState & CollectionActions>((set, get) => ({
  ...initialState,

  setTracks: (tracks) => set({ tracks }),

  addTrack: (track) =>
    set((s) => ({ tracks: [...s.tracks, track] })),

  removeTrack: (id) =>
    set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) })),

  updateTrack: (id, updates) => {
    set((s) => ({
      tracks: s.tracks.map((t) => {
        if (t.id !== id) return t
        const updated = { ...t, ...updates, updatedAt: new Date() }
        trackRepo.upsert(updated).catch(console.error)
        return updated
      }),
    }))
  },

  setPlaylists: (playlists) => set({ playlists }),

  addPlaylist: (playlist) => {
    playlistRepo.upsert({
      id: playlist.id,
      name: playlist.name,
      trackIds: playlist.trackIds,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).catch(console.error)
    set((s) => ({ playlists: [...s.playlists, playlist] }))
  },

  removePlaylist: (id) => {
    playlistRepo.delete(id).catch(console.error)
    set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }))
  },

  updatePlaylist: (id, updates) => {
    set((s) => {
      const playlists = s.playlists.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates }
          playlistRepo.upsert({
            id: updated.id,
            name: updated.name,
            trackIds: updated.trackIds,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).catch(console.error)
          return updated
        }
        return p
      })
      return { playlists }
    })
  },

  setSets: (sets) => set({ sets }),

  addSet: (setCollection) => {
    setRepo.upsert({
      id: setCollection.id,
      name: setCollection.name,
      trackIds: setCollection.trackIds,
      targetDurationMinutes: setCollection.targetDurationMinutes,
      startTrackId: setCollection.startTrackId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).catch(console.error)
    set((s) => ({ sets: [...s.sets, setCollection] }))
  },

  removeSet: (id) => {
    setRepo.delete(id).catch(console.error)
    set((s) => ({ sets: s.sets.filter((sc) => sc.id !== id) }))
  },

  updateSet: (id, updates) => {
    set((s) => {
      const sets = s.sets.map((sc) => {
        if (sc.id === id) {
          const updated = { ...sc, ...updates }
          setRepo.upsert({
            id: updated.id,
            name: updated.name,
            trackIds: updated.trackIds,
            targetDurationMinutes: updated.targetDurationMinutes,
            startTrackId: updated.startTrackId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).catch(console.error)
          return updated
        }
        return sc
      })
      return { sets }
    })
  },

  addToQueue: (track) =>
    set((s) => ({ queue: [...s.queue, track] })),

  removeFromQueue: (index) =>
    set((s) => ({ queue: s.queue.filter((_, i) => i !== index) })),

  reorderQueue: (startIndex, endIndex) => {
    set((s) => {
      const nextQueue = [...s.queue]
      const [removed] = nextQueue.splice(startIndex, 1)
      if (removed) {
        nextQueue.splice(endIndex, 0, removed)
      }
      return { queue: nextQueue }
    })
  },

  clearQueue: () => set({ queue: [] }),

  consumeQueue: () => {
    const { queue } = get()
    if (queue.length === 0) return undefined
    const [first, ...rest] = queue
    set({ queue: rest })
    return first
  },

  getQueueTotalDuration: () => {
    const { queue, tracks } = get()
    return queue.reduce((total, qTrack) => {
      const track = tracks.find((t) => t.id === qTrack.id)
      return total + (track?.durationSeconds || 0)
    }, 0)
  },

  setSource: (source) => set({ source }),

  setActiveCollection: (activeCollectionId, activeCollectionType) =>
    set({ activeCollectionId, activeCollectionType }),

  loadFromDb: async () => {
    try {
      const tracks = await trackRepo.getAll()
      const playlists = await playlistRepo.getAll()
      const sets = await setRepo.getAll()
      set({
        tracks,
        playlists: playlists.map((p) => ({ id: p.id, name: p.name, trackIds: p.trackIds })),
        sets: sets.map((s) => ({
          id: s.id,
          name: s.name,
          trackIds: s.trackIds,
          targetDurationMinutes: s.targetDurationMinutes,
          startTrackId: s.startTrackId,
        })),
      })
    } catch (e) {
      console.error('Failed to load collections from Dexie:', e)
    }
  },

  reset: () => set(initialState),
}))

