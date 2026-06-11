import { describe, expect, it } from 'vitest'
import { extractPeaks, type PeakAudioBuffer } from './extractPeaks'

function makeBuffer(channels: number[][]): PeakAudioBuffer {
  const channelData = channels.map((values) => Float32Array.from(values))
  return {
    length: channelData[0]?.length ?? 0,
    numberOfChannels: channelData.length,
    getChannelData: (channel: number) => channelData[channel] ?? new Float32Array(0),
  }
}

describe('extractPeaks', () => {
  it('extracts normalized peaks from a known mono buffer', () => {
    const buffer = makeBuffer([[0, 0.5, -1, 0.25]])

    expect(extractPeaks(buffer, 2)).toEqual([0.5, 1])
  })

  it('does not create more buckets than samples for short buffers', () => {
    const buffer = makeBuffer([[0.25, 0.5]])

    expect(extractPeaks(buffer, 8)).toEqual([0.5, 1])
  })

  it('returns an empty array for an empty buffer', () => {
    const buffer = makeBuffer([[]])

    expect(extractPeaks(buffer, 4)).toEqual([])
  })

  it('averages amplitudes across stereo channels', () => {
    const buffer = makeBuffer([
      [1, 0],
      [0, 0.5],
    ])

    expect(extractPeaks(buffer, 2)).toEqual([1, 0.5])
  })

  it('rejects invalid bucket counts with a clear error', () => {
    const buffer = makeBuffer([[0.25]])

    expect(() => extractPeaks(buffer, 0)).toThrow('buckets must be a positive integer')
  })
})
