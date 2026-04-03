import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from './src/services/TrackPlayerService';

// Register the background playback service before Expo Router mounts.
// This is required for audio to continue when the iPad screen locks.
TrackPlayer.registerPlaybackService(() => PlaybackService);

// Expo Router handles the root component automatically.
import 'expo-router/entry';
