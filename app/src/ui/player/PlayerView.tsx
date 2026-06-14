import { usePlayerStore } from '../../application/playerStore'
import { useSessionStore } from '../../application/sessionStore'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { Slider } from '../atoms/Slider'
import { Button } from '../atoms/Button'
import { ProgressBar } from '../atoms/ProgressBar'
import { useWaveformStore } from '../../application/waveformStore'
import { WaveformCanvas } from '../waveform/WaveformCanvas'
import { useCurrentTrack } from '../hooks/useCurrentTrack'
import { toggleShuffle } from '../../application/collectionActions'
import { useCollectionStore } from '../../application/collectionStore'

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

type PlayerViewProps = {
  onBack?: () => void
}

export function PlayerView({ onBack }: PlayerViewProps = {}) {
  const { trackId, displayName } = useCurrentTrack()
  const playing = usePlayerStore((s) => s.playing)
  const position = usePlayerStore((s) => s.position)
  const duration = usePlayerStore((s) => s.duration)
  const pitch = usePlayerStore((s) => s.pitch)
  const tempo = usePlayerStore((s) => s.tempo)
  const volume = usePlayerStore((s) => s.volume)
  const repeat = usePlayerStore((s) => s.repeat)
  const shuffle = usePlayerStore((s) => s.shuffle)
  const peaks = useWaveformStore((s) => (trackId ? s.peaksByTrackId[trackId] : undefined))

  const { play, pause, stop, seek, setPitch, setTempo, setVolume } = useAudioEngine()
  const setRepeat = usePlayerStore((s) => s.setRepeat)

  const mode = useSessionStore((s) => s.mode)
  const setMode = useSessionStore((s) => s.setMode)

  const queue = useCollectionStore((s) => s.queue)
  const tracks = useCollectionStore((s) => s.tracks)
  const clearQueue = useCollectionStore((s) => s.clearQueue)
  const removeFromQueue = useCollectionStore((s) => s.removeFromQueue)
  const reorderQueue = useCollectionStore((s) => s.reorderQueue)
  const getQueueTotalDuration = useCollectionStore((s) => s.getQueueTotalDuration)

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
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Volver
          </Button>
        )}
        <div style={titleStyle}>{displayName ?? trackId}</div>
      </div>

      {/* Seek bar */}
      <div style={sectionStyle}>
        {peaks && peaks.length > 0 && (
          <WaveformCanvas peaks={peaks} position={position} duration={duration} onSeek={seek} disabled={isLocked} />
        )}
        <ProgressBar position={position} duration={duration} onSeek={seek} disabled={isLocked} />
      </div>

      {/* Transport controls */}
      <div style={controlsRow}>
        <Button variant="icon" size="sm" onClick={stop} aria-label="Stop">
          ⏹
        </Button>
        <Button variant="primary" size="md" onClick={playing ? pause : play} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? '⏸' : '▶'}
        </Button>
        <Button
          variant="icon"
          size="sm"
          onClick={() => setRepeat(repeat === 'none' ? 'playlist' : repeat === 'playlist' ? 'one' : 'none')}
          aria-label={`Repeat: ${repeat}`}
          style={{ color: repeat !== 'none' ? '#2d6cdf' : undefined }}
        >
          {repeat === 'one' ? '🔂' : '🔁'}
        </Button>
        <Button
          variant="icon"
          size="sm"
          onClick={toggleShuffle}
          aria-label={`Shuffle: ${shuffle ? 'on' : 'off'}`}
          style={{ color: shuffle ? '#4caf50' : undefined }}
          disabled={isLocked}
        >
          🔀
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

      {/* QuouList (Queue) */}
      <div style={{ ...sectionStyle, borderTop: '1px solid #2a2a2a', paddingTop: 16, marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#eee', fontSize: 14, fontWeight: 600 }}>COLA DE REPRODUCCIÓN (QUOULIST)</span>
          {queue.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearQueue} style={{ color: '#ff5252' }}>
              Vaciar
            </Button>
          )}
        </div>
        
        {queue.length > 0 ? (
          <>
            <div style={{ color: '#aaa', fontSize: 12 }}>
              Tiempo restante: {formatQueueDuration(getQueueTotalDuration())}
            </div>
            <div role="list" aria-label="Queue tracks" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
              {queue.map((qTrack, index) => {
                const trackInfo = tracks.find((t) => t.id === qTrack.id)
                const title = trackInfo ? (trackInfo.title.trim() || trackInfo.filePath.split(/[\\/]/).pop() || trackInfo.id) : qTrack.id
                return (
                  <div key={`${qTrack.id}-${index}`} role="listitem" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1c1c', padding: '6px 10px', borderRadius: 6 }}>
                    <span style={{ color: '#eee', fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 220 }}>
                      {title}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => reorderQueue(index, index - 1)}
                        disabled={index === 0}
                        aria-label="Subir en cola"
                      >
                        ▲
                      </Button>
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => reorderQueue(index, index + 1)}
                        disabled={index === queue.length - 1}
                        aria-label="Bajar en cola"
                      >
                        ▼
                      </Button>
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => removeFromQueue(index)}
                        style={{ color: '#ff5252' }}
                        aria-label="Quitar de cola"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div style={{ color: '#666', fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
            La cola está vacía. Agregá tracks desde la librería.
          </div>
        )}
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

function formatQueueDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}
