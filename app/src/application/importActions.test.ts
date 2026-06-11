import { beforeEach, describe, expect, it, vi } from 'vitest'
import { importAudioFiles, resetImportAudioContext } from './importActions'
import { useCollectionStore } from './collectionStore'
import { useWaveformStore } from './waveformStore'

const { importFileMock, bulkUpsertMock, getAllMock } = vi.hoisted(() => ({
  importFileMock: vi.fn(),
  bulkUpsertMock: vi.fn(),
  getAllMock: vi.fn(),
}))

vi.mock('../infrastructure/fileSystem', () => ({
  importFile: importFileMock,
}))

vi.mock('../infrastructure/dexie', () => ({
  trackRepo: {
    bulkUpsert: bulkUpsertMock,
    getAll: getAllMock,
  },
}))

function makeAudioBuffer(samples: number[]): AudioBuffer {
  return {
    length: samples.length,
    duration: 2,
    numberOfChannels: 1,
    getChannelData: () => Float32Array.from(samples),
  } as unknown as AudioBuffer
}

describe('importAudioFiles waveform peaks', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    useCollectionStore.getState().reset()
    useWaveformStore.getState().clear()
    resetImportAudioContext()
    vi.stubGlobal('AudioContext', vi.fn(() => ({ close: vi.fn() })))
  })

  it('stores waveform peaks keyed by imported track id', async () => {
    const file = new File(['audio'], 'song.mp3', { type: 'audio/mpeg' })
    const audioBuffer = makeAudioBuffer([0, 0.25, -0.5, 1])
    importFileMock.mockResolvedValue({
      id: 'track-1',
      title: 'Song',
      artist: 'Unknown',
      durationSeconds: 2,
      filePath: 'song.mp3',
      audioBuffer,
    })
    getAllMock.mockResolvedValue([])

    await importAudioFiles([file])

    expect(bulkUpsertMock).toHaveBeenCalledTimes(1)
    expect(useWaveformStore.getState().peaksByTrackId['track-1']).toEqual([0, 0.25, 0.5, 1])
  })

  it('does not publish waveform peaks when persistence fails', async () => {
    const file = new File(['audio'], 'song.mp3', { type: 'audio/mpeg' })
    importFileMock.mockResolvedValue({
      id: 'track-1',
      title: 'Song',
      artist: 'Unknown',
      durationSeconds: 2,
      filePath: 'song.mp3',
      audioBuffer: makeAudioBuffer([0, 1]),
    })
    bulkUpsertMock.mockRejectedValue(new Error('db unavailable'))

    await expect(importAudioFiles([file])).rejects.toThrow('db unavailable')

    expect(useWaveformStore.getState().peaksByTrackId['track-1']).toBeUndefined()
  })
})
