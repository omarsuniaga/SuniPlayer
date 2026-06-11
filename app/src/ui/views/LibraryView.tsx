import { useEffect, useState } from 'react'
import { FileDropzone } from '../atoms/FileDropzone'
import { importAudioFiles } from '../../application/importActions'
import { useCollectionStore } from '../../application/collectionStore'
import { usePlayerStore } from '../../application/playerStore'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { trackRepo, type PersistedTrack } from '../../infrastructure/dexie'

type LibraryViewProps = {
  onTrackSelected?: () => void
}

type MenuAction = {
  label: string
  disabled?: boolean
  run?: () => void
}

const pageStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '24px 16px 160px',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 18,
}

const pathStyle: React.CSSProperties = {
  color: '#888',
  fontSize: 12,
  padding: '8px 0',
}

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginTop: 12,
}

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto auto',
  gap: 12,
  alignItems: 'center',
  padding: 12,
  border: '1px solid #2a2a2a',
  borderRadius: 10,
  background: '#171717',
}

const titleButtonStyle: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  color: '#eee',
  padding: 0,
  textAlign: 'left',
  cursor: 'pointer',
}

const metaStyle: React.CSSProperties = {
  color: '#aaa',
  fontSize: 12,
  whiteSpace: 'nowrap',
}

const menuButtonStyle: React.CSSProperties = {
  border: '1px solid #444',
  background: '#202020',
  color: '#eee',
  borderRadius: 8,
  padding: '6px 10px',
  cursor: 'pointer',
}

const contextMenuStyle: React.CSSProperties = {
  gridColumn: '1 / -1',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: 8,
  border: '1px solid #333',
  borderRadius: 8,
  background: '#101010',
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  border: 0,
  borderRadius: 6,
  padding: '8px 10px',
  background: '#1f1f1f',
  color: '#eee',
  textAlign: 'left',
}

const emptyStyle: React.CSSProperties = {
  margin: '24px 0',
  padding: 20,
  border: '1px dashed #444',
  borderRadius: 12,
  color: '#aaa',
  textAlign: 'center',
}

