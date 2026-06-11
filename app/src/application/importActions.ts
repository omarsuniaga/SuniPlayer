import { importFile } from '../infrastructure/fileSystem'
import { trackRepo } from '../infrastructure/dexie'
import { useCollectionStore } from './collectionStore'
import { useWaveformStore } from './waveformStore'
import { extractPeaks } from './waveform/extractPeaks'
import type { PersistedTrack } from '../infrastructure/dexie'

// ---- Lazy AudioContext for file decoding ----

let _importCtx: AudioContext | null = null

function getImportAudioContext(): AudioContext {
  if (!_importCtx) {
    _importCtx = new AudioContext()
  }
  return _importCtx
}

/** Reset the cached import AudioContext (useful for tests or cleanup). */
export function resetImportAudioContext(): void {
  _importCtx?.close()
  _importCtx = null
}

// ---- Import result ----

export type ImportBatchResult = {
  success: PersistedTrack[]
  errors: { fileName: string; reason: string }[]
}

// ---- Orchestration ----

/**
 * Import one or more audio files:
 *  1. Decode each file via fileSystem.importFile
 *  2. Build PersistedTrack objects (keep raw File as blob for later playback)
 *  3. Persist via trackRepo
 *  4. Reload collectionStore from dexie
 *
 * Runs inside a user gesture (drop/click) so AudioContext works on mobile.
 */
export async function importAudioFiles(files: File[]): Promise<ImportBatchResult> {
  const ctx = getImportAudioContext()
  const success: PersistedTrack[] = []
  const waveformPeaks: { trackId: string; peaks: number[] }[] = []
  const errors: { fileName: string; reason: string }[] = []

  for (const file of files) {
    try {
      const result = await importFile(file, ctx)
      const peaks = extractPeaks(result.audioBuffer, 160)
      const now = new Date()
      const track: PersistedTrack = {
        id: result.id,
        title: result.title,
        artist: result.artist,
        durationSeconds: result.durationSeconds,
        filePath: result.filePath,
        fileBlob: file, // raw File/Blob for later AudioBuffer reconstruction
        playCount: 0,
        createdAt: now,
        updatedAt: now,
      }
      waveformPeaks.push({ trackId: track.id, peaks })
      success.push(track)
    } catch (err) {
      errors.push({
        fileName: file.name,
        reason: err instanceof Error ? err.message : String(err),
      })
    }
  }

  if (success.length > 0) {
    await trackRepo.bulkUpsert(success)
    const waveformStore = useWaveformStore.getState()
    for (const { trackId, peaks } of waveformPeaks) {
      waveformStore.setPeaks(trackId, peaks)
    }
    // Reload full track list into store (catches any concurrent updates)
    const allTracks = await trackRepo.getAll()
    useCollectionStore.getState().setTracks(allTracks)
  }

  return { success, errors }
}
