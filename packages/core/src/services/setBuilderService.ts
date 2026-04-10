import { Track } from "../types";

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

// ── Camelot Wheel Compatibility ──────────────────────────────────────────────
export function getCamelotDistance(k1: string, k2: string): number {
    if (!k1 || !k2 || k1 === "N/A" || k2 === "N/A") return 2;
    if (k1 === k2) return 0;
    const parse = (k: string) => {
        const num = parseInt(k);
        const letter = k.replace(/[0-9]/g, '').toUpperCase();
        return { num, letter };
    };
    try {
        const p1 = parse(k1);
        const p2 = parse(k2);
        const numDiff = Math.abs(p1.num - p2.num);
        const circularDiff = numDiff > 6 ? 12 - numDiff : numDiff;
        if (p1.letter === p2.letter) return circularDiff;
        return circularDiff === 0 ? 1 : circularDiff + 1;
    } catch { return 2; }
}

const MOOD_DIST: Record<string, Record<string, number>> = {
    happy: { happy: 0, calm: 1, melancholic: 2, energetic: 1 },
    calm: { happy: 1, calm: 0, melancholic: 1, energetic: 2 },
    melancholic: { happy: 2, calm: 1, melancholic: 0, energetic: 3 },
    energetic: { happy: 1, calm: 2, melancholic: 3, energetic: 0 },
};

/** Score a sequence of tracks based on DJ rules */
function scoreTransitions(tracks: Track[], opts: BuildOpts): number {
    if (tracks.length < 2) return 0;
    let score = 0;
    const { harmonicMixing = true, maxBpmJump = 10, energyContinuity = true } = opts;

    for (let i = 1; i < tracks.length; i++) {
        const t1 = tracks[i-1];
        const t2 = tracks[i];
        const bpm1 = t1.bpm ?? 120;
        const bpm2 = t2.bpm ?? 120;
        const bpmDiff = Math.abs(bpm1 - bpm2);
        
        if (bpmDiff <= 3) score += 2;
        else if (bpmDiff > maxBpmJump) score -= 10; // Penalización más pesada en el nuevo motor

        if (harmonicMixing) {
            const dist = getCamelotDistance(t1.key || "", t2.key || "");
            if (dist === 0) score += 4;
            else if (dist === 1) score += 2;
            else if (dist > 2) score -= 5;
        }

        if (energyContinuity) {
            const md = MOOD_DIST[t1.mood ?? "calm"]?.[t2.mood ?? "calm"] ?? 1;
            if (md === 0) score += 1;
            else if (md > 1) score -= 4;
        }
    }
    return score;
}

export interface BuildOpts {
    curve?: string;
    tol?: number;
    bpmMin?: number;
    bpmMax?: number;
    venue?: string;
    harmonicMixing?: boolean;
    maxBpmJump?: number;
    energyContinuity?: boolean;
    anchors?: Record<number, Track>; // { index: Track }
}

/** 
 * Find a single replacement for a gap 
 */
export function findSmartReplacement(
    currentIndex: number,
    currentSet: Track[],
    repertoire: Track[],
    opts: BuildOpts
): Track | null {
    const prevTrack = currentIndex > 0 ? currentSet[currentIndex - 1] : null;
    const nextTrack = currentIndex < currentSet.length - 1 ? currentSet[currentIndex + 1] : null;
    const currentIds = new Set(currentSet.map(t => t.id));
    const available = repertoire.filter(t => !currentIds.has(t.id));
    if (available.length === 0) return null;

    let bestTrack: Track | null = null;
    let bestScore = Infinity;

    for (const t of available) {
        let dist = 0;
        if (prevTrack) dist += Math.abs((t.bpm ?? 120) - (prevTrack.bpm ?? 120));
        if (nextTrack && opts.harmonicMixing) dist += getCamelotDistance(t.key || "", nextTrack.key || "") * 15;
        if (dist < bestScore) { bestScore = dist; bestTrack = t; }
    }
    return bestTrack;
}

/**
 * RE-WRITTEN CORE: Build set respecting fixed anchors
 */
