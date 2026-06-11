import { useEffect, useRef } from 'react'

type WaveformCanvasProps = {
  peaks: number[]
  position: number
  duration: number
  onSeek?: (position: number) => void
  disabled?: boolean
}

const containerStyle: React.CSSProperties = {
  position: 'relative',
  height: 120,
  width: '100%',
  borderRadius: 12,
  overflow: 'hidden',
  background: '#151515',
  border: '1px solid #2a2a2a',
}

const canvasStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
}

const playheadStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: 2,
  background: '#2d6cdf',
  transform: 'translateX(-1px)',
  pointerEvents: 'none',
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function drawWaveform(canvas: HTMLCanvasElement, peaks: number[]): void {
  const context = canvas.getContext('2d')
  if (!context) return

  const width = canvas.clientWidth || 300
  const height = canvas.clientHeight || 120
  canvas.width = width
  canvas.height = height

  context.clearRect(0, 0, width, height)
  context.fillStyle = '#252525'
  context.fillRect(0, 0, width, height)

  const centerY = height / 2
  if (peaks.length === 0) {
    context.strokeStyle = '#555'
    context.beginPath()
    context.moveTo(0, centerY)
    context.lineTo(width, centerY)
    context.stroke()
    return
  }

  const barWidth = Math.max(1, width / peaks.length)
  context.fillStyle = '#8ab4ff'
  peaks.forEach((peak, index) => {
    const amplitude = clamp(peak, 0, 1)
    const barHeight = Math.max(2, amplitude * height * 0.86)
    const x = index * barWidth
    const y = centerY - barHeight / 2
    context.fillRect(x, y, Math.max(1, barWidth * 0.72), barHeight)
  })
}

export function WaveformCanvas({ peaks, position, duration, onSeek, disabled = false }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const progress = duration > 0 ? clamp(position / duration, 0, 1) : 0

  useEffect(() => {
    if (canvasRef.current) {
      drawWaveform(canvasRef.current, peaks)
    }
  }, [peaks])

  const seekFromClientX = (clientX: number) => {
    if (disabled || duration <= 0) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const width = rect.width || canvas.clientWidth || 1
    const ratio = clamp((clientX - rect.left) / width, 0, 1)
    onSeek?.(ratio * duration)
  }

  return (
    <div
      className={`ui-waveform-container${disabled ? ' show-mode' : ''}`}
      style={{ ...containerStyle, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.65 : 1 }}
      data-testid="waveform-container"
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Waveform"
        aria-disabled={disabled}
        data-testid="waveform-canvas"
        style={canvasStyle}
        onClick={(event) => seekFromClientX(event.clientX)}
        onMouseDown={(event) => seekFromClientX(event.clientX)}
        onMouseMove={(event) => {
          if (event.buttons === 1) seekFromClientX(event.clientX)
        }}
      />
      <div data-testid="waveform-playhead" style={{ ...playheadStyle, left: `${progress * 100}%` }} />
    </div>
  )
}
