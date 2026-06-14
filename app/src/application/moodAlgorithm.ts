import type { PersistedTrack } from '../infrastructure/dexie'

export interface SmartCollection {
  id: string
  name: string
  type: 'LINEAL' | 'CURVA' | 'EXPONENCIAL' | 'MAS_REPRODUCIDAS'
  trackIds: string[]
  bpmRange?: { min: number; max: number }
  durationSeconds: number
}

/**
 * Genera todas las colecciones inteligentes posibles según los tracks analizados.
 * Cumple con la Spec 10 y Spec 02 §4.
 */
export function generateSmartCollections(tracks: PersistedTrack[]): SmartCollection[] {
  // Filtramos tracks con análisis válido (confianza >= 50%)
  // Según spec 04 y 10, confianza < 50% no entra en colecciones inteligentes.
  const analyzedTracks = tracks.filter(t => (t.bpm ?? 0) > 0 && (t.confidence ?? 0) >= 0.5)
  
  const collections: SmartCollection[] = []
  
  // 1. Lineales (BPM ±5)
  collections.push(...generateLinealCollections(analyzedTracks))
  
  // 2. Curva (Campana)
  collections.push(...generateCurvaCollections(analyzedTracks))
  
  // 3. Exponencial (Escalada)
  collections.push(...generateEscaladaCollections(analyzedTracks))
  
  // 4. Más Reproducidas (independiente de BPM)
  const topPlayed = generateTopPlayedCollection(tracks)
  if (topPlayed) collections.push(topPlayed)
  
  return collections
}

function generateLinealCollections(tracks: PersistedTrack[]): SmartCollection[] {
  const collections: SmartCollection[] = []
  const sorted = [...tracks].sort((a, b) => (a.bpm ?? 0) - (b.bpm ?? 0))
  
  // Agrupamos por ventanas de 10 BPM (centro ± 5)
  const usedIds = new Set<string>()
  
  for (let centerBpm = 60; centerBpm <= 200; centerBpm += 10) {
    const group = sorted.filter(t => 
      !usedIds.has(t.id) && 
      (t.bpm ?? 0) >= centerBpm - 5 && 
      (t.bpm ?? 0) <= centerBpm + 5
    )
    
    if (group.length >= 4) {
      const duration = group.reduce((acc, t) => acc + t.durationSeconds, 0)
      if (duration >= 600) { // 10 minutes
        collections.push({
          id: `smart-lineal-${centerBpm}`,
          name: `${centerBpm} BPM Lineal`,
          type: 'LINEAL',
          trackIds: group.map(t => t.id),
          bpmRange: { min: centerBpm - 5, max: centerBpm + 5 },
          durationSeconds: duration
        })
        group.forEach(t => usedIds.add(t.id))
      }
    }
  }
  
  return collections
}

function generateCurvaCollections(tracks: PersistedTrack[]): SmartCollection[] {
  const collections: SmartCollection[] = []
  const sorted = [...tracks].sort((a, b) => (a.bpm ?? 0) - (b.bpm ?? 0))
  
  if (sorted.length < 4) return []

  // Mountain sorting: subir y bajar
  // Para simplificar, tomamos una muestra que cubra un rango amplio
  const subida = sorted.filter((_, i) => i % 2 === 0)
  const bajada = [...sorted.filter((_, i) => i % 2 !== 0)].reverse()
  const curva = [...subida, ...bajada]
  
  const duration = curva.reduce((acc, t) => acc + t.durationSeconds, 0)
  if (curva.length >= 4 && duration >= 600) {
    collections.push({
      id: 'smart-curva-1',
      name: 'Curva de Ánimo',
      type: 'CURVA',
      trackIds: curva.map(t => t.id),
      bpmRange: { min: sorted[0]!.bpm!, max: sorted[sorted.length - 1]!.bpm! },
      durationSeconds: duration
    })
  }
  
  return collections
}

function generateEscaladaCollections(tracks: PersistedTrack[]): SmartCollection[] {
  const sorted = [...tracks].sort((a, b) => (a.bpm ?? 0) - (b.bpm ?? 0))
  const escalada: PersistedTrack[] = []
  
  for (const track of sorted) {
    if (escalada.length === 0) {
      escalada.push(track)
    } else {
      const lastBpm = escalada[escalada.length - 1]!.bpm!
      if (track.bpm! >= lastBpm + 3) { // Diferencia mínima de 3 BPM
        escalada.push(track)
      }
    }
  }
  
  const duration = escalada.reduce((acc, t) => acc + t.durationSeconds, 0)
  if (escalada.length >= 4 && duration >= 600) {
    return [{
      id: 'smart-escalada-1',
      name: 'Escalada de Energía',
      type: 'EXPONENCIAL',
      trackIds: escalada.map(t => t.id),
      bpmRange: { min: escalada[0]!.bpm!, max: escalada[escalada.length - 1]!.bpm! },
      durationSeconds: duration
    }]
  }
  
  return []
}

function generateTopPlayedCollection(tracks: PersistedTrack[]): SmartCollection | null {
  const sorted = [...tracks]
    .filter(t => t.playCount > 0)
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 20)
    
  const duration = sorted.reduce((acc, t) => acc + t.durationSeconds, 0)
  if (sorted.length >= 4) {
    return {
      id: 'smart-top-played',
      name: 'Más Reproducidas',
      type: 'MAS_REPRODUCIDAS',
      trackIds: sorted.map(t => t.id),
      durationSeconds: duration
    }
  }
  
  return null
}
