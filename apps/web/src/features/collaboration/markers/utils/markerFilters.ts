import type { Marker } from "../../../../types/marker";

export function filterActiveMarkers(markers: readonly Marker[]): Marker[] {
    return markers.filter((marker) => !marker.deleted);
}

export function isMarkerVisibleToUser(marker: Marker, currentUserId: string): boolean {
    if (marker.deleted) {
        return false;
    }

    return marker.shared || marker.authorId === currentUserId;
}

export function filterVisibleMarkers(
    markers: readonly Marker[],
    currentUserId: string
): Marker[] {
    return markers.filter((marker) => isMarkerVisibleToUser(marker, currentUserId));
}
