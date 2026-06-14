// packages/core/src/network/iP2PService.ts
import { P2PMessage, SyncStatus } from './types';

export interface DiscoveredSession {
    id: string;
    name: string;
    leaderName: string;
    memberCount: number;
}

export interface IP2PService {
    /** Inicia el broadcast para ser descubierto por otros */
    startAdvertising(sessionName: string, userName: string): Promise<void>;
    
    /** Detiene el broadcast */
    stopAdvertising(): Promise<void>;
    
    /** Inicia la búsqueda de sesiones activas en la red */
    startDiscovery(): Promise<void>;
    
    /** Detiene la búsqueda */
    stopDiscovery(): Promise<void>;
    
    /** Se une a una sesión descubierta */
    connectToSession(sessionId: string): Promise<void>;
    
    /** Abandona la sesión actual */
    disconnect(): Promise<void>;
    
    /** Envía un mensaje a todos los miembros de la sesión */
    broadcast(message: Omit<P2PMessage, 'senderId' | 'timestamp' | 'sequence'>): Promise<void>;
    
    /** Envía un mensaje a un miembro específico */
    sendTo(recipientId: string, message: Omit<P2PMessage, 'senderId' | 'timestamp' | 'sequence'>): Promise<void>;

    // Eventos (Observables)
    onMessage: (cb: (msg: P2PMessage) => void) => void;
    onSessionsDiscovered: (cb: (sessions: DiscoveredSession[]) => void) => void;
    onConnectionStateChange: (cb: (state: 'connected' | 'disconnected' | 'connecting') => void) => void;
}
