/**
 * useAudio — Audio Engine v2.1 (Reliable Auto-Next)
 *
 * Design principles:
 *  - ONE source of truth for position: posRef (mutable, sync)
 *  - advance() called at most once per track (hasAdvanced guard)
 *  - No side-effects inside React state updaters
 *  - Crossfade uses setTimeout, cleanly cancelled on unmount
 */
import { useEffect, useRef } from "react";
import { useProjectStore } from "../store/useProjectStore";

const AUDIO_BASE = "/audio/";
const CROSSFADE_MS = 2000;   // crossfade duration
const TICK_MS = 250;    // position poll interval

export function useAudio() {
    // ── Store selectors ──────────────────────────────────────────────────────
    const pQueue = useProjectStore(s => s.pQueue);
    const ci = useProjectStore(s => s.ci);
    const playing = useProjectStore(s => s.playing);
    const vol = useProjectStore(s => s.vol);
    const autoNext = useProjectStore(s => s.autoNext);
    const crossfade = useProjectStore(s => s.crossfade);
    const setCi = useProjectStore(s => s.setCi);
    const setPos = useProjectStore(s => s.setPos);
    const setPlaying = useProjectStore(s => s.setPlaying);
    const setElapsed = useProjectStore(s => s.setElapsed);

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

    const ct = pQueue[ci];
    const nextTrack = pQueue[ci + 1] ?? null;

    // ── Create audio elements ONCE ──────────────────────────────────────────
    useEffect(() => {
        audioRef.current = new Audio();
        nextAudioRef.current = new Audio();
        return () => {
            audioRef.current?.pause();
            nextAudioRef.current?.pause();
        };
    }, []);

    // ── Load + reset when ci changes ─────────────────────────────────────────
    useEffect(() => {
        if (!ct) return;
        const audio = audioRef.current;
        if (!audio) return;

        // Reset guards for new track
        hasAdvanced.current = false;
        isReal.current = false;
        posRef.current = 0;

        // Cancel any in-flight crossfade timer
        if (crossTimerRef.current) {
            clearTimeout(crossTimerRef.current);
            crossTimerRef.current = null;
        }

        // blob_url for user-imported files, file_path for built-in catalog
        audio.src = ct.blob_url ?? (AUDIO_BASE + ct.file_path);
        audio.volume = volRef.current;
        audio.currentTime = 0;
        setPos(0);

        const onCanPlay = () => { isReal.current = true; };
        audio.addEventListener("canplay", onCanPlay, { once: true });
        return () => audio.removeEventListener("canplay", onCanPlay);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ci, ct?.id]);

    // ── Preload next track ───────────────────────────────────────────────────
    useEffect(() => {
        const next = nextAudioRef.current;
        if (!next || !nextTrack) return;
        next.src = nextTrack.blob_url ?? (AUDIO_BASE + nextTrack.file_path);
        next.volume = 0;
        next.load();
    }, [nextTrack?.file_path]);

    // ── Volume sync ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = vol;
    }, [vol]);

    // ── Main play/pause + auto-next engine ───────────────────────────────────
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !ct) return;

        // Clear previous timers
        clearInterval(simRef.current ?? undefined);
        clearInterval(elapsedRef.current ?? undefined);

        if (!playing) {
            audio.pause();
            return;
        }

        // Try real playback (fire-and-forget; failure = simulation)
        audio.play().catch(() => { isReal.current = false; });

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
            const duration = ct.duration_ms;

            if (isReal.current && audio) {
                // Real audio path
                const posMs = Math.floor(audio.currentTime * 1000);
                const remMs = duration - posMs;
                posRef.current = posMs;
                setPos(posMs);

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
                posRef.current = Math.min(posRef.current + TICK_MS, duration);
                const posMs = posRef.current;
                const remMs = duration - posMs;
                setPos(posMs);

                if (autoNextRef.current) {
                    if (crossfade && remMs <= CROSSFADE_MS && ciRef.current < pQueueLenRef.current - 1) {
                        startCrossfade();
                    } else if (remMs <= 0) {
                        advance();
                    }
                } else if (remMs <= 0) {
                    // Stop at end of queue, no auto-next
                    setPos(duration);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playing, ci, ct?.id, pQueue.length, crossfade]);
    // Note: autoNext intentionally NOT in deps — read via ref in the tick

    return { isReal: isReal.current };
}
