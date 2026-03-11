/**
 * useAudio — Audio Engine v2.1 (Reliable Auto-Next)
 *
 * Design principles:
 *  - ONE source of truth for position: posRef (mutable, sync)
 *  - advance() called at most once per track (hasAdvanced guard)
 *  - No side-effects inside React state updaters
 *  - Crossfade uses setTimeout, cleanly cancelled on unmount
 *
 * Performance: imports domain stores directly (no composite hook overhead)
 */
import { useEffect, useRef } from "react";
import { usePlayerStore } from "../store/usePlayerStore.ts";
import { useSettingsStore } from "../store/useSettingsStore.ts";
import { probeOne } from "./audioProbe.ts";
import { TRACKS } from "../data/constants.ts";

const AUDIO_BASE = "/audio/";
const CROSSFADE_MS = 2000;   // crossfade duration
const TICK_MS = 250;    // position poll interval

export function useAudio() {
    // ── Store selectors ──────────────────────────────────────────────────────
    const pQueue = usePlayerStore(s => s.pQueue);
    const ci = usePlayerStore(s => s.ci);
    const playing = usePlayerStore(s => s.playing);
    const pos = usePlayerStore(s => s.pos);
    const vol = usePlayerStore(s => s.vol);
    const setCi = usePlayerStore(s => s.setCi);
    const setPos = usePlayerStore(s => s.setPos);
    const setPlaying = usePlayerStore(s => s.setPlaying);
    const setElapsed = usePlayerStore(s => s.setElapsed);
    const setIsSimulating = usePlayerStore(s => s.setIsSimulating);

    const autoNext = useSettingsStore(s => s.autoNext);
    const crossfade = useSettingsStore(s => s.crossfade);
    const fadeEnabled = useSettingsStore(s => s.fadeEnabled);
    const fadeInMs = useSettingsStore(s => s.fadeInMs);
    const fadeOutMs = useSettingsStore(s => s.fadeOutMs);

    // ── Stable refs (values that must survive effect teardown) ───────────────
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const nextAudioRef = useRef<HTMLAudioElement | null>(null);
    const isReal = useRef(false);
    const posRef = useRef(0);           // sync position in ms
    const hasAdvanced = useRef(false);       // prevents double-advance per track
    const crossTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Stable ref so advance() always reads current store values
    const ciRef = useRef(ci);
    const pQueueLenRef = useRef(pQueue.length);
    const autoNextRef = useRef(autoNext);
    const volRef = useRef(vol);
    ciRef.current = ci;
    pQueueLenRef.current = pQueue.length;
    autoNextRef.current = autoNext;
    volRef.current = vol;
    // Removed fadeEnabledRef, fadeInMsRef, fadeOutMsRef
    const isPausingRef = useRef(false); // flag to prevent immediate pause during fade-out

    const ct = pQueue[ci];
    const nextTrack = pQueue[ci + 1] ?? null;

    // ── Create audio elements ONCE ──────────────────────────────────────────
    useEffect(() => {
        audioRef.current = new Audio();
        nextAudioRef.current = new Audio();

        // Global probe: check first catalog track as representative.
        // Sets initial simulation state before the user presses Play.
        let mounted = true;
        probeOne(TRACKS[0].file_path).then(ok => {
            if (mounted) setIsSimulating(!ok);
        });

        return () => {
            mounted = false;
            audioRef.current?.pause();
            nextAudioRef.current?.pause();
        };
    }, [setIsSimulating]);

    // ── Load + reset when ci changes ─────────────────────────────────────────
    useEffect(() => {
        if (!ct) return;
        const audio = audioRef.current;
        if (!audio) return;

        // Reset guards for new track
        hasAdvanced.current = false;
        isReal.current = false;
        posRef.current = 0;
        
        // Reset volume for fade-in if enabled
        if (fadeEnabled && audio) { // Changed to use reactive fadeEnabled
            audio.volume = 0;
        }

        // Cancel any in-flight crossfade timer
        if (crossTimerRef.current) {
            clearTimeout(crossTimerRef.current);
            crossTimerRef.current = null;
        }

        // Per-track probe: update simulation state for this specific track.
        // blob_url tracks are always real (user-imported); skip probe.
        let probeActive = true;
        if (ct.blob_url) {
            setIsSimulating(false);
        } else {
            probeOne(ct.file_path).then(ok => {
                if (probeActive) setIsSimulating(!ok);
            });
        }

        // blob_url for user-imported files, file_path for built-in catalog
        audio.src = ct.blob_url ?? (AUDIO_BASE + encodeURIComponent(ct.file_path));
        audio.volume = volRef.current;
        const startOffset = (ct.startTime || 0);
        audio.currentTime = startOffset / 1000;
        posRef.current = startOffset;
        setPos(startOffset);

        const onCanPlay = () => {
            isReal.current = true;
            setIsSimulating(false);
        };
        audio.addEventListener("canplay", onCanPlay, { once: true });
        return () => {
            probeActive = false;
            audio.removeEventListener("canplay", onCanPlay);
        };
    }, [ci, ct, setIsSimulating, setPos, fadeEnabled]); // Added fadeEnabled to deps

    // ── Preload next track ───────────────────────────────────────────────────
    useEffect(() => {
        const next = nextAudioRef.current;
        if (!next || !nextTrack) return;
        next.src = nextTrack.blob_url ?? (AUDIO_BASE + encodeURIComponent(nextTrack.file_path));
        next.volume = 0;
        next.load();
    }, [nextTrack]);

    // ── Volume sync ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = vol;
    }, [vol]);

    // ── Seek sync (Listen to store changes for manual jumps) ─────────────────
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !ct) return;

        // If the store pos is significantly different from our local posRef,
        // it means the user manually seeking (e.g. clicking the waveform).
        const diff = Math.abs(pos - posRef.current);
        if (diff > 1500) { // >1.5s jump usually means manual seek
            audio.currentTime = pos / 1000;
            posRef.current = pos;
        }
    }, [pos, ct]);

    // ── Main play/pause + auto-next engine ───────────────────────────────────
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !ct) return;

        // Clear previous timers
        clearInterval(simRef.current ?? undefined);
        clearInterval(elapsedRef.current ?? undefined);

        if (!playing) {
            // Fade-on-pause logic
            if (fadeEnabled && isReal.current && audio && !audio.paused && !isPausingRef.current) { // Changed to use reactive fadeEnabled
                isPausingRef.current = true;
                const duration = fadeOutMs; // Changed to use reactive fadeOutMs
                const steps = 15;
                const interval = duration / steps;
                let step = 0;
                const vBase = audio.volume;

                const pauseFade = setInterval(() => {
                    step++;
                    const factor = 1 - (step / steps);
                    audio.volume = Math.max(0, vBase * Math.pow(factor, 2));

                    if (step >= steps || !isPausingRef.current) {
                        clearInterval(pauseFade);
                        audio.pause();
                        isPausingRef.current = false;
                    }
                }, interval);
                return;
            }
            
            isPausingRef.current = false;
            audio.pause();
            return;
        }

        // Cancel any pending pause fade if we resumed
        isPausingRef.current = false;

        // Try real playback (fire-and-forget; failure = simulation)
        audio.play().catch(() => {
            isReal.current = false;
            setIsSimulating(true);
        });

        /**
         * advance() — move to next track or stop.
         * Uses refs to avoid stale closures.
         * Guard: hasAdvanced ensures it fires at most once per track.
         */
        const advance = () => {
            if (hasAdvanced.current) return;
            hasAdvanced.current = true;

            const currentCi = ciRef.current;
            const queueLen = pQueueLenRef.current;

            if (currentCi < queueLen - 1) {
                setCi(currentCi + 1);
            } else {
                // End of queue
                setPlaying(false);
                setPos(0);
            }
        };

        /**
         * Crossfade: fade current down, fade next up over CROSSFADE_MS,
         * then advance to next track in the store.
         */
        const startCrossfade = () => {
            if (hasAdvanced.current) return;
            hasAdvanced.current = true;        // block advance() from firing again

            const curr = audioRef.current;
            const next = nextAudioRef.current;
            const steps = 20;
            const delay = CROSSFADE_MS / steps;
            let step = 0;

            const tick = setInterval(() => {
                step++;
                const t = step / steps;
                const fadeOut = Math.cos(t * Math.PI / 2);
                const fadeIn = Math.sin(t * Math.PI / 2);
                const v = volRef.current;

                if (curr) curr.volume = Math.max(0, v * fadeOut);
                if (next) {
                    if (next.paused) next.play().catch(() => { });
                    next.volume = Math.min(v, v * fadeIn);
                }

                if (step >= steps) {
                    clearInterval(tick);
                    if (curr) { curr.pause(); curr.currentTime = 0; }
                    // Now actually advance the store index
                    const currentCi = ciRef.current;
                    const queueLen = pQueueLenRef.current;
                    if (currentCi < queueLen - 1) {
                        setCi(currentCi + 1);
                    } else {
                        setPlaying(false);
                    }
                }
            }, delay);
        };

        // ── Tick ─────────────────────────────────────────────────────────────
        simRef.current = setInterval(() => {
            const trackEnd = ct.endTime || ct.duration_ms;
            const trackStart = ct.startTime || 0;

            if (isReal.current && audio) {
                // Real audio path
                const posMs = Math.floor(audio.currentTime * 1000);
                const remMs = trackEnd - posMs;
                const elapsedInTrack = posMs - trackStart;
                posRef.current = posMs;
                setPos(posMs);

                // Apply dynamic fading if enabled
                if (fadeEnabled && !isPausingRef.current) { // Changed to use reactive fadeEnabled
                    const v = volRef.current;
                    const fIn = fadeInMs; // Changed to use reactive fadeInMs
                    const fOut = fadeOutMs; // Changed to use reactive fadeOutMs

                    if (elapsedInTrack < fIn) {
                        // Fade in logic
                        const factor = elapsedInTrack / fIn;
                        audio.volume = v * Math.pow(factor, 2); // Logarithmic-ish fade in
                    } else if (remMs < fOut && !hasAdvanced.current) {
                        // Fade out logic (only if not already crossfading)
                        const factor = remMs / fOut;
                        audio.volume = v * Math.pow(factor, 2);
                    } else if (!hasAdvanced.current) {
                        // Normal playback volume
                        audio.volume = v;
                    }
                }

                if (autoNextRef.current) {
                    if (crossfade && remMs <= CROSSFADE_MS && ciRef.current < pQueueLenRef.current - 1) {
                        startCrossfade();
                    } else if (audio.ended || remMs <= TICK_MS) {
                        advance();
                    }
                } else if (audio.ended || remMs <= TICK_MS) {
                    setPlaying(false);
                }

            } else {
                // Simulation (no real audio files)
                posRef.current = Math.min(posRef.current + TICK_MS, trackEnd);
                const posMs = posRef.current;
                const remMs = trackEnd - posMs;
                setPos(posMs);

                if (autoNextRef.current) {
                    if (crossfade && remMs <= CROSSFADE_MS && ciRef.current < pQueueLenRef.current - 1) {
                        startCrossfade();
                    } else if (remMs <= 0) {
                        advance();
                    }
                } else if (remMs <= 0) {
                    // Stop at end of queue, no auto-next
                    setPos(trackEnd);
                    setPlaying(false);
                    clearInterval(simRef.current ?? undefined);
                }
            }
        }, TICK_MS);

        // Elapsed session timer (wall-clock seconds)
        elapsedRef.current = setInterval(() => {
            setElapsed((p: number) => p + 1);
        }, 1000);

        return () => {
            clearInterval(simRef.current ?? undefined);
            clearInterval(elapsedRef.current ?? undefined);
        };
    }, [playing, ci, ct, pQueue.length, crossfade, setCi, setElapsed, setIsSimulating, setPlaying, setPos]);
    // Note: autoNext intentionally NOT in deps — read via ref in the tick

    return { isReal: isReal.current };
    // Note: use usePlayerStore(s => s.isSimulating) for reactive UI updates
}
