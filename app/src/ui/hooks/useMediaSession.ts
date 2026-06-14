import { useEffect } from 'react'
import { usePlayerStore } from '../../application/playerStore'

/**
 * Wires navigator.mediaSession to the player store so that
 * OS media controls (lock screen, headphones, control center)
 * work with Suniplayer.
 */
export function useMediaSession() {
  const playing = usePlayerStore((s) => s.playing)
  const position = usePlayerStore((s) => s.position)
  const duration = usePlayerStore((s) => s.duration)
  const trackId = usePlayerStore((s) => s.currentTrackId)

  const play = usePlayerStore((s) => s.play)
  const pause = usePlayerStore((s) => s.pause)
  const seek = usePlayerStore((s) => s.seek)

  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    // Update metadata when track changes
    if (trackId) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: trackId,
        artist: 'Suniplayer',
      })
    }

    // Position state. The browser THROWS if position > duration (seen live:
    // replay-after-stop leaves a stale position in the store, and the
    // exception inside this effect unmounts the entire React tree). Media
    // session sync is best-effort UX — it must never take the app down.
    if (Number.isFinite(duration) && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: 1,
          position: Math.min(Math.max(position, 0), duration),
        })
      } catch {
        // Ignore: lock-screen position is cosmetic; playback must continue.
      }
    }

    // Action handlers — set once, stable references
    navigator.mediaSession.setActionHandler('play', () => play())
    navigator.mediaSession.setActionHandler('pause', () => pause())
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) seek(details.seekTime)
    })

    // Update playback state
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
  }, [trackId, playing, position, duration, play, pause, seek])
}
