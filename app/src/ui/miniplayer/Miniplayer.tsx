import { usePlayerStore } from '../../application/playerStore'
import { useSessionStore } from '../../application/sessionStore'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { Button } from '../atoms/Button'
import { ProgressBar } from '../atoms/ProgressBar'
import { Slider } from '../atoms/Slider'
import { useCurrentTrack } from '../hooks/useCurrentTrack'

type MiniplayerState = 'empty' | 'active' | 'locked'

function determineState(
  hasTrack: boolean,
  playing: boolean,
  mode: string,
): MiniplayerState {
  if (!hasTrack) return 'empty'
  if (mode === 'show') return 'locked'
  return 'active'
}

const footerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  background: '#1a1a1a',
  borderTop: '1px solid #333',
  padding: '8px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  zIndex: 100,
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

export function Miniplayer() {
  const { trackId, displayName } = useCurrentTrack()
  const playing = usePlayerStore((s) => s.playing)
  const position = usePlayerStore((s) => s.position)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)
  const { play, pause, seek, setVolume } = useAudioEngine()

  const mode = useSessionStore((s) => s.mode)
  const state = determineState(trackId !== null, playing, mode)

  return (
    <footer style={footerStyle}>
      {state === 'empty' && (
        <div style={rowStyle}>
          <span style={{ color: '#666', fontSize: 13, flex: 1, textAlign: 'center' as const }}>
            No track loaded — import audio files to get started
          </span>
        </div>
      )}

      {state === 'locked' && (
        <div style={rowStyle}>
          <span style={{ color: '#aaa', fontSize: 13, flex: 1 }}>
            🔒 Show mode
          </span>
          <Button
            variant="icon"
            size="sm"
            onClick={playing ? pause : play}
            aria-label={playing ? 'Pause' : 'Play'}
            disabled
          >
            {playing ? '⏸' : '▶'}
          </Button>
        </div>
      )}

      {state === 'active' && (
        <>
          <ProgressBar
            position={position}
            duration={duration}
            onSeek={seek}
          />
          <div style={rowStyle}>
            <span style={{ color: '#eee', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
              {displayName ?? 'Unknown track'}
            </span>
            <Button
              variant="icon"
              size="sm"
              onClick={playing ? pause : play}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? '⏸' : '▶'}
            </Button>
          </div>
          <div style={{ ...rowStyle, maxWidth: 200 }}>
            <Slider
              value={volume}
              min={0}
              max={1}
              step={0.05}
              onChange={setVolume}
              formatValue={(v) => `${Math.round(v * 100)}%`}
            />
          </div>
        </>
      )}
    </footer>
  )
}
