import { describe, expect, it } from "vitest";

import type { Marker, MarkerAuthor } from "../../../../types/marker";
import { FakeMarkerRepository } from "../testing/fakeMarkerRepository";
import { createMarkersController } from "./useMarkers";

const CURRENT_USER: MarkerAuthor = {
    id: "user-1",
    name: "User One",
    color: "#38bdf8",
};

describe("useMarkers controller", () => {
    it("starts loading and exposes only visible markers after the first snapshot", () => {
        const repository = new FakeMarkerRepository({
            autoEmitOnSubscribe: false,
        });
        const controller = createMarkersController({
            trackId: "track-1",
            currentUser: CURRENT_USER,
            repository,
        });

        const disconnect = controller.connect();

        expect(controller.getSnapshot().isLoading).toBe(true);
        expect(controller.getSnapshot().markers).toEqual([]);

        repository.emitSnapshot([
            makeMarker({
                id: "shared-marker",
                trackId: "track-1",
                timeMs: 6000,
                label: "Shared",
                note: "Visible to all",
                shared: true,
                authorId: "user-2",
                authorName: "User Two",
            }),
            makeMarker({
                id: "mine",
                trackId: "track-1",
                timeMs: 2000,
                label: "Mine",
                note: "Private but mine",
                shared: false,
            }),
            makeMarker({
                id: "other-private",
                trackId: "track-1",
                timeMs: 1000,
                label: "Hidden",
                note: "Should be hidden",
                shared: false,
                authorId: "user-9",
                authorName: "Other User",
            }),
        ]);

        expect(controller.getSnapshot().isLoading).toBe(false);
        expect(controller.getSnapshot().markers.map((marker) => marker.id)).toEqual([
            "mine",
            "shared-marker",
        ]);

        disconnect();
    });

    it("keeps create optimistic state and reconciles snapshot data without duplicating markers", async () => {
        const repository = new FakeMarkerRepository({
            autoEmitOnSubscribe: false,
        });
        const deferredCreate = repository.deferNextCreate("server-marker-1");
        const controller = createMarkersController({
            trackId: "track-1",
            currentUser: CURRENT_USER,
            repository,
            now: () => "2026-04-04T15:45:00.000Z",
        });

        const disconnect = controller.connect();
        repository.emitSnapshot([]);

        const createPromise = controller.createMarker({
            timeMs: 4000,
            label: "Entrada",
            note: "Todos juntos",
            category: "cue",
            shared: true,
        });

        expect(controller.getSnapshot().markers).toHaveLength(1);
        expect(controller.getSnapshot().markers[0]).toEqual(expect.objectContaining({
            id: "optimistic-marker-1",
            label: "Entrada",
        }));

        repository.emitSnapshot([
            makeMarker({
                id: "server-marker-1",
                trackId: "track-1",
                timeMs: 4000,
                label: "Entrada",
                note: "Todos juntos",
                category: "cue",
                shared: true,
            }),
        ]);

        expect(controller.getSnapshot().markers).toHaveLength(1);
        expect(controller.getSnapshot().markers[0].id).toBe("server-marker-1");

        deferredCreate.resolve("server-marker-1");
        await createPromise;

        expect(controller.getSnapshot().markers).toHaveLength(1);
        expect(controller.getSnapshot().error).toBeNull();

        disconnect();
    });

    it("applies optimistic updates and rolls back on repository failure", async () => {
        const repository = new FakeMarkerRepository({
            autoEmitOnSubscribe: false,
        });
        const deferredUpdate = repository.deferNextUpdate();
        const controller = createMarkersController({
            trackId: "track-1",
            currentUser: CURRENT_USER,
            repository,
        });

        const disconnect = controller.connect();
        repository.emitSnapshot([
            makeMarker({
                id: "marker-1",
                trackId: "track-1",
                timeMs: 2500,
                label: "Original",
                note: "Nota original",
                shared: true,
            }),
        ]);

        const updatePromise = controller.updateMarker("marker-1", {
            label: "Actualizada",
            note: "Nueva nota",
        });

        expect(controller.getSnapshot().markers[0]).toEqual(expect.objectContaining({
            label: "Actualizada",
            note: "Nueva nota",
        }));

        deferredUpdate.reject(new Error("update failed"));
        await updatePromise;

        expect(controller.getSnapshot().error?.message).toBe("update failed");
        expect(controller.getSnapshot().markers[0]).toEqual(expect.objectContaining({
            label: "Original",
            note: "Nota original",
        }));

        disconnect();
    });

    it("hides markers optimistically on delete and keeps them removed after snapshot reconciliation", async () => {
        const repository = new FakeMarkerRepository({
            autoEmitOnSubscribe: false,
        });
        const deferredDelete = repository.deferNextDelete();
        const controller = createMarkersController({
            trackId: "track-1",
            currentUser: CURRENT_USER,
            repository,
        });

        const disconnect = controller.connect();
        repository.emitSnapshot([
            makeMarker({
                id: "marker-1",
                trackId: "track-1",
                timeMs: 1500,
                label: "Borrar",
                note: "Se va",
                shared: true,
            }),
        ]);

        const deletePromise = controller.deleteMarker("marker-1");

        expect(controller.getSnapshot().markers).toEqual([]);

        repository.emitSnapshot([]);
        deferredDelete.resolve();
        await deletePromise;

        expect(controller.getSnapshot().markers).toEqual([]);
        expect(controller.getSnapshot().error).toBeNull();

        disconnect();
    });
});

function makeMarker(overrides: Partial<Marker> & Pick<Marker, "id" | "trackId" | "timeMs" | "label" | "note" | "shared">): Marker {
    return {
        id: overrides.id,
        trackId: overrides.trackId,
        timeMs: overrides.timeMs,
        label: overrides.label,
        note: overrides.note,
        category: overrides.category ?? "general",
        shared: overrides.shared,
        authorId: overrides.authorId ?? CURRENT_USER.id,
        authorName: overrides.authorName ?? CURRENT_USER.name,
        authorColor: overrides.authorColor ?? CURRENT_USER.color,
        createdAt: overrides.createdAt ?? "2026-04-04T15:00:00.000Z",
        updatedAt: overrides.updatedAt ?? "2026-04-04T15:00:00.000Z",
        deleted: overrides.deleted ?? false,
        deletedAt: overrides.deletedAt ?? null,
        deletedBy: overrides.deletedBy ?? null,
    };
}
