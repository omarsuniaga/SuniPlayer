interface ProgressBarProps {
  position: number
  duration: number
  onSeek?: (position: number) => void
  disabled?: boolean
}

function fmt(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const trackStyle: React.CSSProperties = {
  width: '100%',
  height: 6,
  borderRadius: 3,
  appearance: 'none',
  background: '#333',
  outline: 'none',
  cursor: 'pointer',
}

export function ProgressBar({ position, duration, onSeek, disabled }: ProgressBarProps) {
  const progress = duration > 0 ? (position / duration) * 100 : 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: disabled ? 0.4 : 1 }}>
      <span style={{ fontSize: 11, color: '#888', fontVariantNumeric: 'tabular-nums', minWidth: 35, textAlign: 'right' as const }}>
        {fmt(position)}
      </span>
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={0.1}
        value={Math.min(position, duration || 1)}
        disabled={disabled || duration <= 0}
        onChange={(e) => onSeek?.(Number(e.target.value))}
        style={{
          ...trackStyle,
          background: `linear-gradient(to right, #2d6cdf ${progress}%, #333 ${progress}%)`,
        }}
        aria-label="Seek"
      />
      <span style={{ fontSize: 11, color: '#888', fontVariantNumeric: 'tabular-nums', minWidth: 35 }}>
        {fmt(duration)}
      </span>
    </div>
  )
}
