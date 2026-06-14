// apps/web/src/services/network/LanWebSocketTransport.ts
import { IP2PTransport } from '@suniplayer/core';
import { P2PMessage } from '@suniplayer/core';

/**
 * LanWebSocketTransport — IP2PTransport implementation for local-network sync.
 *
 * Connects to a LAN relay server (lan-server.mjs) running on the leader's device.
 * No internet required. Latency: 1–5ms on WiFi (vs 50–300ms over Firestore/cloud).
 *
 * Usage:
 *   const transport = new LanWebSocketTransport();
 *   await transport.connect('192.168.1.42', 'user-xyz', 8765);
 *
 * Wire protocol is handled internally — callers use the standard IP2PTransport API.
 */
export class LanWebSocketTransport implements IP2PTransport {
    private ws: WebSocket | null = null;
    private userId: string = '';
    private roomId: string = '';
    private connectedPeers: string[] = [];

    private _messageListeners: ((msg: P2PMessage) => void)[] = [];
    private _onPeersChange: ((peerIds: string[]) => void) | null = null;

    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private serverUrl: string = '';
    private intentionallyClosed: boolean = false;

    /** Sequence counter — matches P2PMessage.sequence field */
    private seq: number = 0;

    // ── Connection ────────────────────────────────────────────────────────────

    /**
     * Connects to the relay server (LAN or cloud).
     * @param serverUrl Full WebSocket URL — e.g. "ws://192.168.1.42:8765" or "wss://suniplayer-relay.fly.dev"
     * @param userId    This device's unique ID
     * @param roomId    Session/room ID — isolates this ensemble from others on the same server
     */
    public connect(serverUrl: string, userId: string, roomId: string): Promise<void> {
        this.userId = userId;
        this.roomId = roomId;
        this.serverUrl = serverUrl;
        this.intentionallyClosed = false;
        return this.openSocket();
    }

    private openSocket(): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(`[LanTransport] Connecting to ${this.serverUrl} as ${this.userId}`);
            this.ws = new WebSocket(this.serverUrl);

            const timeout = setTimeout(() => {
                reject(new Error(`[LanTransport] Connection timeout (${this.serverUrl})`));
                this.ws?.close();
            }, 8000);

            this.ws.onopen = () => {
                clearTimeout(timeout);
                console.log(`[LanTransport] ✅ Connected to relay`);
                this.identify();
                resolve();
            };

            this.ws.onerror = (ev) => {
                clearTimeout(timeout);
                console.error('[LanTransport] WebSocket error:', ev);
                reject(new Error('[LanTransport] Connection failed'));
            };

            this.ws.onmessage = (ev) => {
                this.handleEnvelope(ev.data);
            };

            this.ws.onclose = () => {
                this.connectedPeers = [];
                this._onPeersChange?.([]);
                if (!this.intentionallyClosed) {
                    console.warn('[LanTransport] Disconnected — retrying in 3s…');
                    this.reconnectTimer = setTimeout(() => this.openSocket().catch(() => {}), 3000);
                }
            };
        });
    }

    private identify(): void {
        this.send({ type: 'IDENTIFY', userId: this.userId, roomId: this.roomId });
    }

    public disconnect(): void {
        this.intentionallyClosed = true;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.ws?.close();
        this.ws = null;
        this.connectedPeers = [];
    }

    // ── Message handling ──────────────────────────────────────────────────────

    private handleEnvelope(raw: string): void {
        let envelope: any;
        try { envelope = JSON.parse(raw); }
        catch (e) { console.error('[LanTransport] Parse error:', e); return; }

        switch (envelope.type) {
            case 'MESSAGE':
                this._messageListeners.forEach(cb => cb(envelope.message as P2PMessage));
                break;

            case 'PEERS':
                this.connectedPeers = (envelope.peerIds as string[]).filter(id => id !== this.userId);
                this._onPeersChange?.(this.connectedPeers);
                console.log(`[LanTransport] Peers updated: [${this.connectedPeers.join(', ')}]`);
                break;

            default:
                console.warn('[LanTransport] Unknown envelope type:', envelope.type);
        }
    }

    private send(envelope: object): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(envelope));
        } else {
            console.warn('[LanTransport] send() called but socket is not open');
        }
    }

    // ── IP2PTransport API ─────────────────────────────────────────────────────

    public async broadcast(message: P2PMessage): Promise<void> {
        const msg = { ...message, sequence: this.seq++ };
        this.send({ type: 'BROADCAST', message: msg });
    }

    public async sendTo(peerId: string, message: P2PMessage): Promise<void> {
        const msg = { ...message, sequence: this.seq++ };
        this.send({ type: 'SEND_TO', to: peerId, message: msg });
    }

    public onMessage(cb: (msg: P2PMessage) => void): void {
        this._messageListeners.push(cb);
    }

    public onPeersChange(cb: (peerIds: string[]) => void): void {
        this._onPeersChange = cb;
    }

    public getConnectedPeers(): string[] {
        return [...this.connectedPeers];
    }
}
