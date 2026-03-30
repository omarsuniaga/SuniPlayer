import type { Track, Show } from "@suniplayer/core";
import { 
    useBuilderStore, 
    usePlayerStore, 
    useHistoryStore, 
    useLibraryStore, 
    useSettingsStore 
} from "../store/useProjectStore";

const SNAPSHOT_KEY = "suniplayer-session-snapshot";

export interface ShowSessionSnapshot {
    id: string;
    capturedAt: string;
    builder: any;
    player: any;
    history: any;
    library: any;
    settings: any;
    warnings: {
        requiresAudioReconnect: boolean;
        missingCustomTrackIds: string[];
    };
}

/**
 * buildShowSessionSnapshot — Captura el estado actual desde localStorage
 * Sanitiza datos y maneja entries malformadas
 */
export function buildShowSessionSnapshot(): ShowSessionSnapshot {
    const builderRaw = localStorage.getItem("suniplayer-builder");
    const playerRaw  = localStorage.getItem("suniplayer-player");
    const libraryRaw = localStorage.getItem("suniplayer-library");
    const settingsRaw = localStorage.getItem("suniplayer-settings");
    const historyRaw = localStorage.getItem("suniplayer-history");

    let builder = builderRaw ? JSON.parse(builderRaw).state : {};
    let player  = playerRaw  ? JSON.parse(playerRaw).state : {};
    let library = libraryRaw ? JSON.parse(libraryRaw).state : {};
    const settings = settingsRaw ? JSON.parse(settingsRaw).state : {};
    let history = historyRaw ? JSON.parse(historyRaw).state : { history: [] };

    // Sanitize blob URLs: remove temporary blob URLs and mark as sourceMissing
    const sanitizeTrack = (track: Track): Track => {
        if (!track) return track;
        const isBlob = !!(track.blob_url && track.blob_url.startsWith('blob:'));
        return {
            ...track,
            blob_url: isBlob ? undefined : track.blob_url,
            sourceMissing: isBlob || (track.sourceMissing ?? false),
        };
    };

    // Sanitize player pQueue
    if (Array.isArray(player.pQueue)) {
        player = {
            ...player,
            pQueue: player.pQueue.map(sanitizeTrack),
        };
    }

    // Sanitize builder genSet
    if (Array.isArray(builder.genSet)) {
        builder = {
            ...builder,
            genSet: builder.genSet.map(sanitizeTrack),
        };
    }

    // Sanitize library customTracks
    if (Array.isArray(library.customTracks)) {
        library = {
            ...library,
            customTracks: library.customTracks.map(sanitizeTrack),
        };
    }

    // Sanitize history: ensure all sets have tracks array
    if (history.history && Array.isArray(history.history)) {
        history.history = history.history.map((show: any) => {
            if (!show || typeof show !== 'object') return show;
            return {
                ...show,
                sets: Array.isArray(show.sets)
                    ? show.sets.map((set: any) => ({
                        ...set,
                        tracks: Array.isArray(set.tracks) ? set.tracks : [],
                    }))
                    : [],
            };
        });
    }

    const allTracks = [
        ...(Array.isArray(player.pQueue) ? player.pQueue : []),
        ...(Array.isArray(builder.genSet) ? builder.genSet : []),
        ...(Array.isArray(library.customTracks) ? library.customTracks : [])
    ];

    const missingCustomTrackIds = Array.from(new Set(
        allTracks
            .filter(t => t && t.isCustom)
            .map(t => t.id)
    ));

    return {
        id: SNAPSHOT_KEY,
        capturedAt: new Date().toISOString(),
        builder,
        player,
        history,
        library,
        settings,
        warnings: {
            requiresAudioReconnect: missingCustomTrackIds.length > 0,
            missingCustomTrackIds,
        },
    };
}

/**
 * applyShowSessionSnapshot — Aplica los datos recuperados a los stores actuales
 */
export function applyShowSessionSnapshot(snapshot: ShowSessionSnapshot): void {
    if (!snapshot) return;

    if (snapshot.builder) useBuilderStore.setState(snapshot.builder);
    if (snapshot.player) usePlayerStore.setState(snapshot.player);
    if (snapshot.library) useLibraryStore.setState(snapshot.library);
    if (snapshot.settings) useSettingsStore.setState(snapshot.settings);
    if (snapshot.history) useHistoryStore.setState(snapshot.history);
    
    console.log("[ShowRecovery] 🩹 Snapshot applied successfully");
}

export async function saveShowSessionSnapshot(snapshot: ShowSessionSnapshot): Promise<void> {
    try {
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
    } catch (e) {
        console.error("Failed to save session snapshot:", e);
    }
}

export async function loadShowSessionSnapshot(): Promise<ShowSessionSnapshot | null> {
    try {
        const raw = localStorage.getItem(SNAPSHOT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

// ALIASES para compatibilidad con ShowRecoveryManager
export const readShowSessionSnapshot = loadShowSessionSnapshot;
export const hasRecoverableShowSession = (s: ShowSessionSnapshot | null) => hasActiveSession(s);

export function clearShowSessionSnapshot(): void {
    localStorage.removeItem(SNAPSHOT_KEY);
}

export function hasActiveSession(snapshot: ShowSessionSnapshot | null): boolean {
    if (!snapshot) return false;
    return !!(snapshot.player?.pQueue?.length || snapshot.builder?.genSet?.length);
}

/**
 * requestPersistentStorage — Pide permiso al navegador para persistencia duradera
 */
export async function requestPersistentStorage(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persist) {
        return await navigator.storage.persist();
    }
    return false;
}
