import { useCollectionStore } from '../../application/collectionStore'
import { usePlayerStore } from '../../application/playerStore'

function trackDisplayName(trackId: string, track?: { title?: string; filePath?: string }): string {
  const title = track?.title?.trim()
  if (title) return title

  const filePath = track?.filePath?.trim()
  if (filePath) return filePath.split(/[\\/]/).pop() || filePath

  return trackId
}

export function useCurrentTrack() {
  const trackId = usePlayerStore((s) => s.currentTrackId)
  const tracks = useCollectionStore((s) => s.tracks)
  const track = trackId ? tracks.find((candidate) => candidate.id === trackId) : undefined

  return {
    trackId,
    track,
    displayName: trackId ? trackDisplayName(trackId, track) : undefined,
  }
}
