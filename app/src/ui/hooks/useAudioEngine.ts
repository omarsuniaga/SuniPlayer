import { useRef, useState, useCallback } from 'react'
import { AudioEngine, type EngineState } from '../../infrastructure/audioEngine'
import { trackRepo } from '../../infrastructure/dexie'
import { usePlayerStore } from '../../application/playerStore'
import { useCollectionStore } from '../../application/collectionStore'
import { useSessionStore } from '../../application/sessionStore'
import { resolveNext } from '../../domain/playback/resolveNext'
import { extractPeaks } from '../../application/waveform/extractPeaks'
import { useWaveformStore } from '../../application/waveformStore'
import type { PersistedTrack } from '../../infrastructure/dexie'

// ---- Module-level singleton — persists across re-renders and navigation ----

let _engine: AudioEngine | null = null

function getEngine(onStateChange: (state: EngineState) => void): AudioEngine {
  if (!_engine) {
    _engine = new AudioEngine(onStateChange)
  } else {
    _engine.setStateChangeHandler(onStateChange)
  }
  return _engine
}

// Exposed for tests only — allows cleanup and re-creation
export function _resetEngineForTest(): void {
  _engine?.destroy()
  _engine = null
}

// ---- Hook ----

export type EngineLoading = 'idle' | 'loading' | 'loaded' | 'error'

const WAVEFORM_BUCKETS = 160

async function resumeContextIfSuspended(engine: AudioEngine): Promise<void> {
  if (engine.context.state === 'suspended') {
    await engine.context.resume()
  }
}

