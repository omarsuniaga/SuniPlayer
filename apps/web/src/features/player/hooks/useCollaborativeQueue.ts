import { useEffect, useState } from "react";
import { usePlayerStore } from "@suniplayer/core";
import type { QueueItem, Track } from "@suniplayer/core";
import { syncEnsemble } from "../../../services/network/SyncEnsembleOrchestrator";

/**
 * React binding for the shared (CRDT) setlist queue.
 *
 * Subscribes to the collaborative queue so the UI re-renders on any device's edit,
 * and exposes the contribution helpers. `isSession` tells the UI when the shared
 * queue is meaningful (a session is active) vs. plain local playback.
 */
export function useCollaborativeQueue() {
    const sessionId = usePlayerStore((s) => s.sessionId);
    const userId = usePlayerStore((s) => s.userId);
    const [items, setItems] = useState<QueueItem[]>(() => syncEnsemble.collaborativeQueue.getItems());

    useEffect(() => {
        const cq = syncEnsemble.collaborativeQueue;
        setItems(cq.getItems());
        return cq.observe(setItems);
    }, []);

    /** Resolve a queue entry to a playable Track. Prefer the local library copy;
     *  otherwise synthesize one pointing at the published CDN url (owner-seeding). */
    const toTrack = (item: QueueItem, library: Track[]): Track => {
        const local = library.find((t) => t.id === item.trackId);
        if (local) {
            return item.sourceUrl && !local.blob_url ? { ...local, blob_url: item.sourceUrl } : local;
        }
        return {
            id: item.trackId,
            title: item.title,
            artist: item.artist || "",
            duration_ms: item.durationMs || 0,
            bpm: item.bpm,
            key: item.musicalKey,
            file_path: item.filePath,
            blob_url: item.sourceUrl,
            isCustom: true,
        };
    };

    return {
        items,
        isSession: !!sessionId,
        userId,
        contribute: (track: Track) => syncEnsemble.contributeTrack(track),
        remove: (uid: string) => syncEnsemble.collaborativeQueue.remove(uid),
        move: (uid: string, toIndex: number) => syncEnsemble.collaborativeQueue.move(uid, toIndex),
        clear: () => syncEnsemble.collaborativeQueue.clear(),
        toTrack,
    };
}
