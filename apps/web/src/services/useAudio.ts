/**
 * useAudio — Master Performance Engine v4.3.0 (Singleton Context & Auto-Resume)
 */
import { useEffect, useRef } from "react";
import { 
    usePlayerStore, 
    useSettingsStore, 
    Track, 
    getTrackUrl,
    IAudioEngine
} from "@suniplayer/core";
import { useDownloadStore } from "../store/useDownloadStore";
import { updateTrackMetadata } from "../store/useProjectStore";
import { AudioStreamerService } from "./AudioStreamerService.ts";
import {
    registerAudioTransportController,
    resolveNextTrackIndex,
} from "./audioTransport";
import { syncEnsemble } from "./network/SyncEnsembleOrchestrator";

export function useAudio() {
    const pQueue = usePlayerStore(s => s.pQueue);
    const ci = usePlayerStore(s => s.ci);
    const playing = usePlayerStore(s => s.playing);
    const vol = usePlayerStore(s => s.vol);
    const pos = usePlayerStore(s => s.pos);
    
    const setPos = usePlayerStore(s => s.setPos);
    const setCi = usePlayerStore(s => s.setCi);
    const setPlaying = usePlayerStore(s => s.setPlaying);
    const trackEnd = usePlayerStore(s => s.trackEnd);

    const fadeEnabled = useSettingsStore(s => s.fadeEnabled);
    const fadeInMs = useSettingsStore(s => s.fadeInMs);
    const fadeOutMs = useSettingsStore(s => s.fadeOutMs);
    const updateDownload = useDownloadStore(s => s.updateProgress);

    const scheduledPlay = usePlayerStore(s => s.scheduledPlay);
    const clearScheduledPlay = usePlayerStore(s => s.clearScheduledPlay);
    const sessionId = usePlayerStore(s => s.sessionId);
    const isLeader = usePlayerStore(s => s.isLeader);

    // ── MOTOR DE AUDIO (SyncEnsemble) ──
    // Usamos el motor centralizado para que todos los dispositivos suenen al unísono
    const engine: IAudioEngine = syncEnsemble.audioEngine;

    useEffect(() => {
        engine.onPositionUpdate((posMs: number) => {
            if (usePlayerStore.getState().playing) {
                setPos(posMs);
            }
        });
        engine.onEnded(() => {
            console.log(`[useAudio] Fin del track detectado.`);
            const state = usePlayerStore.getState();
            const ct = state.pQueue[state.ci];
            if (ct) trackEnd(ct.id, engine.durationMs);
            
            // Auto-next logic
            const next = resolveNextTrackIndex(state);
            if (next !== null) {
                setPos(0);
                setCi(next);
            } else setPlaying(false);
        });
    }, [engine, setCi, setPlaying, setPos, trackEnd]);

    // ── INICIALIZACIÓN ──
    useEffect(() => {
        registerAudioTransportController({
            skipToNextGracefully: () => {
                const next = resolveNextTrackIndex(usePlayerStore.getState());
                if (next !== null) setCi(next);
            },
            togglePlaybackGracefully: () => {
                const isPlaying = usePlayerStore.getState().playing;
                setPlaying(!isPlaying);
            },
        });

        return () => {
            registerAudioTransportController(null);
        };
    }, [setCi, setPlaying]);

    // ── VOLUMEN ──
    useEffect(() => {
        engine.setVolume(vol);
    }, [engine, vol]);

    // ── SCHEDULED PLAY (SyncEnsemble) ──
    // Executes a synchronized play exactly at targetWallMs, after the track is confirmed loaded.
    useEffect(() => {
        if (!scheduledPlay) return;

        const currentTrack = pQueue[ci];
        if (!currentTrack || currentTrack.id !== scheduledPlay.trackId) return;

        const delayMs = scheduledPlay.targetWallMs - Date.now();

        if (delayMs < -2000) {
            // More than 2s late — play immediately
            console.warn(`[useAudio] Scheduled play arrived ${Math.abs(delayMs).toFixed(0)}ms late. Playing immediately.`);
            engine.seek(scheduledPlay.positionMs);
            engine.play();
            usePlayerStore.setState({ playing: true });
            clearScheduledPlay();
            return;
        }

        const waitMs = Math.max(0, delayMs);
        console.log(`[useAudio] Scheduled play in ${waitMs.toFixed(0)}ms for track ${scheduledPlay.trackId}`);

        const timer = setTimeout(() => {
            engine.seek(scheduledPlay.positionMs);
            engine.play();
            usePlayerStore.setState({ playing: true });
            clearScheduledPlay();
        }, waitMs);

        return () => {
            clearTimeout(timer);
        };
    }, [scheduledPlay, ci, pQueue, engine, clearScheduledPlay]);

    // ── PITCH/TEMPO SYNC ──
    const ct = pQueue[ci];
    useEffect(() => {
        if (!ct) return;
        if (ct.transposeSemitones !== undefined) engine.setPitch(ct.transposeSemitones);
        if (ct.playbackTempo !== undefined) engine.setTempo(ct.playbackTempo);

        // --- TRACK SYNC ---
        const state = usePlayerStore.getState();
        if (state.sessionId && state.isLeader) {
            syncEnsemble.orchestrator.broadcastTrackChange(ct.id);
        }
    }, [ci, ct, engine]);

    // ── CICLO DE REPRODUCCIÓN ──
    // Fires ONLY on track change (ci/pQueue). Does NOT re-run on play/pause toggles.
    // That prevents concurrent loads caused by pressing play during audio decoding.
    useEffect(() => {
        const ct = pQueue[ci];
        if (!ct) return;

        let cancelled = false; // Guard against stale async completions after track change

        const url = getTrackUrl(ct);

        AudioStreamerService.fetchWithProgress(url, (p) => updateDownload(ct.id, p), ct.id)
            .then(async (objectUrl) => {
                if (cancelled) return;

                if (engine.currentUrl !== objectUrl) {
                    const currentPos = usePlayerStore.getState().pos;
                    const startMs = (currentPos > 0) ? currentPos : (ct.startTime || 0);

                    await engine.load(objectUrl);
                    if (cancelled) return;

                    if (ct.transposeSemitones !== undefined) engine.setPitch(ct.transposeSemitones);
                    if (ct.playbackTempo !== undefined) engine.setTempo(ct.playbackTempo);
                    engine.seek(startMs);

                    // Notify leader this follower is ready
                    const state = usePlayerStore.getState();
                    if (state.sessionId && !state.isLeader) {
                        syncEnsemble.orchestrator.sendReadySignal();
                    }
                }

                if (cancelled) return;

                // Pending scheduledPlay for this track — execute it (track just finished loading)
                const pendingPlay = usePlayerStore.getState().scheduledPlay;
                if (pendingPlay && pendingPlay.trackId === ct.id) {
                    const delayMs = pendingPlay.targetWallMs - Date.now();
                    if (delayMs < -2000) {
                        engine.seek(pendingPlay.positionMs);
                        engine.play();
                        usePlayerStore.setState({ playing: true });
                        usePlayerStore.getState().clearScheduledPlay();
                    } else {
                        setTimeout(() => {
                            if (cancelled) return;
                            engine.seek(pendingPlay.positionMs);
                            engine.play();
                            usePlayerStore.setState({ playing: true });
                            usePlayerStore.getState().clearScheduledPlay();
                        }, Math.max(0, delayMs));
                    }
                    return;
                }

                // Normal play after load: honour whatever playing state is current
                const { playing: currentPlaying, countdown, vol: currentVol } = usePlayerStore.getState();
                const { fadeEnabled, fadeInMs } = useSettingsStore.getState();
                const hasPendingScheduledPlay = usePlayerStore.getState().scheduledPlay !== null;

                if ((currentPlaying || countdown !== null) && !engine.isPlaying && !hasPendingScheduledPlay) {
                    if (fadeEnabled) engine.fadeVolume(currentVol, fadeInMs);
                    engine.play();
                }
            })
            .catch(err => {
                if (cancelled) return;
                console.error("[useAudio] Error cargando track:", err);

                const state = usePlayerStore.getState();
                if (state.sessionId && !state.isLeader && ct) {
                    syncEnsemble.orchestrator.requestAudioFromLeader(ct.id);
                } else {
                    updateTrackMetadata(ct.id, { sourceMissing: true });
                }
            });

        return () => { cancelled = true; };

    }, [ci, engine, pQueue, updateDownload]); // ← `playing` removed: prevents re-load on every toggle

    // ── PLAY / PAUSE TOGGLE ──
    // Fires on every play/pause change. Only acts if the engine is already loaded.
    // If the engine isn't loaded yet, CICLO above will call play() after load completes.
    useEffect(() => {
        const isEngineLoaded = engine.durationMs > 0;
        if (!isEngineLoaded) return; // Not loaded yet — CICLO handles play-after-load

        const hasPendingScheduledPlay = usePlayerStore.getState().scheduledPlay !== null;
        if (hasPendingScheduledPlay) return; // Scheduled play takes precedence

        const { vol: currentVol } = usePlayerStore.getState();
        const { fadeEnabled, fadeInMs, fadeOutMs } = useSettingsStore.getState();

        if (playing) {
            if (!engine.isPlaying) {
                if (fadeEnabled) engine.fadeVolume(currentVol, fadeInMs);
                engine.play();
            }
        } else {
            if (engine.isPlaying) {
                if (fadeEnabled) {
                    engine.fadeVolume(0, fadeOutMs).then(() => engine.pause());
                } else {
                    engine.pause();
                }
            }
        }
    }, [playing, engine]);

    return { isReal: true };
}
