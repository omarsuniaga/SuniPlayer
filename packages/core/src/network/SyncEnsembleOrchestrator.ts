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
                        console.log(`[SYNC:FOLLOWER→] Requesting audio from leader | track: ${msg.payload.trackId}`);
                        this.handleAudioRequest(msg.senderId, msg.payload.trackId);
                    }
                    break;
                case 'AUDIO_URL':
                    if (!this.sessionManager.getIsLeader()) {
                        this.handleRemoteAudioUrl(msg.payload.trackId, msg.payload.url);
                    }
                    break;
            }
        });
    }

    public broadcastTrackChange(trackId: string): void {
        if (!this.sessionManager.getIsLeader()) return;
        this.readyMembers.clear(); // Reset readiness for the new track

        console.log(`[SYNC:LEADER→] Broadcasting TRACK_CHANGE | track: ${trackId}`);

        const msg: Omit<P2PMessage, 'sequence'> = {
            type: 'TRACK_CHANGE',
            senderId: this.sessionManager['userId'],
            timestamp: performance.now(),
            sessionId: this.sessionManager.getSessionId()!,
            payload: { trackId }
        };
        this.sessionManager['transport']?.broadcast(msg as P2PMessage);
    }

    /**
     * Notifica al líder que este miembro está listo para reproducir el track actual.
     */
    public sendReadySignal(): void {
        if (this.sessionManager.getIsLeader()) return;

        console.log(`[SYNC:FOLLOWER→] Sending MEMBER_READY to leader`);

        const msg: Omit<P2PMessage, 'sequence'> = {
            type: 'MEMBER_READY',
            senderId: this.sessionManager['userId'],
            timestamp: performance.now(),
            sessionId: this.sessionManager.getSessionId()!,
            payload: {}
        };
        this.sessionManager['transport']?.broadcast(msg as P2PMessage);
    }

    public async startGlobalPlayback(positionMs: number): Promise<void> {
        if (!this.sessionManager.getIsLeader()) return;

        const { pQueue, ci } = usePlayerStore.getState();
        const currentTrack = pQueue[ci];
        if (!currentTrack) return;

        // LEAD TIME DINÁMICO:
        // Si hay otros miembros pero ninguno reportó listo, esperamos 8s.
        // Si ya hay quórum o estamos solos, 4s es suficiente.
        const peerCount = this.sessionManager.getMembers().length;
        const countdownSeconds = (peerCount > 0 && this.readyMembers.size === 0) ? 8 : 4;

        const bufferTimeMs = countdownSeconds * 1000;
        // Bug #1 fix: use Date.now() (wall clock) instead of performance.now()
        // performance.now() is relative to page load — different on each device.
        // Date.now() is Unix epoch wall clock — comparable across devices.
        const targetWallMs = Date.now() + bufferTimeMs;

        console.log(`[SYNC:LEADER→] Broadcasting PLAY | track: ${currentTrack.id} | targetWallMs: ${targetWallMs} | countdown: ${countdownSeconds}s | peers: ${peerCount}`);

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

        console.log(`[SYNC:FOLLOWER←] PLAY received | track: ${trackId} | delayMs: ${delayMs.toFixed(0)}ms | targetWallMs: ${targetWallMs}`);

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

        console.log(`[SYNC:FOLLOWER] scheduledPlay SET | will execute in ${Math.max(0, delayMs).toFixed(0)}ms`);
    }

    private handleRemoteTrackChange(trackId: string): void {
        if (this.sessionManager.getIsLeader()) return;

        console.log(`[SYNC:FOLLOWER←] TRACK_CHANGE received | trackId: ${trackId}`);

        const { pQueue, setCi, setPQueue } = usePlayerStore.getState();
        let index = pQueue.findIndex(t => t.id === trackId);

        if (index !== -1) {
            setCi(index);
            console.log(`[SYNC:FOLLOWER] ci updated to index: ${index} | track: ${trackId}`);
        } else {
            const catalogTrack = TRACKS.find((t: any) => t.id === trackId);
            if (catalogTrack) {
                const newQueue = [...pQueue, catalogTrack];
                setPQueue(newQueue);
                setCi(newQueue.length - 1);
                console.log(`[SYNC:FOLLOWER] ci updated to index: ${newQueue.length - 1} | track: ${trackId}`);
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
            console.log(`[SYNC:FOLLOWER] Drift detected: ${diff.toFixed(1)}ms | adjusting playback rate`);
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
     * Uploads the audio to Firebase Storage once, then sends the download URL
     * as a single AUDIO_URL message — avoids DataChannel overflow from chunk transfer.
     */
    private async handleAudioRequest(requesterId: string, trackId: string): Promise<void> {
        console.log(`[SYNC:LEADER→] Audio request received | from: ${requesterId} | track: ${trackId}`);

        const currentUrl = this.audioEngine.currentUrl;
        if (!currentUrl) {
            console.warn(`[SYNC:LEADER] No audio URL loaded in engine — cannot fulfill request`);
            return;
        }

        try {
            const sessionId = this.sessionManager.getSessionId()!;

            // Upload to Firebase Storage (transport-specific — uses @ts-ignore like joinRoom does)
            // @ts-ignore — uploadAudioForSession is defined in FirestoreTransport
            const downloadUrl: string = await this.sessionManager['transport']?.uploadAudioForSession(
                sessionId,
                trackId,
                currentUrl
            );

            if (!downloadUrl) {
                console.error(`[SYNC:LEADER] Upload returned no URL — aborting`);
                return;
            }

            // Broadcast the URL (tiny message, reliable over DataChannel)
            const urlMsg: Omit<P2PMessage, 'sequence'> = {
                type: 'AUDIO_URL',
                senderId: this.sessionManager['userId'],
                timestamp: performance.now(),
                sessionId,
                payload: { trackId, url: downloadUrl }
            };
            await this.sessionManager['transport']?.sendTo(requesterId, urlMsg as P2PMessage);
            console.log(`[SYNC:LEADER→] AUDIO_URL sent to ${requesterId} | track: ${trackId}`);

        } catch (err) {
            console.error(`[SYNC:LEADER] Error in handleAudioRequest:`, err);
        }
    }

    private handleRemoteAudioUrl(trackId: string, url: string): void {
        console.log(`[SYNC:FOLLOWER←] AUDIO_URL received | track: ${trackId} | downloading from CDN...`);

        const { pQueue, setPQueue } = usePlayerStore.getState();
        const updatedQueue = pQueue.map(t =>
            t.id === trackId ? { ...t, blob_url: url } : t
        );
        setPQueue(updatedQueue);

        console.log(`[SYNC:FOLLOWER] Track ${trackId} injected with Storage URL — useAudio will reload`);
    }

    /**
     * Sends an audio file request to the leader.
     * The leader will respond with an AUDIO_URL message pointing to Firebase Storage.
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
