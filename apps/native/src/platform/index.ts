import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStorage } from '@suniplayer/core';
import { ExpoAudioEngine } from './ExpoAudioEngine';
import { SQLiteStorage } from './SQLiteStorage';
import { LocalFileAccess } from './LocalFileAccess';

// Configure Zustand stores to use AsyncStorage (replaces browser localStorage)
configureStorage(AsyncStorage);

// Singletons — one instance per app session
export const audioEngine = new ExpoAudioEngine();
export const storage = new SQLiteStorage();
export const fileAccess = new LocalFileAccess();

// Initialize storage DB tables on app startup
export async function initPlatform(): Promise<void> {
  await storage.init();
}