const alertStyle: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  border: '1px solid #633',
  borderRadius: 8,
  color: '#ffb4b4',
  background: '#251111',
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remaining = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remaining}`
}

function importedDirectory(filePath: string): string {
  const normalized = filePath.replaceAll('\\', '/')
  const slashIndex = normalized.lastIndexOf('/')
  if (slashIndex < 0) return '/Music/Importadas/'
  return normalized.slice(0, slashIndex + 1)
}

function formatAddedDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })
}

function displayTitle(track: PersistedTrack): string {
  return track.title.trim() || track.filePath.split(/[\\/]/).pop() || track.id
}

export function LibraryView({ onTrackSelected }: LibraryViewProps = {}) {
  const tracks = useCollectionStore((s) => s.tracks)
  const setTracks = useCollectionStore((s) => s.setTracks)
  const addToQueue = useCollectionStore((s) => s.addToQueue)
  const currentTrackId = usePlayerStore((s) => s.currentTrackId)
  const { playTrack } = useAudioEngine()
  const [openMenuTrackId, setOpenMenuTrackId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadPersistedTracks() {
      try {
        const persistedTracks = await trackRepo.getAll()
        if (!cancelled && persistedTracks.length > 0) {
          setTracks(persistedTracks)
        }
      } catch {
        // IndexedDB may be unavailable in tests or private browsing. Keep the in-memory store usable.
      }
    }

    if (tracks.length === 0) {
      void loadPersistedTracks()
    }

    return () => {
      cancelled = true
    }
  }, [setTracks, tracks.length])

  async function handleFilesSelected(files: File[]) {
    setImporting(true)
    setErrors([])
    try {
      const result = await importAudioFiles(files)
      setErrors(result.errors.map((error) => `${error.fileName}: ${error.reason}`))
    } catch (error) {
      setErrors([`Import failed: ${error instanceof Error ? error.message : String(error)}`])
    } finally {
      setImporting(false)
    }
  }

  function play(track: PersistedTrack) {
    playTrack(track)
    onTrackSelected?.()
  }

  function actionsFor(track: PersistedTrack): MenuAction[] {
    return [
      { label: 'Play', run: () => play(track) },
      { label: 'Add to playlist', disabled: true },
      { label: 'Add to queue', run: () => addToQueue({ id: track.id }) },
      { label: 'Link score', disabled: true },
      { label: 'Adjust pitch/tempo', disabled: true },
      { label: 'Save in app', disabled: true },
      { label: 'Remove from library', disabled: true },
    ]
  }

  return (
    <section className="vista-libreria" style={pageStyle} aria-label="Library">
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>LIBRARY</h1>
          <div style={metaStyle}>{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}</div>
        </div>
      </header>

      <div className="search-bar" style={{ marginBottom: 12 }}>
        <input
          type="search"
          placeholder="Search in your library..."
          aria-label="Search in your library"
          disabled
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #333', background: '#151515', color: '#aaa' }}
        />
      </div>

      <div style={pathStyle}>Path: /Music/Importadas/</div>

      {tracks.length === 0 && (
        <div className="view-empty" style={emptyStyle}>
          <div>No tracks in your library yet</div>
          <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>Import audio files from your device to start.</div>
        </div>
      )}

      {tracks.length > 0 && (
        <div role="list" aria-label="Library tracks" style={listStyle}>
          {tracks.map((track) => {
            const title = displayTitle(track)
            const isMenuOpen = openMenuTrackId === track.id
            return (
              <div key={track.id} className="track-row" role="listitem" style={rowStyle}>
                <button
                  type="button"
                  style={{ ...titleButtonStyle, color: track.id === currentTrackId ? '#4caf50' : '#eee' }}
                  onClick={() => play(track)}
                  aria-label={`Play ${title} by ${track.artist}`}
                >
                  <div style={{ fontWeight: 700 }}>{title}</div>
                  <div style={metaStyle}>Name: {title}</div>
                </button>
                <div style={metaStyle}>{formatDuration(track.durationSeconds)}</div>
                <div style={{ ...metaStyle, color: track.bpm ? '#ffd36b' : '#777' }}>{track.bpm ? `${track.bpm} BPM` : 'No BPM'}</div>
                <button
                  type="button"
                  style={menuButtonStyle}
                  onClick={() => setOpenMenuTrackId(isMenuOpen ? null : track.id)}
                  onContextMenu={(event) => {
                    event.preventDefault()
                    setOpenMenuTrackId(track.id)
                  }}
                  aria-label={`More actions for ${title}`}
                >
                  ...
                </button>
                <div style={metaStyle}>{importedDirectory(track.filePath)}</div>
                <div style={metaStyle}>Added: {formatAddedDate(track.createdAt)}</div>
                {isMenuOpen && (
                  <div className="context-menu" role="menu" aria-label={`Actions for ${title}`} style={contextMenuStyle}>
                    {actionsFor(track).map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        role="menuitem"
                        disabled={action.disabled}
                        title={action.disabled ? 'Próximamente' : undefined}
                        style={{ ...menuItemStyle, opacity: action.disabled ? 0.55 : 1, cursor: action.disabled ? 'not-allowed' : 'pointer' }}
                        onClick={() => {
                          if (!action.disabled) action.run?.()
                        }}
                      >
                        <span>{action.label}</span>
                        {action.disabled && <span>Próximamente</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <FileDropzone onFilesSelected={handleFilesSelected} disabled={importing} />
      </div>

      {importing && <div className="view-loading" style={metaStyle}>Importing audio files...</div>}

      {errors.length > 0 && (
        <div role="alert" style={alertStyle}>
          {errors.map((error) => <div key={error}>{error}</div>)}
        </div>
      )}
    </section>
  )
}

