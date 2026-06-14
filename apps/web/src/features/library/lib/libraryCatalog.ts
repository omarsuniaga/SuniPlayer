import { Track, getTrackUrl, sumTrackDurationSeconds } from "@suniplayer/core";

export type LibraryTrackOrigin = "local" | "cloud";

export function buildLibraryCatalog(catalogTracks: Track[], customTracks: Track[]): Track[] {
    const byId = new Map<string, Track>();

    for (const track of catalogTracks) {
        byId.set(track.id, { ...track, isCustom: false });
    }

    for (const track of customTracks) {
        byId.set(track.id, { ...track, isCustom: true });
    }

    return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export function getLibraryTrackOrigin(track: Track): LibraryTrackOrigin {
    return track.isCustom ? "local" : "cloud";
}

export function createQueuedTrack(track: Track): Track {
    return {
        ...track,
        instanceId: `inst_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };
}

export function appendTrackToQueueTail(queue: Track[], track: Track): { queue: Track[]; targetSeconds: number } {
    const nextQueue = [...queue, createQueuedTrack(track)];
    return {
        queue: nextQueue,
        targetSeconds: sumTrackDurationSeconds(nextQueue),
    };
}

export function buildPlayerLaunchQueue(track: Track): { queue: Track[]; targetSeconds: number } {
    const queue = [createQueuedTrack(track)];
    return {
        queue,
        targetSeconds: sumTrackDurationSeconds(queue),
    };
}

export async function checkCloudTrackAvailability(track: Track): Promise<string> {
    if (getLibraryTrackOrigin(track) === "local") {
        return "Disponible en este dispositivo";
    }

    if (track.blob_url?.startsWith("blob:")) {
        return "Audio cacheado temporalmente en este dispositivo";
    }

    const url = getTrackUrl(track);
    if (!url) {
        return "No se encontró una URL válida para este track";
    }

    try {
        const response = await fetch(url, {
            method: "HEAD",
            cache: "force-cache",
        });

        if (response.ok) {
            return "Disponible en la nube para streaming. Cache persistente no verificada.";
        }
    } catch {
        // handled below
    }

    return "No se pudo verificar cache o disponibilidad remota en este momento.";
}
