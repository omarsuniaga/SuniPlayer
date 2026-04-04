// packages/core/src/network/SyncEnsembleOrchestrator.ts
import { IAudioEngine } from '../platform/interfaces/IAudioEngine';
import { SessionManager } from './SessionManager';
import { ClockSyncService } from './clockSyncService';
import { P2PMessage } from './types';
import { usePlayerStore } from '../store/usePlayerStore';
import { TRACKS } from '../data/constants';

/**
 * SyncEnsembleOrchestrator — High-level logic for synchronized playback.
 * Connects the AudioEngine with the SessionManager and ClockSyncService.
 */
export class SyncEnsembleOrchestrator {
    private audioEngine: IAudioEngine;
    private sessionManager: SessionManager;
    private clockSync: ClockSyncService;

    private lastReportedLeaderPos: number = 0;
    private reportInterval: ReturnType<typeof setInterval> | null = null;
    private readyMembers: Set<string> = new Set();

    constructor(audioEngine: IAudioEngine, sessionManager: SessionManager, clockSync: ClockSyncService) {
        this.audioEngine = audioEngine;
        this.sessionManager = sessionManager;
        this.clockSync = clockSync;
    }

    public initialize(): void {
        // Handle incoming messages from SessionManager
        this.sessionManager['transport']?.onMessage((msg: P2PMessage) => {
            switch (msg.type) {
                case 'TRACK_CHANGE':
                    this.handleRemoteTrackChange(msg.payload.trackId);
                    break;
                case 'MEMBER_READY':
                    if (this.sessionManager.getIsLeader()) {
                        this.readyMembers.add(msg.senderId);
                        console.log(`[SyncOrchestrator] Member ready: ${msg.senderId}. Total: ${this.readyMembers.size}`);
                    }
                    break;
                case 'PLAY':
                    if (msg.payload.trackId) {
                        this.handleRemoteTrackChange(msg.payload.trackId);
                    }
                    this.handleRemotePlay(
                        msg.payload.targetWallMs,
                        msg.payload.positionMs,
                        msg.payload.trackId
                    );
                    break;
                case 'PAUSE':
                    this.audioEngine.pause();
                    usePlayerStore.setState({ playing: false, countdown: null });
                    break;
                case 'POSITION_REPORT':
                    this.handlePositionReport(msg.payload.positionMs);
                    break;
                case 'AUDIO_REQUEST':
                    if (this.sessionManager.getIsLeader()) {
                        this.handleAudioRequest(msg.senderId, msg.payload.trackId);
                    }
                    break;
                case 'AUDIO_CHUNK_DONE':
                    console.log(`[SyncOrchestrator] Audio transfer complete for track: ${msg.payload.trackId}`);
                    break;
            }
        });
    }

    public broadcastTrackChange(trackId: string): void {
        if (!this.sessionManager.getIsLeader()) return;
        this.readyMembers.clear(); // Reset readiness for the new track

        const msg: Omit<P2PMessage, 'sequence'> = {
            type: 'TRACK_CHANGE',
            senderId: this.sessionManager['userId'],
            timestamp: performance.now(),
            sessionId: this.sessionManager.getSessionId()!,
            payload: { trackId }
        };
        this.sessionManager['transport']?.broadcast(msg as P2PMessage);
        console.log(`[SyncOrchestrator] Broadcasting TRACK_CHANGE: ${trackId}`);
    }

    /**
     * Notifica al líder que este miembro está listo para reproducir el track actual.
     */
    public sendReadySignal(): void {
        if (this.sessionManager.getIsLeader()) return;

        const msg: Omit<P2PMessage, 'sequence'> = {
            type: 'MEMBER_READY',
            senderId: this.sessionManager['userId'],
            timestamp: performance.now(),
            sessionId: this.sessionManager.getSessionId()!,
            payload: {}
        };
        this.sessionManager['transport']?.broadcast(msg as P2PMessage);
        console.log(`[SyncOrchestrator] Sent MEMBER_READY signal.`);
    }

