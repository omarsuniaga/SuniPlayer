# SuniPlayer — iPad / iOS Notes

## Target Device
- Primary: iPad (all modern models, iPadOS 16+)
- Secondary: iPhone

## Key iOS Configurations
- `UIBackgroundModes: audio` — audio continues when iPad screen locks
- `supportsTablet: true` — enables split-view and iPad-optimized layout
- `requireFullScreen: false` — allows iOS split-view multitasking

## File Access
Files imported via `expo-document-picker` (opens Files app).
Copied to app's `documentDirectory` (iCloud-backed, persistent).

## Distribution
- Development: Expo Go or `npx expo run:ios`
- TestFlight: `eas build --platform ios`
- App Store: `eas submit --platform ios`
