import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * PlaybackService — runs in a background thread on iOS/Android.
 * Handles lock screen controls and remote control events.
 * MUST be registered via TrackPlayer.registerPlaybackService() at app entry.
 *
 * Enables audio to continue when the iPad screen locks — critical for live performance.
 */
export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }: { position: number }) => {
    TrackPlayer.seekTo(position);
  });
  TrackPlayer.addEventListener(Event.RemoteJumpForward, async ({ interval }: { interval: number }) => {
    const { position } = await TrackPlayer.getProgress();
    TrackPlayer.seekTo(position + interval);
  });
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async ({ interval }: { interval: number }) => {
    const { position } = await TrackPlayer.getProgress();
    TrackPlayer.seekTo(Math.max(0, position - interval));
  });
}
