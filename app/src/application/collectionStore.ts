import { create } from 'zustand'
import type { Track, PlaybackSource } from '../domain/playback/resolveNext'
import type { PersistedTrack } from '../infrastructure/dexie'

export type Playlist = {
  id: string
  name: string
  tracks: PersistedTrack[]
}

export type CollectionState = {
  tracks: PersistedTrack[]
  playlists: Playlist[]
  queue: Track[]
  source: PlaybackSource | null
}

export type CollectionActions = {
  setTracks: (tracks: PersistedTrack[]) => void
  addTrack: (track: PersistedTrack) => void
  removeTrack: (id: string) => void
  addPlaylist: (playlist: Playlist) => void
  removePlaylist: (id: string) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  consumeQueue: () => Track | undefined
  setSource: (source: PlaybackSource | null) => void
  reset: () => void
}

const initialState: CollectionState = {
  tracks: [],
  playlists: [],
  queue: [],
  source: null,
}

export const useCollectionStore = create<CollectionState & CollectionActions>((set, get) => ({
  ...initialState,

  setTracks: (tracks) => set({ tracks }),

  addTrack: (track) =>
    set((s) => ({ tracks: [...s.tracks, track] })),

  removeTrack: (id) =>
    set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) })),

  addPlaylist: (playlist) =>
    set((s) => ({ playlists: [...s.playlists, playlist] })),

  removePlaylist: (id) =>
    set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),

  addToQueue: (track) =>
    set((s) => ({ queue: [...s.queue, track] })),

  removeFromQueue: (index) =>
    set((s) => ({ queue: s.queue.filter((_, i) => i !== index) })),

  clearQueue: () => set({ queue: [] }),

  consumeQueue: () => {
    const { queue } = get()
    if (queue.length === 0) return undefined
    const [first, ...rest] = queue
    set({ queue: rest })
    return first
  },

  setSource: (source) => set({ source }),

  reset: () => set(initialState),
}))
