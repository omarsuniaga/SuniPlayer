// apps/web/src/services/network/WebRTCTransport.ts
import Peer from 'simple-peer';
import { io, Socket } from 'socket.io-client';
import { IP2PTransport, P2PMessage } from '@suniplayer/core';

/**
 * WebRTCTransport — Implementation of IP2PTransport using simple-peer and socket.io for signaling.
 */
export class WebRTCTransport implements IP2PTransport {
    private peers: Map<string, Peer.Instance> = new Map();
    private socket: Socket | null = null;
    private currentRoom: string | null = null;
    
    private _onMessage: ((msg: P2PMessage) => void) | null = null;
    private _onPeersChange: ((peerIds: string[]) => void) | null = null;

    constructor() {
        // En desarrollo usamos el puerto 3001, en producción la URL que definas en Netlify
        const prodUrl = import.meta.env.VITE_SIGNALING_SERVER_URL;
        const SIGNALING_URL = prodUrl || `http://${window.location.hostname}:3001`;
        
        console.log(`[WebRTCTransport] Conectando a señalización en: ${SIGNALING_URL}`);
        
        this.socket = io(SIGNALING_URL, {
            transports: ['websocket', 'polling'] // Aseguramos compatibilidad
        });

        this.socket.on('new-peer', (peerId: string) => {
            console.log(`[WebRTCTransport] Nuevo par detectado en la sala: ${peerId}. Iniciando conexión...`);
            this.createPeer(peerId, true); // Nosotros iniciamos
        });

        this.socket.on('signal', ({ from, signal }: { from: string; signal: Peer.SignalData }) => {
            console.log(`[WebRTCTransport] Señal recibida de ${from}`);
            this.handleSignal(from, signal);
        });
    }

    public joinRoom(roomCode: string): void {
        this.currentRoom = roomCode;
        this.socket?.emit('join-room', roomCode);
    }

    private createPeer(peerId: string, initiator: boolean): Peer.Instance {
        const peer = new Peer({
            initiator,
            trickle: false,
        });

        peer.on('signal', (data: Peer.SignalData) => {
            this.socket?.emit('signal', {
                to: peerId,
                signal: data,
                roomCode: this.currentRoom
            });
        });

        peer.on('connect', () => {
            console.log(`[WebRTCTransport] ¡CONECTADO P2P con ${peerId}!`);
            this.peers.set(peerId, peer);
            this._onPeersChange?.(this.getConnectedPeers());
        });

        peer.on('data', (data: Buffer | string) => {
            if (this._onMessage) {
                const msg: P2PMessage = JSON.parse(data.toString());
                this._onMessage(msg);
            }
        });

        peer.on('close', () => {
            console.log(`[WebRTCTransport] Conexión cerrada con ${peerId}`);
            this.peers.delete(peerId);
            this._onPeersChange?.(this.getConnectedPeers());
        });

        peer.on('error', (err: Error) => console.error(`[WebRTCTransport] Error en par ${peerId}:`, err));

        return peer;
    }

    private handleSignal(peerId: string, signalData: Peer.SignalData): void {
        let peer = this.peers.get(peerId);
        if (!peer) {
            peer = this.createPeer(peerId, false); // No iniciamos, respondemos
        }
        peer.signal(signalData);
    }

    public async broadcast(message: P2PMessage): Promise<void> {
        const data = JSON.stringify(message);
        this.peers.forEach(peer => {
            if (peer.connected) peer.send(data);
        });
    }

    public async sendTo(peerId: string, message: P2PMessage): Promise<void> {
        const peer = this.peers.get(peerId);
        if (peer?.connected) peer.send(JSON.stringify(message));
    }

    public onMessage(cb: (msg: P2PMessage) => void): void { this._onMessage = cb; }
    public onPeersChange(cb: (peerIds: string[]) => void): void { this._onPeersChange = cb; }
    public getConnectedPeers(): string[] { return Array.from(this.peers.keys()); }
}
