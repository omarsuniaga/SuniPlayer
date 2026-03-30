import { Track } from \"@suniplayer/core\";

/** Generate a waveform visualization array for the Wave component */
export function genWave(seed: number, n = 100): number[] {
    const d: number[] = [];
    let v = 0.3;
    for (let i = 0; i < n; i++) {
        v += Math.sin(i * 0.15 + seed) * 0.12
            + Math.cos(i * 0.08 + seed * 2) * 0.08
            + (Math.random() - 0.5) * 0.15;
        v = Math.max(0.05, Math.min(1, v));
        d.push(v);
    }
    return d;
}

// ── Mood distance matrix (lower = more compatible) ────────────────────────────
const MOOD_DIST: Record<string, Record<string, number>> = {
    happy: { happy: 0, calm: 1, melancholic: 2, energetic: 1 },
    calm: { happy: 1, calm: 0, melancholic: 1, energetic: 2 },
    melancholic: { happy: 2, calm: 1, melancholic: 0, energetic: 3 },
    energetic: { happy: 1, calm: 2, melancholic: 3, energetic: 0 },
};

/** Score a sequence: higher = smoother BPM & mood transitions */
function scoreTransitions(tracks: Track[]): number {
    if (tracks.length < 2) return 0;
    let score = 0;
    for (let i = 1; i < tracks.length; i++) {
        const bpmDiff = Math.abs(tracks[i].bpm - tracks[i - 1].bpm);
        score += bpmDiff > 40 ? -2 : bpmDiff < 15 ? 1 : 0;
        const md = MOOD_DIST[tracks[i - 1].mood]?.[tracks[i].mood] ?? 1;
        score += md === 0 ? 1 : md === 1 ? 0 : -(md * 0.5);
    }
    return score;
}

interface BuildOpts {
    curve?: string;
    /** Tolerance in SECONDS around the target. Default: adaptive */
    tol?: number;
    /** BPM range filter — tracks outside this range are excluded before generation */
    bpmMin?: number;
    bpmMax?: number;
    /** Venue type — biases the energy range of selected tracks */
    venue?: string;
}

// ── Venue → energy range bias ─────────────────────────────────────────────────
const VENUE_ENERGY: Record<string, [number, number]> = {
    lobby:    [0.3,  0.7],   // Neutral ambient, not too intense
    dinner:   [0.2,  0.6],   // Quiet dinner, soft music
    cocktail: [0.5,  0.85],  // Lively but not club-level
    event:    [0.65, 1.0],   // High energy, celebration
    cruise:   [0.0,  1.0],   // No restriction (variety)
};

/**
 * Build an optimized performance set.
 *
 * @param repo    Full track catalog
 * @param target  Target duration in SECONDS (e.g. 45*60 = 2700)
 * @param opts    curve, tolerance, bpmMin, bpmMax, venue
 */
export function buildSet(
    repo: Track[],
    target: number,
    opts: BuildOpts = {}
): Track[] {
    const { curve = "steady", bpmMin, bpmMax, venue } = opts;

    // ── Pre-filter by BPM range ───────────────────────────────────────────────
    const bpmFiltered = (bpmMin !== undefined || bpmMax !== undefined)
        ? repo.filter(t =>
            (bpmMin === undefined || t.bpm >= bpmMin) &&
            (bpmMax === undefined || t.bpm <= bpmMax)
        )
        : repo;

    // ── Pre-filter by venue energy range ─────────────────────────────────────
    let workRepo = bpmFiltered.length >= 3 ? bpmFiltered : repo;
    if (venue && VENUE_ENERGY[venue]) {
        const [eMin, eMax] = VENUE_ENERGY[venue];
        const venueFiltered = workRepo.filter(t => t.energy >= eMin && t.energy <= eMax);
        // Only apply if enough tracks remain; otherwise fall back to BPM-filtered set
        workRepo = venueFiltered.length >= 3 ? venueFiltered : workRepo;
    }

    // Adaptive tolerance: 15% of target or at least 180s (3 min), capped at 300s
    const adaptiveTol = Math.max(180, Math.min(300, Math.round(target * 0.15)));
    const tol = opts.tol !== undefined ? opts.tol : adaptiveTol;

    const mn = target - tol;
    const mx = target + tol;

    let best: Track[] | null = null;
    let bestScore = -Infinity;
    let bestDist = Infinity; // distance from target when no valid set found

    // ── Phase 1: Monte Carlo (600 iterations) ────────────────────────────────
    for (let attempt = 0; attempt < 600; attempt++) {
        const shuffled = [...workRepo].sort(() => Math.random() - 0.5);
        const candidate: Track[] = [];
        let tot = 0;

        for (const t of shuffled) {
            const d = t.duration_ms / 1000;
            if (tot + d <= mx) {
                candidate.push(t);
                tot += d;
            }
            // Stop early if we're well into the target range
            if (tot >= mn && (tot >= target - 30)) break;
        }

        const dist = Math.abs(tot - target);

        if (tot >= mn && tot <= mx && candidate.length > 0) {
            // Valid set — score it
            const score = scoreTransitions(candidate) - (dist / 60);
            if (score > bestScore) {
                bestScore = score;
                best = [...candidate];
            }
        } else if (!best && dist < bestDist) {
            // Not yet valid — track the closest attempt as fallback
            bestDist = dist;
            best = [...candidate];
        }
    }

    // ── Phase 2: Greedy fallback (always produces a result) ──────────────────
    if (!best || best.length === 0) {
        best = [];
        let tot = 0;
        // Sort longest-first for greedy fill
        const sorted = [...workRepo].sort((a, b) => b.duration_ms - a.duration_ms);
        for (const t of sorted) {
            const d = t.duration_ms / 1000;
            if (tot + d <= mx) {
                best.push(t);
                tot += d;
            }
            if (tot >= mn) break;
        }
        // If still nothing (e.g. target is very short), just take first N tracks
        if (best.length === 0) {
            let tot2 = 0;
            for (const t of workRepo) {
                if (tot2 + t.duration_ms / 1000 > mx) break;
                best.push(t);
                tot2 += t.duration_ms / 1000;
            }
        }
    }

    return applyCurve(best, curve);
}

// ── Energy curve ordering ─────────────────────────────────────────────────────
function applyCurve(tracks: Track[], curve: string): Track[] {
    if (tracks.length === 0) return tracks;

    switch (curve) {
        case "ascending":
            return [...tracks].sort((a, b) => a.energy - b.energy);

        case "descending":
            return [...tracks].sort((a, b) => b.energy - a.energy);

        case "wave": {
            const sorted = [...tracks].sort((a, b) => a.energy - b.energy);
            const m = Math.ceil(sorted.length / 2);
            const low = sorted.slice(0, m);
            const high = sorted.slice(m).reverse();
            const waved: Track[] = [];
            for (let i = 0; i < Math.max(low.length, high.length); i++) {
                if (i < low.length) waved.push(low[i]);
                if (i < high.length) waved.push(high[i]);
            }
            return waved;
        }

        case "steady":
        default: {
            // Nearest-neighbor by BPM for smooth transitions
            if (tracks.length < 3) return tracks;
            const result: Track[] = [tracks[0]];
            const remaining = tracks.slice(1);
            while (remaining.length > 0) {
                const last = result[result.length - 1];
                const nextIdx = remaining.reduce((bestI, t, i) => {
                    const d = Math.abs(t.bpm - last.bpm);
                    const bd = Math.abs(remaining[bestI].bpm - last.bpm);
                    return d < bd ? i : bestI;
                }, 0);
                result.push(remaining.splice(nextIdx, 1)[0]);
            }
            return result;
        }
    }
}
