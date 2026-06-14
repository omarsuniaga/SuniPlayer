// Implements: docs/especificaciones/03-modelo-sesion.md — "Política de interrupciones por modo"

import { describe, it, expect } from 'vitest'
import { resolveInterruption } from './interruptionPolicy'

describe('resolveInterruption', () => {
  // ── interruption-started ────────────────────────────────────────────────
  describe('interruption-started (call / alarm begins)', () => {
    it('pauses in listen mode while playing', () => {
      expect(resolveInterruption('interruption-started', 'listen', true)).toBe('pause')
    })

    it('pauses in edit mode while playing', () => {
      expect(resolveInterruption('interruption-started', 'edit', true)).toBe('pause')
    })

    it('pauses in show mode while playing', () => {
      expect(resolveInterruption('interruption-started', 'show', true)).toBe('pause')
    })

    it('pauses in listen mode even when not playing', () => {
      // interruption-started always pauses regardless — idempotent
      expect(resolveInterruption('interruption-started', 'listen', false)).toBe('pause')
    })

    it('pauses in show mode even when not playing', () => {
      expect(resolveInterruption('interruption-started', 'show', false)).toBe('pause')
    })
  })

  // ── interruption-ended ──────────────────────────────────────────────────
  describe('interruption-ended (call / alarm finishes)', () => {
    it('resumes in listen mode if was playing before interruption', () => {
      expect(resolveInterruption('interruption-ended', 'listen', true)).toBe('resume')
    })

    it('resumes in edit mode if was playing before interruption', () => {
      expect(resolveInterruption('interruption-ended', 'edit', true)).toBe('resume')
    })

    it('no-op in listen mode if was NOT playing before', () => {
      expect(resolveInterruption('interruption-ended', 'listen', false)).toBe('no-op')
    })

    it('no-op in edit mode if was NOT playing before', () => {
      expect(resolveInterruption('interruption-ended', 'edit', false)).toBe('no-op')
    })

    it('stay-paused in show mode if was playing before (manual resume only)', () => {
      expect(resolveInterruption('interruption-ended', 'show', true)).toBe('stay-paused')
    })

    it('stay-paused in show mode if was NOT playing before', () => {
      // show mode never auto-resumes, regardless of prior state
      expect(resolveInterruption('interruption-ended', 'show', false)).toBe('stay-paused')
    })
  })

  // ── output-disconnected ─────────────────────────────────────────────────
  describe('output-disconnected (cable / Bluetooth unplugged)', () => {
    it('pauses immediately in listen mode', () => {
      expect(resolveInterruption('output-disconnected', 'listen', true)).toBe('pause')
    })

    it('pauses immediately in edit mode', () => {
      expect(resolveInterruption('output-disconnected', 'edit', true)).toBe('pause')
    })

    it('pauses immediately in show mode', () => {
      expect(resolveInterruption('output-disconnected', 'show', true)).toBe('pause')
    })

    it('pauses in listen mode even if not playing', () => {
      expect(resolveInterruption('output-disconnected', 'listen', false)).toBe('pause')
    })

    it('pauses in show mode even if not playing', () => {
      expect(resolveInterruption('output-disconnected', 'show', false)).toBe('pause')
    })
  })
})