export function useAudioEngine() {
  const [loading, setLoading] = useState<EngineLoading>('idle')
  const [error, setError] = useState<string | null>(null)
  const loadingRef = useRef(false)

  // On each render, sync engine → store via the callback
  const stateRef = useRef(usePlayerStore.getState)

  const playTrack = useCallback(async (track: PersistedTrack) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading('loading')
    setError(null)

    try {
      const engine = engineRef.current!
      const dbTrack = track.id
        ? await trackRepo.get(track.id)
        : null
      const blob = dbTrack?.fileBlob ?? track.fileBlob
      if (!blob) {
        throw new Error('No audio data for this track')
      }

      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await engine.context.decodeAudioData(arrayBuffer)
      const waveformStore = useWaveformStore.getState()
      if (!waveformStore.peaksByTrackId[track.id]) {
        waveformStore.setPeaks(track.id, extractPeaks(audioBuffer, WAVEFORM_BUCKETS))
      }

      // Stop current playback if any
      engine.stop()

      await engine.load(audioBuffer)
      usePlayerStore.getState().loadTrack(track.id, track.durationSeconds)
      useCollectionStore.getState().setActiveCollection(null, null)
      useCollectionStore.getState().setSource(null)
      await resumeContextIfSuspended(engine)
      engine.play()
      usePlayerStore.getState().play()

      setLoading('loaded')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      setLoading('error')
    } finally {
      loadingRef.current = false
    }
  }, [])

  const engineRef = useRef<AudioEngine | null>(null)
  if (!engineRef.current) {
    engineRef.current = getEngine((state) => {
      const store = stateRef.current()
      store.updatePosition(state.position)

      // Sync status flags from engine to store
      const isPlaying = state.status === 'playing'
      if (isPlaying && !store.playing) {
        store.play()
      } else if (!isPlaying && store.playing) {
        if (state.status === 'paused') {
          store.pause()
        } else {
          store.stop()
          // Check if it finished naturally
          if (state.position >= state.duration - 0.05) {
            const collectionStore = useCollectionStore.getState()
            const sessionStore = useSessionStore.getState()
            const queue = collectionStore.queue
            const activeSource = collectionStore.source

            if (activeSource) {
              const nextRes = resolveNext({
                queue,
                source: activeSource,
                mode: sessionStore.mode,
                repeat: store.repeat,
              })

              if (nextRes.action === 'play-queue-item') {
                const queuedTrack = collectionStore.consumeQueue()
                if (queuedTrack) {
                  const persisted = collectionStore.tracks.find((t) => t.id === queuedTrack.id)
                  if (persisted) {
                    playTrack(persisted).catch(console.error)
                  }
                }
              } else if (nextRes.action === 'play-source-track') {
                const sourceTrack = nextRes.track
                const persisted = collectionStore.tracks.find((t) => t.id === sourceTrack.id)
                if (persisted) {
                  const trackIdx = activeSource.tracks.findIndex((t) => t.id === sourceTrack.id)
                  if (trackIdx !== -1) {
                    collectionStore.setSource({
                      ...activeSource,
                      currentIndex: trackIdx,
                    })
                  }
                  playTrack(persisted).catch(console.error)
                }
              } else {
                store.stop()
              }
            } else if (queue.length > 0) {
              const queuedTrack = collectionStore.consumeQueue()
              if (queuedTrack) {
                const persisted = collectionStore.tracks.find((t) => t.id === queuedTrack.id)
                if (persisted) {
                  playTrack(persisted).catch(console.error)
                }
              }
            }
          }
        }
      }

      // Sync DSP params (engine may clamp them)
      store.setPitch(state.pitch)
      store.setTempo(state.tempo)
      store.setVolume(state.volume)
    })
  }

  const play = useCallback(async () => {
    const engine = engineRef.current
    if (!engine?.hasBuffer) return
    setError(null)
    try {
      await resumeContextIfSuspended(engine)
      engine.play()
      usePlayerStore.getState().play()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      usePlayerStore.getState().pause()
    }
  }, [])

  const pause = useCallback(() => {
    engineRef.current?.pause()
    usePlayerStore.getState().pause()
  }, [])

  const stop = useCallback(() => {
    engineRef.current?.stop()
    usePlayerStore.getState().stop()
  }, [])

  /**
   * Global kill switch: stops every audio source in the app.
   *
   * 1. Main engine (signalsmith-stretch AudioWorklet)
   * 2. Player store state → paused, position zero
   * 3. DOM safety net: pauses every <audio>/<video> element so no stray
   *    HTMLMediaElement can keep playing (covers previews, future features).
   */
  const stopAll = useCallback(() => {
    stop()
    if (typeof document !== 'undefined') {
      document.querySelectorAll('audio, video').forEach((el) => {
        try { (el as HTMLMediaElement).pause() } catch { /* ignore */ }
      })
    }
  }, [stop])

  const seek = useCallback((position: number) => {
    engineRef.current?.seek(position)
    usePlayerStore.getState().seek(position)
  }, [])

  const setPitch = useCallback((semitones: number) => {
    engineRef.current?.setPitch(semitones)
    usePlayerStore.getState().setPitch(semitones)
  }, [])

  const setTempo = useCallback((ratio: number) => {
    engineRef.current?.setTempo(ratio)
    usePlayerStore.getState().setTempo(ratio)
  }, [])

  const setVolume = useCallback((v: number) => {
    engineRef.current?.setVolume(v)
    usePlayerStore.getState().setVolume(v)
  }, [])

  const mute = useCallback(() => {
    engineRef.current?.mute()
  }, [])

  const unmute = useCallback(() => {
    engineRef.current?.unmute()
  }, [])

  const toggleMute = useCallback(() => {
    engineRef.current?.toggleMute()
  }, [])

  const next = useCallback(() => {
    const collectionStore = useCollectionStore.getState()
    const playerStore = usePlayerStore.getState()
    const sessionStore = useSessionStore.getState()
    const queue = collectionStore.queue
    const activeSource = collectionStore.source

    if (!activeSource) {
      // No source — consume queue directly
      const queuedTrack = collectionStore.consumeQueue()
      if (queuedTrack) {
        const persisted = collectionStore.tracks.find((t) => t.id === queuedTrack.id)
        if (persisted) playTrack(persisted).catch(console.error)
      }
      return
    }

    const nextRes = resolveNext({
      queue,
      source: activeSource,
      mode: sessionStore.mode,
      repeat: playerStore.repeat,
    })

    if (nextRes.action === 'play-queue-item') {
      const queuedTrack = collectionStore.consumeQueue()
      if (queuedTrack) {
        const persisted = collectionStore.tracks.find((t) => t.id === queuedTrack.id)
        if (persisted) playTrack(persisted).catch(console.error)
      }
    } else if (nextRes.action === 'play-source-track') {
      const sourceTrack = nextRes.track
      const persisted = collectionStore.tracks.find((t) => t.id === sourceTrack.id)
      if (persisted) {
        const trackIdx = activeSource.tracks.findIndex((t) => t.id === sourceTrack.id)
        if (trackIdx !== -1) {
          collectionStore.setSource({
            ...activeSource,
            currentIndex: trackIdx,
          })
        }
        playTrack(persisted).catch(console.error)
      }
    }
    // action === 'stop' — do nothing, let user press stop manually
  }, [playTrack])

  const prev = useCallback(() => {
    const playerStore = usePlayerStore.getState()
    const collectionStore = useCollectionStore.getState()
    const activeSource = collectionStore.source

    // If position > 3s, restart current track
    if (playerStore.position > 3) {
      engineRef.current?.seek(0)
      playerStore.seek(0)
      return
    }

    // Otherwise go to previous track in source
    if (!activeSource || activeSource.currentIndex <= 0) return

    const prevTrack = activeSource.tracks[activeSource.currentIndex - 1]
    if (!prevTrack) return

    const persisted = collectionStore.tracks.find((t) => t.id === prevTrack.id)
    if (persisted) {
      collectionStore.setSource({
        ...activeSource,
        currentIndex: activeSource.currentIndex - 1,
      })
      playTrack(persisted).catch(console.error)
    }
  }, [playTrack])

  const playerVolume = usePlayerStore((s) => s.volume)
  const isMuted = playerVolume === 0 && !loadingRef.current

  return {
    playTrack,
    play,
    pause,
    stop,
    stopAll,
    seek,
    setPitch,
    setTempo,
    setVolume,
    mute,
    unmute,
    toggleMute,
    next,
    prev,
    isMuted,
    loading,
    error,
  }
}
