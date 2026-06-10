// Implements: docs/componentes/18-completador-set.md — "Completador de Set"

export type Candidate = {
  id: string
  durationSeconds: number
  customStartSeconds?: number
  customEndSeconds?: number
}

export type CompletionProposal =
  | { status: 'exact-fit'; tracks: Candidate[]; totalSeconds: number }
  | { status: 'closest-fit'; tracks: Candidate[]; totalSeconds: number; deltaSeconds: number }
  | { status: 'no-fit'; reason: string }

/**
 * Returns the effective playback duration of a candidate track.
 * Applies custom start/end points when present.
 * effectiveDuration = (customEnd ?? duration) - (customStart ?? 0)
 */
export function effectiveDuration(c: Candidate): number {
  const start = c.customStartSeconds ?? 0
  const end = c.customEndSeconds ?? c.durationSeconds
  return end - start
}

/**
 * Proposes a combination of candidates whose summed effective duration
 * lands within ±toleranceSeconds of remainingSeconds.
 *
 * Algorithm: bounded subset-sum search (DP over seconds, capped at
 * 2×remainingSeconds to stay O(n·target) and correct for musical durations).
 *
 * Returns:
 *   exact-fit  → sum within tolerance of remainingSeconds
 *   closest-fit → best achievable combination outside tolerance
 *   no-fit     → empty library, all played, or remaining < shortest candidate
 */
export function completeSet(input: {
  remainingSeconds: number
  candidates: Candidate[]
  playedIds: string[]
  toleranceSeconds?: number
}): CompletionProposal {
  const { remainingSeconds, playedIds, toleranceSeconds = 30 } = input

  // Exclude already-played candidates
  const available = input.candidates.filter((c) => !playedIds.includes(c.id))

  if (available.length === 0) {
    return { status: 'no-fit', reason: 'No candidates available (all played or library empty)' }
  }

  if (remainingSeconds <= 0) {
    return { status: 'no-fit', reason: 'Remaining time is zero or negative' }
  }

  // Compute effective durations once
  const withDuration = available.map((c) => ({ candidate: c, dur: effectiveDuration(c) }))

  // DP subset-sum
  // dp[s] = subset of candidates achieving exactly s seconds (or undefined)
  // Cap at max(2*remaining, sum_of_all_durations) so single overshooting tracks
  // are still reachable in the table (e.g., 240s track when target is 200s).
  const totalAllDurations = withDuration.reduce((acc, x) => acc + x.dur, 0)
  const cap = Math.max(Math.ceil(remainingSeconds * 2), totalAllDurations) + 1
  const dp = new Array<Candidate[] | null>(cap).fill(null)
  dp[0] = []

  for (const { candidate, dur } of withDuration) {
    if (dur <= 0) continue
    // Iterate backwards to avoid reusing the same candidate (0/1 knapsack)
    for (let s = cap - 1; s >= dur; s--) {
      const prev = dp[s - dur]
      if (prev !== null && dp[s] === null) {
        dp[s] = [...prev, candidate]
      }
    }
  }

  // Find best result: minimise |s - remainingSeconds|
  let bestDelta = Infinity
  let bestSum = -1

  for (let s = 1; s < cap; s++) {
    if (dp[s] !== null) {
      const delta = Math.abs(s - remainingSeconds)
      if (delta < bestDelta) {
        bestDelta = delta
        bestSum = s
      }
    }
  }

  if (bestSum === -1) {
    return { status: 'no-fit', reason: 'No combination could be built' }
  }

  const tracks = dp[bestSum] as Candidate[]

  if (bestDelta <= toleranceSeconds) {
    return { status: 'exact-fit', tracks, totalSeconds: bestSum }
  }

  return {
    status: 'closest-fit',
    tracks,
    totalSeconds: bestSum,
    deltaSeconds: bestDelta,
  }
}
