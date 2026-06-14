import { useEffect, useState } from 'react'
import { useSessionStore } from '../../application/sessionStore'

interface ShowTimerResult {
  elapsed: number
  remaining: number
  total: number
  mode: 'ascending' | 'countdown'
  alertLevel: 'none' | 'warning' | 'danger' | 'overrun'
  formattedTime: string
  formattedRemaining: string
  progressPercent: number
  formattedTotal: string
}

function formatTime(seconds: number): string {
  const totalSeconds = Math.floor(Math.abs(seconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function useShowTimer(): ShowTimerResult {
  const showStartAt = useSessionStore((s) => s.showStartAt)
  const showDuration = useSessionStore((s) => s.showDuration)
  const showActive = useSessionStore((s) => s.showActive)

  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (!showActive || showStartAt === null) return

    const interval = setInterval(() => {
      forceUpdate((n) => n + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [showActive, showStartAt])

  if (!showActive || showStartAt === null) {
    return {
      elapsed: 0,
      remaining: 0,
      total: 0,
      mode: 'ascending',
      alertLevel: 'none',
      formattedTime: '0:00',
      formattedRemaining: '0:00',
      progressPercent: 0,
      formattedTotal: '0:00',
    }
  }

  const now = Date.now()
  const elapsed = Math.floor((now - showStartAt) / 1000)
  const isCountdown = showDuration > 0
  const total = showDuration

  let remaining = 0
  let alertLevel: ShowTimerResult['alertLevel'] = 'none'
  let progressPercent = 0

  if (isCountdown) {
    remaining = Math.max(0, total - elapsed)
    progressPercent = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0

    if (remaining <= 0) {
      alertLevel = 'overrun'
    } else if (remaining <= 300) {
      alertLevel = 'danger'
    } else if (remaining <= 600) {
      alertLevel = 'warning'
    }
  }

  const formattedTime = formatTime(elapsed)
  const formattedRemaining = isCountdown
    ? (remaining < 0 ? '-' : '') + formatTime(remaining)
    : formatTime(elapsed)
  const formattedTotal = formatTime(total)

  return {
    elapsed,
    remaining: isCountdown ? remaining : 0,
    total,
    mode: isCountdown ? 'countdown' : 'ascending',
    alertLevel,
    formattedTime,
    formattedRemaining,
    progressPercent,
    formattedTotal,
  }
}