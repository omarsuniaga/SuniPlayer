import Dexie, { type EntityTable } from 'dexie'

export interface PersistedTrack {
  id: string
  title: string
  artist: string
  durationSeconds: number
  filePath: string
  fileBlob?: Blob
  bpm?: number
  playCount: number
  customStartSeconds?: number
  customEndSeconds?: number
  createdAt: Date
  updatedAt: Date
}

export interface PersistedPlaylist {
  id: string
  name: string
  trackIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface PersistedSet {
  id: string
  name: string
  trackIds: string[]
  targetDurationMinutes: number
  startTrackId?: string
  createdAt: Date
  updatedAt: Date
}

export interface PersistedSetting {
  key: string
  value: string
}

class SuniplayerDB extends Dexie {
  tracks!: EntityTable<PersistedTrack, 'id'>
  playlists!: EntityTable<PersistedPlaylist, 'id'>
  sets!: EntityTable<PersistedSet, 'id'>
  settings!: EntityTable<PersistedSetting, 'key'>

  constructor() {
    super('suniplayer')
    this.version(1).stores({
      tracks: 'id, title, artist, bpm, playCount, createdAt',
      playlists: 'id, name, createdAt',
      settings: 'key',
    })
    this.version(2).stores({
      sets: 'id, name, createdAt',
    })
  }
}

const db = new SuniplayerDB()

export const trackRepo = {
  async getAll(): Promise<PersistedTrack[]> {
    return db.tracks.orderBy('createdAt').reverse().toArray()
  },
  async get(id: string): Promise<PersistedTrack | undefined> {
    return db.tracks.get(id)
  },
  async upsert(track: PersistedTrack): Promise<void> {
    await db.tracks.put(track)
  },
  async bulkUpsert(tracks: PersistedTrack[]): Promise<void> {
    await db.tracks.bulkPut(tracks)
  },
  async delete(id: string): Promise<void> {
    await db.tracks.delete(id)
  },
  async incrementPlayCount(id: string): Promise<void> {
    await db.tracks.where('id').equals(id).modify({ playCount: 1 })
  },
}

export const playlistRepo = {
  async getAll(): Promise<PersistedPlaylist[]> {
    return db.playlists.orderBy('createdAt').toArray()
  },
  async get(id: string): Promise<PersistedPlaylist | undefined> {
    return db.playlists.get(id)
  },
  async upsert(playlist: PersistedPlaylist): Promise<void> {
    await db.playlists.put(playlist)
  },
  async delete(id: string): Promise<void> {
    await db.playlists.delete(id)
  },
  async addTrack(playlistId: string, trackId: string): Promise<void> {
    await db.playlists.where('id').equals(playlistId).modify((p) => {
      p.trackIds.push(trackId)
    })
  },
  async removeTrack(playlistId: string, trackId: string): Promise<void> {
    await db.playlists.where('id').equals(playlistId).modify((p) => {
      p.trackIds = p.trackIds.filter((id) => id !== trackId)
    })
  },
}

export const setRepo = {
  async getAll(): Promise<PersistedSet[]> {
    return db.sets.orderBy('createdAt').toArray()
  },
  async get(id: string): Promise<PersistedSet | undefined> {
    return db.sets.get(id)
  },
  async upsert(set: PersistedSet): Promise<void> {
    await db.sets.put(set)
  },
  async delete(id: string): Promise<void> {
    await db.sets.delete(id)
  },
}

export const settingsRepo = {
  async get(key: string): Promise<string | undefined> {
    return db.settings.get(key).then((s) => s?.value)
  },
  async set(key: string, value: string): Promise<void> {
    await db.settings.put({ key, value })
  },
}

export default db
