// apps/web/src/services/network/FirestoreTransport.ts
import Peer from 'simple-peer';
import { db } from './firebaseConfig';
import { 
    collection, 
    doc, 
    setDoc, 
    onSnapshot, 
    addDoc, 
    query, 
    where, 
    deleteDoc, 
    serverTimestamp,
    QuerySnapshot,
    DocumentData,
    DocumentChange
} from "firebase/firestore";
import { IP2PTransport, P2PMessage } from '@suniplayer/core';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from './firebaseConfig';

interface ExtendedPeer extends Peer.Instance {
    connected: boolean;
}

/**
 * FirestoreTransport — Implementation of IP2PTransport using Firebase Firestore for signaling.
 */
export class FirestoreTransport implements IP2PTransport {
    private peers: Map<string, ExtendedPeer> = new Map();
    private currentRoom: string | null = null;
    private userId: string = '';
    
    private _messageListeners: ((msg: P2PMessage) => void)[] = [];
    private _onPeersChange: ((peerIds: string[]) => void) | null = null;

    private unsubscribeRoom: (() => void) | null = null;
    private unsubscribeSignals: (() => void) | null = null;

    constructor() {
        console.log('[FirestoreTransport] Inicializado.');
    }

    public async initialize(userId: string): Promise<void> {
        this.userId = userId;
    }

    public async joinRoom(roomCode: string): Promise<void> {
        this.currentRoom = roomCode.toUpperCase();
        console.log(`[FirestoreTransport] Entrando a sala: ${this.currentRoom} como ${this.userId}`);

        if (this.unsubscribeRoom) this.unsubscribeRoom();
        if (this.unsubscribeSignals) this.unsubscribeSignals();

        const myMemberRef = doc(db, 'rooms', this.currentRoom, 'members', this.userId);
        await setDoc(myMemberRef, {
            id: this.userId,
            lastSeen: serverTimestamp()
        });

        const membersRef = collection(db, 'rooms', this.currentRoom, 'members');
        this.unsubscribeRoom = onSnapshot(membersRef, (snapshot: QuerySnapshot<DocumentData>) => {
            const peerIds = snapshot.docs.map(doc => doc.id).filter(id => id !== this.userId);
            this._onPeersChange?.(peerIds);

            snapshot.docChanges().forEach((change: DocumentChange<DocumentData>) => {
                if (change.type === 'added' && change.doc.id !== this.userId) {
                    const peerId = change.doc.id;
                    if (this.userId > peerId) {
                        console.log(`[FirestoreTransport] Soy el iniciador para ${peerId}. Mandando Oferta...`);
                        this.createPeer(peerId, true);
                    }
                }
            });
        });

        const signalsRef = collection(db, 'rooms', this.currentRoom, 'signals');
        const q = query(signalsRef, where('to', '==', this.userId));
        this.unsubscribeSignals = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
            snapshot.docChanges().forEach(async (change: DocumentChange<DocumentData>) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    this.handleSignal(data.from, data.signal);
                    await deleteDoc(change.doc.ref);
                }
            });
        });
    }

    private createPeer(peerId: string, initiator: boolean): Peer.Instance {
        if (this.peers.has(peerId)) {
            const existing = this.peers.get(peerId)!;
            if (existing.connected) return existing;
        }

        const peer = new Peer({
            initiator,
            trickle: false,
            config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
        }) as ExtendedPeer;

        peer.on('signal', async (signal) => {
            const signalsRef = collection(db, 'rooms', this.currentRoom!, 'signals');
            await addDoc(signalsRef, {
                from: this.userId,
                to: peerId,
                signal: signal,
                createdAt: serverTimestamp()
            });
        });

        peer.on('connect', () => {
            console.log(`[FirestoreTransport] ✅ ¡P2P CONECTADO con ${peerId}!`);
            this.peers.set(peerId, peer);
            this._onPeersChange?.(this.getConnectedPeers());
        });

        peer.on('data', (data) => {
            try {
                const msg: P2PMessage = JSON.parse(data.toString());
                this._messageListeners.forEach(listener => listener(msg));
            } catch (e) {
                console.error("[FirestoreTransport] Error parseando mensaje P2P:", e);
            }
        });

        peer.on('close', () => {
            this.peers.delete(peerId);
            this._onPeersChange?.(this.getConnectedPeers());
        });

        peer.on('error', (err) => {
            console.error(`[FirestoreTransport] Error Peer (${peerId}):`, err.message);
            this.peers.delete(peerId);
        });

        this.peers.set(peerId, peer);
        return peer;
    }

    private handleSignal(peerId: string, signalData: string | object): void {
        let peer = this.peers.get(peerId);
        if (!peer) peer = this.createPeer(peerId, false) as ExtendedPeer;
        try { 
            peer.signal(signalData as Peer.SignalData); 
        } catch (e) {
            console.warn(`[FirestoreTransport] ⚠️ Error enviando señal a peer ${peerId}:`, e);
        }
    }

    public async broadcast(message: P2PMessage): Promise<void> {
        const data = JSON.stringify(message);
        this.peers.forEach(peer => { if (peer.connected) peer.send(data); });
    }

    public async sendTo(peerId: string, message: P2PMessage): Promise<void> {
        const peer = this.peers.get(peerId);
        if (peer?.connected) peer.send(JSON.stringify(message));
    }

    public onMessage(cb: (msg: P2PMessage) => void): void { 
        this._messageListeners.push(cb); 
    }
    
    public onPeersChange(cb: (peerIds: string[]) => void): void { this._onPeersChange = cb; }
    
    public getConnectedPeers(): string[] {
        return Array.from(this.peers.entries())
            .filter(([_, p]) => p.connected)
            .map(([id, _]) => id);
    }

    /**
     * Sube el audio de una sesión a Firebase Storage y retorna la URL de descarga.
     * El follower puede descargar directamente desde CDN sin pasar por DataChannel.
     */
    public async uploadAudioForSession(
        sessionId: string,
        trackId: string,
        blobUrl: string
    ): Promise<string> {
        console.log(`[SYNC:LEADER] Uploading audio to Firebase Storage | session: ${sessionId} | track: ${trackId}`);

        const response = await fetch(blobUrl);
        const blob = await response.blob();

        const storagePath = `sync-sessions/${sessionId}/${trackId}`;
        const storageRef = ref(storage, storagePath);

        console.log(`[SYNC:LEADER] Blob size: ${(blob.size / 1024 / 1024).toFixed(2)}MB | uploading to ${storagePath}`);

        await uploadBytes(storageRef, blob);
        const downloadUrl = await getDownloadURL(storageRef);

        console.log(`[SYNC:LEADER] Upload complete | download URL ready`);

        return downloadUrl;
    }
}
