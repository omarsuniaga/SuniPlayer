import { describe, expect, it } from "vitest";

import type { Marker } from "../../../../types/marker";
import {
    resolveMarkerEditorFormState,
    resolveMarkerEditorNavigation,
} from "./MarkerEditor";

const baseMarker: Marker = {
    id: "marker-1",
    trackId: "track-1",
    timeMs: 12500,
    label: "Intro",
    note: "Entrada suave",
    category: "cue",
    shared: true,
    authorId: "user-1",
    authorName: "Ana",
    authorColor: "#06b6d4",
    createdAt: "2026-04-04T00:00:00.000Z",
    updatedAt: "2026-04-04T00:00:00.000Z",
    deleted: false,
    deletedAt: null,
    deletedBy: null,
};

describe("MarkerEditor", () => {
    it("derives stable initial collaborative form state", () => {
        expect(resolveMarkerEditorFormState(baseMarker)).toEqual({
            label: "Intro",
            note: "Entrada suave",
            category: "cue",
            shared: true,
        });

        expect(resolveMarkerEditorFormState({
            note: "Solo comentario",
        })).toEqual({
            label: "Solo comentario",
            note: "Solo comentario",
            category: "general",
            shared: true,
        });
    });

    it("resolves previous and next collaborative markers deterministically", () => {
        const secondMarker: Marker = {
            ...baseMarker,
            id: "marker-2",
            timeMs: 25000,
            label: "Puente",
        };
        const thirdMarker: Marker = {
            ...baseMarker,
            id: "marker-3",
            timeMs: 5000,
            label: "Cuenta",
        };

        expect(resolveMarkerEditorNavigation([baseMarker, secondMarker, thirdMarker], baseMarker.id)).toEqual({
            previousMarker: thirdMarker,
            nextMarker: secondMarker,
        });
        expect(resolveMarkerEditorNavigation([baseMarker, secondMarker], undefined)).toEqual({
            previousMarker: null,
            nextMarker: null,
        });
    });
});
