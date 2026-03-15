import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initPlatform } from '../src/platform';
import { useKeyboardPedal } from '../src/hooks/useKeyboardPedal';

export default function RootLayout() {
  useKeyboardPedal(); // mount once — global pedal dispatch

  useEffect(() => {
    initPlatform().catch(console.error);
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
