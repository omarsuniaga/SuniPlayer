/**
 * useAudio — Audio Engine v2.4 (Streaming Buffer + Predictive Caching)
 * 
 * Integrates AudioStreamerService for chunked loading, persistent Cache API,
 * and real-time download speed tracking for professional performance.
 */
import { useEffect, useRef } from "react";
import { usePlayerStore } from "../store/usePlayerStore.ts";
import { useSettingsStore } from "../store/useSettingsStore.ts";
import { useLibraryStore } from "../store/useLibraryStore.ts";
import { useDebugStore } from "../store/useDebugStore.ts";
import { useDownloadStore } from "../store/useDownloadStore.ts";
import { AudioStreamerService } from "./AudioStreamerService.ts";
import { PitchShifter } from "soundtouchjs";
import { Track } from "../types.ts";

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
    const setStackOrder = usePlayerStore(s => s.setStackOrder);
    const stackOrder = usePlayerStore(s => s.stackOrder);

    const autoNext = useSettingsStore(s => s.autoNext);
    const crossfade = useSettingsStore(s => s.crossfade);
    const fadeEnabled = useSettingsStore(s => s.fadeEnabled);
    const fadeInMs = useSettingsStore(s => s.fadeInMs);
    const fadeOutMs = useSettingsStore(s => s.fadeOutMs);
    const autoGain = useSettingsStore(s => s.autoGain);

    const updateDownload = useDownloadStore(s => s.updateProgress);

    // ── Stable refs ──────────────────────────────────────────────────────────
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const nextAudioRef = useRef<HTMLAudioElement | null>(null);
    const isReal = useRef(false);
    const posRef = useRef(0);
    const hasAdvanced = useRef(false);
    const crossTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const ciRef = useRef(ci);
    const pQueueLenRef = useRef(pQueue.length);
    const autoNextRef = useRef(autoNext);
    const volRef = useRef(vol);
    const stackOrderRef = useRef(stackOrder);
    const pQueueRef = useRef(pQueue);
    const pauseFadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const playFadeRef = useRef<ReturnType<typeof setInterval> | null>(null);

    ciRef.current = ci;
    pQueueLenRef.current = pQueue.length;
    autoNextRef.current = autoNext;
    volRef.current = vol;
    stackOrderRef.current = stackOrder;
    pQueueRef.current = pQueue;

    const isPausingRef = useRef(false);
    const isResumingRef = useRef(false);
    const sessionTrackTimeRef = useRef(0);
    const hasIncrementedCountRef = useRef(false);
    const activeTrackIdRef = useRef<string | null>(null);

    const stCtxRef = useRef<AudioContext | null>(null);
    const stShifterRef = useRef<PitchShifter | null>(null);
    const stGainRef = useRef<GainNode | null>(null);
    const stActiveRef = useRef(false);

    const ct = pQueue[ci];
    const nextTrackId = stackOrder[0];
    const nextTrackIdx = nextTrackId ? pQueue.findIndex(t => t.id === nextTrackId) : -1;
    const nextTrack = nextTrackIdx !== -1 ? pQueue[nextTrackIdx] : (pQueue[ci + 1] ?? null);

    const nextTrackRef = useRef(nextTrack);
    nextTrackRef.current = nextTrack;

    const fadeEnabledRef = useRef(fadeEnabled);
    const fadeInMsRef = useRef(fadeInMs);
    const fadeOutMsRef = useRef(fadeOutMs);
    const crossfadeRef = useRef(crossfade);

    fadeEnabledRef.current = fadeEnabled;
    fadeInMsRef.current = fadeInMs;
    fadeOutMsRef.current = fadeOutMs;
    crossfadeRef.current = crossfade;

    const autoGainRef = useRef(autoGain);
    autoGainRef.current = autoGain;

    // ── Create audio elements ONCE ──────────────────────────────────────────
    useEffect(() => {
        audioRef.current = new Audio();
        nextAudioRef.current = new Audio();

        const resumeAll = () => {
            if (stCtxRef.current && stCtxRef.current.state === "suspended") {
                stCtxRef.current.resume();
            }
        };
        window.addEventListener("mousedown", resumeAll, { once: true });
        window.addEventListener("touchstart", resumeAll, { once: true });
        window.addEventListener("keydown", resumeAll, { once: true });

        return () => {
            audioRef.current?.pause();
            nextAudioRef.current?.pause();
            window.removeEventListener("mousedown", resumeAll);
            window.removeEventListener("touchstart", resumeAll);
            window.removeEventListener("keydown", resumeAll);
        };
    }, []);

    const getEffectiveVol = (baseVol: number, track: Track | null) => {
        if (!track || !autoGainRef.current || !track.gainOffset) return baseVol;
        return Math.min(1.0, baseVol * Math.min(2.0, track.gainOffset));
    };

    // ── Load + reset with Streamer ──────────────────────────────────────────
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
        
        if (fadeEnabledRef.current && audio) {
            audio.volume = 0;
        } else {
            audio.volume = getEffectiveVol(volRef.current, ct);
        }

        if (crossTimerRef.current) {
            clearTimeout(crossTimerRef.current);
            crossTimerRef.current = null;
        }

        if (stShifterRef.current) {
            stShifterRef.current.off();
            try { stShifterRef.current.disconnect(); } catch { /* noop */ }
            stShifterRef.current = null;
        }
        stActiveRef.current = false;

        let probeActive = true;
        let audioUrl = ct.blob_url ?? `/audio/${encodeURIComponent(ct.file_path)}`;

        // NEW: If it's a custom track and blob_url is missing/invalid, recover from DB
        const prepareUrl = async () => {
            if (ct.isCustom && !ct.blob_url) {
                const { audioCache } = await import("./db");
                const blob = await audioCache.getAudioFile(ct.id);
                if (blob && probeActive) {
                    audioUrl = URL.createObjectURL(blob);
                }
            }
            return audioUrl;
        };

        prepareUrl().then(finalUrl => {
            // Load via AudioStreamer with Progress Tracking
            AudioStreamerService.fetchWithProgress(finalUrl, (p) => {
                if (probeActive) updateDownload(finalUrl, p);
            }).then((objectUrl) => {
                if (!probeActive || !audio) return;
                
                audio.src = objectUrl;
                const startOffset = (ct.startTime || 0);
                const resolvedStart = isNaN(startOffset) ? 0 : startOffset;
                audio.currentTime = resolvedStart / 1000;
                posRef.current = resolvedStart;
                setPos(resolvedStart);

                // Handle Pitch Shifting
                const semitones = ct.transposeSemitones ?? 0;
                const tempo = ct.playbackTempo ?? 1.0;

                if (semitones !== 0 || tempo !== 1.0) {
                    fetch(objectUrl)
                        .then(r => r.arrayBuffer())
                        .then(ab => {
                            if (!probeActive) return;
                            if (!stCtxRef.current) {
                                const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
                                stCtxRef.current = new AudioCtxClass();
                                stGainRef.current = stCtxRef.current.createGain();
                                stGainRef.current.connect(stCtxRef.current.destination);
                            }
                            return stCtxRef.current!.decodeAudioData(ab);
                        })
                        .then(buffer => {
                            if (!probeActive || !buffer || !stCtxRef.current || !stGainRef.current) return;
                            const shifter = new PitchShifter(stCtxRef.current, buffer, ST_BUFFER_SIZE);
                            shifter.pitchSemitones = semitones;
                            shifter.tempo = tempo;
                            stShifterRef.current = shifter;
                            stActiveRef.current = true;
                            isReal.current = true;
                            setIsSimulating(false);
                            if (startOffset > 0 && buffer.duration > 0) {
                                shifter.percentagePlayed = (startOffset / 1000) / buffer.duration;
                            }
                        });
                }

                isReal.current = true;
                setIsSimulating(false);
            }).catch(err => {
                console.error("[Streamer] Load failed:", err);
                setIsSimulating(true);
            });
        });

        return () => {
            probeActive = false;
        };
    }, [ci, ct, trackId, setIsSimulating, setPos, updateDownload]);

    // ── Media Session API ────────────────────────────────────────────────────
    useEffect(() => {
        if (!ct || !('mediaSession' in navigator)) return;
        const addLog = useDebugStore.getState().addLog;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: ct.title, artist: ct.artist, album: "SuniPlayer Setlist",
            artwork: [
                { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            ]
        });

        const handlers: [MediaSessionAction, () => void][] = [
            ['play', () => { addLog("Media: PLAY"); setPlaying(true); }],
            ['pause', () => { addLog("Media: PAUSE"); setPlaying(false); }],
            ['previoustrack', () => {
                addLog("Media: PREV");
                if (ciRef.current > 0) { setCi(ciRef.current - 1); setPos(0); }
            }],
            ['nexttrack', () => {
                addLog("Media: NEXT");
                if (ciRef.current < pQueueLenRef.current - 1) { setCi(ciRef.current + 1); setPos(0); }
            }],
            ['stop', () => { addLog("Media: STOP"); setPlaying(false); setPos(0); }]
        ];

        for (const [action, handler] of handlers) {
            try { navigator.mediaSession.setActionHandler(action, handler); } catch { }
        }
        return () => {
            for (const [action] of handlers) { try { navigator.mediaSession.setActionHandler(action, null); } catch { } }
        };
    }, [ct, setPlaying, setCi, setPos]);

    useEffect(() => {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    }, [playing]);

    // ── Main Engine Loop ─────────────────────────────────────────────────────
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !ct) return;

        clearInterval(simRef.current ?? undefined);
        clearInterval(elapsedRef.current ?? undefined);

        if (!playing) {
            if (fadeEnabledRef.current && isReal.current && audio && !audio.paused) {
                if (!isPausingRef.current) {
                    isPausingRef.current = true;
                    const duration = fadeOutMsRef.current;
                    const steps = 15;
                    const interval = duration / steps;
                    let step = 0;
                    const vBase = stActiveRef.current && stGainRef.current ? stGainRef.current.gain.value : audio.volume;

                    if (pauseFadeRef.current) clearInterval(pauseFadeRef.current);
                    pauseFadeRef.current = setInterval(() => {
                        step++;
                        const factor = 1 - (step / steps);
                        const fadeVol = Math.max(0, vBase * Math.pow(factor, 2));
                        if (stActiveRef.current && stGainRef.current) stGainRef.current.gain.value = fadeVol;
                        else audio.volume = fadeVol;

                        if (step >= steps || !isPausingRef.current) {
                            clearInterval(pauseFadeRef.current!);
                            pauseFadeRef.current = null;
                            if (isPausingRef.current) {
                                audio.pause();
                                if (stActiveRef.current && stShifterRef.current) try { stShifterRef.current.disconnect(); } catch { }
                            }
                            isPausingRef.current = false;
                        }
                    }, interval);
                }
                return;
            }
            isPausingRef.current = false;
            audio.pause();
            if (stActiveRef.current && stShifterRef.current) try { stShifterRef.current.disconnect(); } catch { }
            return;
        }

        if (pauseFadeRef.current) { clearInterval(pauseFadeRef.current); pauseFadeRef.current = null; }
        isPausingRef.current = false;

        if (stCtxRef.current?.state === "suspended") stCtxRef.current.resume();

        const targetVol = getEffectiveVol(volRef.current, ct);

        if (fadeEnabledRef.current && isReal.current) {
            if (!isResumingRef.current) {
                if (playFadeRef.current) clearInterval(playFadeRef.current);
                isResumingRef.current = true;
                let currentVol = audio.paused ? 0 : (stActiveRef.current && stGainRef.current ? stGainRef.current.gain.value : audio.volume);
                const duration = fadeInMsRef.current;
                const steps = 15;
                const interval = duration / steps;
                let step = 0;

                playFadeRef.current = setInterval(() => {
                    step++;
                    const t = step / steps;
                    const factor = 1 - Math.pow(1 - t, 2);
                    const fadeVol = currentVol + (targetVol - currentVol) * factor;
                    if (stActiveRef.current && stGainRef.current) { stGainRef.current.gain.value = fadeVol; audio.volume = 0; }
                    else audio.volume = fadeVol;

                    if (step >= steps || !isResumingRef.current) {
                        clearInterval(playFadeRef.current!);
                        playFadeRef.current = null;
                        isResumingRef.current = false;
                    }
                }, interval);
            }
        } else {
            isResumingRef.current = false;
            if (stActiveRef.current && stGainRef.current) { stGainRef.current.gain.value = targetVol; audio.volume = 0; }
            else audio.volume = targetVol;
        }

        if (stActiveRef.current && stShifterRef.current && stGainRef.current) stShifterRef.current.connect(stGainRef.current);

        if (audio.paused) {
            audio.play().catch(err => {
                if (err.name !== "NotAllowedError") { isReal.current = false; setIsSimulating(true); }
            });
        }

        const advance = () => {
            if (hasAdvanced.current) return;
            hasAdvanced.current = true;
            const stack = stackOrderRef.current;
            if (stack.length > 0) {
                const nextIdx = pQueueRef.current.findIndex(t => t.id === stack[0]);
                if (nextIdx !== -1) { setCi(nextIdx); setStackOrder(stack.slice(1)); return; }
            }
            if (ciRef.current < pQueueLenRef.current - 1) setCi(ciRef.current + 1);
            else { setPlaying(false); setPos(0); }
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

                if (fadeEnabledRef.current && !isPausingRef.current && !isResumingRef.current) {
                    const v = volRef.current;
                    let tVol = v;
                    if (elapsedInTrack < fadeInMsRef.current) tVol = v * Math.pow(elapsedInTrack / fadeInMsRef.current, 2);
                    else if (remMs < fadeOutMsRef.current && !hasAdvanced.current) tVol = v * Math.pow(remMs / fadeOutMsRef.current, 2);
                    
                    const eff = getEffectiveVol(tVol, ct);
                    if (stActiveRef.current && stGainRef.current) stGainRef.current.gain.value = eff;
                    else audio.volume = eff;
                }

                if (autoNextRef.current && (audio.ended || remMs <= TICK_MS)) advance();
                else if (audio.ended || remMs <= TICK_MS) setPlaying(false);

            } else {
                posRef.current = Math.min(posRef.current + TICK_MS, trackEnd);
                setPos(posRef.current);
                if (autoNextRef.current && (trackEnd - posRef.current <= 0)) advance();
                else if (trackEnd - posRef.current <= 0) { setPos(trackEnd); setPlaying(false); }
            }

            if (activeTrackIdRef.current) {
                sessionTrackTimeRef.current += TICK_MS;
                const shouldIncrement = !hasIncrementedCountRef.current && sessionTrackTimeRef.current >= Math.min(ct.duration_ms * 0.5, 20000);
                if (shouldIncrement) hasIncrementedCountRef.current = true;
                useLibraryStore.getState().recordMetric(activeTrackIdRef.current, TICK_MS, shouldIncrement);
            }
        }, TICK_MS);

        elapsedRef.current = setInterval(() => setElapsed((p: number) => p + 1), 1000);

        return () => {
            clearInterval(simRef.current ?? undefined);
            clearInterval(elapsedRef.current ?? undefined);
            if (pauseFadeRef.current) clearInterval(pauseFadeRef.current);
            if (playFadeRef.current) clearInterval(playFadeRef.current);
        };
    }, [playing, ci, ct, trackId, setCi, setElapsed, setIsSimulating, setPlaying, setPos, setStackOrder]);

    return { isReal: isReal.current };
}
