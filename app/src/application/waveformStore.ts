import { create } from 'zustand'

export type WaveformState = {
  peaksByTrackId: Record<string, number[]>
}

export type WaveformActions = {
  setPeaks: (trackId: string, peaks: number[]) => void
  clear: () => void
}

const initialState: WaveformState = {
  peaksByTrackId: {},
}

export const useWaveformStore = create<WaveformState & WaveformActions>((set) => ({
  ...initialState,
  setPeaks: (trackId, peaks) =>
    set((state) => ({
      peaksByTrackId: { ...state.peaksByTrackId, [trackId]: peaks },
    })),
  clear: () => set(initialState),
}))
