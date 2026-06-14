import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWakeLock } from './useWakeLock'

describe('useWakeLock', () => {
  const originalWakeLock = navigator.wakeLock

  beforeEach(() => {
    // @ts-expect-error — we control the mock
    delete navigator.wakeLock
  })

  afterEach(() => {
    // @ts-expect-error — restore original
    navigator.wakeLock = originalWakeLock
  })

  it('requests wake lock on mount and releases on unmount', async () => {
    const release = vi.fn().mockResolvedValue(undefined)
    const request = vi.fn().mockResolvedValue({ release })

    Object.defineProperty(navigator, 'wakeLock', {
      value: { request },
      configurable: true,
      writable: true,
    })

    const { unmount } = renderHook(() => useWakeLock())

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith('screen')
    })

    unmount()

    await waitFor(() => {
      expect(release).toHaveBeenCalled()
    })
  })

  it('does not throw when wakeLock API is not supported', () => {
    Object.defineProperty(navigator, 'wakeLock', {
      value: undefined,
      configurable: true,
      writable: true,
    })

    expect(() => {
      renderHook(() => useWakeLock())
    }).not.toThrow()
  })

  it('does not throw when request is rejected', () => {
    const request = vi.fn().mockRejectedValue(new Error('denied'))

    Object.defineProperty(navigator, 'wakeLock', {
      value: { request },
      configurable: true,
      writable: true,
    })

    expect(() => {
      renderHook(() => useWakeLock())
    }).not.toThrow()
  })
})
