import type { Marker } from "../../../../types/marker";

export function compareMarkersByTime(left: Marker, right: Marker): number {
    if (left.timeMs !== right.timeMs) {
        return left.timeMs - right.timeMs;
    }

    if (left.createdAt !== right.createdAt) {
        return left.createdAt.localeCompare(right.createdAt);
    }

    return left.id.localeCompare(right.id);
}

export function sortMarkersByTime(markers: readonly Marker[]): Marker[] {
    return [...markers].sort(compareMarkersByTime);
}
