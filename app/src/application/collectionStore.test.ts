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
    expect(s.sets).toHaveLength(0)
    expect(s.queue).toHaveLength(0)
    expect(s.source).toBeNull()
  })

  it('manages sets', () => {
    const set = {
      id: 's1',
      name: 'Show 1',
      trackIds: ['a', 'b'],
      targetDurationMinutes: 45,
    }
    useCollectionStore.getState().addSet(set)
    expect(useCollectionStore.getState().sets).toHaveLength(1)
    expect(useCollectionStore.getState().sets[0]?.name).toBe('Show 1')

    useCollectionStore.getState().removeSet('s1')
    expect(useCollectionStore.getState().sets).toHaveLength(0)
  })

  it('calculates total queue duration', () => {
    const tracks = [
      { ...mockTrack('a'), durationSeconds: 100 },
      { ...mockTrack('b'), durationSeconds: 200 },
    ]
    useCollectionStore.getState().setTracks(tracks)

    // QuouList uses simple Track type { id: string }, but we need duration for calculation
    // The store should probably lookup duration from tracks or have it in queue items
    useCollectionStore.getState().addToQueue({ id: 'a' })
    useCollectionStore.getState().addToQueue({ id: 'b' })

    expect(useCollectionStore.getState().getQueueTotalDuration()).toBe(300)

    useCollectionStore.getState().consumeQueue()
    expect(useCollectionStore.getState().getQueueTotalDuration()).toBe(200)
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
