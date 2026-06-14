// Smart collections generator (docs/componentes/10-algoritmo-mood.md,
// docs/especificaciones/02-modelo-colecciones.md).
// Familia A: curvas de BPM (lineal, curva, exponencial).
// Familia B: más reproducidas (top 20 por contador).

export function generateSmartCollections(songs) {
  const analyzed = songs.filter(s => s.bpm).sort((a, b) => a.bpm - b.bpm);
  const collections = [];

  // --- Lineal: cluster of similar BPM (±5) with the most songs ---
  if (analyzed.length >= 3) {
    let best = null;
    for (const anchor of analyzed) {
      const group = analyzed.filter(s => Math.abs(s.bpm - anchor.bpm) <= 5);
      if (group.length >= 3 && (!best || group.length > best.length)) best = group;
    }
    if (best) {
      const center = Math.round(best.reduce((a, s) => a + s.bpm, 0) / best.length);
      collections.push({
        kind: 'smart', curve: 'lineal',
        name: `${center} BPM Lineal`,
        songIds: best.map(s => s.id),
        bpmRange: [Math.min(...best.map(s => s.bpm)), Math.max(...best.map(s => s.bpm))],
        totalDuration: best.reduce((a, s) => a + (s.duration || 0), 0),
      });
    }
  }

  // --- Exponencial: ascending BPM progression ---
  if (analyzed.length >= 3) {
    const picked = [];
    let lastBpm = -Infinity;
    for (const s of analyzed) {
      if (s.bpm > lastBpm) { picked.push(s); lastBpm = s.bpm; }
    }
    if (picked.length >= 3) {
      collections.push({
        kind: 'smart', curve: 'exponencial',
        name: 'Expo #1',
        songIds: picked.map(s => s.id),
        bpmRange: [picked[0].bpm, picked[picked.length - 1].bpm],
        totalDuration: picked.reduce((a, s) => a + (s.duration || 0), 0),
      });
    }
  }

  // --- Curva: low -> high -> low ---
  if (analyzed.length >= 4) {
    const asc = analyzed.slice();
    const half = Math.ceil(asc.length / 2);
    const up = asc.slice(0, half);
    const down = asc.slice(half).reverse();
    const seq = [...up, ...down];
    collections.push({
      kind: 'smart', curve: 'curva',
      name: 'Curva #1',
      songIds: seq.map(s => s.id),
      bpmRange: [asc[0].bpm, asc[asc.length - 1].bpm],
      totalDuration: seq.reduce((a, s) => a + (s.duration || 0), 0),
    });
  }

  // --- Más Reproducidas: top 20 by play count, tie-break by recency ---
  const played = songs.filter(s => (s.playCount || 0) > 0)
    .sort((a, b) => (b.playCount - a.playCount) || ((b.lastPlayedAt || 0) - (a.lastPlayedAt || 0)))
    .slice(0, 20);
  if (played.length > 0) {
    collections.push({
      kind: 'smart', curve: null, criterio: 'plays',
      name: 'Más Reproducidas',
      songIds: played.map(s => s.id),
      totalDuration: played.reduce((a, s) => a + (s.duration || 0), 0),
    });
  }

  return collections;
}
