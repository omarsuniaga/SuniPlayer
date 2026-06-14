import { useEffect, useRef } from 'react'

export type WaveformMarker = {
  id: string
  position: number
  color: 'green' | 'red' | 'yellow' | 'blue'
  label?: string
}

type WaveformProps = {
  peaks: number[]
  position: number
  duration: number
  onSeek?: (position: number) => void
  disabled?: boolean
  markers?: WaveformMarker[]
}

const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: 120,
  overflow: 'hidden',
  borderRadius: 8,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  cursor: 'pointer',
  touchAction: 'none',
}

const canvasStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  display: 'block',
}

const flatLineStyle: React.CSSProperties = {
  position: 'absolute',
  left: 8,
  right: 8,
  top: '50%',
  height: 2,
  background: '#333',
}

const emptyTextStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#777',
  fontSize: 12,
}

const playheadStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: 2,
  background: '#ff9800',
  boxShadow: '0 0 6px rgba(255,152,0,0.5)',
  transform: 'translateX(-1px)',
  pointerEvents: 'none',
}

const markerColors: Record<WaveformMarker['color'], string> = {
  green: '#4caf50',
  red: '#f44336',
  yellow: '#ffeb3b',
  blue: '#2196f3',
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function percent(position: number, duration: number): number {
  if (duration <= 0) return 0
  return clamp((position / duration) * 100, 0, 100)
}

export function Waveform({ peaks, position, duration, onSeek, disabled = false, markers = [] }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hasPeaks = peaks.length > 0
  const playheadLeft = percent(position, duration)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasPeaks) return

    const rect = canvas.getBoundingClientRect()
    const width = Math.max(1, Math.floor(rect.width || canvas.clientWidth || 1))
    const height = Math.max(1, Math.floor(rect.height || canvas.clientHeight || 120))
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, width, height)
    context.fillStyle = '#4caf50'

    const gap = 2
    const barWidth = Math.max(1, (width - gap * (peaks.length - 1)) / peaks.length)
    const centerY = height / 2

    peaks.forEach((peak, index) => {
      const normalizedPeak = clamp(peak, 0, 1)
      const barHeight = Math.max(2, normalizedPeak * (height - 24))
      const x = index * (barWidth + gap)
      const y = centerY - barHeight / 2
      context.fillRect(x, y, barWidth, barHeight)
    })
  }, [hasPeaks, peaks])

  function handlePointer(clientX: number, target: EventTarget | null) {
    if (disabled || duration <= 0 || !onSeek) return
    if (!(target instanceof HTMLElement)) return

    const rect = target.getBoundingClientRect()
    if (rect.width <= 0) return

    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
    onSeek(ratio * duration)
  }

  return (
    <div
      role="img"
      aria-label="Waveform"
      aria-disabled={disabled}
      onClick={(event) => handlePointer(event.clientX, event.currentTarget)}
      onPointerMove={(event) => {
        if (event.buttons === 1) handlePointer(event.clientX, event.currentTarget)
      }}
      style={{ ...containerStyle, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.55 : 1 }}
    >
      {hasPeaks ? (
        <canvas ref={canvasRef} data-testid="waveform-canvas" style={canvasStyle} aria-hidden="true" />
      ) : (
        <>
          <div style={flatLineStyle} aria-hidden="true" />
          <div style={emptyTextStyle}>Waveform unavailable</div>
        </>
      )}

      {markers.map((marker) => (
        <div
          key={marker.id}
          title={marker.label}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: `${percent(marker.position, duration)}%`,
            bottom: 10,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: markerColors[marker.color],
            transform: 'translateX(-50%)',
          }}
        />
      ))}

      {duration > 0 && <div data-testid="waveform-playhead" style={{ ...playheadStyle, left: `${playheadLeft}%` }} />}
    </div>
  )
}
