import { describe, it, expect, vi } from 'vitest'
import { analyzeBpm, classifyEnergy } from './bpmAnalyzer'

// Mock de OfflineAudioContext
class MockOfflineAudioContext {
  destination = {}
  constructor(public channels: number, public length: number, public sampleRate: number) {}
  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
    }
  }
  createBiquadFilter() {
    return {
      type: '',
      frequency: { value: 0 },
      connect: vi.fn(),
    }
  }
  async startRendering() {
    // Simulamos un buffer con picos cada N samples
    // Si queremos 120 BPM a 44100Hz:
    // 120 beats / 60 seconds = 2 beats/second
    // 44100 samples/second / 2 beats/second = 22050 samples/beat
    const buffer = {
      length: this.length,
      sampleRate: this.sampleRate,
      getChannelData: () => {
        const data = new Float32Array(this.length)
        const interval = Math.floor(this.sampleRate / (120 / 60))
        for (let i = 0; i < this.length; i += interval) {
          data[i] = 1.0 // Pulso perfecto
        }
        return data
      }
    }
    return buffer
  }
}

vi.stubGlobal('OfflineAudioContext', MockOfflineAudioContext)

describe('bpmAnalyzer', () => {
  describe('classifyEnergy', () => {
    it('debe clasificar correctamente según los rangos de la spec', () => {
      expect(classifyEnergy(70)).toBe('suave')
      expect(classifyEnergy(100)).toBe('media')
      expect(classifyEnergy(130)).toBe('alta')
      expect(classifyEnergy(150)).toBe('muy-alta')
    })
  })

  describe('analyzeBpm', () => {
    it('debe detectar 120 BPM en un buffer sintético perfecto', async () => {
      // Creamos un AudioBuffer real (mockeado por jsdom/vitest si hace falta, 
      // pero aquí el OfflineAudioContext es el que manda los datos)
      const mockBuffer = {
        numberOfChannels: 1,
        length: 44100 * 5, // 5 segundos
        sampleRate: 44100,
        getChannelData: () => new Float32Array(44100 * 5)
      } as unknown as AudioBuffer

      const result = await analyzeBpm(mockBuffer)
      
      expect(result.bpm).toBe(120)
      expect(result.energy).toBe('alta')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('debe retornar 0 y confianza 0 si no hay picos', async () => {
      // Sobrescribimos startRendering para este test
      const original = MockOfflineAudioContext.prototype.startRendering
      MockOfflineAudioContext.prototype.startRendering = async function() {
        return {
          length: this.length,
          sampleRate: this.sampleRate,
          getChannelData: () => new Float32Array(this.length) // Silencio
        } as any
      }

      const mockBuffer = {
        numberOfChannels: 1,
        length: 44100,
        sampleRate: 44100,
        getChannelData: () => new Float32Array(44100)
      } as unknown as AudioBuffer

      const result = await analyzeBpm(mockBuffer)
      expect(result.bpm).toBe(0)
      expect(result.confidence).toBe(0)

      MockOfflineAudioContext.prototype.startRendering = original
    })
  })
})
