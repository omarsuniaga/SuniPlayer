import type { PersistedTrack } from './dexie'

export type EnergyLevel = NonNullable<PersistedTrack['energy']>

export interface BpmAnalysisResult {
  bpm: number
  energy: EnergyLevel
  confidence: number
}

/**
 * Clasifica el nivel de energía basado en el BPM según la spec 04.
 */
export function classifyEnergy(bpm: number): EnergyLevel {
  if (bpm <= 85) return 'suave'
  if (bpm <= 115) return 'media'
  if (bpm <= 140) return 'alta'
  return 'muy-alta'
}

/**
 * Analiza un AudioBuffer para detectar su BPM y nivel de energía.
 * Implementación basada en detección de picos e intervalos en un buffer filtrado.
 */
export async function analyzeBpm(buffer: AudioBuffer): Promise<BpmAnalysisResult> {
  const sampleRate = buffer.sampleRate
  
  // 1. Filtrado de audio para aislar el pulso (100Hz - 150Hz es común para bombos/bajos)
  // Usamos OfflineAudioContext para procesamiento veloz fuera del hilo principal de audio
  const offlineCtx = new OfflineAudioContext(1, buffer.length, sampleRate)
  
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer

  const lowpass = offlineCtx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 150

  const highpass = offlineCtx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 100

  source.connect(lowpass)
  lowpass.connect(highpass)
  highpass.connect(offlineCtx.destination)

  source.start(0)
  const filteredBuffer = await offlineCtx.startRendering()
  const data = filteredBuffer.getChannelData(0)

  // 2. Detección de picos
  const peaks = getPeaks(data, sampleRate)
  
  // 3. Agrupación por intervalos para encontrar el tempo dominante
  const groups = getIntervalGroups(peaks, sampleRate)

  if (groups.length === 0) {
    return { bpm: 0, energy: 'suave', confidence: 0 }
  }

  // 4. Selección del BPM más probable
  // Ordenamos por conteo de ocurrencias
  const sortedGroups = groups.sort((a, b) => b.count - a.count)
  const bestGroup = sortedGroups[0]
  
  if (!bestGroup) {
    return { bpm: 0, energy: 'suave', confidence: 0 }
  }
  
  const bpm = bestGroup.bpm
  
  // Heurística simple para la confianza: 
  // Relación entre el grupo ganador y el total de intervalos encontrados.
  const totalCount = groups.reduce((acc, g) => acc + g.count, 0)
  const confidence = Math.min(1, (bestGroup.count / totalCount) * 2)

  return {
    bpm,
    energy: classifyEnergy(bpm),
    confidence
  }
}

/**
 * Extrae picos de amplitud por encima de un umbral dinámico.
 */
function getPeaks(data: Float32Array, sampleRate: number): number[] {
  const peaks: number[] = []
  const threshold = 0.2 // Umbral de amplitud después de filtrar
  const minDistance = sampleRate * 0.25 // Máximo 240 BPM (0.25s) para evitar rebotes
  
  for (let i = 0; i < data.length; i++) {
    const sample = data[i]
    if (sample !== undefined && Math.abs(sample) > threshold) {
      peaks.push(i)
      i += Math.floor(minDistance)
    }
  }
  return peaks
}

/**
 * Agrupa las distancias entre picos para identificar el BPM más frecuente.
 */
function getIntervalGroups(peaks: number[], sampleRate: number) {
  const groups: { bpm: number; count: number }[] = []
  
  // Comparamos cada pico con los siguientes para encontrar patrones
  for (let i = 0; i < peaks.length; i++) {
    for (let j = i + 1; j < Math.min(i + 15, peaks.length); j++) {
      const peakJ = peaks[j]
      const peakI = peaks[i]
      if (peakJ === undefined || peakI === undefined) continue
      const distance = peakJ - peakI
      const bpm = Math.round(60 / (distance / sampleRate))
      
      // Filtramos por el rango de la spec (60-200)
      if (bpm >= 60 && bpm <= 200) {
        const existingGroup = groups.find(g => Math.abs(g.bpm - bpm) <= 1)
        if (existingGroup) {
          existingGroup.count++
        } else {
          groups.push({ bpm, count: 1 })
        }
      }
    }
  }
  
  return groups
}
