// Song import pipeline (docs/especificaciones/04-almacenamiento.md §Flujo).
// File -> metadata -> BPM/energy/key analysis -> DB record + cached blob.

import { Songs, AudioCache } from './db.js';
import { decodeBlob, detectBPM, estimateKey, computePeaks, averageAmplitude } from './audio/analyzer.js';

const SUPPORTED = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'webm'];

export function isSupported(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  return SUPPORTED.includes(ext) || file.type.startsWith('audio/');
}

// onProgress(current, total, fileName, phase)
export async function importFiles(files, onProgress = () => { }) {
  const imported = [];
  const list = Array.from(files).filter(isSupported);
  for (let i = 0; i < list.length; i++) {
    const file = list[i];
    onProgress(i, list.length, file.name, 'leyendo');
    try {
      const buffer = await decodeBlob(file);
      onProgress(i, list.length, file.name, 'analizando');
      const bpm = await detectBPM(buffer);
      const key = await estimateKey(buffer);
      const peaks = computePeaks(buffer, 400);
      const song = {
        fileName: file.name,
        name: file.name.replace(/\.[^.]+$/, ''),
        duration: buffer.duration,
        format: file.name.split('.').pop().toLowerCase(),
        size: file.size,
        sampleRate: buffer.sampleRate,
        channels: buffer.numberOfChannels,
        bpm,
        originalKey: key,
        avgAmplitude: averageAmplitude(buffer),
        peaks: Array.from(peaks),
        // user adjustments (defaults per docs/especificaciones/01-modelo-audio.md)
        pitch: 0,
        tempo: 100,
        volume: 75,
        startAt: 0,
        endAt: 0,            // 0 = full duration
        fadeIn: 0,
        fadeOut: 0,
        gap: 1,
        imageData: null,     // dataURL de portada/partitura
        playCount: 0,
        addedAt: Date.now(),
        lastPlayedAt: null,
        cached: true,
      };
      const id = await Songs.add(song);
      song.id = id;
      await AudioCache.put(id, file);
      imported.push(song);
      onProgress(i + 1, list.length, file.name, 'listo');
    } catch (err) {
      console.error('Import failed:', file.name, err);
      onProgress(i + 1, list.length, file.name, 'error');
    }
  }
  return imported;
}
