import { useState } from 'react'
import { FileDropzone } from '../atoms/FileDropzone'
import { importAudioFiles } from '../../application/importActions'
import { useCollectionStore } from '../../application/collectionStore'
import { usePlayerStore } from '../../application/playerStore'
import { useAudioEngine } from '../hooks/useAudioEngine'
import type { PersistedTrack } from '../../infrastructure/dexie'

// ---- Helpers ----

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const pad = s.toString().padStart(2, '0')
  return m + ':' + pad
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---- Styles ----

const pageStyle: React.CSSProperties = {
  maxWidth: 640,
  margin: '0 auto',
  padding: '32px 16px',
}

const titleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 600,
  marginBottom: 4,
  color: '#eee',
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#666',
  marginBottom: 24,
}

const trackListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  marginTop: 24,
}

const trackRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 12px',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'background 0.15s',
}

const trackTitleStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: '#eee',
  fontSize: 14,
}

const trackMetaStyle: React.CSSProperties = {
  color: '#888',
  fontSize: 12,
  whiteSpace: 'nowrap',
}

const errorStyle: React.CSSProperties = {
  color: '#f55',
  fontSize: 13,
  marginTop: 12,
  padding: '8px 12px',
  background: '#2a1111',
  borderRadius: 6,
  border: '1px solid #522',
}

const importMoreBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #444',
  color: '#aaa',
  padding: '8px 16px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  marginTop: 16,
  width: '100%',
}

const importingOverlayStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 24,
  color: '#888',
  fontSize: 14,
}

const emptyTracksStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 16,
  color: '#666',
  fontSize: 14,
}

// ---- Component ----

export function FileImportView() {
  const tracks = useCollectionStore((s) => s.tracks)
  const currentTrackId = usePlayerStore((s) => s.currentTrackId)
  const playing = usePlayerStore((s) => s.playing)
  const loading = usePlayerStore((s) => s.loading)
  const { playTrack } = useAudioEngine()
  const [importing, setImporting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [showDropzone, setShowDropzone] = useState(tracks.length === 0)

  async function handleFilesSelected(files: File[]) {
    setImporting(true)
    setErrors([])
    try {
      const result = await importAudioFiles(files)
      if (result.errors.length > 0) {
        setErrors(result.errors.map((e) => e.fileName + ': ' + e.reason))
      }
      if (result.success.length > 0) {
        setShowDropzone(false)
      }
    } catch (err) {
      setErrors(['Import failed: ' + (err instanceof Error ? err.message : String(err))])
    } finally {
      setImporting(false)
    }
  }

  function handleTrackClick(track: PersistedTrack) {
    playTrack(track)
  }

  function trackIcon(trackId: string): string {
    if (trackId === currentTrackId && playing) return '▶'
    if (trackId === currentTrackId && loading) return '⏳'
    return '♫'
  }

  function handleImportMore() {
    setShowDropzone(true)
  }

  // ---- Render ----

  return (
    <div style={pageStyle}>
      <div style={titleStyle}>Your Music</div>
      <div style={subtitleStyle}>
        {tracks.length + ' track' + (tracks.length !== 1 ? 's' : '') + ' imported'}
      </div>

      {showDropzone && !importing && (
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          disabled={importing}
        />
      )}

      {importing && (
        <div style={importingOverlayStyle}>
          Importing audio files...
        </div>
      )}

      {errors.length > 0 && (
        <div style={errorStyle} role="alert">
          {errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}

      {tracks.length > 0 && (
        <>
          <div style={trackListStyle} role="list" aria-label="Imported tracks">
            {tracks.map((track) => (
              <div
                key={track.id}
                role="listitem"
                style={trackRowStyle}
                onClick={() => handleTrackClick(track)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1a1a1a'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = ''
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = '#1a1a1a'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = ''
                }}
                tabIndex={0}
                aria-label={'Play ' + track.title + ' by ' + track.artist}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleTrackClick(track)
                  }
                }}
              >
                <span style={{ color: track.id === currentTrackId ? '#4caf50' : '#666', fontSize: 12, minWidth: 20 }}>{trackIcon(track.id)}</span>
                <div style={trackTitleStyle}>
                  <div>{track.title}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{track.artist}</div>
                </div>
                <div style={trackMetaStyle}>
                  {formatDuration(track.durationSeconds)}
                </div>
                <div style={{ ...trackMetaStyle, color: '#555', fontSize: 11, marginLeft: 8 }}>
                  {formatDate(track.createdAt)}
                </div>
              </div>
            ))}
          </div>

          {!showDropzone && (
            <button
              style={importMoreBtnStyle}
              onClick={handleImportMore}
            >
              + Import more files
            </button>
          )}
        </>
      )}

      {tracks.length === 0 && !showDropzone && !importing && (
        <div style={emptyTracksStyle}>
          No tracks yet. Click above to import your first audio files.
        </div>
      )}
    </div>
  )
}
