import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initPlatform } from '../src/platform';
import { useKeyboardPedal } from '../src/hooks/useKeyboardPedal';

export default function RootLayout() {
  useKeyboardPedal(); // mount once — global pedal dispatch

  useEffect(() => {
    initPlatform().catch(console.error);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
