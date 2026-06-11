export type ImportResult = {
  id: string
  title: string
  artist: string
  durationSeconds: number
  filePath: string
  audioBuffer: AudioBuffer
}

const SUPPORTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp4', 'audio/x-m4a', 'audio/ogg']

function generateId(): string {
  return crypto.randomUUID()
}

function parseMetadata(file: File): { title: string; artist: string } {
  const name = file.name.replace(/\.[^/.]+$/, '')
  // heuristic: "Artist - Title.ext" → split on " - "
  const dashIdx = name.indexOf(' - ')
  if (dashIdx > 0) {
    return {
      artist: name.slice(0, dashIdx).trim(),
      title: name.slice(dashIdx + 3).trim(),
    }
  }
  return { title: name, artist: 'Unknown' }
}

export async function importFile(file: File, audioCtx: AudioContext): Promise<ImportResult> {
  if (!SUPPORTED_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`)
  }

  const arrayBuffer = await file.arrayBuffer()
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  const { title, artist } = parseMetadata(file)

  return {
    id: generateId(),
    title,
    artist,
    durationSeconds: audioBuffer.duration,
    filePath: file.name,
    audioBuffer,
  }
}

export async function importMultiple(files: File[], audioCtx: AudioContext): Promise<ImportResult[]> {
  const results: ImportResult[] = []
  for (const file of files) {
    try {
      const result = await importFile(file, audioCtx)
      results.push(result)
    } catch (err) {
      console.warn(`Failed to import ${file.name}:`, err)
      // skip failed files, continue with the rest
    }
  }
  return results
}
