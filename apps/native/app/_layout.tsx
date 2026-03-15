import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initPlatform } from '../src/platform';

export default function RootLayout() {
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
