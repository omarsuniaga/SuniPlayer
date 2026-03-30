import { useLibraryStore } from "../store/useLibraryStore";

/**
 * AnalyticsService — Tracks track performance and calculates affinity scores.
 */
export const AnalyticsService = {
  /**
   * Called when a track starts playing.
   */
  trackStart: (trackId: string) => {
    const { updateTrack, customTracks } = useLibraryStore.getState();
    const track = customTracks.find((t) => t.id === trackId);
    if (!track) return;

    updateTrack(trackId, {
      playCount: (track.playCount || 0) + 1,
      lastPlayedAt: new Date().toISOString(),
    });
  },

  /**
   * Called when a track finishes naturally.
   */
  trackEnd: (trackId: string, positionMs: number) => {
    const { updateTrack, customTracks } = useLibraryStore.getState();
    const track = customTracks.find((t) => t.id === trackId);
    if (!track) return;

    const newCompletePlays = (track.completePlays || 0) + 1;
    const newSkips = track.skips || 0;
    const newAffinityScore = AnalyticsService.calculateAffinityScore(newCompletePlays, newSkips);

    updateTrack(trackId, {
      completePlays: newCompletePlays,
      affinityScore: newAffinityScore,
      totalPlayTimeMs: (track.totalPlayTimeMs || 0) + positionMs,
    });
  },

  /**
   * Called when a track is skipped before finishing.
   */
  trackSkip: (trackId: string, positionMs: number) => {
    const { updateTrack, customTracks } = useLibraryStore.getState();
    const track = customTracks.find((t) => t.id === trackId);
    if (!track) return;

    const newCompletePlays = track.completePlays || 0;
    const newSkips = (track.skips || 0) + 1;
    const newAffinityScore = AnalyticsService.calculateAffinityScore(newCompletePlays, newSkips);

    updateTrack(trackId, {
      skips: newSkips,
      affinityScore: newAffinityScore,
      totalPlayTimeMs: (track.totalPlayTimeMs || 0) + positionMs,
    });
  },

  /**
   * Calculates affinity score (0-100) based on play/skip ratio.
   * Uses Laplace smoothing to avoid extreme swings on first plays.
   */
  calculateAffinityScore: (completePlays: number, skips: number): number => {
    const total = completePlays + skips;
    if (total === 0) return 50;
    return Math.round(((completePlays + 1) / (total + 2)) * 100);
  },
};
