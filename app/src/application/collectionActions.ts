import { usePlayerStore } from './playerStore'
import { useSessionStore } from './sessionStore'
import { playlistRepo, setRepo, type PersistedPlaylist, type PersistedSet } from '../infrastructure/dexie'
import { useCollectionStore } from './collectionStore'

export async function playCollection(collectionId: string, type: 'playlist' | 'set'): Promise<void> {
  const store = useCollectionStore.getState()
  const player = usePlayerStore.getState()
  const session = useSessionStore.getState()
  
  const collection = type === 'playlist' 
    ? store.playlists.find(p => p.id === collectionId)
    : store.sets.find(s => s.id === collectionId)
    
  if (!collection) return

  // Semantic rule: Set empty in Show mode
  if (type === 'set' && collection.trackIds.length === 0 && session.mode === 'show') {
    alert('No se puede reproducir un Set vacío en modo Show.')
    return
  }

  // Semantic rule: No random in Set
  if (type === 'set' && player.shuffle) {
    player.setShuffle(false)
  }

  // Set playback source
  const sourceTracks = collection.trackIds.map(id => ({ id }))
  store.setSource({
    tracks: sourceTracks,
    currentIndex: 0
  })
  store.setActiveCollection(collectionId, type)

  // Start playback of first track if exists
  if (sourceTracks.length > 0) {
    const firstTrackId = sourceTracks[0]!.id
    const trackData = store.tracks.find(t => t.id === firstTrackId)
    if (trackData) {
      player.loadTrack(trackData.id, trackData.durationSeconds)
      player.play()
    }
  }
}

/**
 * Semantic rule: prevent enabling shuffle if current source is a Set.
 */
export function toggleShuffle(): void {
  const player = usePlayerStore.getState()
  const store = useCollectionStore.getState()
  
  if (store.activeCollectionType === 'set') {
    alert('El modo aleatorio está desactivado para Sets: requieren un orden fijo.')
    return
  }
  
  player.setShuffle(!player.shuffle)
}

/**
 * Loads all playlists and sets from Dexie into the collectionStore.
 */
export async function loadCollections(): Promise<void> {
  try {
    const [playlists, sets] = await Promise.all([
      playlistRepo.getAll(),
      setRepo.getAll(),
    ])
    
    const store = useCollectionStore.getState()
    store.setPlaylists(playlists)
    store.setSets(sets)
  } catch (err) {
    console.error('Failed to load collections', err)
  }
}

export async function createPlaylist(name: string, trackIds: string[] = []): Promise<void> {
  const now = new Date()
  const playlist: PersistedPlaylist = {
    id: crypto.randomUUID(),
    name,
    trackIds,
    createdAt: now,
    updatedAt: now,
  }
  await playlistRepo.upsert(playlist)
  const allPlaylists = await playlistRepo.getAll()
  useCollectionStore.getState().setPlaylists(allPlaylists)
}

export async function deletePlaylist(id: string): Promise<void> {
  await playlistRepo.delete(id)
  const allPlaylists = await playlistRepo.getAll()
  useCollectionStore.getState().setPlaylists(allPlaylists)
}

export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  await playlistRepo.addTrack(playlistId, trackId)
  const allPlaylists = await playlistRepo.getAll()
  useCollectionStore.getState().setPlaylists(allPlaylists)
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  await playlistRepo.removeTrack(playlistId, trackId)
  const allPlaylists = await playlistRepo.getAll()
  useCollectionStore.getState().setPlaylists(allPlaylists)
}

export async function renamePlaylist(id: string, name: string): Promise<void> {
  const store = useCollectionStore.getState()
  const playlist = store.playlists.find(p => p.id === id)
  if (!playlist) return
  const now = new Date()
  await playlistRepo.upsert({ ...playlist, name, updatedAt: now } as any)
  const allPlaylists = await playlistRepo.getAll()
  store.setPlaylists(allPlaylists)
}

export async function createSet(name: string, targetDurationMinutes: number, trackIds: string[] = []): Promise<void> {
  const now = new Date()
  const set: PersistedSet = {
    id: crypto.randomUUID(),
    name,
    trackIds,
    targetDurationMinutes,
    createdAt: now,
    updatedAt: now,
  }
  await setRepo.upsert(set)
  const allSets = await setRepo.getAll()
  useCollectionStore.getState().setSets(allSets)
}

export async function deleteSet(id: string): Promise<void> {
  await setRepo.delete(id)
  const allSets = await setRepo.getAll()
  useCollectionStore.getState().setSets(allSets)
}

export async function addTrackToSet(setId: string, trackId: string): Promise<void> {
  await setRepo.addTrack(setId, trackId)
  const allSets = await setRepo.getAll()
  useCollectionStore.getState().setSets(allSets)
}

export async function removeTrackFromSet(setId: string, trackId: string): Promise<void> {
  await setRepo.removeTrack(setId, trackId)
  const allSets = await setRepo.getAll()
  useCollectionStore.getState().setSets(allSets)
}

export async function renameSet(id: string, name: string): Promise<void> {
  const store = useCollectionStore.getState()
  const set = store.sets.find(s => s.id === id)
  if (!set) return
  const now = new Date()
  await setRepo.upsert({ ...set, name, updatedAt: now } as any)
  const allSets = await setRepo.getAll()
  store.setSets(allSets)
}
