import { create } from 'zustand'
import type { SessionMode } from '../domain/playback/resolveNext'
import type { InterruptionEvent } from '../domain/session/interruptionPolicy'

export type TimerState = {
  running: boolean
  elapsed: number // seconds
}

export type SessionState = {
  mode: SessionMode
  timer: TimerState
  interruptionStack: InterruptionEvent[]
}

export type SessionActions = {
  setMode: (mode: SessionMode) => void
  toggleTimer: () => void
  resetTimer: () => void
  tickTimer: () => void
  pushInterruption: (event: InterruptionEvent) => void
  popInterruption: () => InterruptionEvent | undefined
  reset: () => void
}

const initialState: SessionState = {
  mode: 'listen',
  timer: { running: false, elapsed: 0 },
  interruptionStack: [],
}

export const useSessionStore = create<SessionState & SessionActions>((set, get) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),

  toggleTimer: () =>
    set((s) => ({ timer: { ...s.timer, running: !s.timer.running } })),

  resetTimer: () =>
    set({ timer: { running: false, elapsed: 0 } }),

  tickTimer: () =>
    set((s) => {
      if (!s.timer.running) return s
      return { timer: { ...s.timer, elapsed: s.timer.elapsed + 1 } }
    }),

  pushInterruption: (event) =>
    set((s) => ({ interruptionStack: [...s.interruptionStack, event] })),

  popInterruption: () => {
    const { interruptionStack } = get()
    if (interruptionStack.length === 0) return undefined
    const event = interruptionStack[interruptionStack.length - 1]
    set({ interruptionStack: interruptionStack.slice(0, -1) })
    return event
  },

  reset: () => set(initialState),
}))
