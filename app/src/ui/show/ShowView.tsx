import { usePlayerStore } from '../../application/playerStore'
import { useSessionStore } from '../../application/sessionStore'
import { useCollectionStore } from '../../application/collectionStore'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { useCurrentTrack } from '../hooks/useCurrentTrack'
import { TimerShow } from './TimerShow'
import { HoldButton } from '../atoms/HoldButton'
import { Button } from '../atoms/Button'

interface ShowViewProps {
  onClose: () => void
}

const containerStyle: React.CSSProperties = {
  padding: '16px 16px 160px',
  maxWidth: 480,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: 8,
  borderBottom: '1px solid #2a2a2a',
}

const headerTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#e74c3c',
  letterSpacing: 1,
}

const headerSetNameStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#aaa',
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#888',
  letterSpacing: 1,
  textTransform: 'uppercase',
}

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  fontSize: 13,
  color: '#ccc',
}

const controlsRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 12,
  flexWrap: 'wrap',
}

export function ShowView({ onClose }: ShowViewProps) {
  const showActive = useSessionStore((s) => s.showActive)
  const showSetName = useSessionStore((s) => s.showSetName)
  const mode = useSessionStore((s) => s.mode)
  const setMode = useSessionStore((s) => s.setMode)
  const stopShow = useSessionStore((s) => s.stopShow)

  const currentTrackId = usePlayerStore((s) => s.currentTrackId)
  const playing = usePlayerStore((s) => s.playing)
  const pitch = usePlayerStore((s) => s.pitch)
  const tempo = usePlayerStore((s) => s.tempo)

  const queue = useCollectionStore((s) => s.queue)
  const tracks = useCollectionStore((s) => s.tracks)
  const removeFromQueue = useCollectionStore((s) => s.removeFromQueue)
  const clearQueue = useCollectionStore((s) => s.clearQueue)

  const { play, pause, toggleMute, isMuted, next, prev } = useAudioEngine()
  const currentTrack = useCurrentTrack()

  const handleStop = () => {
    stopShow()
    onClose()
  }

  // Empty state — show inactive
  if (!showActive) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
          Show inactivo.
        </div>
      </div>
    )
  }

  return (
    <div className="vista-show nav-locked waveform-disabled-seek" style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <span style={headerTitleStyle}>🔴 EN VIVO</span>
          {showSetName && <span style={headerSetNameStyle}> — {showSetName}</span>}
        </div>
      </div>

      {/* Timer */}
      <TimerShow />

      {/* Now Playing */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>NOW PLAYING</span>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#eee' }}>
          {currentTrack?.title || 'Sin track'}
        </div>
        <div style={infoRowStyle}>
          <span>Tono: La M [{pitch >= 0 ? '+' : ''}{pitch}]</span>
          <span>Tempo: {Math.round(tempo * 100)}%</span>
          {currentTrack?.durationSeconds && (
            <span>Duración: {formatDuration(currentTrack.durationSeconds)}</span>
          )}
        </div>
      </div>

      {/* Queue */}
      <div style={{ ...sectionStyle, borderTop: '1px solid #2a2a2a', paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={sectionTitleStyle}>SIGUIENTES EN SET Y COLA</span>
          {queue.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearQueue} style={{ color: '#ff5252' }}>
              Vaciar
            </Button>
          )}
        </div>

        {queue.length > 0 ? (
          <div role="list" aria-label="Queue tracks" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {queue.map((qTrack, index) => {
              const trackInfo = tracks.find((t) => t.id === qTrack.id)
              const title = trackInfo
                ? (trackInfo.title.trim() || trackInfo.filePath.split(/[\\/]/).pop() || trackInfo.id)
                : qTrack.id
              return (
                <div key={`${qTrack.id}-${index}`} role="listitem" style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#1c1c1c', padding: '6px 10px', borderRadius: 6,
                }}>
                  <span style={{
                    color: '#eee', fontSize: 13, textOverflow: 'ellipsis',
                    overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 220,
                  }}>
                    {title}
                  </span>
                  <Button
                    variant="icon" size="sm"
                    onClick={() => removeFromQueue(index)}
                    style={{ color: '#ff5252' }}
                    aria-label="Quitar de cola"
                  >
                    ✕
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ color: '#666', fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
            La cola está vacía.
          </div>
        )}

        <Button variant="secondary" size="sm" onClick={() => {}} aria-label="Completar Set">
          ⏱ Completar Set
        </Button>
      </div>

      {/* Controls */}
      <div style={controlsRow}>
        <HoldButton mode="hold" onTrigger={prev} label="⏮️" holdMs={500} />
        <HoldButton mode="double-tap" onTrigger={handleStop} label="⏹" />
        <Button
          variant="icon"
          size="md"
          onClick={() => (playing ? pause() : play())}
          disabled={!currentTrackId}
          aria-label={playing ? 'Pause' : 'Play'}
          style={{ fontSize: 22, width: 56, height: 56, borderRadius: '50%', background: playing ? '#2d6cdf' : '#333' }}
        >
          {playing ? '⏸' : '▶'}
        </Button>
        <HoldButton mode="hold" onTrigger={next} label="⏭️" holdMs={500} />
        <Button
          variant="icon"
          size="md"
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          style={{ fontSize: 20, width: 56, height: 56, borderRadius: '50%', background: isMuted ? '#c0392b' : '#333' }}
        >
          {isMuted ? '🔇' : '🎤'}
        </Button>
      </div>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
