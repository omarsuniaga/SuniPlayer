import { useState, useMemo, useEffect } from 'react'
import { useCollectionStore } from '../../application/collectionStore'
import { usePlayerStore } from '../../application/playerStore'
import { useNavigationStore } from '../../application/navigationStore'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { loadCollections } from '../../application/collectionActions'
import { filterTracks, type FilterCriteria, type EnergyLevel, getEnergyLevel } from '../../application/filters'
import { Slider } from '../atoms/Slider'
import type { PersistedTrack } from '../../infrastructure/dexie'

const pageStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '24px 16px 160px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'rgba(255, 255, 255, 0.4)',
  marginBottom: 12,
}

const searchBarContainerStyle: React.CSSProperties = {
  position: 'relative',
}

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  paddingLeft: 40,
  borderRadius: 12,
  border: '1px solid #333',
  background: '#1a1a1a',
  color: '#eee',
  fontSize: 16,
  outline: 'none',
}

const cardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: 12,
}

const cardStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 12,
  background: '#222',
  border: '1px solid #333',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  cursor: 'pointer',
  transition: 'transform 0.1s',
}

const cardTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 14,
}

const cardMetaStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#aaa',
}

const nowPlayingCardStyle: React.CSSProperties = {
  ...cardStyle,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: '#1a1a1a',
}

const filterPanelStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 12,
  background: 'rgba(255, 255, 255, 0.03)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const chipGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const chipStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 16,
  fontSize: 12,
  cursor: 'pointer',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.06)',
  color: 'rgba(255, 255, 255, 0.6)',
}

const chipSelectedStyle: React.CSSProperties = {
  ...chipStyle,
  borderColor: '#FF9800',
  color: '#FF9800',
  background: 'rgba(255, 152, 0, 0.15)',
}

const trackListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const trackRowStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 10,
  background: '#171717',
  border: '1px solid #2a2a2a',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
}

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 40,
  color: '#666',
  border: '1px dashed #333',
  borderRadius: 12,
}

const energyColors: Record<EnergyLevel, string> = {
  suave: '#4CAF50',
  media: '#FFEB3B',
  alta: '#FF9800',
  'muy-alta': '#F44336',
}

