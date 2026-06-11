import { describe, it, expect, beforeEach } from 'vitest'
import { useCollectionStore } from './collectionStore'
import type { PersistedTrack } from '../infrastructure/dexie'

const mockTrack = (id: string): PersistedTrack => ({
  id,
  title: `Track ${id}`,
  artist: 'Test',
  durationSeconds: 200,
  filePath: `${id}.mp3`,
  playCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
})

describe('collectionStore', () => {
  beforeEach(() => {
    useCollectionStore.getState().reset()
  })

  it('starts empty', () => {
    const s = useCollectionStore.getState()
    expect(s.tracks).toHaveLength(0)
    expect(s.playlists).toHaveLength(0)
    expect(s.queue).toHaveLength(0)
    expect(s.source).toBeNull()
  })

  it('setTracks replaces all tracks', () => {
    const tracks = [mockTrack('a'), mockTrack('b')]
    useCollectionStore.getState().setTracks(tracks)
    expect(useCollectionStore.getState().tracks).toHaveLength(2)
  })

  it('addTrack appends', () => {
    useCollectionStore.getState().addTrack(mockTrack('a'))
    useCollectionStore.getState().addTrack(mockTrack('b'))
    expect(useCollectionStore.getState().tracks).toHaveLength(2)
  })

  it('removeTrack by id', () => {
    useCollectionStore.getState().addTrack(mockTrack('a'))
    useCollectionStore.getState().addTrack(mockTrack('b'))
    useCollectionStore.getState().removeTrack('a')
    expect(useCollectionStore.getState().tracks).toHaveLength(1)
    expect(useCollectionStore.getState().tracks[0]!.id).toBe('b')
  })

  it('addToQueue adds to end', () => {
    useCollectionStore.getState().addToQueue({ id: 'a' })
    useCollectionStore.getState().addToQueue({ id: 'b' })
    expect(useCollectionStore.getState().queue).toHaveLength(2)
  })

  it('consumeQueue returns first and removes it', () => {
    useCollectionStore.getState().addToQueue({ id: 'a' })
    useCollectionStore.getState().addToQueue({ id: 'b' })
    const first = useCollectionStore.getState().consumeQueue()
    expect(first?.id).toBe('a')
    expect(useCollectionStore.getState().queue).toHaveLength(1)
    expect(useCollectionStore.getState().queue[0]?.id).toBe('b')
  })

  it('consumeQueue returns undefined when empty', () => {
    expect(useCollectionStore.getState().consumeQueue()).toBeUndefined()
  })

  it('clearQueue empties the queue', () => {
    useCollectionStore.getState().addToQueue({ id: 'a' })
    useCollectionStore.getState().clearQueue()
    expect(useCollectionStore.getState().queue).toHaveLength(0)
  })

  it('setSource sets playback source', () => {
    const source = { tracks: [{ id: 'a' }, { id: 'b' }], currentIndex: 0 }
    useCollectionStore.getState().setSource(source)
    expect(useCollectionStore.getState().source?.tracks).toHaveLength(2)
  })
})
