import type { SetEntry, Show, Track } from "../types";

import { useBuilderStore } from "../store/useBuilderStore";
import { useHistoryStore } from "../store/useHistoryStore";
import { useLibraryStore } from "../store/useLibraryStore";
import { usePlayerStore } from "../store/usePlayerStore";
import { useSettingsStore } from "../store/useSettingsStore";

const DB_NAME = "suniplayer-show-session";
const STORE_NAME = "snapshots";
const SNAPSHOT_KEY = "latest";

interface SnapshotTrack extends Track {
    sourceMissing?: boolean;
}

export interface ShowSessionSnapshot {
    id: string;
    capturedAt: string;
    builder: {
        view: "builder" | "player" | "history" | "library";
        targetMin: number;
        venue: string;
        curve: string;
        genSet: SnapshotTrack[];
    };
    player: {
        pQueue: SnapshotTrack[];
        ci: number;
        pos: number;
        vol: number;
        tTarget: number;
        mode: "edit" | "live";
        stackOrder: string[];
    };
    history: {
        history: Show[];
    };
    library: {
        customTracks: SnapshotTrack[];
        trackOverrides: Record<string, Partial<Track>>;
        availableTags: string[];
        selectedFolderName: string | null;
    };
    settings: {
        autoNext: boolean;
        crossfade: boolean;
        crossfadeMs: number;
        defaultVol: number;
        fadeEnabled: boolean;
        fadeInMs: number;
        fadeOutMs: number;
        bpmMin: number;
        bpmMax: number;
    };
    warnings: {
        requiresAudioReconnect: boolean;
        missingCustomTrackIds: string[];
    };
}

type IDBDatabaseLike = IDBDatabase;

function openDb(): Promise<IDBDatabaseLike> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function withStore<T>(mode: IDBTransactionMode, handler: (store: IDBObjectStore) => Promise<T> | T): Promise<T> {
    const db = await openDb();

    return new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);

        Promise.resolve(handler(store))
            .then((value) => {
                tx.oncomplete = () => {
                    db.close();
                    resolve(value);
                };
                tx.onerror = () => {
                    db.close();
                    reject(tx.error);
                };
                tx.onabort = () => {
                    db.close();
                    reject(tx.error);
                };
            })
            .catch((error) => {
                db.close();
                reject(error);
            });
    });
}

function sanitizeTrackForSnapshot(track: Track): SnapshotTrack {
    if (!track.isCustom) {
        return { ...track };
    }

    return {
        ...track,
        blob_url: undefined,
        sourceMissing: true,
    };
}

function sanitizeSetEntry(entry: SetEntry): SetEntry {
    return {
        ...entry,
        tracks: entry.tracks.map(sanitizeTrackForSnapshot),
    };
}

function sanitizeShows(shows: Show[]): Show[] {
    return shows.map((show) => ({
        ...show,
        sets: show.sets.map(sanitizeSetEntry),
    }));
}

function collectMissingAudioTrackIds(tracks: Track[]): string[] {
    return tracks.filter((track) => track.isCustom).map((track) => track.id);
}

