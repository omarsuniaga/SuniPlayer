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
  showActive: boolean
  showStartAt: number | null
  showDuration: number // seconds, 0 = ascending
  showSetName: string | null
  elapsedSeconds: number
  remainingSeconds: number
  isCountdown: boolean
}

export type SessionActions = {
  setMode: (mode: SessionMode) => void
  toggleTimer: () => void
  resetTimer: () => void
  tickTimer: () => void
  pushInterruption: (event: InterruptionEvent) => void
  popInterruption: () => InterruptionEvent | undefined
  startShow: (duration?: number, setName?: string) => void
  stopShow: () => void
  reset: () => void
}

const initialState: SessionState = {
  mode: 'listen',
  timer: { running: false, elapsed: 0 },
  interruptionStack: [],
  showActive: false,
  showStartAt: null,
  showDuration: 0,
  showSetName: null,
  elapsedSeconds: 0,
  remainingSeconds: 0,
  isCountdown: false,
}

export const useSessionStore = create<SessionState & SessionActions>((set, get) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),

  toggleTimer: () =>
    set((s) => ({ timer: { ...s.timer, running: !s.timer.running } })),

  resetTimer: () =>
    set({ timer: { running: false, elapsed: 0 }, elapsedSeconds: 0, remainingSeconds: 0, isCountdown: false }),

  tickTimer: () =>
    set((s) => {
      if (!s.timer.running) return s
      const newElapsed = s.timer.elapsed + 1
      const isCountdown = s.showActive && s.showDuration > 0
      const remaining = isCountdown ? Math.max(0, s.showDuration - newElapsed) : 0
      return {
        timer: { ...s.timer, elapsed: newElapsed },
        elapsedSeconds: newElapsed,
        remainingSeconds: remaining,
        isCountdown,
      }
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

  startShow: (duration, setName) =>
    set({
      showActive: true,
      showStartAt: Date.now(),
      showDuration: duration ?? 0,
      showSetName: setName ?? null,
      mode: 'show',
      elapsedSeconds: 0,
      remainingSeconds: duration ?? 0,
      isCountdown: duration ? duration > 0 : false,
    }),

  stopShow: () =>
    set({
      showActive: false,
      showStartAt: null,
      showDuration: 0,
      showSetName: null,
      mode: 'listen',
      elapsedSeconds: 0,
      remainingSeconds: 0,
      isCountdown: false,
    }),

  reset: () => set(initialState),
}))
