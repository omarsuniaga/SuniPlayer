export interface CollaborationFeatureFlags {
    collabMarkers: boolean;
    scoreAnnotations: boolean;
}

export const collaborationFeatureFlags: CollaborationFeatureFlags = {
    collabMarkers: false,
    scoreAnnotations: false,
};

export function isCollabMarkersEnabled(flags: CollaborationFeatureFlags = collaborationFeatureFlags): boolean {
    return flags.collabMarkers;
}

export function isScoreAnnotationsEnabled(flags: CollaborationFeatureFlags = collaborationFeatureFlags): boolean {
    return flags.scoreAnnotations;
}