export function buildShowSessionSnapshot(): ShowSessionSnapshot {
    const builder = useBuilderStore.getState();
    const player = usePlayerStore.getState();
    const history = useHistoryStore.getState();
    const library = useLibraryStore.getState();
    const settings = useSettingsStore.getState();

    const snapshotQueue = player.pQueue.map(sanitizeTrackForSnapshot);
    const snapshotGenSet = builder.genSet.map(sanitizeTrackForSnapshot);
    const snapshotCustomTracks = library.customTracks.map(sanitizeTrackForSnapshot);
    const missingCustomTrackIds = Array.from(new Set([
        ...collectMissingAudioTrackIds(player.pQueue),
        ...collectMissingAudioTrackIds(builder.genSet),
        ...collectMissingAudioTrackIds(library.customTracks),
    ]));

    return {
        id: SNAPSHOT_KEY,
        capturedAt: new Date().toISOString(),
        builder: {
            view: builder.view,
            targetMin: builder.targetMin,
            venue: builder.venue,
            curve: builder.curve,
            genSet: snapshotGenSet,
        },
        player: {
            pQueue: snapshotQueue,
            ci: player.ci,
            pos: player.pos,
            vol: player.vol,
            tTarget: player.tTarget,
            mode: player.mode,
            stackOrder: player.stackOrder,
        },
        history: {
            history: sanitizeShows(history.history),
        },
        library: {
            customTracks: snapshotCustomTracks,
            trackOverrides: library.trackOverrides,
            availableTags: library.availableTags,
            selectedFolderName: library.selectedFolderName,
        },
        settings: {
            autoNext: settings.autoNext,
            crossfade: settings.crossfade,
            crossfadeMs: settings.crossfadeMs,
            defaultVol: settings.defaultVol,
            fadeEnabled: settings.fadeEnabled,
            fadeInMs: settings.fadeInMs,
            fadeOutMs: settings.fadeOutMs,
            bpmMin: settings.bpmMin,
            bpmMax: settings.bpmMax,
        },
        warnings: {
            requiresAudioReconnect: missingCustomTrackIds.length > 0,
            missingCustomTrackIds,
        },
    };
}

export async function saveShowSessionSnapshot(snapshot = buildShowSessionSnapshot()): Promise<void> {
    await withStore("readwrite", (store) => {
        store.put(snapshot, SNAPSHOT_KEY);
    });
}

export async function readShowSessionSnapshot(): Promise<ShowSessionSnapshot | null> {
    return withStore("readonly", (store) => new Promise<ShowSessionSnapshot | null>((resolve, reject) => {
        const request = store.get(SNAPSHOT_KEY);
        request.onsuccess = () => resolve((request.result as ShowSessionSnapshot | undefined) ?? null);
        request.onerror = () => reject(request.error);
    }));
}

export async function clearShowSessionSnapshot(): Promise<void> {
    await withStore("readwrite", (store) => {
        store.delete(SNAPSHOT_KEY);
    });
}

export function applyShowSessionSnapshot(snapshot: ShowSessionSnapshot): void {
    useBuilderStore.setState((state) => ({
        ...state,
        view: snapshot.builder.view,
        targetMin: snapshot.builder.targetMin,
        venue: snapshot.builder.venue,
        curve: snapshot.builder.curve,
        genSet: snapshot.builder.genSet,
    }));

    usePlayerStore.setState((state) => ({
        ...state,
        pQueue: snapshot.player.pQueue,
        ci: snapshot.player.ci,
        pos: snapshot.player.pos,
        vol: snapshot.player.vol,
        tTarget: snapshot.player.tTarget,
        mode: snapshot.player.mode,
        stackOrder: snapshot.player.stackOrder,
        playing: false,
        elapsed: 0,
        isSimulating: false,
    }));

    useHistoryStore.setState((state) => ({
        ...state,
        history: snapshot.history.history,
    }));

    useLibraryStore.setState((state) => ({
        ...state,
        customTracks: snapshot.library.customTracks,
        trackOverrides: snapshot.library.trackOverrides,
        availableTags: snapshot.library.availableTags,
        selectedFolderName: snapshot.library.selectedFolderName,
    }));

    useSettingsStore.setState((state) => ({
        ...state,
        autoNext: snapshot.settings.autoNext,
        crossfade: snapshot.settings.crossfade,
        crossfadeMs: snapshot.settings.crossfadeMs,
        defaultVol: snapshot.settings.defaultVol,
        fadeEnabled: snapshot.settings.fadeEnabled,
        fadeInMs: snapshot.settings.fadeInMs,
        fadeOutMs: snapshot.settings.fadeOutMs,
        bpmMin: snapshot.settings.bpmMin,
        bpmMax: snapshot.settings.bpmMax,
    }));
}

export async function requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.storage?.persist) {
        return false;
    }

    try {
        return await navigator.storage.persist();
    } catch {
        return false;
    }
}

export function hasRecoverableShowSession(snapshot: ShowSessionSnapshot | null): boolean {
    if (!snapshot) return false;

    return Boolean(
        snapshot.player.pQueue.length ||
        snapshot.builder.genSet.length ||
        snapshot.history.history.length
    );
}
