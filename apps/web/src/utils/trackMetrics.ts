import type { Track } from "@suniplayer/core";

export const sumTrackDurationMs = (tracks: Track[]): number =>
    tracks.reduce((total, track) => total + track.duration_ms, 0);

export const sumTrackDurationSeconds = (tracks: Track[]): number =>
    Math.floor(sumTrackDurationMs(tracks) / 1000);
