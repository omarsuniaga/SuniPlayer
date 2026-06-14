import { useEffect, useRef } from 'react'

/**
 * Fire-and-forget hook that requests a Wake Lock (screen wake lock) on mount
 * and releases it on unmount. Silent fallback if the API is not supported.
 *
 * Use when entering Show Mode to prevent screen sleep during live performances.
 */
export function useWakeLock(): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if ('wakeLock' in navigator && navigator.wakeLock) {
      navigator.wakeLock
        .request('screen')
        .then((wl) => {
          sentinelRef.current = wl
        })
        .catch(() => {
          // Silent fallback — unsupported browsers or permission denied
        })
    }

    return () => {
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {
          // Silent cleanup
        })
      }
    }
  }, [])
}
