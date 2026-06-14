import { describe, expect, it } from "vitest";

import { DEFAULT_MARKER_TIMESTAMP } from "../markerDefaults";
import {
    mapFirestoreMarkerDocument,
    serializeCreateMarker,
    serializeSoftDeleteMarker,
    serializeUpdateMarker,
    type TimestampLike,
} from "./markerFirestoreMapper";

const timestampLike: TimestampLike = {
    toDate() {
        return new Date("2026-04-04T16:10:00.000Z");
    },
};

describe("markerFirestoreMapper", () => {
    it("maps Firestore documents into the domain marker contract", () => {
        const marker = mapFirestoreMarkerDocument("marker-1", {
            trackId: "track-1",
            timeMs: 1200,
            label: "Entrada",
            note: "Entrada del coro",
            category: "cue",
            shared: false,
            authorId: "user-1",
            authorName: "Lola",
            authorColor: "#38bdf8",
            createdAt: timestampLike,
            updatedAt: "2026-04-04T16:11:00.000Z",
            deleted: true,
            deletedAt: new Date("2026-04-04T16:12:00.000Z"),
            deletedBy: "user-2",
        });

        expect(marker).toEqual({
            id: "marker-1",
            trackId: "track-1",
            timeMs: 1200,
            label: "Entrada",
            note: "Entrada del coro",
            category: "cue",
            shared: false,
            authorId: "user-1",
            authorName: "Lola",
            authorColor: "#38bdf8",
            createdAt: "2026-04-04T16:10:00.000Z",
            updatedAt: "2026-04-04T16:11:00.000Z",
            deleted: true,
            deletedAt: "2026-04-04T16:12:00.000Z",
            deletedBy: "user-2",
        });
    });

    it("hardens malformed Firestore data with stable defaults or null", () => {
        expect(mapFirestoreMarkerDocument("missing-track", {
            timeMs: 100,
        })).toBeNull();

        expect(mapFirestoreMarkerDocument("marker-2", {
            trackId: "track-2",
            timeMs: 900,
            category: "invalid-category",
            shared: "not-boolean",
            authorId: null,
            authorName: 42,
            authorColor: {},
            createdAt: undefined,
            updatedAt: undefined,
            deleted: "false",
        })).toEqual({
            id: "marker-2",
            trackId: "track-2",
            timeMs: 900,
            label: "",
            note: "",
            category: "general",
            shared: true,
            authorId: "legacy",
            authorName: "Legacy Marker",
            authorColor: "#94a3b8",
            createdAt: DEFAULT_MARKER_TIMESTAMP,
            updatedAt: DEFAULT_MARKER_TIMESTAMP,
            deleted: false,
            deletedAt: null,
            deletedBy: null,
        });
    });

    it("serializes create, update and soft-delete payloads without leaking UI shape", () => {
        const timestampToken = { __type: "server-timestamp" };

        expect(serializeCreateMarker({
            trackId: "track-3",
            timeMs: 5000,
            label: "Solo",
            note: "Entrar con metrónomo",
            category: "section",
            shared: true,
            author: {
                id: "user-9",
                name: "Ari",
                color: "#f97316",
            },
        }, {
            timestamp: timestampToken,
        })).toEqual({
            trackId: "track-3",
            timeMs: 5000,
            label: "Solo",
            note: "Entrar con metrónomo",
            category: "section",
            shared: true,
            authorId: "user-9",
            authorName: "Ari",
            authorColor: "#f97316",
            createdAt: timestampToken,
            updatedAt: timestampToken,
            deleted: false,
            deletedAt: null,
            deletedBy: null,
        });

        expect(serializeUpdateMarker({
            label: "Solo B",
            shared: false,
        }, {
            timestamp: timestampToken,
        })).toEqual({
            label: "Solo B",
            shared: false,
            updatedAt: timestampToken,
        });

        expect(serializeSoftDeleteMarker({
            deletedBy: "user-9",
            timestamp: timestampToken,
        })).toEqual({
            deleted: true,
            deletedAt: timestampToken,
            deletedBy: "user-9",
            updatedAt: timestampToken,
        });
    });
});
