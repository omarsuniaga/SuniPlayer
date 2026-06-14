import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    type Firestore,
} from "firebase/firestore";

import { db } from "../../../../services/network/firebaseConfig";
import type { CreateMarkerInput, Marker, UpdateMarkerInput } from "../../../../types/marker";
import { filterActiveMarkers } from "../utils/markerFilters";
import { sortMarkersByTime } from "../utils/markerSorting";
import {
    mapFirestoreMarkerDocument,
    serializeCreateMarker,
    serializeSoftDeleteMarker,
    serializeUpdateMarker,
    type FirestoreMarkerDocument,
} from "./markerFirestoreMapper";

export interface MarkerRepositorySnapshotDocument {
    id: string;
    data(): FirestoreMarkerDocument;
}

export interface MarkerRepositorySnapshot {
    docs: MarkerRepositorySnapshotDocument[];
}

export type MarkerRepositoryUnsubscribe = () => void;

export interface MarkerRepositoryDriver {
    collection(firestore: Firestore, ...pathSegments: string[]): unknown;
    doc(firestore: Firestore, ...pathSegments: string[]): unknown;
    onSnapshot(
        reference: unknown,
        onNext: (snapshot: MarkerRepositorySnapshot) => void,
        onError?: (error: Error) => void
    ): MarkerRepositoryUnsubscribe;
    addDoc(reference: unknown, data: object): Promise<{ id: string }>;
    updateDoc(reference: unknown, data: object): Promise<void>;
    serverTimestamp(): unknown;
}

export interface SubscribeToMarkersOptions {
    includeDeleted?: boolean;
}

export interface MarkerRepository {
    subscribeToMarkers(
        trackId: string,
        onChange: (markers: Marker[]) => void,
        onError?: (error: Error) => void,
        options?: SubscribeToMarkersOptions
    ): MarkerRepositoryUnsubscribe;
    createMarker(input: CreateMarkerInput): Promise<string>;
    updateMarker(trackId: string, markerId: string, patch: UpdateMarkerInput): Promise<void>;
    softDeleteMarker(trackId: string, markerId: string, deletedBy: string): Promise<void>;
}

export interface CreateMarkerRepositoryOptions {
    firestore?: Firestore;
    driver?: MarkerRepositoryDriver;
}

const defaultDriver: MarkerRepositoryDriver = {
    collection,
    doc,
    onSnapshot: (
        reference: unknown,
        onNext: (snapshot: MarkerRepositorySnapshot) => void,
        onError?: (error: Error) => void
    ) => onSnapshot(reference as never, onNext as never, onError),
    addDoc: (reference: unknown, data: object) => addDoc(reference as never, data),
    updateDoc: (reference: unknown, data: object) => updateDoc(reference as never, data),
    serverTimestamp,
};

export function createMarkerRepository(
    options: CreateMarkerRepositoryOptions = {}
): MarkerRepository {
    const firestore = options.firestore ?? db;
    const driver = options.driver ?? defaultDriver;

    return {
        subscribeToMarkers(trackId, onChange, onError, subscribeOptions) {
            const includeDeleted = subscribeOptions?.includeDeleted ?? false;
            const markerCollection = driver.collection(firestore, "tracks", trackId, "markers");

            return driver.onSnapshot(
                markerCollection,
                (snapshot) => {
                    const mappedMarkers = snapshot.docs
                        .map((snapshotDocument) => mapFirestoreMarkerDocument(
                            snapshotDocument.id,
                            snapshotDocument.data()
                        ))
                        .filter((marker): marker is Marker => marker !== null);

                    const visibleMarkers = includeDeleted
                        ? mappedMarkers
                        : filterActiveMarkers(mappedMarkers);

                    onChange(sortMarkersByTime(visibleMarkers));
                },
                onError
            );
        },

        async createMarker(input) {
            const markerCollection = driver.collection(firestore, "tracks", input.trackId, "markers");
            const markerReference = await driver.addDoc(
                markerCollection,
                serializeCreateMarker(input, {
                    timestamp: driver.serverTimestamp(),
                })
            );

            return markerReference.id;
        },

        async updateMarker(trackId, markerId, patch) {
            const markerReference = driver.doc(firestore, "tracks", trackId, "markers", markerId);

            await driver.updateDoc(
                markerReference,
                serializeUpdateMarker(patch, {
                    timestamp: driver.serverTimestamp(),
                })
            );
        },

        async softDeleteMarker(trackId, markerId, deletedBy) {
            const markerReference = driver.doc(firestore, "tracks", trackId, "markers", markerId);

            await driver.updateDoc(
                markerReference,
                serializeSoftDeleteMarker({
                    deletedBy,
                    timestamp: driver.serverTimestamp(),
                })
            );
        },
    };
}

export const markerRepository = createMarkerRepository();
