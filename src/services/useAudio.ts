/**
 * useAudio — Audio Engine v2.3 (SoundTouch Pitch + Stack Order)
 * 
 * Uses SoundTouchJS (WSOLA) for independent pitch shifting without tempo change.
 * Fallback to native HTMLAudioElement when no transposition is needed.
 */
import { useEffect, useRef } from "react";
import { usePlayerStore } from "../store/usePlayerStore.ts";
import { useSettingsStore } from "../store/useSettingsStore.ts";
import { useLibraryStore } from "../store/useLibraryStore.ts";
import { probeOne } from "./audioProbe.ts";
import { TRACKS } from "../data/constants.ts";
import { PitchShifter } from "soundtouchjs";

const AUDIO_BASE = "/audio/";
const TICK_MS = 250;
const ST_BUFFER_SIZE = 4096;

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
    const stackOrder = usePlayerStore(s => s.stackOrder);
    const setStackOrder = usePlayerStore(s => s.setStackOrder);

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
    const stackOrderRef = useRef(stackOrder);
    const pQueueRef = useRef(pQueue);

    ciRef.current = ci;
    pQueueLenRef.current = pQueue.length;
    autoNextRef.current = autoNext;
    volRef.current = vol;
    stackOrderRef.current = stackOrder;
    pQueueRef.current = pQueue;

    const isPausingRef = useRef(false);
    const sessionTrackTimeRef = useRef(0);
    const hasIncrementedCountRef = useRef(false);
    const activeTrackIdRef = useRef<string | null>(null);

    // SoundTouch pitch shifting refs
    const stCtxRef = useRef<AudioContext | null>(null);
    const stShifterRef = useRef<PitchShifter | null>(null);
    const stGainRef = useRef<GainNode | null>(null);
    const stActiveRef = useRef(false); // true when SoundTouch is handling audio

    const ct = pQueue[ci];
    // In LIVE mode with stackOrder, nextTrack should be the first in stack
    const nextTrackId = stackOrder[0];
    const nextTrackIdx = nextTrackId ? pQueue.findIndex(t => t.id === nextTrackId) : -1;
    const nextTrack = nextTrackIdx !== -1 ? pQueue[nextTrackIdx] : (pQueue[ci + 1] ?? null);

    const nextTrackRef = useRef(nextTrack);
    nextTrackRef.current = nextTrack;

    // ── Create audio elements ONCE ──────────────────────────────────────────
    useEffect(() => {
        audioRef.current = new Audio();
        nextAudioRef.current = new Audio();

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

    const fadeEnabledRef = useRef(fadeEnabled);
    const fadeInMsRef = useRef(fadeInMs);
    const fadeOutMsRef = useRef(fadeOutMs);
    const crossfadeRef = useRef(crossfade);

    fadeEnabledRef.current = fadeEnabled;
    fadeInMsRef.current = fadeInMs;
    fadeOutMsRef.current = fadeOutMs;
    crossfadeRef.current = crossfade;

    // ── Create audio elements ONCE ──────────────────────────────────────────
    useEffect(() => {
        audioRef.current = new Audio();
        nextAudioRef.current = new Audio();

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

    // ── Load + reset when track ID or index changes ──────────────────────────
    const trackId = ct?.id;
    useEffect(() => {
        if (!ct) return;
        const audio = audioRef.current;
        if (!audio) return;

        hasAdvanced.current = false;
        isReal.current = false;
        posRef.current = 0;
        sessionTrackTimeRef.current = 0;
        hasIncrementedCountRef.current = false;
        activeTrackIdRef.current = ct.id;
        
        // Initial volume management
        if (fadeEnabledRef.current && audio) {
            audio.volume = 0;
        } else {
            audio.volume = volRef.current;
        }

        if (crossTimerRef.current) {
            clearTimeout(crossTimerRef.current);
            crossTimerRef.current = null;
        }

        // Clean up previous SoundTouch instance
        if (stShifterRef.current) {
            stShifterRef.current.off();
            try { stShifterRef.current.disconnect(); } catch { /* noop */ }
            stShifterRef.current = null;
        }
        stActiveRef.current = false;

        let probeActive = true;
        if (ct.blob_url) {
            setIsSimulating(false);
        } else {
            probeOne(ct.file_path).then(ok => {
                if (probeActive) setIsSimulating(!ok);
            });
        }

        const audioUrl = ct.blob_url ?? (AUDIO_BASE + encodeURIComponent(ct.file_path));
        audio.src = audioUrl;
        audio.playbackRate = 1.0; // Always 1.0 — pitch is handled by SoundTouch
        const startOffset = (ct.startTime || 0);
        audio.currentTime = startOffset / 1000;
        posRef.current = startOffset;
        setPos(startOffset);

        // If track has pitch transposition, set up SoundTouch
        const semitones = ct.transposeSemitones ?? 0;
        if (semitones !== 0) {
            // Load audio buffer and create SoundTouch PitchShifter
            fetch(audioUrl)
                .then(r => r.arrayBuffer())
                .then(ab => {
                    if (!probeActive) return;
                    if (!stCtxRef.current) {
                        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                        stCtxRef.current = new AudioCtxClass();
                        stGainRef.current = stCtxRef.current.createGain();
                        stGainRef.current.connect(stCtxRef.current.destination);
                    }
                    const ctx = stCtxRef.current!;
                    return ctx.decodeAudioData(ab);
                })
                .then(buffer => {
                    if (!probeActive || !buffer || !stCtxRef.current || !stGainRef.current) return;
                    
                    const shifter = new PitchShifter(stCtxRef.current, buffer, ST_BUFFER_SIZE);
                    shifter.pitchSemitones = semitones;
                    shifter.tempo = 1.0;
                    stShifterRef.current = shifter;
                    stActiveRef.current = true;
                    isReal.current = true;
                    setIsSimulating(false);

                    // Seek to startOffset if needed
                    if (startOffset > 0 && buffer.duration > 0) {
                        shifter.percentagePlayed = (startOffset / 1000) / buffer.duration;
                    }

                    console.log(`[useAudio] SoundTouch active: ${semitones} semitones, buffer ${buffer.duration.toFixed(1)}s`);
                })
                .catch(err => {
                    console.warn("[useAudio] SoundTouch setup failed, falling back to native:", err);
                    stActiveRef.current = false;
                });
        }

        const onCanPlay = () => {
            isReal.current = true;
            setIsSimulating(false);
        };
        audio.addEventListener("canplay", onCanPlay, { once: true });
        return () => {
            probeActive = false;
            audio.removeEventListener("canplay", onCanPlay);
        };
    }, [ci, trackId, setIsSimulating, setPos]); 

    // ── Preload next track ───────────────────────────────────────────────────
    useEffect(() => {
        const next = nextAudioRef.current;
        if (!next || !nextTrack) return;
        next.src = nextTrack.blob_url ?? (AUDIO_BASE + encodeURIComponent(nextTrack.file_path));
        next.volume = 0;
        next.playbackRate = 1.0; // Always 1.0
        next.load();
    }, [nextTrack]);

    // ── Volume sync ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (stActiveRef.current && stGainRef.current) {
            stGainRef.current.gain.value = vol;
        }
        if (audioRef.current) {
            // Mute native audio when SoundTouch is active
            audioRef.current.volume = stActiveRef.current ? 0 : vol;
        }
    }, [vol]);

    // ── Seek sync ────────────────────────────────────────────────────────────
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !ct) return;
        const diff = Math.abs(pos - posRef.current);
        if (diff > 1500) {
            audio.currentTime = pos / 1000;
            posRef.current = pos;
        }
    }, [pos, ct]);

    // ── Main play/pause + auto-next engine ───────────────────────────────────
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !ct) return;

        clearInterval(simRef.current ?? undefined);
        clearInterval(elapsedRef.current ?? undefined);

        if (!playing) {
            // Disconnect SoundTouch on pause
            if (stActiveRef.current && stShifterRef.current) {
                try { stShifterRef.current.disconnect(); } catch { /* noop */ }
            }

            if (fadeEnabledRef.current && isReal.current && audio && !audio.paused && !isPausingRef.current) {
                isPausingRef.current = true;
                const duration = fadeOutMsRef.current;
                const steps = 15;
                const interval = duration / steps;
                let step = 0;
                const vBase = stActiveRef.current && stGainRef.current ? stGainRef.current.gain.value : audio.volume;

                const pauseFade = setInterval(() => {
                    step++;
                    const factor = 1 - (step / steps);
                    const fadeVol = Math.max(0, vBase * Math.pow(factor, 2));

                    if (stActiveRef.current && stGainRef.current) {
                        stGainRef.current.gain.value = fadeVol;
                    } else {
                        audio.volume = fadeVol;
                    }

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

        isPausingRef.current = false;
        if (audio.paused) {
            // When SoundTouch is active, mute native audio and connect ST
            if (stActiveRef.current) {
                audio.volume = 0; // Mute native — ST handles output
                if (stShifterRef.current && stGainRef.current) {
                    stGainRef.current.gain.value = volRef.current;
                    stShifterRef.current.connect(stGainRef.current);
                }
            } else {
                if (!fadeEnabledRef.current || !isReal.current) {
                    audio.volume = volRef.current;
                }
            }
            audio.play().catch(() => {
                isReal.current = false;
                setIsSimulating(true);
            });
        }

        const advance = () => {
            if (hasAdvanced.current) return;
            hasAdvanced.current = true;

            const currentCi = ciRef.current;
            const queueLen = pQueueLenRef.current;
            const stack = stackOrderRef.current;
            const queue = pQueueRef.current;

            if (stack.length > 0) {
                const nextId = stack[0];
                const nextIdx = queue.findIndex(t => t.id === nextId);
                if (nextIdx !== -1) {
                    setCi(nextIdx);
                    setStackOrder(stack.slice(1));
                    return;
                }
            }

            if (currentCi < queueLen - 1) {
                setCi(currentCi + 1);
            } else {
                setPlaying(false);
                setPos(0);
            }
        };

        const startCrossfade = () => {
            if (hasAdvanced.current) return;
            hasAdvanced.current = true;

            const curr = audioRef.current;
            const next = nextAudioRef.current;
            const cfMs = useSettingsStore.getState().crossfadeMs;
            const steps = 20;
            const delay = cfMs / steps;
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
                    const currentCi = ciRef.current;
                    const queueLen = pQueueLenRef.current;
                    const stack = stackOrderRef.current;
                    const queue = pQueueRef.current;

                    if (stack.length > 0) {
                        const nextId = stack[0];
                        const nextIdx = queue.findIndex(t => t.id === nextId);
                        if (nextIdx !== -1) {
                            setCi(nextIdx);
                            setStackOrder(stack.slice(1));
                            return;
                        }
                    }

                    if (currentCi < queueLen - 1) {
                        setCi(currentCi + 1);
                    } else {
                        setPlaying(false);
                    }
                }
            }, delay);
        };

        simRef.current = setInterval(() => {
            const trackEnd = ct.endTime || ct.duration_ms;
            const trackStart = ct.startTime || 0;

            if (isReal.current && audio) {
                const posMs = Math.floor(audio.currentTime * 1000);
                const remMs = trackEnd - posMs;
                const elapsedInTrack = posMs - trackStart;
                posRef.current = posMs;
                setPos(posMs);

                if (fadeEnabledRef.current && !isPausingRef.current) {
                    const v = volRef.current;
                    const fIn = fadeInMsRef.current;
                    const fOut = fadeOutMsRef.current;

                    if (elapsedInTrack < fIn) {
                        const factor = elapsedInTrack / fIn;
                        audio.volume = v * Math.pow(factor, 2);
                    } else if (remMs < fOut && !hasAdvanced.current) {
                        const factor = remMs / fOut;
                        audio.volume = v * Math.pow(factor, 2);
                    } else if (!hasAdvanced.current) {
                        audio.volume = v;
                    }
                }

                if (autoNextRef.current) {
                    const cfMs = useSettingsStore.getState().crossfadeMs;
                    if (crossfadeRef.current && remMs <= cfMs && (nextTrackRef.current !== null)) {
                        startCrossfade();
                    } else if (audio.ended || remMs <= TICK_MS) {
                        advance();
                    }
                } else if (audio.ended || remMs <= TICK_MS) {
                    setPlaying(false);
                }

            } else {
                posRef.current = Math.min(posRef.current + TICK_MS, trackEnd);
                const posMs = posRef.current;
                const remMs = trackEnd - posMs;
                setPos(posMs);

                if (autoNextRef.current) {
                    const cfMs = useSettingsStore.getState().crossfadeMs;
                    if (crossfadeRef.current && remMs <= cfMs && (nextTrackRef.current !== null)) {
                        startCrossfade();
                    } else if (remMs <= 0) {
                        advance();
                    }
                } else if (remMs <= 0) {
                    setPos(trackEnd);
                    setPlaying(false);
                    clearInterval(simRef.current ?? undefined);
                }
            }

            if (activeTrackIdRef.current) {
                sessionTrackTimeRef.current += TICK_MS;
                const playThresholdMs = Math.min(ct.duration_ms * 0.5, 20000);
                const shouldIncrement = !hasIncrementedCountRef.current && sessionTrackTimeRef.current >= playThresholdMs;
                if (shouldIncrement) {
                    hasIncrementedCountRef.current = true;
                }
                useLibraryStore.getState().recordMetric(activeTrackIdRef.current, TICK_MS, shouldIncrement);
            }
        }, TICK_MS);

        elapsedRef.current = setInterval(() => {
            setElapsed((p: number) => p + 1);
        }, 1000);

        return () => {
            clearInterval(simRef.current ?? undefined);
            clearInterval(elapsedRef.current ?? undefined);
        };
    }, [playing, ci, trackId, setCi, setElapsed, setIsSimulating, setPlaying, setPos, setStackOrder]);

    return { isReal: isReal.current };
}
