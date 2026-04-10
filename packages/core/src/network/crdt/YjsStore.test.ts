// packages/core/src/network/crdt/YjsStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { YjsStore } from './YjsStore';
import { IP2PTransport } from '../P2PTransport';
import { P2PMessage } from '../types';

describe('YjsStore', () => {
    let store1: YjsStore;
    let store2: YjsStore;
    let mockTransport1: IP2PTransport;
    let mockTransport2: IP2PTransport;

    beforeEach(() => {
        store1 = new YjsStore();
        store2 = new YjsStore();

        // Mock handlers to store the registered callbacks
        let handler1: (msg: P2PMessage) => void;
        let handler2: (msg: P2PMessage) => void;

        const transport1: IP2PTransport = {
            broadcast: async (msg) => { if (handler2) handler2(msg); },
            sendTo: async (pid, msg) => { if (handler2) handler2(msg); },
            onMessage: (cb) => { handler1 = cb; },
            onPeersChange: (cb) => {},
            getConnectedPeers: () => ['user2']
        } as any;

        const transport2: IP2PTransport = {
            broadcast: async (msg) => { if (handler1) handler1(msg); },
            sendTo: async (pid, msg) => { if (handler1) handler1(msg); },
            onMessage: (cb) => { handler2 = cb; },
            onPeersChange: (cb) => {},
            getConnectedPeers: () => ['user1']
        } as any;

        store1.connect(transport1, 'session1', 'user1');
        store2.connect(transport2, 'session1', 'user2');
    });

    it('should synchronize map updates between two stores', () => {
        const map1 = store1.getMap('annotations');
        const map2 = store2.getMap('annotations');

        // Update store1
        map1.set('line1', { color: 'red', points: [0, 0, 10, 10] });

        // Check if store2 received it
        expect(map2.get('line1')).toEqual({ color: 'red', points: [0, 0, 10, 10] });
    });

    it('should handle concurrent updates (CRDT magic)', () => {
        const map1 = store1.getMap('config');
        const map2 = store2.getMap('config');

        // Concurrent updates to DIFFERENT keys
        map1.set('volume', 0.8);
        map2.set('tempo', 1.2);

        expect(map1.get('tempo')).toBe(1.2);
        expect(map2.get('volume')).toBe(0.8);
    });
});
