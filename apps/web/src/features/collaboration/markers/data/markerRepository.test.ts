import { describe, expect, it, vi } from "vitest";
import type { Firestore } from "firebase/firestore";

import { createMarkerRepository, type MarkerRepositoryDriver, type MarkerRepositorySnapshot } from "./markerRepository";

function createDriverHarness() {
    const collectionReference = { type: "collection" };
    const documentReference = { type: "document" };
    let snapshotHandler: ((snapshot: MarkerRepositorySnapshot) => void) | null = null;
    let snapshotErrorHandler: ((error: Error) => void) | undefined;

    const driver: MarkerRepositoryDriver = {
        collection: vi.fn(() => collectionReference),
        doc: vi.fn(() => documentReference),
        onSnapshot: vi.fn((reference, onNext, onError) => {
            expect(reference).toBe(collectionReference);
            snapshotHandler = onNext;
            snapshotErrorHandler = onError;
            return vi.fn();
        }),
        addDoc: vi.fn(async () => ({ id: "created-marker-id" })),
        updateDoc: vi.fn(async () => undefined),
        serverTimestamp: vi.fn(() => ({ __type: "serverTimestamp" })),
    };

    return {
        driver,
        emitSnapshot(snapshot: MarkerRepositorySnapshot) {
            if (snapshotHandler === null) {
                throw new Error("Snapshot handler not registered");
            }

            snapshotHandler(snapshot);
        },
        emitError(error: Error) {
            if (typeof snapshotErrorHandler !== "function") {
                throw new Error("Snapshot error handler not registered");
            }

            snapshotErrorHandler(error);
        },
        collectionReference,
        documentReference,
    };
}

describe("markerRepository", () => {
    it("maps, filters and sorts realtime snapshot markers", () => {
        const harness = createDriverHarness();
        const repository = createMarkerRepository({
            firestore: {} as Firestore,
            driver: harness.driver,
        });
        const onChange = vi.fn();

        repository.subscribeToMarkers("track-1", onChange);

        harness.emitSnapshot({
            docs: [
                {
                    id: "b-marker",
                    data: () => ({
                        trackId: "track-1",
                        timeMs: 8000,
                        label: "B",
                        note: "Segundo",
                        category: "note",
                        shared: true,
                        authorId: "user-2",
                        authorName: "User 2",
                        authorColor: "#22c55e",
                        createdAt: "2026-04-04T15:05:00.000Z",
                        updatedAt: "2026-04-04T15:05:00.000Z",
                        deleted: false,
                    }),
                },
                {
                    id: "deleted-marker",
                    data: () => ({
                        trackId: "track-1",
                        timeMs: 4000,
                        label: "Deleted",
                        note: "Oculto",
                        category: "warning",
                        shared: true,
                        authorId: "user-3",
                        authorName: "User 3",
                        authorColor: "#ef4444",
                        createdAt: "2026-04-04T15:00:00.000Z",
                        updatedAt: "2026-04-04T15:01:00.000Z",
                        deleted: true,
                        deletedAt: "2026-04-04T15:02:00.000Z",
                        deletedBy: "user-3",
                    }),
                },
                {
                    id: "a-marker",
                    data: () => ({
                        trackId: "track-1",
                        timeMs: 2000,
                        label: "A",
                        note: "Primero",
                        category: "cue",
                        shared: false,
                        authorId: "user-1",
                        authorName: "User 1",
                        authorColor: "#38bdf8",
                        createdAt: "2026-04-04T14:55:00.000Z",
                        updatedAt: "2026-04-04T14:55:00.000Z",
                        deleted: false,
                    }),
                },
                {
                    id: "broken-marker",
                    data: () => ({
                        trackId: "",
                        timeMs: "invalid",
                    }),
                },
            ],
        });

        expect(onChange).toHaveBeenCalledWith([
            expect.objectContaining({
                id: "a-marker",
                timeMs: 2000,
            }),
            expect.objectContaining({
                id: "b-marker",
                timeMs: 8000,
            }),
        ]);
    });

    it("can include soft-deleted markers when requested", () => {
        const harness = createDriverHarness();
        const repository = createMarkerRepository({
            firestore: {} as Firestore,
            driver: harness.driver,
        });
        const onChange = vi.fn();

        repository.subscribeToMarkers("track-9", onChange, undefined, {
            includeDeleted: true,
        });

        harness.emitSnapshot({
            docs: [
                {
                    id: "deleted-marker",
                    data: () => ({
                        trackId: "track-9",
                        timeMs: 4000,
                        label: "Deleted",
                        note: "Oculto",
                        category: "warning",
                        shared: true,
                        authorId: "user-3",
                        authorName: "User 3",
                        authorColor: "#ef4444",
                        createdAt: "2026-04-04T15:00:00.000Z",
                        updatedAt: "2026-04-04T15:01:00.000Z",
                        deleted: true,
                        deletedAt: "2026-04-04T15:02:00.000Z",
                        deletedBy: "user-3",
                    }),
                },
            ],
        });

        expect(onChange).toHaveBeenCalledWith([
            expect.objectContaining({
                id: "deleted-marker",
                deleted: true,
            }),
        ]);
    });

    it("forwards repository errors, creates markers, updates and soft-deletes with isolated payloads", async () => {
        const harness = createDriverHarness();
        const repository = createMarkerRepository({
            firestore: {} as Firestore,
            driver: harness.driver,
        });
        const onError = vi.fn();

        repository.subscribeToMarkers("track-2", vi.fn(), onError);
        const error = new Error("snapshot failed");
        harness.emitError(error);

        expect(onError).toHaveBeenCalledWith(error);

        await expect(repository.createMarker({
            trackId: "track-2",
            timeMs: 5000,
            label: "Entrada",
            note: "Todos juntos",
            category: "cue",
            shared: true,
            author: {
                id: "user-4",
                name: "Caro",
                color: "#a855f7",
            },
        })).resolves.toBe("created-marker-id");

        expect(harness.driver.addDoc).toHaveBeenCalledWith(harness.collectionReference, {
            trackId: "track-2",
            timeMs: 5000,
            label: "Entrada",
            note: "Todos juntos",
            category: "cue",
            shared: true,
            authorId: "user-4",
            authorName: "Caro",
            authorColor: "#a855f7",
            createdAt: { __type: "serverTimestamp" },
            updatedAt: { __type: "serverTimestamp" },
            deleted: false,
            deletedAt: null,
            deletedBy: null,
        });

        await repository.updateMarker("track-2", "marker-7", {
            label: "Entrada final",
            shared: false,
        });

        expect(harness.driver.updateDoc).toHaveBeenNthCalledWith(1, harness.documentReference, {
            label: "Entrada final",
            shared: false,
            updatedAt: { __type: "serverTimestamp" },
        });

        await repository.softDeleteMarker("track-2", "marker-7", "user-4");

        expect(harness.driver.updateDoc).toHaveBeenNthCalledWith(2, harness.documentReference, {
            deleted: true,
            deletedAt: { __type: "serverTimestamp" },
            deletedBy: "user-4",
            updatedAt: { __type: "serverTimestamp" },
        });
    });
});
