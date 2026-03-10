/**
 * SetBuilderService Tests
 *
 * Tests criticos para el algoritmo core de SuniPlayer.
 * Este servicio genera sets de canciones que sumen una duracion objetivo.
 */

// ---- Inline implementation for testing (will be extracted to src/services/) ----

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  bpm: number;
  key: string;
  energy: number; // 0-1
  mood: string;
}

interface BuildOptions {
  curve?: 'steady' | 'ascending' | 'descending' | 'wave';
  tolerance?: number; // seconds
  max?: number;
}

function buildSet(repo: Track[], target: number, opts: BuildOptions = {}): Track[] {
  const { curve = 'steady', tolerance = 90, max = 20 } = opts;
  const mx = target + tolerance;
  const mn = target - tolerance;
  let best: Track[] | null = null;
  let bd = Infinity;

  for (let a = 0; a < 300; a++) {
    const sh = [...repo].sort(() => Math.random() - 0.5);
    const set: Track[] = [];
    let tot = 0;
    for (const t of sh) {
      if (set.length >= max) break;
      if (tot + t.duration <= mx) {
        set.push(t);
        tot += t.duration;
      }
    }
    const d = Math.abs(tot - target);
    if (tot >= mn && tot <= mx && d < bd) {
      bd = d;
      best = [...set];
    }
  }

  if (!best) {
    best = [];
    let tot = 0;
    for (const t of [...repo].sort((a, b) => b.duration - a.duration)) {
      if (tot + t.duration <= mx) {
        best.push(t);
        tot += t.duration;
      }
    }
  }

  if (curve === 'ascending') best.sort((a, b) => a.energy - b.energy);
  else if (curve === 'descending') best.sort((a, b) => b.energy - a.energy);

  return best;
}

// ---- Test Data ----

const mockTracks: Track[] = [
  { id: '1', title: 'Track A', artist: 'Artist 1', duration: 190, bpm: 120, key: 'C', energy: 0.7, mood: 'happy' },
  { id: '2', title: 'Track B', artist: 'Artist 2', duration: 220, bpm: 95, key: 'Dm', energy: 0.5, mood: 'calm' },
  { id: '3', title: 'Track C', artist: 'Artist 3', duration: 263, bpm: 63, key: 'Ab', energy: 0.6, mood: 'calm' },
  { id: '4', title: 'Track D', artist: 'Artist 4', duration: 200, bpm: 78, key: 'G', energy: 0.4, mood: 'calm' },
  { id: '5', title: 'Track E', artist: 'Artist 5', duration: 255, bpm: 110, key: 'Gm', energy: 0.5, mood: 'melancholic' },
  { id: '6', title: 'Track F', artist: 'Artist 6', duration: 180, bpm: 72, key: 'C', energy: 0.4, mood: 'calm' },
  { id: '7', title: 'Track G', artist: 'Artist 7', duration: 269, bpm: 63, key: 'Ab', energy: 0.3, mood: 'calm' },
  { id: '8', title: 'Track H', artist: 'Artist 8', duration: 234, bpm: 96, key: 'C#m', energy: 0.8, mood: 'energetic' },
  { id: '9', title: 'Track I', artist: 'Artist 9', duration: 228, bpm: 89, key: 'Bm', energy: 0.85, mood: 'energetic' },
  { id: '10', title: 'Track J', artist: 'Artist 10', duration: 285, bpm: 67, key: 'Bb', energy: 0.35, mood: 'calm' },
];

// ---- Tests ----

describe('SetBuilderService', () => {
  describe('buildSet - basic generation', () => {
    test('generates a non-empty set when tracks are available', () => {
      const result = buildSet(mockTracks, 2700);
      expect(result.length).toBeGreaterThan(0);
    });

    test('generates set within tolerance of target duration', () => {
      const target = 2700; // 45 min
      const tolerance = 90;
      const result = buildSet(mockTracks, target, { tolerance });
      const total = result.reduce((s, t) => s + t.duration, 0);

      expect(total).toBeGreaterThanOrEqual(target - tolerance);
      expect(total).toBeLessThanOrEqual(target + tolerance);
    });

    test('generates set within tolerance for 30 min target', () => {
      const target = 1800;
      const result = buildSet(mockTracks, target, { tolerance: 90 });
      const total = result.reduce((s, t) => s + t.duration, 0);

      expect(total).toBeGreaterThanOrEqual(1710);
      expect(total).toBeLessThanOrEqual(1890);
    });

    test('generates set within tolerance for 60 min target', () => {
      const target = 3600;
      const result = buildSet(mockTracks, target, { tolerance: 90 });
      const total = result.reduce((s, t) => s + t.duration, 0);

      // With only 10 tracks summing ~2324 sec, it won't reach 3600
      // but should get as close as possible
      expect(total).toBeGreaterThan(0);
      expect(total).toBeLessThanOrEqual(target + 90);
    });

    test('respects maximum track count', () => {
      const result = buildSet(mockTracks, 2700, { max: 5 });
      expect(result.length).toBeLessThanOrEqual(5);
    });

    test('does not repeat tracks in the same set', () => {
      const result = buildSet(mockTracks, 2700);
      const ids = result.map(t => t.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  describe('buildSet - energy curves', () => {
    test('ascending curve sorts by energy low to high', () => {
      const result = buildSet(mockTracks, 2700, { curve: 'ascending' });
      for (let i = 1; i < result.length; i++) {
        expect(result[i].energy).toBeGreaterThanOrEqual(result[i - 1].energy);
      }
    });

    test('descending curve sorts by energy high to low', () => {
      const result = buildSet(mockTracks, 2700, { curve: 'descending' });
      for (let i = 1; i < result.length; i++) {
        expect(result[i].energy).toBeLessThanOrEqual(result[i - 1].energy);
      }
    });

    test('steady curve returns tracks without specific order', () => {
      const result = buildSet(mockTracks, 2700, { curve: 'steady' });
      expect(result.length).toBeGreaterThan(0);
      // Just verify it doesn't crash - steady doesn't enforce order
    });
  });

  describe('buildSet - edge cases', () => {
    test('handles empty track list', () => {
      const result = buildSet([], 2700);
      expect(result).toEqual([]);
    });

    test('handles single track', () => {
      const single = [mockTracks[0]];
      const result = buildSet(single, 2700, { tolerance: 2700 });
      expect(result.length).toBeLessThanOrEqual(1);
    });

    test('handles very short target', () => {
      const result = buildSet(mockTracks, 60, { tolerance: 60 });
      expect(result.length).toBeLessThanOrEqual(1);
    });

    test('handles target shorter than shortest track', () => {
      const result = buildSet(mockTracks, 10, { tolerance: 10 });
      // Should return empty or fallback
      expect(result.length).toBeLessThanOrEqual(1);
    });
  });
});

describe('Time formatting utilities', () => {
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  test('formats seconds correctly', () => {
    expect(fmt(0)).toBe('0:00');
    expect(fmt(60)).toBe('1:00');
    expect(fmt(90)).toBe('1:30');
    expect(fmt(2700)).toBe('45:00');
    expect(fmt(3661)).toBe('61:01');
  });

  test('pads single-digit seconds', () => {
    expect(fmt(5)).toBe('0:05');
    expect(fmt(65)).toBe('1:05');
  });
});
