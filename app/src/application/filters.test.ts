import { describe, it, expect } from 'vitest'
import { filterTracks, getEnergyLevel, type FilterCriteria } from './filters'
import type { PersistedTrack } from '../infrastructure/dexie'

function makeTrack(overrides: Partial<PersistedTrack> = {}): PersistedTrack {
  return {
    id: '1',
    title: 'Title',
    artist: 'Artist',
    durationSeconds: 120,
    filePath: 'path',
    playCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

const mockTracks: PersistedTrack[] = [
  makeTrack({
    id: '1',
    title: 'Salsa Brava',
    artist: 'La Sonora',
    durationSeconds: 240, // 4 min
    bpm: 128, // Alta
  }),
  makeTrack({
    id: '2',
    title: 'Bachata Rosa',
    artist: 'Juan Luis',
    durationSeconds: 180, // 3 min
    bpm: 110, // Media
  }),
  makeTrack({
    id: '3',
    title: 'Ambient Chill',
    artist: 'Nature',
    durationSeconds: 600, // 10 min
    bpm: 75, // Suave
  }),
  makeTrack({
    id: '4',
    title: 'Hard Techno',
    artist: 'Dark DJ',
    durationSeconds: 300, // 5 min
    bpm: 150, // Muy Alta
  }),
]

describe('getEnergyLevel', () => {
  it('classifies energy levels correctly according to spec 11', () => {
    expect(getEnergyLevel(70)).toBe('suave')
    expect(getEnergyLevel(85)).toBe('suave')
    expect(getEnergyLevel(86)).toBe('media')
    expect(getEnergyLevel(115)).toBe('media')
    expect(getEnergyLevel(116)).toBe('alta')
    expect(getEnergyLevel(140)).toBe('alta')
    expect(getEnergyLevel(141)).toBe('muy-alta')
    expect(getEnergyLevel(200)).toBe('muy-alta')
  })
})

describe('filterTracks', () => {
  it('filters by search text (title or artist)', () => {
    expect(filterTracks(mockTracks, { search: 'salsa' })).toHaveLength(1)
    expect(filterTracks(mockTracks, { search: 'sonora' })).toHaveLength(1)
    expect(filterTracks(mockTracks, { search: 'bachata' })).toHaveLength(1)
    expect(filterTracks(mockTracks, { search: 'nonexistent' })).toHaveLength(0)
  })

  it('filters by duration range', () => {
    // 3 min to 5 min
    const criteria: FilterCriteria = { durationRange: { min: 3, max: 5 } }
    const result = filterTracks(mockTracks, criteria)
    expect(result).toHaveLength(3) // Salsa (4), Bachata (3), Techno (5)
    expect(result.map(t => t.id)).toContain('1')
    expect(result.map(t => t.id)).toContain('2')
    expect(result.map(t => t.id)).toContain('4')
  })

  it('filters by energy levels', () => {
    expect(filterTracks(mockTracks, { energyLevels: ['suave'] })).toHaveLength(1)
    expect(filterTracks(mockTracks, { energyLevels: ['media', 'alta'] })).toHaveLength(2)
  })

  it('combines search and energy levels', () => {
    const criteria: FilterCriteria = { 
      search: 'a', // Matches all but Hard Techno
      energyLevels: ['alta'] 
    }
    const result = filterTracks(mockTracks, criteria)
    expect(result).toHaveLength(1)
    expect(result[0]!.title).toBe('Salsa Brava')
  })

  it('returns empty array when no matches', () => {
    expect(filterTracks(mockTracks, { search: 'xyz', energyLevels: ['suave'] })).toHaveLength(0)
  })

  it('handles tracks without BPM correctly', () => {
    const trackNoBpm = makeTrack({ id: '5', bpm: undefined })
    expect(filterTracks([trackNoBpm], { energyLevels: ['alta'] })).toHaveLength(0)
    expect(filterTracks([trackNoBpm], { search: 'Title' })).toHaveLength(1)
  })
})
