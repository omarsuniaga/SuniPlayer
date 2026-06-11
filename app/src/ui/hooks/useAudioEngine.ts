import { useRef, useState, useCallback } from 'react'
import { AudioEngine } from '../../infrastructure/audioEngine'
import { trackRepo } from '../../infrastructure/dexie'
import { usePlayerStore } from '../../application/playerStore'
import type { PersistedTrack } from '../../infrastructure/dexie'

// ---- Module-level singleton — persists across re-renders and navigation ----

let _engine: AudioEngine | null = null

function getEngine(onStateChange: (state: ReturnType<AudioEngine['state']>) => void): AudioEngine {
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

export function useAudioEngine() {
  const [loading, setLoading] = useState<EngineLoading>('idle')
  const [error, setError] = useState<string | null>(null)
  const loadingRef = useRef(false)

  // On each render, sync engine → store via the callback
  const stateRef = useRef(usePlayerStore.getState)

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
        }
      }

      // Sync DSP params (engine may clamp them)
      store.setPitch(state.pitch)
      store.setTempo(state.tempo)
      store.setVolume(state.volume)
    })
  }

  // ---- Actions ----

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

      // Stop current playback if any
      engine.stop()

      await engine.load(audioBuffer)
      usePlayerStore.getState().loadTrack(track.id, track.durationSeconds)
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

  const play = useCallback(() => {
    const engine = engineRef.current
    if (!engine?.hasBuffer) return
    engine.play()
    usePlayerStore.getState().play()
  }, [])

  const pause = useCallback(() => {
    engineRef.current?.pause()
    usePlayerStore.getState().pause()
  }, [])

  const stop = useCallback(() => {
    engineRef.current?.stop()
    usePlayerStore.getState().stop()
  }, [])

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

  return {
    playTrack,
    play,
    pause,
    stop,
    seek,
    setPitch,
    setTempo,
    setVolume,
    loading,
    error,
  }
}
