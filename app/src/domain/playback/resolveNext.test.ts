// Implements: docs/componentes/01-audio-engine.md — "Resolución de siguiente (next())"

import { describe, it, expect } from 'vitest'
import { resolveNext } from './resolveNext'
import type { Track, PlaybackSource, SessionMode, RepeatMode } from './resolveNext'

const track = (id: string): Track => ({ id })

const source = (tracks: Track[], currentIndex: number): PlaybackSource => ({
  tracks,
  currentIndex,
})

describe('resolveNext', () => {
  // ── Queue priority ──────────────────────────────────────────────────────
  describe('queue wins over source', () => {
    it('plays the first queue item when queue is non-empty', () => {
      const q = [track('q1'), track('q2')]
      const src = source([track('a'), track('b')], 0)
      const result = resolveNext({ queue: q, source: src, mode: 'listen', repeat: 'none' })
      expect(result).toEqual({ action: 'play-queue-item', track: track('q1'), consumeQueueItem: true })
    })

    it('queue item wins even when source also has a next track', () => {
      const q = [track('q1')]
      const src = source([track('a'), track('b')], 0) // b is next in source
      const result = resolveNext({ queue: q, source: src, mode: 'listen', repeat: 'playlist' })
      expect(result.action).toBe('play-queue-item')
    })
  })

  // ── Source next track ───────────────────────────────────────────────────
  describe('source next track (empty queue)', () => {
    it('plays the next source track when queue is empty and source has more', () => {
      const src = source([track('a'), track('b'), track('c')], 1)
      const result = resolveNext({ queue: [], source: src, mode: 'listen', repeat: 'none' })
      expect(result).toEqual({ action: 'play-source-track', track: track('c') })
    })

    it('uses currentIndex+1 as the next source track', () => {
      const tracks = [track('t0'), track('t1'), track('t2')]
      const src = source(tracks, 0)
      const result = resolveNext({ queue: [], source: src, mode: 'edit', repeat: 'none' })
      expect(result).toEqual({ action: 'play-source-track', track: track('t1') })
    })
  })

  // ── End of source, empty queue — listen mode ────────────────────────────
  describe('end of source in listen/edit mode', () => {
    it('repeat=playlist → plays first source track', () => {
      const src = source([track('a'), track('b')], 1) // b is last
      const result = resolveNext({ queue: [], source: src, mode: 'listen', repeat: 'playlist' })
      expect(result).toEqual({ action: 'play-source-track', track: track('a') })
    })

    it('repeat=one → replays the current track', () => {
      const src = source([track('a'), track('b')], 1)
      const result = resolveNext({ queue: [], source: src, mode: 'listen', repeat: 'one' })
      expect(result).toEqual({ action: 'play-source-track', track: track('b') })
    })

    it('repeat=none → stops', () => {
      const src = source([track('a'), track('b')], 1)
      const result = resolveNext({ queue: [], source: src, mode: 'listen', repeat: 'none' })
      expect(result).toEqual({ action: 'stop' })
    })

    it('edit + repeat=playlist → plays first source track', () => {
      const src = source([track('x'), track('y')], 1)
      const result = resolveNext({ queue: [], source: src, mode: 'edit', repeat: 'playlist' })
      expect(result).toEqual({ action: 'play-source-track', track: track('x') })
    })
  })

  // ── End of source — show mode ───────────────────────────────────────────
  describe('show mode always stops at end of source', () => {
    it('show + repeat=playlist → stops (ignores repeat)', () => {
      const src = source([track('a'), track('b')], 1)
      const result = resolveNext({ queue: [], source: src, mode: 'show', repeat: 'playlist' })
      expect(result).toEqual({ action: 'stop' })
    })

    it('show + repeat=one → stops (ignores repeat)', () => {
      const src = source([track('a'), track('b')], 1)
      const result = resolveNext({ queue: [], source: src, mode: 'show', repeat: 'one' })
      expect(result).toEqual({ action: 'stop' })
    })

    it('show + repeat=none → stops', () => {
      const src = source([track('a'), track('b')], 1)
      const result = resolveNext({ queue: [], source: src, mode: 'show', repeat: 'none' })
      expect(result).toEqual({ action: 'stop' })
    })

    it('show + non-empty queue still plays queue item', () => {
      const src = source([track('a')], 0) // last track
      const result = resolveNext({ queue: [track('q1')], source: src, mode: 'show', repeat: 'none' })
      expect(result.action).toBe('play-queue-item')
    })
  })

  // ── Edge cases ──────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('empty source + empty queue → stop', () => {
      const src = source([], 0)
      const result = resolveNext({ queue: [], source: src, mode: 'listen', repeat: 'playlist' })
      expect(result).toEqual({ action: 'stop' })
    })

    it('single-track source at index 0, repeat=playlist → replays first (same track)', () => {
      const src = source([track('only')], 0)
      const result = resolveNext({ queue: [], source: src, mode: 'listen', repeat: 'playlist' })
      expect(result).toEqual({ action: 'play-source-track', track: track('only') })
    })

    it('single-track source at index 0, show mode → stop', () => {
      const src = source([track('only')], 0)
      const result = resolveNext({ queue: [], source: src, mode: 'show', repeat: 'playlist' })
      expect(result).toEqual({ action: 'stop' })
    })
  })
})