export function HomeView() {
  const tracks = useCollectionStore((s) => s.tracks)
  const playlists = useCollectionStore((s) => s.playlists)
  const sets = useCollectionStore((s) => s.sets)
  const currentTrackId = usePlayerStore((s) => s.currentTrackId)
  const navigate = useNavigationStore((s) => s.navigate)
  const { playTrack } = useAudioEngine()

  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [durationMax, setDurationMax] = useState(60) // in minutes
  const [selectedEnergies, setSelectedEnergies] = useState<EnergyLevel[]>([])

  useEffect(() => {
    void loadCollections()
  }, [])

  const currentTrack = useMemo(() => {
    return tracks.find((t) => t.id === currentTrackId)
  }, [tracks, currentTrackId])

  const criteria: FilterCriteria = useMemo(() => ({
    search,
    durationRange: { max: durationMax },
    energyLevels: selectedEnergies,
  }), [search, durationMax, selectedEnergies])

  const filteredTracks = useMemo(() => {
    if (!search && !selectedEnergies.length && durationMax === 60) return []
    return filterTracks(tracks, criteria)
  }, [tracks, criteria, search, selectedEnergies.length, durationMax])

  const isFiltering = !!search || selectedEnergies.length > 0 || durationMax < 60

  const toggleEnergy = (level: EnergyLevel) => {
    setSelectedEnergies((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    )
  }

  const handleTrackClick = (track: PersistedTrack) => {
    playTrack(track)
    navigate('reproductor')
  }

  const resetFilters = () => {
    setSearch('')
    setDurationMax(60)
    setSelectedEnergies([])
  }

  return (
    <div className="vista-inicio" style={pageStyle}>
      <header style={headerStyle}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>👤</div>
        <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1, margin: 0 }}>🎵 SUNIPLAYER</h1>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          style={{ background: 'transparent', border: 'none', color: showFilters ? '#FF9800' : '#aaa', fontSize: 20, cursor: 'pointer' }}
          aria-label="Toggle filters"
        >
          ⚙️
        </button>
      </header>

      <div className="search-bar" style={searchBarContainerStyle}>
        <span style={{ position: 'absolute', left: 14, top: 12, color: '#666' }}>🔍</span>
        <input
          type="text"
          placeholder="Search tracks, playlists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInputStyle}
          aria-label="Search"
        />
      </div>

      {showFilters && (
        <div className="ui-filter-panel" style={filterPanelStyle}>
          <div>
            <div style={sectionTitleStyle}>Energy Level</div>
            <div style={chipGroupStyle}>
              {(['suave', 'media', 'alta', 'muy-alta'] as EnergyLevel[]).map((level) => {
                const isSelected = selectedEnergies.includes(level)
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleEnergy(level)}
                    style={isSelected ? { ...chipSelectedStyle, borderColor: energyColors[level], color: energyColors[level] } : chipStyle}
                  >
                    {level.toUpperCase()}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Slider
              label="Max Duration"
              min={1}
              max={60}
              value={durationMax}
              onChange={setDurationMax}
              formatValue={(v) => `${v} min`}
            />
          </div>

          <button
            type="button"
            className="btn-reset-filters"
            onClick={resetFilters}
            style={{
              alignSelf: 'flex-end',
              background: 'transparent',
              border: 'none',
              color: '#F44336',
              fontSize: 12,
              cursor: 'pointer',
              padding: 4
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {isFiltering ? (
        <section>
          <div style={sectionTitleStyle}>Search Results ({filteredTracks.length})</div>
          {filteredTracks.length > 0 ? (
            <div style={trackListStyle}>
              {filteredTracks.map((track) => (
                <div
                  key={track.id}
                  style={trackRowStyle}
                  onClick={() => handleTrackClick(track)}
                  role="button"
                  tabIndex={0}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{track.title}</div>
                    <div style={{ fontSize: 12, color: '#aaa' }}>{track.artist}</div>
                  </div>
                  <div style={{ fontSize: 12, color: energyColors[getEnergyLevel(track.bpm || 100)] }}>
                    {track.bpm} BPM
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="view-empty" style={emptyStateStyle}>
              Ninguna colección coincide con los criterios
            </div>
          )}
        </section>
      ) : (
        <>
          {currentTrack && (
            <section>
              <div style={sectionTitleStyle}>Now Playing</div>
              <div style={nowPlayingCardStyle} onClick={() => navigate('reproductor')}>
                <div>
                  <div style={{ fontWeight: 600 }}>{currentTrack.title}</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>{currentTrack.artist}</div>
                </div>
                <div style={{ fontSize: 24 }}>▶</div>
              </div>
            </section>
          )}

          <section>
            <div style={sectionTitleStyle}>Smart Collections</div>
            <div style={cardGridStyle}>
              <div style={cardStyle} title="Próximamente (Fase 2.3)">
                <div style={{ fontSize: 20 }}>📋</div>
                <div style={cardTitleStyle}>CURVA #3</div>
                <div style={cardMetaStyle}>12 tracks</div>
                <div style={{ ...cardMetaStyle, marginTop: 'auto', fontSize: 10 }}>Próximamente</div>
              </div>
              <div style={cardStyle} title="Próximamente (Fase 2.3)">
                <div style={{ fontSize: 20 }}>📋</div>
                <div style={cardTitleStyle}>LINEAL 120</div>
                <div style={cardMetaStyle}>8 tracks</div>
                <div style={{ ...cardMetaStyle, marginTop: 'auto', fontSize: 10 }}>Próximamente</div>
              </div>
            </div>
          </section>

          <section>
            <div style={sectionTitleStyle}>Your Playlists</div>
            <div style={cardGridStyle}>
              {playlists.map((p) => (
                <div key={p.id} style={cardStyle} onClick={() => navigate('libreria')}>
                  <div style={{ fontSize: 20 }}>📁</div>
                  <div style={cardTitleStyle}>{p.name}</div>
                  <div style={cardMetaStyle}>{p.trackIds.length} tracks</div>
                </div>
              ))}
              <div 
                style={{ ...cardStyle, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', minHeight: 100 }} 
                onClick={() => navigate('libreria')}
              >
                <div style={{ fontSize: 32 }}>➕</div>
                <div style={cardMetaStyle}>New Playlist</div>
              </div>
            </div>
          </section>

          {sets.length > 0 && (
            <section>
              <div style={sectionTitleStyle}>Your Sets</div>
              <div style={cardGridStyle}>
                {sets.map((s) => (
                  <div key={s.id} style={cardStyle} onClick={() => navigate('libreria')}>
                    <div style={{ fontSize: 20 }}>🎤</div>
                    <div style={cardTitleStyle}>{s.name}</div>
                    <div style={cardMetaStyle}>{s.trackIds.length} tracks | {s.targetDurationMinutes}m</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {tracks.length === 0 && !isFiltering && (
        <div className="view-onboarding" style={emptyStateStyle}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>Welcome to Suniplayer</div>
          <p style={{ color: '#888', marginBottom: 20 }}>Import some music to start creating collections.</p>
          <button
            type="button"
            onClick={() => navigate('libreria')}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              background: '#FF9800',
              border: 'none',
              color: '#000',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Go to Library
          </button>
        </div>
      )}
    </div>
  )
}
