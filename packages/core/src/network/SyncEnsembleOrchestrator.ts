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
 *
 * Optimizations (v2):
 * 1. Wall-clock timestamps in POSITION_REPORT → followers compensate for network latency
 * 2. Graduated drift correction (0.999 → 0.998 → 0.995 based on diff magnitude)
 * 3. Quorum-based countdown with fallback timeout for N-device sync
 * 4. Position reporting at 500ms intervals (was 1000ms)
 * 5. Peer disconnection detection via lastSeen heartbeat map
 * 6. Proper public API usage (getTransport(), getUserId()) — no more bracket hacks
 */
export class SyncEnsembleOrchestrator {
    private audioEngine: IAudioEngine;
    private sessionManager: SessionManager;
    private clockSync: ClockSyncService;

    private lastReportedLeaderPos: number = 0;
    private reportInterval: ReturnType<typeof setInterval> | null = null;
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    /** Members that have sent MEMBER_READY for the current track */
    private readyMembers: Set<string> = new Set();

    /** Wall-clock timestamp of last message received from each peer */
    private lastSeen: Map<string, number> = new Map();

    /** Timeout used for quorum fallback when not all peers respond */
    private quorumTimeout: ReturnType<typeof setTimeout> | null = null;

    /** How long to wait for all members before starting with partial quorum (ms) */
    private static readonly QUORUM_WAIT_MS = 6000;

    /** Peer is considered disconnected if silent for this long (ms) */
    private static readonly PEER_TIMEOUT_MS = 8000;

    /** Position report interval in ms */
    private static readonly REPORT_INTERVAL_MS = 500;

    constructor(audioEngine: IAudioEngine, sessionManager: SessionManager, clockSync: ClockSyncService) {
        this.audioEngine = audioEngine;
        this.sessionManager = sessionManager;
        this.clockSync = clockSync;
    }

