// apps/web/src/services/network/SyncEnsembleOrchestrator.ts (Refactored)
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

/**
 * WebSyncEnsembleOrchestrator — Web-specific instantiation of the SyncEnsemble system.
 */
class WebSyncEnsembleOrchestrator {
    private static instance: WebSyncEnsembleOrchestrator;
    
    public readonly transport: FirestoreTransport;
    public readonly sessionManager: SessionManager;
    public readonly orchestrator: CoreOrchestrator;
    public readonly yjsStore: YjsStore;
    public readonly audioEngine: BrowserAudioEngine;

    private constructor() {
        this.audioEngine = new BrowserAudioEngine();
        this.yjsStore = new YjsStore();
        this.sessionManager = new SessionManager(clockSyncService, this.yjsStore);
        this.transport = new FirestoreTransport();
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
        
        // 1. Identidad fija para persistencia
        const userId = savedUserId || `web_${Math.random().toString(36).slice(2, 7)}`;
        if (!savedUserId) setUserId(userId);
        
        console.log(`[SyncEnsemble] Inicializando con identidad: ${userId}`);
        
        await this.transport.initialize(userId);
        await this.sessionManager.initialize(this.transport, userId);
        this.orchestrator.initialize();
        
        // --- AUTO-RESUME LOGIC ---
        if (state.sessionId) {
            console.log(`[SyncEnsemble] Re-conectando a sesión: ${state.sessionId} (Rol: ${state.isLeader ? 'Líder' : 'Seguidor'})`);
            
            if (state.isLeader) {
                // Si éramos líderes, volvemos a tomar el mando
                this.sessionManager.createSession(state.sessionId, "Sesión Recuperada");
            } else {
                // Si éramos seguidores, nos unimos de nuevo
                this.sessionManager.joinSession(state.sessionId);
            }
        }
        
        console.log(`[SyncEnsemble] Web Orchestrator listo.`);
    }
}

export const syncEnsemble = WebSyncEnsembleOrchestrator.getInstance();

declare global {
    interface Window {
        syncEnsemble: WebSyncEnsembleOrchestrator;
        TRACKS: typeof TRACKS;
    }
}

// Expose for E2E testing
if (typeof window !== 'undefined') {
    window.syncEnsemble = syncEnsemble;
    window.TRACKS = TRACKS;
}
