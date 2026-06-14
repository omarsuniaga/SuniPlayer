// packages/core/src/network/crdt/CollaborativeQueue.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { YjsStore } from './YjsStore';
import { CollaborativeQueue, QueueItem, queueItemFromTrack } from './CollaborativeQueue';
import { IP2PTransport } from '../P2PTransport';
import { P2PMessage } from '../types';
import { Track } from '../../types';

function item(uid: string, trackId: string, ownerId = 'user1'): QueueItem {
    return { uid, trackId, title: trackId, ownerId };
}

describe('CollaborativeQueue', () => {
    let q1: CollaborativeQueue;
    let q2: CollaborativeQueue;

    beforeEach(() => {
        const store1 = new YjsStore();
        const store2 = new YjsStore();

        let handler1: (msg: P2PMessage) => void;
        let handler2: (msg: P2PMessage) => void;

        const transport1 = {
            broadcast: async (msg: P2PMessage) => { if (handler2) handler2(msg); },
            sendTo: async (_pid: string, msg: P2PMessage) => { if (handler2) handler2(msg); },
            onMessage: (cb: (msg: P2PMessage) => void) => { handler1 = cb; },
            onPeersChange: () => {},
            getConnectedPeers: () => ['user2'],
        } as unknown as IP2PTransport;

        const transport2 = {
            broadcast: async (msg: P2PMessage) => { if (handler1) handler1(msg); },
            sendTo: async (_pid: string, msg: P2PMessage) => { if (handler1) handler1(msg); },
            onMessage: (cb: (msg: P2PMessage) => void) => { handler2 = cb; },
            onPeersChange: () => {},
            getConnectedPeers: () => ['user1'],
        } as unknown as IP2PTransport;

        store1.connect(transport1, 'session1', 'user1');
        store2.connect(transport2, 'session1', 'user2');

        q1 = new CollaborativeQueue(store1);
        q2 = new CollaborativeQueue(store2);
    });

    it('propagates an add from one device to the other', () => {
        q1.add(item('a', 'song-a'));
        expect(q2.getItems().map((i) => i.uid)).toEqual(['a']);
        expect(q2.getItems()[0].trackId).toBe('song-a');
    });

    it('lets any device remove an entry and converges', () => {
        q1.add(item('a', 'song-a'));
        q1.add(item('b', 'song-b'));
        // The other device removes the first entry.
        q2.remove('a');
        expect(q1.getItems().map((i) => i.uid)).toEqual(['b']);
        expect(q2.getItems().map((i) => i.uid)).toEqual(['b']);
    });

    it('syncs a reorder (move)', () => {
        q1.addMany([item('a', 'song-a'), item('b', 'song-b'), item('c', 'song-c')]);
        q2.move('c', 0); // a device pulls song-c to the front
        expect(q1.getItems().map((i) => i.uid)).toEqual(['c', 'a', 'b']);
        expect(q2.getItems().map((i) => i.uid)).toEqual(['c', 'a', 'b']);
    });

    it('merges concurrent adds from both devices (CRDT — nothing lost)', () => {
        q1.add(item('x', 'song-x', 'user1'));
        q2.add(item('y', 'song-y', 'user2'));
        const uids1 = q1.getItems().map((i) => i.uid).sort();
        const uids2 = q2.getItems().map((i) => i.uid).sort();
        expect(uids1).toEqual(['x', 'y']);
        expect(uids2).toEqual(['x', 'y']);
        // Both replicas converge to the SAME order.
        expect(q1.getItems().map((i) => i.uid)).toEqual(q2.getItems().map((i) => i.uid));
    });

    it('clear empties the queue on every device', () => {
        q1.addMany([item('a', 'song-a'), item('b', 'song-b')]);
        q2.clear();
        expect(q1.getItems()).toEqual([]);
        expect(q2.getItems()).toEqual([]);
    });

    it('notifies observers on change', () => {
        const seen: number[] = [];
        const unsub = q2.observe((items) => seen.push(items.length));
        q1.add(item('a', 'song-a'));
        q1.add(item('b', 'song-b'));
        unsub();
        q1.add(item('c', 'song-c'));
        expect(seen[seen.length - 1]).toBe(2); // stopped observing before the 3rd add
    });

    it('queueItemFromTrack maps fields and assigns unique uids', () => {
        const track = { id: 't1', title: 'Treasure', artist: 'Bruno Mars', bpm: 116, key: 'C', duration_ms: 200000, file_path: 'treasure.mp3' } as Track;
        const a = queueItemFromTrack(track, 'user1');
        const b = queueItemFromTrack(track, 'user1');
        expect(a.trackId).toBe('t1');
        expect(a.title).toBe('Treasure');
        expect(a.ownerId).toBe('user1');
        expect(a.bpm).toBe(116);
        expect(a.durationMs).toBe(200000);
        expect(a.uid).not.toBe(b.uid); // each entry is unique
    });
});
