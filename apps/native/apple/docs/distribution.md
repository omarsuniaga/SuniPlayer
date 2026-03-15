# Building for iPad — Distribution Guide

## Quick Start (Development)

```bash
# Run on Expo Go (fastest iteration)
cd apps/native
npx expo start

# Run on iOS Simulator (requires macOS + Xcode 15+)
npx expo run:ios

# Run on connected iPad (requires Apple Developer account)
npx expo run:ios --device
```

## TestFlight Distribution

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Build for TestFlight
eas build --platform ios --profile preview

# Submit to TestFlight
eas submit --platform ios
```

## App Store

1. Bump version in `app.json`
2. `eas build --platform ios --profile production`
3. `eas submit --platform ios`

## Requirements

- Apple Developer Program ($99/year) — https://developer.apple.com/programs/
- App Store Connect record created
- Bundle ID: `com.suniplayer.app` (matches app.json)

## Background Audio

The `UIBackgroundModes: ["audio"]` key in `app.json` infoPlist enables audio
to continue when the iPad screen locks. This is required for live performance.
