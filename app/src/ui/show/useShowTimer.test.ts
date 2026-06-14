import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useShowTimer } from './useShowTimer'
import { useSessionStore } from '../../application/sessionStore'

describe('useShowTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useSessionStore.getState().reset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns zeros when show is not active', () => {
    const { result } = renderHook(() => useShowTimer())
    expect(result.current.elapsed).toBe(0)
    expect(result.current.remaining).toBe(0)
    expect(result.current.formattedTime).toBe('0:00')
    expect(result.current.alertLevel).toBe('none')
    expect(result.current.mode).toBe('ascending')
  })

  it('elapsed increases over time in ascending mode', () => {
    act(() => {
      useSessionStore.getState().startShow()
    })

    const { result } = renderHook(() => useShowTimer())

    expect(result.current.mode).toBe('ascending')
    expect(result.current.elapsed).toBe(0)

    // Advance 5 seconds
    act(() => { vi.advanceTimersByTime(5000) })

    expect(result.current.elapsed).toBe(5)
    expect(result.current.formattedTime).toBe('0:05')
  })

  it('countdown mode shows remaining time', () => {
    act(() => {
      useSessionStore.getState().startShow(600) // 10 min countdown
    })

    const { result } = renderHook(() => useShowTimer())

    expect(result.current.mode).toBe('countdown')
    expect(result.current.total).toBe(600)
    expect(result.current.remaining).toBe(600)

    // Advance 2 minutes
    act(() => { vi.advanceTimersByTime(120000) })

    expect(result.current.elapsed).toBe(120)
    expect(result.current.remaining).toBe(480)
    expect(result.current.formattedTime).toBe('2:00')
  })

  it('warning alert at <= 600s (10 min remaining)', () => {
    act(() => {
      useSessionStore.getState().startShow(1200) // 20 min countdown
    })

    const { result } = renderHook(() => useShowTimer())

    // Advance 10 min — remaining should be 600, elapsed=600
    act(() => { vi.advanceTimersByTime(600000) })

    expect(result.current.alertLevel).toBe('warning')
  })

  it('danger alert at <= 300s (5 min remaining)', () => {
    act(() => {
      useSessionStore.getState().startShow(1200) // 20 min countdown
    })

    const { result } = renderHook(() => useShowTimer())

    // Advance 15 min — remaining should be 300, elapsed=900
    act(() => { vi.advanceTimersByTime(900000) })

    expect(result.current.alertLevel).toBe('danger')
  })

  it('overrun state when countdown expires', () => {
    act(() => {
      useSessionStore.getState().startShow(600) // 10 min countdown
    })

    const { result } = renderHook(() => useShowTimer())

    // Advance 12 min — overrun
    act(() => { vi.advanceTimersByTime(720000) })

    expect(result.current.alertLevel).toBe('overrun')
    expect(result.current.remaining).toBe(0) // clamped to 0
  })

  it('formats time correctly', () => {
    act(() => {
      useSessionStore.getState().startShow()
    })

    const { result } = renderHook(() => useShowTimer())

    // 65 seconds
    act(() => { vi.advanceTimersByTime(65000) })
    expect(result.current.formattedTime).toBe('1:05')

    // 3665 seconds = 1h 1m 5s
    act(() => { vi.advanceTimersByTime(3600000) }) // advance 1 more hour
    expect(result.current.formattedTime).toBe('1:01:05')
  })

  it('progressPercent reflects elapsed/total in countdown', () => {
    act(() => {
      useSessionStore.getState().startShow(3600) // 1 hour countdown
    })

    const { result } = renderHook(() => useShowTimer())

    expect(result.current.progressPercent).toBe(0)

    // Advance 30 min — 50%
    act(() => { vi.advanceTimersByTime(1800000) })
    expect(result.current.progressPercent).toBeCloseTo(50, 0)
  })

  it('no progress bar in ascending mode', () => {
    act(() => {
      useSessionStore.getState().startShow() // no duration = ascending
    })

    const { result } = renderHook(() => useShowTimer())
    expect(result.current.mode).toBe('ascending')
    expect(result.current.progressPercent).toBe(0)
  })

  it('cleans up interval on unmount', () => {
    act(() => {
      useSessionStore.getState().startShow()
    })

    const { unmount } = renderHook(() => useShowTimer())

    // Advance time
    act(() => { vi.advanceTimersByTime(10000) })

    unmount()

    // Advance more time — interval should be cleared, no error
    act(() => { vi.advanceTimersByTime(10000) })
  })
})