    public initialize(): void {
        this.sessionManager.getTransport()?.onMessage((msg: P2PMessage) => {
            // Track last-seen for disconnection detection
            this.lastSeen.set(msg.senderId, Date.now());

            switch (msg.type) {
                case 'TRACK_CHANGE':
                    this.handleRemoteTrackChange(msg.payload.trackId);
                    break;

                case 'MEMBER_READY':
                    if (this.sessionManager.getIsLeader()) {
                        this.readyMembers.add(msg.senderId);
                        console.log(`[SyncOrchestrator] Member ready: ${msg.senderId}. Ready: ${this.readyMembers.size}/${this.getActivePeerCount()}`);
                        this.checkQuorum();
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
                    // v2: payload now includes sentAtWall for latency compensation
                    this.handlePositionReport(msg.payload.positionMs, msg.payload.sentAtWall);
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

        // Start peer heartbeat monitor
        this.startHeartbeatMonitor();
    }

    // ─── TRACK CHANGE ─────────────────────────────────────────────────────────

    public broadcastTrackChange(trackId: string): void {
        if (!this.sessionManager.getIsLeader()) return;
        this.readyMembers.clear();
        this.clearQuorumTimeout();

        console.log(`[SYNC:LEADER→] Broadcasting TRACK_CHANGE | track: ${trackId}`);

        const msg: Omit<P2PMessage, 'sequence'> = {
            type: 'TRACK_CHANGE',
            senderId: this.sessionManager.getUserId(),
            timestamp: performance.now(),
            sessionId: this.sessionManager.getSessionId()!,
            payload: { trackId }
        };
        this.sessionManager.getTransport()?.broadcast(msg as P2PMessage);
    }

    // ─── MEMBER READY / QUORUM ────────────────────────────────────────────────

    /**
     * Notifies the leader that this follower is ready to play the current track.
     */
    public sendReadySignal(): void {
        if (this.sessionManager.getIsLeader()) return;

        console.log(`[SYNC:FOLLOWER→] Sending MEMBER_READY to leader`);

        const msg: Omit<P2PMessage, 'sequence'> = {
            type: 'MEMBER_READY',
            senderId: this.sessionManager.getUserId(),
            timestamp: performance.now(),
            sessionId: this.sessionManager.getSessionId()!,
            payload: {}
        };
        this.sessionManager.getTransport()?.broadcast(msg as P2PMessage);
    }

    /**
     * Called each time a new MEMBER_READY arrives.
     * If all active peers are ready, triggers playback immediately.
     * Otherwise relies on the quorum timeout set in startGlobalPlayback.
     */
    private checkQuorum(): void {
        const activePeers = this.getActivePeerCount();
        if (activePeers === 0) return;
        if (this.readyMembers.size >= activePeers) {
            console.log(`[SYNC:LEADER] Full quorum reached (${this.readyMembers.size}/${activePeers}) — starting playback now`);
            this.clearQuorumTimeout();
            this.triggerCountdownPlayback(3); // Tight 3s window — all members are ready
        }
    }

    private clearQuorumTimeout(): void {
        if (this.quorumTimeout) {
            clearTimeout(this.quorumTimeout);
            this.quorumTimeout = null;
        }
    }

    /** Number of active (non-disconnected) peers excluding the leader itself */
    private getActivePeerCount(): number {
        return this.sessionManager.getMembers().filter(m => m.isConnected).length;
    }

    // ─── PLAYBACK ─────────────────────────────────────────────────────────────

    public async startGlobalPlayback(positionMs: number): Promise<void> {
        if (!this.sessionManager.getIsLeader()) return;

        const { pQueue, ci } = usePlayerStore.getState();
        const currentTrack = pQueue[ci];
        if (!currentTrack) return;

        const activePeers = this.getActivePeerCount();

        if (activePeers === 0) {
            // Solo — no coordination needed, just start with a short buffer
            console.log(`[SYNC:LEADER] No peers — starting solo with 2s buffer`);
            this.triggerCountdownPlayback(2, positionMs, currentTrack.id);
            return;
        }

        // With peers: set quorum timeout. If all members respond via MEMBER_READY,
        // checkQuorum() will fire early. Otherwise, we start after QUORUM_WAIT_MS.
        console.log(`[SYNC:LEADER] Waiting for quorum | peers: ${activePeers} | timeout: ${SyncEnsembleOrchestrator.QUORUM_WAIT_MS}ms`);

        this.quorumTimeout = setTimeout(() => {
            const ready = this.readyMembers.size;
            console.log(`[SYNC:LEADER] Quorum timeout — ${ready}/${activePeers} ready. Starting anyway.`);
            this.triggerCountdownPlayback(4, positionMs, currentTrack.id);
        }, SyncEnsembleOrchestrator.QUORUM_WAIT_MS);

        // Also broadcast TRACK_CHANGE so followers start loading
        this.broadcastTrackChange(currentTrack.id);
    }

    /**
     * Core dispatch: sets targetWallMs, broadcasts PLAY, starts local countdown.
     */
    private triggerCountdownPlayback(
        countdownSeconds: number,
        positionMs?: number,
        trackId?: string
    ): void {
        const { pQueue, ci } = usePlayerStore.getState();
        const currentTrack = pQueue[ci];
        if (!currentTrack) return;

        const resolvedTrackId = trackId ?? currentTrack.id;
        const resolvedPositionMs = positionMs ?? 0;
        const targetWallMs = Date.now() + countdownSeconds * 1000;

        console.log(`[SYNC:LEADER→] Broadcasting PLAY | track: ${resolvedTrackId} | countdown: ${countdownSeconds}s | targetWallMs: ${targetWallMs}`);

        const playMsg: Omit<P2PMessage, 'sequence'> = {
            type: 'PLAY',
            senderId: this.sessionManager.getUserId(),
            timestamp: performance.now(),
            sessionId: this.sessionManager.getSessionId()!,
            payload: {
                targetWallMs,
                positionMs: resolvedPositionMs,
                trackId: resolvedTrackId
            }
        };
        this.sessionManager.getTransport()?.broadcast(playMsg as P2PMessage);

        this.startLocalCountdown(countdownSeconds);
        this.startPositionReporting();

        usePlayerStore.setState({
            scheduledPlay: {
                targetWallMs,
                positionMs: resolvedPositionMs,
                trackId: resolvedTrackId
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
        console.log(`[SYNC:FOLLOWER←] PLAY received | track: ${trackId} | delayMs: ${delayMs.toFixed(0)}ms`);

        if (delayMs > 500) {
            this.startLocalCountdown(Math.round(delayMs / 1000));
        }

        usePlayerStore.setState({
            scheduledPlay: {
                targetWallMs,
                positionMs: audioPositionMs,
                trackId
            }
        });

        console.log(`[SYNC:FOLLOWER] scheduledPlay SET | will execute in ${Math.max(0, delayMs).toFixed(0)}ms`);
    }

    // ─── TRACK CHANGE (FOLLOWER) ──────────────────────────────────────────────

    private handleRemoteTrackChange(trackId: string): void {
        if (this.sessionManager.getIsLeader()) return;

        console.log(`[SYNC:FOLLOWER←] TRACK_CHANGE received | trackId: ${trackId}`);

        const { pQueue, setCi, setPQueue } = usePlayerStore.getState();
        const index = pQueue.findIndex(t => t.id === trackId);

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

    // ─── POSITION SYNC ────────────────────────────────────────────────────────

    /**
     * v2: Receives leader position + wall-clock send time.
     * Compensates for network latency: effectivePos = leaderPos + (now - sentAtWall).
     * Uses graduated drift correction for smoother audio.
     */
    public async handlePositionReport(leaderPosMs: number, sentAtWall?: number): Promise<void> {
        if (this.sessionManager.getIsLeader()) return;

        // @ts-ignore
        const isReady = (this.audioEngine as any).engine?.isReady;
        if (!isReady) return;

        // Compensate for network latency using wall-clock timestamp
        const networkLatencyMs = sentAtWall ? Math.max(0, Date.now() - sentAtWall) : 0;
        const effectiveLeaderPos = leaderPosMs + networkLatencyMs;

        const myPos = await this.audioEngine.getPosition();
        const diff = myPos - effectiveLeaderPos; // positive = we're ahead

        // Ignore absurd diffs (track not loaded, unit mismatch, etc.)
        if (Math.abs(diff) > 600000) return;

        if (Math.abs(diff) <= 15) {
            // In sync — reset rate
            this.audioEngine.setPlaybackRate(1.0);
        } else if (Math.abs(diff) < 50) {
            // Small drift (15–50ms): gentle nudge
            const rate = diff > 0 ? 0.999 : 1.001;
            console.log(`[SYNC:FOLLOWER] Drift ${diff.toFixed(1)}ms → rate ${rate}`);
            this.audioEngine.setPlaybackRate(rate);
        } else if (Math.abs(diff) < 150) {
            // Medium drift (50–150ms): stronger correction
            const rate = diff > 0 ? 0.998 : 1.002;
            console.log(`[SYNC:FOLLOWER] Drift ${diff.toFixed(1)}ms → rate ${rate}`);
            this.audioEngine.setPlaybackRate(rate);
        } else {
            // Large drift (≥150ms): hard seek, reset rate
            console.warn(`[SYNC:FOLLOWER] Hard seek: diff=${diff.toFixed(1)}ms | effectiveLeaderPos=${effectiveLeaderPos.toFixed(0)}ms`);
            this.audioEngine.seek(effectiveLeaderPos);
            this.audioEngine.setPlaybackRate(1.0);
        }
    }

    private startPositionReporting(): void {
        if (this.reportInterval) clearInterval(this.reportInterval);

        this.reportInterval = setInterval(async () => {
            if (!this.sessionManager.getIsLeader()) return;
            const pos = await this.audioEngine.getPosition();

            const report: Omit<P2PMessage, 'sequence'> = {
                type: 'POSITION_REPORT',
                senderId: this.sessionManager.getUserId(),
                timestamp: performance.now(),
                sessionId: this.sessionManager.getSessionId()!,
                payload: {
                    positionMs: pos,
                    sentAtWall: Date.now() // v2: followers use this to compensate latency
                }
            };
            this.sessionManager.getTransport()?.broadcast(report as P2PMessage);
        }, SyncEnsembleOrchestrator.REPORT_INTERVAL_MS);
    }

    // ─── PEER DISCONNECTION DETECTION ─────────────────────────────────────────

    /**
     * Monitors lastSeen map. If a peer hasn't sent any message within PEER_TIMEOUT_MS,
     * it's considered disconnected and removed from readyMembers (so quorum recalculates).
     */
    private startHeartbeatMonitor(): void {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

        this.heartbeatInterval = setInterval(() => {
            const now = Date.now();
            this.lastSeen.forEach((lastMs, peerId) => {
                if (now - lastMs > SyncEnsembleOrchestrator.PEER_TIMEOUT_MS) {
                    console.warn(`[SyncOrchestrator] Peer ${peerId} timed out — last seen ${(now - lastMs) / 1000}s ago`);
                    this.lastSeen.delete(peerId);
                    this.readyMembers.delete(peerId);
                }
            });
        }, 2000);
    }

    // ─── AUDIO FILE TRANSFER ──────────────────────────────────────────────────

    /**
     * Handles a follower's audio file request.
     * Uploads audio to Firebase Storage once, then sends the download URL.
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
            const transport = this.sessionManager.getTransport();

            // @ts-ignore — uploadAudioForSession is defined in FirestoreTransport
            const downloadUrl: string = await transport?.uploadAudioForSession(
                sessionId,
                trackId,
                currentUrl
            );

            if (!downloadUrl) {
                console.error(`[SYNC:LEADER] Upload returned no URL — aborting`);
                return;
            }

            const urlMsg: Omit<P2PMessage, 'sequence'> = {
                type: 'AUDIO_URL',
                senderId: this.sessionManager.getUserId(),
                timestamp: performance.now(),
                sessionId,
                payload: { trackId, url: downloadUrl }
            };
            await transport?.sendTo(requesterId, urlMsg as P2PMessage);
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
     */
    public requestAudioFromLeader(trackId: string): void {
        if (this.sessionManager.getIsLeader()) return;

        const msg: Omit<P2PMessage, 'sequence'> = {
            type: 'AUDIO_REQUEST',
            senderId: this.sessionManager.getUserId(),
            timestamp: performance.now(),
            sessionId: this.sessionManager.getSessionId()!,
            payload: { trackId }
        };
        this.sessionManager.getTransport()?.broadcast(msg as P2PMessage);
        console.log(`[SyncOrchestrator] Solicitando audio de ${trackId} al líder.`);
    }

    // ─── CLEANUP ──────────────────────────────────────────────────────────────

    public stop(): void {
        if (this.reportInterval) clearInterval(this.reportInterval);
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.clearQuorumTimeout();
        this.reportInterval = null;
        this.heartbeatInterval = null;
        this.lastSeen.clear();
        this.readyMembers.clear();
    }
}
