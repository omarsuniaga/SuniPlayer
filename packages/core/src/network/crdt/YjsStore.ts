// packages/core/src/network/crdt/YjsStore.ts
import * as Y from 'yjs';
import { IP2PTransport } from '../P2PTransport';
import { P2PMessage } from '../types';

/**
 * YjsStore — Manages collaborative state using Yjs CRDT.
 * Synchronizes annotations and shared markers across devices via P2P.
 */
export class YjsStore {
    public readonly doc: Y.Doc;
    private transport: IP2PTransport | null = null;
    private sessionId: string = '';
    private userId: string = '';

    constructor() {
        this.doc = new Y.Doc();
        
        // Listen for local updates and broadcast them
        this.doc.on('update', (update: Uint8Array, origin: any) => {
            // Only broadcast if the update was local (origin is null or this instance)
            if (origin !== this && this.transport && this.sessionId) {
                const message: Omit<P2PMessage, 'sequence'> = {
                    type: 'YJS_UPDATE',
                    senderId: this.userId,
                    timestamp: performance.now(),
                    sessionId: this.sessionId,
                    payload: Array.from(update) // Convert Uint8Array to Array for JSON serialization
                };
                this.transport.broadcast(message as P2PMessage);
            }
        });
    }

    /** Connects the store to a P2P transport for synchronization. */
    public connect(transport: IP2PTransport, sessionId: string, userId: string): void {
        this.transport = transport;
        this.sessionId = sessionId;
        this.userId = userId;

        // Handle incoming Yjs updates
        this.transport.onMessage((msg: P2PMessage) => {
            if (msg.type === 'YJS_UPDATE' && msg.senderId !== this.userId) {
                const update = new Uint8Array(msg.payload);
                Y.applyUpdate(this.doc, update, this); // 'this' as origin prevents echo
            }
        });
    }

    /** Gets a shared map by name (e.g. 'annotations' or 'markers'). */
    public getMap(name: string): Y.Map<any> {
        return this.doc.getMap(name);
    }

    /** Gets a shared array by name. */
    public getArray(name: string): Y.Array<any> {
        return this.doc.getArray(name);
    }

    public destroy(): void {
        this.doc.destroy();
        this.transport = null;
    }
}
