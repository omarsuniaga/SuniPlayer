import { describe, expect, it } from "vitest";

import {
    collaborationFeatureFlags,
    isCollabMarkersEnabled,
    isScoreAnnotationsEnabled,
} from "./featureFlags";

describe("featureFlags", () => {
    it("defaults collaborative rollout flags to disabled", () => {
        expect(collaborationFeatureFlags).toEqual({
            collabMarkers: false,
            scoreAnnotations: false,
        });
    });

    it("reports feature availability from the provided flags", () => {
        expect(isCollabMarkersEnabled()).toBe(false);
        expect(isScoreAnnotationsEnabled()).toBe(false);
        expect(isCollabMarkersEnabled({ collabMarkers: true, scoreAnnotations: false })).toBe(true);
        expect(isScoreAnnotationsEnabled({ collabMarkers: false, scoreAnnotations: true })).toBe(true);
    });
});
