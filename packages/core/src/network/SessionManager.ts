// packages/core/src/network/SessionManager.ts
import { IP2PTransport } from './P2PTransport';
import { ClockSyncService } from './clockSyncService';
import { YjsStore } from './crdt/YjsStore';
import { P2PMessage, P2PMessageType } from './types';
import { usePlayerStore } from '../store/usePlayerStore';

export interface SessionMember {
// ... (SessionMember interface remains the same)
    id: string;
    name: string;
    role: 'leader' | 'member';
    isConnected: boolean;
}

/**
 * SessionManager — Orchestrates P2P transport, clock synchronization, 
 * and collaborative state for a SyncEnsemble session.
 */
export class SessionManager {
    // ... (fields remain the same)
    private transport: IP2PTransport | null = null;
    private clockSync: ClockSyncService;
    private yjsStore: YjsStore;
    
    private sessionId: string | null = null;
    private userId: string = '';
    private isLeader: boolean = false;
    private members: Map<string, SessionMember> = new Map();

    constructor(clockSync: ClockSyncService, yjsStore: YjsStore) {
        this.clockSync = clockSync;
        this.yjsStore = yjsStore;
    }

    public async initialize(transport: IP2PTransport, userId: string): Promise<void> {
        this.transport = transport;
        this.userId = userId;

        this.transport.onMessage((msg: P2PMessage) => this.handleMessage(msg));
        this.transport.onPeersChange((peerIds: string[]) => this.handlePeersChange(peerIds));
    }

    public createSession(id: string, name: string): void {
        this.sessionId = id;
        this.isLeader = true;
        // @ts-ignore - joinRoom is implementation specific
        if (this.transport?.joinRoom) this.transport.joinRoom(id);
        this.yjsStore.connect(this.transport!, id, this.userId);
        
        // Update Store
        usePlayerStore.setState({ syncStatus: 'SYNCED', isLeader: true, sessionId: id });
        console.log(`[SessionManager] Session created: ${name} (${id})`);
    }

    public joinSession(id: string): void {
        this.sessionId = id;
        this.isLeader = false;
        // @ts-ignore - joinRoom is implementation specific
        if (this.transport?.joinRoom) this.transport.joinRoom(id);
        this.yjsStore.connect(this.transport!, id, this.userId);
        
        // Update Store
        usePlayerStore.setState({ syncStatus: 'CALIBRATING', isLeader: false, sessionId: id });
        
        // Start clock calibration with the leader
        this.startCalibration();
    }

    public leaveSession(): void {
        this.sessionId = null;
        this.isLeader = false;
        this.members.clear();
        this.yjsStore.destroy();
        usePlayerStore.setState({ syncStatus: 'UNCALIBRATED', sessionId: null, clockOffset: null });
        console.log('[SessionManager] Sesión finalizada.');
    }

    private handleMessage(msg: P2PMessage): void {
        // ... (handleMessage logic remains the same)
        // Track members from any message
        if (!this.members.has(msg.senderId)) {
            this.members.set(msg.senderId, {
                id: msg.senderId,
                name: `Peer ${msg.senderId.slice(-4)}`,
                role: 'member',
                isConnected: true
            });
        }

        switch (msg.type) {
            case 'CLOCK_PING':
                if (this.isLeader) this.handleClockPing(msg);
                break;
            case 'CLOCK_PONG':
                if (!this.isLeader) this.handleClockPong(msg);
                break;
            case 'PLAY':
            case 'PAUSE':
            case 'STOP':
            case 'SEEK':
                // Transport commands are handled by the AudioEngine via PlayerStore
                break;
        }
    }

    private handlePeersChange(peerIds: string[]): void {
        // ... (handlePeersChange logic remains the same)
        console.log('[SessionManager] Peers changed:', peerIds);
        
        // 1. Marcar todos como desconectados primero
        this.members.forEach(m => m.isConnected = false);

        // 2. Actualizar o agregar nuevos pares
        peerIds.forEach(id => {
            if (this.members.has(id)) {
                this.members.get(id)!.isConnected = true;
            } else {
                const names = ['Hendrix', 'Pastorius', 'Charly', 'Spinetta', 'Hancock', 'Coltrane', 'Bonham'];
                const randomName = names[Math.floor(Math.random() * names.length)];
                this.members.set(id, {
                    id,
                    name: `${randomName} (${id.slice(-4)})`,
                    role: 'member',
                    isConnected: true
                });
            }
        });
    }

    private handleClockPing(msg: P2PMessage): void {
        const t2 = performance.now();
        const t3 = performance.now();
        const pong: Omit<P2PMessage, 'sequence'> = {
            type: 'CLOCK_PONG',
            senderId: this.userId,
            timestamp: t3,
            sessionId: this.sessionId!,
            payload: {
                t1: msg.payload.t1,
                t2: t2,
                t3: t3
            }
        };
        this.transport!.sendTo(msg.senderId, pong as P2PMessage);
    }

    private handleClockPong(msg: P2PMessage): void {
        const { t1, t2, t3 } = msg.payload;
        this.clockSync.addSample(t1, t2, t3);
        
        // Push sync results to the store so the UI updates
        usePlayerStore.setState({ 
            syncStatus: this.clockSync.getStatus(),
            clockOffset: this.clockSync.getOffset()
        });
    }

    private startCalibration(): void {
        if (this.isLeader || !this.transport) return;

        const interval = setInterval(() => {
            // Stop if session was cleared
            if (!this.sessionId) {
                clearInterval(interval);
                return;
            }

            const ping: Omit<P2PMessage, 'sequence'> = {
                type: 'CLOCK_PING',
                senderId: this.userId,
                timestamp: performance.now(),
                sessionId: this.sessionId!,
                payload: { t1: performance.now() }
            };
            this.transport!.broadcast(ping as P2PMessage);
        }, 1000);
    }

    public getSessionId(): string | null { return this.sessionId; }
    public getIsLeader(): boolean { return this.isLeader; }
    public getMembers(): SessionMember[] { return Array.from(this.members.values()); }
    public getTransport(): IP2PTransport | null { return this.transport; }
    public getUserId(): string { return this.userId; }
}