    public async startGlobalPlayback(positionMs: number): Promise<void> {
        if (!this.sessionManager.getIsLeader()) return;

        const { pQueue, ci } = usePlayerStore.getState();
        const currentTrack = pQueue[ci];
        if (!currentTrack) return;

        // LEAD TIME DINÁMICO:
        // Si hay otros miembros pero ninguno reportó listo, esperamos 8s.
        // Si ya hay quórum o estamos solos, 4s es suficiente.
        const peerCount = this.sessionManager.getMembers().length - 1;
        const countdownSeconds = (peerCount > 0 && this.readyMembers.size === 0) ? 8 : 4;

        const bufferTimeMs = countdownSeconds * 1000;
        // Bug #1 fix: use Date.now() (wall clock) instead of performance.now()
        // performance.now() is relative to page load — different on each device.
        // Date.now() is Unix epoch wall clock — comparable across devices.
        const targetWallMs = Date.now() + bufferTimeMs;

        const playMsg: Omit<P2PMessage, 'sequence'> = {
            type: 'PLAY',
            senderId: this.sessionManager['userId'],
            timestamp: performance.now(),
            sessionId: this.sessionManager.getSessionId()!,
            payload: {
                targetWallMs,
                positionMs,
                trackId: currentTrack.id
            }
        };
        this.sessionManager['transport']?.broadcast(playMsg as P2PMessage);

        this.startLocalCountdown(countdownSeconds);
        this.startPositionReporting();

        // Leader dispatches to store just like followers do, so useAudio.ts
        // handles the scheduled play after the track is confirmed loaded.
        usePlayerStore.setState({
            scheduledPlay: {
                targetWallMs,
                positionMs,
                trackId: currentTrack.id
            }
        });
    }

