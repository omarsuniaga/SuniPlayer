import { useShowTimer } from './useShowTimer'

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  padding: '12px 16px',
  userSelect: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#aaa',
  letterSpacing: 1,
  textTransform: 'uppercase',
}

const timeStyle: React.CSSProperties = {
  fontSize: 56,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: 3,
  lineHeight: 1,
  margin: 0,
  transition: 'color 0.3s ease',
}

const warningColor = '#f5a623'
const dangerColor = '#e74c3c'
const overrunColor = '#e74c3c'

const progressWrapStyle: React.CSSProperties = {
  width: '100%',
  height: 6,
  background: '#333',
  borderRadius: 3,
  overflow: 'hidden',
  marginTop: 4,
}

const progressFillBase: React.CSSProperties = {
  height: '100%',
  borderRadius: 3,
  transition: 'width 1s linear, background-color 0.3s ease',
}

const totalLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#888',
  marginTop: 2,
}

function getAlertColor(alertLevel: string): string | undefined {
  switch (alertLevel) {
    case 'warning': return warningColor
    case 'danger': return dangerColor
    case 'overrun': return overrunColor
    default: return undefined
  }
}

export function TimerShow() {
  const {
    mode,
    elapsed,
    remaining,
    total,
    alertLevel,
    formattedTime,
    formattedRemaining,
    progressPercent,
    formattedTotal,
  } = useShowTimer()

  const isCountdown = mode === 'countdown'
  const alertColor = getAlertColor(alertLevel)
  const isOverrun = alertLevel === 'overrun'

  const resolvedTimeStyle: React.CSSProperties = {
    ...timeStyle,
    color: alertColor ?? '#eee',
    animation: isOverrun ? 'timer-pulse 1s ease-in-out infinite' : undefined,
  }

  return (
    <div
      className={`ui-timer-show ui-timer-show--${mode}`}
      style={containerStyle}
    >
      <span style={labelStyle}>
        {isCountdown ? 'Tiempo Restante' : 'Tiempo'}
      </span>

      <div style={resolvedTimeStyle}>
        {isCountdown ? formattedRemaining : formattedTime}
      </div>

      {isCountdown && (
        <>
          <div style={progressWrapStyle}>
            <div
              className={`ui-timer-progress-bar${alertLevel !== 'none' ? ` ui-timer-progress-bar--${alertLevel}` : ''}`}
              style={{
                ...progressFillBase,
                width: `${Math.min(progressPercent, 100)}%`,
                backgroundColor: alertColor ?? '#4caf50',
              }}
            />
          </div>
          <span style={totalLabelStyle}>Total: {formattedTotal}</span>
        </>
      )}

      {alertLevel !== 'none' && (
        <span
          className={`alert-time-${alertLevel}`}
          style={{
            fontSize: 11,
            color: alertColor,
            marginTop: 2,
            fontWeight: 600,
          }}
        >
          {alertLevel === 'warning' ? '⚠️ 10 min restantes' :
           alertLevel === 'danger' ? '🚨 5 min restantes' :
           alertLevel === 'overrun' ? '⏰ Tiempo agotado' : ''}
        </span>
      )}
    </div>
  )
}
