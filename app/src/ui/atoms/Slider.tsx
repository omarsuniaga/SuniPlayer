interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  label?: string
  disabled?: boolean
  formatValue?: (v: number) => string
}

const trackStyle: React.CSSProperties = {
  width: '100%',
  height: 4,
  borderRadius: 2,
  appearance: 'none',
  background: '#444',
  outline: 'none',
  cursor: 'pointer',
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  disabled,
  formatValue,
}: SliderProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, opacity: disabled ? 0.4 : 1 }}>
      {(label || formatValue) && (
        <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#aaa' }}>
          {label && <span>{label}</span>}
          {formatValue && <span>{formatValue(value)}</span>}
        </span>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={trackStyle}
      />
    </label>
  )
}
