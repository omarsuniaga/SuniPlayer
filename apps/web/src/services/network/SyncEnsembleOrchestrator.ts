// apps/web/src/services/network/SyncEnsembleOrchestrator.ts
import {
    clockSyncService,
    SessionManager,
    SyncEnsembleOrchestrator as CoreOrchestrator,
    YjsStore,
    usePlayerStore,
    TRACKS
} from "@suniplayer/core";
import { BrowserAudioEngine } from "../../platform/browser/BrowserAudioEngine";
import { FirestoreTransport } from "./FirestoreTransport";
import { LanWebSocketTransport } from "./LanWebSocketTransport";
import { IP2PTransport } from "@suniplayer/core";

export type SyncTransportMode = 'cloud' | 'lan';

const LAN_SESSION_ID = 'LAN_SESSION';

/**
 * WebSyncEnsembleOrchestrator — Web-specific instantiation of the SyncEnsemble system.
 *
 * Supports two transport modes:
 *   - 'cloud': Firestore signaling + WebRTC (default, requires internet)
 *   - 'lan':   Direct WebSocket to a local relay server (no internet, 1–5ms latency)
 *
 * To use LAN mode:
 *   1. Leader runs `node lan-server.mjs` on their device
 *   2. Leader calls: await syncEnsemble.connectLan('localhost', true)
 *   3. Followers call: await syncEnsemble.connectLan('[leader-ip]', false)
 */
class WebSyncEnsembleOrchestrator {
    private static instance: WebSyncEnsembleOrchestrator;

    public readonly sessionManager: SessionManager;
    public readonly orchestrator: CoreOrchestrator;
    public readonly yjsStore: YjsStore;
    public readonly audioEngine: BrowserAudioEngine;

    // Active transport (swappable at runtime)
    private activeTransport: IP2PTransport;
    private userId: string = '';
    private transportMode: SyncTransportMode = 'cloud';

    /** Expose the current transport (FirestoreTransport for cloud, LanWebSocketTransport for lan) */
    public get transport(): IP2PTransport { return this.activeTransport; }
    public get mode(): SyncTransportMode { return this.transportMode; }

    private constructor() {
        this.audioEngine = new BrowserAudioEngine();
        this.yjsStore = new YjsStore();
        this.sessionManager = new SessionManager(clockSyncService, this.yjsStore);
        this.activeTransport = new FirestoreTransport();
        this.orchestrator = new CoreOrchestrator(this.audioEngine, this.sessionManager, clockSyncService);

        this.initialize();
    }

    public static getInstance(): WebSyncEnsembleOrchestrator {
        if (!WebSyncEnsembleOrchestrator.instance) {
            WebSyncEnsembleOrchestrator.instance = new WebSyncEnsembleOrchestrator();
        }
        return WebSyncEnsembleOrchestrator.instance;
    }

    private async initialize() {
        const state = usePlayerStore.getState();
        const { userId: savedUserId, setUserId } = state;

        this.userId = savedUserId || `web_${Math.random().toString(36).slice(2, 7)}`;
        if (!savedUserId) setUserId(this.userId);

        console.log(`[SyncEnsemble] Inicializando con identidad: ${this.userId}`);

        await (this.activeTransport as FirestoreTransport).initialize(this.userId);
        await this.sessionManager.initialize(this.activeTransport, this.userId);
        this.orchestrator.initialize();

        // Auto-resume cloud sessions only
        if (state.sessionId && state.sessionId !== LAN_SESSION_ID) {
            console.log(`[SyncEnsemble] Re-conectando a sesión: ${state.sessionId}`);
            if (state.isLeader) {
                this.sessionManager.createSession(state.sessionId, "Sesión Recuperada");
            } else {
                this.sessionManager.joinSession(state.sessionId);
            }
        }

        console.log(`[SyncEnsemble] Web Orchestrator listo.`);
    }

    // ── LAN Mode ──────────────────────────────────────────────────────────────

    /**
     * Switches to WebSocket relay transport (LAN or cloud).
     *
     * @param serverUrl  Full WebSocket URL, e.g.:
     *                   - LAN:   "ws://192.168.1.42:8765"
     *                   - Cloud: "wss://suniplayer-relay.fly.dev"
     * @param asLeader   true → creates the session; false → joins as follower
     * @param roomId     Session room ID. Defaults to LAN_SESSION_ID for LAN mode.
     *                   Use a unique code for cloud deployments to isolate ensembles.
     */
    public async connectLan(serverUrl: string, asLeader: boolean, roomId: string = LAN_SESSION_ID): Promise<void> {
        console.log(`[SyncEnsemble] Connecting to relay | url: ${serverUrl} | room: ${roomId} | role: ${asLeader ? 'leader' : 'follower'}`);

        const lanTransport = new LanWebSocketTransport();
        await lanTransport.connect(serverUrl, this.userId, roomId);

        // Swap transport in the SessionManager
        await this.sessionManager.initialize(lanTransport, this.userId);
        this.activeTransport = lanTransport;
        this.transportMode = 'lan';

        // Re-initialize orchestrator message listeners with new transport
        this.orchestrator.initialize();

        if (asLeader) {
            this.sessionManager.createSession(LAN_SESSION_ID, 'LAN Session');
            usePlayerStore.setState({ sessionId: LAN_SESSION_ID, isLeader: true });
        } else {
            this.sessionManager.joinSession(LAN_SESSION_ID);
            usePlayerStore.setState({ sessionId: LAN_SESSION_ID, isLeader: false });
        }

        console.log(`[SyncEnsemble] LAN transport active — all sync over local network`);
    }

    /**
     * Disconnects LAN transport and switches back to cloud (Firestore) mode.
     */
    public async disconnectLan(): Promise<void> {
        if (this.transportMode !== 'lan') return;

        (this.activeTransport as LanWebSocketTransport).disconnect();
        this.sessionManager.leaveSession();

        // Restore cloud transport
        const cloudTransport = new FirestoreTransport();
        await cloudTransport.initialize(this.userId);
        await this.sessionManager.initialize(cloudTransport, this.userId);
        this.activeTransport = cloudTransport;
        this.transportMode = 'cloud';

        this.orchestrator.initialize();
        console.log(`[SyncEnsemble] Switched back to cloud transport`);
    }
}

export const syncEnsemble = WebSyncEnsembleOrchestrator.getInstance();

declare global {
    interface Window {
        syncEnsemble: WebSyncEnsembleOrchestrator;
        TRACKS: typeof TRACKS;
    }
}

if (typeof window !== 'undefined') {
    window.syncEnsemble = syncEnsemble;
    window.TRACKS = TRACKS;
}
