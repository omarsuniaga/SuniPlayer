import { PersistedTrack } from '../infrastructure/dexie'

export type EnergyLevel = 'suave' | 'media' | 'alta' | 'muy-alta'

export interface FilterCriteria {
  search?: string
  durationRange?: { min?: number; max?: number } // in minutes
  energyLevels?: EnergyLevel[]
}

/**
 * Pure function to filter tracks based on criteria defined in spec 11.
 */
export function filterTracks(tracks: PersistedTrack[], criteria: FilterCriteria): PersistedTrack[] {
  return tracks.filter((track) => {
    // 1. Search filter (text input)
    if (criteria.search) {
      const searchLower = criteria.search.toLowerCase()
      const matchesTitle = track.title.toLowerCase().includes(searchLower)
      const matchesArtist = track.artist.toLowerCase().includes(searchLower)
      if (!matchesTitle && !matchesArtist) return false
    }

    // 2. Duration filter (AND logic)
    if (criteria.durationRange) {
      const durationMin = (track.durationSeconds || 0) / 60
      if (criteria.durationRange.min !== undefined && durationMin < criteria.durationRange.min) return false
      if (criteria.durationRange.max !== undefined && durationMin > criteria.durationRange.max) return false
    }

    // 3. Energy level filter (AND logic with OR between selected levels)
    if (criteria.energyLevels && criteria.energyLevels.length > 0) {
      if (track.bpm === undefined) return false
      const trackEnergy = getEnergyLevel(track.bpm)
      if (!criteria.energyLevels.includes(trackEnergy)) return false
    }

    return true
  })
}

/**
 * Maps BPM to energy level categories as per spec 11.
 */
export function getEnergyLevel(bpm: number): EnergyLevel {
  if (bpm <= 85) return 'suave'
  if (bpm <= 115) return 'media'
  if (bpm <= 140) return 'alta'
  return 'muy-alta'
}
