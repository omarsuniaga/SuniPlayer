/**
 * useAudio — Master Performance Engine v3.6.0
 * Unified Lifecycle Engine (Load -> Buffer -> Play)
 * 
 * Racional: 
 * - Unifica la carga y la reproducción en un solo flujo para evitar condiciones de carrera.
 * - Soporta Crossfade y Pre-carga agresiva.
 */
import { useEffect, useRef } from "react";
import { 
    usePlayerStore, 
    useSettingsStore, 
    Track, 
    getTrackUrl 
} from "@suniplayer/core";
import { useDownloadStore } from "../store/useDownloadStore";
import { AudioStreamerService } from "./AudioStreamerService.ts";
import {
    registerAudioTransportController,
    resolveNextTrackIndex,
} from "./audioTransport";

const TICK_MS = 100;
type PlaybackTransitionMode = "crossfade" | "fade" | "direct";
type PauseTransitionMode = "fade" | "direct" | "idle";

export function useAudio() {
    const pQueue = usePlayerStore(s => s.pQueue);
    const ci = usePlayerStore(s => s.ci);
    const playing = usePlayerStore(s => s.playing);
    const vol = usePlayerStore(s => s.vol);
    const mode = usePlayerStore(s => s.mode);
    const stackOrder = usePlayerStore(s => s.stackOrder);
    const pos = usePlayerStore(s => s.pos);
    
    const setPos = usePlayerStore(s => s.setPos);
    const setCi = usePlayerStore(s => s.setCi);
    const setPlaying = usePlayerStore(s => s.setPlaying);
    const setStackOrder = usePlayerStore(s => s.setStackOrder);
    const trackStart = usePlayerStore(s => s.trackStart);
    const trackEnd = usePlayerStore(s => s.trackEnd);

    const crossfade = useSettingsStore(s => s.crossfade);
    const crossfadeMs = useSettingsStore(s => s.crossfadeMs);
    const autoGain = useSettingsStore(s => s.autoGain);
    const fadeEnabled = useSettingsStore(s => s.fadeEnabled);
    const fadeInMs = useSettingsStore(s => s.fadeInMs);
    const fadeOutMs = useSettingsStore(s => s.fadeOutMs);
    
    const updateDownload = useDownloadStore(s => s.updateProgress);

    const isInitialLoad = useRef(true);

    // Diagnostic logging
    useEffect(() => {
        if (playing && pQueue[ci]) {
            console.log(`[useAudio] ▶️ Play requested for track: ${pQueue[ci].title}, mode: ${mode}`);
        }
    }, [playing, ci, pQueue]);

    const channelARef = useRef<HTMLAudioElement | null>(null);
    const channelBRef = useRef<HTMLAudioElement | null>(null);
    const activeChannel = useRef<"A" | "B">("A");
    const fadeTimersRef = useRef<Map<HTMLAudioElement, ReturnType<typeof setInterval>>>(new Map());
    const playbackQueueRef = useRef<{ audio: HTMLAudioElement; track: Track; type: "fade" | "direct"; fadeInMs?: number } | null>(null);
    const pendingPlaybackModeRef = useRef<PlaybackTransitionMode>("direct");
    const pendingPauseModeRef = useRef<PauseTransitionMode>("idle");
    const manualPauseTransitionRef = useRef(false);
    const settingsRef = useRef({
        crossfade,
        crossfadeMs,
        autoGain,
        fadeEnabled,
        fadeInMs,
        fadeOutMs,
    });
    
    // Sincronización de estado para intervalos
    const stateRef = useRef({ playing, ci, vol, pQueue, stackOrder, pos });
    useEffect(() => {
        stateRef.current = { playing, ci, vol, pQueue, stackOrder, pos };
    }, [playing, ci, vol, pQueue, stackOrder, pos]);

    useEffect(() => {
        settingsRef.current = {
            crossfade,
            crossfadeMs,
            autoGain,
            fadeEnabled,
            fadeInMs,
            fadeOutMs,
        };
    }, [crossfade, crossfadeMs, autoGain, fadeEnabled, fadeInMs, fadeOutMs]);

    const getActive = () => activeChannel.current === "A" ? channelARef.current : channelBRef.current;

    const skipToNextGracefully = () => {
        const playerState = usePlayerStore.getState();
        const nextIndex = resolveNextTrackIndex(playerState);
        if (nextIndex === null) return;

        const currentTrack = playerState.pQueue[playerState.ci] ?? null;
        const activeAudio = getActive();

        if (playerState.playing && activeAudio && !activeAudio.paused && currentTrack) {
            const settingsState = settingsRef.current;
            const transitionMs = settingsState.crossfade
                ? settingsState.crossfadeMs
                : (settingsState.fadeEnabled ? settingsState.fadeOutMs : 300);
            pendingPlaybackModeRef.current = settingsState.crossfade
                ? "crossfade"
                : (settingsState.fadeEnabled ? "fade" : "direct");

            activeChannel.current = activeChannel.current === "A" ? "B" : "A";
            runFade(activeAudio, currentTrack, "out", transitionMs);
        }

        playerState.setPos(0);
        playerState.setCi(nextIndex);

        if (playerState.stackOrder.length > 0) {
            playerState.setStackOrder(playerState.stackOrder.slice(1));
        }
    };

    const pausePlaybackGracefully = () => {
        const playerState = usePlayerStore.getState();
        const activeAudio = getActive();
        const currentTrack = playerState.pQueue[playerState.ci] ?? null;
        const settingsState = settingsRef.current;

        if (!playerState.playing) return;

        if (!activeAudio || activeAudio.paused || !currentTrack) {
            pendingPauseModeRef.current = "idle";
            manualPauseTransitionRef.current = false;
            playerState.setPlaying(false);
            return;
        }

        if (!settingsState.fadeEnabled || settingsState.fadeOutMs <= 0) {
            pendingPauseModeRef.current = "direct";
            manualPauseTransitionRef.current = false;
            activeAudio.pause();
            playerState.setPlaying(false);
            return;
        }

        pendingPauseModeRef.current = "fade";
        manualPauseTransitionRef.current = true;
        runFade(activeAudio, currentTrack, "out", settingsState.fadeOutMs, () => {
            manualPauseTransitionRef.current = false;
            pendingPauseModeRef.current = "idle";
            playerState.setPlaying(false);
        });
    };

    const resumePlaybackGracefully = () => {
        const playerState = usePlayerStore.getState();
        const activeAudio = getActive();
        const currentTrack = playerState.pQueue[playerState.ci] ?? null;
        const settingsState = settingsRef.current;

        if (playerState.playing) return;

        pendingPauseModeRef.current = "idle";
        manualPauseTransitionRef.current = false;

        if (activeAudio && currentTrack && activeAudio.src) {
            const existingTimer = fadeTimersRef.current.get(activeAudio);
            if (existingTimer) {
                clearInterval(existingTimer);
                fadeTimersRef.current.delete(activeAudio);
            }

            if (settingsState.fadeEnabled && settingsState.fadeInMs > 0) {
                runFade(activeAudio, currentTrack, "in", settingsState.fadeInMs);
            } else {
                applyVol(activeAudio, currentTrack);
                activeAudio.play().catch((err) => {
                    console.error("[useAudio] Immediate resume failed:", err?.message ?? err);
                    playerState.setPlaying(false);
                });
            }
            pendingPlaybackModeRef.current = "direct";
            playerState.setPlaying(true);
            return;
        }

        pendingPlaybackModeRef.current = settingsState.fadeEnabled && settingsState.fadeInMs > 0 ? "fade" : "direct";
        playerState.setPlaying(true);
    };

    const togglePlaybackGracefully = () => {
        const playerState = usePlayerStore.getState();
        if (playerState.playing) pausePlaybackGracefully();
        else resumePlaybackGracefully();
    };

    const applyVol = (audio: HTMLAudioElement, track: Track | null, multiplier: number = 1) => {
        if (!audio) return;
        let v = stateRef.current.vol * multiplier;
        if (track && settingsRef.current.autoGain && track.gainOffset) {
            v = Math.min(1.0, v * Math.min(2.0, track.gainOffset));
        }
        audio.volume = Math.max(0, Math.min(1, v));
    };

    const runFade = (audio: HTMLAudioElement, track: Track | null, type: "in" | "out", duration: number, onComplete?: () => void) => {
        const existingTimer = fadeTimersRef.current.get(audio);
        if (existingTimer) clearInterval(existingTimer);
        const startTime = performance.now();

        if (type === "in") {
            applyVol(audio, track, 0);
            console.log(`[useAudio] 🔊 Attempting fade-in play for: ${track?.title}`);
            audio.play().catch((err) => {
                console.error("[useAudio] 🔴 Fade-in play failed:", err?.message ?? err, "error:", err);
            });
        }

        const interval = setInterval(() => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            const multiplier = type === "in" ? progress : (1 - progress);
            applyVol(audio, track, multiplier);

            if (progress >= 1) {
                clearInterval(interval);
                fadeTimersRef.current.delete(audio);
                if (type === "out") audio.pause();
                if (onComplete) onComplete();
            }
        }, 16);
        fadeTimersRef.current.set(audio, interval);
    };

    useEffect(() => {
        channelARef.current = new Audio();
        channelBRef.current = new Audio();
        registerAudioTransportController({
            skipToNextGracefully,
            togglePlaybackGracefully,
        });
        console.log("[useAudio] 🎧 Audio channels initialized (A/B)");

        // Setup event handlers for when audio is ready to play
        const setupAudioHandlers = (audio: HTMLAudioElement) => {
            audio.addEventListener("play", () => {
                const { pQueue, ci, trackStart } = usePlayerStore.getState();
                const ct = pQueue[ci];
                if (ct && (audio as any)._lastTrackId === ct.id) {
                    console.log(`[useAudio] ▶ï¸ Track started playing: ${ct.title}`);
                    trackStart(ct.id);
                }
            });

            audio.addEventListener("canplay", () => {
                if (playbackQueueRef.current && playbackQueueRef.current.audio === audio) {
                    const { track, type, fadeInMs } = playbackQueueRef.current;
                    console.log(`[useAudio] 🟢 Audio ready to play: ${track.title}`);
                    if (type === "fade" && fadeInMs) {
                        runFade(audio, track, "in", fadeInMs);
                    } else {
                        applyVol(audio, track);
                        audio.play().catch((err) => {
                            console.error("[useAudio] 🔴 Play after canplay failed:", err?.message ?? err);
                        });
                    }
                    playbackQueueRef.current = null;
                }
            });

            audio.addEventListener("ended", () => {
                const { pQueue, ci, trackEnd } = usePlayerStore.getState();
                const ct = pQueue[ci];
                if (ct) {
                    console.log(`[useAudio] 🏁 Track ended naturally: ${ct.title}`);
                    trackEnd(ct.id, audio.currentTime * 1000);
                }
            });

            audio.addEventListener("loadstart", () => {
                const currentTrack = usePlayerStore.getState().pQueue[usePlayerStore.getState().ci];
                const prevId = (audio as any)._lastTrackId;
                
                if (prevId && prevId !== currentTrack?.id) {
                    const lastPos = (audio as any)._lastPos || 0;
                    const lastDur = (audio as any)._lastDur || 0;
                    if (lastDur > 0 && (lastPos / lastDur) < 0.3 && lastPos > 1) {
                        console.log(`[useAudio] ⏭️ Track skipped (<30%): ${prevId}`);
                        usePlayerStore.getState().trackSkip(prevId, lastPos * 1000);
                    }
                }
                (audio as any)._lastTrackId = currentTrack?.id;
            });

            audio.addEventListener("timeupdate", () => {
                (audio as any)._lastPos = audio.currentTime;
                if (audio.duration && !isNaN(audio.duration)) (audio as any)._lastDur = audio.duration;
            });
        };

        if (channelARef.current) setupAudioHandlers(channelARef.current);
        if (channelBRef.current) setupAudioHandlers(channelBRef.current);

        return () => {
            channelARef.current?.pause();
            channelBRef.current?.pause();
            fadeTimersRef.current.forEach(id => clearInterval(id));
            fadeTimersRef.current.clear();
            registerAudioTransportController(null);
        };
    }, []);

    // ── CICLO DE VIDA UNIFICADO ──
    useEffect(() => {
        const ct = pQueue[ci];
        const audio = getActive();
        if (!ct || !audio) return;

        let cancelled = false; // Flag para descartar resoluciones de efectos stale

        const url = getTrackUrl(ct);

        // 1. CARGA (Download -> Buffer) — async operation
        AudioStreamerService.fetchWithProgress(url, (p) => updateDownload(ct.id, p), ct.id)
            .then((objectUrl) => {
                if (cancelled) return; // Efecto stale — descartar

                const isNewSrc = audio.src !== objectUrl;
                if (isNewSrc) {
                    audio.src = objectUrl;
                    audio.load();
                    
                    // Aplicar seek inicial si es la primera carga tras restauración
                    const initialSeekMs = isInitialLoad.current ? stateRef.current.pos : (ct.startTime || 0);
                    audio.currentTime = initialSeekMs / 1000;
                    if (isInitialLoad.current) {
                        console.log(`[useAudio] 🎯 Initial seek applied: ${initialSeekMs}ms`);
                        isInitialLoad.current = false;
                    }
                    
                    console.log(`[useAudio] 📦 Audio loaded: ${ct.title}, channel: ${activeChannel.current}, startTime: ${initialSeekMs}ms`);

                    // Persistir la URL fresca en el store para evitar re-fetch de IDB en cada play
                    if (objectUrl !== url) {
                        usePlayerStore.setState((s) => ({
                            pQueue: s.pQueue.map(t => t.id === ct.id ? { ...t, blob_url: objectUrl } : t)
                        }));
                    }
                }

                // 2. REPRODUCCIÓN (¿Debería estar sonando?)
                if (playing) {
                    if (audio.paused || isNewSrc) {
                        // Si es nuevo o estaba pausado, queue the playback for when ready
                        console.log(`[useAudio] 📋 Queueing playback for: ${ct.title}, fadeEnabled: ${fadeEnabled}`);
                        const transitionMode = pendingPlaybackModeRef.current;
                        const shouldFadeIn = transitionMode !== "direct";
                        const fadeInDuration = transitionMode === "crossfade"
                            ? settingsRef.current.crossfadeMs
                            : settingsRef.current.fadeInMs;
                        playbackQueueRef.current = {
                            audio,
                            track: ct,
                            type: shouldFadeIn ? "fade" : "direct",
                            fadeInMs: shouldFadeIn ? fadeInDuration : undefined
                        };
                        pendingPlaybackModeRef.current = "direct";

                        // If audio is already ready (cached or quick load), trigger immediately
                        if (audio.readyState >= 2) { // >= HAVE_CURRENT_DATA
                            console.log(`[useAudio] ⚡ Audio already ready, triggering playback immediately`);
                            const queue = playbackQueueRef.current;
                            playbackQueueRef.current = null;
                            if (queue.type === "fade") {
                                runFade(queue.audio, queue.track, "in", queue.fadeInMs || settingsRef.current.fadeInMs);
                            } else {
                                applyVol(queue.audio, queue.track);
                                queue.audio.play().catch((err) => {
                                    console.error("[useAudio] 🔴 Immediate play failed:", err?.message ?? err);
                                    setPlaying(false);
                                });
                            }
                        }
                    } else {
                        // Si ya estaba sonando, solo aseguramos el volumen
                        if (!fadeTimersRef.current.has(audio)) applyVol(audio, ct);
                    }
                } else {
                    // 3. PAUSA (¿Debería detenerse?)
                    if (!audio.paused && !manualPauseTransitionRef.current) {
                        const requestedPauseMode = pendingPauseModeRef.current;
                        pendingPauseModeRef.current = "idle";

                        if (requestedPauseMode === "fade" && settingsRef.current.fadeOutMs > 0) {
                            runFade(audio, ct, "out", settingsRef.current.fadeOutMs);
                        } else if (requestedPauseMode === "direct") {
                            audio.pause();
                        } else if (settingsRef.current.fadeEnabled && audio.currentTime > 1) {
                            runFade(audio, ct, "out", settingsRef.current.fadeOutMs);
                        } else {
                            audio.pause();
                        }
                    }
                }
            })
            .catch((err) => {
                if (cancelled) return;
                console.error("[useAudio] No se pudo cargar el audio:", ct.title, err?.message ?? err);
                // Revertir estado de reproducción para que el UI no quede "congelado"
                setPlaying(false);
            });

        return () => { cancelled = true; };

    }, [ci, playing, pQueue.length]); // Reacciona a cambio de track Y a Play/Pause

    // ── Efecto: Volumen y Seek (Reactividad instantánea) ──
    useEffect(() => {
        const audio = getActive();
        if (audio && !fadeTimersRef.current.has(audio)) applyVol(audio, pQueue[ci]);
    }, [vol]);

    useEffect(() => {
        const audio = getActive();
        if (audio && Math.abs(audio.currentTime * 1000 - pos) > 50) {
            audio.currentTime = pos / 1000;
        }
    }, [pos]);

    // ── Main Loop (Progreso y Transiciones) ──
    useEffect(() => {
        const interval = setInterval(() => {
            const audio = getActive();
            const ct = pQueue[ci];
            if (!audio || audio.paused || !ct || manualPauseTransitionRef.current) return;

            const currentMs = audio.currentTime * 1000;
            setPos(Math.floor(currentMs));

            const trackEnd = ct.endTime || ct.duration_ms;
            const remainingMs = trackEnd - currentMs;
            
            const triggerMs = crossfade ? crossfadeMs : 300;
            if (remainingMs <= triggerMs) {
                const oldPlayer = audio;
                pendingPlaybackModeRef.current = crossfade ? "crossfade" : (fadeEnabled ? "fade" : "direct");
                activeChannel.current = activeChannel.current === "A" ? "B" : "A";
                runFade(oldPlayer, ct, "out", triggerMs);
                
                if (stateRef.current.stackOrder.length > 0) {
                    const nextId = stateRef.current.stackOrder[0];
                    const nextIdx = pQueue.findIndex(t => t.id === nextId);
                    setCi(nextIdx !== -1 ? nextIdx : ci + 1);
                    setStackOrder(stateRef.current.stackOrder.slice(1));
                } else if (ci < pQueue.length - 1) {
                    setCi(ci + 1);
                } else {
                    setPlaying(false);
                }
            }
        }, TICK_MS);

        return () => clearInterval(interval);
    }, [ci, playing, crossfade]);

    return { isReal: true };
}
