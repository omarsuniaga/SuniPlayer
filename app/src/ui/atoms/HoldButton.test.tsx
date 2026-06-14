import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { HoldButton } from './HoldButton'

describe('HoldButton — hold mode', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers(); cleanup() })

  it('fires onTrigger after holdMs', () => {
    const fn = vi.fn()
    render(<HoldButton mode="hold" onTrigger={fn} label="⏭" />)
    const btn = screen.getByRole('button', { name: '⏭' })
    act(() => { fireEvent.mouseDown(btn) })
    act(() => { vi.advanceTimersByTime(500) })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does NOT fire if released before holdMs', () => {
    const fn = vi.fn()
    render(<HoldButton mode="hold" onTrigger={fn} label="⏭" />)
    const btn = screen.getByRole('button', { name: '⏭' })
    act(() => { fireEvent.mouseDown(btn) })
    act(() => { vi.advanceTimersByTime(300) })
    act(() => { fireEvent.mouseUp(btn) })
    act(() => { vi.advanceTimersByTime(500) })
    expect(fn).not.toHaveBeenCalled()
  })

  it('cancels on pointer leave', () => {
    const fn = vi.fn()
    render(<HoldButton mode="hold" onTrigger={fn} label="⏭" />)
    const btn = screen.getByRole('button', { name: '⏭' })
    act(() => { fireEvent.mouseDown(btn) })
    act(() => { vi.advanceTimersByTime(300) })
    act(() => { fireEvent.mouseLeave(btn) })
    act(() => { vi.advanceTimersByTime(500) })
    expect(fn).not.toHaveBeenCalled()
  })

  it('respects custom holdMs', () => {
    const fn = vi.fn()
    render(<HoldButton mode="hold" onTrigger={fn} label="Test" holdMs={1000} />)
    const btn = screen.getByRole('button', { name: 'Test' })
    act(() => { fireEvent.mouseDown(btn) })
    act(() => { vi.advanceTimersByTime(999) })
    expect(fn).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(1) })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does nothing when disabled', () => {
    const fn = vi.fn()
    render(<HoldButton mode="hold" onTrigger={fn} label="⏭" disabled />)
    const btn = screen.getByRole('button', { name: '⏭' })
    act(() => { fireEvent.mouseDown(btn) })
    act(() => { vi.advanceTimersByTime(500) })
    expect(fn).not.toHaveBeenCalled()
  })
})

describe('HoldButton — double-tap mode', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers(); cleanup() })

  it('first tap shows pending, second tap fires onTrigger', () => {
    const fn = vi.fn()
    const { container } = render(
      <HoldButton mode="double-tap" onTrigger={fn} label="⏹" />
    )
    const btn = screen.getByRole('button', { name: '⏹' })

    act(() => { fireEvent.mouseDown(btn) })
    act(() => { fireEvent.mouseUp(btn) })

    expect(container.querySelector('.btn-double-tap.pending')).toBeTruthy()
    expect(fn).not.toHaveBeenCalled()

    act(() => { fireEvent.mouseDown(btn) })
    act(() => { fireEvent.mouseUp(btn) })

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('pending clears after timeout if no second tap', () => {
    const fn = vi.fn()
    const { container } = render(
      <HoldButton mode="double-tap" onTrigger={fn} label="⏹" />
    )
    const btn = screen.getByRole('button', { name: '⏹' })

    act(() => { fireEvent.mouseDown(btn) })
    act(() => { fireEvent.mouseUp(btn) })
    expect(container.querySelector('.btn-double-tap.pending')).toBeTruthy()

    act(() => { vi.advanceTimersByTime(301) })

    expect(container.querySelector('.btn-double-tap.pending')).toBeNull()
    expect(fn).not.toHaveBeenCalled()
  })

  it('does nothing when disabled', () => {
    const fn = vi.fn()
    render(<HoldButton mode="double-tap" onTrigger={fn} label="⏹" disabled />)
    const btn = screen.getByRole('button', { name: '⏹' })
    act(() => { fireEvent.mouseDown(btn) })
    act(() => { fireEvent.mouseUp(btn) })
    expect(fn).not.toHaveBeenCalled()
  })
})
