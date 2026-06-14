// Implements: docs/componentes/01-audio-engine.md — "Resolución de siguiente (next())"

export type Track = {
  id: string
}

export type PlaybackSource = {
  tracks: Track[]
  currentIndex: number
}

export type SessionMode = 'listen' | 'edit' | 'show'
export type RepeatMode = 'playlist' | 'one' | 'none'

export type NextResolution =
  | { action: 'play-queue-item'; track: Track; consumeQueueItem: true }
  | { action: 'play-source-track'; track: Track }
  | { action: 'stop' }

/**
 * Resolves what the audio engine should do when the current track ends.
 *
 * Priority chain (from spec):
 *  1. QuouList (queue) has items → consume and play the first
 *  2. Source has a next track → play it
 *  3. End of source + empty queue:
 *     - show mode → always stop (nothing plays by surprise on stage)
 *     - listen/edit + repeat=playlist → play first source track
 *     - listen/edit + repeat=one → replay current track
 *     - listen/edit + repeat=none → stop
 */
export function resolveNext(input: {
  queue: Track[]
  source: PlaybackSource
  mode: SessionMode
  repeat: RepeatMode
}): NextResolution {
  const { queue, source, mode, repeat } = input

  // 1. Queue wins
  const firstQueued = queue[0]
  if (firstQueued !== undefined) {
    return { action: 'play-queue-item', track: firstQueued, consumeQueueItem: true }
  }

  // 2. Source has a next track
  const nextTrack = source.tracks[source.currentIndex + 1]
  if (nextTrack !== undefined) {
    return { action: 'play-source-track', track: nextTrack }
  }

  // 3. End of source, empty queue
  // Show mode: always stop — nothing plays by surprise
  if (mode === 'show') {
    return { action: 'stop' }
  }

  // listen / edit — respect repeat setting
  if (repeat === 'playlist') {
    const firstTrack = source.tracks[0]
    if (firstTrack !== undefined) {
      return { action: 'play-source-track', track: firstTrack }
    }
    return { action: 'stop' }
  }

  if (repeat === 'one') {
    const currentTrack = source.tracks[source.currentIndex]
    if (currentTrack !== undefined) {
      return { action: 'play-source-track', track: currentTrack }
    }
    return { action: 'stop' }
  }

  // repeat === 'none' (or empty source)
  return { action: 'stop' }
}
