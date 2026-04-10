import { describe, expect, it } from "vitest";

import { resolveMarkerLayerMode } from "./MarkerLayer";

describe("MarkerLayer feature flag wiring", () => {
    it("defaults to legacy mode when collaborative markers are disabled", () => {
        expect(resolveMarkerLayerMode()).toBe("legacy");
        expect(resolveMarkerLayerMode({
            collabMarkers: false,
            scoreAnnotations: false,
        })).toBe("legacy");
    });

    it("switches the marker layer mode when collaborative markers are enabled", () => {
        expect(resolveMarkerLayerMode({
            collabMarkers: true,
            scoreAnnotations: false,
        })).toBe("collaborative");
    });
});
