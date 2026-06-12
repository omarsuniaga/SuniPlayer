// Audio analysis: BPM, energy class, waveform peaks, rough key estimate.
// Runs on import (docs/componentes/04-bpm-analyzer.md, 06-grafica-ondas.md).

const NOTE_NAMES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

export async function decodeBlob(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new OfflineAudioContext(1, 1, 44100);
  return ctx.decodeAudioData(arrayBuffer);
}

// Waveform peaks for canvas rendering (normalized 0..1, `buckets` samples)
export function computePeaks(audioBuffer, buckets = 400) {
  const data = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(data.length / buckets);
  const peaks = new Array(buckets);
  let max = 0;
  for (let i = 0; i < buckets; i++) {
    let peak = 0;
    const start = i * blockSize;
    for (let j = 0; j < blockSize; j += 8) {
      const v = Math.abs(data[start + j]);
      if (v > peak) peak = v;
    }
    peaks[i] = peak;
    if (peak > max) max = peak;
  }
  if (max > 0) for (let i = 0; i < buckets; i++) peaks[i] = peaks[i] / max;
  return peaks;
}

// BPM detection: lowpass-filter the signal offline, detect peaks, build
// an interval histogram and pick the dominant tempo in the 60-200 range.
export async function detectBPM(audioBuffer) {
  const seconds = Math.min(audioBuffer.duration, 60);
  const sampleRate = audioBuffer.sampleRate;
  const offline = new OfflineAudioContext(1, Math.floor(seconds * sampleRate), sampleRate);
  const source = offline.createBufferSource();
  source.buffer = audioBuffer;
  const lowpass = offline.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 150;
  lowpass.Q.value = 1;
  source.connect(lowpass);
  lowpass.connect(offline.destination);
  source.start(0);
  const rendered = await offline.startRendering();
  const data = rendered.getChannelData(0);

  // adaptive threshold peak picking
  let max = 0;
  for (let i = 0; i < data.length; i += 4) { const v = Math.abs(data[i]); if (v > max) max = v; }
  if (max === 0) return null;
  const threshold = max * 0.7;
  const minGap = Math.floor(sampleRate * 0.25); // max 240 BPM
  const peaks = [];
  let i = 0;
  while (i < data.length) {
    if (Math.abs(data[i]) > threshold) {
      peaks.push(i);
      i += minGap;
    } else i++;
  }
  if (peaks.length < 4) return null;

  // histogram of intervals between nearby peaks; adjacent intervals carry
  // the actual beat period, so weight them higher to avoid octave errors
  const counts = {};
  for (let a = 0; a < peaks.length - 1; a++) {
    for (let b = a + 1; b < Math.min(a + 4, peaks.length); b++) {
      let interval = peaks[b] - peaks[a];
      let bpm = 60 / (interval / sampleRate);
      while (bpm < 60) bpm *= 2;
      while (bpm > 200) bpm /= 2;
      const rounded = Math.round(bpm);
      const weight = 4 - (b - a); // adjacent=3, +2=2, +3=1
      counts[rounded] = (counts[rounded] || 0) + weight;
    }
  }
  let best = null, bestCount = 0;
  for (const [bpm, count] of Object.entries(counts)) {
    if (count > bestCount) { bestCount = count; best = Number(bpm); }
  }
  return best;
}

// Energy class per BPM (docs/vistas/03-vista-libreria.md)
export function energyClass(bpm) {
  if (!bpm) return { label: 'Sin analizar', icon: '⚪', key: 'none' };
  if (bpm <= 85) return { label: 'Suave', icon: '🟢', key: 'soft' };
  if (bpm <= 115) return { label: 'Media', icon: '🟡', key: 'medium' };
  if (bpm <= 140) return { label: 'Alta', icon: '🔶', key: 'high' };
  return { label: 'Muy Alta', icon: '🔴', key: 'veryhigh' };
}

// Rough key estimate: dominant pitch class via autocorrelation-free
// chroma from a few FFT frames. Coarse but enough for a label.
export async function estimateKey(audioBuffer) {
  try {
    const sampleRate = audioBuffer.sampleRate;
    const data = audioBuffer.getChannelData(0);
    const fftSize = 8192;
    const chroma = new Array(12).fill(0);
    const frames = 8;
    const hop = Math.floor((data.length - fftSize) / frames);
    if (hop <= 0) return null;
    for (let f = 0; f < frames; f++) {
      const start = f * hop;
      // Goertzel-like energy per semitone bin from C2..B5
      for (let n = 0; n < 48; n++) {
        const freq = 65.41 * Math.pow(2, n / 12); // C2 = 65.41 Hz
        const w = 2 * Math.PI * freq / sampleRate;
        let re = 0, im = 0;
        for (let s = 0; s < fftSize; s += 4) {
          const v = data[start + s];
          re += v * Math.cos(w * s);
          im += v * Math.sin(w * s);
        }
        chroma[n % 12] += Math.sqrt(re * re + im * im);
      }
    }
    let best = 0;
    for (let n = 1; n < 12; n++) if (chroma[n] > chroma[best]) best = n;
    return NOTE_NAMES[best];
  } catch {
    return null;
  }
}

export function transposedKey(originalKey, semitones) {
  const idx = NOTE_NAMES.indexOf(originalKey);
  if (idx === -1) return null;
  return NOTE_NAMES[((idx + semitones) % 12 + 12) % 12];
}

// Average amplitude 0..1
export function averageAmplitude(audioBuffer) {
  const data = audioBuffer.getChannelData(0);
  let sum = 0, count = 0;
  for (let i = 0; i < data.length; i += 16) { sum += Math.abs(data[i]); count++; }
  return count ? sum / count : 0;
}
