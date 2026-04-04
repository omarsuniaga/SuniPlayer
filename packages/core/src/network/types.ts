// packages/core/src/network/types.ts

export type P2PMessageType =
    | 'CLOCK_PING'
    | 'CLOCK_PONG'
    | 'PLAY'
    | 'PAUSE'
    | 'SEEK'
    | 'STOP'
    | 'POSITION_REPORT'
    | 'SESSION_ANNOUNCE'
    | 'JOIN_REQUEST'
    | 'JOIN_ACCEPTED'
    | 'YJS_UPDATE'
    | 'TRACK_CHANGE'
    | 'MEMBER_READY'
    | 'AUDIO_REQUEST'
    | 'AUDIO_CHUNK'
    | 'AUDIO_CHUNK_DONE'
    | 'AUDIO_URL';
export interface P2PMessage {
    type: P2PMessageType;
    senderId: string;
    timestamp: number; // Monotonic time in ms
    sessionId: string;
    sequence: number;
    payload: any;
}

export interface ClockOffset {
    offsetMs: number;
    rttMs: number;
    sampleCount: number;
    stdDevMs: number;
    calibratedAt: number;
}

export type SyncStatus = 
    | 'UNCALIBRATED' 
    | 'CALIBRATING' 
    | 'SYNCED' 
    | 'DRIFTING' 
    | 'LOST';

export interface NTPSample {
    t1: number;
    t2: number;
    t3: number;
    t4: number;
    offset: number;
    rtt: number;
}

/** Payload para AUDIO_REQUEST: follower → leader pidiendo el archivo de audio */
export interface AudioRequestPayload {
    trackId: string;
}

/** Payload para AUDIO_CHUNK: leader → follower, chunk binario del archivo en base64 */
export interface AudioChunkPayload {
    trackId: string;
    chunkIndex: number;
    totalChunks: number;
    data: string; // base64
}

/** Payload para AUDIO_CHUNK_DONE: leader → follower, fin de la transferencia */
export interface AudioChunkDonePayload {
    trackId: string;
    totalChunks: number;
}

/** Payload para AUDIO_URL: leader → follower, URL de descarga de Firebase Storage */
export interface AudioUrlPayload {
    trackId: string;
    url: string; // Firebase Storage download URL
}