export function buildSet(
    repo: Track[],
    target: number,
    opts: BuildOpts = {}
): Track[] {
    const { anchors = {}, targetMin, bpmMin, bpmMax } = opts as any;
    
    // 1. Filtrado inicial
    const workingPool = repo.filter(t => {
        const b = t.bpm ?? 120;
        const inBpm = (bpmMin === undefined || b >= bpmMin) && (bpmMax === undefined || b <= bpmMax);
        const isAnchored = Object.values(anchors).some((a: any) => a.id === t.id);
        return inBpm && !isAnchored;
    });

    let bestSet: Track[] = [];
    let bestGlobalScore = -Infinity;

    // 2. Monte Carlo Global
    for (let m = 0; m < 1000; m++) {
        let currentSet: Track[] = [];
        let totalTime = 0;
        
        // --- CURVE BIAS ---
        let available = [...workingPool];
        if (opts.curve === "ascending") {
            available.sort((a, b) => (a.energy || 0) - (b.energy || 0));
        } else if (opts.curve === "descending") {
            available.sort((a, b) => (b.energy || 0) - (a.energy || 0));
        } else {
            available.sort(() => Math.random() - 0.5);
        }
        
        // Simular construcción
        let i = 0;
        while (totalTime < (target + 30) && available.length > 0) {
            if (anchors[i]) {
                const a = anchors[i];
                currentSet[i] = a;
                totalTime += a.duration_ms / 1000;
                available = available.filter(t => t.id !== a.id);
            } else {
                // Window selection for curve adherence + duration flexibility
                const windowSize = (opts.curve === "ascending" || opts.curve === "descending") ? Math.min(5, available.length) : available.length;
                const pickIdx = Math.floor(Math.random() * windowSize);
                const pick = available[pickIdx];

                // Safety: if adding this track puts us way over target, try to find a better fit or stop
                if (totalTime + (pick.duration_ms / 1000) > (target + 60) && i > 3) {
                    break; 
                }

                currentSet[i] = available.splice(pickIdx, 1)[0];
                totalTime += currentSet[i].duration_ms / 1000;
            }
            i++;
            if (i > 60) break; 
        }

        const filteredSet = currentSet.filter(Boolean);
        let score = scoreTransitions(filteredSet, opts);

        // --- DURATION PENALTY ---
        const durationDiff = Math.abs(totalTime - target);
        if (durationDiff > 90) score -= 100; // Strong penalty for missing duration target
        else score += (90 - durationDiff) / 10; // Bonus for getting closer to target

        if (score > bestGlobalScore) {
            bestGlobalScore = score;
            bestSet = filteredSet;
        }
    }

    return applyCurve(bestSet, opts.curve || "steady", opts);
}

function applyCurve(tracks: Track[], curve: string, opts: BuildOpts): Track[] {
    if (tracks.length < 2) return tracks;
    
    const result: Track[] = new Array(tracks.length);
    
    // 1. Colocar anclas primero
    if (opts.anchors) {
        Object.entries(opts.anchors).forEach(([idx, track]) => {
            const index = Number(idx);
            if (index < result.length) {
                result[index] = track;
            }
        });
    }

    // 2. Identificar tracks ya usados como anclas para no repetirlos
    const anchoredTrackIds = new Set(Object.values(opts.anchors || {}).map(a => a.id));
    
    // 3. Filtrar tracks restantes (los que no son anclas)
    const remaining = tracks.filter(t => !anchoredTrackIds.has(t.id));
    
    // 4. Si la curva es de energía, ordenar 'remaining'
    if (curve === "ascending") {
        remaining.sort((a, b) => (a.energy ?? 0.5) - (b.energy ?? 0.5));
    } else if (curve === "descending") {
        remaining.sort((a, b) => (b.energy ?? 0.5) - (a.energy ?? 0.5));
    }

    // 5. Llenar el resto de las posiciones
    for (let i = 0; i < result.length; i++) {
        if (result[i]) continue;
        
        if (remaining.length === 0) break;

        if (curve === "ascending" || curve === "descending") {
            result[i] = remaining.shift()!;
        } else {
            // Lógica original de "mejor vecino" (greedy neighbor)
            const prev = i > 0 ? result[i - 1] : null;
            let bestIdx = 0;
            let bestScore = Infinity;

            remaining.forEach((t, rIdx) => {
                let s = Math.abs((t.energy ?? 0.5) - 0.5);
                if (prev) {
                    s = Math.abs((t.bpm ?? 120) - (prev.bpm ?? 120)) + (getCamelotDistance(t.key || "", prev.key || "") * 10);
                }
                if (s < bestScore) {
                    bestScore = s;
                    bestIdx = rIdx;
                }
            });

            result[i] = remaining.splice(bestIdx, 1)[0];
        }
    }

    return result.filter(Boolean);
}
