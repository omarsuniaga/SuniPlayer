import { useRef, useState, useCallback } from 'react'

type HoldButtonMode = 'hold' | 'double-tap'

interface HoldButtonProps {
  mode: HoldButtonMode
  onTrigger: () => void
  label: string
  holdMs?: number
  disabled?: boolean
}

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 20,
  padding: '12px 16px',
  minWidth: 56,
  minHeight: 56,
  background: '#2a2a2a',
  color: '#eee',
  transition: 'background 0.15s, transform 0.15s, opacity 0.15s',
  userSelect: 'none',
}

const pendingStyle: React.CSSProperties = {
  background: '#c0392b',
  transform: 'scale(1.08)',
}

const holdStyle: React.CSSProperties = {
  background: '#555',
  transform: 'scale(1.05)',
}

export function HoldButton({
  mode,
  onTrigger,
  label,
  holdMs = 500,
  disabled = false,
}: HoldButtonProps) {
  const [pending, setPending] = useState(false)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doubleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoldingRef = useRef(false)

  const clearTimers = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (doubleTapTimerRef.current) {
      clearTimeout(doubleTapTimerRef.current)
      doubleTapTimerRef.current = null
    }
    isHoldingRef.current = false
  }, [])

  const handlePointerDown = useCallback(() => {
    if (disabled) return

    if (mode === 'hold') {
      isHoldingRef.current = true
      holdTimerRef.current = setTimeout(() => {
        if (isHoldingRef.current) {
          isHoldingRef.current = false
          onTrigger()
        }
      }, holdMs)
    } else if (mode === 'double-tap') {
      if (pending) {
        // Second tap within the window — confirm
        setPending(false)
        clearTimers()
        onTrigger()
      } else {
        // First tap — set pending with timeout
        setPending(true)
        doubleTapTimerRef.current = setTimeout(() => {
          setPending(false)
        }, 300)
      }
    }
  }, [disabled, mode, pending, holdMs, onTrigger, clearTimers])

  const handlePointerUp = useCallback(() => {
    if (mode === 'hold' && isHoldingRef.current) {
      // Released before hold time — cancel
      isHoldingRef.current = false
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
        holdTimerRef.current = null
      }
    }
  }, [mode])

  const handlePointerLeave = useCallback(() => {
    if (mode === 'hold') {
      isHoldingRef.current = false
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
        holdTimerRef.current = null
      }
    }
  }, [mode])

  return (
    <button
      className={`btn-${mode}${pending ? ' pending' : ''}`}
      style={{
        ...baseStyle,
        ...(pending ? pendingStyle : {}),
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      disabled={disabled}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerLeave}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onTouchCancel={handlePointerLeave}
      aria-label={label}
    >
      {label}
    </button>
  )
}
