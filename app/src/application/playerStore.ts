import { create } from 'zustand'
import type { RepeatMode } from '../domain/playback/resolveNext'

export type PlayerState = {
  currentTrackId: string | null
  playing: boolean
  position: number
  duration: number
  pitch: number    // semitones, -12 to +12, 0 = original
  tempo: number    // 0.5 to 2.0, 1.0 = original
  volume: number   // 0 to 1
  repeat: RepeatMode
  shuffle: boolean
}

export type PlayerActions = {
  loadTrack: (trackId: string, duration: number) => void
  play: () => void
  pause: () => void
  stop: () => void
  seek: (position: number) => void
  setPitch: (semitones: number) => void
  setTempo: (ratio: number) => void
  setVolume: (volume: number) => void
  setRepeat: (mode: RepeatMode) => void
  setShuffle: (shuffle: boolean) => void
  updatePosition: (position: number) => void
  reset: () => void
}

const initialState: PlayerState = {
  currentTrackId: null,
  playing: false,
  position: 0,
  duration: 0,
  pitch: 0,
  tempo: 1,
  volume: 1,
  repeat: 'none',
  shuffle: false,
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  ...initialState,

  loadTrack: (trackId, duration) =>
    set({ currentTrackId: trackId, duration, position: 0, playing: false }),

  play: () => set({ playing: true }),

  pause: () => set({ playing: false }),

  stop: () => set({ playing: false, position: 0 }),

  seek: (position) => set({ position }),

  setPitch: (semitones) =>
    set({ pitch: Math.max(-12, Math.min(12, semitones)) }),

  setTempo: (ratio) =>
    set({ tempo: Math.max(0.5, Math.min(2, ratio)) }),

  setVolume: (volume) =>
    set({ volume: Math.max(0, Math.min(1, volume)) }),

  setRepeat: (repeat) => set({ repeat }),

  setShuffle: (shuffle) => set({ shuffle }),

  updatePosition: (position) => set({ position }),

  reset: () => set(initialState),
}))