    private startLocalCountdown(seconds: number): void {
        const { setCountdown, setPlaying } = usePlayerStore.getState();
        let remaining = seconds;

        setCountdown(remaining);

        const interval = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                clearInterval(interval);
                setCountdown(null);
                setPlaying(true);
            } else {
                setCountdown(remaining);
            }
        }, 1000);
    }

    public async handleRemotePlay(
        targetWallMs: number,
        audioPositionMs: number,
        trackId: string
    ): Promise<void> {
        if (this.sessionManager.getIsLeader()) return;

        const delayMs = targetWallMs - Date.now();

        // Solo mostrar cuenta regresiva si el tiempo es significativo
        if (delayMs > 500) {
            this.startLocalCountdown(Math.round(delayMs / 1000));
        }

        // Bug #2 fix: dispatch to store instead of calling audioEngine.playAt() directly.
        // The audio track may not be loaded yet — useAudio.ts consumes scheduledPlay
        // after the track finishes loading.
        usePlayerStore.setState({
            scheduledPlay: {
                targetWallMs,
                positionMs: audioPositionMs,
                trackId
            }
        });
    }

    private handleRemoteTrackChange(trackId: string): void {
        if (this.sessionManager.getIsLeader()) return;

        const { pQueue, setCi, setPQueue } = usePlayerStore.getState();
        let index = pQueue.findIndex(t => t.id === trackId);

        if (index !== -1) {
            setCi(index);
        } else {
            const catalogTrack = TRACKS.find((t: any) => t.id === trackId);
            if (catalogTrack) {
                const newQueue = [...pQueue, catalogTrack];
                setPQueue(newQueue);
                setCi(newQueue.length - 1);
            }
        }
    }

    public async handlePositionReport(leaderPosMs: number): Promise<void> {
        if (this.sessionManager.getIsLeader()) return;

        // @ts-ignore
        const isReady = (this.audioEngine as any).engine?.isReady;
        if (!isReady) return;

        const myPos = await this.audioEngine.getPosition();
        const diff = myPos - leaderPosMs;

        if (Math.abs(diff) > 600000) return;

        // Umbral relajado de 5ms -> 15ms para mayor estabilidad en redes reales
        if (Math.abs(diff) > 15 && Math.abs(diff) < 150) {
            const adjustment = diff > 0 ? 0.999 : 1.001;
            this.audioEngine.setPlaybackRate(adjustment);
        } else if (Math.abs(diff) >= 150) {
            this.audioEngine.seek(leaderPosMs);
            this.audioEngine.setPlaybackRate(1.0);
        } else {
            this.audioEngine.setPlaybackRate(1.0);
        }
    }

    private startPositionReporting(): void {
        if (this.reportInterval) clearInterval(this.reportInterval);

        // Bug #3 fix: report every 1000ms (1s) instead of 5000ms for tighter sync
        this.reportInterval = setInterval(async () => {
            if (!this.sessionManager.getIsLeader()) return;
            const pos = await this.audioEngine.getPosition();

            const report: Omit<P2PMessage, 'sequence'> = {
                type: 'POSITION_REPORT',
                senderId: this.sessionManager['userId'],
                timestamp: performance.now(),
                sessionId: this.sessionManager.getSessionId()!,
                payload: { positionMs: pos }
            };
            this.sessionManager['transport']?.broadcast(report as P2PMessage);
        }, 1000);
    }

    /**
     * Handles a follower's audio file request.
     * Reads the currently-loaded audio URL from the engine and streams it
     * in 64KB base64 chunks to the requesting peer.
     */
    private async handleAudioRequest(requesterId: string, trackId: string): Promise<void> {
        console.log(`[SyncOrchestrator] Follower ${requesterId} solicita audio de: ${trackId}`);

        const currentUrl = this.audioEngine.currentUrl;
        if (!currentUrl) {
            console.warn(`[SyncOrchestrator] No hay URL cargada en el engine para enviar.`);
            return;
        }

        try {
            const response = await fetch(currentUrl);
            const arrayBuffer = await response.arrayBuffer();

            const CHUNK_SIZE = 65536; // 64KB
            const totalChunks = Math.ceil(arrayBuffer.byteLength / CHUNK_SIZE);

            console.log(`[SyncOrchestrator] Enviando ${totalChunks} chunks (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)}MB) a ${requesterId}`);

            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, arrayBuffer.byteLength);
                const chunk = arrayBuffer.slice(start, end);

                const base64 = btoa(String.fromCharCode(...new Uint8Array(chunk)));

                const chunkMsg: Omit<P2PMessage, 'sequence'> = {
                    type: 'AUDIO_CHUNK',
                    senderId: this.sessionManager['userId'],
                    timestamp: performance.now(),
                    sessionId: this.sessionManager.getSessionId()!,
                    payload: {
                        trackId,
                        chunkIndex: i,
                        totalChunks,
                        data: base64
                    }
                };

                await this.sessionManager['transport']?.sendTo(requesterId, chunkMsg as P2PMessage);

                // Yield to event loop every 10 chunks to avoid blocking
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
            }

            const doneMsg: Omit<P2PMessage, 'sequence'> = {
                type: 'AUDIO_CHUNK_DONE',
                senderId: this.sessionManager['userId'],
                timestamp: performance.now(),
                sessionId: this.sessionManager.getSessionId()!,
                payload: { trackId, totalChunks }
            };
            await this.sessionManager['transport']?.sendTo(requesterId, doneMsg as P2PMessage);

            console.log(`[SyncOrchestrator] Transferencia completa a ${requesterId}`);
        } catch (err) {
            console.error(`[SyncOrchestrator] Error en handleAudioRequest:`, err);
        }
    }

    /**
     * Sends an audio file request to the leader.
     * The leader will respond with AUDIO_CHUNK messages followed by AUDIO_CHUNK_DONE.
     */
    public requestAudioFromLeader(trackId: string): void {
        if (this.sessionManager.getIsLeader()) return;

        const msg: Omit<P2PMessage, 'sequence'> = {
            type: 'AUDIO_REQUEST',
            senderId: this.sessionManager['userId'],
            timestamp: performance.now(),
            sessionId: this.sessionManager.getSessionId()!,
            payload: { trackId }
        };
        this.sessionManager['transport']?.broadcast(msg as P2PMessage);
        console.log(`[SyncOrchestrator] Solicitando audio de ${trackId} al líder.`);
    }

    public stop(): void {
        if (this.reportInterval) clearInterval(this.reportInterval);
        this.reportInterval = null;
    }
}
