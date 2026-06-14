import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import { TimerShow } from './TimerShow'
import { useSessionStore } from '../../application/sessionStore'

describe('TimerShow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useSessionStore.getState().reset()
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  const renderTimer = () => render(<TimerShow />)

  it('shows 0:00 when show is not active', () => {
    renderTimer()
    expect(screen.getByText('0:00')).toBeTruthy()
  })

  it('shows elapsed time in ascending mode', () => {
    act(() => { useSessionStore.getState().startShow() })
    renderTimer()
    act(() => { vi.advanceTimersByTime(65000) })
    expect(screen.getByText('1:05')).toBeTruthy()
  })

  it('shows remaining time in countdown mode', () => {
    act(() => { useSessionStore.getState().startShow(600) })
    renderTimer()
    expect(screen.getByText('10:00')).toBeTruthy()
    expect(screen.getByText(/Total:/)).toBeTruthy()
  })

  it('renders progress bar in countdown mode', () => {
    act(() => { useSessionStore.getState().startShow(3600) })
    const { container } = renderTimer()
    expect(container.querySelector('.ui-timer-progress-bar')).toBeTruthy()
  })

  it('does not render progress bar in ascending mode', () => {
    act(() => { useSessionStore.getState().startShow() })
    const { container } = renderTimer()
    expect(container.querySelector('.ui-timer-progress-bar')).toBeNull()
  })

  it('applies ascending/desc CSS classes', () => {
    act(() => { useSessionStore.getState().startShow() })
    const { container, rerender } = renderTimer()
    expect(container.querySelector('.ui-timer-show--ascending')).toBeTruthy()
    expect(container.querySelector('.ui-timer-show--countdown')).toBeNull()

    act(() => {
      useSessionStore.getState().reset()
      useSessionStore.getState().startShow(600)
    })
    rerender(<TimerShow />)
    expect(container.querySelector('.ui-timer-show--countdown')).toBeTruthy()
    expect(container.querySelector('.ui-timer-show--ascending')).toBeNull()
  })

  it('shows warning alert at <= 10min remaining', () => {
    act(() => { useSessionStore.getState().startShow(1200) })
    renderTimer()
    act(() => { vi.advanceTimersByTime(600000) })
    expect(screen.getByText(/10 min restantes/)).toBeTruthy()
  })

  it('shows danger alert at <= 5min remaining', () => {
    act(() => { useSessionStore.getState().startShow(1200) })
    renderTimer()
    act(() => { vi.advanceTimersByTime(900000) })
    expect(screen.getByText(/5 min restantes/)).toBeTruthy()
  })

  it('shows overrun state with Tiempo agotado', () => {
    act(() => { useSessionStore.getState().startShow(600) })
    renderTimer()
    act(() => { vi.advanceTimersByTime(720000) })
    expect(screen.getByText(/Tiempo agotado/)).toBeTruthy()
  })

  it('progress bar width reflects elapsed percentage', () => {
    act(() => { useSessionStore.getState().startShow(3600) })
    const { container } = renderTimer()
    act(() => { vi.advanceTimersByTime(1800000) })
    const fill = container.querySelector('.ui-timer-progress-bar') as HTMLElement
    expect(parseFloat(fill.style.width)).toBeCloseTo(50, 0)
  })
})
