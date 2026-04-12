#!/usr/bin/env node
/**
 * SuniPlayer Relay Server
 * ─────────────────────────────────────────────────────────────────────────────
 * WebSocket relay for synchronized playback.
 * Supports both LAN (local) and cloud (Fly.io) deployment.
 *
 * Rooms: each session code is its own isolated room.
 * No cross-room message leakage.
 *
 * Usage (local LAN):
 *   node lan-server.mjs
 *
 * Wire protocol:
 *   Client → Server:
 *     { type: "IDENTIFY",  userId: string, roomId: string }
 *     { type: "BROADCAST", message: P2PMessage }
 *     { type: "SEND_TO",   to: string, message: P2PMessage }
 *
 *   Server → Client:
 *     { type: "MESSAGE",   message: P2PMessage }
 *     { type: "PEERS",     peerIds: string[] }
 *     { type: "ERROR",     reason: string }
 */

import { WebSocketServer, WebSocket } from 'ws';

const PORT = parseInt(
    process.argv.find(a => a.startsWith('--port='))?.split('=')[1]
    ?? process.env.PORT
    ?? '8765',
    10
);

// roomId → Map<userId, WebSocket>
const rooms = new Map();

function getRoom(roomId) {
    if (!rooms.has(roomId)) rooms.set(roomId, new Map());
    return rooms.get(roomId);
}

function broadcastPeers(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    const peerIds = Array.from(room.keys());
    const msg = JSON.stringify({ type: 'PEERS', peerIds });
    room.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
}

function cleanupRoom(roomId) {
    const room = rooms.get(roomId);
    if (room && room.size === 0) {
        rooms.delete(roomId);
        console.log(`[Relay] Room "${roomId}" deleted (empty)`);
    }
}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
    let userId = null;
    let roomId = null;

    ws.on('message', (raw) => {
        let envelope;
        try { envelope = JSON.parse(raw.toString()); }
        catch { return; }

        switch (envelope.type) {
            case 'IDENTIFY': {
                if (!envelope.userId || !envelope.roomId) {
                    ws.send(JSON.stringify({ type: 'ERROR', reason: 'IDENTIFY requires userId and roomId' }));
                    return;
                }
                userId = envelope.userId;
                roomId = envelope.roomId;
                const room = getRoom(roomId);
                room.set(userId, ws);
                console.log(`[Relay] "${userId}" joined room "${roomId}" | room size: ${room.size}`);
                broadcastPeers(roomId);
                break;
            }

            case 'BROADCAST': {
                if (!userId || !roomId) break;
                const room = rooms.get(roomId);
                if (!room) break;
                const data = JSON.stringify({ type: 'MESSAGE', message: envelope.message });
                room.forEach((client, id) => {
                    if (id !== userId && client.readyState === WebSocket.OPEN) {
                        client.send(data);
                    }
                });
                break;
            }

            case 'SEND_TO': {
                if (!userId || !roomId) break;
                const room = rooms.get(roomId);
                const target = room?.get(envelope.to);
                if (target?.readyState === WebSocket.OPEN) {
                    target.send(JSON.stringify({ type: 'MESSAGE', message: envelope.message }));
                } else {
                    console.warn(`[Relay] SEND_TO: peer "${envelope.to}" not found in room "${roomId}"`);
                }
                break;
            }

            default:
                console.warn(`[Relay] Unknown envelope type: ${envelope.type}`);
        }
    });

    ws.on('close', () => {
        if (userId && roomId) {
            const room = rooms.get(roomId);
            room?.delete(userId);
            console.log(`[Relay] "${userId}" left room "${roomId}" | room size: ${room?.size ?? 0}`);
            broadcastPeers(roomId);
            cleanupRoom(roomId);
        }
    });

    ws.on('error', (err) => {
        console.error(`[Relay] Error for ${userId ?? 'unknown'}:`, err.message);
    });
});

wss.on('listening', () => {
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║   SuniPlayer Relay Server                ║`);
    console.log(`║   ws://0.0.0.0:${String(PORT).padEnd(27)}║`);
    console.log(`╚══════════════════════════════════════════╝\n`);
});
