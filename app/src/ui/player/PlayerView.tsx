import { usePlayerStore } from '../../application/playerStore'
import { useSessionStore } from '../../application/sessionStore'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { Slider } from '../atoms/Slider'
import { Button } from '../atoms/Button'
import { ProgressBar } from '../atoms/ProgressBar'

const containerStyle: React.CSSProperties = {
  padding: '24px 16px 160px', // bottom padding for miniplayer
  maxWidth: 480,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const controlsRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 12,
}

const titleStyle: React.CSSProperties = {
  color: '#eee',
  fontSize: 14,
  fontWeight: 600,
  textAlign: 'center',
}

export function PlayerView() {
  const trackId = usePlayerStore((s) => s.currentTrackId)
  const playing = usePlayerStore((s) => s.playing)
  const position = usePlayerStore((s) => s.position)
  const duration = usePlayerStore((s) => s.duration)
  const pitch = usePlayerStore((s) => s.pitch)
  const tempo = usePlayerStore((s) => s.tempo)
  const volume = usePlayerStore((s) => s.volume)
  const repeat = usePlayerStore((s) => s.repeat)

  const { play, pause, stop, seek, setPitch, setTempo, setVolume } = useAudioEngine()
  const setRepeat = usePlayerStore((s) => s.setRepeat)

  const mode = useSessionStore((s) => s.mode)
  const setMode = useSessionStore((s) => s.setMode)

  if (!trackId) {
    return (
      <div style={containerStyle}>
        <p style={{ color: '#666', textAlign: 'center' }}>Select a track to start</p>
      </div>
    )
  }

  const isLocked = mode === 'show'

  return (
    <div style={containerStyle}>
      {/* Track info */}
      <div style={sectionStyle}>
        <div style={titleStyle}>{trackId}</div>
      </div>

      {/* Seek bar */}
      <div style={sectionStyle}>
        <ProgressBar position={position} duration={duration} onSeek={seek} disabled={isLocked} />
      </div>

      {/* Transport controls */}
      <div style={controlsRow}>
        <Button variant="icon" size="sm" onClick={stop} disabled={isLocked} aria-label="Stop">
          ⏹
        </Button>
        <Button variant="primary" size="md" onClick={playing ? pause : play} disabled={isLocked} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? '⏸' : '▶'}
        </Button>
        <Button
          variant="icon"
          size="sm"
          onClick={() => setRepeat(repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none')}
          aria-label={`Repeat: ${repeat}`}
          style={{ color: repeat !== 'none' ? '#2d6cdf' : undefined }}
        >
          {repeat === 'one' ? '🔂' : '🔁'}
        </Button>
      </div>

      {/* Pitch & Tempo */}
      <div style={sectionStyle}>
        <Slider
          value={pitch}
          min={-12}
          max={12}
          step={1}
          onChange={setPitch}
          disabled={isLocked}
          label="Pitch"
          formatValue={(v) => `${v > 0 ? '+' : ''}${v} st`}
        />
        <Slider
          value={tempo}
          min={0.5}
          max={2}
          step={0.05}
          onChange={setTempo}
          disabled={isLocked}
          label="Tempo"
          formatValue={(v) => `${v.toFixed(2)}x`}
        />
      </div>

      {/* Volume */}
      <div style={sectionStyle}>
        <Slider
          value={volume}
          min={0}
          max={1}
          step={0.05}
          onChange={setVolume}
          label="Volume"
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      </div>

      {/* Session mode toggle */}
      <div style={sectionStyle}>
        <div style={controlsRow}>
          <Button
            variant={mode === 'listen' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setMode('listen')}
          >
            🎧 Listen
          </Button>
          <Button
            variant={mode === 'show' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setMode('show')}
          >
            🎤 Show
          </Button>
        </div>
      </div>
    </div>
  )
}
