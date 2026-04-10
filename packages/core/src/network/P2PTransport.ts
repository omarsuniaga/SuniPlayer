// packages/core/src/network/P2PTransport.ts
import { P2PMessage } from './types';

/**
 * IP2PTransport — Low-level interface for multi-device data channels.
 * Implementations for Web (WebRTC) and Native (Nearby/Multipeer).
 */
export interface IP2PTransport {
    /** Sends a message to all connected peers in the mesh. */
    broadcast(message: P2PMessage): Promise<void>;
    
    /** Sends a message to a specific peer. */
    sendTo(peerId: string, message: P2PMessage): Promise<void>;

    /** Fired when a new message is received from any peer. */
    onMessage: (cb: (msg: P2PMessage) => void) => void;

    /** Fired when a peer connects or disconnects. */
    onPeersChange: (cb: (peerIds: string[]) => void) => void;

    /** Returns current connected peers in the transport channel. */
    getConnectedPeers(): string[];
}
