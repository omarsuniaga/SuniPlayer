import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore } from './sessionStore'

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  it('starts in listen mode with timer stopped', () => {
    const s = useSessionStore.getState()
    expect(s.mode).toBe('listen')
    expect(s.timer.running).toBe(false)
    expect(s.timer.elapsed).toBe(0)
    expect(s.interruptionStack).toHaveLength(0)
  })

  it('setMode changes session mode', () => {
    useSessionStore.getState().setMode('show')
    expect(useSessionStore.getState().mode).toBe('show')
    useSessionStore.getState().setMode('edit')
    expect(useSessionStore.getState().mode).toBe('edit')
  })

  it('toggleTimer starts and stops', () => {
    useSessionStore.getState().toggleTimer()
    expect(useSessionStore.getState().timer.running).toBe(true)
    useSessionStore.getState().toggleTimer()
    expect(useSessionStore.getState().timer.running).toBe(false)
  })

  it('resetTimer resets elapsed to 0', () => {
    useSessionStore.getState().toggleTimer()
    useSessionStore.getState().tickTimer()
    useSessionStore.getState().tickTimer()
    useSessionStore.getState().tickTimer()
    expect(useSessionStore.getState().timer.elapsed).toBe(3)
    useSessionStore.getState().resetTimer()
    expect(useSessionStore.getState().timer.elapsed).toBe(0)
    expect(useSessionStore.getState().timer.running).toBe(false)
  })

  it('tickTimer only increments when running', () => {
    useSessionStore.getState().tickTimer()
    expect(useSessionStore.getState().timer.elapsed).toBe(0) // not running
    useSessionStore.getState().toggleTimer()
    useSessionStore.getState().tickTimer()
    expect(useSessionStore.getState().timer.elapsed).toBe(1)
  })

  it('pushInterruption adds to stack', () => {
    useSessionStore.getState().pushInterruption('interruption-started')
    expect(useSessionStore.getState().interruptionStack).toHaveLength(1)
  })

  it('popInterruption removes and returns last event', () => {
    useSessionStore.getState().pushInterruption('interruption-started')
    useSessionStore.getState().pushInterruption('interruption-ended')
    const popped = useSessionStore.getState().popInterruption()
    expect(popped).toBe('interruption-ended')
    expect(useSessionStore.getState().interruptionStack).toHaveLength(1)
  })

  it('popInterruption returns undefined when empty', () => {
    expect(useSessionStore.getState().popInterruption()).toBeUndefined()
  })
})
