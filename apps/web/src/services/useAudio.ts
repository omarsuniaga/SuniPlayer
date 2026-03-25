/**
 * useAudio — Audio Engine v2.5.1 (Gapless Ping-Pong Buffer - Clean Version)
 * 
 * Uses two separate HTMLAudioElement instances to ensure perfect transitions.
 * Track B is pre-loaded and primed while Track A is still playing.
 */
import { useEffect, useRef } from "react";
import { usePlayerStore } from "../store/usePlayerStore.ts";
import { useSettingsStore } from "../store/useSettingsStore.ts";
import { useDebugStore } from "../store/useDebugStore.ts";
import { useDownloadStore } from "../store/useDownloadStore.ts";
import { AudioStreamerService } from "./AudioStreamerService.ts";
import { Track } from "../types.ts";

const TICK_MS = 250;

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

    const crossfade = useSettingsStore(s => s.crossfade);
    const crossfadeMs = useSettingsStore(s => s.crossfadeMs);
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

    const applyEffectiveVol = (audio: HTMLAudioElement, track: Track | null) => {
        if (!audio) return;
        let v = volRef.current;
        if (track && autoGain && track.gainOffset) {
            v = Math.min(1.0, v * Math.min(2.0, track.gainOffset));
        }
        audio.volume = v;
    };

    // ── Carga y Pre-carga (SuniSync) ─────────────────────────────────────────
    useEffect(() => {
        if (!ct) return;
        const audio = getPlayer();
        if (!audio) return;

        hasAdvanced.current = false;
        isReal.current = false;
        posRef.current = 0;
        
        const audioUrl = ct.blob_url ?? `/audio/${encodeURIComponent(ct.file_path)}`;
        
        AudioStreamerService.fetchWithProgress(audioUrl, (p) => {
            updateDownload(audioUrl, p);
        }).then((objectUrl) => {
            if (audio.src !== objectUrl) {
                audio.src = objectUrl;
                audio.load();
            }
            audio.currentTime = (ct.startTime || 0) / 1000;
            applyEffectiveVol(audio, ct);
            isReal.current = true;
            setIsSimulating(false);
        });

    }, [ci, ct?.id, autoGain]);

    // ── Media Session API ────────────────────────────────────────────────────
    useEffect(() => {
        if (!ct || !('mediaSession' in navigator)) return;
        const logger = useDebugStore.getState().addLog;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: ct.title, artist: ct.artist, album: "SuniPlayer Setlist",
            artwork: [
                { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            ]
        });

        const handlers: [MediaSessionAction, () => void][] = [
            ['play', () => { logger("Media: PLAY"); setPlaying(true); }],
            ['pause', () => { logger("Media: PAUSE"); setPlaying(false); }],
            ['previoustrack', () => {
                logger("Media: PREV");
                if (ciRef.current > 0) { setCi(ciRef.current - 1); setPos(0); }
            }],
            ['nexttrack', () => {
                logger("Media: NEXT");
                if (ciRef.current < pQueueLenRef.current - 1) { setCi(ciRef.current + 1); setPos(0); }
            }],
            ['stop', () => { logger("Media: STOP"); setPlaying(false); setPos(0); }]
        ];

        for (const [action, handler] of handlers) {
            try { navigator.mediaSession.setActionHandler(action, handler); } catch { }
        }
        return () => {
            for (const [action] of handlers) { try { navigator.mediaSession.setActionHandler(action, null); } catch { } }
        };
    }, [ct, setPlaying, setCi, setPos]);

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
            applyEffectiveVol(audio, ct);

            // 🟢 LOGICA DE PRE-CARGA (20s antes)
            if (remainingMs < 20000 && nextTrackRef.current && !hasAdvanced.current) {
                const nextPlayer = getNextPlayer();
                const nextUrl = nextTrackRef.current.blob_url ?? `/audio/${encodeURIComponent(nextTrackRef.current.file_path)}`;
                
                if (nextPlayer && nextPlayer.dataset.trackId !== nextTrackRef.current.id) {
                    addLog(`Pre-cargando: ${nextTrackRef.current.title}`);
                    AudioStreamerService.fetchWithProgress(nextUrl, (p) => {
                        updateDownload(nextUrl, p);
                    }).then(objUrl => {
                        nextPlayer.src = objUrl;
                        nextPlayer.dataset.trackId = nextTrackRef.current!.id;
                        nextPlayer.load();
                    });
                }
            }

            // 🟢 LOGICA DE TRANSICIÓN
            const triggerTime = crossfade ? crossfadeMsRef.current : 300;
            if (remainingMs <= triggerTime && !hasAdvanced.current) {
                hasAdvanced.current = true;
                addLog("Transición iniciada");
                
                activePlayerRef.current = activePlayerRef.current === "A" ? "B" : "A";
                
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
    }, [playing, ci, ct?.id, crossfade, stackOrder.length]);

    return { isReal: isReal.current };
}
