import { useState } from 'react'
import type { PersistedTrack } from '../../infrastructure/dexie'
import { Button } from './Button'

// ---- Types ----

type EnergyLevel = 'suave' | 'media' | 'alta' | 'muy-alta'

const ENERGY_OPTIONS: { value: EnergyLevel; label: string; color: string }[] = [
  { value: 'suave', label: 'Suave', color: '#4CAF50' },
  { value: 'media', label: 'Media', color: '#FFEB3B' },
  { value: 'alta', label: 'Alta', color: '#FF9800' },
  { value: 'muy-alta', label: 'Muy Alta', color: '#F44336' },
]

// ---- Styles ----

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9000,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 400,
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: 14,
  padding: 24,
  boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
}

const h2Style: React.CSSProperties = {
  margin: '0 0 4px',
  fontSize: 18,
  fontWeight: 700,
  color: '#eee',
}

const fieldGroupStyle: React.CSSProperties = {
  marginTop: 20,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#888',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #333',
  background: '#111',
  color: '#eee',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
}

const btnRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  justifyContent: 'flex-end',
  marginTop: 24,
}

// ---- Component ----

type TrackProfileModalProps = {
  track: PersistedTrack
  onSave: (updates: Partial<PersistedTrack>) => void
  onClose: () => void
}

export function TrackProfileModal({ track, onSave, onClose }: TrackProfileModalProps) {
  const [title, setTitle] = useState(track.title)
  const [artist, setArtist] = useState(track.artist)
  const [bpm, setBpm] = useState(track.bpm?.toString() ?? '')
  const [energy, setEnergy] = useState<EnergyLevel | ''>(track.energy ?? '')

  const handleSave = () => {
    const updates: Partial<PersistedTrack> = {
      title: title.trim() || track.title,
      artist: artist.trim() || track.artist,
      bpm: bpm ? Math.max(0, Math.round(Number(bpm))) : undefined,
      energy: (energy as EnergyLevel) || undefined,
    }
    onSave(updates)
    onClose()
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={h2Style}>Editar metadata</h2>
        <p style={{ color: '#888', fontSize: 12, margin: '4px 0 0' }}>
          {track.filePath.split(/[\\/]/).pop()}
        </p>

        {/* Title & Artist */}
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Título</label>
          <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Artista</label>
          <input style={inputStyle} value={artist} onChange={(e) => setArtist(e.target.value)} />
        </div>

        {/* BPM & Energy */}
        <div style={{ ...fieldGroupStyle, ...rowStyle }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>BPM</label>
            <input
              style={inputStyle}
              type="number"
              min={0}
              max={300}
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              placeholder="—"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Energía</label>
            <select
              style={inputStyle}
              value={energy}
              onChange={(e) => setEnergy(e.target.value as EnergyLevel | '')}
            >
              <option value="">—</option>
              {ENERGY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current values display */}
        <div style={{ marginTop: 16, padding: '10px 12px', background: '#111', borderRadius: 8, fontSize: 12, color: '#666' }}>
          {track.bpm && <span>BPM detectado: {track.bpm} &nbsp;|&nbsp; </span>}
          {track.energy && <span>Energía detectada: {track.energy}</span>}
          {!track.bpm && !track.energy && <span>Sin análisis automático</span>}
        </div>

        {/* Actions */}
        <div style={btnRowStyle}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}
