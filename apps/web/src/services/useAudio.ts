/**
 * useAudio — Audio Engine v2.5 (Gapless Ping-Pong Buffer)
 * 
 * Uses two separate HTMLAudioElement instances to ensure perfect transitions.
 * Track B is pre-loaded and primed while Track A is still playing.
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
    const pQueue = usePlayerStore(s => s.pQueue);
    const ci = usePlayerStore(s => s.ci);
    const playing = usePlayerStore(s => s.playing);
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
    const crossfadeMs = useSettingsStore(s => s.crossfadeMs);
    const fadeEnabled = useSettingsStore(s => s.fadeEnabled);
    const fadeInMs = useSettingsStore(s => s.fadeInMs);
    const fadeOutMs = useSettingsStore(s => s.fadeOutMs);
    const autoGain = useSettingsStore(s => s.autoGain);

    const updateDownload = useDownloadStore(s => s.updateProgress);
    const addLog = useDebugStore(s => s.addLog);

    // ── Reproductores duales para Gapless ────────────────────────────────────
    const primaryAudioRef = useRef<HTMLAudioElement | null>(null);
    const secondaryAudioRef = useRef<HTMLAudioElement | null>(null);
    const activePlayerRef = useRef<"A" | "B">("A");

    const isReal = useRef(false);
    const posRef = useRef(0);
    const hasAdvanced = useRef(false);
    const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const ciRef = useRef(ci);
    const pQueueLenRef = useRef(pQueue.length);
    const volRef = useRef(vol);
    const crossfadeMsRef = useRef(crossfadeMs);
    const nextTrackRef = useRef<Track | null>(null);

    // Sincronización de Refs
    ciRef.current = ci;
    pQueueLenRef.current = pQueue.length;
    volRef.current = vol;
    crossfadeMsRef.current = crossfadeMs;

    const ct = pQueue[ci];
    // Determinar siguiente track para pre-carga
    const nextTrackId = stackOrder[0];
    const nextTrackIdx = nextTrackId ? pQueue.findIndex(t => t.id === nextTrackId) : -1;
    const nextTrack = nextTrackIdx !== -1 ? pQueue[nextTrackIdx] : (pQueue[ci + 1] ?? null);
    nextTrackRef.current = nextTrack;

    // ── Inicialización de reproductores ──────────────────────────────────────
    useEffect(() => {
        primaryAudioRef.current = new Audio();
        secondaryAudioRef.current = new Audio();
        
        // Configuración de ahorro de energía / iPad
        [primaryAudioRef.current, secondaryAudioRef.current].forEach(a => {
            if (a) a.preload = "auto";
        });

        return () => {
            primaryAudioRef.current?.pause();
            secondaryAudioRef.current?.pause();
        };
    }, []);

    const getPlayer = () => activePlayerRef.current === "A" ? primaryAudioRef.current : secondaryAudioRef.current;
    const getNextPlayer = () => activePlayerRef.current === "A" ? secondaryAudioRef.current : primaryAudioRef.current;

    const getEffectiveVol = (baseVol: number, track: Track | null) => {
        if (!track || !autoGain || !track.gainOffset) return baseVol;
        return Math.min(1.0, baseVol * Math.min(2.0, track.gainOffset));
    };

    // ── Carga y Pre-carga (SuniSync) ─────────────────────────────────────────
    useEffect(() => {
        if (!ct) return;
        const audio = getPlayer();
        if (!audio) return;

        hasAdvanced.current = false;
        isReal.current = false;
        posRef.current = 0;
        
        // 1. Cargar track actual si no estaba ya listo
        const audioUrl = ct.blob_url ?? `/audio/${encodeURIComponent(ct.file_path)}`;
        
        AudioStreamerService.fetchWithProgress(audioUrl, (p) => {
            updateDownload(audioUrl, p);
        }).then((objectUrl) => {
            if (audio.src !== objectUrl) {
                audio.src = objectUrl;
                audio.load();
            }
            audio.currentTime = (ct.startTime || 0) / 1000;
            isReal.current = true;
            setIsSimulating(false);
        });

    }, [ci, ct?.id]);

    // ── Engine Loop Principal ────────────────────────────────────────────────
    useEffect(() => {
        const audio = getPlayer();
        if (!audio || !ct) return;

        if (!playing) {
            audio.pause();
            return;
        }

        audio.play().catch(() => setIsSimulating(true));

        simRef.current = setInterval(() => {
            const trackEnd = ct.endTime || ct.duration_ms;
            const remainingMs = trackEnd - (audio.currentTime * 1000);
            
            posRef.current = Math.floor(audio.currentTime * 1000);
            setPos(posRef.current);

            // 🟢 LOGICA DE PRE-CARGA (20s antes)
            if (remainingMs < 20000 && nextTrack && !hasAdvanced.current) {
                const nextPlayer = getNextPlayer();
                const nextUrl = nextTrack.blob_url ?? `/audio/${encodeURIComponent(nextTrack.file_path)}`;
                
                if (nextPlayer && nextPlayer.dataset.trackId !== nextTrack.id) {
                    addLog(`Pre-cargando: ${nextTrack.title}`);
                    AudioStreamerService.fetchWithProgress(nextUrl, (p) => {
                        updateDownload(nextUrl, p);
                    }).then(objUrl => {
                        nextPlayer.src = objUrl;
                        nextPlayer.dataset.trackId = nextTrack.id;
                        nextPlayer.load();
                    });
                }
            }

            // 🟢 LOGICA DE TRANSICIÓN (Crossfade o Gapless)
            const triggerTime = crossfade ? crossfadeMs : 300; // 300ms de margen para gapless real
            if (remainingMs <= triggerTime && !hasAdvanced.current) {
                hasAdvanced.current = true;
                addLog("Iniciando transición suave...");
                
                // Cambiar el turno de los reproductores
                activePlayerRef.current = activePlayerRef.current === "A" ? "B" : "A";
                
                // Avanzar el índice (esto disparará el useEffect de carga para el siguiente-siguiente)
                if (stackOrder.length > 0) {
                    const nextIdx = pQueue.findIndex(t => t.id === stackOrder[0]);
                    setCi(nextIdx !== -1 ? nextIdx : ci + 1);
                    setStackOrder(stackOrder.slice(1));
                } else if (ci < pQueue.length - 1) {
                    setCi(ci + 1);
                } else {
                    setPlaying(false);
                }
            }
        }, TICK_MS);

        elapsedRef.current = setInterval(() => setElapsed((p: number) => p + 1), 1000);

        return () => {
            clearInterval(simRef.current!);
            clearInterval(elapsedRef.current!);
        };
    }, [playing, ci, ct?.id]);

    return { isReal: isReal.current };
}
