// Implements: docs/especificaciones/03-modelo-sesion.md — "Política de interrupciones por modo"

import type { SessionMode } from '../playback/resolveNext'

export type InterruptionEvent =
  | 'interruption-started'
  | 'interruption-ended'
  | 'output-disconnected'

export type InterruptionResponse = 'pause' | 'resume' | 'stay-paused' | 'no-op'

/**
 * Resolves the audio engine's response to an OS-level audio event.
 *
 * Rules per spec (03-modelo-sesion.md):
 *
 * interruption-started (call / alarm begins):
 *   → always 'pause' in ALL modes, regardless of wasPlaying
 *
 * interruption-ended (call / alarm finishes):
 *   → listen/edit: 'resume' if wasPlayingBeforeInterruption, else 'no-op'
 *   → show: always 'stay-paused' (musician must manually resume — no surprises on stage)
 *
 * output-disconnected (cable / BT unplugged):
 *   → always 'pause' in ALL modes, never auto-resume
 */
export function resolveInterruption(
  event: InterruptionEvent,
  mode: SessionMode,
  wasPlayingBeforeInterruption: boolean,
): InterruptionResponse {
  switch (event) {
    case 'interruption-started':
      return 'pause'

    case 'interruption-ended':
      if (mode === 'show') return 'stay-paused'
      return wasPlayingBeforeInterruption ? 'resume' : 'no-op'

    case 'output-disconnected':
      return 'pause'
  }
}
