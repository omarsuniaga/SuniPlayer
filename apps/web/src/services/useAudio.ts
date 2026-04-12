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
import { usePreviewStore } from "../store/usePreviewStore";

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

    const isPreviewPlaying = usePreviewStore(s => s.isPlaying);

    // ── MOTOR DE AUDIO (SyncEnsemble) ──
    const engine: IAudioEngine = syncEnsemble.audioEngine;

    // Track the intended playback state to resolve race conditions during fades
    const playbackIntent = useRef<"play" | "pause">(playing ? "play" : "pause");

    useEffect(() => {
        engine.onPositionUpdate((posMs: number) => {
            const state = usePlayerStore.getState();
            if (state.playing && state.pQueue[state.ci]) {
                setPos(posMs);
            }
        });
        engine.onEnded(() => {
            console.log(`[useAudio] Fin del track detectado.`);
            const state = usePlayerStore.getState();
            const ct = state.pQueue[state.ci];
            
            // Validation guard
            if (!ct) {
                console.warn("[useAudio] onEnded: No current track found in queue.");
                setPlaying(false);
                return;
            }

            trackEnd(ct.id, engine.durationMs);
            
            // Auto-next logic
            const next = resolveNextTrackIndex(state);
            if (next !== null && state.pQueue[next]) {
                setPos(0);
                setCi(next);
            } else {
                setPlaying(false);
            }
        });
    }, [engine, setCi, setPlaying, setPos, trackEnd]);

    // ── INICIALIZACIÓN ──
    useEffect(() => {
        registerAudioTransportController({
            skipToNextGracefully: () => {
                const state = usePlayerStore.getState();
                const next = resolveNextTrackIndex(state);
                
                if (next !== null && state.pQueue[next]) {
                    const { fadeEnabled, fadeOutMs } = useSettingsStore.getState();
                    
                    if (fadeEnabled && state.playing) {
                        // Intentional fade-out before skipping
                        engine.fadeVolume(0, fadeOutMs).then(() => {
                            setPos(0);
                            setCi(next);
                        });
                    } else {
                        setPos(0);
                        setCi(next);
                    }
                }
            },
            togglePlaybackGracefully: () => {
                const isPlaying = usePlayerStore.getState().playing;
                setPlaying(!isPlaying);
            },
        });

        return () => {
            registerAudioTransportController(null);
        };
    }, [setCi, setPlaying, setPos, engine]);

    // ── VOLUMEN ──
    useEffect(() => {
        // If preview is playing, we mute the main engine
        if (isPreviewPlaying) {
            engine.setVolume(0);
        } else {
            engine.setVolume(vol);
        }
    }, [engine, vol, isPreviewPlaying]);

    // ── SCHEDULED PLAY (SyncEnsemble) ──
    useEffect(() => {
        if (!scheduledPlay) return;

        const currentTrack = pQueue[ci];
        if (!currentTrack || currentTrack.id !== scheduledPlay.trackId) return;

        const delayMs = scheduledPlay.targetWallMs - Date.now();

        if (delayMs < -2000) {
            console.warn(`[useAudio] Scheduled play arrived ${Math.abs(delayMs).toFixed(0)}ms late. Playing immediately.`);
            engine.seek(scheduledPlay.positionMs);
            engine.play();
            playbackIntent.current = "play";
            usePlayerStore.setState({ playing: true });
            clearScheduledPlay();
            return;
        }

        const waitMs = Math.max(0, delayMs);
        const timer = setTimeout(() => {
            engine.seek(scheduledPlay.positionMs);
            engine.play();
            playbackIntent.current = "play";
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

        const state = usePlayerStore.getState();
        if (state.sessionId && state.isLeader) {
            syncEnsemble.orchestrator.broadcastTrackChange(ct.id);
        }
    }, [ci, ct, engine]);

    // ── CICLO DE REPRODUCCIÓN ──
    useEffect(() => {
        const ct = pQueue[ci];
        if (!ct) return;

        let cancelled = false;
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

                    const state = usePlayerStore.getState();
                    if (state.sessionId && !state.isLeader) {
                        syncEnsemble.orchestrator.sendReadySignal();
                    }
                }

                if (cancelled) return;

                const pendingPlay = usePlayerStore.getState().scheduledPlay;
                if (pendingPlay && pendingPlay.trackId === ct.id) {
                    const delayMs = pendingPlay.targetWallMs - Date.now();
                    if (delayMs < -2000) {
                        engine.seek(pendingPlay.positionMs);
                        engine.play();
                        playbackIntent.current = "play";
                        usePlayerStore.setState({ playing: true });
                        usePlayerStore.getState().clearScheduledPlay();
                    } else {
                        setTimeout(() => {
                            if (cancelled) return;
                            engine.seek(pendingPlay.positionMs);
                            engine.play();
                            playbackIntent.current = "play";
                            usePlayerStore.setState({ playing: true });
                            usePlayerStore.getState().clearScheduledPlay();
                        }, Math.max(0, delayMs));
                    }
                    return;
                }

                const { playing: currentPlaying, countdown, vol: currentVol } = usePlayerStore.getState();
                const { fadeEnabled, fadeInMs } = useSettingsStore.getState();
                const hasPendingScheduledPlay = usePlayerStore.getState().scheduledPlay !== null;

                if ((currentPlaying || countdown !== null) && !engine.isPlaying && !hasPendingScheduledPlay) {
                    if (fadeEnabled) engine.fadeVolume(currentVol, fadeInMs);
                    engine.play();
                    playbackIntent.current = "play";
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

    }, [ci, engine, pQueue, updateDownload]);

    // ── PLAY / PAUSE TOGGLE (With Race Condition Protection) ──
    useEffect(() => {
        const isEngineLoaded = engine.durationMs > 0;
        if (!isEngineLoaded) return;

        const hasPendingScheduledPlay = usePlayerStore.getState().scheduledPlay !== null;
        if (hasPendingScheduledPlay) return;

        const { vol: currentVol } = usePlayerStore.getState();
        const { fadeEnabled, fadeInMs, fadeOutMs } = useSettingsStore.getState();

        if (playing) {
            playbackIntent.current = "play";
            if (!engine.isPlaying) {
                if (fadeEnabled) engine.fadeVolume(currentVol, fadeInMs);
                engine.play();
            } else {
                // If already playing but volume was fading out, restore it
                if (fadeEnabled) engine.fadeVolume(currentVol, fadeInMs);
            }
        } else {
            playbackIntent.current = "pause";
            if (engine.isPlaying) {
                if (fadeEnabled) {
                    // Capture current position AT THE START of the fade to avoid drift
                    const pausePosAtStartMs = usePlayerStore.getState().pos;
                    engine.fadeVolume(0, fadeOutMs).then(() => {
                        // ONLY pause if the intent is still to be paused
                        if (playbackIntent.current === "pause") {
                            engine.pause(pausePosAtStartMs);
                        }
                    });
                } else {
                    engine.pause();
                }
            }
        }
    }, [playing, engine]);

    return { isReal: true };
}
