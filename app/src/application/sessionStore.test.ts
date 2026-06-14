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

  it('starts show with correct initial states', () => {
    const store = useSessionStore.getState()
    expect(store.showActive).toBe(false)
    expect(store.showStartAt).toBeNull()
    expect(store.showDuration).toBe(0)
    expect(store.showSetName).toBeNull()

    store.startShow(600, 'Live Set 1')
    
    const updated = useSessionStore.getState()
    expect(updated.showActive).toBe(true)
    expect(updated.showStartAt).toBeGreaterThan(0)
    expect(updated.showDuration).toBe(600)
    expect(updated.showSetName).toBe('Live Set 1')
    expect(updated.mode).toBe('show')
  })

  it('stops show and resets states', () => {
    const store = useSessionStore.getState()
    store.startShow(600, 'Live Set 1')
    
    expect(useSessionStore.getState().showActive).toBe(true)
    
    useSessionStore.getState().stopShow()
    
    const updated = useSessionStore.getState()
    expect(updated.showActive).toBe(false)
    expect(updated.showStartAt).toBeNull()
    expect(updated.showDuration).toBe(0)
    expect(updated.showSetName).toBeNull()
    expect(updated.mode).toBe('listen')
  })

  it('tickTimer updates elapsedSeconds, remainingSeconds, and isCountdown during show', () => {
    const store = useSessionStore.getState()
    store.startShow(600, 'Live Set 1')
    store.toggleTimer()
    
    // First tick
    store.tickTimer()
    let state = useSessionStore.getState()
    expect(state.elapsedSeconds).toBe(1)
    expect(state.remainingSeconds).toBe(599)
    expect(state.isCountdown).toBe(true)
    expect(state.timer.elapsed).toBe(1)
    
    // More ticks
    store.tickTimer()
    store.tickTimer()
    state = useSessionStore.getState()
    expect(state.elapsedSeconds).toBe(3)
    expect(state.remainingSeconds).toBe(597)
    expect(state.isCountdown).toBe(true)
  })

  it('tickTimer only updates elapsedSeconds when not in show mode', () => {
    const store = useSessionStore.getState()
    store.toggleTimer()
    store.tickTimer()
    store.tickTimer()
    
    const state = useSessionStore.getState()
    expect(state.elapsedSeconds).toBe(2)
    expect(state.remainingSeconds).toBe(0)
    expect(state.isCountdown).toBe(false)
  })

  it('resetTimer resets derived getters', () => {
    const store = useSessionStore.getState()
    store.startShow(600, 'Live Set 1')
    store.toggleTimer()
    store.tickTimer()
    
    expect(useSessionStore.getState().elapsedSeconds).toBe(1)
    expect(useSessionStore.getState().remainingSeconds).toBe(599)
    expect(useSessionStore.getState().isCountdown).toBe(true)
    
    store.resetTimer()
    
    const state = useSessionStore.getState()
    expect(state.elapsedSeconds).toBe(0)
    expect(state.remainingSeconds).toBe(0)
    expect(state.isCountdown).toBe(false)
  })

  it('startShow with no duration sets isCountdown false (ascending timer)', () => {
    const store = useSessionStore.getState()
    store.startShow()
    
    const state = useSessionStore.getState()
    expect(state.showActive).toBe(true)
    expect(state.showDuration).toBe(0)
    expect(state.isCountdown).toBe(false)
    expect(state.remainingSeconds).toBe(0)
  })

  it('stopShow resets all derived getters', () => {
    const store = useSessionStore.getState()
    store.startShow(600, 'Live Set 1')
    store.toggleTimer()
    store.tickTimer()
    store.tickTimer()
    
    expect(useSessionStore.getState().elapsedSeconds).toBe(2)
    expect(useSessionStore.getState().remainingSeconds).toBe(598)
    expect(useSessionStore.getState().isCountdown).toBe(true)
    
    store.stopShow()
    
    const state = useSessionStore.getState()
    expect(state.elapsedSeconds).toBe(0)
    expect(state.remainingSeconds).toBe(0)
    expect(state.isCountdown).toBe(false)
  })

  it('reset resets all show state including derived getters', () => {
    const store = useSessionStore.getState()
    store.startShow(600, 'Live Set 1')
    store.toggleTimer()
    store.tickTimer()
    
    store.reset()
    
    const state = useSessionStore.getState()
    expect(state.showActive).toBe(false)
    expect(state.showStartAt).toBeNull()
    expect(state.showDuration).toBe(0)
    expect(state.showSetName).toBeNull()
    expect(state.mode).toBe('listen')
    expect(state.elapsedSeconds).toBe(0)
    expect(state.remainingSeconds).toBe(0)
    expect(state.isCountdown).toBe(false)
  })
})
