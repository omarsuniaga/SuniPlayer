import { describe, it, expect } from 'vitest'
import { importFile, importMultiple } from './fileSystem'

function createMockFile(name: string, type: string, content: ArrayBuffer): File {
  const file = new File([], name, { type })
  // jsdom's File doesn't support arrayBuffer — polyfill it
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => content,
    writable: false,
  })
  return file
}

function createMockAudioContext(): AudioContext {
  // minimal mock: decodeAudioData returns a promise with a fake AudioBuffer
  return {
    decodeAudioData: async (buffer: ArrayBuffer) => ({
      duration: buffer.byteLength / 1000, // fake: bytes → seconds
      length: 100,
      numberOfChannels: 2,
      sampleRate: 44100,
      getChannelData: () => new Float32Array(100),
    }),
    currentTime: 0,
    createBufferSource: () => ({}),
    createGain: () => ({ connect: () => {}, gain: { value: 1 } }),
    destination: {} as AudioDestinationNode,
    close: async () => {},
  } as unknown as AudioContext
}

describe('fileSystem', () => {
  it('importFile decodes a supported file', async () => {
    const file = createMockFile('Artist - Song.mp3', 'audio/mpeg', new ArrayBuffer(240_000))
    const ctx = createMockAudioContext()
    const result = await importFile(file, ctx)
    expect(result.title).toBe('Song')
    expect(result.artist).toBe('Artist')
    expect(result.durationSeconds).toBe(240)
    expect(result.id).toBeTruthy()
  })

  it('importFile rejects unsupported type', async () => {
    const file = createMockFile('doc.pdf', 'application/pdf', new ArrayBuffer(100))
    const ctx = createMockAudioContext()
    await expect(importFile(file, ctx)).rejects.toThrow('Unsupported file type')
  })

  it('importFile parses "Artist - Title" from filename', async () => {
    const file = createMockFile('Miles Davis - So What.mp3', 'audio/mpeg', new ArrayBuffer(100))
    const ctx = createMockAudioContext()
    const result = await importFile(file, ctx)
    expect(result.artist).toBe('Miles Davis')
    expect(result.title).toBe('So What')
  })

  it('importFile uses filename as title when no dash separator', async () => {
    const file = createMockFile('Podcast Episode.mp3', 'audio/mpeg', new ArrayBuffer(100))
    const ctx = createMockAudioContext()
    const result = await importFile(file, ctx)
    expect(result.artist).toBe('Unknown')
    expect(result.title).toBe('Podcast Episode')
  })

  it('importMultiple skips failed files', async () => {
    const good = createMockFile('good.mp3', 'audio/mpeg', new ArrayBuffer(100))
    const bad = createMockFile('bad.pdf', 'application/pdf', new ArrayBuffer(100))
    const ctx = createMockAudioContext()
    const results = await importMultiple([good, bad], ctx)
    expect(results).toHaveLength(1)
    expect(results[0]!.title).toBe('good')
  })
})
