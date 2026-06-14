// packages/core/src/network/crdt/CollaborativeQueue.ts
import * as Y from 'yjs';
import { YjsStore } from './YjsStore';
import { Track } from '../../types';

/**
 * A single entry in the shared setlist queue.
 *
 * Carries only the lightweight metadata needed to render the queue and to locate
 * the audio later — NOT the audio bytes. `ownerId` is the device/user that holds
 * the file, which phase 2 (owner-seeding) uses to transfer it on demand.
 */
export interface QueueItem {
    /** Unique per queue entry — the same track can appear twice and still be
     *  reordered/removed independently. */
    uid: string;
    trackId: string;
    title: string;
    artist?: string;
    ownerId: string;
    bpm?: number;
    musicalKey?: string;
    durationMs?: number;
    filePath?: string;
}

const QUEUE_KEY = 'queue';

let _uidCounter = 0;
function makeUid(): string {
    _uidCounter += 1;
    return `q_${Date.now().toString(36)}_${_uidCounter.toString(36)}`;
}

/** Builds a QueueItem from a Track, tagging the owner that holds the audio. */
export function queueItemFromTrack(track: Track, ownerId: string): QueueItem {
    return {
        uid: makeUid(),
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        ownerId,
        bpm: track.bpm,
        musicalKey: track.key,
        durationMs: track.duration_ms,
        filePath: track.file_path,
    };
}

/**
 * CollaborativeQueue — the shared, conflict-free setlist queue.
 *
 * Backed by a Yjs Y.Array, so any device can add / remove / reorder concurrently
 * and every device converges to the same order without a central owner. When the
 * backing YjsStore is connected to a session transport, edits propagate to peers
 * automatically; with no transport it is a perfectly good local queue.
 */
export class CollaborativeQueue {
    private readonly doc: Y.Doc;
    private readonly arr: Y.Array<QueueItem>;

    constructor(store: YjsStore) {
        this.doc = store.doc;
        this.arr = store.getArray(QUEUE_KEY) as Y.Array<QueueItem>;
    }

    /** Current queue order. */
    getItems(): QueueItem[] {
        return this.arr.toArray();
    }

    get length(): number {
        return this.arr.length;
    }

    /** Append a track to the end of the queue. */
    add(item: QueueItem): void {
        this.arr.push([item]);
    }

    addMany(items: QueueItem[]): void {
        if (items.length) this.arr.push(items);
    }

    /** Remove a specific entry by its uid. No-op if not present. */
    remove(uid: string): void {
        const idx = this.arr.toArray().findIndex((i) => i.uid === uid);
        if (idx !== -1) this.arr.delete(idx, 1);
    }

    /** Move an entry to a new index. Delete + insert run in one transaction so
     *  peers see an atomic reorder rather than a transient removal. */
    move(uid: string, toIndex: number): void {
        const items = this.arr.toArray();
        const from = items.findIndex((i) => i.uid === uid);
        if (from === -1) return;
        const item = items[from];
        this.doc.transact(() => {
            this.arr.delete(from, 1);
            const insertAt = Math.max(0, Math.min(toIndex, this.arr.length));
            this.arr.insert(insertAt, [item]);
        });
    }

    /** Clear the whole queue (e.g. on session end). */
    clear(): void {
        if (this.arr.length) this.arr.delete(0, this.arr.length);
    }

    /** Subscribe to queue changes. Returns an unsubscribe function. */
    observe(cb: (items: QueueItem[]) => void): () => void {
        const handler = () => cb(this.arr.toArray());
        this.arr.observe(handler);
        return () => this.arr.unobserve(handler);
    }
}
