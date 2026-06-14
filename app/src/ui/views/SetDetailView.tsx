import { useState, useMemo } from 'react'
import { useCollectionStore } from '../../application/collectionStore'
import { removeTrackFromSet, addTrackToSet } from '../../application/collectionActions'
import { completeSet, type Candidate } from '../../domain/collections/setCompleter'
import type { PersistedTrack } from '../../infrastructure/dexie'

type SetDetailViewProps = {
  setId: string
  onBack: () => void
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const backButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #444',
  color: '#eee',
  borderRadius: 8,
  padding: '6px 12px',
  cursor: 'pointer',
}

const statsCardStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const progressContainerStyle: React.CSSProperties = {
  height: 8,
  background: '#333',
  borderRadius: 4,
  overflow: 'hidden',
  marginTop: 4,
}

const progressBarStyle = (percent: number): React.CSSProperties => ({
  height: '100%',
  width: `${Math.min(percent, 100)}%`,
  background: percent > 100 ? '#f44336' : percent > 90 ? '#4caf50' : '#2196f3',
  transition: 'width 0.3s ease',
})

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  background: '#151515',
  border: '1px solid #222',
  borderRadius: 8,
}

const suggestionCardStyle: React.CSSProperties = {
  background: '#101810',
  border: '1px solid #1b3a1b',
  borderRadius: 12,
  padding: 16,
}

const suggestionRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 10px',
  background: '#152015',
  border: '1px solid #1b3a1b',
  borderRadius: 6,
  marginTop: 8,
}

const actionButtonStyle = (variant: 'danger' | 'success'): React.CSSProperties => ({
  background: variant === 'danger' ? '#351111' : '#113511',
  border: `1px solid ${variant === 'danger' ? '#633' : '#363'}`,
  color: variant === 'danger' ? '#fbb' : '#bfb',
  borderRadius: 6,
  padding: '4px 10px',
  cursor: 'pointer',
  fontSize: 12,
})

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

export function SetDetailView({ setId, onBack }: SetDetailViewProps) {
  const set = useCollectionStore((s) => s.sets.find((item) => item.id === setId))
  const allTracks = useCollectionStore((s) => s.tracks)
  
  const [showSuggestions, setShowSuggestions] = useState(true)

  const setTracks = useMemo(() => {
    if (!set) return []
    return set.trackIds
      .map((id) => allTracks.find((t) => t.id === id))
      .filter((t): t is PersistedTrack => !!t)
  }, [set, allTracks])

  const totalDurationSeconds = useMemo(() => {
    return setTracks.reduce((sum, t) => sum + t.durationSeconds, 0)
  }, [setTracks])

  const targetSeconds = (set?.targetDurationMinutes || 0) * 60
  const remainingSeconds = targetSeconds - totalDurationSeconds
  const percent = targetSeconds > 0 ? (totalDurationSeconds / targetSeconds) * 100 : 0

  const proposal = useMemo(() => {
    if (!set || remainingSeconds <= 0) return null
    
    const candidates: Candidate[] = allTracks.map(t => ({
      id: t.id,
      durationSeconds: t.durationSeconds
    }))
    
    return completeSet({
      remainingSeconds,
      candidates,
      playedIds: set.trackIds,
      toleranceSeconds: 45 // Slightly more generous tolerance for UI
    })
  }, [set, allTracks, remainingSeconds])

  if (!set) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p>Set not found</p>
        <button type="button" onClick={onBack} style={backButtonStyle}>Back to Library</button>
      </div>
    )
  }

  return (
    <div className="set-detail-view" style={containerStyle}>
      <header style={headerStyle}>
        <button type="button" onClick={onBack} style={backButtonStyle}>← Back</button>
        <h2 style={{ margin: 0 }}>{set.name}</h2>
      </header>

      <section className="set-stats" style={statsCardStyle} data-testid="set-stats">
        <div style={{ display: 'flex', justifySelf: 'space-between', fontSize: 14 }}>
          <span>Current: <strong>{formatDuration(totalDurationSeconds)}</strong></span>
          <span>Goal: <strong>{set.targetDurationMinutes}:00</strong></span>
        </div>
        <div style={progressContainerStyle}>
          <div style={progressBarStyle(percent)} />
        </div>
        <div style={{ fontSize: 12, color: remainingSeconds > 0 ? '#aaa' : '#f44336', marginTop: 4 }} data-testid="set-missing">
          {remainingSeconds > 0 
            ? `Missing: ${formatDuration(remainingSeconds)}` 
            : `Over: ${formatDuration(Math.abs(remainingSeconds))}`
          }
        </div>
      </section>

      {remainingSeconds > 0 && proposal && (
        <section className="set-suggestions" style={suggestionCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#bfb' }}>💡 Suggestions</h3>
            <button 
              type="button" 
              style={{ background: 'transparent', border: 0, color: '#8c8', cursor: 'pointer', fontSize: 12 }}
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              {showSuggestions ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showSuggestions && (
            <div style={{ marginTop: 12 }}>
              {proposal.status === 'no-fit' ? (
                <div style={{ fontSize: 13, color: '#8a8', fontStyle: 'italic' }}>
                  No candidates found to fit the remaining time.
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: '#8a8', marginBottom: 8 }}>
                    {proposal.status === 'exact-fit' 
                      ? 'Found an exact combination:' 
                      : `Closest combination (diff ${formatDuration(proposal.deltaSeconds)}):`}
                  </div>
                  {proposal.tracks.map((c) => {
                    const t = allTracks.find(track => track.id === c.id)
                    return (
                      <div key={c.id} style={suggestionRowStyle}>
                        <div style={{ fontSize: 14 }}>
                          <div style={{ fontWeight: 600 }}>{t?.title || c.id}</div>
                          <div style={{ fontSize: 12, color: '#8a8' }}>{formatDuration(c.durationSeconds)}</div>
                        </div>
                        <button 
                          type="button" 
                          style={actionButtonStyle('success')}
                          onClick={() => void addTrackToSet(set.id, c.id)}
                        >
                          Add
                        </button>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}
        </section>
      )}

      <section className="set-tracks">
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Tracks ({setTracks.length})</h3>
        <div style={listStyle}>
          {setTracks.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#666', border: '1px dashed #333', borderRadius: 8 }}>
              Set is empty
            </div>
          )}
          {setTracks.map((track, index) => (
            <div key={`${track.id}-${index}`} style={rowStyle}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.title}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>{formatDuration(track.durationSeconds)}</div>
              </div>
              <button 
                type="button" 
                style={actionButtonStyle('danger')}
                onClick={() => void removeTrackFromSet(set.id, track.id)}
                aria-label={`Remove ${track.title} from set`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
