import { describe, it, expect } from 'vitest'
import { generateSmartCollections } from './moodAlgorithm'
import type { PersistedTrack } from '../infrastructure/dexie'

const createMockTrack = (id: string, bpm: number, duration: number, playCount = 0): PersistedTrack => ({
  id,
  title: `Track ${id}`,
  artist: 'Artist',
  durationSeconds: duration,
  filePath: `/path/${id}.mp3`,
  bpm,
  confidence: 0.9,
  playCount,
  createdAt: new Date(),
  updatedAt: new Date(),
})

describe('moodAlgorithm', () => {
  it('debe generar una colección Lineal si hay tracks suficientes con BPM similar', () => {
    const tracks = [
      createMockTrack('1', 120, 200),
      createMockTrack('2', 122, 200),
      createMockTrack('3', 118, 200),
      createMockTrack('4', 121, 200),
    ]
    
    const collections = generateSmartCollections(tracks)
    const lineal = collections.find(c => c.type === 'LINEAL')
    
    expect(lineal).toBeDefined()
    expect(lineal?.trackIds).toHaveLength(4)
    expect(lineal?.name).toContain('120 BPM Lineal')
  })

  it('no debe generar colecciones si no se cumple el mínimo de 4 canciones', () => {
    const tracks = [
      createMockTrack('1', 120, 200),
      createMockTrack('2', 122, 200),
      createMockTrack('3', 118, 200),
    ]
    
    const collections = generateSmartCollections(tracks)
    expect(collections).toHaveLength(0)
  })

  it('no debe generar colecciones si no se cumple el mínimo de 10 minutos', () => {
    const tracks = [
      createMockTrack('1', 120, 30),
      createMockTrack('2', 122, 30),
      createMockTrack('3', 118, 30),
      createMockTrack('4', 121, 30),
    ]
    
    const collections = generateSmartCollections(tracks)
    // "Más Reproducidas" no tiene restricción de tiempo en la spec, pero las de curva sí
    const bpmCollections = collections.filter(c => c.type !== 'MAS_REPRODUCIDAS')
    expect(bpmCollections).toHaveLength(0)
  })

  it('debe generar "Más Reproducidas" si hay tracks con playCount > 0', () => {
    const tracks = [
      createMockTrack('1', 120, 200, 5),
      createMockTrack('2', 122, 200, 3),
      createMockTrack('3', 118, 200, 10),
      createMockTrack('4', 121, 200, 1),
    ]
    
    const collections = generateSmartCollections(tracks)
    const top = collections.find(c => c.type === 'MAS_REPRODUCIDAS')
    
    expect(top).toBeDefined()
    expect(top?.trackIds[0]).toBe('3') // Mayor playCount primero
  })

  it('debe ignorar tracks con confianza < 50%', () => {
    const tracks = [
      createMockTrack('1', 120, 300),
      createMockTrack('2', 122, 300),
      createMockTrack('3', 118, 300),
      { ...createMockTrack('4', 121, 300), confidence: 0.4 },
    ]
    
    const collections = generateSmartCollections(tracks)
    const bpmCollections = collections.filter(c => c.type !== 'MAS_REPRODUCIDAS')
    expect(bpmCollections).toHaveLength(0) // Quedan solo 3 válidos
  })
})
