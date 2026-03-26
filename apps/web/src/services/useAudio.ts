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

const TICK_MS = 100;

export function useAudio() {
    const {
        pQueue, ci, playing, vol, mode, stackOrder, pos,
        setPos, setCi, setPlaying, setElapsed, setStackOrder
    } = usePlayerStore(); // Usamos los stores atómicos directamente

    const { crossfade, crossfadeMs, autoGain, fadeEnabled, fadeInMs, fadeOutMs } = useSettingsStore();
    const updateDownload = useDownloadStore(s => s.updateProgress);

    // Diagnostic logging
    useEffect(() => {
        if (playing && pQueue[ci]) {
            console.log(`[useAudio] ▶️ Play requested for track: ${pQueue[ci].title}, mode: ${mode}`);
        }
    }, [playing, ci, pQueue]);

    const channelARef = useRef<HTMLAudioElement | null>(null);
    const channelBRef = useRef<HTMLAudioElement | null>(null);
    const activeChannel = useRef<"A" | "B">("A");
    const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    
    // Sincronización de estado para intervalos
    const stateRef = useRef({ playing, ci, vol, pQueue, stackOrder });
    useEffect(() => {
        stateRef.current = { playing, ci, vol, pQueue, stackOrder };
    }, [playing, ci, vol, pQueue, stackOrder]);

    useEffect(() => {
        channelARef.current = new Audio();
        channelBRef.current = new Audio();
        console.log("[useAudio] 🎧 Audio channels initialized (A/B)");
        return () => {
            channelARef.current?.pause();
            channelBRef.current?.pause();
            if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
        };
    }, []);

    const getActive = () => activeChannel.current === "A" ? channelARef.current : channelBRef.current;

    const applyVol = (audio: HTMLAudioElement, track: Track | null, multiplier: number = 1) => {
        if (!audio) return;
        let v = stateRef.current.vol * multiplier;
        if (track && autoGain && track.gainOffset) {
            v = Math.min(1.0, v * Math.min(2.0, track.gainOffset));
        }
        audio.volume = Math.max(0, Math.min(1, v));
    };

    const runFade = (audio: HTMLAudioElement, track: Track | null, type: "in" | "out", duration: number, onComplete?: () => void) => {
        if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
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
                fadeTimerRef.current = null;
                if (type === "out") audio.pause();
                if (onComplete) onComplete();
            }
        }, 16);
        fadeTimerRef.current = interval;
    };

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
                    audio.currentTime = (ct.startTime || 0) / 1000;
                    console.log(`[useAudio] 📦 Audio loaded: ${ct.title}, channel: ${activeChannel.current}, startTime: ${ct.startTime || 0}ms`);

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
                        // Si es nuevo o estaba pausado, entramos con Fade
                        if (fadeEnabled) runFade(audio, ct, "in", fadeInMs);
                        else {
                            applyVol(audio, ct);
                            console.log(`[useAudio] ▶️ Attempting direct play for: ${ct.title}`);
                            audio.play().catch((err) => {
                                console.error("[useAudio] 🔴 Direct play failed:", err?.message ?? err, "error:", err);
                                setPlaying(false);
                            });
                        }
                    } else {
                        // Si ya estaba sonando, solo aseguramos el volumen
                        if (!fadeTimerRef.current) applyVol(audio, ct);
                    }
                } else {
                    // 3. PAUSA (¿Debería detenerse?)
                    if (!audio.paused) {
                        if (fadeEnabled && audio.currentTime > 1) runFade(audio, ct, "out", fadeOutMs);
                        else audio.pause();
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
        if (audio && !fadeTimerRef.current) applyVol(audio, pQueue[ci]);
    }, [vol]);

    useEffect(() => {
        const audio = getActive();
        if (audio && Math.abs(audio.currentTime * 1000 - pos) > 1500) {
            audio.currentTime = pos / 1000;
        }
    }, [pos]);

    // ── Main Loop (Progreso y Transiciones) ──
    useEffect(() => {
        const interval = setInterval(() => {
            const audio = getActive();
            const ct = pQueue[ci];
            if (!audio || audio.paused || !ct) return;

            const currentMs = audio.currentTime * 1000;
            setPos(Math.floor(currentMs));

            const trackEnd = ct.endTime || ct.duration_ms;
            const remainingMs = trackEnd - currentMs;
            
            const triggerMs = crossfade ? crossfadeMs : 300;
            if (remainingMs <= triggerMs) {
                const oldPlayer = audio;
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
