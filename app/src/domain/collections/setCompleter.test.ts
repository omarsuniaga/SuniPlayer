// Implements: docs/componentes/18-completador-set.md — "Completador de Set"

import { describe, it, expect } from 'vitest'
import { effectiveDuration, completeSet } from './setCompleter'
import type { Candidate } from './setCompleter'

const c = (id: string, duration: number, customStart?: number, customEnd?: number): Candidate => ({
  id,
  durationSeconds: duration,
  customStartSeconds: customStart,
  customEndSeconds: customEnd,
})

// ── effectiveDuration ──────────────────────────────────────────────────────
describe('effectiveDuration', () => {
  it('uses full duration when no custom points', () => {
    expect(effectiveDuration(c('a', 200))).toBe(200)
  })

  it('trims from customStart only', () => {
    expect(effectiveDuration(c('a', 200, 30))).toBe(170)
  })

  it('trims to customEnd only', () => {
    expect(effectiveDuration(c('a', 200, undefined, 150))).toBe(150)
  })

  it('applies both customStart and customEnd', () => {
    expect(effectiveDuration(c('a', 200, 20, 180))).toBe(160)
  })

  it('customEnd=0 results in 0 (edge case)', () => {
    expect(effectiveDuration(c('a', 200, 0, 0))).toBe(0)
  })
})

// ── completeSet — exact fit ────────────────────────────────────────────────
describe('completeSet — exact fit', () => {
  it('finds single track that exactly matches remaining time', () => {
    const candidates = [c('a', 120), c('b', 200), c('c', 300)]
    const result = completeSet({ remainingSeconds: 200, candidates, playedIds: [] })
    expect(result.status).toBe('exact-fit')
    if (result.status === 'exact-fit') {
      expect(result.tracks.map((t) => t.id)).toContain('b')
      expect(result.totalSeconds).toBe(200)
    }
  })

  it('finds two-track combination that exactly matches', () => {
    const candidates = [c('a', 100), c('b', 150), c('c', 200)]
    const result = completeSet({ remainingSeconds: 250, candidates, playedIds: [] })
    expect(result.status).toBe('exact-fit')
    if (result.status === 'exact-fit') {
      const ids = result.tracks.map((t) => t.id)
      expect(ids).toContain('a')
      expect(ids).toContain('b')
      expect(result.totalSeconds).toBe(250)
    }
  })

  it('uses custom start/end when computing effective duration for fit', () => {
    // effective = 180 - 30 = 150
    const candidates = [c('trimmed', 180, 30)]
    const result = completeSet({ remainingSeconds: 150, candidates, playedIds: [] })
    expect(result.status).toBe('exact-fit')
    if (result.status === 'exact-fit') {
      expect(result.totalSeconds).toBe(150)
    }
  })

  it('falls within tolerance (default 30s)', () => {
    const candidates = [c('a', 220)] // 220 vs 200 → delta=20, within ±30
    const result = completeSet({ remainingSeconds: 200, candidates, playedIds: [] })
    expect(result.status).toBe('exact-fit')
    if (result.status === 'exact-fit') {
      expect(result.totalSeconds).toBe(220)
    }
  })

  it('respects custom tolerance boundary — inside', () => {
    const candidates = [c('a', 210)] // delta=10, tolerance=5 → outside
    const inside = completeSet({ remainingSeconds: 200, candidates, playedIds: [], toleranceSeconds: 15 })
    expect(inside.status).toBe('exact-fit')
  })

  it('respects custom tolerance boundary — outside', () => {
    const candidates = [c('a', 240)] // delta=40, tolerance=30 → outside exact
    const outside = completeSet({ remainingSeconds: 200, candidates, playedIds: [], toleranceSeconds: 30 })
    expect(outside.status).toBe('closest-fit')
  })
})

// ── completeSet — played exclusion ─────────────────────────────────────────
describe('completeSet — played exclusion', () => {
  it('excludes already-played candidates', () => {
    const candidates = [c('played', 200), c('fresh', 200)]
    const result = completeSet({ remainingSeconds: 200, candidates, playedIds: ['played'] })
    expect(result.status).toBe('exact-fit')
    if (result.status === 'exact-fit') {
      expect(result.tracks.map((t) => t.id)).not.toContain('played')
      expect(result.tracks.map((t) => t.id)).toContain('fresh')
    }
  })

  it('no-fit when all candidates are played', () => {
    const candidates = [c('a', 100), c('b', 200)]
    const result = completeSet({ remainingSeconds: 100, candidates, playedIds: ['a', 'b'] })
    expect(result.status).toBe('no-fit')
  })
})

// ── completeSet — closest fit ──────────────────────────────────────────────
describe('completeSet — closest fit', () => {
  it('returns closest-fit with delta when no exact combination exists', () => {
    const candidates = [c('a', 70), c('b', 80)]
    // possible combos: 70, 80, 150 — none within ±30 of 200
    const result = completeSet({ remainingSeconds: 200, candidates, playedIds: [] })
    expect(result.status).toBe('closest-fit')
    if (result.status === 'closest-fit') {
      expect(typeof result.deltaSeconds).toBe('number')
      expect(result.totalSeconds).toBe(150) // 70+80=150, delta=50
    }
  })

  it('deltaSeconds reflects the shortfall correctly', () => {
    const candidates = [c('only', 100)]
    const result = completeSet({ remainingSeconds: 200, candidates, playedIds: [] })
    expect(result.status).toBe('closest-fit')
    if (result.status === 'closest-fit') {
      expect(result.deltaSeconds).toBe(100) // |200 - 100| = 100
    }
  })
})

// ── completeSet — no-fit ───────────────────────────────────────────────────
describe('completeSet — no-fit', () => {
  it('no-fit when candidates list is empty', () => {
    const result = completeSet({ remainingSeconds: 200, candidates: [], playedIds: [] })
    expect(result.status).toBe('no-fit')
    if (result.status === 'no-fit') {
      expect(typeof result.reason).toBe('string')
    }
  })

  it('no-fit when remaining time is 0', () => {
    const result = completeSet({ remainingSeconds: 0, candidates: [c('a', 100)], playedIds: [] })
    expect(result.status).toBe('no-fit')
  })

  it('closest-fit when remaining time is smaller than shortest candidate (spec: best approximation)', () => {
    // Spec error case "semántico" fires only on empty library or zero time.
    // When there are candidates but all overshoot, the engine returns closest-fit
    // so the musician can still see the best available option.
    const candidates = [c('a', 100), c('b', 200)]
    const result = completeSet({ remainingSeconds: 50, candidates, playedIds: [] })
    // 100s is the closest (delta=50); both overshoot so closest-fit is returned
    expect(result.status).toBe('closest-fit')
  })
})
